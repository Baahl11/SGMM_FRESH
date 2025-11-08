/**
 * API Route: Medical History
 * Manages complete medical history per NOM-004-SSA3-2012
 * GET: Fetch patient's medical history (one record per patient)
 * POST: Create medical history
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { createClient } from '@/lib/supabase/server';
import { 
  validateMedicalHistory, 
  type CreateMedicalHistoryDTO 
} from '@/lib/types/medical-history';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get patient_id from query params
    const { searchParams } = new URL(request.url);
    const patient_id = searchParams.get('patient_id');

    if (!patient_id) {
      return NextResponse.json({ error: 'patient_id es requerido' }, { status: 400 });
    }

    // Fetch medical history (single record per patient)
    const { data, error } = await supabase
      .from('medical_history')
      .select('*')
      .eq('patient_id', patient_id)
      .eq('user_id', user.id)
      .maybeSingle(); // Returns null if not found (not error)

    if (error) {
      console.error('Error fetching medical history:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/medical-history:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Parse and validate body
    const body: CreateMedicalHistoryDTO = await request.json();
    const validation = validateMedicalHistory(body);
    
    if (!validation.valid) {
      return NextResponse.json({ 
        error: 'Validación fallida', 
        details: validation.errors 
      }, { status: 400 });
    }

    // Ensure user_id matches authenticated user
    const dataToInsert = {
      ...body,
      user_id: user.id,
    };

    // Check if medical history already exists for this patient
    const { data: existing } = await supabase
      .from('medical_history')
      .select('id')
      .eq('patient_id', body.patient_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ 
        error: 'Ya existe una historia clínica para este paciente. Use PUT para actualizar.' 
      }, { status: 409 });
    }

    // Insert medical history
    const { data, error } = await supabase
      .from('medical_history')
      .insert(dataToInsert)
      .select()
      .single();

    if (error) {
      console.error('Error creating medical history:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/medical-history:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

