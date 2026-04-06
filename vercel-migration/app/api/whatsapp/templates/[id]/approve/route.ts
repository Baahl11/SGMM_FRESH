import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/whatsapp/templates/[id]/approve
 * Manually mark template as approved (after Meta approval)
 */
export async function POST(request: Request, context: RouteParams) {
  const params = await context.params;
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { meta_template_id } = body;

    if (!meta_template_id) {
      return NextResponse.json(
        { error: 'meta_template_id es requerido (obtén el ID desde Meta Business Manager)' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get template
    const { data: template, error: fetchError } = await supabase
      .from('whatsapp_templates')
      .select('status')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !template) {
      return NextResponse.json(
        { error: 'Template no encontrado' },
        { status: 404 }
      );
    }

    // Only pending templates can be approved
    if (template.status !== 'pending') {
      return NextResponse.json(
        { error: 'Solo puedes aprobar templates en estado pending' },
        { status: 400 }
      );
    }

    // Mark as approved
    const { data: updatedTemplate, error: updateError } = await supabase
      .from('whatsapp_templates')
      .update({
        status: 'approved',
        meta_template_id,
        approved_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error approving template:', updateError);
      return NextResponse.json(
        { error: 'Error al aprobar template' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      template: updatedTemplate,
      message: '¡Template aprobado! Ya puedes usarlo para enviar mensajes.',
    });
  } catch (error) {
    console.error('Error in POST /api/whatsapp/templates/[id]/approve:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
