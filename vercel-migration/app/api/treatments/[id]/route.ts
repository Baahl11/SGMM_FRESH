import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { id } = params;

    const { data: treatment, error } = await supabase
      .from('treatments')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Treatment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(treatment);
  } catch (error: any) {
    console.error('[API:treatments/:id] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = params;
    const { nombre, descripcion, precio, costo_unitario, duracion_minutos, categoria, activo, category, tags } = body;

    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    const supabase = await createClient();

    // Build update object
    const updateData: any = {
      nombre,
      descripcion,
      precio_base: precio || 0,
      costo_unitario: costo_unitario || 0,
      duracion_minutos: duracion_minutos || 30,
      activo: activo !== undefined ? activo : true,
      updated_at: new Date().toISOString()
    };

    // Add category if provided (prefer 'category' over 'categoria')
    if (category !== undefined) {
      updateData.category = category;
    } else if (categoria !== undefined) {
      updateData.category = categoria;
    }

    // Add tags if provided
    if (tags !== undefined && Array.isArray(tags)) {
      updateData.tags = tags;
    }

    const { data: treatment, error } = await supabase
      .from('treatments')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) {
      console.error('[API:treatments/:id] Supabase update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(treatment);

  } catch (error: any) {
    console.error('[API:treatments/:id] Unhandled PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = params;

    const supabase = await createClient();

    const { data: treatment, error } = await supabase
      .from('treatments')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) {
      console.error('[API:treatments/:id] Supabase patch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(treatment);

  } catch (error: any) {
    console.error('[API:treatments/:id] Unhandled PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const supabase = await createClient();

    const { error } = await supabase
      .from('treatments')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[API:treatments/:id] Supabase delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Treatment deleted successfully' 
    });

  } catch (error: any) {
    console.error('[API:treatments/:id] Unhandled DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}