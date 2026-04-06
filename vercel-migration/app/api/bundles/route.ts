import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch bundles with their treatments
    const { data: bundles, error } = await supabase
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
            precio
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bundles:', error);
      return NextResponse.json({ error: 'Error fetching bundles' }, { status: 500 });
    }

    // Transform data to match expected format
    const formattedBundles = (bundles || []).map(bundle => ({
      ...bundle,
      tratamientos: bundle.bundle_treatments?.map((bt: any) => ({
        id: bt.treatment?.id,
        nombre: bt.treatment?.nombre,
        precio: bt.precio_individual || bt.treatment?.precio,
        cantidad: bt.cantidad
      })).filter((t: any) => t.id) || []
    }));

    return NextResponse.json(formattedBundles);

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, descripcion, precio_total, tratamientos, descuento_porcentaje } = body;

    if (!nombre || precio_total === undefined) {
      return NextResponse.json({ error: 'Missing required fields: nombre, precio_total' }, { status: 400 });
    }

    // Create the bundle
    const { data: bundle, error: bundleError } = await supabase
      .from('bundles')
      .insert({
        user_id: user.id,
        nombre,
        descripcion: descripcion || null,
        precio_total,
        descuento_porcentaje: descuento_porcentaje || 0,
        activo: true
      })
      .select()
      .single();

    if (bundleError) {
      console.error('Error creating bundle:', bundleError);
      return NextResponse.json({ error: 'Error creating bundle' }, { status: 500 });
    }

    // Add treatments to bundle if provided
    if (tratamientos && tratamientos.length > 0) {
      const bundleTreatments = tratamientos.map((t: any) => ({
        bundle_id: bundle.id,
        treatment_id: t.id,
        cantidad: t.cantidad || 1,
        precio_individual: t.precio || null
      }));

      const { error: treatmentsError } = await supabase
        .from('bundle_treatments')
        .insert(bundleTreatments);

      if (treatmentsError) {
        console.error('Error adding treatments to bundle:', treatmentsError);
        // Bundle was created, just log the error
      }
    }

    return NextResponse.json(bundle, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}