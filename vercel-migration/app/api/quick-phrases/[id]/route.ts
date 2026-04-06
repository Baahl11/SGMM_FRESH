import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { validateQuickPhrase } from '@/lib/types/quick-phrase';

// GET /api/quick-phrases/[id] - Get single quick phrase
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('quick_phrases')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id) // RLS ensures this, but explicit is good
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Frase rápida no encontrada' },
          { status: 404 }
        );
      }
      console.error('Error fetching quick phrase:', error);
      return NextResponse.json(
        { error: 'Error al obtener frase rápida' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in GET /api/quick-phrases/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/quick-phrases/[id] - Update quick phrase
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { title, content, context, category } = body;

    // Build update object (only include provided fields)
    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (context !== undefined) updateData.context = context;
    if (category !== undefined) updateData.category = category;

    // Validate if we have data to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No hay datos para actualizar' },
        { status: 400 }
      );
    }

    // Validate data
    const validationErrors = validateQuickPhrase({
      title: updateData.title,
      content: updateData.content,
      context: updateData.context,
      category: updateData.category
    });
    
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validationErrors },
        { status: 400 }
      );
    }

    // Update phrase (RLS ensures user can only update their own)
    const { data, error } = await supabase
      .from('quick_phrases')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Frase rápida no encontrada' },
          { status: 404 }
        );
      }
      console.error('Error updating quick phrase:', error);
      return NextResponse.json(
        { error: 'Error al actualizar frase rápida' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in PUT /api/quick-phrases/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/quick-phrases/[id] - Delete quick phrase
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Delete phrase (RLS ensures user can only delete their own)
    const { error } = await supabase
      .from('quick_phrases')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting quick phrase:', error);
      return NextResponse.json(
        { error: 'Error al eliminar frase rápida' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Frase eliminada correctamente' });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/quick-phrases/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
