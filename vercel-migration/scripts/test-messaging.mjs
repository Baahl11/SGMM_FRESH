/**
 * Test Messaging System
 * Usage: node scripts/test-messaging.mjs
 * Requires: Node.js v18+
 */

import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function testMessaging() {
  console.log('\n🧪 SGMM Messaging System - Test Script\n');
  console.log('='.repeat(50));
  
  // Get configuration
  const baseUrl = await ask('URL base (default: http://localhost:3000): ') || 'http://localhost:3000';
  console.log('\n📋 Opciones:');
  console.log('1. Configurar credenciales SMS (Twilio/MessageBird/Plivo)');
  console.log('2. Enviar mensaje de prueba');
  console.log('3. Ver mensajes recientes');
  console.log('4. Ejecutar worker manualmente\n');
  
  const option = await ask('Selecciona una opción (1-4): ');
  
  switch(option) {
    case '1':
      await configureCredentials(baseUrl);
      break;
    case '2':
      await sendTestMessage(baseUrl);
      break;
    case '3':
      await viewMessages(baseUrl);
      break;
    case '4':
      await runWorker(baseUrl);
      break;
    default:
      console.log('❌ Opción inválida');
  }
  
  rl.close();
}

async function configureCredentials(baseUrl) {
  console.log('\n📝 Configurar Credenciales SMS\n');
  
  const provider = await ask('Provider (twilio/messagebird/plivo): ');
  const sessionToken = await ask('Session Token completo (sb-sbwpqtrxhiucwlbozet-auth-token.0): ');
  
  let credentials = {};
  
  if (provider === 'twilio') {
    credentials.account_sid = await ask('Twilio Account SID: ');
    credentials.auth_token = await ask('Twilio Auth Token: ');
    credentials.phone_number = await ask('Twilio Phone Number (+1234567890): ');
  } else if (provider === 'messagebird') {
    credentials.api_key = await ask('MessageBird API Key: ');
    credentials.originator = await ask('Originator (phone or sender ID): ');
  } else if (provider === 'plivo') {
    credentials.auth_id = await ask('Plivo Auth ID: ');
    credentials.auth_token = await ask('Plivo Auth Token: ');
    credentials.phone_number = await ask('Plivo Phone Number (+1234567890): ');
  } else {
    console.log('❌ Provider no soportado');
    return;
  }
  
  console.log('\n📤 Guardando credenciales...\n');
  
  const response = await fetch(`${baseUrl}/api/user/sms-credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `sb-sbwpqtrxhiucwlbozet-auth-token.0=${sessionToken}`
    },
    body: JSON.stringify({
      provider,
      credentials
    })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    console.log('✅ Credenciales guardadas exitosamente!');
    console.log('Provider ID:', data.provider?.id);
  } else {
    console.log('❌ Error:', data.error);
  }
}

async function sendTestMessage(baseUrl) {
  console.log('\n📨 Enviar Mensaje de Prueba\n');
  
  const sessionToken = await ask('Session Token completo (sb-sbwpqtrxhiucwlbozet-auth-token.0): ');
  const channel = await ask('Canal (sms/whatsapp/email) [sms]: ') || 'sms';
  const phone = await ask('Teléfono destino (+521234567890): ');
  const name = await ask('Nombre del contacto [Test User]: ') || 'Test User';
  const message = await ask('Mensaje a enviar: ');
  
  const scheduledInput = await ask('Programar para después? (minutos, 0=ahora) [0]: ') || '0';
  const scheduledMinutes = parseInt(scheduledInput);
  
  let scheduled_at = null;
  if (scheduledMinutes > 0) {
    const futureDate = new Date(Date.now() + scheduledMinutes * 60 * 1000);
    scheduled_at = futureDate.toISOString();
    console.log(`⏰ Programado para: ${futureDate.toLocaleString()}`);
  }
  
  console.log('\n📤 Enviando mensaje...\n');
  
  const response = await fetch(`${baseUrl}/api/messaging/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `sb-sbwpqtrxhiucwlbozet-auth-token.0=${sessionToken}`
    },
    body: JSON.stringify({
      channel,
      to_contact: {
        phone,
        name
      },
      body: message,
      scheduled_at
    })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    console.log('✅ Mensaje encolado exitosamente!');
    console.log('\nDetalles:');
    console.log('  Message ID:', data.message.id);
    console.log('  Job ID:', data.job.id);
    console.log('  Status:', data.message.status);
    console.log('  Run at:', data.job.run_at);
    console.log('\n💡 El worker procesará este mensaje en menos de 60 segundos');
    console.log('💡 Para procesarlo inmediatamente, ejecuta la opción 4');
  } else {
    console.log('❌ Error:', data.error);
  }
}

async function viewMessages(baseUrl) {
  console.log('\n📋 Ver Mensajes Recientes\n');
  
  const sessionToken = await ask('Session Token completo (sb-sbwpqtrxhiucwlbozet-auth-token.0): ');
  
  console.log('\n🔍 Consultando mensajes...\n');
  
  const response = await fetch(`${baseUrl}/api/messaging/recent`, {
    headers: {
      'Cookie': `sb-sbwpqtrxhiucwlbozet-auth-token.0=${sessionToken}`
    }
  });
  
  const data = await response.json();
  
  if (response.ok && data.messages) {
    console.log(`Encontrados ${data.messages.length} mensajes:\n`);
    
    data.messages.forEach((msg, i) => {
      console.log(`${i + 1}. ${msg.patient_name || 'Sin nombre'}`);
      console.log(`   📞 ${msg.to_phone}`);
      console.log(`   📝 ${msg.message_body.substring(0, 50)}...`);
      console.log(`   ⏱️  ${msg.created_at}`);
      console.log(`   ${getStatusEmoji(msg.status)} ${msg.status}`);
      console.log('');
    });
  } else {
    console.log('❌ Error:', data.error || 'No se pudieron cargar mensajes');
  }
}

async function runWorker(baseUrl) {
  console.log('\n⚙️ Ejecutar Worker Manualmente\n');
  
  const cronSecret = await ask('CRON_SECRET (de .env.local): ');
  
  console.log('\n🔄 Ejecutando worker...\n');
  
  const response = await fetch(`${baseUrl}/api/cron/messaging-worker`, {
    headers: {
      'Authorization': `Bearer ${cronSecret}`
    }
  });
  
  const data = await response.json();
  
  if (response.ok) {
    console.log('✅ Worker ejecutado exitosamente!\n');
    console.log('Resultados:');
    console.log('  Procesados:', data.result.processed);
    console.log('  Exitosos:', data.result.succeeded);
    console.log('  Fallidos:', data.result.failed);
    console.log('  Duración:', data.duration_ms, 'ms');
    
    if (data.result.errors.length > 0) {
      console.log('\n⚠️ Errores:');
      data.result.errors.forEach(err => console.log('  -', err));
    }
  } else {
    console.log('❌ Error:', data.error);
  }
}

function getStatusEmoji(status) {
  const emojis = {
    'queued': '⏳',
    'processing': '⚙️',
    'sent': '📤',
    'delivered': '✅',
    'read': '👁️',
    'failed': '❌',
    'cancelled': '🚫'
  };
  return emojis[status] || '❓';
}

// Run
testMessaging().catch(console.error);
