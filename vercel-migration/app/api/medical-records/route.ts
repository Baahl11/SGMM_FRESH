import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET: Obtener todos los registros médicos de un paciente
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ [medical-records] GET: No user authenticated');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const patient_id = searchParams.get('patient_id');

    console.log(`🔥 [medical-records] GET request for patient: ${patient_id}`);

    if (!patient_id) {
      return NextResponse.json({ error: 'patient_id es requerido' }, { status: 400 });
    }

    // Verificar que el paciente pertenece al usuario
    const { data: patient } = await supabase
      .from('patients')
      .select('id')
      .eq('id', patient_id)
      .eq('user_id', user.id)
      .single();

    if (!patient) {
      console.log(`❌ [medical-records] Patient ${patient_id} not found or unauthorized`);
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    // Obtener registros médicos ordenados por fecha DESC
    const { data: records, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', patient_id)
      .eq('user_id', user.id)
      .order('fecha_consulta', { ascending: false });

    if (error) {
      console.error('❌ [medical-records] Error fetching records:', error);
      throw error;
    }

    console.log(`✅ [medical-records] Found ${records?.length || 0} records`);
    return NextResponse.json(records || []);
  } catch (error) {
    console.error('❌ [medical-records] Error fetching medical records:', error);
    return NextResponse.json(
      { error: 'Error al obtener registros médicos' },
      { status: 500 }
    );
  }
}

// POST: Crear un nuevo registro médico
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ [medical-records] POST: No user authenticated');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      patient_id,
      tipo_consulta,
      fecha_consulta,
      signos_vitales,
      antecedentes,
      padecimiento_actual,
      exploracion_fisica,
      diagnostico_cie10,
      diagnostico_descripcion,
      pronostico,
      tratamiento,
      indicaciones_generales,
      medico_nombre,
      medico_cedula,
      medico_especialidad,
      archivos_adjuntos,
      notas_privadas
    } = body;

    console.log('🔥 [medical-records] POST request:', { 
      patient_id, 
      tipo_consulta, 
      medico_nombre,
      user_id: user.id 
    });

    // Validaciones básicas
    if (!patient_id || !tipo_consulta || !medico_nombre) {
      console.log('❌ [medical-records] Missing required fields');
      return NextResponse.json(
        { error: 'Faltan campos requeridos: patient_id, tipo_consulta, medico_nombre' },
        { status: 400 }
      );
    }

    // Verificar que el paciente pertenece al usuario
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', patient_id)
      .eq('user_id', user.id)
      .single();

    if (patientError || !patient) {
      console.error('❌ [medical-records] Patient verification failed:', patientError);
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    console.log('✅ [medical-records] Patient verified, creating record...');

    // Crear registro médico
    const { data: record, error } = await supabase
      .from('medical_records')
      .insert({
        patient_id,
        user_id: user.id,
        tipo_consulta,
        fecha_consulta: fecha_consulta || new Date().toISOString(),
        signos_vitales: signos_vitales || {},
        antecedentes: antecedentes || {},
        padecimiento_actual,
        exploracion_fisica,
        diagnostico_cie10,
        diagnostico_descripcion,
        pronostico,
        tratamiento: tratamiento || [],
        indicaciones_generales,
        medico_nombre,
        medico_cedula,
        medico_especialidad,
        archivos_adjuntos: archivos_adjuntos || [],
        notas_privadas
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [medical-records] Database insert error:', error);
      throw error;
    }

    console.log('✅ [medical-records] Record created successfully:', record.id);
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('❌ [medical-records] Error creating medical record:', error);
    return NextResponse.json(
      { error: 'Error al crear registro médico', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
