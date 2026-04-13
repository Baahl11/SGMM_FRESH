// Script para crear invitaciones manualmente
// Uso: node create_invitations.js

const SUPABASE_URL = 'TU_SUPABASE_URL'; // Reemplaza con tu URL
const SUPABASE_ANON_KEY = 'TU_SUPABASE_ANON_KEY'; // Reemplaza con tu anon key
const YOUR_EMAIL = 'tu@email.com'; // Tu email de admin
const YOUR_PASSWORD = 'tu_password'; // Tu password

// Los 2 clientes
const CLIENTS = [
  {
    email: 'cliente1@email.com',
    name: 'Cliente 1',
    notes: 'Cliente MSI - Upgrade a webapp'
  },
  {
    email: 'cliente2@email.com',
    name: 'Cliente 2',
    notes: 'Cliente MSI - Upgrade a webapp'
  }
];

async function createInvitations() {
  try {
    // 1. Login como admin
    console.log('🔐 Iniciando sesión como admin...');
    const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: YOUR_EMAIL,
        password: YOUR_PASSWORD
      })
    });

    const { access_token } = await loginRes.json();
    
    if (!access_token) {
      throw new Error('❌ No se pudo iniciar sesión. Verifica tu email y password.');
    }
    
    console.log('✅ Sesión iniciada correctamente\n');

    // 2. Crear invitaciones para cada cliente
    for (const client of CLIENTS) {
      console.log(`📧 Creando invitación para ${client.name}...`);
      
      const invitationRes = await fetch(`${SUPABASE_URL.replace('/auth/v1', '')}/api/admin/invitations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: client.email,
          name: client.name,
          plan_type: 'premium',
          notes: client.notes
        })
      });

      const result = await invitationRes.json();
      
      if (invitationRes.ok) {
        console.log(`✅ Invitación creada para ${client.name}`);
        console.log(`   📎 Link: ${result.signup_url}\n`);
      } else {
        console.log(`❌ Error para ${client.name}:`, result.error);
      }
    }

    console.log('🎉 ¡Proceso completado!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createInvitations();
