'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Star, AlertCircle } from 'lucide-react'

interface NpsSurvey {
  id: string
  title: string
  message: string
}

const LogoMark = () => (
  <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
    <defs>
      <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="50%" stopColor="#22d3ee" />
        <stop offset="100%" stopColor="#a855f7" />
      </linearGradient>
    </defs>
    <rect x="5" y="5" width="54" height="54" rx="18" fill="url(#g1)" />
    <rect x="16" y="18" width="32" height="28" rx="10" fill="rgba(15,23,42,0.2)" />
    <path d="M20 26h24" stroke="rgba(248,250,252,0.35)" strokeWidth="2" strokeLinecap="round" />
    <path d="M22 36c4 0 4-8 8-8s4 8 8 8 4-8 8-8" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const LABELS: Record<number, string> = {
  0: 'Muy insatisfecho',
  1: 'Muy insatisfecho',
  2: 'Insatisfecho',
  3: 'Insatisfecho',
  4: 'Poco satisfecho',
  5: 'Neutral',
  6: 'Algo satisfecho',
  7: 'Satisfecho',
  8: 'Muy satisfecho',
  9: 'Muy probable',
  10: 'Totalmente seguro',
}

function scoreColor(n: number): string {
  if (n >= 9) return 'bg-emerald-500 border-emerald-400 text-white'
  if (n >= 7) return 'bg-yellow-500 border-yellow-400 text-white'
  return 'bg-red-500 border-red-400 text-white'
}

function scoreHover(n: number): string {
  if (n >= 9) return 'hover:bg-emerald-500/20 hover:border-emerald-400 hover:text-emerald-300'
  if (n >= 7) return 'hover:bg-yellow-500/20 hover:border-yellow-400 hover:text-yellow-300'
  return 'hover:bg-red-500/20 hover:border-red-400 hover:text-red-300'
}

export default function PublicNpsPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const appointmentId = searchParams.get('apt') ?? undefined
  const patientId = searchParams.get('pid') ?? undefined

  const [survey, setSurvey] = useState<NpsSurvey | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [selected, setSelected] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/nps/${id}/public`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(json => setSurvey(json.survey))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit() {
    if (selected === null) { setError('Selecciona una puntuación'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/nps/${id}/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: selected,
          comment: comment.trim() || null,
          respondent_name: name.trim() || null,
          appointment_id: appointmentId ?? null,
          patient_id: patientId ?? null,
        }),
      })
      if (res.ok) setSubmitted(true)
      else setError('Error al enviar. Intenta de nuevo.')
    } catch {
      setError('Error de conexión.')
    }
    setSubmitting(false)
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-indigo-500" />
    </div>
  )

  if (notFound) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-950 to-slate-900 text-white">
      <AlertCircle className="h-12 w-12 text-slate-500" />
      <p className="text-lg font-medium">Encuesta no disponible</p>
      <p className="text-sm text-slate-400">El enlace puede haber expirado.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 px-4 py-10">
      <div className="mx-auto max-w-lg">
        {/* Brand */}
        <div className="mb-8 flex items-center gap-3">
          <LogoMark />
          <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-lg font-bold text-transparent">
            AgendaMedPro
          </span>
        </div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="thanks"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-10 text-center"
            >
              <CheckCircle className="mx-auto mb-4 h-14 w-14 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">¡Gracias por tu opinión!</h2>
              <p className="mt-2 text-slate-300">Tu retroalimentación nos ayuda a mejorar el servicio.</p>
              {selected !== null && (
                <p className="mt-4 text-4xl font-bold text-white">{selected}<span className="text-slate-400 text-lg">/10</span></p>
              )}
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                <Star className="mx-auto mb-3 h-8 w-8 text-yellow-400" />
                <h1 className="text-2xl font-bold text-white">{survey!.title}</h1>
                <p className="mt-2 text-slate-300">{survey!.message}</p>
              </div>

              {/* Score selector */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex justify-between text-xs text-slate-400 mb-3">
                  <span>Nada probable</span>
                  <span>Muy probable</span>
                </div>
                <div className="grid grid-cols-11 gap-1.5">
                  {Array.from({ length: 11 }, (_, i) => i).map(n => (
                    <button
                      key={n}
                      onClick={() => { setSelected(n); setError('') }}
                      className={`aspect-square flex items-center justify-center rounded-xl text-sm font-bold border transition-all ${
                        selected === n
                          ? scoreColor(n)
                          : `bg-white/5 border-white/10 text-slate-300 ${scoreHover(n)}`
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {selected !== null && (
                  <p className="mt-3 text-center text-sm font-medium text-slate-300">{LABELS[selected]}</p>
                )}
                {error && <p className="mt-2 text-center text-xs text-red-400">{error}</p>}
              </div>

              {/* Optional comment */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
                <div>
                  <label className="mb-1.5 block text-sm text-white">Tu nombre (opcional)</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej: María García"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-white">¿Qué podríamos mejorar? (opcional)</label>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    rows={3}
                    placeholder="Tu opinión es importante..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || selected === null}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : 'Enviar valoración'}
              </button>

              <p className="text-center text-xs text-slate-500">
                Tu respuesta es anónima y confidencial.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
