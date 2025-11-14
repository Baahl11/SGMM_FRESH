import path from 'path';
import { config as loadEnv } from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env.production');
loadEnv({ path: envPath });

async function main() {
  const token = process.argv[2];
  
  if (!token) {
    console.error('❌ Debes proporcionar un token como argumento');
    console.log('Uso: npm run check-token <token>');
    process.exit(1);
  }

  const [{ supabaseAdmin }] = await Promise.all([
    import('@/lib/supabase/server')
  ]);

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing');
  }

  console.log('🔍 Buscando invitación con token:', token.substring(0, 10) + '...\n');

  const { data: invitation, error } = await supabaseAdmin
    .from('team_members')
    .select('*')
    .eq('invitation_token', token)
    .maybeSingle();

  if (error) {
    console.error('❌ Error al buscar invitación:', error);
    process.exit(1);
  }

  if (!invitation) {
    console.log('❌ No se encontró ninguna invitación con ese token\n');
    
    // Buscar invitaciones recientes para comparar
    const { data: recentInvitations } = await supabaseAdmin
      .from('team_members')
      .select('id, member_email, role, status, invitation_token, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('📋 Últimas 5 invitaciones en la base de datos:');
    console.log('─'.repeat(80));
    recentInvitations?.forEach((inv, i) => {
      console.log(`${i + 1}. Email: ${inv.member_email}`);
      console.log(`   Token: ${inv.invitation_token?.substring(0, 20)}...`);
      console.log(`   Status: ${inv.status}`);
      console.log(`   Creado: ${inv.created_at}`);
      console.log('');
    });
    
    process.exit(1);
  }

  console.log('✅ Invitación encontrada:\n');
  console.log('─'.repeat(80));
  console.log(`📧 Email invitado: ${invitation.member_email}`);
  console.log(`👤 Rol: ${invitation.role}`);
  console.log(`📊 Status: ${invitation.status}`);
  console.log(`🔑 Owner ID: ${invitation.owner_user_id}`);
  console.log(`👥 Member ID: ${invitation.member_user_id || '(pendiente)'}`);
  console.log(`📅 Creado: ${invitation.created_at}`);
  console.log(`✅ Aceptado: ${invitation.accepted_at || '(pendiente)'}`);
  console.log(`🔐 Token (primeros 20 chars): ${invitation.invitation_token?.substring(0, 20)}...`);
  console.log('─'.repeat(80));

  if (invitation.status === 'active') {
    console.log('\n⚠️  Esta invitación ya fue aceptada');
  } else if (invitation.status === 'pending') {
    console.log('\n✅ Esta invitación está pendiente y válida para aceptar');
  }
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
