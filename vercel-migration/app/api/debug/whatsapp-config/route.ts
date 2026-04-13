import { createClient } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Endpoint de debug para verificar configuración de WhatsApp
 * URL: /api/debug/whatsapp-config
 */
export async function GET() {
  try {
    const supabase = createClient();
    
    // Obtener usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({
        error: 'No autenticado',
        details: userError?.message
      }, { status: 401 });
    }

    // Obtener configuración de WhatsApp
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, whatsapp_enabled, whatsapp_phone_number_id, whatsapp_business_account_id, whatsapp_access_token')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({
        error: 'Error consultando perfil',
        details: profileError.message
      }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({
        error: 'No se encontró perfil',
        user_id: user.id
      }, { status: 404 });
    }

    // Verificar configuración
    const checks = {
      '✅ Usuario autenticado': user.id,
      '🔧 WhatsApp habilitado': profile.whatsapp_enabled ? '✅ Sí' : '❌ NO',
      '📱 Phone Number ID': profile.whatsapp_phone_number_id || '❌ NO CONFIGURADO',
      '🏢 Business Account ID': profile.whatsapp_business_account_id || '⚠️ Opcional',
      '🔑 Access Token': profile.whatsapp_access_token 
        ? `✅ Configurado (${profile.whatsapp_access_token.length} caracteres, empieza con: ${profile.whatsapp_access_token.substring(0, 10)}...)`
        : '❌ NO CONFIGURADO',
      '🌍 Variables de entorno': {
        'ANTHROPIC_API_KEY': process.env.ANTHROPIC_API_KEY ? '✅ Configurada' : '❌ FALTANTE',
        'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ FALTANTE',
        'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ FALTANTE'
      }
    };

    // Diagnóstico
    const issues = [];
    if (!profile.whatsapp_enabled) issues.push('⚠️ WhatsApp no está habilitado');
    if (!profile.whatsapp_phone_number_id) issues.push('❌ Falta Phone Number ID');
    if (!profile.whatsapp_access_token) issues.push('❌ Falta Access Token');
    if (!process.env.ANTHROPIC_API_KEY) issues.push('❌ Falta ANTHROPIC_API_KEY en Vercel');

    return NextResponse.json({
      status: issues.length === 0 ? '✅ Todo configurado correctamente' : '⚠️ Hay problemas',
      checks,
      issues: issues.length > 0 ? issues : ['✅ Sin problemas detectados'],
      next_steps: issues.length > 0 
        ? [
            'Ve a https://agendamedpro.com/dashboard/settings/whatsapp',
            'Completa la configuración con el wizard',
            'Guarda los cambios',
            'Verifica las variables de entorno en Vercel'
          ]
        : [
            'Configuración OK',
            'Envía un mensaje de WhatsApp al número configurado',
            'Revisa los logs en Vercel → Functions → /api/webhooks/whatsapp'
          ]
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Error inesperado',
      details: error.message
    }, { status: 500 });
  }
}
