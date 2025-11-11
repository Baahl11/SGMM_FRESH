/**
 * Test endpoint - No encryption
 * GET /api/test/messaging-config
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ 
        error: 'No autenticado',
        details: authError?.message 
      }, { status: 401 });
    }

    // Check environment variables
    const hasKey = !!process.env.MESSAGING_CIPHER_KEY;
    const hasPostgres = !!(
      process.env.POSTGRES_HOST &&
      process.env.POSTGRES_USER &&
      process.env.POSTGRES_PASSWORD
    );

    // Try to query the table
    const { data, error: queryError } = await supabase
      .from('messaging_providers')
      .select('id, provider, status, created_at')
      .eq('user_id', user.id)
      .eq('channel', 'sms');

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
      config: {
        hasMessagingKey: hasKey,
        hasPostgresVars: hasPostgres,
      },
      providers: data || [],
      queryError: queryError?.message || null,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Error interno',
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
    }, { status: 500 });
  }
}
