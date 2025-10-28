import { createClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/patients/[id]/multi-treatment
 * 
 * Crea múltiples registros de tratamientos para un paciente en UNA transacción atómica.
 * 
 * Body esperado:
 * {
 *   tratamientos: [
 *     {
 *       treatment_id: number,
 *       precio_promocional: number,
 *       costo_unitario: number
 *     }
 *   ],
 *   fecha: string (ISO date),
 *   metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia',
 *   tipo_tarjeta?: string,
 *   meses_sin_intereses?: number,
 *   tasa_comision?: number,
 *   notas?: string,
 *   nombre_promocion?: string
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id: patientId } = resolvedParams;
    const body = await request.json();
    
    console.log(`🔥 [VERCEL-MULTI-TREATMENT] Creating multiple treatments for patient ${patientId}`);
    console.log('🔥 [VERCEL-MULTI-TREATMENT] Body received:', JSON.stringify(body, null, 2));
    
    const supabase = createClient();

    // 1. Verificar que el paciente existe
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', patientId)
      .single();

    if (patientError || !patient) {
      console.error('❌ [VERCEL-MULTI-TREATMENT] Patient not found:', patientError);
      return NextResponse.json(
        { 
          data: null,
          error: 'Paciente no encontrado' 
        },
        { status: 404 }
      );
    }

    // 2. Validar datos de entrada
    // Frontend puede enviar "tratamientos" o "treatments"
    const treatments = body.tratamientos || body.treatments || [];
    
    console.log('🔥 [VERCEL-MULTI-TREATMENT] Extracted treatments:', treatments);
    console.log('🔥 [VERCEL-MULTI-TREATMENT] Is array?', Array.isArray(treatments));
    console.log('🔥 [VERCEL-MULTI-TREATMENT] Length:', treatments?.length);
    
    if (!Array.isArray(treatments) || treatments.length === 0) {
      console.error('❌ [VERCEL-MULTI-TREATMENT] Validation FAILED - returning 400');
      return NextResponse.json(
        { 
          data: null,
          error: `Se requiere un array de tratamientos. Recibido: keys=${Object.keys(body).join(',')}, tratamientos=${typeof body.tratamientos}, treatments=${typeof body.treatments}` 
        },
        { status: 400 }
      );
    }

    // 3. Extraer datos compartidos (comunes a todos los tratamientos)
    const sharedData = {
      fecha: body.fecha || new Date().toISOString().split('T')[0],
      metodo_pago: body.metodo_pago || 'efectivo',
      tipo_tarjeta: body.tipo_tarjeta || null,
      meses_sin_intereses: parseInt(body.meses_sin_intereses) || 0,
      tasa_comision: parseFloat(body.tasa_comision) || 0,
      notas: body.notas || '',
      nombre_promocion: body.nombre_promocion || ''
    };

    console.log('🔥 [VERCEL-MULTI-TREATMENT] Shared data:', sharedData);

    // 4. Preparar registros para insertar
    const recordsToInsert = treatments.map((treatment: any) => {
      // Calcular valores
      const precioPromocional = parseFloat(treatment.precio_promocional) || 0;
      const costoUnitario = parseFloat(treatment.costo_unitario) || 0;
      const ganancia = precioPromocional - costoUnitario;
      
      // Calcular comisión
      const tasaComision = sharedData.tasa_comision / 100;
      const comisionMonto = precioPromocional * tasaComision;
      const montoNeto = precioPromocional - comisionMonto;
      
      return {
        patient_id: patientId, // UUID string (no parse needed)
        treatment_id: treatment.treatment_id || null, // UUID string or null
        fecha: sharedData.fecha,
        monto_pagado: precioPromocional,
        monto_neto: montoNeto,
        costo_unitario: costoUnitario,
        ganancia: ganancia,
        metodo_pago: sharedData.metodo_pago,
        tipo_tarjeta: sharedData.tipo_tarjeta,
        meses_sin_intereses: sharedData.meses_sin_intereses,
        tasa_comision: sharedData.tasa_comision,
        comision_monto: comisionMonto,
        notas: sharedData.notas,
        nombre_promocion: sharedData.nombre_promocion,
        tiene_multiples_tratamientos: true,
        pendiente_facturar: true
      };
    });

    console.log('🔥 [VERCEL-MULTI-TREATMENT] Records to insert:', recordsToInsert.length);
    console.log('🔥 [VERCEL-MULTI-TREATMENT] First record sample:', recordsToInsert[0]);

    // 5. Insertar múltiples registros EN UNA SOLA LLAMADA (Supabase lo maneja atómicamente)
    const { data: createdRecords, error: insertError } = await supabase
      .from('records')
      .insert(recordsToInsert)
      .select();

    if (insertError) {
      console.error('❌ [VERCEL-MULTI-TREATMENT] Insert error:', insertError);
      return NextResponse.json(
        { 
          data: null,
          error: `Error al insertar tratamientos: ${insertError.message}` 
        },
        { status: 500 }
      );
    }

    console.log(`✅ [VERCEL-MULTI-TREATMENT] Success! Created ${createdRecords?.length} records for patient ${patientId}`);
    console.log('✅ [VERCEL-MULTI-TREATMENT] Created records:', createdRecords);

    // 6. TODO: Descontar inventario automáticamente (próximo paso)
    // Por ahora solo creamos los registros

    return NextResponse.json(
      { 
        data: createdRecords, 
        error: null 
      },
      { status: 201 }
    );

  } catch (error: any) {
    const resolvedParams = await params;
    console.error(`❌ [VERCEL-MULTI-TREATMENT] Unexpected error for patient ${resolvedParams.id}:`, error);
    return NextResponse.json(
      { 
        data: null,
        error: `Error interno del servidor: ${error?.message || 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}
