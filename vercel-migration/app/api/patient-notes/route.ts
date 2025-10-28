import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Obtener notas de un paciente
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener patient_id del query
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patient_id');

    if (!patientId) {
      return NextResponse.json({ error: 'patient_id es requerido' }, { status: 400 });
    }

    // Obtener notas del paciente
    const { data: notes, error } = await supabase
      .from('patient_notes')
      .select('*')
      .eq('patient_id', patientId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching patient notes:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`✅ Loaded ${notes?.length || 0} notes for patient ${patientId}`);
    return NextResponse.json(notes || []);

  } catch (error) {
    console.error('❌ Error in patient-notes GET:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear nueva nota
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { patient_id, tipo_nota, titulo, contenido } = body;

    // Validar campos requeridos
    if (!patient_id || !tipo_nota || !contenido) {
      return NextResponse.json(
        { error: 'patient_id, tipo_nota y contenido son requeridos' },
        { status: 400 }
      );
    }

    // Validar tipo_nota
    const tiposValidos = ['pendiente', 'idea', 'importante', 'general', 'completada'];
    if (!tiposValidos.includes(tipo_nota)) {
      return NextResponse.json(
        { error: 'tipo_nota debe ser: pendiente, idea, importante, general o completada' },
        { status: 400 }
      );
    }

    // Crear nota
    const { data: newNote, error } = await supabase
      .from('patient_notes')
      .insert({
        patient_id,
        user_id: user.id,
        tipo_nota,
        titulo,
        contenido,
        completada: tipo_nota === 'completada'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating patient note:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`✅ Created note ${newNote.id} for patient ${patient_id}`);
    return NextResponse.json(newNote, { status: 201 });

  } catch (error) {
    console.error('❌ Error in patient-notes POST:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
