/* eslint-disable no-console */
const path = require('path');
const crypto = require('crypto');
const { config: loadEnv } = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

loadEnv({ path: path.resolve(__dirname, '..', '.env.local') });

const baseUrl = process.env.WHATSAPP_DRY_RUN_BASE_URL || 'http://localhost:3000';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function assertNoError(error, label) {
  if (error) {
    console.error(`❌ ${label}:`, error.message || error);
    process.exit(1);
  }
}

async function updateOptionalProfileColumn(userId, column, value) {
  const { error } = await supabase
    .from('user_profiles')
    .update({ [column]: value })
    .eq('user_id', userId);

  if (!error) return true;

  const msg = String(error.message || '');
  if (msg.includes(`Could not find the '${column}' column`)) {
    console.warn(`⚠️ user_profiles.${column} no existe en este esquema, se omite.`);
    return false;
  }

  assertNoError(error, `Updating user_profiles.${column}`);
  return false;
}

async function ensureLocation(userId, marker) {
  const { data: existing, error: selectError } = await supabase
    .from('locations')
    .select('id')
    .eq('user_id', userId)
    .eq('activo', true)
    .order('es_principal', { ascending: false })
    .limit(1)
    .maybeSingle();

  assertNoError(selectError, 'Reading locations');

  const horarios = {
    monday: { start: '09:00', end: '18:00' },
    tuesday: { start: '09:00', end: '18:00' },
    wednesday: { start: '09:00', end: '18:00' },
    thursday: { start: '09:00', end: '18:00' },
    friday: { start: '09:00', end: '16:00' },
  };

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from('locations')
      .update({
        nombre: `Clinica Dry Run ${marker}`,
        direccion: 'Av. Reforma 123',
        ciudad: 'CDMX',
        telefono: '+52 55 1111 2222',
        horarios_laborales: horarios,
        es_principal: true,
      })
      .eq('id', existing.id);

    assertNoError(updateError, 'Updating existing location');
    return existing.id;
  }

  const { data: inserted, error: insertError } = await supabase
    .from('locations')
    .insert({
      user_id: userId,
      nombre: `Clinica Dry Run ${marker}`,
      direccion: 'Av. Reforma 123',
      ciudad: 'CDMX',
      telefono: '+52 55 1111 2222',
      horarios_laborales: horarios,
      es_principal: true,
      activo: true,
      timezone: 'America/Mexico_City',
    })
    .select('id')
    .single();

  assertNoError(insertError, 'Inserting location');
  return inserted.id;
}

async function run() {
  const marker = Date.now();
  const email = `whatsapp.dryrun.${marker}@agendamedpro.test`;
  const password = `Tmp!${Math.random().toString(36).slice(2, 10)}A`;
  const phoneNumberId = `dryrun-phone-${marker}`;
  const bookingSlug = `dryrun-${marker}`;
  const patientPhone = `+52155${String(marker).slice(-8)}`;
  const incomingPhone = patientPhone.replace(/\D/g, '');

  const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  assertNoError(createUserError, 'Creating auth user');

  const userId = createdUser.user.id;

  const { error: profileError } = await supabase
    .from('user_profiles')
    .upsert(
      {
        user_id: userId,
        name: 'Dra. Laura DryRun',
        email,
      },
      { onConflict: 'user_id' }
    );
  assertNoError(profileError, 'Upserting user_profiles');

  const hasBookingSlug = await updateOptionalProfileColumn(userId, 'booking_slug', bookingSlug);
  const hasFullName = await updateOptionalProfileColumn(userId, 'full_name', 'Dra. Laura DryRun');
  if (!hasFullName) {
    await updateOptionalProfileColumn(userId, 'name', 'Dra. Laura DryRun');
  }
  await updateOptionalProfileColumn(userId, 'whatsapp_enabled', true);
  await updateOptionalProfileColumn(userId, 'whatsapp_provider', 'meta');
  await updateOptionalProfileColumn(userId, 'whatsapp_phone_number_id', phoneNumberId);
  await updateOptionalProfileColumn(userId, 'whatsapp_business_account_id', `dryrun-business-${marker}`);
  await updateOptionalProfileColumn(userId, 'whatsapp_access_token', `dryrun-token-${marker}`);

  const { error: messagingError } = await supabase
    .from('messaging_config')
    .upsert(
      {
        user_id: userId,
        whatsapp_enabled: true,
        whatsapp_phone_number_id: phoneNumberId,
        whatsapp_business_id: `dryrun-business-${marker}`,
        whatsapp_access_token: `dryrun-token-${marker}`,
        clinic_name: 'Clinica Integral Dry Run',
        clinic_address: 'Av. Reforma 123, CDMX',
        clinic_phone: '+52 55 1111 2222',
        custom_message_signature: 'Equipo Medico Dry Run',
      },
      { onConflict: 'user_id' }
    );
  assertNoError(messagingError, 'Upserting messaging_config');

  const locationId = await ensureLocation(userId, marker);

  const { data: doctor, error: doctorError } = await supabase
    .from('doctors')
    .insert({
      user_id: userId,
      nombre: 'Dr. Miguel Horarios',
      especialidad: 'Cardiologia',
      activo: true,
    })
    .select('id')
    .single();
  assertNoError(doctorError, 'Creating doctor');

  const { error: scheduleError } = await supabase
    .from('doctor_schedules')
    .insert([
      {
        user_id: userId,
        doctor_id: doctor.id,
        dia_semana: 0,
        hora_inicio: '09:00',
        hora_fin: '13:00',
        activo: true,
      },
      {
        user_id: userId,
        doctor_id: doctor.id,
        dia_semana: 2,
        hora_inicio: '15:00',
        hora_fin: '19:00',
        activo: true,
      },
    ]);
  assertNoError(scheduleError, 'Creating doctor schedules');

  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .insert({
      user_id: userId,
      nombre: 'Paciente',
      apellido: 'PruebaDryRun',
      telefono: patientPhone,
      activo: true,
    })
    .select('id')
    .single();
  assertNoError(patientError, 'Creating patient');

  const appointmentDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { error: appointmentError } = await supabase
    .from('appointments')
    .insert({
      user_id: userId,
      patient_id: patient.id,
      doctor_id: doctor.id,
      location_id: locationId,
      fecha_hora: appointmentDate,
      estado: 'programada',
      duracion_minutos: 30,
    });
  assertNoError(appointmentError, 'Creating appointment');

  const validationResponse = await fetch(`${baseUrl}/api/whatsapp/validate-config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone_number_id: phoneNumberId,
      access_token: `dryrun-token-${marker}`,
    }),
  });
  const validationJson = await validationResponse.json();

  const webhookPayload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: `entry-${marker}`,
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15551234567',
                phone_number_id: phoneNumberId,
              },
              contacts: [
                {
                  profile: { name: 'Paciente DryRun' },
                  wa_id: incomingPhone,
                },
              ],
              messages: [
                {
                  from: incomingPhone,
                  id: `wamid.dryrun.${marker}`,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  text: { body: 'Hola, que horarios tienen y donde estan?' },
                  type: 'text',
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const rawPayload = JSON.stringify(webhookPayload);
  const headers = { 'Content-Type': 'application/json' };

  if (process.env.WHATSAPP_APP_SECRET) {
    const digest = crypto
      .createHmac('sha256', process.env.WHATSAPP_APP_SECRET)
      .update(rawPayload)
      .digest('hex');
    headers['x-hub-signature-256'] = `sha256=${digest}`;
  }

  const webhookResponse = await fetch(`${baseUrl}/api/webhooks/whatsapp`, {
    method: 'POST',
    headers,
    body: rawPayload,
  });

  const webhookJson = await webhookResponse.json();

  const { data: conversation, error: conversationError } = await supabase
    .from('whatsapp_conversations')
    .select('message_out, action_taken')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  assertNoError(conversationError, 'Reading whatsapp_conversations');

  const messageOut = conversation?.message_out || '';
  const checks = {
    validateDryRunSuccess: Boolean(validationJson?.success && validationJson?.dry_run),
    webhookAccepted: webhookResponse.ok,
    webhookStatus: webhookJson?.status,
    actionTaken: conversation?.action_taken || null,
    includesClinicName: messageOut.includes('Clinica Integral Dry Run'),
    includesSchedule: messageOut.toLowerCase().includes('horarios de atención') || messageOut.toLowerCase().includes('horarios de atencion'),
    includesBookingLink: hasBookingSlug
      ? messageOut.includes('https://agendamedpro.com/book/')
      : messageOut.includes('https://agendamedpro.com/dashboard/settings/booking'),
    includesSignature: messageOut.includes('Equipo Medico Dry Run'),
  };

  console.log('\n=== DRY-RUN VALIDATION RESULT ===');
  console.log(JSON.stringify({
    user: { user_id: userId, email, password },
    validation: validationJson,
    webhook: { statusCode: webhookResponse.status, body: webhookJson },
    conversation_preview: messageOut.slice(0, 240),
    checks,
  }, null, 2));

  const allChecksPassed =
    checks.validateDryRunSuccess
    && checks.webhookAccepted
    && checks.webhookStatus === 'booking_link_sent'
    && checks.actionTaken === 'sent_booking_link'
    && checks.includesClinicName
    && checks.includesSchedule
    && checks.includesBookingLink
    && checks.includesSignature;

  if (!allChecksPassed) {
    console.error('\n❌ One or more validation checks failed.');
    process.exit(1);
  }

  console.log('\n✅ WhatsApp AI dry-run validation passed.');
}

run().catch((error) => {
  console.error('Unexpected validation error:', error);
  process.exit(1);
});
