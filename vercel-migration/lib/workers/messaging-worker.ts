/**
 * Messaging Worker
 * Processes pending messaging jobs and sends SMS via configured providers
 */

import { createClient } from '@supabase/supabase-js';
import { decryptMessagingSecret } from '@/lib/crypto/messaging';
import { createAdapter, type SupportedProvider } from '@/lib/messaging/adapters';
import type { MessagingJob, MessagingMessage, MessagingProvider, EncryptedSecretEnvelope } from '@/types/messaging';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ProcessingResult {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  errors: string[];
}

export class MessagingWorker {
  private maxBatchSize: number;

  constructor(maxBatchSize = 50) {
    this.maxBatchSize = maxBatchSize;
  }

  /**
   * Main entry point - processes pending jobs
   */
  async processJobs(): Promise<ProcessingResult> {
    const result: ProcessingResult = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    try {
      // Fetch pending jobs ordered by run_at
      const { data: jobs, error: jobsError } = await supabase
        .from('messaging_jobs')
        .select('*')
        .eq('status', 'pending')
        .lte('run_at', new Date().toISOString())
        .order('run_at', { ascending: true })
        .limit(this.maxBatchSize);

      if (jobsError) {
        result.errors.push(`Failed to fetch jobs: ${jobsError.message}`);
        return result;
      }

      if (!jobs || jobs.length === 0) {
        return result; // No jobs to process
      }

      // Process each job
      for (const job of jobs) {
        try {
          const outcome = await this.processJob(job as MessagingJob);
          if (outcome === 'skipped') {
            result.skipped++;
          } else {
            result.processed++;
            result.succeeded++;
          }
        } catch (error: any) {
          result.processed++;
          result.failed++;
          result.errors.push(`Job ${job.id}: ${error.message}`);
          console.error(`Error processing job ${job.id}:`, error);
        }
      }

      return result;
    } catch (error: any) {
      result.errors.push(`Worker error: ${error.message}`);
      return result;
    }
  }

  /**
   * Reclama un job de forma atomica: solo pasa a 'processing' si sigue
   * 'pending'. Devuelve false si otro worker ya lo tomo primero.
   */
  private async claimJob(jobId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('messaging_jobs')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', jobId)
      .eq('status', 'pending')
      .select();

    if (error) {
      throw new Error(`Failed to claim job ${jobId}: ${error.message}`);
    }

    return Boolean(data && data.length > 0);
  }

  /**
   * Process a single messaging job
   */
  private async processJob(job: MessagingJob): Promise<'processed' | 'skipped'> {
    const claimed = await this.claimJob(job.id);
    if (!claimed) {
      return 'skipped';
    }

    try {
      // Get the message
      const { data: message, error: messageError } = await supabase
        .from('messaging_messages')
        .select('*')
        .eq('id', job.message_id)
        .single();

      if (messageError || !message) {
        throw new Error(`Message not found: ${job.message_id}`);
      }

      const msg = message as MessagingMessage;

      // Get the provider credentials
      const { data: provider, error: providerError } = await supabase
        .from('messaging_providers')
        .select('*')
        .eq('user_id', msg.user_id)
        .eq('channel', msg.channel)
        .eq('status', 'active')
        .single();

      if (providerError || !provider) {
        throw new Error(`No active provider found for channel: ${msg.channel}`);
      }

      const prov = provider as MessagingProvider;

      // Decrypt credentials
      const credentials = await this.decryptCredentials(
        prov.credentials_encrypted
      );

      // Create adapter and send message
      const adapter = createAdapter(
        prov.provider as SupportedProvider,
        credentials
      );

      const destination = msg.to_contact?.phone || msg.to_contact?.email;
      if (!destination) {
        throw new Error('Mensaje sin destino (phone o email)');
      }

      const sendResult = await adapter.send({
        to: destination,
        message: msg.body || '',
      });

      if (sendResult.success) {
        // Update message as sent
        await supabase
          .from('messaging_messages')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            provider_message_id: sendResult.messageId,
            payload: {
              ...(message.payload || {}),
              provider_response: sendResult.rawResponse,
            },
          })
          .eq('id', job.message_id);

        // Mark job as completed
        await supabase
          .from('messaging_jobs')
          .update({
            status: 'done',
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id);

        return 'processed';
      } else {
        throw new Error(sendResult.error || 'Unknown send error');
      }
    } catch (error: any) {
      // Update message as failed
      await supabase
        .from('messaging_messages')
        .update({
          status: 'failed',
          error_message: error.message,
          failed_at: new Date().toISOString(),
        })
        .eq('id', job.message_id);

      // Check if we should retry
      const shouldRetry = job.attempts < 3;

      if (shouldRetry) {
        // Schedule retry with exponential backoff
        const retryDelay = Math.min(300, 60 * Math.pow(2, job.attempts)); // Max 5 minutes
        const nextAttempt = new Date(Date.now() + retryDelay * 1000);

        await supabase
          .from('messaging_jobs')
          .update({
            status: 'pending',
            attempts: job.attempts + 1,
            run_at: nextAttempt.toISOString(),
            last_error: error.message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id);
      } else {
        // Max retries reached
        await supabase
          .from('messaging_jobs')
          .update({
            status: 'failed',
            last_error: error.message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id);
      }

      throw error;
    }
  }

  /**
   * Decrypt provider credentials
   */
  private async decryptCredentials(encryptedData: string | EncryptedSecretEnvelope): Promise<any> {
    const cipherKey = process.env.MESSAGING_CIPHER_KEY;
    if (!cipherKey) {
      throw new Error('MESSAGING_CIPHER_KEY not configured');
    }

    // If it's a string, parse it
    const envelope = typeof encryptedData === 'string' 
      ? JSON.parse(encryptedData) 
      : encryptedData;

    const decrypted = await decryptMessagingSecret(envelope, cipherKey);
    return decrypted;
  }
}

/**
 * Standalone function to run the worker
 */
export async function runMessagingWorker(): Promise<ProcessingResult> {
  const worker = new MessagingWorker();
  return await worker.processJobs();
}
