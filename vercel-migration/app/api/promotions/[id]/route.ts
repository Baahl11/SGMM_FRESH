import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/promotions/[id] - Get a single promotion
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: promotion, error } = await supabase
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
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching promotion:', error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(promotion);
  } catch (error) {
    console.error('Error in GET /api/promotions/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/promotions/[id] - Update a promotion
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();

    const {
      nombre,
      descripcion,
      precio_total,
      descuento_porcentaje,
      activo,
      treatments = [] // Array of { treatment_id, cantidad }
    } = body;

    // Update promotion
    const { error: updateError } = await supabase
      .from('promotions')
      .update({
        nombre,
        descripcion,
        precio_total: precio_total !== undefined ? parseFloat(precio_total) : undefined,
        descuento_porcentaje: descuento_porcentaje !== undefined ? parseFloat(descuento_porcentaje) : undefined,
        activo
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating promotion:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update treatments if provided
    if (treatments.length > 0) {
      // Delete existing treatments
      await supabase
        .from('promotion_treatments')
        .delete()
        .eq('promotion_id', id);

      // Insert new treatments
      const promotionTreatments = treatments.map((t: any) => ({
        promotion_id: id,
        treatment_id: t.treatment_id,
        cantidad: t.cantidad || 1
      }));

      const { error: treatmentsError } = await supabase
        .from('promotion_treatments')
        .insert(promotionTreatments);

      if (treatmentsError) {
        console.error('Error updating promotion treatments:', treatmentsError);
        return NextResponse.json({ error: treatmentsError.message }, { status: 500 });
      }
    }

    // Fetch updated promotion
    const { data: updatedPromotion, error: fetchError } = await supabase
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
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching updated promotion:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json(updatedPromotion);
  } catch (error) {
    console.error('Error in PUT /api/promotions/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/promotions/[id] - Delete a promotion
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`🗑️ Deleting promotion ${id} for user ${user.id}`);

    // Delete promotion_treatments first (foreign key constraint)
    const { error: treatmentsError } = await supabase
      .from('promotion_treatments')
      .delete()
      .eq('promotion_id', id);

    if (treatmentsError) {
      console.error('❌ Error deleting promotion treatments:', treatmentsError);
      return NextResponse.json({ error: treatmentsError.message }, { status: 500 });
    }

    console.log(`✅ Deleted promotion_treatments for promotion ${id}`);

    // Delete promotion (with user_id check for security)
    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('❌ Error deleting promotion:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`✅ Promotion ${id} deleted successfully`);

    return NextResponse.json({ success: true, message: 'Promotion deleted' });
  } catch (error) {
    console.error('💥 Error in DELETE /api/promotions/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
