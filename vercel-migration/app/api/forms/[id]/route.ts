import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/forms/[id] - Obtener un formulario específico
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

    const { data: form, error } = await supabase
      .from('intake_forms')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Formulario no encontrado' },
          { status: 404 }
        );
      }
      console.error('Error fetching form:', error);
      return NextResponse.json(
        { error: 'Error al obtener formulario' },
        { status: 500 }
      );
    }

    // También obtener submissions recientes para este form
    const { data: submissions } = await supabase
      .from('form_submissions')
      .select(`
        *,
        patient:patients(id, nombre, apellido_paterno, apellido_materno, email, telefono)
      `)
      .eq('form_id', params.id)
      .order('submitted_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      form,
      recent_submissions: submissions || []
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/forms/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/forms/[id] - Actualizar formulario
export async function PUT(
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

    const body = await request.json();

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.fields !== undefined) updateData.fields = body.fields;
    if (body.require_signature !== undefined) updateData.require_signature = body.require_signature;
    if (body.allow_file_upload !== undefined) updateData.allow_file_upload = body.allow_file_upload;
    if (body.multi_language !== undefined) updateData.multi_language = body.multi_language;
    if (body.active !== undefined) updateData.active = body.active;

    const { data: updatedForm, error } = await supabase
      .from('intake_forms')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Formulario no encontrado' },
          { status: 404 }
        );
      }
      console.error('Error updating form:', error);
      return NextResponse.json(
        { error: 'Error al actualizar formulario' },
        { status: 500 }
      );
    }

    return NextResponse.json({ form: updatedForm });
  } catch (error) {
    console.error('Unexpected error in PUT /api/forms/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/forms/[id] - Eliminar formulario
export async function DELETE(
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

    const { error } = await supabase
      .from('intake_forms')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting form:', error);
      return NextResponse.json(
        { error: 'Error al eliminar formulario' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Formulario eliminado' });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/forms/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
