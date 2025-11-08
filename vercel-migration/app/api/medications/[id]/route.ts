/**
 * API Route: Individual Medication
 * Manages single medication record
 * GET: Fetch specific medication
 * PUT: Update medication
 * PATCH: Toggle medication active status
 * DELETE: Delete medication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { createClient } from '@/lib/supabase/server';
import { 
  validateMedication, 
  type UpdateMedicationDTO 
} from '@/lib/types/medical-history';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('current_medications')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/medications/[id]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: UpdateMedicationDTO = await request.json();

    const { data, error } = await supabase
      .from('current_medications')
      .update(body)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating medication:', error);
      return NextResponse.json({ 
        error: error?.message || 'No encontrado' 
      }, { status: error ? 500 : 404 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error in PUT /api/medications/[id]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get current medication to toggle status
    const { data: current } = await supabase
      .from('current_medications')
      .select('activo')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (!current) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    // Toggle active status
    const { data, error } = await supabase
      .from('current_medications')
      .update({ activo: !current.activo })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !data) {
      console.error('Error toggling medication status:', error);
      return NextResponse.json({ 
        error: error?.message || 'No encontrado' 
      }, { status: error ? 500 : 404 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error in PATCH /api/medications/[id]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { error } = await supabase
      .from('current_medications')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting medication:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Medicamento eliminado' 
    }, { status: 200 });
  } catch (error) {
    console.error('Error in DELETE /api/medications/[id]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
