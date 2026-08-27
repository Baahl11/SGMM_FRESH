import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { addDaysToDateString, clinicDateStringRangeUtc, dateStringInTimezone } from '@/lib/timezone';

export const runtime = 'edge';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Función para enviar recordatorio por WhatsApp usando la API existente
async function sendReminderWhatsApp(
  userId: string,
  phone: string, 
  patientName: string, 
  appointmentDate: string, 
  appointmentTime: string
) {
  const message = `Hola ${patientName}! 👋\n\nTe recordamos tu cita médica:\n📅 ${appointmentDate}\n🕐 ${appointmentTime}\n\nPor favor confirma tu asistencia respondiendo SÍ o NO.\n\n- AgendaMedPro`;
  
  console.log(`[REMINDER] 📤 Enviando WhatsApp a ${phone}`);

  try {
    // Usar el endpoint existente de WhatsApp
    // Nota: En Edge Runtime no podemos llamar a /api/whatsapp/send directamente,
    // así que replicamos la lógica aquí
    
    // Obtener credenciales del doctor
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('whatsapp_enabled, whatsapp_phone_number_id, whatsapp_access_token')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profile?.whatsapp_enabled || !profile.whatsapp_phone_number_id || !profile.whatsapp_access_token) {
      console.log('[REMINDER] ⚠️ WhatsApp no configurado para este usuario');
      return {
        success: false,
        phone,
        error: 'WhatsApp no configurado',
        sentAt: new Date().toISOString()
      };
    }

    // Limpiar número de teléfono
    const cleanPhone = phone.replace(/[\s\-\+]/g, '');
    
    // Enviar vía Meta Cloud API
    const metaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${profile.whatsapp_phone_number_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${profile.whatsapp_access_token}`,
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
      console.error('[REMINDER] ❌ Error de Meta API:', errorData);
      return {
        success: false,
        phone,
        error: errorData.error?.message || 'Error enviando WhatsApp',
        sentAt: new Date().toISOString()
      };
    }

    const data = await metaResponse.json();
    console.log(`[REMINDER] ✅ WhatsApp enviado - Message ID: ${data.messages?.[0]?.id}`);
    
    return {
      success: true,
      phone,
      message,
      messageId: data.messages?.[0]?.id,
      sentAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('[REMINDER] 💥 Error:', error);
    return {
      success: false,
      phone,
      error: error instanceof Error ? error.message : 'Unknown error',
      sentAt: new Date().toISOString()
    };
  }
}

export async function GET(request: Request) {
  try {
    // Verificar autorización (solo cron jobs de Vercel)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[AGENT] 🤖 Reminder Agent started...');

    // 1. Obtener fecha de mañana (adenda V2.1, A-5: "mañana" en el
    // calendario local de la clinica, no en el dia UTC del proceso)
    const tomorrowStr = addDaysToDateString(dateStringInTimezone(new Date()), 1);

    console.log(`[AGENT] 📅 Buscando citas para: ${tomorrowStr}`);

    // 2. Buscar todas las citas de mañana que estén confirmadas o pendientes
    const { startUtc: tomorrowStartUtc, endUtc: tomorrowEndUtc } = clinicDateStringRangeUtc(tomorrowStr);
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        fecha_hora,
        duracion_minutos,
        estado,
        patient_id,
        user_id,
        patient:patients(id, nombre, apellido, telefono, email)
      `)
      .gte('fecha_hora', tomorrowStartUtc.toISOString())
      .lt('fecha_hora', tomorrowEndUtc.toISOString())
      .in('estado', ['confirmada', 'programada']);

    if (error) {
      console.error('[AGENT] ❌ Error fetching appointments:', error);
      throw error;
    }

    console.log(`[AGENT] 📋 Encontradas ${appointments?.length || 0} citas`);

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay citas para recordar',
        date: tomorrowStr,
        total: 0
      });
    }

    // 3. Enviar recordatorios
    const results = [];
    for (const appointment of appointments) {
      const patient = appointment.patient as any;
      
      if (!patient?.telefono) {
        console.log(`[AGENT] ⚠️ Paciente ${patient?.nombre} sin teléfono`);
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

      try {
        const result = await sendReminderWhatsApp(
          appointment.user_id, // Pass user_id for WhatsApp credentials
          patient.telefono,
          patientName,
          appointmentDateFormatted,
          appointmentTime
        );

        results.push({
          appointmentId: appointment.id,
          patient: patientName,
          phone: patient.telefono,
          status: result.success ? 'sent' : 'error',
          messageId: result.messageId,
          error: result.error
        });

        // Log resultado con paciente actual
        if (result.success) {
          console.log(`[AGENT] ✅ Recordatorio enviado a ${patientName}`);
          
          // Registrar en reminder_logs
          await supabase.from('reminder_logs').insert({
            appointment_id: appointment.id,
            patient_id: appointment.patient_id,
            phone: patient.telefono,
            message_sent: true,
            method: 'whatsapp',
            response_text: `Message ID: ${result.messageId}`
          });
        } else {
          console.log(`[AGENT] ⚠️ Falló envío a ${patientName}: ${result.error}`);
        }
      } catch (err) {
        console.error(`[AGENT] ❌ Error enviando a ${patientName}:`, err);
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

    console.log('[AGENT] 🎉 Reminder Agent finished!');

    return NextResponse.json({
      success: true,
      message: 'Recordatorios procesados',
      date: tomorrowStr,
      total: appointments.length,
      sent: results.filter(r => r.status === 'sent').length,
      failed: results.filter(r => r.status === 'error').length,
      results
    });

  } catch (error) {
    console.error('[AGENT] 💥 Fatal error:', error);
    
    // Serialize error properly to avoid [object Object]
    let errorDetails: any = {
      message: 'Unknown error',
      type: typeof error
    };
    
    if (error instanceof Error) {
      errorDetails = {
        message: error.message,
        name: error.name,
        stack: error.stack
      };
    } else if (typeof error === 'object' && error !== null) {
      try {
        errorDetails = {
          ...error,
          stringified: JSON.stringify(error, null, 2)
        };
      } catch (e) {
        errorDetails.message = 'Could not stringify error object';
      }
    } else {
      errorDetails.stringValue = String(error);
    }
    
    return NextResponse.json(
      {
        success: false,
        errorDetails,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
