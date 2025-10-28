/**
 * Fix user profile for gm_melgarejo@hotmail.com
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixUserProfile() {
  console.log('🔧 Fixing user profile for gm_melgarejo@hotmail.com\n');

  // 1. Get user from auth
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error('❌ Error fetching users:', usersError);
    return;
  }

  const user = users.find(u => u.email === 'gm_melgarejo@hotmail.com');
  
  if (!user) {
    console.log('❌ User not found in auth.users');
    return;
  }

  console.log('✅ User found:', {
    id: user.id,
    email: user.email,
    created_at: user.created_at
  });

  // 2. Check if profile exists
  const { data: existingProfile, error: checkError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (existingProfile) {
    console.log('\n✅ User profile already exists:', existingProfile);
    return;
  }

  console.log('\n⚠️ User profile does NOT exist, creating...');

  // 3. Get invitation data
  const { data: invitation, error: invError } = await supabase
    .from('invitations')
    .select('*')
    .eq('email', 'gm_melgarejo@hotmail.com')
    .single();

  if (invError || !invitation) {
    console.error('❌ Invitation not found:', invError);
    return;
  }

  console.log('📧 Invitation found:', {
    name: invitation.name,
    email: invitation.email,
    plan_type: invitation.plan_type,
    status: invitation.status
  });

  // 4. Create user profile
  const { data: newProfile, error: createError } = await supabase
    .from('user_profiles')
    .insert({
      user_id: user.id,
      name: invitation.name,
      email: invitation.email,
      plan_type: invitation.plan_type || 'premium',
      role: 'user', // Regular user, NOT admin
    })
    .select()
    .single();

  if (createError) {
    console.error('❌ Error creating profile:', createError);
    return;
  }

  console.log('\n✅ User profile created successfully:', newProfile);

  // 5. Update invitation status
  const { error: updateError } = await supabase
    .from('invitations')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString()
    })
    .eq('id', invitation.id);

  if (updateError) {
    console.error('⚠️ Error updating invitation status:', updateError);
  } else {
    console.log('✅ Invitation marked as accepted');
  }

  console.log('\n🎉 All done! User profile fixed successfully.');
}

fixUserProfile().catch(console.error);
