/**
 * API Route: /api/invitations/accept
 * POST: Accept invitation and create user account
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, supabaseAdmin } from '@/lib/supabase/server';
import type { AcceptInvitationInput } from '@/lib/types/invitations';

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 POST /api/invitations/accept - Starting');
    const supabase = await createClient();
    const body: AcceptInvitationInput = await request.json();
    console.log('📥 Request body:', { token: body.token, hasPassword: !!body.password });

    // Validate required fields
    if (!body.token || !body.password) {
      console.log('❌ Missing required fields');
      return NextResponse.json({ error: 'Token y contraseña son requeridos' }, { status: 400 });
    }

    // Validate password strength
    if (body.password.length < 8) {
      console.log('❌ Password too short');
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 });
    }

    // Find and validate invitation
    console.log('🔍 Looking for invitation with token:', body.token);
    const { data: invitation, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', body.token)
      .single();

    console.log('📊 Invitation query result:', { invitation, invError });

    if (invError || !invitation) {
      console.log('❌ Invitation not found');
      return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 });
    }

    // Check status
    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Esta invitación ya no es válida' }, { status: 400 });
    }

    // Check expiry
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    if (now > expiresAt) {
      await supabase
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);
      
      return NextResponse.json({ error: 'Esta invitación ha expirado' }, { status: 400 });
    }

    // Create user with Supabase Auth
    console.log('👤 Creating user account for:', invitation.email);
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: invitation.email,
      password: body.password,
      options: {
        data: {
          name: invitation.name,
          plan_type: invitation.plan_type,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
      },
    });

    console.log('📊 SignUp result:', { 
      hasUser: !!authData?.user, 
      userId: authData?.user?.id,
      error: signUpError 
    });

    if (signUpError) {
      console.error('❌ Error creating user:', signUpError);
      
      if (signUpError.message.includes('already registered')) {
        return NextResponse.json({ error: 'Este email ya está registrado' }, { status: 400 });
      }
      
      return NextResponse.json({ error: 'Error al crear cuenta: ' + signUpError.message }, { status: 500 });
    }

    if (!authData.user) {
      console.error('❌ No user returned from signUp');
      return NextResponse.json({ error: 'Error al crear cuenta' }, { status: 500 });
    }

    // Update invitation status (use admin client to bypass RLS)
    console.log('✅ Updating invitation status to accepted');
    const { error: updateError } = await supabaseAdmin
      .from('invitations')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('⚠️ Error updating invitation:', updateError);
    }

    // Create user profile (use admin client to bypass RLS)
    console.log('👤 Creating user profile');
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        name: invitation.name,
        email: invitation.email,
        plan_type: invitation.plan_type,
        role: 'user', // Regular users, NOT admin
      });

    if (profileError) {
      console.error('⚠️ Error creating user profile:', profileError);
      // If profile already exists, that's ok
      if (!profileError.message?.includes('duplicate')) {
        console.error('⚠️ Unexpected profile error, but continuing');
      }
    } else {
      console.log('✅ User profile created successfully');
    }

    console.log('✅ Account creation completed successfully');
    return NextResponse.json({ 
      success: true,
      message: '¡Cuenta creada exitosamente!',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: invitation.name,
      }
    });

  } catch (error) {
    console.error('Unexpected error in POST /api/invitations/accept:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
