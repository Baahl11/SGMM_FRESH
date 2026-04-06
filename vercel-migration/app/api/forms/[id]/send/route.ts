import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

// POST /api/forms/[id]/send - Generar token y enviar formulario a paciente
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { patient_id, expiration_hours = 72, send_via = 'whatsapp' } = body;

    if (!patient_id) {
      return NextResponse.json(
        { error: 'patient_id es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el formulario existe y pertenece al usuario
    const { data: form, error: formError } = await supabase
      .from('intake_forms')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (formError || !form) {
      return NextResponse.json(
        { error: 'Formulario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el paciente existe y pertenece al usuario
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, nombre, apellido_paterno, apellido_materno, email, telefono')
      .eq('id', patient_id)
      .eq('user_id', user.id)
      .single();

    if (patientError || !patient) {
      return NextResponse.json(
        { error: 'Paciente no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si ya existe un token activo para este form-patient
    const { data: existingTokens } = await supabase
      .from('form_tokens')
      .select('*')
      .eq('form_id', params.id)
      .eq('patient_id', patient_id)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString());

    if (existingTokens && existingTokens.length > 0) {
      // Retornar token existente
      const token = existingTokens[0];
      return NextResponse.json({
        token: token.token,
        public_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/public/forms/${token.token}`,
        expires_at: token.expires_at,
        message: 'Token existente reutilizado (todavía válido)'
      });
    }

    // Generar nuevo token único
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiration_hours);

    // Crear registro de token
    const { data: createdToken, error: tokenError } = await supabase
      .from('form_tokens')
      .insert({
        form_id: params.id,
        patient_id: patient_id,
        token: token,
        expires_at: expiresAt.toISOString(),
        sent_via: send_via
      })
      .select()
      .single();

    if (tokenError) {
      console.error('Error creating token:', tokenError);
      return NextResponse.json(
        { error: 'Error al generar token' },
        { status: 500 }
      );
    }

    // Construir URL pública
    const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/public/forms/${token}`;

    // Construir mensaje personalizado
    const patientName = `${patient.nombre} ${patient.apellido_paterno || ''}`.trim();
    const message = `Hola ${patientName}, te comparto el formulario "${form.name}". Por favor complétalo antes de tu cita: ${publicUrl}`;

    // Intentar enviar según el método especificado
    let sendResult = null;
    
    if (send_via === 'whatsapp' && patient.telefono) {
      // Preparar para envío por WhatsApp
      // Nota: Necesitas integración con Twilio o similar
      sendResult = {
        method: 'whatsapp',
        recipient: patient.telefono,
        status: 'ready',
        message: 'Listo para enviar por WhatsApp (requiere integración Twilio)'
      };
    } else if (send_via === 'email' && patient.email) {
      // Preparar para envío por Email
      // Nota: Necesitas integración con SendGrid, Resend o SMTP
      sendResult = {
        method: 'email',
        recipient: patient.email,
        status: 'ready',
        message: 'Listo para enviar por Email (requiere integración SMTP)'
      };
    } else {
      sendResult = {
        method: 'manual',
        status: 'manual',
        message: 'Copia el enlace manualmente para enviar al paciente'
      };
    }

    return NextResponse.json({
      success: true,
      token: createdToken.token,
      public_url: publicUrl,
      expires_at: createdToken.expires_at,
      patient: {
        id: patient.id,
        name: patientName,
        email: patient.email,
        telefono: patient.telefono
      },
      send_result: sendResult,
      message_template: message
    });

  } catch (error) {
    console.error('Unexpected error in POST /api/forms/[id]/send:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
