import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/doctor-exceptions?doctor_id=xxx
// Get all exceptions for a specific doctor
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const doctor_id = searchParams.get("doctor_id");

    if (!doctor_id) {
      return NextResponse.json(
        { error: "doctor_id es requerido" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("doctor_exceptions")
      .select("*")
      .eq("doctor_id", doctor_id)
      .order("fecha_inicio", { ascending: true });

    if (error) {
      console.error("Error fetching doctor exceptions:", error);
      return NextResponse.json(
        { error: "Error al obtener excepciones" },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Unexpected error in GET /api/doctor-exceptions:", error);
    return NextResponse.json(
      { error: "Error inesperado al obtener excepciones" },
      { status: 500 }
    );
  }
}

// POST /api/doctor-exceptions
// Create a new exception
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      doctor_id,
      tipo,
      fecha_inicio,
      fecha_fin,
      motivo,
      activo = true,
    } = body;

    // Validation
    if (!doctor_id || !tipo || !fecha_inicio || !fecha_fin) {
      return NextResponse.json(
        { error: "doctor_id, tipo, fecha_inicio y fecha_fin son requeridos" },
        { status: 400 }
      );
    }

    if (!["vacaciones", "festivo", "bloqueo"].includes(tipo)) {
      return NextResponse.json(
        { error: "tipo debe ser: vacaciones, festivo o bloqueo" },
        { status: 400 }
      );
    }

    // Validate date range
    const startDate = new Date(fecha_inicio);
    const endDate = new Date(fecha_fin);
    if (endDate < startDate) {
      return NextResponse.json(
        { error: "fecha_fin debe ser posterior o igual a fecha_inicio" },
        { status: 400 }
      );
    }

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

    // Check for overlapping exceptions (only active ones)
    const { data: existingExceptions, error: checkError } = await supabase
      .from("doctor_exceptions")
      .select("*")
      .eq("doctor_id", doctor_id)
      .eq("activo", true);

    if (checkError) {
      console.error("Error checking overlapping exceptions:", checkError);
      return NextResponse.json(
        { error: "Error al validar solapamiento" },
        { status: 500 }
      );
    }

    // Check for overlaps
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

    // Insert new exception
    const { data, error } = await supabase
      .from("doctor_exceptions")
      .insert({
        doctor_id,
        tipo,
        fecha_inicio,
        fecha_fin,
        motivo: motivo || null,
        activo,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating doctor exception:", error);
      return NextResponse.json(
        { error: "Error al crear excepción" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /api/doctor-exceptions:", error);
    return NextResponse.json(
      { error: "Error inesperado al crear excepción" },
      { status: 500 }
    );
  }
}
