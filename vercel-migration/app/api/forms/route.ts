import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/forms - Listar formularios del doctor
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { data: forms, error } = await supabase
      .from('intake_forms')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching forms:', error);
      return NextResponse.json(
        { error: 'Error al obtener formularios' },
        { status: 500 }
      );
    }

    return NextResponse.json({ forms: forms || [] });
  } catch (error) {
    console.error('Unexpected error in GET /api/forms:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/forms - Crear nuevo formulario
export async function POST(request: Request) {
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

    // Validación
    if (!body.name || !body.fields || !Array.isArray(body.fields)) {
      return NextResponse.json(
        { error: 'Nombre y campos son requeridos' },
        { status: 400 }
      );
    }

    const formData = {
      user_id: user.id,
      name: body.name,
      description: body.description || null,
      category: body.category || null,
      fields: body.fields,
      require_signature: body.require_signature || false,
      allow_file_upload: body.allow_file_upload || false,
      multi_language: body.multi_language || false,
      active: body.active !== undefined ? body.active : true,
    };

    const { data: newForm, error } = await supabase
      .from('intake_forms')
      .insert(formData)
      .select()
      .single();

    if (error) {
      console.error('Error creating form:', error);
      return NextResponse.json(
        { error: 'Error al crear formulario' },
        { status: 500 }
      );
    }

    return NextResponse.json({ form: newForm }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/forms:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
