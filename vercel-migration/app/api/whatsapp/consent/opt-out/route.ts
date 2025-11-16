import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-server';

/**
 * POST /api/whatsapp/consent/opt-out
 * Record patient opt-out (unsubscribe from WhatsApp)
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { patient_id, opt_out_reason } = body;

    if (!patient_id) {
      return NextResponse.json(
        { error: 'patient_id es requerido' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if patient exists and belongs to user
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', patient_id)
      .eq('user_id', user.id)
      .single();

    if (patientError || !patient) {
      return NextResponse.json(
        { error: 'Paciente no encontrado' },
        { status: 404 }
      );
    }

    // Check if consent record exists
    const { data: existingConsent } = await supabase
      .from('patient_whatsapp_consent')
      .select('id')
      .eq('user_id', user.id)
      .eq('patient_id', patient_id)
      .single();

    if (existingConsent) {
      // Update existing record
      const { data: updatedConsent, error: updateError } = await supabase
        .from('patient_whatsapp_consent')
        .update({
          opted_out: true,
          opted_out_date: new Date().toISOString(),
          opt_out_reason: opt_out_reason || 'user_request',
        })
        .eq('id', existingConsent.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating opt-out:', updateError);
        return NextResponse.json(
          { error: 'Error al registrar opt-out' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        consent: updatedConsent,
        message: 'Paciente dado de baja de WhatsApp correctamente',
      });
    } else {
      // Create new record with opt-out
      const { data: newConsent, error: createError } = await supabase
        .from('patient_whatsapp_consent')
        .insert([
          {
            user_id: user.id,
            patient_id,
            has_consented: false,
            opted_out: true,
            opted_out_date: new Date().toISOString(),
            opt_out_reason: opt_out_reason || 'user_request',
          },
        ])
        .select()
        .single();

      if (createError) {
        console.error('Error creating opt-out record:', createError);
        return NextResponse.json(
          { error: 'Error al registrar opt-out' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        consent: newConsent,
        message: 'Paciente dado de baja de WhatsApp correctamente',
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error in POST /api/whatsapp/consent/opt-out:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
