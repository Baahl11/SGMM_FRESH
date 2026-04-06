'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, CheckCircle } from 'lucide-react'
import { trackCtaClick } from '@/lib/analytics/funnel-events'

export function ContactSection() {
  const [form, setForm] = useState({ nombre: '', telefono: '', email: '', mensaje: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  function getUtmData(): Record<string, string> {
    if (typeof window === 'undefined') return {}
    try {
      const raw = sessionStorage.getItem('utm_data')
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) return
    setSending(true)

    trackCtaClick('contact_form', 'submit')

    try {
      await fetch('/api/leads/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ...getUtmData() }),
      })
    } catch {
      // Fail silently — don't block the UX
    }

    setSent(true)
    setSending(false)
  }

  return (
    <section className="relative py-20 px-4">
      <div className="mx-auto max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-white">
              ¿Tienes preguntas? <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Escríbenos</span>
            </h2>
            <p className="mt-2 text-slate-400">
              Nuestro equipo te responde en menos de 2 horas, de lunes a sábado.
            </p>
          </div>

          {sent ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-10 text-center">
              <CheckCircle className="h-12 w-12 text-emerald-400" />
              <p className="text-lg font-semibold text-white">¡Mensaje recibido!</p>
              <p className="text-slate-400">Te contactamos a la brevedad.</p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Nombre *</label>
                  <input
                    required
                    value={form.nombre}
                    onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                    placeholder="Dr. González"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Teléfono</label>
                  <input
                    value={form.telefono}
                    onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))}
                    placeholder="+52 222 000 0000"
                    type="tel"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Email</label>
                <input
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="doctor@miclinica.com"
                  type="email"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Mensaje</label>
                <textarea
                  value={form.mensaje}
                  onChange={e => setForm(p => ({ ...p, mensaje: e.target.value }))}
                  placeholder="¿Qué tipo de consultorio tienes? ¿Cuántos doctores? ¿Qué necesitas?"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {sending ? 'Enviando...' : 'Enviar mensaje'}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  )
}
