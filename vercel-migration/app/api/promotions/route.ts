import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/promotions - List all promotions with their treatments
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: promotions, error } = await supabase
      .from('promotions')
      .select(`
        *,
        promotion_treatments (
          id,
          cantidad,
          treatment:treatments (
            id,
            nombre,
            precio_base,
            costo_unitario
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching promotions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(promotions || []);
  } catch (error) {
    console.error('Error in GET /api/promotions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/promotions - Create a new promotion
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      nombre,
      descripcion,
      precio_total,
      descuento_porcentaje,
      activo = true,
      treatments = [] // Array of { treatment_id, cantidad }
    } = body;

    // Validate required fields
    if (!nombre || !precio_total) {
      return NextResponse.json(
        { error: 'Nombre y precio_total son requeridos' },
        { status: 400 }
      );
    }

    // Create promotion
    const { data: promotion, error: promotionError } = await supabase
      .from('promotions')
      .insert({
        nombre,
        descripcion,
        precio_total: parseFloat(precio_total),
        descuento_porcentaje: descuento_porcentaje ? parseFloat(descuento_porcentaje) : 0,
        activo
      })
      .select()
      .single();

    if (promotionError) {
      console.error('Error creating promotion:', promotionError);
      return NextResponse.json({ error: promotionError.message }, { status: 500 });
    }

    // Add treatments to promotion if provided
    if (treatments.length > 0) {
      const promotionTreatments = treatments.map((t: any) => ({
        promotion_id: promotion.id,
        treatment_id: t.treatment_id,
        cantidad: t.cantidad || 1
      }));

      const { error: treatmentsError } = await supabase
        .from('promotion_treatments')
        .insert(promotionTreatments);

      if (treatmentsError) {
        console.error('Error adding treatments to promotion:', treatmentsError);
        // Rollback: delete the promotion
        await supabase.from('promotions').delete().eq('id', promotion.id);
        return NextResponse.json({ error: treatmentsError.message }, { status: 500 });
      }
    }

    // Fetch complete promotion with treatments
    const { data: completePromotion, error: fetchError } = await supabase
      .from('promotions')
      .select(`
        *,
        promotion_treatments (
          id,
          cantidad,
          treatment:treatments (
            id,
            nombre,
            precio_base,
            costo_unitario
          )
        )
      `)
      .eq('id', promotion.id)
      .single();

    if (fetchError) {
      console.error('Error fetching complete promotion:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json(completePromotion, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/promotions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
