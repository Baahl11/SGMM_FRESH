import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { addDaysToDateString, clinicDateStringRangeUtc, dateStringInTimezone } from '@/lib/timezone';

export const runtime = 'edge';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/agents/reminders/test
 * Ejecuta el reminder agent AHORA MISMO para las citas de mañana
 * Requiere autenticación del usuario
 */
export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[TEST AGENT] 🧪 Test manual iniciado por usuario: ${user.id}`);

    // Verificar que el usuario tenga WhatsApp configurado
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('whatsapp_enabled, whatsapp_phone_number_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile?.whatsapp_enabled) {
      return NextResponse.json({
        error: 'WhatsApp no configurado',
        message: 'Debes configurar WhatsApp en Ajustes antes de probar',
        redirectTo: '/dashboard/settings/whatsapp'
      }, { status: 400 });
    }

    // Obtener fecha de mañana (adenda V2.1, A-5: "mañana" en el calendario
    // local de la clinica, no en el dia UTC del proceso)
    const tomorrowStr = addDaysToDateString(dateStringInTimezone(new Date()), 1);

    console.log(`[TEST AGENT] 📅 Buscando citas para: ${tomorrowStr}`);

    // Buscar citas de mañana del usuario actual
    const { startUtc: tomorrowStartUtc, endUtc: tomorrowEndUtc } = clinicDateStringRangeUtc(tomorrowStr);
    const { data: appointments, error } = await supabaseAdmin
      .from('appointments')
      .select(`
        id,
        fecha_hora,
        estado,
        patient:patients(id, nombre, apellido, telefono)
      `)
      .eq('user_id', user.id)
      .gte('fecha_hora', tomorrowStartUtc.toISOString())
      .lt('fecha_hora', tomorrowEndUtc.toISOString())
      .in('estado', ['confirmada', 'programada']);

    if (error) {
      console.error('[TEST AGENT] ❌ Error:', error);
      throw error;
    }

    console.log(`[TEST AGENT] 📋 Encontradas ${appointments?.length || 0} citas`);

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay citas para mañana',
        date: tomorrowStr,
        total: 0,
        tip: 'Crea una cita para mañana y vuelve a probar'
      });
    }

    // Enviar recordatorios
    const results = [];
    for (const appointment of appointments) {
      const patient = appointment.patient as any;
      
      if (!patient?.telefono) {
        console.log(`[TEST AGENT] ⚠️ Paciente ${patient?.nombre} sin teléfono`);
        results.push({
          appointmentId: appointment.id,
          patient: `${patient?.nombre || ''} ${patient?.apellido || ''}`.trim(),
          status: 'skipped',
          reason: 'Sin teléfono'
        });
        continue;
      }

      const appointmentTime = new Date(appointment.fecha_hora).toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const appointmentDateFormatted = new Date(appointment.fecha_hora).toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const patientName = `${patient.nombre} ${patient.apellido}`.trim();
      const message = `Hola ${patientName}! 👋\n\nTe recordamos tu cita médica:\n📅 ${appointmentDateFormatted}\n🕐 ${appointmentTime}\n\nPor favor confirma tu asistencia respondiendo SÍ o NO.\n\n- AgendaMedPro`;

      try {
        // Obtener credenciales de WhatsApp del usuario
        const { data: userProfile } = await supabaseAdmin
          .from('user_profiles')
          .select('whatsapp_phone_number_id, whatsapp_access_token')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!userProfile?.whatsapp_phone_number_id || !userProfile.whatsapp_access_token) {
          results.push({
            appointmentId: appointment.id,
            patient: patientName,
            phone: patient.telefono,
            status: 'error',
            error: 'Credenciales de WhatsApp incompletas'
          });
          continue;
        }

        // Limpiar número de teléfono
        const cleanPhone = patient.telefono.replace(/[\s\-\+]/g, '');
        
        console.log(`[TEST AGENT] 📤 Enviando WhatsApp a ${cleanPhone}`);

        // Enviar vía Meta Cloud API
        const metaResponse = await fetch(
          `https://graph.facebook.com/v18.0/${userProfile.whatsapp_phone_number_id}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${userProfile.whatsapp_access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: cleanPhone,
              type: 'text',
              text: { body: message }
            }),
          }
        );

        if (!metaResponse.ok) {
          const errorData = await metaResponse.json();
          console.error('[TEST AGENT] ❌ Error de Meta API:', errorData);
          results.push({
            appointmentId: appointment.id,
            patient: patientName,
            phone: patient.telefono,
            status: 'error',
            error: errorData.error?.message || 'Error enviando WhatsApp'
          });
          continue;
        }

        const data = await metaResponse.json();
        console.log(`[TEST AGENT] ✅ Enviado - Message ID: ${data.messages?.[0]?.id}`);
        
        results.push({
          appointmentId: appointment.id,
          patient: patientName,
          phone: patient.telefono,
          status: 'sent',
          messageId: data.messages?.[0]?.id
        });

        // Registrar en reminder_logs
        await supabaseAdmin.from('reminder_logs').insert({
          appointment_id: appointment.id,
          patient_id: patient.id,
          phone: patient.telefono,
          message_sent: true,
          method: 'whatsapp',
          response_text: `TEST - Message ID: ${data.messages?.[0]?.id}`
        });

      } catch (err) {
        console.error(`[TEST AGENT] 💥 Error:`, err);
        results.push({
          appointmentId: appointment.id,
          patient: patientName,
          phone: patient.telefono,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }

      // Pequeño delay entre envíos
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('[TEST AGENT] 🎉 Test completado!');

    return NextResponse.json({
      success: true,
      message: 'Test completado',
      date: tomorrowStr,
      total: appointments.length,
      sent: results.filter(r => r.status === 'sent').length,
      failed: results.filter(r => r.status === 'error').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      results
    });

  } catch (error) {
    console.error('[TEST AGENT] 💥 Fatal error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
