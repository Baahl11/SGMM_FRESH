import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: treatments, error } = await supabase
      .from('treatments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching treatments:', error);
      return NextResponse.json({ error: 'Error fetching treatments' }, { status: 500 });
    }

    return NextResponse.json(treatments || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, descripcion, precio, duracion_minutos, categoria, activo = true } = body;

    // Validate required fields (descripcion is optional)
    if (!nombre || precio === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: nombre, precio' },
        { status: 400 }
      );
    }

    // Insert new treatment with user_id (only fields that exist in the table)
    const { data: treatment, error } = await supabase
      .from('treatments')
      .insert([{
        nombre,
        descripcion: descripcion || null,
        precio_base: precio,
        duracion_minutos: duracion_minutos || 30,
        activo,
        user_id: user.id
      }])
      .select('*')
      .single();

    if (error) {
      console.error('Error creating treatment:', error);
      return NextResponse.json({ error: 'Error creating treatment' }, { status: 500 });
    }

    return NextResponse.json(treatment, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}