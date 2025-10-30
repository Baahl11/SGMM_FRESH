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
    console.log('📦 Received body:', JSON.stringify(body, null, 2));
    
    const { nombre, descripcion, precio, costo_unitario, duracion_minutos, categoria, activo = true } = body;

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

    console.log('💾 Attempting to insert:', JSON.stringify(insertData, null, 2));

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

    console.log('✅ Treatment created successfully:', treatment?.id);
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