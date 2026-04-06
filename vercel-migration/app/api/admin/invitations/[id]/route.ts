/**
 * API Route: /api/admin/invitations/[id]
 * PATCH: Resend or cancel invitation
 * DELETE: Delete invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Helper to check if user is admin
async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', userId)
    .single();
  
  if (error || !profile) {
    console.error('Error checking admin role:', error);
    return false;
  }
  
  return profile.role === 'admin';
}

// PATCH /api/admin/invitations/[id] - Resend or cancel
export async function PATCH(request: NextRequest, context: RouteParams) {
  const params = await context.params;
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Check admin permission
    if (!(await isAdmin(supabase, user.id))) {
      return NextResponse.json({ error: 'Requiere permisos de administrador' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { action } = body; // 'resend' or 'cancel'

    // Get invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 });
    }

    if (action === 'resend') {
      // Only resend if pending
      if (invitation.status !== 'pending') {
        return NextResponse.json({ 
          error: 'Solo se pueden reenviar invitaciones pendientes' 
        }, { status: 400 });
      }

      // Update sent count and last sent
      const { data: updated, error } = await supabase
        .from('invitations')
        .update({
          sent_count: invitation.sent_count + 1,
          last_sent_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating invitation:', error);
        return NextResponse.json({ error: 'Error al reenviar invitación' }, { status: 500 });
      }

      // Send email again
      const signupUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://agendamedpro.com'}/signup/${invitation.token}`;

      if (process.env.RESEND_API_KEY) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: 'AgendaMedPro <invitaciones@agendamedpro.com>',
            to: invitation.email,
            subject: '🔔 Recordatorio: Tu Invitación a AgendaMedPro',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #10b981;">¡Hola ${invitation.name}!</h1>
                <p>Te recordamos que tienes una invitación pendiente para unirte a <strong>AgendaMedPro</strong>.</p>
                <p>Tu plan: <strong>${invitation.plan_type || 'Premium'}</strong></p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${signupUrl}" style="background-color: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    Crear mi Cuenta
                  </a>
                </div>
                <p style="color: #666; font-size: 14px;">No pierdas esta oportunidad. El enlace expira pronto.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px;">AgendaMedPro - Gestión Médica Profesional</p>
              </div>
            `
          });
        } catch (emailError) {
          console.error('Error resending invitation email:', emailError);
        }
      }

      return NextResponse.json({ 
        invitation: updated,
        signup_url: signupUrl,
        message: 'Invitación reenviada exitosamente'
      });

    } else if (action === 'cancel') {
      // Cancel invitation
      const { data: updated, error } = await supabase
        .from('invitations')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error cancelling invitation:', error);
        return NextResponse.json({ error: 'Error al cancelar invitación' }, { status: 500 });
      }

      return NextResponse.json({ 
        invitation: updated,
        message: 'Invitación cancelada exitosamente'
      });

    } else {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
    }

  } catch (error) {
    console.error('Unexpected error in PATCH /api/admin/invitations/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE /api/admin/invitations/[id] - Delete invitation
export async function DELETE(request: NextRequest, context: RouteParams) {
  const params = await context.params;
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Check admin permission
    if (!(await isAdmin(supabase, user.id))) {
      return NextResponse.json({ error: 'Requiere permisos de administrador' }, { status: 403 });
    }

    const { id } = params;

    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting invitation:', error);
      return NextResponse.json({ error: 'Error al eliminar invitación' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Unexpected error in DELETE /api/admin/invitations/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
