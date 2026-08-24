import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import emailService from '@/lib/email-service';

// Initialize Supabase client with service role key for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Cron job to send trial expiration reminders
 * Should run daily to check for trials expiring in 2 days
 * 
 * Vercel Cron: Configure in vercel.json
 * Manual trigger: GET /api/cron/trial-reminders
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn('⚠️  Unauthorized cron attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Calculate target date: 2 days from now
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 2);
    targetDate.setHours(0, 0, 0, 0); // Start of day

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(0, 0, 0, 0); // Start of next day

    // Find all trials expiring in exactly 2 days
    const { data: expiringTrials, error: trialsError } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        id,
        user_id,
        plan_tier,
        trial_end
      `)
      .eq('status', 'trialing')
      .gte('trial_end', targetDate.toISOString())
      .lt('trial_end', nextDay.toISOString());

    if (trialsError) {
      console.error('❌ Error fetching trials:', trialsError);
      return NextResponse.json({ error: 'Database error', details: trialsError }, { status: 500 });
    }

    if (!expiringTrials || expiringTrials.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No trials to remind',
        count: 0 
      });
    }
    // Send reminder emails
    const results = [];
    for (const trial of expiringTrials) {
      try {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('email, name')
          .eq('id', trial.user_id)
          .maybeSingle();

        if (!user?.email) {
          throw new Error('No se encontro email para el usuario');
        }
        const userName = user.name || user.email?.split('@')[0] || 'Usuario';
        const planName = trial.plan_tier === 'enterprise' ? 'Enterprise' : 'Pro';
        const emailResult = await emailService.sendTrialExpirationReminder(
          user.email,
          userName,
          planName,
          2, // days remaining
          trial.trial_end
        );

        results.push({
          user_id: trial.user_id,
          email: user.email,
          success: emailResult.success,
          plan: trial.plan_tier
        });
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (emailError: any) {
        console.error(`❌ Error sending to ${trial.user_id}:`, emailError);
        results.push({
          user_id: trial.user_id,
          success: false,
          error: emailError.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    return NextResponse.json({
      success: true,
      message: `Sent ${successCount} trial reminders`,
      total: results.length,
      successful: successCount,
      failed: results.length - successCount,
      results
    });

  } catch (error: any) {
    console.error('❌ Cron job error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error.message 
      }, 
      { status: 500 }
    );
  }
}

// Also support POST for manual testing
export async function POST(request: NextRequest) {
  return GET(request);
}
