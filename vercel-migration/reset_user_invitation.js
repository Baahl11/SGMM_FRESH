/**
 * Reset user and resend invitation
 * This script:
 * 1. Deletes the user's account
 * 2. Cancels the old invitation
 * 3. Creates a new invitation
 * 4. Returns the new signup URL
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const USER_EMAIL = 'umepuebla@gmail.com'; // Change this to the user's email

async function resetUser() {
  console.log(`🔄 Resetting user: ${USER_EMAIL}\n`);

  try {
    // 1. Find user by email
    console.log('🔍 Looking for user...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
      return;
    }

    const user = users.find(u => u.email === USER_EMAIL);
    
    if (!user) {
      console.log('⚠️ User not found in auth.users');
    } else {
      console.log(`✅ Found user: ${user.id}`);
      
      // 2. Delete user account (this will cascade delete user_profile and related data)
      console.log('\n🗑️ Deleting user account...');
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (deleteError) {
        console.error('❌ Error deleting user:', deleteError);
        return;
      }
      
      console.log('✅ User account deleted');
    }

    // 3. Cancel old invitations
    console.log('\n🚫 Cancelling old invitations...');
    const { error: cancelError } = await supabase
      .from('invitations')
      .update({ status: 'cancelled' })
      .eq('email', USER_EMAIL)
      .in('status', ['pending', 'accepted']);
    
    if (cancelError) {
      console.error('❌ Error cancelling invitations:', cancelError);
    } else {
      console.log('✅ Old invitations cancelled');
    }

    // 4. Get admin user ID
    console.log('\n🔍 Getting admin user...');
    const { data: adminProfile, error: adminError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('role', 'admin')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();
    
    if (adminError || !adminProfile) {
      console.error('❌ Admin not found:', adminError);
      return;
    }

    const adminUserId = adminProfile.user_id;
    console.log(`✅ Admin user: ${adminUserId}`);

    // 5. Create new invitation
    console.log('\n📧 Creating new invitation...');
    
    // Generate secure token
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const { data: newInvitation, error: invError } = await supabase
      .from('invitations')
      .insert({
        email: USER_EMAIL,
        name: 'Dra. Melissa Lopez', // Update this with the user's name
        token: token,
        invited_by: adminUserId,
        status: 'pending',
        plan_type: 'premium',
        expires_at: expiresAt.toISOString(),
        notes: 'Re-sent after RLS migration - fresh start',
      })
      .select()
      .single();
    
    if (invError) {
      console.error('❌ Error creating invitation:', invError);
      return;
    }

    const signupUrl = `${supabaseUrl.replace('https://sbwpqtrxhiuucwlbozet.supabase.co', 'https://agendamedpro.com')}/signup/${token}`;

    console.log('\n✅ New invitation created!');
    console.log('\n📋 Invitation Details:');
    console.log(`   ID: ${newInvitation.id}`);
    console.log(`   Email: ${newInvitation.email}`);
    console.log(`   Name: ${newInvitation.name}`);
    console.log(`   Expires: ${newInvitation.expires_at}`);
    console.log(`\n🔗 Signup URL:`);
    console.log(`   ${signupUrl}`);
    console.log('\n📱 Send this link to the user via WhatsApp/Email\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

resetUser();
