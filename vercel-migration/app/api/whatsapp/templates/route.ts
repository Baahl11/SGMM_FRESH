import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-server';

/**
 * GET /api/whatsapp/templates
 * Get all WhatsApp templates for current user
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: templates, error } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json(
        { error: 'Error al obtener templates' },
        { status: 500 }
      );
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error in GET /api/whatsapp/templates:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/whatsapp/templates
 * Create a new WhatsApp template (draft)
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      category,
      language,
      header_type,
      header_text,
      header_media_url,
      body_text,
      footer_text,
      buttons,
    } = body;

    // Validaciones
    if (!name || !category || !body_text) {
      return NextResponse.json(
        { error: 'Nombre, categoría y texto del cuerpo son requeridos' },
        { status: 400 }
      );
    }

    // Validar formato del nombre (lowercase, sin espacios)
    const nameRegex = /^[a-z0-9_]+$/;
    if (!nameRegex.test(name)) {
      return NextResponse.json(
        { error: 'El nombre debe ser lowercase, sin espacios (usa guion bajo)' },
        { status: 400 }
      );
    }

    // Validar longitud
    if (name.length > 512) {
      return NextResponse.json(
        { error: 'El nombre no puede tener más de 512 caracteres' },
        { status: 400 }
      );
    }

    if (body_text.length > 1024) {
      return NextResponse.json(
        { error: 'El texto del cuerpo no puede tener más de 1024 caracteres' },
        { status: 400 }
      );
    }

    if (header_text && header_text.length > 60) {
      return NextResponse.json(
        { error: 'El encabezado no puede tener más de 60 caracteres' },
        { status: 400 }
      );
    }

    if (footer_text && footer_text.length > 60) {
      return NextResponse.json(
        { error: 'El pie de página no puede tener más de 60 caracteres' },
        { status: 400 }
      );
    }

    // Validar categoría
    const validCategories = ['MARKETING', 'UTILITY', 'AUTHENTICATION'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Categoría inválida. Debe ser MARKETING, UTILITY o AUTHENTICATION' },
        { status: 400 }
      );
    }

    // Validar botones (max 3 quick reply o 2 call-to-action)
    if (buttons && Array.isArray(buttons)) {
      if (buttons.length > 3) {
        return NextResponse.json(
          { error: 'Máximo 3 botones permitidos' },
          { status: 400 }
        );
      }

      for (const button of buttons) {
        if (!button.type || !button.text) {
          return NextResponse.json(
            { error: 'Cada botón debe tener type y text' },
            { status: 400 }
          );
        }

        if (button.text.length > 20) {
          return NextResponse.json(
            { error: 'El texto del botón no puede tener más de 20 caracteres' },
            { status: 400 }
          );
        }
      }
    }

    const supabase = await createClient();

    const { data: template, error } = await supabase
      .from('whatsapp_templates')
      .insert([
        {
          user_id: user.id,
          name,
          category,
          language: language || 'es_MX',
          header_type,
          header_text,
          header_media_url,
          body_text,
          footer_text,
          buttons: buttons || null,
          status: 'draft',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      
      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Ya existe un template con ese nombre' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Error al crear template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/whatsapp/templates:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
