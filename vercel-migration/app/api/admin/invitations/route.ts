/**
 * API Route: /api/admin/invitations
 * GET: List all invitations (admin only)
 * POST: Create new invitation and send email (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { CreateInvitationInput } from '@/lib/types/invitations';
import crypto from 'crypto';

// Helper to check if user is admin
async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  console.log('🔍 Checking admin for userId:', userId);
  
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', userId)
    .single();
  
  console.log('📊 Profile query result:', { profile, error });
  
  if (error || !profile) {
    console.error('❌ Error checking admin role:', error);
    return false;
  }
  
  console.log('✅ User role:', profile.role);
  return profile.role === 'admin';
}

// GET /api/admin/invitations - List all invitations
export async function GET(request: NextRequest) {
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

    // Get query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // Filter by status
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('invitations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: invitations, error, count } = await query;

    if (error) {
      console.error('Error fetching invitations:', error);
      return NextResponse.json({ error: 'Error al cargar invitaciones' }, { status: 500 });
    }

    return NextResponse.json({
      invitations: invitations || [],
      total: count || 0,
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/admin/invitations:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/admin/invitations - Create invitation
export async function POST(request: NextRequest) {
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

    const body: CreateInvitationInput = await request.json();

    // Validate required fields
    if (!body.email || !body.name) {
      return NextResponse.json({ error: 'Email y nombre son requeridos' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser?.users.some(u => u.email === body.email);
    
    if (userExists) {
      return NextResponse.json({ error: 'Este email ya tiene una cuenta' }, { status: 400 });
    }

    // Check if there's a pending invitation
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('*')
      .eq('email', body.email)
      .eq('status', 'pending')
      .single();

    if (existingInvitation) {
      return NextResponse.json({ 
        error: 'Ya existe una invitación pendiente para este email' 
      }, { status: 400 });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');

    // Calculate expiry date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const { data: invitation, error } = await supabase
      .from('invitations')
      .insert({
        email: body.email.toLowerCase(),
        name: body.name,
        token,
        invited_by: user.id,
        plan_type: body.plan_type || 'premium',
        notes: body.notes,
        expires_at: expiresAt.toISOString(),
        sent_count: 1,
        last_sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invitation:', error);
      return NextResponse.json({ error: 'Error al crear invitación' }, { status: 500 });
    }

    // TODO: Send email (implement with Resend)
    // For now, we'll just return the invitation with signup URL
    const signupUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/signup/${token}`;

    return NextResponse.json({ 
      invitation,
      signup_url: signupUrl,
      message: 'Invitación creada exitosamente'
    });

  } catch (error) {
    console.error('Unexpected error in POST /api/admin/invitations:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
