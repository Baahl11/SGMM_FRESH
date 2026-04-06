import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// PUT - Actualizar nota
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const supabase = await createClient();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { tipo_nota, titulo, contenido, completada } = body;

    // Preparar datos de actualización
    const updateData: any = {};
    if (tipo_nota) updateData.tipo_nota = tipo_nota;
    if (titulo !== undefined) updateData.titulo = titulo;
    if (contenido !== undefined) updateData.contenido = contenido;
    if (completada !== undefined) {
      updateData.completada = completada;
      if (completada) {
        updateData.fecha_completada = new Date().toISOString();
      } else {
        updateData.fecha_completada = null;
      }
    }

    const { data: updatedNote, error } = await supabase
      .from('patient_notes')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating patient note:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(updatedNote);

  } catch (error) {
    console.error('❌ Error in patient-notes PUT:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar nota
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const supabase = await createClient();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { error } = await supabase
      .from('patient_notes')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('❌ Error deleting patient note:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Nota eliminada exitosamente' });

  } catch (error) {
    console.error('❌ Error in patient-notes DELETE:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
