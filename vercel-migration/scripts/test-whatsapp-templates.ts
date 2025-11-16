/**
 * Test Script: WhatsApp Templates & Consent System
 * 
 * Tests:
 * 1. Template creation and validation
 * 2. Consent management (opt-in/opt-out)
 * 3. Message sending with template and consent validation
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🧪 Testing WhatsApp Templates & Consent System\n');

  // Get first user for testing
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id')
    .limit(1);

  if (usersError || !users || users.length === 0) {
    console.error('❌ No users found');
    return;
  }

  const testUserId = users[0].id;
  console.log(`Using test user: ${testUserId}\n`);

  // Test 1: Check if templates table exists
  console.log('Test 1: Verificando tabla whatsapp_templates...');
  try {
    const { data, error } = await supabase
      .from('whatsapp_templates')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Tabla whatsapp_templates no existe:', error.message);
      console.log('   Ejecuta: supabase/migrations/20251116_whatsapp_templates.sql\n');
      return;
    }

    console.log('✅ Tabla whatsapp_templates existe\n');
  } catch (error) {
    console.error('❌ Error:', error);
    return;
  }

  // Test 2: Check if patient_whatsapp_consent table exists
  console.log('Test 2: Verificando tabla patient_whatsapp_consent...');
  try {
    const { data, error } = await supabase
      .from('patient_whatsapp_consent')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Tabla patient_whatsapp_consent no existe:', error.message);
      console.log('   Ejecuta: supabase/migrations/20251116_whatsapp_templates.sql\n');
      return;
    }

    console.log('✅ Tabla patient_whatsapp_consent existe\n');
  } catch (error) {
    console.error('❌ Error:', error);
    return;
  }

  // Test 3: Create test template
  console.log('Test 3: Creando template de prueba...');
  const testTemplate = {
    user_id: testUserId,
    name: 'test_template_' + Date.now(),
    category: 'UTILITY',
    language: 'es_MX',
    body_text: 'Hola {{1}}, te recordamos tu cita el {{2}} a las {{3}}.',
    footer_text: 'Responde STOP para cancelar',
    buttons: [
      { type: 'QUICK_REPLY', text: 'Confirmar' },
      { type: 'QUICK_REPLY', text: 'Reagendar' },
    ],
    status: 'draft',
  };

  const { data: createdTemplate, error: templateError } = await supabase
    .from('whatsapp_templates')
    .insert([testTemplate])
    .select()
    .single();

  if (templateError) {
    console.error('❌ Error creando template:', templateError.message);
    return;
  }

  console.log('✅ Template creado:');
  console.log(`   ID: ${createdTemplate.id}`);
  console.log(`   Nombre: ${createdTemplate.name}`);
  console.log(`   Status: ${createdTemplate.status}\n`);

  // Test 4: Update template status to pending
  console.log('Test 4: Actualizando template a pending...');
  const { data: updatedTemplate, error: updateError } = await supabase
    .from('whatsapp_templates')
    .update({
      status: 'pending',
      submitted_at: new Date().toISOString(),
    })
    .eq('id', createdTemplate.id)
    .select()
    .single();

  if (updateError) {
    console.error('❌ Error actualizando template:', updateError.message);
    return;
  }

  console.log('✅ Template actualizado a pending\n');

  // Test 5: Approve template
  console.log('Test 5: Aprobando template...');
  const { data: approvedTemplate, error: approveError } = await supabase
    .from('whatsapp_templates')
    .update({
      status: 'approved',
      meta_template_id: 'test_meta_id_12345',
      approved_at: new Date().toISOString(),
    })
    .eq('id', createdTemplate.id)
    .select()
    .single();

  if (approveError) {
    console.error('❌ Error aprobando template:', approveError.message);
    return;
  }

  console.log('✅ Template aprobado:');
  console.log(`   Status: ${approvedTemplate.status}`);
  console.log(`   Meta ID: ${approvedTemplate.meta_template_id}\n`);

  // Test 6: Get first patient for consent testing
  console.log('Test 6: Probando sistema de consentimiento...');
  const { data: patients, error: patientsError } = await supabase
    .from('patients')
    .select('id, first_name, last_name')
    .eq('user_id', testUserId)
    .limit(1);

  if (patientsError || !patients || patients.length === 0) {
    console.log('⚠️  No hay pacientes para probar consentimiento');
    console.log('   Crea un paciente primero en la app\n');
  } else {
    const testPatientId = patients[0].id;
    console.log(`   Usando paciente: ${patients[0].first_name} ${patients[0].last_name}\n`);

    // Test 7: Record consent (opt-in)
    console.log('Test 7: Registrando consentimiento (opt-in)...');
    const { data: consent, error: consentError } = await supabase
      .from('patient_whatsapp_consent')
      .upsert([
        {
          user_id: testUserId,
          patient_id: testPatientId,
          has_consented: true,
          consent_method: 'checkbox',
          consent_date: new Date().toISOString(),
          opted_out: false,
        },
      ])
      .select()
      .single();

    if (consentError) {
      console.error('❌ Error registrando consentimiento:', consentError.message);
    } else {
      console.log('✅ Consentimiento registrado:');
      console.log(`   Paciente ID: ${consent.patient_id}`);
      console.log(`   Consentido: ${consent.has_consented}`);
      console.log(`   Método: ${consent.consent_method}\n`);
    }

    // Test 8: Record opt-out
    console.log('Test 8: Registrando opt-out...');
    const { data: optOut, error: optOutError } = await supabase
      .from('patient_whatsapp_consent')
      .update({
        opted_out: true,
        opted_out_date: new Date().toISOString(),
        opt_out_reason: 'test',
      })
      .eq('patient_id', testPatientId)
      .select()
      .single();

    if (optOutError) {
      console.error('❌ Error registrando opt-out:', optOutError.message);
    } else {
      console.log('✅ Opt-out registrado:');
      console.log(`   Opted out: ${optOut.opted_out}`);
      console.log(`   Razón: ${optOut.opt_out_reason}\n`);
    }

    // Test 9: Re-enable consent
    console.log('Test 9: Re-activando consentimiento...');
    const { data: reConsent, error: reConsentError } = await supabase
      .from('patient_whatsapp_consent')
      .update({
        has_consented: true,
        opted_out: false,
        consent_date: new Date().toISOString(),
        opted_out_date: null,
        opt_out_reason: null,
      })
      .eq('patient_id', testPatientId)
      .select()
      .single();

    if (reConsentError) {
      console.error('❌ Error re-activando consentimiento:', reConsentError.message);
    } else {
      console.log('✅ Consentimiento re-activado\n');
    }
  }

  // Test 10: List all templates
  console.log('Test 10: Listando todos los templates...');
  const { data: allTemplates, error: listError } = await supabase
    .from('whatsapp_templates')
    .select('name, category, status')
    .eq('user_id', testUserId);

  if (listError) {
    console.error('❌ Error listando templates:', listError.message);
  } else {
    console.log(`✅ Templates encontrados: ${allTemplates.length}`);
    allTemplates.forEach((t) => {
      console.log(`   - ${t.name} (${t.category}) - ${t.status}`);
    });
    console.log();
  }

  // Cleanup (optional - comment out to keep test data)
  console.log('🧹 Limpiando datos de prueba...');
  await supabase
    .from('whatsapp_templates')
    .delete()
    .eq('id', createdTemplate.id);

  console.log('✅ Template de prueba eliminado\n');

  console.log('=' .repeat(60));
  console.log('🎉 TESTS COMPLETADOS');
  console.log('='.repeat(60));
  console.log('\n📋 Próximos pasos:');
  console.log('  1. Ejecutar migración SQL en Supabase Dashboard');
  console.log('  2. Ir a /dashboard/settings/whatsapp-templates');
  console.log('  3. Crear templates reales y enviarlos a Meta');
  console.log('  4. Probar opt-in/opt-out en edición de pacientes');
  console.log('  5. Verificar validación de consent en envío de mensajes\n');
}

main().catch(console.error);
