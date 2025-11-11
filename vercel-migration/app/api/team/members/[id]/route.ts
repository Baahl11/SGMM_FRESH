/**
 * API Route: /api/team/members/[id]
 * GET: Get team member details
 * PATCH: Update team member
 * DELETE: Remove team member
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { UpdateTeamMemberInput } from '@/lib/types/team';
import { ROLE_PERMISSIONS } from '@/lib/types/team';

// GET /api/team/members/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = params;

    const { data: member, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', id)
      .eq('owner_user_id', user.id)
      .single();

    if (error || !member) {
      return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 });
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error('❌ Error in GET /api/team/members/[id]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// PATCH /api/team/members/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = params;
    const body: UpdateTeamMemberInput = await request.json();

    console.log('🔄 Updating team member:', id, body);

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', id)
      .eq('owner_user_id', user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Miembro no encontrado o sin permisos' }, { status: 404 });
    }

    // Prepare update object
    const updates: any = {};

    if (body.role) {
      updates.role = body.role;
      // Update permissions based on new role
      updates.permissions = ROLE_PERMISSIONS[body.role];
    }

    if (body.status) {
      updates.status = body.status;
    }

    if (body.location_id !== undefined) {
      updates.location_id = body.location_id;
    }

    if (body.permissions) {
      // Merge custom permissions with existing
      updates.permissions = {
        ...(existing.permissions || {}),
        ...body.permissions,
      };
    }

    // Update team member
    const { data: updated, error: updateError } = await supabase
      .from('team_members')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating team member:', updateError);
      return NextResponse.json({ error: 'Error al actualizar miembro' }, { status: 500 });
    }

    console.log('✅ Team member updated:', updated.id);

    return NextResponse.json({
      message: 'Miembro actualizado exitosamente',
      member: updated,
    });

  } catch (error) {
    console.error('❌ Unexpected error in PATCH /api/team/members/[id]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// DELETE /api/team/members/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = params;

    console.log('🗑️  Removing team member:', id);

    // Verify ownership before delete
    const { data: existing, error: fetchError } = await supabase
      .from('team_members')
      .select('member_email')
      .eq('id', id)
      .eq('owner_user_id', user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Miembro no encontrado o sin permisos' }, { status: 404 });
    }

    // Delete team member
    const { error: deleteError } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ Error deleting team member:', deleteError);
      return NextResponse.json({ error: 'Error al eliminar miembro' }, { status: 500 });
    }

    console.log('✅ Team member removed:', existing.member_email);

    return NextResponse.json({
      message: 'Miembro eliminado exitosamente',
    });

  } catch (error) {
    console.error('❌ Unexpected error in DELETE /api/team/members/[id]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
