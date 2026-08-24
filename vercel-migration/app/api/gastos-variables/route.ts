/**
 * API Route: /api/gastos-variables
 * CRUD endpoints para gastos variables (ocasionales)
 * GET    - Listar gastos con filtros
 * POST   - Crear nuevo gasto
 */

import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { signStoredObject } from '@/lib/storage/signed';
import { isValidRFC } from '@/lib/types/facturama';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/gastos-variables
 * Lista todos los gastos variables del usuario autenticado
 * 
 * Query params opcionales:
 * - categoria: filtrar por categoría
 * - fecha_inicio: filtrar desde fecha (YYYY-MM-DD)
 * - fecha_fin: filtrar hasta fecha (YYYY-MM-DD)
 * - mes: filtrar por mes (1-12)
 * - año: filtrar por año (YYYY)
 * - proveedor: filtrar por proveedor (texto parcial)
 * - estado: filtrar por estado (pendiente|aprobado|rechazado|pagado)
 * - es_deducible: filtrar deducibles (true|false)
 * - limit: número máximo de resultados (default: 100)
 * - offset: paginación (default: 0)
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
    const categoria = searchParams.get('categoria');
    const fecha_inicio = searchParams.get('fecha_inicio');
    const fecha_fin = searchParams.get('fecha_fin');
    const mes = searchParams.get('mes');
    const año = searchParams.get('año');
    const proveedor = searchParams.get('proveedor');
    const estado = searchParams.get('estado');
    const es_deducible = searchParams.get('es_deducible');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    // Construir query
    let query = supabase
      .from('variable_expenses')
      .select('*')
      .is('deleted_at', null) // Solo gastos activos (soft delete)
      .eq('user_id', user.id)
      .order('fecha', { ascending: false });

    // Aplicar filtros
    if (categoria) {
      query = query.eq('categoria', categoria);
    }

    if (fecha_inicio) {
      query = query.gte('fecha', fecha_inicio);
    }

    if (fecha_fin) {
      query = query.lte('fecha', fecha_fin);
    }

    if (mes && año) {
      // Filtrar por mes y año específico
      const startDate = `${año}-${mes.padStart(2, '0')}-01`;
      const endDate = new Date(parseInt(año), parseInt(mes), 0).toISOString().split('T')[0];
      query = query.gte('fecha', startDate).lte('fecha', endDate);
    } else if (año) {
      // Solo año
      query = query.gte('fecha', `${año}-01-01`).lte('fecha', `${año}-12-31`);
    }

    if (proveedor) {
      query = query.ilike('proveedor', `%${proveedor}%`);
    }

    if (estado) {
      query = query.eq('estado', estado);
    }

    if (es_deducible !== null && es_deducible !== undefined) {
      query = query.eq('es_deducible', es_deducible === 'true');
    }

    // Paginación
    query = query.range(offset, offset + limit - 1);

    // Ejecutar query
    const { data, error, count } = await query;

    if (error) {
      console.error('❌ [GET /api/gastos-variables] Error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    // fable C4: firmar factura_url en lectura (bucket privado). Compatible
    // con filas históricas que guardaron la URL pública completa.
    const admin = getSupabaseAdmin();
    const dataSigned = await Promise.all(
      (data ?? []).map(async (row) => ({
        ...row,
        factura_url: row.factura_url
          ? await signStoredObject(admin, 'gastos-facturas', row.factura_url)
          : row.factura_url,
      }))
    );

    return NextResponse.json({
      data: dataSigned,
      count: dataSigned.length,
      limit,
      offset
    });

  } catch (error) {
    console.error('❌ [GET /api/gastos-variables] Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gastos-variables
 * Crea un nuevo gasto variable
 * 
 * Body esperado:
 * {
 *   concepto: string (requerido),
 *   descripcion?: string,
 *   categoria: string (requerido),
 *   monto: number (requerido),
 *   fecha: string (YYYY-MM-DD, requerido),
 *   metodo_pago?: 'efectivo' | 'tarjeta' | 'transferencia' | 'cheque',
 *   proveedor?: string,
 *   proveedor_rfc?: string,
 *   proveedor_telefono?: string,
 *   proveedor_email?: string,
 *   factura_numero?: string,
 *   factura_url?: string,
 *   factura_tipo?: 'fiscal' | 'simple' | 'ninguna',
 *   es_deducible?: boolean,
 *   notas?: string,
 *   tags?: string[],
 *   estado?: 'pendiente' | 'aprobado' | 'rechazado' | 'pagado'
 * }
 */
export async function POST(request: Request) {
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

    // Parsear body
    const body = await request.json();
    const proveedorRFC = body.proveedor_rfc ? String(body.proveedor_rfc).trim().toUpperCase() : null;

    if (proveedorRFC && !isValidRFC(proveedorRFC)) {
      return NextResponse.json(
        { error: 'RFC de proveedor inválido' },
        { status: 400 }
      );
    }

    // Validar campos requeridos
    if (!body.concepto) {
      return NextResponse.json(
        { error: 'El campo "concepto" es requerido' },
        { status: 400 }
      );
    }

    if (!body.categoria) {
      return NextResponse.json(
        { error: 'El campo "categoria" es requerido' },
        { status: 400 }
      );
    }

    if (!body.monto || body.monto <= 0) {
      return NextResponse.json(
        { error: 'El campo "monto" debe ser mayor a 0' },
        { status: 400 }
      );
    }

    if (!body.fecha) {
      return NextResponse.json(
        { error: 'El campo "fecha" es requerido' },
        { status: 400 }
      );
    }

    // Validar categoría
    const categoriasValidas = [
      'reparacion',
      'mantenimiento',
      'compras_equipo',
      'insumos_extraordinarios',
      'servicios_profesionales',
      'marketing',
      'capacitacion',
      'tecnologia',
      'viajes',
      'otros'
    ];

    if (!categoriasValidas.includes(body.categoria)) {
      return NextResponse.json(
        { 
          error: 'Categoría inválida',
          categorias_validas: categoriasValidas
        },
        { status: 400 }
      );
    }

    // Preparar datos para inserción
    const gastoData = {
      user_id: user.id,
      concepto: body.concepto,
      descripcion: body.descripcion || null,
      categoria: body.categoria,
      monto: parseFloat(body.monto),
      fecha: body.fecha,
      metodo_pago: body.metodo_pago || null,
      proveedor: body.proveedor || null,
      proveedor_rfc: proveedorRFC,
      proveedor_telefono: body.proveedor_telefono || null,
      proveedor_email: body.proveedor_email || null,
      factura_numero: body.factura_numero || null,
      factura_url: body.factura_url || null,
      factura_tipo: body.factura_tipo || null,
      es_deducible: body.es_deducible !== undefined ? body.es_deducible : true,
      notas: body.notas || null,
      tags: body.tags || [],
      estado: body.estado || 'pendiente'
    };

    // Insertar en base de datos
    const { data, error } = await supabase
      .from('variable_expenses')
      .insert(gastoData)
      .select()
      .single();

    if (error) {
      console.error('❌ [POST /api/gastos-variables] Error al insertar:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('❌ [POST /api/gastos-variables] Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
