import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-server';

function numberOrZero(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const rangeDays = Math.min(Math.max(parseInt(searchParams.get('rangeDays') || '90', 10), 7), 365);
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - rangeDays);

    // Fetch movements with related inventory item info
    const { data: movements, error: movementsError } = await supabase
      .from('inventory_movements')
      .select(`
        id,
        item_id,
        tipo,
        cantidad,
        motivo,
        created_at,
        related_record_id,
        inventory_items ( id, nombre, precio_unitario )
      `)
      .gte('created_at', fromDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(1000);

    if (movementsError) {
      console.error('Error fetching movements for reports:', movementsError);
      return NextResponse.json({ error: movementsError.message }, { status: 500 });
    }

    const relatedRecordIds = Array.from(
      new Set(
        (movements || [])
          .map((movement) => movement.related_record_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    let recordsMap: Record<string, any> = {};

    if (relatedRecordIds.length > 0) {
      const { data: records, error: recordsError } = await supabase
        .from('records')
        .select(`
          id,
          treatment_id,
          monto_pagado,
          created_at,
          treatments ( id, nombre, precio_base )
        `)
        .in('id', relatedRecordIds);

      if (recordsError) {
        console.error('Error fetching related records for reports:', recordsError);
      } else {
        recordsMap = (records || []).reduce<Record<string, any>>((acc, record) => {
          acc[record.id] = record;
          return acc;
        }, {});
      }
    }

    const consumptionByTreatmentMap = new Map<string, {
      treatmentId: string;
      treatmentName: string;
      totalQuantity: number;
      totalCost: number;
      movements: number;
    }>();

    const costPerRecord = new Map<string, {
      recordId: string;
      treatmentId: string | null;
      treatmentName: string;
      price: number;
      cost: number;
      movements: number;
      createdAt: string | null;
    }>();

    const periodSummary = new Map<string, {
      period: string;
      entradas: number;
      salidas: number;
      ajustes: number;
    }>();

    let totalEntradaCost = 0;
    let totalSalidaCost = 0;

    for (const movement of movements || []) {
      const tipo = movement.tipo as 'entrada' | 'salida' | 'ajuste';
      const cantidad = numberOrZero(movement.cantidad);
      const item = Array.isArray(movement.inventory_items) 
        ? movement.inventory_items[0] 
        : movement.inventory_items || {};
      const precioUnitario = numberOrZero(item?.precio_unitario);
      const recordId = movement.related_record_id as string | null;
      const record = recordId ? recordsMap[recordId] : null;
      const treatmentId = record?.treatment_id || null;
      const treatmentName = record?.treatments?.nombre || 'Tratamiento no asignado';
      const recordPrice = numberOrZero(record?.monto_pagado || record?.treatments?.precio_base);
      const movementDate = movement.created_at ? new Date(movement.created_at) : null;
      const periodKey = movementDate ? `${movementDate.getFullYear()}-${String(movementDate.getMonth() + 1).padStart(2, '0')}` : 'Sin fecha';
      const movementCost = precioUnitario * cantidad;

      // Inventory by period summary
      const summary = periodSummary.get(periodKey) || {
        period: periodKey,
        entradas: 0,
        salidas: 0,
        ajustes: 0,
      };

      if (tipo === 'entrada') {
        summary.entradas += cantidad;
        totalEntradaCost += movementCost;
      } else if (tipo === 'salida') {
        summary.salidas += cantidad;
        totalSalidaCost += movementCost;
      } else if (tipo === 'ajuste') {
        summary.ajustes += cantidad;
      }

      periodSummary.set(periodKey, summary);

      // Consumption by treatment (only exits linked to records)
      if (tipo === 'salida' && treatmentId) {
        const key = String(treatmentId);
        const current = consumptionByTreatmentMap.get(key) || {
          treatmentId: key,
          treatmentName,
          totalQuantity: 0,
          totalCost: 0,
          movements: 0,
        };
        current.totalQuantity += cantidad;
        current.totalCost += movementCost;
        current.movements += 1;
        consumptionByTreatmentMap.set(key, current);
      }

      // Cost vs price per record
      if (recordId) {
        const current = costPerRecord.get(recordId) || {
          recordId,
          treatmentId,
          treatmentName,
          price: recordPrice,
          cost: 0,
          movements: 0,
          createdAt: record?.created_at || null,
        };
        current.cost += tipo === 'salida' ? movementCost : 0;
        current.movements += 1;
        costPerRecord.set(recordId, current);
      }
    }

    const consumptionByTreatment = Array.from(consumptionByTreatmentMap.values())
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 20);

    const inventoryByPeriod = Array.from(periodSummary.values()).sort((a, b) =>
      a.period.localeCompare(b.period)
    );

    const costVsPrice = Array.from(costPerRecord.values())
      .map((entry) => ({
        ...entry,
        margin: entry.price - entry.cost,
        marginPercentage:
          entry.price > 0 ? ((entry.price - entry.cost) / entry.price) * 100 : null,
      }))
      .sort((a, b) => (b.price - b.cost) - (a.price - a.cost))
      .slice(0, 50);

    return NextResponse.json({
      rangeDays,
      generatedAt: new Date().toISOString(),
      summary: {
        totalEntradaCost,
        totalSalidaCost,
        movimientosProcesados: movements?.length || 0,
      },
      consumptionByTreatment,
      inventoryByPeriod,
      costVsPrice,
    });
  } catch (error) {
    console.error('Error in inventory reports GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
