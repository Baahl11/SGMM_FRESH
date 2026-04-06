import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/doctor-exceptions/[id]
// Update an existing exception
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = await createClient();
    const { id } = params;
    const body = await request.json();

    const {
      doctor_id,
      tipo,
      fecha_inicio,
      fecha_fin,
      motivo,
      activo,
    } = body;

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Validate tipo if provided
    if (tipo && !["vacaciones", "festivo", "bloqueo"].includes(tipo)) {
      return NextResponse.json(
        { error: "tipo debe ser: vacaciones, festivo o bloqueo" },
        { status: 400 }
      );
    }

    // Validate date range if both dates are provided
    if (fecha_inicio && fecha_fin) {
      const startDate = new Date(fecha_inicio);
      const endDate = new Date(fecha_fin);
      if (endDate < startDate) {
        return NextResponse.json(
          { error: "fecha_fin debe ser posterior o igual a fecha_inicio" },
          { status: 400 }
        );
      }

      // Check for overlapping exceptions (excluding current one)
      if (doctor_id) {
        const { data: existingExceptions, error: checkError } = await supabase
          .from("doctor_exceptions")
          .select("*")
          .eq("doctor_id", doctor_id)
          .eq("activo", true)
          .neq("id", id);

        if (checkError) {
          console.error("Error checking overlapping exceptions:", checkError);
          return NextResponse.json(
            { error: "Error al validar solapamiento" },
            { status: 500 }
          );
        }

        const hasOverlap = existingExceptions?.some((exc) => {
          const excStart = new Date(exc.fecha_inicio);
          const excEnd = new Date(exc.fecha_fin);
          return startDate <= excEnd && endDate >= excStart;
        });

        if (hasOverlap) {
          return NextResponse.json(
            { error: "Ya existe una excepción activa en este rango de fechas" },
            { status: 409 }
          );
        }
      }
    }

    // Build update object (only include provided fields)
    const updateData: any = {};
    if (doctor_id !== undefined) updateData.doctor_id = doctor_id;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (fecha_inicio !== undefined) updateData.fecha_inicio = fecha_inicio;
    if (fecha_fin !== undefined) updateData.fecha_fin = fecha_fin;
    if (motivo !== undefined) updateData.motivo = motivo;
    if (activo !== undefined) updateData.activo = activo;

    // Update exception
    const { data, error } = await supabase
      .from("doctor_exceptions")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id) // Ensure user owns this exception
      .select()
      .single();

    if (error) {
      console.error("Error updating doctor exception:", error);
      return NextResponse.json(
        { error: "Error al actualizar excepción" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Excepción no encontrada o no autorizado" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error in PATCH /api/doctor-exceptions/[id]:", error);
    return NextResponse.json(
      { error: "Error inesperado al actualizar excepción" },
      { status: 500 }
    );
  }
}

// DELETE /api/doctor-exceptions/[id]
// Delete an exception (soft delete by setting activo=false, or hard delete)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = await createClient();
    const { id } = params;

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Hard delete
    const { error } = await supabase
      .from("doctor_exceptions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id); // Ensure user owns this exception

    if (error) {
      console.error("Error deleting doctor exception:", error);
      return NextResponse.json(
        { error: "Error al eliminar excepción" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Excepción eliminada correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error in DELETE /api/doctor-exceptions/[id]:", error);
    return NextResponse.json(
      { error: "Error inesperado al eliminar excepción" },
      { status: 500 }
    );
  }
}
