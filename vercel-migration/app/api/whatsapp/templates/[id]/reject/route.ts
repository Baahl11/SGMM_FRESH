import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/whatsapp/templates/[id]/reject
 * Manually mark template as rejected (if Meta rejected it)
 */
export async function POST(request: Request, context: RouteParams) {
  const params = await context.params;
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { rejection_reason } = body;

    if (!rejection_reason) {
      return NextResponse.json(
        { error: 'rejection_reason es requerida' },
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

    // Only pending templates can be rejected
    if (template.status !== 'pending') {
      return NextResponse.json(
        { error: 'Solo puedes rechazar templates en estado pending' },
        { status: 400 }
      );
    }

    // Mark as rejected
    const { data: updatedTemplate, error: updateError } = await supabase
      .from('whatsapp_templates')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejection_reason,
        meta_template_id: null,
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error rejecting template:', updateError);
      return NextResponse.json(
        { error: 'Error al marcar template como rejected' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      template: updatedTemplate,
      message: 'Template marcado como rechazado. Puedes editarlo y volver a enviarlo.',
    });
  } catch (error) {
    console.error('Error in POST /api/whatsapp/templates/[id]/reject:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
