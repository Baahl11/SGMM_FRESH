'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, ChevronRight, AlertCircle } from 'lucide-react'

interface FormField {
  id: string
  type: string
  label: string
  required: boolean
  options?: string[]
  placeholder?: string
}

interface IntakeForm {
  id: string
  title: string
  description: string | null
  fields: FormField[]
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

export default function PublicIntakeFormPage() {
  const { id } = useParams<{ id: string }>()
  const [form, setForm] = useState<IntakeForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch(`/api/intake-forms/${id}/public`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(json => setForm(json.form))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  function setAnswer(fieldId: string, value: unknown) {
    setAnswers(prev => ({ ...prev, [fieldId]: value }))
    if (errors[fieldId]) setErrors(prev => { const e = { ...prev }; delete e[fieldId]; return e })
  }

  function toggleCheckbox(fieldId: string, option: string) {
    const current = (answers[fieldId] as string[]) ?? []
    const next = current.includes(option) ? current.filter(v => v !== option) : [...current, option]
    setAnswer(fieldId, next)
  }

  function validate() {
    const errs: Record<string, string> = {}
    if (!nombre.trim()) errs['_nombre'] = 'Tu nombre es requerido'
    form?.fields.forEach(f => {
      if (!f.required) return
      const v = answers[f.id]
      const empty = v === undefined || v === '' || (Array.isArray(v) && v.length === 0)
      if (empty) errs[f.id] = 'Este campo es obligatorio'
    })
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSubmitting(true)

    try {
      const res = await fetch(`/api/intake-forms/${id}/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, telefono, answers }),
      })
      if (res.ok) setSubmitted(true)
      else setErrors({ _global: 'Error al enviar. Intenta de nuevo.' })
    } catch {
      setErrors({ _global: 'Error de conexión. Intenta de nuevo.' })
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
      <p className="text-lg font-medium">Formulario no disponible</p>
      <p className="text-sm text-slate-400">El enlace puede haber expirado o estar desactivado.</p>
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
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-10 text-center"
            >
              <CheckCircle className="mx-auto mb-4 h-14 w-14 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">¡Formulario enviado!</h2>
              <p className="mt-2 text-slate-300">Gracias. Tu consultorio recibirá la información antes de tu cita.</p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {/* Header */}
              <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6">
                <h1 className="text-2xl font-bold text-white">{form!.title}</h1>
                {form!.description && <p className="mt-2 text-slate-300">{form!.description}</p>}
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {/* Patient identity */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tus datos</p>
                  <div>
                    <label className="mb-1 block text-sm text-white">Nombre completo *</label>
                    <input
                      value={nombre}
                      onChange={e => { setNombre(e.target.value); if (errors['_nombre']) setErrors(p => { const e = { ...p }; delete e['_nombre']; return e }) }}
                      placeholder="Dr./Dra. o paciente"
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors['_nombre'] ? 'border-red-400' : 'border-white/10'}`}
                    />
                    {errors['_nombre'] && <p className="mt-1 text-xs text-red-400">{errors['_nombre']}</p>}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm text-white">Teléfono</label>
                      <input
                        value={telefono}
                        onChange={e => setTelefono(e.target.value)}
                        type="tel"
                        placeholder="+52 555 000 0000"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-white">Email</label>
                      <input
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        type="email"
                        placeholder="correo@ejemplo.com"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Dynamic fields */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-5">
                  {form!.fields.map(field => (
                    <div key={field.id}>
                      <label className="mb-1.5 block text-sm font-medium text-white">
                        {field.label}
                        {field.required && <span className="ml-1 text-red-400">*</span>}
                      </label>

                      {field.type === 'text' && (
                        <input
                          value={(answers[field.id] as string) ?? ''}
                          onChange={e => setAnswer(field.id, e.target.value)}
                          placeholder={field.placeholder ?? ''}
                          className={`w-full rounded-xl border px-4 py-2.5 text-sm bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors[field.id] ? 'border-red-400' : 'border-white/10'}`}
                        />
                      )}

                      {field.type === 'textarea' && (
                        <textarea
                          value={(answers[field.id] as string) ?? ''}
                          onChange={e => setAnswer(field.id, e.target.value)}
                          rows={3}
                          placeholder={field.placeholder ?? ''}
                          className={`w-full resize-none rounded-xl border px-4 py-2.5 text-sm bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors[field.id] ? 'border-red-400' : 'border-white/10'}`}
                        />
                      )}

                      {(field.type === 'email' || field.type === 'phone' || field.type === 'date') && (
                        <input
                          type={field.type === 'phone' ? 'tel' : field.type}
                          value={(answers[field.id] as string) ?? ''}
                          onChange={e => setAnswer(field.id, e.target.value)}
                          className={`w-full rounded-xl border px-4 py-2.5 text-sm bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors[field.id] ? 'border-red-400' : 'border-white/10'}`}
                        />
                      )}

                      {field.type === 'select' && (
                        <select
                          value={(answers[field.id] as string) ?? ''}
                          onChange={e => setAnswer(field.id, e.target.value)}
                          className={`w-full rounded-xl border px-4 py-2.5 text-sm bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors[field.id] ? 'border-red-400' : 'border-white/10'}`}
                        >
                          <option value="">Selecciona una opción</option>
                          {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      )}

                      {field.type === 'radio' && (
                        <div className="space-y-2">
                          {field.options?.map(opt => (
                            <label key={opt} className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="radio"
                                name={field.id}
                                value={opt}
                                checked={answers[field.id] === opt}
                                onChange={() => setAnswer(field.id, opt)}
                                className="accent-indigo-500"
                              />
                              <span className="text-sm text-slate-200">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {field.type === 'checkbox' && (
                        <div className="space-y-2">
                          {field.options?.map(opt => (
                            <label key={opt} className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={((answers[field.id] as string[]) ?? []).includes(opt)}
                                onChange={() => toggleCheckbox(field.id, opt)}
                                className="rounded accent-indigo-500"
                              />
                              <span className="text-sm text-slate-200">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {errors[field.id] && <p className="mt-1 text-xs text-red-400">{errors[field.id]}</p>}
                    </div>
                  ))}
                </div>

                {errors['_global'] && (
                  <p className="text-sm text-red-400 text-center">{errors['_global']}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? 'Enviando...' : 'Enviar formulario'}
                  <ChevronRight className="h-4 w-4" />
                </button>

                <p className="text-center text-xs text-slate-500">
                  Tus datos son confidenciales y solo los verá tu consultorio.
                </p>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
