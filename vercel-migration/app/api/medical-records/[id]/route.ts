import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// PUT: Actualizar una consulta médica
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const recordId = params.id;
    const body = await request.json();
    // Verificar que el registro existe y pertenece al usuario
    const { data: record, error: fetchError } = await supabase
      .from('medical_records')
      .select('id, patient_id')
      .eq('id', recordId)
      .single();

    if (fetchError || !record) {
      return NextResponse.json({ error: 'Consulta no encontrada' }, { status: 404 });
    }

    // Verificar que el paciente pertenece al usuario
    const { data: patient } = await supabase
      .from('patients')
      .select('id')
      .eq('id', record.patient_id)
      .eq('user_id', user.id)
      .single();

    if (!patient) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    // Actualizar el registro
    const { data: updatedRecord, error: updateError } = await supabase
      .from('medical_records')
      .update({
        tipo_consulta: body.tipo_consulta,
        signos_vitales: body.signos_vitales,
        antecedentes: body.antecedentes,
        padecimiento_actual: body.padecimiento_actual,
        exploracion_fisica: body.exploracion_fisica,
        diagnostico_cie10: body.diagnostico_cie10,
        diagnostico_descripcion: body.diagnostico_descripcion,
        pronostico: body.pronostico,
        tratamiento: body.tratamiento,
        indicaciones_generales: body.indicaciones_generales,
        notas_privadas: body.notas_privadas,
        medico_nombre: body.medico_nombre,
        medico_cedula: body.medico_cedula,
        medico_especialidad: body.medico_especialidad,
        updated_at: new Date().toISOString()
      })
      .eq('id', recordId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ [medical-records] Update error:', updateError);
      throw updateError;
    }
    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error('❌ [medical-records] Error updating record:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la consulta', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar una consulta médica
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const recordId = params.id;
    // Verificar que el registro existe y pertenece al usuario
    const { data: record, error: fetchError } = await supabase
      .from('medical_records')
      .select('id, patient_id')
      .eq('id', recordId)
      .single();

    if (fetchError || !record) {
      return NextResponse.json({ error: 'Consulta no encontrada' }, { status: 404 });
    }

    // Verificar que el paciente pertenece al usuario
    const { data: patient } = await supabase
      .from('patients')
      .select('id')
      .eq('id', record.patient_id)
      .eq('user_id', user.id)
      .single();

    if (!patient) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    // Eliminar el registro
    const { error: deleteError } = await supabase
      .from('medical_records')
      .delete()
      .eq('id', recordId);

    if (deleteError) {
      console.error('❌ [medical-records] Delete error:', deleteError);
      throw deleteError;
    }
    return NextResponse.json({ message: 'Consulta eliminada exitosamente' });
  } catch (error) {
    console.error('❌ [medical-records] Error deleting record:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la consulta', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
