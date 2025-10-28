/**
 * API Route: /api/admin/invitations/[id]
 * PATCH: Resend or cancel invitation
 * DELETE: Delete invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: {
    id: string;
  };
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
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

      // TODO: Send email again
      const signupUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/signup/${invitation.token}`;

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
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
