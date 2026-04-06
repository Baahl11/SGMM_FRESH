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

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const tagsParam = searchParams.get('tags');

    // Start building query
    let query = supabase
      .from('treatments')
      .select('*')
      .eq('user_id', user.id);

    // Filter by category if provided
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    // Filter by tags if provided (comma-separated)
    if (tagsParam) {
      const tags = tagsParam.split(',').map(t => t.trim()).filter(Boolean);
      if (tags.length > 0) {
        // Use array overlap operator to find treatments with any of the tags
        query = query.overlaps('tags', tags);
      }
    }

    // Order by created_at
    query = query.order('created_at', { ascending: false });

    const { data: treatments, error } = await query;
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
    const { nombre, descripcion, precio, costo_unitario, duracion_minutos, categoria, activo = true, category, tags } = body;

    // Validate required fields (descripcion is optional)
    if (!nombre || precio === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: nombre, precio' },
        { status: 400 }
      );
    }

    // Start with absolute minimum fields that MUST exist
    const insertData: any = {
      nombre: nombre,
      user_id: user.id
    };

    // Add precio_base (the actual column name in DB, not precio)
    if (precio !== undefined && precio !== null) {
      insertData.precio_base = parseFloat(precio);
    }

    // Add optional fields only if they have values
    if (descripcion) {
      insertData.descripcion = descripcion;
    }
    if (costo_unitario !== undefined && costo_unitario !== null) {
      insertData.costo_unitario = parseFloat(costo_unitario);
    }
    if (duracion_minutos !== undefined && duracion_minutos !== null) {
      insertData.duracion_minutos = parseInt(duracion_minutos);
    }
    if (activo !== undefined) {
      insertData.activo = Boolean(activo);
    }
    if (category) {
      insertData.category = category;
    }
    if (tags && Array.isArray(tags)) {
      insertData.tags = tags;
    }
    // Insert new treatment with user_id
    const { data: treatment, error } = await supabase
      .from('treatments')
      .insert([insertData])
      .select('*')
      .single();

    if (error) {
      console.error('❌ Supabase error creating treatment:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json({ 
        error: 'Error creating treatment',
        details: error.message,
        hint: error.hint,
        code: error.code
      }, { status: 500 });
    }
    return NextResponse.json(treatment, { status: 201 });

  } catch (error: any) {
    console.error('💥 Unexpected error:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}