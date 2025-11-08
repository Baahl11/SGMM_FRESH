#!/usr/bin/env ts-node
import dotenv from 'dotenv';
import path from 'path';
import { getClient } from '@/lib/db';
import { encryptMessagingSecret } from '@/lib/crypto/messaging';
import type { MessagingProviderStatus, MessagingProviderType } from '@/types/messaging';

// Load .env.local first, then .env as fallback
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

type LegacyRow = {
  id: number;
  user_id: string;
  provider: string;
  credentials_encrypted: string;
  created_at: string;
  updated_at: string;
};

type ProviderMapping = {
  provider: MessagingProviderType;
  channel: 'sms' | 'whatsapp';
};

const PROVIDER_MAPPINGS: Record<string, ProviderMapping> = {
  twilio: { provider: 'twilio', channel: 'sms' },
  messagebird: { provider: 'messagebird', channel: 'sms' },
  plivo: { provider: 'plivo', channel: 'sms' },
  manual: { provider: 'twilio', channel: 'sms' },
  whatsapp: { provider: 'meta_whatsapp', channel: 'whatsapp' },
  meta_whatsapp: { provider: 'meta_whatsapp', channel: 'whatsapp' },
};

function getCipherKey(): string {
  const key = process.env.MESSAGING_CIPHER_KEY;
  if (!key) {
    throw new Error('Missing MESSAGING_CIPHER_KEY environment variable.');
  }
  return key.trim();
}

function parseLegacyPayload(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Skipping row with invalid JSON payload.');
    throw error;
  }
}

async function upsertMessagingProvider(client: Awaited<ReturnType<typeof getClient>>, args: {
  userId: string;
  channel: 'sms' | 'whatsapp';
  provider: MessagingProviderType;
  envelopeJson: string;
  createdAt: string;
  updatedAt: string;
}) {
  const status: MessagingProviderStatus = 'active';

  await client.query(
    `INSERT INTO messaging_providers
      (user_id, account_id, channel, provider, credentials_encrypted, config, status, last_synced_at, created_at, updated_at)
     VALUES ($1, NULL, $2, $3, $4, '{}'::jsonb, $5, NOW(), $6, $7)
     ON CONFLICT (user_id, channel)
     DO UPDATE SET
       provider = EXCLUDED.provider,
       credentials_encrypted = EXCLUDED.credentials_encrypted,
       status = EXCLUDED.status,
       updated_at = NOW()`,
    [
      args.userId,
      args.channel,
      args.provider,
      args.envelopeJson,
      status,
      args.createdAt,
      args.updatedAt,
    ]
  );
}

async function migrate() {
  console.log('▶ Starting migration of legacy SMS credentials');

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `SELECT id, user_id, provider, credentials_encrypted, created_at, updated_at
       FROM user_sms_credentials`
    );

    const legacyRows = rows as LegacyRow[];

    if (legacyRows.length === 0) {
      console.log('No legacy rows detected. Nothing to migrate.');
      await client.query('ROLLBACK');
      return;
    }

    const cipherKey = getCipherKey();
    console.log(`Cipher key loaded (${cipherKey.length} chars). Processing ${legacyRows.length} rows...`);

    let migrated = 0;
    let skipped = 0;

    for (const row of legacyRows) {
      const mapping = PROVIDER_MAPPINGS[row.provider?.toLowerCase?.() ?? ''];

      if (!mapping) {
        console.warn(`Skipping user ${row.user_id}: unsupported provider '${row.provider}'.`);
        skipped += 1;
        continue;
      }

      let credentials: Record<string, unknown>;
      try {
        credentials = parseLegacyPayload(row.credentials_encrypted);
      } catch (error) {
        skipped += 1;
        continue;
      }

      try {
        const envelope = await encryptMessagingSecret(credentials, cipherKey);
        await upsertMessagingProvider(client, {
          userId: row.user_id,
          channel: mapping.channel,
          provider: mapping.provider,
          envelopeJson: JSON.stringify(envelope),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        });
        migrated += 1;
        console.log(`✓ Migrated credentials for user ${row.user_id} (${mapping.channel})`);
      } catch (error) {
        console.error(`⚠ Failed migrating user ${row.user_id}`, error);
        skipped += 1;
      }
    }

    await client.query('COMMIT');
    console.log('Migration complete', { total: legacyRows.length, migrated, skipped });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration script failed', error);
    process.exit(1);
  });
