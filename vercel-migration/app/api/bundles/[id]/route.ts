import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: bundle, error } = await supabase
      .from('bundles')
      .select(`
        *,
        bundle_treatments (
          id,
          cantidad,
          precio_individual,
          treatment:treatments (
            id,
            nombre,
            precio_base
          )
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching bundle:', error);
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
    }

    // Format response
    const formattedBundle = {
      ...bundle,
      tratamientos: bundle.bundle_treatments?.map((bt: any) => ({
        id: bt.treatment?.id,
        nombre: bt.treatment?.nombre,
        precio: bt.precio_individual ?? bt.treatment?.precio_base,
        cantidad: bt.cantidad
      })).filter((t: any) => t.id) || []
    };

    return NextResponse.json(formattedBundle);

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, descripcion, precio_total, tratamientos, descuento_porcentaje, activo } = body;

    if (!nombre || precio_total === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update the bundle
    const { data: bundle, error: bundleError } = await supabase
      .from('bundles')
      .update({
        nombre,
        descripcion: descripcion || null,
        precio_total,
        descuento_porcentaje: descuento_porcentaje || 0,
        activo: activo !== undefined ? activo : true
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (bundleError) {
      console.error('Error updating bundle:', bundleError);
      return NextResponse.json({ error: 'Error updating bundle' }, { status: 500 });
    }

    // Delete existing treatments and re-add
    await supabase
      .from('bundle_treatments')
      .delete()
      .eq('bundle_id', id);

    // Add treatments if provided
    if (tratamientos && tratamientos.length > 0) {
      const bundleTreatments = tratamientos.map((t: any) => ({
        bundle_id: id,
        treatment_id: t.id,
        cantidad: t.cantidad || 1,
        precio_individual: t.precio || null
      }));

      await supabase
        .from('bundle_treatments')
        .insert(bundleTreatments);
    }

    return NextResponse.json(bundle);

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Bundle treatments will be deleted by CASCADE
    const { error } = await supabase
      .from('bundles')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting bundle:', error);
      return NextResponse.json({ error: 'Error deleting bundle' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
