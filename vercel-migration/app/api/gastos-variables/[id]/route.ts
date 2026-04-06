/**
 * API Route: /api/gastos-variables/[id]
 * CRUD endpoints para un gasto variable específico
 * GET    - Obtener detalle de un gasto
 * PUT    - Actualizar un gasto
 * DELETE - Eliminar (soft delete) un gasto
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/gastos-variables/[id]
 * Obtiene el detalle de un gasto variable específico
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
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

    const id = params.id;
    // Buscar gasto
    const { data, error } = await supabase
      .from('variable_expenses')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id) // Solo del usuario autenticado
      .is('deleted_at', null) // No eliminados
      .single();

    if (error) {
      console.error(`❌ [GET /api/gastos-variables/${id}] Error:`, error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Gasto no encontrado' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(data);

  } catch (error) {
    console.error(`❌ [GET /api/gastos-variables/${params.id}] Error inesperado:`, error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/gastos-variables/[id]
 * Actualiza un gasto variable existente
 * 
 * Body: cualquier campo de variable_expenses (excepto id, user_id, created_at)
 */
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
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

    const id = params.id;
    const body = await request.json();
    // Verificar que el gasto existe y pertenece al usuario
    const { data: existingGasto, error: fetchError } = await supabase
      .from('variable_expenses')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !existingGasto) {
      console.error(`❌ [PUT /api/gastos-variables/${id}] Gasto no encontrado`);
      return NextResponse.json(
        { error: 'Gasto no encontrado o no autorizado' },
        { status: 404 }
      );
    }

    // Validar monto si se está actualizando
    if (body.monto !== undefined && body.monto <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser mayor a 0' },
        { status: 400 }
      );
    }

    // Validar categoría si se está actualizando
    if (body.categoria) {
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
    }

    // Preparar datos para actualización (excluir campos no editables)
    const { id: _, user_id: __, created_at: ___, ...updateData } = body;

    // Convertir monto a float si existe
    if (updateData.monto) {
      updateData.monto = parseFloat(updateData.monto);
    }

    // Actualizar gasto
    const { data, error } = await supabase
      .from('variable_expenses')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error(`❌ [PUT /api/gastos-variables/${id}] Error al actualizar:`, error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(data);

  } catch (error) {
    console.error(`❌ [PUT /api/gastos-variables/${params.id}] Error inesperado:`, error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/gastos-variables/[id]
 * Elimina (soft delete) un gasto variable
 * El gasto no se borra físicamente, solo se marca como eliminado
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
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

    const id = params.id;
    // Verificar que el gasto existe y pertenece al usuario
    const { data: existingGasto, error: fetchError } = await supabase
      .from('variable_expenses')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !existingGasto) {
      console.error(`❌ [DELETE /api/gastos-variables/${id}] Gasto no encontrado`);
      return NextResponse.json(
        { error: 'Gasto no encontrado o no autorizado' },
        { status: 404 }
      );
    }

    // Soft delete: marcar como eliminado
    const { error } = await supabase
      .from('variable_expenses')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error(`❌ [DELETE /api/gastos-variables/${id}] Error al eliminar:`, error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ 
      message: 'Gasto eliminado exitosamente',
      id 
    });

  } catch (error) {
    console.error(`❌ [DELETE /api/gastos-variables/${params.id}] Error inesperado:`, error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
