/**
 * GET /api/cron/messaging-worker
 * Processes pending messaging jobs
 * Should be called by Vercel Cron every minute
 */

import { NextRequest, NextResponse } from 'next/server';
import { runMessagingWorker } from '@/lib/workers/messaging-worker';

export const maxDuration = 60; // 60 seconds max
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron not configured' },
        { status: 500 }
      );
    }

    // Check authorization (Vercel Cron sends Bearer token)
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('Unauthorized cron request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Messaging Worker] Starting job processing...');
    const startTime = Date.now();

    // Run the worker
    const result = await runMessagingWorker();

    const duration = Date.now() - startTime;

    console.log(
      `[Messaging Worker] Completed in ${duration}ms`,
      JSON.stringify(result, null, 2)
    );

    return NextResponse.json({
      success: true,
      result,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Messaging Worker] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
