'use client'

import { useEffect, useState, useCallback } from 'react'
import AppLayout from '@/components/layout/app-layout'
import { GlassPanel } from '@/components/ui/glass-panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  Plus, Star, Copy, ExternalLink, ToggleLeft, ToggleRight, Trash2, ChevronRight,
  TrendingUp, Users, ThumbsUp, ThumbsDown, Minus,
} from 'lucide-react'
import { toast } from 'sonner'

interface NpsSurvey {
  id: string
  title: string
  message: string
  is_active: boolean
  send_delay_hours: number
  response_count: number
  avg_score: number | null
  nps_score: number | null
  created_at: string
}

function NpsGauge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-slate-500 text-sm">—</span>
  const color = score >= 50 ? 'text-emerald-400' : score >= 0 ? 'text-yellow-400' : 'text-red-400'
  return <span className={`text-xl font-bold tabular-nums ${color}`}>{score > 0 ? '+' : ''}{score}</span>
}

function ScoreBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-xs text-slate-400">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-xs text-right text-slate-400">{count}</span>
    </div>
  )
}

export default function NpsPage() {
  const [surveys, setSurveys] = useState<NpsSurvey[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partial<NpsSurvey> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [detail, setDetail] = useState<{ survey: NpsSurvey; responses: unknown[]; stats: { total: number; promoters: number; passives: number; detractors: number; nps_score: number | null; avg_score: number | null } } | null>(null)

  const fetchSurveys = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/nps')
    if (res.ok) setSurveys((await res.json()).surveys)
    setLoading(false)
  }, [])

  useEffect(() => { fetchSurveys() }, [fetchSurveys])

  async function openDetail(survey: NpsSurvey) {
    const res = await fetch(`/api/nps/${survey.id}`)
    if (res.ok) setDetail(await res.json())
  }

  function openNew() {
    setEditing({ title: 'Califica tu experiencia', message: '¿Qué tan probable es que nos recomiendes con un familiar o amigo?', send_delay_hours: 2 })
    setIsNew(true)
  }

  async function save() {
    if (!editing?.title?.trim()) { toast.error('El título es requerido'); return }
    setSaving(true)
    const payload = { title: editing.title, message: editing.message, send_delay_hours: editing.send_delay_hours ?? 2 }
    const res = isNew
      ? await fetch('/api/nps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : await fetch(`/api/nps/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (res.ok) {
      const json = await res.json()
      if (isNew) setSurveys(p => [{ ...json.survey, response_count: 0, avg_score: null, nps_score: null }, ...p])
      else setSurveys(p => p.map(s => s.id === json.survey.id ? { ...s, ...json.survey } : s))
      setEditing(null)
      toast.success(isNew ? 'Encuesta creada' : 'Cambios guardados')
    } else toast.error('Error al guardar')
    setSaving(false)
  }

  async function toggleActive(survey: NpsSurvey) {
    const res = await fetch(`/api/nps/${survey.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !survey.is_active }),
    })
    if (res.ok) setSurveys(p => p.map(s => s.id === survey.id ? { ...s, is_active: !s.is_active } : s))
  }

  async function deleteSurvey(id: string) {
    if (!confirm('¿Eliminar esta encuesta y todas sus respuestas?')) return
    const res = await fetch(`/api/nps/${id}`, { method: 'DELETE' })
    if (res.ok) { setSurveys(p => p.filter(s => s.id !== id)); toast.success('Encuesta eliminada') }
  }

  function copyLink(id: string) {
    navigator.clipboard.writeText(`${window.location.origin}/nps/${id}`)
    toast.success('Enlace copiado')
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Encuestas NPS</h1>
            <p className="text-sm text-slate-400">Mide la satisfacción post-consulta</p>
          </div>
          <Button onClick={openNew} className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white">
            <Plus className="h-4 w-4" /> Nueva encuesta
          </Button>
        </div>

        {/* List */}
        <GlassPanel className="overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">Cargando...</div>
          ) : surveys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Star className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">No hay encuestas aún</p>
              <Button variant="ghost" onClick={openNew} className="mt-4 text-indigo-400">+ Crear la primera</Button>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {surveys.map(s => (
                <li key={s.id} className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors">
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => openDetail(s)}>
                    <p className="font-medium text-white text-sm truncate">{s.title}</p>
                    <p className="text-xs text-slate-400 truncate">{s.message}</p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-center hidden sm:block">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">NPS</p>
                      <NpsGauge score={s.nps_score} />
                    </div>
                    <div className="text-center hidden sm:block">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Resp.</p>
                      <p className="text-sm font-bold text-white">{s.response_count}</p>
                    </div>
                    <Badge className={s.is_active ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'}>
                      {s.is_active ? 'Activa' : 'Inactiva'}
                    </Badge>
                    <button onClick={() => copyLink(s.id)} title="Copiar enlace" className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white">
                      <Copy className="h-4 w-4" />
                    </button>
                    <a href={`/nps/${s.id}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button onClick={() => toggleActive(s)} className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10">
                      {s.is_active ? <ToggleRight className="h-4 w-4 text-emerald-400" /> : <ToggleLeft className="h-4 w-4" />}
                    </button>
                    <button onClick={() => { setEditing(s); setIsNew(false) }} className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteSurvey(s.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GlassPanel>

        {/* Info card */}
        <GlassPanel className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <TrendingUp className="h-6 w-6 text-indigo-400 flex-shrink-0" />
          <div className="text-sm text-slate-300">
            <p className="font-medium text-white">¿Cómo funciona el NPS?</p>
            <p className="text-slate-400 mt-0.5">Promotores (9-10) − Detractores (0-6). Score &gt;50 = excelente · 0-50 = bueno · &lt;0 = necesita atención.</p>
          </div>
          <div className="flex gap-3 text-xs flex-shrink-0">
            <span className="flex items-center gap-1.5 text-emerald-300"><ThumbsUp className="h-3.5 w-3.5" /> 9-10 Promotores</span>
            <span className="flex items-center gap-1.5 text-yellow-300"><Minus className="h-3.5 w-3.5" /> 7-8 Pasivos</span>
            <span className="flex items-center gap-1.5 text-red-300"><ThumbsDown className="h-3.5 w-3.5" /> 0-6 Detractores</span>
          </div>
        </GlassPanel>
      </div>

      {/* Edit Sheet */}
      <Sheet open={!!editing} onOpenChange={open => { if (!open) setEditing(null) }}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-slate-900 border-white/10 text-white flex flex-col">
          {editing && (
            <>
              <SheetHeader className="flex-shrink-0">
                <SheetTitle className="text-white">{isNew ? 'Nueva encuesta NPS' : 'Editar encuesta'}</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto space-y-4 py-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Título *</label>
                  <Input value={editing.title ?? ''} onChange={e => setEditing({ ...editing, title: e.target.value })} className="bg-white/5 border-white/10 text-white" placeholder="Califica tu experiencia" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Mensaje NPS</label>
                  <Textarea value={editing.message ?? ''} onChange={e => setEditing({ ...editing, message: e.target.value })} rows={3} className="bg-white/5 border-white/10 text-white resize-none" placeholder="¿Qué tan probable es que nos recomiendes?" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Horas tras la cita para enviar</label>
                  <Input
                    type="number"
                    min={0}
                    value={editing.send_delay_hours ?? 2}
                    onChange={e => setEditing({ ...editing, send_delay_hours: +e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <p className="mt-1 text-xs text-slate-500">0 = inmediatamente al cerrar cita</p>
                </div>
              </div>
              <div className="flex-shrink-0 pt-3 border-t border-white/10 flex gap-3">
                <Button variant="ghost" onClick={() => setEditing(null)} className="flex-1 text-slate-400">Cancelar</Button>
                <Button onClick={save} disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-500">
                  {saving ? 'Guardando...' : isNew ? 'Crear' : 'Guardar'}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Detail Sheet */}
      <Sheet open={!!detail} onOpenChange={open => { if (!open) setDetail(null) }}>
        <SheetContent side="right" className="w-full sm:max-w-lg bg-slate-900 border-white/10 text-white flex flex-col overflow-hidden">
          {detail && (
            <>
              <SheetHeader className="flex-shrink-0">
                <SheetTitle className="text-white">{detail.survey.title}</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto space-y-5 py-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'NPS Score', value: detail.stats.nps_score !== null ? `${detail.stats.nps_score > 0 ? '+' : ''}${detail.stats.nps_score}` : '—', color: detail.stats.nps_score !== null && detail.stats.nps_score >= 50 ? 'text-emerald-400' : detail.stats.nps_score !== null && detail.stats.nps_score >= 0 ? 'text-yellow-400' : 'text-red-400' },
                    { label: 'Promedio', value: detail.stats.avg_score !== null ? `${detail.stats.avg_score}/10` : '—', color: 'text-white' },
                    { label: 'Respuestas', value: detail.stats.total, color: 'text-white' },
                  ].map(stat => (
                    <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
                      <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Distribución</p>
                  <ScoreBar label="Promotores" count={detail.stats.promoters} total={detail.stats.total} color="bg-emerald-500" />
                  <ScoreBar label="Pasivos" count={detail.stats.passives} total={detail.stats.total} color="bg-yellow-500" />
                  <ScoreBar label="Detractores" count={detail.stats.detractors} total={detail.stats.total} color="bg-red-500" />
                </div>

                {/* Responses */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Últimas respuestas</p>
                  {(detail.responses as Array<{ id: string; score: number; comment: string | null; respondent_name: string | null; submitted_at: string }>).length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6">Sin respuestas</p>
                  ) : (
                    <div className="space-y-3">
                      {(detail.responses as Array<{ id: string; score: number; comment: string | null; respondent_name: string | null; submitted_at: string }>).slice(0, 20).map(r => (
                        <div key={r.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-lg font-bold ${r.score >= 9 ? 'text-emerald-400' : r.score >= 7 ? 'text-yellow-400' : 'text-red-400'}`}>{r.score}</span>
                              <Users className="h-3 w-3 text-slate-500" />
                              <span className="text-xs text-slate-400">{r.respondent_name ?? 'Anónimo'}</span>
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {new Date(r.submitted_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                          {r.comment && <p className="text-sm text-slate-300 mt-1">"{r.comment}"</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AppLayout>
  )
}
