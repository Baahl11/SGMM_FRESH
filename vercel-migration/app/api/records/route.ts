import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const skip = parseInt(searchParams.get('skip') || '0')
    const limit = parseInt(searchParams.get('limit') || '100')
    const search = searchParams.get('search')
    const patientId = searchParams.get('patient_id')

    // Build query with joins to get patient and treatment names
    let query = supabase
      .from('records')
      .select(`
        *,
        patients!inner(id, nombre, apellido),
        treatments(id, nombre)
      `)

    // Apply filters
    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    if (search) {
      query = query.or(`patients.nombre.ilike.%${search}%,treatments.nombre.ilike.%${search}%,notas.ilike.%${search}%`)
    }

    // Apply pagination and ordering
    const { data, error } = await query
      .order('fecha', { ascending: false })
      .range(skip, skip + limit - 1)

    if (error) {
      console.error('Error fetching records:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform data to include patient and treatment names
    const transformedData = (data || []).map(record => ({
      ...record,
      patient_name: record.patients ? 
        `${record.patients.nombre || ''} ${record.patients.apellido || ''}`.trim() : 
        'Sin paciente',
      treatment_name: record.treatments?.nombre || 'Sin tratamiento'
    }))

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Error in records GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthUser();
    if (!user) {
      console.error('❌ Unauthorized: No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient()
    const body = await request.json()

    // Create the record
    const { data: record, error } = await supabase
      .from('records')
      .insert([{
        patient_id: body.patient_id,
        treatment_id: body.treatment_id,
        fecha: body.fecha || new Date().toISOString(),
        monto_pagado: body.monto_pagado || 0,
        monto_neto: body.monto_neto || body.monto_pagado || 0,
        costo_unitario: body.costo_unitario || 0,
        ganancia: body.ganancia || (body.monto_pagado - body.costo_unitario) || 0,
        metodo_pago: body.metodo_pago || 'efectivo',
        tipo_tarjeta: body.tipo_tarjeta,
        meses_sin_intereses: body.meses_sin_intereses || 0,
        tasa_comision: body.tasa_comision || 0,
        comision_monto: body.comision_monto || 0,
        notas: body.notas || '',
        user_id: user.id
      }])
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating record:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    // 🔥 AUTOMATIC INVENTORY DEDUCTION
    // Process inventory deduction for this treatment
    const inventoryResult = await processInventoryDeduction(
      supabase,
      String(record.id),
      String(body.treatment_id),
      String(body.patient_id),
      user.id
    );

    return NextResponse.json({
      record,
      inventory_deducted: inventoryResult.success,
      inventory_items_processed: inventoryResult.items_processed,
      inventory_warnings: inventoryResult.warnings
    })
  } catch (error) {
    console.error('❌ Error in records POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Process automatic inventory deduction when a treatment is applied
 * 1. Find all inventory items associated with the treatment
 * 2. Deduct the required quantity from each item's stock
 * 3. Create inventory_movements for audit trail
 */
async function processInventoryDeduction(
  supabase: any,
  recordId: string,
  treatmentId: string,
  patientId: string,
  userId: string
) {
  const result = {
    success: false,
    items_processed: 0,
    warnings: [] as string[]
  };

  try {
    // 1. Get patient name for motivo
    const { data: patient } = await supabase
      .from('patients')
      .select('nombre, apellido')
      .eq('id', patientId)
      .single();

    const patientName = patient 
      ? `${patient.nombre || ''} ${patient.apellido || ''}`.trim() 
      : 'Paciente desconocido';

    // 2. Get treatment name
    const { data: treatment } = await supabase
      .from('treatments')
      .select('nombre')
      .eq('id', treatmentId)
      .single();

    const treatmentName = treatment?.nombre || 'Tratamiento desconocido';

    // 3. Get all inventory items for this treatment
    const { data: treatmentItems, error: itemsError } = await supabase
      .from('treatment_inventory_items')
      .select(`
        id,
        inventory_item_id,
        cantidad_requerida,
        inventory_items (
          id,
          nombre,
          stock_actual
        )
      `)
      .eq('treatment_id', treatmentId);

    if (itemsError) {
      console.error('❌ Error fetching treatment items:', itemsError);
      result.warnings.push('Error al buscar consumibles del tratamiento');
      return result;
    }

    if (!treatmentItems || treatmentItems.length === 0) {
      result.success = true; // Not an error, just no items to process
      return result;
    }
    // 4. Process each inventory item
    for (const item of treatmentItems) {
      const inventoryItem = item.inventory_items;
      const cantidadRequerida = item.cantidad_requerida;
      const stockAnterior = inventoryItem.stock_actual;
      const stockNuevo = stockAnterior - cantidadRequerida;

      // Deduct from inventory
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ 
          stock_actual: stockNuevo,
          updated_at: new Date().toISOString()
        })
        .eq('id', inventoryItem.id);

      if (updateError) {
        console.error(`❌ Error updating stock for item ${inventoryItem.id}:`, updateError);
        result.warnings.push(`Error al descontar ${inventoryItem.nombre}`);
        continue;
      }

      // Create inventory movement for audit
      const motivo = `Usado en tratamiento "${treatmentName}" (ID ${treatmentId}) - Paciente: ${patientName} (ID ${patientId})`;
      
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert({
          item_id: inventoryItem.id,
          tipo: 'salida',
          cantidad: cantidadRequerida,
          cantidad_anterior: stockAnterior,
          cantidad_nueva: stockNuevo,
          motivo,
          related_record_id: recordId,
          user_id: userId
        });

      if (movementError) {
        console.error(`❌ Error creating movement for item ${inventoryItem.id}:`, movementError);
        result.warnings.push(`Error al registrar movimiento de ${inventoryItem.nombre}`);
        continue;
      }
      // Warn if stock is low or negative
      if (stockNuevo < 0) {
        result.warnings.push(`⚠️ Stock NEGATIVO de "${inventoryItem.nombre}": ${stockNuevo}`);
      }

      result.items_processed++;
    }

    result.success = true;
  } catch (error) {
    console.error('❌ Error in processInventoryDeduction:', error);
    result.warnings.push('Error general al procesar inventario');
  }

  return result;
}