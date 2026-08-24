// API Route: Patient Fiscal Data
// GET/POST /api/patients/[id]/fiscal-data

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { PatientFiscalDataInput } from '@/lib/types/facturama';
import { isValidRFC, isValidCodigoPostal } from '@/lib/types/facturama';

// GET - Retrieve fiscal data for a patient
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const patientId = params.id;

    const { data: fiscalData, error } = await supabase
      .from('patient_fiscal_data')
      .select('*')
      .eq('patient_id', patientId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching fiscal data:', error);
      return NextResponse.json({ error: 'Error fetching fiscal data' }, { status: 500 });
    }

    return NextResponse.json({ fiscal_data: fiscalData || [] });
  } catch (error) {
    console.error('Error in GET /api/patients/[id]/fiscal-data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new fiscal data for a patient
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const patientId = params.id;
    const body: PatientFiscalDataInput = await request.json();

    // Validate required fields
    const requiredFields = ['rfc', 'razon_social', 'regimen_fiscal', 'codigo_postal'];
    const missingFields = requiredFields.filter(field => !body[field as keyof PatientFiscalDataInput]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate RFC
    if (!isValidRFC(body.rfc)) {
      return NextResponse.json({ error: 'RFC inválido' }, { status: 400 });
    }

    // Validate postal code
    if (!isValidCodigoPostal(body.codigo_postal)) {
      return NextResponse.json({ error: 'Código postal inválido (debe ser 5 dígitos)' }, { status: 400 });
    }

    // If this is set as default, unset other defaults
    if (body.is_default !== false) {
      await supabase
        .from('patient_fiscal_data')
        .update({ is_default: false })
        .eq('patient_id', patientId);
    }

    // Insert new fiscal data
    const { data: fiscalData, error } = await supabase
      .from('patient_fiscal_data')
      .insert({
        patient_id: patientId,
        user_id: user.id, // fable C3: tenant explícito para RLS
        rfc: body.rfc.toUpperCase(),
        razon_social: body.razon_social,
        regimen_fiscal: body.regimen_fiscal,
        codigo_postal: body.codigo_postal,
        uso_cfdi: body.uso_cfdi || 'G03',
        email_facturacion: body.email_facturacion,
        telefono: body.telefono,
        direccion: body.direccion,
        ciudad: body.ciudad,
        estado: body.estado,
        pais: 'MX',
        is_default: body.is_default !== false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating fiscal data:', error);
      
      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Ya existe un RFC registrado para este paciente' },
          { status: 409 }
        );
      }
      
      return NextResponse.json({ error: 'Error creating fiscal data' }, { status: 500 });
    }

    return NextResponse.json({ fiscal_data: fiscalData, message: 'Datos fiscales guardados exitosamente' });
  } catch (error) {
    console.error('Error in POST /api/patients/[id]/fiscal-data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
