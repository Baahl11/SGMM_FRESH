/**
 * Update admin account to Enterprise Lifetime
 * Run: node scripts/update-admin-to-lifetime.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ADMIN_EMAIL = 'gmelgarejom@gmail.com'; // Correct admin email

async function updateAdminAccount() {
  console.log('🔧 Updating admin account to Enterprise Lifetime...\n');

  let ADMIN_USER_ID;

  try {
    // 0. Get user ID from email
    console.log('Step 0: Finding user by email:', ADMIN_EMAIL);
    const { data: authData } = await supabase.auth.admin.listUsers();
    const user = authData?.users?.find(u => u.email === ADMIN_EMAIL);
    
    if (!user) {
      console.error('❌ User not found:', ADMIN_EMAIL);
      process.exit(1);
    }
    
    ADMIN_USER_ID = user.id;
    console.log('✅ Found user:', ADMIN_EMAIL);
    console.log('   User ID:', ADMIN_USER_ID);

    // 1. Delete all existing subscriptions for admin
    console.log('\nStep 1: Deleting existing subscriptions...');
    const { error: deleteError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', ADMIN_USER_ID);

    if (deleteError) {
      console.error('Error deleting old subscriptions:', deleteError);
    } else {
      console.log('✅ Old subscriptions deleted');
    }

    // 2. Create Lifetime Enterprise subscription
    console.log('\nStep 2: Creating Lifetime Enterprise subscription...');
    const { data, error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: ADMIN_USER_ID,
        stripe_customer_id: null,
        stripe_subscription_id: `admin_lifetime_${ADMIN_USER_ID}`,
        stripe_price_id: 'price_1SUsQzCpe9CE4d2lfkuw7S3T',
        plan_tier: 'enterprise',
        status: 'active',
        max_doctors: 999,
        max_locations: 999,
        features: ['all'],
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select();

    if (insertError) {
      console.error('❌ Error creating subscription:', insertError);
      process.exit(1);
    }

    console.log('✅ Subscription created:', data[0]);

    // 3. Verify
    console.log('\nStep 3: Verifying subscription...');
    const { data: verification } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', ADMIN_USER_ID)
      .single();

    console.log('\n📊 Final Subscription Status:');
    console.log('- Email:', ADMIN_EMAIL);
    console.log('- Plan:', verification.plan_tier);
    console.log('- Status:', verification.status);
    console.log('- Max Doctors:', verification.max_doctors);
    console.log('- Max Locations:', verification.max_locations);
    console.log('- Features:', verification.features);

    console.log('\n✅ Admin account successfully updated to Enterprise Lifetime!');
    console.log('\n⚠️  IMPORTANT: Close your session and log in again to see changes!');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

updateAdminAccount();

