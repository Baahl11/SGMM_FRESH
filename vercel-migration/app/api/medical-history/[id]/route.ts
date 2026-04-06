/**
 * API Route: Medical History by ID
 * Manages individual medical history record
 * GET: Fetch specific medical history
 * PUT: Update medical history
 * DELETE: Delete medical history
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { createClient } from '@/lib/supabase/server';
import { 
  validateMedicalHistory, 
  type UpdateMedicalHistoryDTO 
} from '@/lib/types/medical-history';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('medical_history')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/medical-history/[id]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: UpdateMedicalHistoryDTO = await request.json();
    
    // Partial validation (don't require all fields)
    const validation = validateMedicalHistory({
      patient_id: 'dummy', // Skip required field validation for updates
      user_id: user.id,
      ...body,
    });

    if (!validation.valid && body.menarca !== undefined) {
      // Only validate if specific fields are present
      return NextResponse.json({ 
        error: 'Validación fallida', 
        details: validation.errors 
      }, { status: 400 });
    }

    // Update medical history (RLS ensures only owner can update)
    const { data, error } = await supabase
      .from('medical_history')
      .update(body)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating medical history:', error);
      return NextResponse.json({ 
        error: error?.message || 'No encontrado' 
      }, { status: error ? 500 : 404 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error in PUT /api/medical-history/[id]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { error } = await supabase
      .from('medical_history')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting medical history:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Historia clínica eliminada' 
    }, { status: 200 });
  } catch (error) {
    console.error('Error in DELETE /api/medical-history/[id]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
