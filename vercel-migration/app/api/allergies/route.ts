/**
 * API Route: Patient Allergies
 * Manages patient allergies per NOM-004-SSA3-2012
 * GET: List patient allergies
 * POST: Create new allergy
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { createClient } from '@/lib/supabase/server';
import { 
  validateAllergy, 
  type CreateAllergyDTO 
} from '@/lib/types/medical-history';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patient_id = searchParams.get('patient_id');

    if (!patient_id) {
      return NextResponse.json({ error: 'patient_id es requerido' }, { status: 400 });
    }

    // Fetch allergies ordered by creation date (newest first)
    const { data, error } = await supabase
      .from('patient_allergies')
      .select('*')
      .eq('patient_id', patient_id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching allergies:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/allergies:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: CreateAllergyDTO = await request.json();
    const validation = validateAllergy(body);
    
    if (!validation.valid) {
      return NextResponse.json({ 
        error: 'Validación fallida', 
        details: validation.errors 
      }, { status: 400 });
    }

    const dataToInsert = {
      ...body,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from('patient_allergies')
      .insert(dataToInsert)
      .select()
      .single();

    if (error) {
      console.error('Error creating allergy:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/allergies:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

