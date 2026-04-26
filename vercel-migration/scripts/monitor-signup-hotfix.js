require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

function parseHoursArg() {
  const fromArgv = process.argv
    .slice(2)
    .find((arg) => arg.startsWith('--hours='));

  if (!fromArgv) {
    return 24;
  }

  const value = Number(fromArgv.split('=')[1]);
  return Number.isFinite(value) && value > 0 ? value : 24;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hours = parseHoursArg();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const [errorLogsQ, usersQ, profilesQ, subscriptionsQ, locationsQ] = await Promise.all([
    supabase
      .from('error_logs')
      .select('id, function_name, error_message, created_at, user_id')
      .eq('source', 'signup_trigger')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    supabase
      .from('user_profiles')
      .select('user_id, created_at')
      .gte('created_at', since),
    supabase
      .from('subscriptions')
      .select('user_id, created_at, status')
      .gte('created_at', since),
    supabase
      .from('locations')
      .select('user_id, created_at')
      .gte('created_at', since)
  ]);

  if (errorLogsQ.error) {
    throw new Error(`error_logs query failed: ${errorLogsQ.error.message}`);
  }
  if (usersQ.error) {
    throw new Error(`listUsers failed: ${usersQ.error.message}`);
  }
  if (profilesQ.error) {
    throw new Error(`user_profiles query failed: ${profilesQ.error.message}`);
  }
  if (subscriptionsQ.error) {
    throw new Error(`subscriptions query failed: ${subscriptionsQ.error.message}`);
  }
  if (locationsQ.error) {
    throw new Error(`locations query failed: ${locationsQ.error.message}`);
  }

  const recentUsers = (usersQ.data?.users || []).filter((u) => {
    if (!u.created_at) {
      return false;
    }
    return new Date(u.created_at).toISOString() >= since;
  });

  const report = {
    windowHours: hours,
    since,
    metrics: {
      recentAuthUsers: recentUsers.length,
      profileRowsCreated: profilesQ.data.length,
      subscriptionRowsCreated: subscriptionsQ.data.length,
      locationRowsCreated: locationsQ.data.length,
      signupTriggerErrors: errorLogsQ.data.length
    },
    status: errorLogsQ.data.length === 0 ? 'healthy' : 'degraded',
    latestErrors: errorLogsQ.data
  };

  console.log(JSON.stringify(report, null, 2));

  if (report.status !== 'healthy') {
    process.exit(2);
  }
}

main().catch((error) => {
  console.error('MONITOR_SIGNUP_HOTFIX_FAIL', error.message);
  process.exit(1);
});
