import { NextRequest, NextResponse } from 'next/server';

/**
 * AGENT: Reminder Automation - Cron Job
 * GET /api/agents/reminders/cron
 * 
 * Este endpoint debe ser llamado por un cron job (por ejemplo, cada hora)
 * Detecta citas próximas y envía recordatorios automáticamente
 * 
 * Query params:
 * ?secret=YOUR_CRON_SECRET
 */

export async function GET(req: NextRequest) {
  try {
    // Validar secret para seguridad
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    console.log('[Reminders Cron] Iniciando ejecución automática');

    const results: {
      reminders24h: Record<string, any> | null;
      reminders2h: Record<string, any> | null;
    } = {
      reminders24h: null,
      reminders2h: null
    };

    // 1. Enviar recordatorios de 24 horas
    try {
      const response24h = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/agents/reminders/send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CRON_SECRET}`
          },
          body: JSON.stringify({
            type: '24h',
            force: false
          })
        }
      );

      if (response24h.ok) {
        results.reminders24h = await response24h.json();
        console.log(`[Reminders Cron] 24h: ${results.reminders24h?.sent} enviados, ${results.reminders24h?.failed} fallidos`);
      }
    } catch (error: any) {
      console.error('[Reminders Cron] Error en recordatorios 24h:', error);
      results.reminders24h = { error: error.message };
    }

    // 2. Enviar recordatorios de 2 horas
    try {
      const response2h = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/agents/reminders/send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CRON_SECRET}`
          },
          body: JSON.stringify({
            type: '2h',
            force: false
          })
        }
      );

      if (response2h.ok) {
        results.reminders2h = await response2h.json();
        console.log(`[Reminders Cron] 2h: ${results.reminders2h?.sent} enviados, ${results.reminders2h?.failed} fallidos`);
      }
    } catch (error: any) {
      console.error('[Reminders Cron] Error en recordatorios 2h:', error);
      results.reminders2h = { error: error.message };
    }

    console.log('[Reminders Cron] Ejecución completada');

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    });

  } catch (error: any) {
    console.error('[Reminders Cron] Error general:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
