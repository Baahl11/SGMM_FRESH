/**
 * API Route: /api/gastos-variables/stats
 * Estadísticas y resumen de gastos variables
 * GET - Obtener resumen financiero de gastos variables
 */

import { createClient } from '@/lib/supabase/server';
import { buildSatDeductibilitySummary } from '@/lib/fiscal/sat-deductibility';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/gastos-variables/stats
 * Obtiene estadísticas de gastos variables
 * 
 * Query params opcionales:
 * - mes: filtrar por mes (1-12)
 * - año: filtrar por año (YYYY)
 * - fecha_inicio: filtrar desde fecha (YYYY-MM-DD)
 * - fecha_fin: filtrar hasta fecha (YYYY-MM-DD)
 * 
 * Retorna:
 * {
 *   total: number,
 *   total_deducible: number,
 *   total_no_deducible: number,
 *   count: number,
 *   por_categoria: Array<{ categoria: string, total: number, count: number }>,
 *   por_estado: { pendiente: number, aprobado: number, rechazado: number, pagado: number },
 *   por_mes: Array<{ mes: string, total: number }>,
 *   promedio: number,
 *   mayor_gasto: object,
 *   proveedores_frecuentes: Array<{ proveedor: string, total: number, count: number }>
 * }
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Parsear query params
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes');
    const año = searchParams.get('año');
    const fecha_inicio = searchParams.get('fecha_inicio');
    const fecha_fin = searchParams.get('fecha_fin');
    // Construir query base
    let query = supabase
      .from('variable_expenses')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null);

    // Aplicar filtros de fecha
    if (mes && año) {
      const startDate = `${año}-${mes.padStart(2, '0')}-01`;
      const lastDay = new Date(parseInt(año), parseInt(mes), 0).getDate();
      const endDate = `${año}-${mes.padStart(2, '0')}-${lastDay}`;
      query = query.gte('fecha', startDate).lte('fecha', endDate);
    } else if (año) {
      query = query.gte('fecha', `${año}-01-01`).lte('fecha', `${año}-12-31`);
    } else if (fecha_inicio && fecha_fin) {
      query = query.gte('fecha', fecha_inicio).lte('fecha', fecha_fin);
    } else if (fecha_inicio) {
      query = query.gte('fecha', fecha_inicio);
    } else if (fecha_fin) {
      query = query.lte('fecha', fecha_fin);
    }

    // Obtener todos los gastos filtrados
    const { data: gastos, error } = await query;

    if (error) {
      console.error('❌ [GET /api/gastos-variables/stats] Error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!gastos || gastos.length === 0) {
      const sat = buildSatDeductibilitySummary([]);
      return NextResponse.json({
        total: 0,
        total_deducible: 0,
        total_no_deducible: 0,
        total_deducible_sat: 0,
        total_no_deducible_sat: 0,
        total_revision_sat: 0,
        count: 0,
        por_categoria: [],
        por_estado: { pendiente: 0, aprobado: 0, rechazado: 0, pagado: 0 },
        por_mes: [],
        promedio: 0,
        mayor_gasto: null,
        proveedores_frecuentes: [],
        sat
      });
    }

    // Calcular total y deducibles
    const total = gastos.reduce((sum, g) => sum + parseFloat(g.monto.toString()), 0);
    const total_deducible = gastos
      .filter(g => g.es_deducible)
      .reduce((sum, g) => sum + parseFloat(g.monto.toString()), 0);
    const total_no_deducible = total - total_deducible;

    // Agrupar por categoría
    const porCategoria = gastos.reduce((acc: any, gasto) => {
      const cat = gasto.categoria;
      if (!acc[cat]) {
        acc[cat] = { categoria: cat, total: 0, count: 0 };
      }
      acc[cat].total += parseFloat(gasto.monto.toString());
      acc[cat].count += 1;
      return acc;
    }, {});

    const por_categoria = Object.values(porCategoria).sort((a: any, b: any) => b.total - a.total);

    // Agrupar por estado
    const por_estado = gastos.reduce((acc: any, gasto) => {
      const estado = gasto.estado;
      acc[estado] = (acc[estado] || 0) + parseFloat(gasto.monto.toString());
      return acc;
    }, { pendiente: 0, aprobado: 0, rechazado: 0, pagado: 0 });

    // Agrupar por mes
    const porMes = gastos.reduce((acc: any, gasto) => {
      const fecha = new Date(gasto.fecha);
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[mesKey]) {
        acc[mesKey] = { mes: mesKey, total: 0 };
      }
      acc[mesKey].total += parseFloat(gasto.monto.toString());
      return acc;
    }, {});

    const por_mes = Object.values(porMes).sort((a: any, b: any) => a.mes.localeCompare(b.mes));

    // Promedio
    const promedio = total / gastos.length;

    // Mayor gasto
    const mayor_gasto = gastos.reduce((max, g) => 
      parseFloat(g.monto.toString()) > parseFloat(max.monto.toString()) ? g : max
    , gastos[0]);

    // Proveedores frecuentes
    const porProveedor = gastos
      .filter(g => g.proveedor)
      .reduce((acc: any, gasto) => {
        const prov = gasto.proveedor!;
        if (!acc[prov]) {
          acc[prov] = { proveedor: prov, total: 0, count: 0 };
        }
        acc[prov].total += parseFloat(gasto.monto.toString());
        acc[prov].count += 1;
        return acc;
      }, {});

    const proveedores_frecuentes = Object.values(porProveedor)
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 10);

    const sat = buildSatDeductibilitySummary(gastos);

    const stats = {
      total: Math.round(total * 100) / 100,
      total_deducible: Math.round(total_deducible * 100) / 100,
      total_no_deducible: Math.round(total_no_deducible * 100) / 100,
      total_deducible_sat: sat.totalDeducibleProbable,
      total_no_deducible_sat: sat.totalNoDeducible,
      total_revision_sat: sat.totalRevision,
      count: gastos.length,
      por_categoria,
      por_estado,
      por_mes,
      promedio: Math.round(promedio * 100) / 100,
      mayor_gasto: {
        id: mayor_gasto.id,
        concepto: mayor_gasto.concepto,
        monto: parseFloat(mayor_gasto.monto.toString()),
        fecha: mayor_gasto.fecha,
        categoria: mayor_gasto.categoria
      },
      proveedores_frecuentes,
      sat
    };
    return NextResponse.json(stats);

  } catch (error) {
    console.error('❌ [GET /api/gastos-variables/stats] Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
