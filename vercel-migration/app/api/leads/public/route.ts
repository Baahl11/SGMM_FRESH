import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

/**
 * POST /api/leads/public
 * Public endpoint — no auth required.
 * Receives a contact form submission and creates a lead for the platform owner.
 *
 * The lead is assigned to the Supabase user identified by PLATFORM_OWNER_USER_ID env var.
 * This allows the AgendaMedPro team to track who contacted from the landing page.
 */
export async function POST(request: NextRequest) {
  const ownerUserId = process.env.PLATFORM_OWNER_USER_ID
  if (!ownerUserId) {
    // Silently succeed — owner not configured yet
    return NextResponse.json({ success: true })
  }

  let body: Record<string, string>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { nombre, email, telefono, mensaje, utm_source, utm_medium, utm_campaign } = body

  if (!nombre?.trim()) return NextResponse.json({ error: 'nombre requerido' }, { status: 400 })

  const { error } = await supabaseAdmin.from('leads').insert({
    user_id: ownerUserId,
    nombre: nombre.trim(),
    email: email?.trim() ?? null,
    telefono: telefono?.trim() ?? null,
    notas: mensaje?.trim() ?? null,
    source: 'landing_contact',
    utm_source: utm_source ?? null,
    utm_medium: utm_medium ?? null,
    utm_campaign: utm_campaign ?? null,
  })

  if (error) {
    console.error('[leads/public] insert error:', error)
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
