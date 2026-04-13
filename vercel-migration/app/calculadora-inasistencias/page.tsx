'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, MessageCircle, TrendingDown, TrendingUp, Clock, DollarSign } from 'lucide-react'
import { trackCtaClick, trackWhatsAppDemoClick } from '@/lib/analytics/funnel-events'
import { WHATSAPP_CALCULATOR_URL } from '@/lib/marketing/constants'

function currency(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

export default function CalculadoraInasistenciasPage() {
  const [citas, setCitas] = useState(40)
  const [ticket, setTicket] = useState(800)
  const [noShow, setNoShow] = useState(20)
  const [doctores, setDoctores] = useState(1)

  const totalCitasMes = citas * doctores * 4 // 4 semanas
  const noShowsMes = Math.round(totalCitasMes * (noShow / 100))
  const perdidaMes = noShowsMes * ticket
  const perdidaAnual = perdidaMes * 12
  const recuperable = Math.round(perdidaMes * 0.7) // conservador: 70% recuperable con anticipos
  const horasPerdidas = Math.round(noShowsMes * 0.5) // ~30min admin por no-show

  const sliderClass =
    'w-full accent-emerald-400 cursor-pointer h-2 rounded-full bg-white/10 appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400'

  return (
    <main className="min-h-screen bg-[#030614] text-white py-20 px-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="text-sm font-semibold tracking-[0.3em] uppercase text-white/50 hover:text-white">
            ← AgendaMedPro
          </Link>
          <p className="mt-6 text-sm uppercase tracking-[0.4em] text-emerald-300/70">Herramienta gratuita</p>
          <h1 className="mt-3 text-4xl font-semibold lg:text-5xl">
            ¿Cuánto pierde tu clínica por inasistencias?
          </h1>
          <p className="mt-4 text-white/60 max-w-xl mx-auto">
            Mueve los controles con los datos de tu consultorio y descubre el impacto real en segundos.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Inputs */}
          <div className="space-y-8 rounded-[32px] border border-white/10 bg-white/[0.03] p-8">
            <h2 className="text-lg font-semibold text-white/80">Datos de tu clínica</h2>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <label className="text-white/70">Citas por semana (por doctor)</label>
                <span className="font-semibold text-white">{citas}</span>
              </div>
              <input type="range" min={5} max={150} step={5} value={citas} onChange={e => setCitas(+e.target.value)} className={sliderClass} />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <label className="text-white/70">Ticket promedio por cita</label>
                <span className="font-semibold text-white">{currency(ticket)}</span>
              </div>
              <input type="range" min={200} max={5000} step={100} value={ticket} onChange={e => setTicket(+e.target.value)} className={sliderClass} />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <label className="text-white/70">% de inasistencias (no-shows)</label>
                <span className="font-semibold text-red-300">{noShow}%</span>
              </div>
              <input type="range" min={1} max={50} step={1} value={noShow} onChange={e => setNoShow(+e.target.value)} className={sliderClass} />
              <p className="text-xs text-white/40">Promedio en México sin recordatorios: 18–25%</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <label className="text-white/70">Número de doctores</label>
                <span className="font-semibold text-white">{doctores}</span>
              </div>
              <input type="range" min={1} max={15} step={1} value={doctores} onChange={e => setDoctores(+e.target.value)} className={sliderClass} />
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-red-400/20 bg-red-400/5 p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingDown className="h-5 w-5 text-red-300" />
                <p className="text-sm uppercase tracking-[0.25em] text-red-300/70">Pérdida mensual</p>
              </div>
              <p className="text-4xl font-semibold text-red-300">{currency(perdidaMes)}</p>
              <p className="mt-1 text-sm text-white/50">{noShowsMes} citas perdidas al mes</p>
            </div>

            <div className="rounded-3xl border border-red-400/10 bg-red-400/[0.03] p-6">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="h-5 w-5 text-red-200" />
                <p className="text-sm uppercase tracking-[0.25em] text-red-200/70">Pérdida anual</p>
              </div>
              <p className="text-3xl font-semibold text-red-200">{currency(perdidaAnual)}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-5 w-5 text-white/50" />
                <p className="text-sm uppercase tracking-[0.25em] text-white/40">Horas administrativas perdidas/mes</p>
              </div>
              <p className="text-2xl font-semibold text-white">{horasPerdidas} hrs</p>
              <p className="mt-1 text-xs text-white/40">Estimado: ~30 min de gestión por cada no-show</p>
            </div>

            <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-5 w-5 text-emerald-300" />
                <p className="text-sm uppercase tracking-[0.25em] text-emerald-300/70">Recuperable con anticipos</p>
              </div>
              <p className="text-3xl font-semibold text-emerald-300">{currency(recuperable)}<span className="text-base font-normal text-white/40">/mes</span></p>
              <p className="mt-1 text-xs text-white/40">Estimado conservador: 70% de no-shows evitados con depósito previo</p>
            </div>
          </div>
        </div>

        {/* CTA Block */}
        <div className="mt-12 rounded-[40px] border border-white/10 bg-gradient-to-br from-white/5 to-transparent px-8 py-12 text-center">
          <h2 className="text-2xl font-semibold lg:text-3xl">
            Recupera <span className="text-emerald-300">{currency(recuperable)}</span> al mes con AgendaMedPro
          </h2>
          <p className="mt-3 text-white/60 max-w-md mx-auto">
            Activando anticipos online y recordatorios automáticos por WhatsApp, la mayoría de clínicas reducen sus no-shows en 70–78% en el primer mes.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/auth/signup"
              className="aura-cta aura-cta--primary px-8 py-4 text-base"
              onClick={() => trackCtaClick('calculadora_signup', '/auth/signup')}
            >
              Prueba gratis 7 días
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href={WHATSAPP_CALCULATOR_URL}
              className="aura-cta px-8 py-4 text-base"
              rel="noreferrer"
              target="_blank"
              onClick={trackWhatsAppDemoClick}
            >
              <MessageCircle className="h-5 w-5" /> Hablar con un asesor
            </a>
          </div>
          <p className="mt-6 text-xs text-white/40">Activa con tarjeta · Sin cobro 7 días · Soporte en español</p>
        </div>
      </div>
    </main>
  )
}
