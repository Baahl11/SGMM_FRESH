import { NextRequest, NextResponse } from 'next/server';
import { createClient, supabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/messaging/test-send
 * Endpoint simple para probar envío de SMS
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { phone, message } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { error: 'phone y message son requeridos' },
        { status: 400 }
      );
    }

    // 1. Buscar el provider SMS activo del usuario
    const { data: provider, error: providerError } = await supabase
      .from('messaging_providers')
      .select('*')
      .eq('user_id', user.id)
      .eq('channel', 'sms')
      .single();

    if (providerError || !provider) {
      return NextResponse.json(
        { error: 'No se encontró provider SMS configurado. Guarda tus credenciales en Configuración → Mensajería y vuelve a intentar.' },
        { status: 400 }
      );
    }

    // Usar admin client para operaciones que requieren bypass RLS

    if (provider.status !== 'active') {
      console.warn('Provider con estado no activo', provider.status);
    }

    // 2. Crear el mensaje
    const { data: messageRecord, error: messageError } = await supabaseAdmin
      .from('messaging_messages')
      .insert({
        user_id: user.id,
        provider_id: provider.id,
        channel: 'sms',
        provider: provider.provider,
        to_contact: {
          phone,
          name: 'Prueba desde UI'
        },
        body: message,
        status: 'queued'
      })
      .select()
      .single();

    if (messageError) {
      return NextResponse.json(
        { error: 'Error al crear mensaje', details: messageError.message },
        { status: 500 }
      );
    }

    // 3. Crear el job para procesarlo
    const runAt = new Date();
    const { data: job, error: jobError } = await supabaseAdmin
      .from('messaging_jobs')
      .insert({
        message_id: messageRecord.id,
        run_at: runAt.toISOString(),
        status: 'pending',
        attempts: 0
      })
      .select()
      .single();

    if (jobError) {
      return NextResponse.json(
        { error: 'Error al crear job', details: jobError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: messageRecord,
      job,
      info: 'Mensaje encolado. El worker lo procesará en menos de 60 segundos.'
    });

  } catch (error: any) {
    console.error('Error en test-send:', error);
    return NextResponse.json(
      { error: 'Error interno', details: error.message },
      { status: 500 }
    );
  }
}
