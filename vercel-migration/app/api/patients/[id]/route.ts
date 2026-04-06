import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      console.error('❌ Unauthorized: No user found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const supabase = await createClient();
    const { id } = await params;

    // Fetch patient with RLS (will automatically filter by user_id)
    const { data: patient, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { error: 'Patient not found', details: error.message },
        { status: 404 }
      );
    }

    // No transformation needed - Supabase fields are already in Spanish
    return NextResponse.json(patient);
  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) {
      console.error('❌ Unauthorized: No user found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Use correct field names - Supabase fields are in Spanish
    const updateData = {
      nombre: body.nombre,
      apellido: body.apellido,
      fecha_nacimiento: body.fecha_nacimiento,
      telefono: body.telefono,
      email: body.email,
      direccion: body.direccion,
      notas: body.notas,
      updated_at: new Date().toISOString()
    }

    const { data: patient, error } = await supabase
      .from('patients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { error: 'Error updating patient', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      console.error('❌ Unauthorized: No user found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const supabase = await createClient();
    const { id } = await params;

    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { error: 'Error deleting patient', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}