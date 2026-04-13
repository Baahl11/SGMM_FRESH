/**
 * Check users in Supabase
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sbwpqtrxhiuucwlbozet.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY no está configurada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUsers() {
  try {
    console.log('🔍 Buscando usuarios en auth.users...\n');
    
    // Get all users from auth
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error getting auth users:', authError);
      return;
    }
    
    console.log(`📊 Total usuarios en auth: ${users.length}\n`);
    
    users.forEach((user, index) => {
      console.log(`👤 Usuario ${index + 1}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Confirmed: ${user.email_confirmed_at ? '✅' : '❌'}`);
      console.log(`   Last sign in: ${user.last_sign_in_at || 'Never'}`);
      console.log('');
    });
    
    // Check for specific email
    const targetEmail = 'gm_melgarejo@hotmail.com';
    const foundUser = users.find(u => u.email === targetEmail);
    
    if (foundUser) {
      console.log(`✅ Usuario ${targetEmail} encontrado!`);
      console.log(`   ID: ${foundUser.id}`);
      console.log(`   Confirmed: ${foundUser.email_confirmed_at ? '✅ Sí' : '❌ No'}`);
    } else {
      console.log(`❌ Usuario ${targetEmail} NO encontrado en auth.users`);
    }
    
    console.log('\n---\n');
    console.log('🔍 Verificando user_profiles...\n');
    
    // Check user_profiles table
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*');
    
    if (profileError) {
      console.error('❌ Error getting profiles:', profileError);
      return;
    }
    
    console.log(`📊 Total perfiles: ${profiles.length}\n`);
    
    profiles.forEach((profile, index) => {
      console.log(`👤 Perfil ${index + 1}:`);
      console.log(`   User ID: ${profile.user_id}`);
      console.log(`   Name: ${profile.name}`);
      console.log(`   Email: ${profile.email}`);
      console.log(`   Role: ${profile.role}`);
      console.log(`   Plan: ${profile.plan_type}`);
      console.log('');
    });
    
    // Check invitations
    console.log('---\n');
    console.log('🔍 Verificando invitaciones...\n');
    
    const { data: invitations, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (invError) {
      console.error('❌ Error getting invitations:', invError);
      return;
    }
    
    console.log(`📊 Total invitaciones: ${invitations.length}\n`);
    
    invitations.forEach((inv, index) => {
      console.log(`📧 Invitación ${index + 1}:`);
      console.log(`   Email: ${inv.email}`);
      console.log(`   Name: ${inv.name}`);
      console.log(`   Status: ${inv.status}`);
      console.log(`   Token: ${inv.token.substring(0, 20)}...`);
      console.log(`   Created: ${inv.created_at}`);
      console.log(`   Expires: ${inv.expires_at}`);
      console.log(`   Accepted: ${inv.accepted_at || 'No'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUsers();
