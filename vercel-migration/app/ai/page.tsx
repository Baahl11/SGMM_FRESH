'use client'

import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/app-layout'
import { GlassPanel } from '@/components/ui/glass-panel'
import { Button } from '@/components/ui/button'
import {
  Brain, TrendingUp, TrendingDown, Users, Calendar,
  AlertTriangle, CheckCircle, Info, RefreshCw,
  ArrowRight, BarChart3,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Recommendation {
  id: string
  type: string
  title: string
  description: string
  action: string
  severity: 'info' | 'warning' | 'success'
  metric?: string | number
}

interface Stats {
  avg_daily_appointments: number
  no_show_rate: number
  total_no_shows_30d: number
  repeat_no_show_patients: number
  new_patients_30d: number
  new_patients_prev_30d: number
  patient_growth_pct: number | null
  upcoming_7d: number
  total_patients: number
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  no_show: <Users className="h-5 w-5" />,
  occupancy: <Calendar className="h-5 w-5" />,
  growth: <TrendingUp className="h-5 w-5" />,
  patient: <Users className="h-5 w-5" />,
}

const SEVERITY_STYLES = {
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  info: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300',
}

const SEVERITY_ICON = {
  warning: <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />,
  success: <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />,
  info: <Info className="h-5 w-5 text-indigo-400 flex-shrink-0" />,
}

const ACTION_ROUTES: Record<string, string> = {
  'Ver recordatorios': '/mensajeria',
  'Activar recordatorios': '/mensajeria',
  'Ver citas': '/appointments',
  'Agendar cita': '/appointments',
  'Configurar agenda': '/settings',
  'Compartir agenda': '/settings',
  'Ver pacientes': '/patients',
  'Ver marketing': '/leads',
}

function StatCard({ label, value, sub, icon, trend }: {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  trend?: number | null
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
        <div className="text-slate-500">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
      {trend !== null && trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {trend > 0 ? '+' : ''}{trend}% vs mes anterior
        </div>
      )}
    </div>
  )
}

export default function AIRecommendationsPage() {
  const router = useRouter()
  const [data, setData] = useState<{ stats: Stats; recommendations: Recommendation[]; generated_at: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    const res = await fetch('/api/ai/recommendations')
    if (res.ok) setData(await res.json())
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { load() }, [])

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Recomendaciones IA</h1>
              <p className="text-sm text-slate-400">Basado en tus datos reales de los últimos 30 días</p>
            </div>
          </div>
          <Button
            onClick={() => load(true)}
            disabled={refreshing}
            variant="ghost"
            size="sm"
            className="gap-2 text-slate-400 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {data && <span className="text-[11px] text-slate-500 hidden sm:block">
              {new Date(data.generated_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </span>}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-indigo-500 mr-3" />
            Analizando tu clínica...
          </div>
        ) : data ? (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                label="Citas/día (30d)"
                value={data.stats.avg_daily_appointments}
                sub="promedio"
                icon={<Calendar className="h-4 w-4" />}
                trend={null}
              />
              <StatCard
                label="Inasistencias"
                value={`${data.stats.no_show_rate}%`}
                sub={`${data.stats.total_no_shows_30d} citas en 30 días`}
                icon={<Users className="h-4 w-4" />}
                trend={null}
              />
              <StatCard
                label="Pacientes nuevos"
                value={data.stats.new_patients_30d}
                sub="últimos 30 días"
                icon={<TrendingUp className="h-4 w-4" />}
                trend={data.stats.patient_growth_pct}
              />
              <StatCard
                label="Esta semana"
                value={data.stats.upcoming_7d}
                sub="citas próximas"
                icon={<BarChart3 className="h-4 w-4" />}
                trend={null}
              />
            </div>

            {/* Recommendations */}
            <div>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Recomendaciones ({data.recommendations.length})</h2>
              {data.recommendations.length === 0 ? (
                <GlassPanel className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <CheckCircle className="h-12 w-12 mb-3 text-emerald-500 opacity-60" />
                  <p className="font-medium text-white">Todo en orden</p>
                  <p className="text-sm mt-1">No hay recomendaciones activas en este momento.</p>
                </GlassPanel>
              ) : (
                <div className="space-y-3">
                  {data.recommendations.map(rec => (
                    <div
                      key={rec.id}
                      className={`rounded-2xl border p-4 flex items-start gap-4 ${SEVERITY_STYLES[rec.severity]}`}
                    >
                      {SEVERITY_ICON[rec.severity]}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-slate-500">{TYPE_ICONS[rec.type] ?? <Info className="h-4 w-4" />}</span>
                          <p className="font-semibold text-white">{rec.title}</p>
                          {rec.metric !== undefined && (
                            <span className="ml-auto text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-black/20">
                              {rec.metric}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-300">{rec.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const route = ACTION_ROUTES[rec.action]
                          if (route) router.push(route)
                        }}
                        className="flex-shrink-0 gap-1.5 text-xs text-white/70 hover:text-white hover:bg-white/10 h-8"
                      >
                        {rec.action}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Data context */}
            <GlassPanel className="p-4 flex items-start gap-3">
              <Brain className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400">
                Las recomendaciones se calculan en tiempo real con tus datos reales de los últimos 30–60 días.
                No se usa ningún modelo de lenguaje externo — los insights son deterministas basados en métricas clínicas estándar.
              </p>
            </GlassPanel>
          </>
        ) : (
          <GlassPanel className="flex items-center justify-center py-16 text-slate-400">
            Error al cargar datos. <Button variant="ghost" onClick={() => load()} className="ml-2">Reintentar</Button>
          </GlassPanel>
        )}
      </div>
    </AppLayout>
  )
}
