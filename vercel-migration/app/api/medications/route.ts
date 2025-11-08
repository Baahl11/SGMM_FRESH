/**
 * API Route: Current Medications
 * Manages patient's current medications per NOM-004-SSA3-2012
 * GET: List patient medications (filter by active)
 * POST: Create new medication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { createClient } from '@/lib/supabase/server';
import { 
  validateMedication, 
  type CreateMedicationDTO 
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
    const active_only = searchParams.get('active') === 'true';

    if (!patient_id) {
      return NextResponse.json({ error: 'patient_id es requerido' }, { status: 400 });
    }

    let query = supabase
      .from('current_medications')
      .select('*')
      .eq('patient_id', patient_id)
      .eq('user_id', user.id);

    if (active_only) {
      query = query.eq('activo', true);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching medications:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/medications:', error);
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

    const body: CreateMedicationDTO = await request.json();
    const validation = validateMedication(body);
    
    if (!validation.valid) {
      return NextResponse.json({ 
        error: 'Validación fallida', 
        details: validation.errors 
      }, { status: 400 });
    }

    const dataToInsert = {
      ...body,
      user_id: user.id,
      activo: body.activo !== undefined ? body.activo : true, // Default to active
    };

    const { data, error } = await supabase
      .from('current_medications')
      .insert(dataToInsert)
      .select()
      .single();

    if (error) {
      console.error('Error creating medication:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/medications:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

