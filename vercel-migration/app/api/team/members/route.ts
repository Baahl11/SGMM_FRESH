/**
 * API Route: /api/team/members
 * GET: List all team members for current user
 * POST: Invite new team member
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { InviteTeamMemberInput, TeamMember } from '@/lib/types/team';
import { ROLE_PERMISSIONS } from '@/lib/types/team';
import crypto from 'crypto';

// GET /api/team/members - List team members
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    console.log('📋 Fetching team members for user:', user.id);

    // Get team members where user is the owner
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select('*')
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: false });

    if (membersError) {
      console.error('❌ Error fetching team members:', membersError);
      return NextResponse.json({ 
        error: 'Error al cargar miembros del equipo',
        details: membersError.message 
      }, { status: 500 });
    }

    // Get subscription limits
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('max_doctors, plan_tier')
      .eq('user_id', user.id)
      .single();

    const max_allowed = subscription?.max_doctors || 2;
    const total_members = members?.length || 0;
    const active_members = members?.filter(m => m.status === 'active').length || 0;
    const pending_invitations = members?.filter(m => m.status === 'pending').length || 0;

    console.log('✅ Team stats:', {
      total_members,
      active_members,
      pending_invitations,
      max_allowed,
      plan: subscription?.plan_tier
    });

    return NextResponse.json({
      members: members || [],
      stats: {
        total_members,
        active_members,
        pending_invitations,
        max_allowed,
        can_invite_more: total_members < max_allowed,
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error in GET /api/team/members:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/team/members - Invite new member
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body: InviteTeamMemberInput = await request.json();
    const { email, role, location_id, custom_permissions } = body;

    // Validate input
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    if (!role || !['admin', 'doctor', 'receptionist', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
    }

    console.log('📧 Inviting team member:', { email, role, owner: user.id });

    // Check subscription limits
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('max_doctors, plan_tier')
      .eq('user_id', user.id)
      .single();

    const max_allowed = subscription?.max_doctors || 2;

    // Count existing members
    const { count: existingCount } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('owner_user_id', user.id);

    if ((existingCount || 0) >= max_allowed) {
      return NextResponse.json({
        error: `Has alcanzado el límite de ${max_allowed} miembros de tu plan ${subscription?.plan_tier?.toUpperCase() || 'BÁSICO'}. Actualiza tu plan para invitar más usuarios.`
      }, { status: 403 });
    }

    // Check if email is already invited
    const { data: existing } = await supabase
      .from('team_members')
      .select('id, status')
      .eq('owner_user_id', user.id)
      .eq('member_email', email)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'active') {
        return NextResponse.json({ error: 'Este usuario ya es miembro activo de tu equipo' }, { status: 400 });
      }
      if (existing.status === 'pending') {
        return NextResponse.json({ error: 'Ya existe una invitación pendiente para este email' }, { status: 400 });
      }
    }

    // Generate invitation token
    const invitation_token = crypto.randomBytes(32).toString('hex');

    // Get permissions for role
    const permissions = custom_permissions
      ? { ...ROLE_PERMISSIONS[role], ...custom_permissions }
      : ROLE_PERMISSIONS[role];

    // Create team member invitation
    const { data: newMember, error: insertError } = await supabase
      .from('team_members')
      .insert({
        owner_user_id: user.id,
        member_email: email,
        role,
        status: 'pending',
        invitation_token,
        location_id: location_id || null,
        permissions,
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creating team member:', insertError);
      return NextResponse.json({ error: 'Error al crear invitación' }, { status: 500 });
    }

    console.log('✅ Team member invitation created:', newMember.id);

    // TODO: Send invitation email
    // const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/team/accept?token=${invitation_token}`;
    // await sendInvitationEmail(email, invitationUrl);

    return NextResponse.json({
      message: 'Invitación enviada exitosamente',
      member: newMember,
      invitation_url: `/team/accept?token=${invitation_token}`, // For testing
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Unexpected error in POST /api/team/members:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
