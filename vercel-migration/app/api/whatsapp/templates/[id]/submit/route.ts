import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-server';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/whatsapp/templates/[id]/submit
 * Submit template to Meta for approval
 * 
 * NOTA: Este endpoint marca el template como "pending" pero NO envía
 * automáticamente a Meta. El doctor debe hacer el submit manualmente
 * en Meta Business Manager.
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get template
    const { data: template, error: fetchError } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !template) {
      return NextResponse.json(
        { error: 'Template no encontrado' },
        { status: 404 }
      );
    }

    // Validate template is in draft or rejected status
    if (!['draft', 'rejected'].includes(template.status)) {
      return NextResponse.json(
        { error: 'Solo puedes enviar templates en estado draft o rejected' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!template.body_text) {
      return NextResponse.json(
        { error: 'El template debe tener un cuerpo de mensaje' },
        { status: 400 }
      );
    }

    // Get WhatsApp config to provide instructions
    const { data: whatsappConfig } = await supabase
      .from('messaging_config')
      .select('whatsapp_business_id')
      .eq('user_id', user.id)
      .single();

    if (!whatsappConfig?.whatsapp_business_id) {
      return NextResponse.json(
        { error: 'Debes configurar WhatsApp Business primero en Ajustes → WhatsApp' },
        { status: 400 }
      );
    }

    // Mark as pending (user will submit manually to Meta)
    const { data: updatedTemplate, error: updateError } = await supabase
      .from('whatsapp_templates')
      .update({
        status: 'pending',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating template status:', updateError);
      return NextResponse.json(
        { error: 'Error al marcar template como pending' },
        { status: 500 }
      );
    }

    // Generate Meta Business Manager URL
    const metaUrl = `https://business.facebook.com/wa/manage/message-templates/?waba_id=${whatsappConfig.whatsapp_business_id}`;

    return NextResponse.json({
      template: updatedTemplate,
      instructions: {
        step1: 'Abre Meta Business Manager',
        step2: 'Ve a WhatsApp → Message Templates',
        step3: 'Crea un nuevo template con estos datos:',
        template_data: {
          name: updatedTemplate.name,
          category: updatedTemplate.category,
          language: updatedTemplate.language,
          header: updatedTemplate.header_text || updatedTemplate.header_type,
          body: updatedTemplate.body_text,
          footer: updatedTemplate.footer_text,
          buttons: updatedTemplate.buttons,
        },
        step4: 'Envía para aprobación',
        step5: 'Una vez aprobado, marca el template como "approved" aquí',
        meta_url: metaUrl,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/whatsapp/templates/[id]/submit:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
