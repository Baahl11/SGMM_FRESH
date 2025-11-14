import path from 'path';
import { config as loadEnv } from 'dotenv';
import * as fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.production');
loadEnv({ path: envPath });

async function main() {
  const [{ supabaseAdmin }] = await Promise.all([
    import('@/lib/supabase/server')
  ]);

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing');
  }

  console.log('🚀 Aplicando migración: allow_invitation_view_by_token\n');

  const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20251114_allow_invitation_view_by_token.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log('📄 SQL a ejecutar:');
  console.log('─'.repeat(80));
  console.log(sql);
  console.log('─'.repeat(80));
  console.log('');

  try {
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql_string: sql });
    
    if (error) {
      // Si exec_sql no existe, intentar ejecutar directamente
      console.log('⚠️  exec_sql no disponible, ejecutando con from...');
      
      // Ejecutar cada statement por separado
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));
      
      for (const statement of statements) {
        if (statement) {
          const { error: execError } = await (supabaseAdmin as any).rpc('exec', { sql: statement });
          if (execError) {
            console.error('❌ Error ejecutando statement:', execError);
            throw execError;
          }
        }
      }
      
      console.log('✅ Migración aplicada exitosamente (método alternativo)');
    } else {
      console.log('✅ Migración aplicada exitosamente');
      console.log('Resultado:', data);
    }
  } catch (err: any) {
    console.error('❌ Error al aplicar migración:', err.message);
    console.error('\n💡 Aplica la migración manualmente:');
    console.error('1. Ve a https://supabase.com/dashboard/project/[tu-proyecto]/editor/sql');
    console.error('2. Copia y pega el SQL de arriba');
    console.error('3. Ejecuta la query');
    process.exit(1);
  }

  console.log('\n🧪 Probando la nueva política...');
  
  // Crear un cliente anónimo (sin autenticación)
  const { createClient } = await import('@supabase/supabase-js');
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const testToken = '7a836104c140f073f44cae68b4ee70a9e772f68f52fd542d3e8dc59dac96c85f';
  const { data: invitation, error: queryError } = await anonClient
    .from('team_members')
    .select('*')
    .eq('invitation_token', testToken)
    .maybeSingle();

  if (queryError) {
    console.error('❌ Error en query de prueba:', queryError);
  } else if (invitation) {
    console.log('✅ ¡Política funcionando! Invitación visible sin autenticación:');
    console.log(`   Email: ${invitation.member_email}`);
    console.log(`   Rol: ${invitation.role}`);
    console.log(`   Status: ${invitation.status}`);
  } else {
    console.log('⚠️  No se encontró la invitación (puede que no exista o ya esté aceptada)');
  }
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
