import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/public/forms/[token] - Obtener formulario público (sin auth)
export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = await createClient();

    // Verificar que el token existe y es válido
    const { data: isValid } = await supabase
      .rpc('is_form_token_valid', { token_value: params.token });

    if (!isValid) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 404 }
      );
    }

    // Obtener token con info completa
    const { data: tokenData, error: tokenError } = await supabase
      .from('form_tokens')
      .select(`
        *,
        form:intake_forms(
          id,
          name,
          description,
          fields,
          require_signature,
          allow_file_upload,
          multi_language
        ),
        patient:patients(
          id,
          nombre,
          apellido_paterno,
          apellido_materno
        )
      `)
      .eq('token', params.token)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Token no encontrado' },
        { status: 404 }
      );
    }

    // Registrar apertura si es la primera vez
    if (!tokenData.opened_at) {
      await supabase
        .from('form_tokens')
        .update({ opened_at: new Date().toISOString() })
        .eq('token', params.token);
    }

    // Verificar si ya fue completado
    if (tokenData.status === 'completed') {
      return NextResponse.json({
        status: 'completed',
        message: 'Este formulario ya fue completado',
        completed_at: tokenData.completed_at
      });
    }

    // Retornar formulario sin datos sensibles
    return NextResponse.json({
      status: 'active',
      form: tokenData.form,
      patient: {
        nombre: tokenData.patient.nombre,
        apellido_paterno: tokenData.patient.apellido_paterno,
        apellido_materno: tokenData.patient.apellido_materno
      },
      expires_at: tokenData.expires_at,
      require_signature: tokenData.form.require_signature,
      allow_file_upload: tokenData.form.allow_file_upload
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/public/forms/[token]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/public/forms/[token] - Enviar respuestas del formulario (sin auth)
export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = await createClient();

    // Verificar que el token existe y es válido
    const { data: isValid } = await supabase
      .rpc('is_form_token_valid', { token_value: params.token });

    if (!isValid) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 400 }
      );
    }

    // Obtener token
    const { data: tokenData, error: tokenError } = await supabase
      .from('form_tokens')
      .select('*')
      .eq('token', params.token)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Token no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que no esté ya completado
    if (tokenData.status === 'completed') {
      return NextResponse.json(
        { error: 'Este formulario ya fue completado anteriormente' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { responses, signature_data, uploaded_files } = body;

    if (!responses || typeof responses !== 'object') {
      return NextResponse.json(
        { error: 'Respuestas inválidas' },
        { status: 400 }
      );
    }

    // Obtener IP y User Agent del request
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Crear submission
    const { data: submission, error: submissionError } = await supabase
      .from('form_submissions')
      .insert({
        form_id: tokenData.form_id,
        patient_id: tokenData.patient_id,
        responses: responses,
        signature_data: signature_data || null,
        uploaded_files: uploaded_files || null,
        ip_address: ip,
        user_agent: userAgent,
        status: 'submitted'
      })
      .select()
      .single();

    if (submissionError) {
      console.error('Error creating submission:', submissionError);
      return NextResponse.json(
        { error: 'Error al guardar respuestas' },
        { status: 500 }
      );
    }

    // Marcar token como completado
    const { error: completeError } = await supabase
      .rpc('complete_form_token', { token_value: params.token });

    if (completeError) {
      console.error('Error completing token:', completeError);
    }

    return NextResponse.json({
      success: true,
      message: 'Formulario completado exitosamente',
      submission_id: submission.id,
      submitted_at: submission.submitted_at
    });

  } catch (error) {
    console.error('Unexpected error in POST /api/public/forms/[token]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
