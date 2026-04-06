import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/submissions/[id] - Obtener detalles de una submission
export async function GET(
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

    // Obtener submission con info relacionada
    const { data: submission, error } = await supabase
      .from('form_submissions')
      .select(`
        *,
        form:intake_forms!inner(
          id,
          name,
          description,
          fields,
          user_id
        ),
        patient:patients(
          id,
          nombre,
          apellido_paterno,
          apellido_materno,
          email,
          telefono,
          fecha_nacimiento
        ),
        reviewed_by_user:auth.users!form_submissions_reviewed_by_fkey(
          id,
          email
        )
      `)
      .eq('id', params.id)
      .eq('form.user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Respuesta no encontrada' },
          { status: 404 }
        );
      }
      console.error('Error fetching submission:', error);
      return NextResponse.json(
        { error: 'Error al obtener respuesta' },
        { status: 500 }
      );
    }

    return NextResponse.json({ submission });

  } catch (error) {
    console.error('Unexpected error in GET /api/submissions/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/submissions/[id] - Actualizar estado de revisión
export async function PUT(
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
    const { status } = body;

    if (!status || !['submitted', 'reviewed', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Estado inválido. Debe ser: submitted, reviewed, approved, rejected' },
        { status: 400 }
      );
    }

    // Verificar que la submission existe y el form pertenece al usuario
    const { data: submission, error: checkError } = await supabase
      .from('form_submissions')
      .select(`
        id,
        form:intake_forms!inner(user_id)
      `)
      .eq('id', params.id)
      .single();

    if (checkError || !submission) {
      return NextResponse.json(
        { error: 'Respuesta no encontrada' },
        { status: 404 }
      );
    }

    // Verificar ownership a través del form
    const formData = submission.form as any;
    if (!formData || formData.user_id !== user.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Actualizar estado y marcar como revisado
    const updateData: any = {
      status: status
    };

    if (status === 'reviewed' || status === 'approved' || status === 'rejected') {
      updateData.reviewed_by = user.id;
      updateData.reviewed_at = new Date().toISOString();
    }

    const { data: updatedSubmission, error: updateError } = await supabase
      .from('form_submissions')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        patient:patients(
          id,
          nombre,
          apellido_paterno,
          apellido_materno
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating submission:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar respuesta' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      submission: updatedSubmission
    });

  } catch (error) {
    console.error('Unexpected error in PUT /api/submissions/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
