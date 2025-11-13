import path from 'path';
import { config as loadEnv } from 'dotenv';
import * as readline from 'readline';

const envPath = path.resolve(process.cwd(), '.env.production');
loadEnv({ path: envPath });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('🚀 Configurador de SMTP para Invitaciones de Equipo\n');
  console.log('Este script configurará tu correo personal para enviar invitaciones.\n');

  const [{ supabaseAdmin }] = await Promise.all([
    import('@/lib/supabase/server')
  ]);

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing. Make sure .env.production is present.');
  }

  // Detectar usuario actual
  console.log('📋 Paso 1: Identificar tu cuenta...\n');
  const userEmail = await question('Ingresa tu email de usuario en la app: ');

  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (userError) {
    throw new Error(`Error buscando usuarios: ${userError.message}`);
  }

  const user = userData.users.find(u => u.email?.toLowerCase() === userEmail.toLowerCase());
  
  if (!user) {
    throw new Error(`No se encontró usuario con email: ${userEmail}`);
  }

  console.log(`✅ Usuario encontrado: ${user.id}\n`);

  // Configurar SMTP
  console.log('📧 Paso 2: Configurar SMTP\n');
  console.log('Selecciona tu proveedor de email:');
  console.log('1. Gmail');
  console.log('2. Outlook/Hotmail');
  console.log('3. Otro (manual)\n');

  const providerChoice = await question('Opción (1-3): ');

  let smtpConfig = {
    smtp_host: '',
    smtp_port: 587,
    smtp_secure: false,
    from_email: userEmail,
    smtp_user: userEmail,
    smtp_password: '',
    from_name: '',
    daily_email_limit: 500
  };

  if (providerChoice === '1') {
    smtpConfig.smtp_host = 'smtp.gmail.com';
    smtpConfig.smtp_port = 587;
    smtpConfig.daily_email_limit = 500;
    console.log('\n📌 Gmail detectado:');
    console.log('   Host: smtp.gmail.com');
    console.log('   Puerto: 587');
    console.log('   Límite: 500 emails/día\n');
  } else if (providerChoice === '2') {
    smtpConfig.smtp_host = 'smtp-mail.outlook.com';
    smtpConfig.smtp_port = 587;
    smtpConfig.daily_email_limit = 300;
    console.log('\n📌 Outlook/Hotmail detectado:');
    console.log('   Host: smtp-mail.outlook.com');
    console.log('   Puerto: 587');
    console.log('   Límite: 300 emails/día\n');
  } else {
    smtpConfig.smtp_host = await question('Host SMTP: ');
    const portStr = await question('Puerto (default 587): ');
    smtpConfig.smtp_port = portStr ? parseInt(portStr) : 587;
    const limitStr = await question('Límite diario (default 500): ');
    smtpConfig.daily_email_limit = limitStr ? parseInt(limitStr) : 500;
  }

  smtpConfig.from_name = await question('\nNombre del remitente (ej: Dr. Juan - Clínica XYZ): ');
  
  console.log('\n⚠️  IMPORTANTE: Usa una CONTRASEÑA DE APLICACIÓN, no tu contraseña normal.');
  console.log('Gmail: https://myaccount.google.com/apppasswords');
  console.log('Outlook: https://account.microsoft.com/security\n');
  
  smtpConfig.smtp_password = await question('Contraseña de aplicación: ');

  if (!smtpConfig.smtp_password) {
    throw new Error('La contraseña de aplicación es requerida');
  }

  // Guardar en base de datos
  console.log('\n💾 Guardando configuración en base de datos...');

  const { data: existingConfig, error: fetchError } = await supabaseAdmin
    .from('email_configs')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error(`Error al buscar configuración: ${fetchError.message}`);
  }

  const configData = {
    user_id: user.id,
    ...smtpConfig,
    email_enabled: true,
    email_provider: providerChoice === '1' ? 'gmail' : providerChoice === '2' ? 'outlook' : 'custom',
    current_daily_usage: 0,
    use_resend_fallback: false
  };

  if (existingConfig) {
    const { error: updateError } = await supabaseAdmin
      .from('email_configs')
      .update(configData)
      .eq('user_id', user.id);

    if (updateError) {
      throw new Error(`Error al actualizar configuración: ${updateError.message}`);
    }
    console.log('✅ Configuración actualizada en base de datos');
  } else {
    const { error: insertError } = await supabaseAdmin
      .from('email_configs')
      .insert(configData);

    if (insertError) {
      throw new Error(`Error al insertar configuración: ${insertError.message}`);
    }
    console.log('✅ Configuración guardada en base de datos');
  }

  // Probar enviando un email de prueba
  console.log('\n🧪 Paso 3: Probar configuración');
  const shouldTest = await question('\n¿Enviar email de prueba? (s/n): ');

  if (shouldTest.toLowerCase() === 's') {
    const testEmail = await question('Email de destino para prueba: ');
    
    console.log('\n📧 Enviando email de prueba...');

    const { emailService } = await import('@/lib/email-service');

    const smtpTestConfig = {
      smtp_host: smtpConfig.smtp_host,
      smtp_port: smtpConfig.smtp_port,
      smtp_secure: smtpConfig.smtp_secure,
      smtp_user: smtpConfig.smtp_user,
      smtp_password: smtpConfig.smtp_password,
      from_email: smtpConfig.from_email,
      from_name: smtpConfig.from_name
    };

    try {
      const result = await emailService.sendViaSMTP(
        smtpTestConfig,
        testEmail,
        '🎉 Prueba de Configuración SMTP - AgendaMedPro',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">✅ ¡Configuración Exitosa!</h1>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                Tu configuración SMTP está funcionando correctamente.
              </p>
              <div style="background: #f0fdfa; border-left: 4px solid #14b8a6; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0; color: #0f766e; font-size: 14px;">
                  <strong>📧 Configuración:</strong><br>
                  Servidor: ${smtpConfig.smtp_host}<br>
                  Puerto: ${smtpConfig.smtp_port}<br>
                  Remitente: ${smtpConfig.from_email}
                </p>
              </div>
              <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px;">
                Ahora puedes enviar invitaciones de equipo sin problemas.
              </p>
            </div>
          </div>
        `,
        'Tu configuración SMTP está funcionando correctamente. Ahora puedes enviar invitaciones de equipo sin problemas.'
      );

      console.log('\n✅ Email de prueba enviado exitosamente!');
      console.log(`   Provider: ${result.provider}`);
      console.log(`   Message ID: ${result.messageId}`);
    } catch (emailError: any) {
      console.error('\n❌ Error al enviar email de prueba:', emailError.message);
      console.error('\nVerifica:');
      console.error('  1. Que la contraseña de aplicación sea correcta');
      console.error('  2. Que la verificación en 2 pasos esté activada');
      console.error('  3. Que el host y puerto sean correctos');
    }
  }

  console.log('\n🎉 Configuración completada!');
  console.log('\nPróximos pasos:');
  console.log('1. Ve a Dashboard → Ajustes → Equipo');
  console.log('2. Invita a un miembro del equipo');
  console.log('3. El email se enviará automáticamente usando tu configuración SMTP\n');

  rl.close();
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  rl.close();
  process.exit(1);
});
