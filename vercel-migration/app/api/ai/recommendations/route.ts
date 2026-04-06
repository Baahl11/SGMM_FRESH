import { NextResponse } from 'next/server'
import { createClient, supabaseAdmin } from '@/lib/supabase/server'

// GET /api/ai/recommendations
// Returns data-driven insights: occupancy, no-shows, inventory alerts
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Fetch data in parallel
  const [apptRes, patientRes] = await Promise.all([
    supabaseAdmin
      .from('appointments')
      .select('id, fecha_hora, estado, patient_id, doctor_id')
      .eq('user_id', user.id)
      .gte('fecha_hora', sixtyDaysAgo)
      .order('fecha_hora', { ascending: true }),
    supabaseAdmin
      .from('patients')
      .select('id, created_at')
      .eq('user_id', user.id),
  ])

  const appointments = apptRes.data ?? []
  const patients = patientRes.data ?? []

  // --- 1. Occupancy (appointments per day last 30 days) ---
  const recent = appointments.filter(a => a.fecha_hora >= thirtyDaysAgo && a.fecha_hora <= today)
  const byDay: Record<string, number> = {}
  for (const a of recent) {
    const day = a.fecha_hora.slice(0, 10)
    byDay[day] = (byDay[day] ?? 0) + 1
  }
  const daysWithAppts = Object.values(byDay)
  const avgDaily = daysWithAppts.length
    ? +(daysWithAppts.reduce((s, n) => s + n, 0) / 30).toFixed(1)
    : 0
  const maxDay = daysWithAppts.length ? Math.max(...daysWithAppts) : 0

  // Upcoming 7 days
  const upcoming = appointments.filter(a => a.fecha_hora >= today && a.fecha_hora <= sevenDaysAhead)
  const upcomingByDay: Record<string, number> = {}
  for (const a of upcoming) {
    const day = a.fecha_hora.slice(0, 10)
    upcomingByDay[day] = (upcomingByDay[day] ?? 0) + 1
  }

  // --- 2. No-show analysis ---
  const completedOrNoShow = recent.filter(a => ['completada', 'no_show', 'cancelada'].includes(a.estado))
  const noShows = recent.filter(a => a.estado === 'no_show')
  const noShowRate = completedOrNoShow.length
    ? +((noShows.length / completedOrNoShow.length) * 100).toFixed(1)
    : 0

  // Repeat no-show patients
  const noShowPatientCounts: Record<string, number> = {}
  for (const a of noShows) {
    if (a.patient_id) noShowPatientCounts[a.patient_id] = (noShowPatientCounts[a.patient_id] ?? 0) + 1
  }
  const repeatNoShows = Object.values(noShowPatientCounts).filter(n => n >= 2).length

  // --- 3. New patients trend ---
  const newThisMonth = patients.filter(p => p.created_at >= thirtyDaysAgo).length
  const newPrevMonth = patients.filter(p => p.created_at >= sixtyDaysAgo && p.created_at < thirtyDaysAgo).length
  const patientTrend = newPrevMonth > 0 ? +((newThisMonth - newPrevMonth) / newPrevMonth * 100).toFixed(1) : null

  // --- Build recommendations ---
  type Severity = 'info' | 'warning' | 'success'
  interface Rec { id: string; type: string; title: string; description: string; action: string; severity: Severity; metric?: string | number }
  const recommendations: Rec[] = []

  // No-show recommendation
  if (noShowRate >= 20) {
    recommendations.push({
      id: 'high_no_show',
      type: 'no_show',
      title: 'Tasa de inasistencias alta',
      description: `${noShowRate}% de tus citas en los últimos 30 días no se presentaron. Considera activar recordatorios automáticos por WhatsApp.`,
      action: 'Activar recordatorios',
      severity: 'warning',
      metric: `${noShowRate}%`,
    })
  } else if (noShowRate >= 10) {
    recommendations.push({
      id: 'moderate_no_show',
      type: 'no_show',
      title: 'Inasistencias moderadas',
      description: `${noShowRate}% de inasistencias. Enviar recordatorio 24h antes puede reducirlo significativamente.`,
      action: 'Ver citas',
      severity: 'info',
      metric: `${noShowRate}%`,
    })
  } else if (noShowRate > 0) {
    recommendations.push({
      id: 'low_no_show',
      type: 'no_show',
      title: 'Excelente asistencia',
      description: `Solo ${noShowRate}% de inasistencias. Tus pacientes son muy puntuales.`,
      action: 'Ver detalle',
      severity: 'success',
      metric: `${noShowRate}%`,
    })
  }

  // Repeat no-shows
  if (repeatNoShows >= 3) {
    recommendations.push({
      id: 'repeat_no_shows',
      type: 'patient',
      title: `${repeatNoShows} pacientes con inasistencias repetidas`,
      description: 'Considera llamarlos directamente o requerirles confirmación explícita antes de la cita.',
      action: 'Ver pacientes',
      severity: 'warning',
      metric: repeatNoShows,
    })
  }

  // Occupancy recommendation
  if (avgDaily < 2 && patients.length > 5) {
    recommendations.push({
      id: 'low_occupancy',
      type: 'occupancy',
      title: 'Agenda con baja ocupación',
      description: `Promedio de ${avgDaily} citas/día en los últimos 30 días. Comparte tu link de citas para llenarte más.`,
      action: 'Compartir agenda',
      severity: 'warning',
      metric: `${avgDaily} citas/día`,
    })
  } else if (avgDaily >= 5) {
    recommendations.push({
      id: 'high_occupancy',
      type: 'occupancy',
      title: 'Agenda muy ocupada',
      description: `${avgDaily} citas/día en promedio. Considera agregar otro doctor o ampliar horarios.`,
      action: 'Configurar agenda',
      severity: 'info',
      metric: `${avgDaily} citas/día`,
    })
  }

  // New patients trend
  if (patientTrend !== null && patientTrend < -20) {
    recommendations.push({
      id: 'declining_patients',
      type: 'growth',
      title: 'Captación de pacientes cayendo',
      description: `${Math.abs(patientTrend)}% menos pacientes nuevos que el mes anterior. Revisa tu estrategia de marketing.`,
      action: 'Ver marketing',
      severity: 'warning',
      metric: `${patientTrend}%`,
    })
  } else if (patientTrend !== null && patientTrend >= 20) {
    recommendations.push({
      id: 'growing_patients',
      type: 'growth',
      title: '¡Crecimiento de pacientes!',
      description: `+${patientTrend}% más pacientes nuevos que el mes anterior. Sigue así.`,
      action: 'Ver tendencia',
      severity: 'success',
      metric: `+${patientTrend}%`,
    })
  }

  // Upcoming week
  if (upcoming.length === 0) {
    recommendations.push({
      id: 'empty_week',
      type: 'occupancy',
      title: 'Sin citas esta semana',
      description: 'No tienes citas agendadas en los próximos 7 días.',
      action: 'Agendar cita',
      severity: 'warning',
      metric: 0,
    })
  }

  return NextResponse.json({
    stats: {
      avg_daily_appointments: avgDaily,
      max_day_appointments: maxDay,
      no_show_rate: noShowRate,
      total_no_shows_30d: noShows.length,
      repeat_no_show_patients: repeatNoShows,
      new_patients_30d: newThisMonth,
      new_patients_prev_30d: newPrevMonth,
      patient_growth_pct: patientTrend,
      upcoming_7d: upcoming.length,
      upcoming_by_day: upcomingByDay,
      total_patients: patients.length,
    },
    recommendations,
    generated_at: new Date().toISOString(),
  })
}
