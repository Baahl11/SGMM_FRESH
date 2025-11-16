import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-server';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/whatsapp/templates/[id]
 * Get single template by ID
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: template, error } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error || !template) {
      return NextResponse.json(
        { error: 'Template no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error in GET /api/whatsapp/templates/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/whatsapp/templates/[id]
 * Update template (only if status is 'draft' or 'rejected')
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabase = await createClient();

    // Check if template exists and is editable
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('whatsapp_templates')
      .select('status')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingTemplate) {
      return NextResponse.json(
        { error: 'Template no encontrado' },
        { status: 404 }
      );
    }

    // Only allow editing draft or rejected templates
    if (!['draft', 'rejected'].includes(existingTemplate.status)) {
      return NextResponse.json(
        { error: 'Solo puedes editar templates en estado draft o rejected' },
        { status: 400 }
      );
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

    // Same validations as POST
    if (name) {
      const nameRegex = /^[a-z0-9_]+$/;
      if (!nameRegex.test(name)) {
        return NextResponse.json(
          { error: 'El nombre debe ser lowercase, sin espacios (usa guion bajo)' },
          { status: 400 }
        );
      }

      if (name.length > 512) {
        return NextResponse.json(
          { error: 'El nombre no puede tener más de 512 caracteres' },
          { status: 400 }
        );
      }
    }

    if (body_text && body_text.length > 1024) {
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

    if (category) {
      const validCategories = ['MARKETING', 'UTILITY', 'AUTHENTICATION'];
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: 'Categoría inválida' },
          { status: 400 }
        );
      }
    }

    if (buttons && Array.isArray(buttons) && buttons.length > 3) {
      return NextResponse.json(
        { error: 'Máximo 3 botones permitidos' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (language !== undefined) updateData.language = language;
    if (header_type !== undefined) updateData.header_type = header_type;
    if (header_text !== undefined) updateData.header_text = header_text;
    if (header_media_url !== undefined) updateData.header_media_url = header_media_url;
    if (body_text !== undefined) updateData.body_text = body_text;
    if (footer_text !== undefined) updateData.footer_text = footer_text;
    if (buttons !== undefined) updateData.buttons = buttons;

    const { data: template, error } = await supabase
      .from('whatsapp_templates')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating template:', error);
      return NextResponse.json(
        { error: 'Error al actualizar template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error in PUT /api/whatsapp/templates/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/whatsapp/templates/[id]
 * Delete template (only if not approved)
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabase = await createClient();

    // Check if template is approved
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('whatsapp_templates')
      .select('status')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingTemplate) {
      return NextResponse.json(
        { error: 'Template no encontrado' },
        { status: 404 }
      );
    }

    if (existingTemplate.status === 'approved') {
      return NextResponse.json(
        { error: 'No puedes eliminar un template aprobado. Contacta a Meta para deshabilitarlo.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('whatsapp_templates')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting template:', error);
      return NextResponse.json(
        { error: 'Error al eliminar template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/whatsapp/templates/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
