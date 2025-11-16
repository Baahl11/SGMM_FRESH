import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-server';

/**
 * GET /api/whatsapp/consent
 * Get all patient consent records
 */
export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patient_id = searchParams.get('patient_id');

    const supabase = await createClient();

    let query = supabase
      .from('patient_whatsapp_consent')
      .select(`
        *,
        patients (
          id,
          first_name,
          last_name,
          phone
        )
      `)
      .eq('user_id', user.id);

    if (patient_id) {
      query = query.eq('patient_id', patient_id);
    }

    const { data: consents, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching consents:', error);
      return NextResponse.json(
        { error: 'Error al obtener registros de consentimiento' },
        { status: 500 }
      );
    }

    return NextResponse.json({ consents });
  } catch (error) {
    console.error('Error in GET /api/whatsapp/consent:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/whatsapp/consent
 * Record patient consent (opt-in)
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { patient_id, consent_method, consent_ip_address } = body;

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

    // Check if consent already exists
    const { data: existingConsent } = await supabase
      .from('patient_whatsapp_consent')
      .select('id, has_consented, opted_out')
      .eq('user_id', user.id)
      .eq('patient_id', patient_id)
      .single();

    if (existingConsent) {
      // Update existing consent
      const { data: updatedConsent, error: updateError } = await supabase
        .from('patient_whatsapp_consent')
        .update({
          has_consented: true,
          consent_method: consent_method || 'manual',
          consent_date: new Date().toISOString(),
          consent_ip_address,
          opted_out: false,
          opted_out_date: null,
          opt_out_reason: null,
        })
        .eq('id', existingConsent.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating consent:', updateError);
        return NextResponse.json(
          { error: 'Error al actualizar consentimiento' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        consent: updatedConsent,
        message: 'Consentimiento actualizado correctamente',
      });
    } else {
      // Create new consent
      const { data: newConsent, error: createError } = await supabase
        .from('patient_whatsapp_consent')
        .insert([
          {
            user_id: user.id,
            patient_id,
            has_consented: true,
            consent_method: consent_method || 'manual',
            consent_date: new Date().toISOString(),
            consent_ip_address,
            opted_out: false,
          },
        ])
        .select()
        .single();

      if (createError) {
        console.error('Error creating consent:', createError);
        return NextResponse.json(
          { error: 'Error al crear consentimiento' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        consent: newConsent,
        message: 'Consentimiento registrado correctamente',
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error in POST /api/whatsapp/consent:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
