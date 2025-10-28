/**
 * API Route: /api/invitations/validate/[token]
 * GET: Validate invitation token (public)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: {
    token: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { token } = params;

    // Find invitation by token
    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !invitation) {
      return NextResponse.json({ 
        valid: false,
        error: 'Invitación no encontrada'
      }, { status: 404 });
    }

    // Check if already accepted
    if (invitation.status === 'accepted') {
      return NextResponse.json({ 
        valid: false,
        error: 'Esta invitación ya fue utilizada'
      }, { status: 400 });
    }

    // Check if cancelled
    if (invitation.status === 'cancelled') {
      return NextResponse.json({ 
        valid: false,
        error: 'Esta invitación fue cancelada'
      }, { status: 400 });
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    
    if (now > expiresAt) {
      // Auto-update status to expired
      await supabase
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return NextResponse.json({ 
        valid: false,
        error: 'Esta invitación ha expirado'
      }, { status: 400 });
    }

    // Valid invitation
    return NextResponse.json({ 
      valid: true,
      invitation: {
        email: invitation.email,
        name: invitation.name,
        plan_type: invitation.plan_type,
        expires_at: invitation.expires_at,
      }
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/invitations/validate/[token]:', error);
    return NextResponse.json({ 
      valid: false,
      error: 'Error al validar invitación'
    }, { status: 500 });
  }
}
