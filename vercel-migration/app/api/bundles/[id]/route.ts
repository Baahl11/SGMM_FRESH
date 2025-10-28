import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('🔥 API: Updating bundle', params.id);
    
    const body = await request.json();
    const { nombre, descripcion, precio_total, tratamientos } = body;

    if (!nombre || !precio_total || !tratamientos?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update the bundle
    const { data: bundle, error: bundleError } = await supabase
      .from('bundles')
      .update({
        nombre,
        descripcion,
        precio_total
      })
      .eq('id', params.id)
      .select()
      .single();

    if (bundleError) {
      console.error('❌ Error updating bundle:', bundleError);
      return NextResponse.json({ error: 'Error updating bundle' }, { status: 500 });
    }

    // Delete existing relationships
    const { error: deleteError } = await supabase
      .from('bundle_treatments')
      .delete()
      .eq('bundle_id', params.id);

    if (deleteError) {
      console.error('❌ Error deleting old relationships:', deleteError);
      return NextResponse.json({ error: 'Error updating bundle relationships' }, { status: 500 });
    }

    // Create new relationships
    const bundleTreatments = tratamientos.map((treatment: any) => ({
      bundle_id: params.id,
      treatment_id: treatment.id
    }));

    const { error: relationError } = await supabase
      .from('bundle_treatments')
      .insert(bundleTreatments);

    if (relationError) {
      console.error('❌ Error creating new relationships:', relationError);
      return NextResponse.json({ error: 'Error updating bundle relationships' }, { status: 500 });
    }

    console.log('✅ Bundle updated successfully:', params.id);
    return NextResponse.json(bundle);

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('🔥 API: Deleting bundle', params.id);

    // Delete relationships first
    const { error: relationError } = await supabase
      .from('bundle_treatments')
      .delete()
      .eq('bundle_id', params.id);

    if (relationError) {
      console.error('❌ Error deleting relationships:', relationError);
      return NextResponse.json({ error: 'Error deleting bundle relationships' }, { status: 500 });
    }

    // Delete the bundle
    const { error: bundleError } = await supabase
      .from('bundles')
      .delete()
      .eq('id', params.id);

    if (bundleError) {
      console.error('❌ Error deleting bundle:', bundleError);
      return NextResponse.json({ error: 'Error deleting bundle' }, { status: 500 });
    }

    console.log('✅ Bundle deleted successfully:', params.id);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}