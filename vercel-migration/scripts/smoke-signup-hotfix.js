require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retry(label, fn, attempts = 3, delayMs = 2000) {
  let lastError;

  for (let i = 1; i <= attempts; i += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const isLast = i === attempts;

      if (!isLast) {
        console.warn(`${label}_RETRY_${i}`, error.message || String(error));
        await sleep(delayMs);
      }
    }
  }

  throw lastError;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const testEmail = `hotfix-smoke-${Date.now()}@example.com`;
  const testPassword = `Sgmm!${Date.now()}`;

  const createResult = await retry(
    'SMOKE_CREATE_USER',
    () =>
      supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: {
          name: 'Hotfix Smoke Test'
        }
      }),
    4,
    2500
  );

  if (createResult.error || !createResult.data?.user?.id) {
    throw new Error(`Failed to create smoke user: ${createResult.error?.message || 'unknown error'}`);
  }

  const userId = createResult.data.user.id;

  await sleep(1500);

  const profileQ = await supabase
    .from('user_profiles')
    .select('user_id, email, default_location_id')
    .eq('user_id', userId)
    .maybeSingle();

  const subscriptionQ = await supabase
    .from('subscriptions')
    .select('user_id, plan_tier, status')
    .eq('user_id', userId)
    .maybeSingle();

  const locationsQ = await supabase
    .from('locations')
    .select('id, user_id, nombre')
    .eq('user_id', userId);

  const errorLogsQ = await supabase
    .from('error_logs')
    .select('id, function_name, error_message, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  const summary = {
    userId,
    email: testEmail,
    profileExists: !!profileQ.data,
    subscriptionExists: !!subscriptionQ.data,
    locationCount: Array.isArray(locationsQ.data) ? locationsQ.data.length : 0,
    errorLogCount: Array.isArray(errorLogsQ.data) ? errorLogsQ.data.length : 0,
    profileError: profileQ.error?.message || null,
    subscriptionError: subscriptionQ.error?.message || null,
    locationsError: locationsQ.error?.message || null,
    errorLogsError: errorLogsQ.error?.message || null
  };

  console.log('SMOKE_SIGNUP_RESULT', JSON.stringify(summary, null, 2));

  const deleteResult = await retry(
    'SMOKE_DELETE_USER',
    () => supabase.auth.admin.deleteUser(userId),
    4,
    2000
  );
  if (deleteResult.error) {
    console.warn('SMOKE_DELETE_WARNING', deleteResult.error.message);
  } else {
    console.log('SMOKE_USER_DELETED', userId);
  }

  if (!summary.profileExists || !summary.subscriptionExists || summary.locationCount < 1) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('SMOKE_SIGNUP_FAIL', error.message);
  process.exit(1);
});
