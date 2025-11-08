import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/forms/[id]/submissions - Obtener todas las respuestas de un formulario
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que el formulario existe y pertenece al usuario
    const { data: form, error: formError } = await supabase
      .from('intake_forms')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (formError || !form) {
      return NextResponse.json(
        { error: 'Formulario no encontrado' },
        { status: 404 }
      );
    }

    // Obtener submissions con info del paciente
    const { data: submissions, error } = await supabase
      .from('form_submissions')
      .select(`
        *,
        patient:patients(
          id,
          nombre,
          apellido_paterno,
          apellido_materno,
          email,
          telefono,
          fecha_nacimiento
        )
      `)
      .eq('form_id', params.id)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching submissions:', error);
      return NextResponse.json(
        { error: 'Error al obtener respuestas' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      form_id: params.id,
      total: submissions?.length || 0,
      submissions: submissions || []
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/forms/[id]/submissions:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
