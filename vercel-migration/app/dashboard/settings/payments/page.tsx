'use client'

import { useState, useEffect } from 'react'
import { GlassPanel } from '@/components/ui/glass-panel'
import {
  CreditCard,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Loader2
} from 'lucide-react'

interface ConnectAccountStatus {
  has_account: boolean
  account_id?: string
  onboarding_completed: boolean
  charges_enabled: boolean
  payouts_enabled: boolean
  requirements?: Record<string, unknown>
}

export default function PaymentsSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [connectStatus, setConnectStatus] = useState<ConnectAccountStatus | null>(null)
  const [onboarding, setOnboarding] = useState(false)

  useEffect(() => {
    fetchConnectStatus()
  }, [])

  const fetchConnectStatus = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/stripe/connect/onboard')
      if (res.ok) {
        const data = await res.json()
        setConnectStatus(data)
      }
    } catch (error) {
      console.error('Error fetching Connect status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartOnboarding = async () => {
    try {
      setOnboarding(true)
      const res = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
      })

      if (!res.ok) {
        throw new Error('Failed to create onboarding link')
      }

      const { onboarding_url } = await res.json()
      
      // Redirigir a Stripe
      window.location.href = onboarding_url
    } catch (error: unknown) {
      console.error('Error starting onboarding:', error)
      const message = error instanceof Error ? error.message : 'Error desconocido'
      alert('Error al iniciar configuración: ' + message)
      setOnboarding(false)
    }
  }

  const handleOpenDashboard = async () => {
    try {
      const res = await fetch('/api/stripe/connect/dashboard', {
        method: 'POST',
      })

      if (!res.ok) {
        throw new Error('Failed to create dashboard link')
      }

      const { dashboard_url } = await res.json()
      window.open(dashboard_url, '_blank')
    } catch (error: unknown) {
      console.error('Error opening dashboard:', error)
      const message = error instanceof Error ? error.message : 'Error desconocido'
      alert('Error al abrir dashboard: ' + message)
    }
  }

  if (loading) {
    return (
      <GlassPanel className="flex min-h-[300px] items-center justify-center border-white/10 bg-white/5 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-300" />
      </GlassPanel>
    )
  }

  const benefits = [
    {
      title: 'Recibe pagos directamente',
      description: 'Los depósitos de tus pacientes llegan directo a tu cuenta',
      icon: CheckCircle
    },
    {
      title: 'Comisión transparente',
      description: 'Solo pagas 3% + $5 MXN por cada depósito procesado',
      icon: TrendingUp
    },
    {
      title: 'Pagos automáticos',
      description: 'Transferencias automáticas a tu cuenta bancaria',
      icon: DollarSign
    }
  ]

  const capabilityRows = [
    {
      label: 'Configuración completada',
      value: connectStatus?.onboarding_completed
    },
    {
      label: 'Pagos habilitados',
      value: connectStatus?.charges_enabled
    },
    {
      label: 'Retiros habilitados',
      value: connectStatus?.payouts_enabled
    }
  ]

  return (
    <div className="space-y-6 text-white">
      <GlassPanel className="relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-purple-500/30 blur-[160px]" />
          <div className="absolute -bottom-32 left-0 h-72 w-72 rounded-full bg-sky-500/25 blur-[150px]" />
        </div>
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-5 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
              <CreditCard className="h-4 w-4" />
              Pagos
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Configuración de Stripe Connect</h1>
              <p className="mt-2 text-sm text-white/70">Conecta tu cuenta para recibir depósitos y automatizar desembolsos.</p>
            </div>
          </div>
          <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            <div className="flex items-center justify-between">
              <span>Cuenta creada</span>
              <StatusIcon value={!!connectStatus?.has_account} />
            </div>
            <div className="flex items-center justify-between">
              <span>Onboarding</span>
              <StatusIcon value={!!connectStatus?.onboarding_completed} />
            </div>
            <div className="flex items-center justify-between">
              <span>Pagos habilitados</span>
              <StatusIcon value={!!connectStatus?.charges_enabled} />
            </div>
          </div>
        </div>
      </GlassPanel>

      <GlassPanel className="space-y-8 border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold">Stripe Connect</p>
              <p className="text-sm text-white/70">Recibe pagos de tus pacientes</p>
            </div>
          </div>
          {connectStatus?.onboarding_completed && (
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/60 bg-emerald-500/10 px-4 py-1 text-sm text-emerald-100">
              <CheckCircle className="h-4 w-4" /> Activo
            </div>
          )}
        </div>

        {!connectStatus?.has_account && (
          <div className="rounded-2xl border border-sky-400/40 bg-sky-500/10 p-4 text-sm text-sky-100">
            <div className="flex items-center gap-2 text-sky-200">
              <AlertCircle className="h-4 w-4" />
              Necesitas conectar Stripe
            </div>
            <p className="mt-2 text-white/80">Conecta tu cuenta para recibir depósitos directamente.</p>
          </div>
        )}

        {connectStatus?.has_account && !connectStatus.onboarding_completed && (
          <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm text-amber-100">
            <div className="flex items-center gap-2 text-amber-200">
              <AlertCircle className="h-4 w-4" />
              Falta completar la configuración
            </div>
            <p className="mt-2 text-white/80">Tu cuenta está creada, solo necesitas finalizar el onboarding.</p>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          {benefits.map(({ title, description, icon: Icon }) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                <Icon className="h-5 w-5" />
              </div>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-white/70">{description}</p>
            </div>
          ))}
        </div>

        {connectStatus?.has_account && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              {capabilityRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="text-white/70">{row.label}</span>
                  <StatusIcon value={!!row.value} />
                </div>
              ))}
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">ID de cuenta</span>
                <code className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/80">
                  {connectStatus?.account_id?.slice(0, 12) ?? '—'}
                </code>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {!connectStatus?.has_account || !connectStatus.onboarding_completed ? (
            <button
              onClick={handleStartOnboarding}
              disabled={onboarding}
              className="aura-cta aura-cta--primary px-6"
            >
              {onboarding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirigiendo...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  {connectStatus?.has_account ? 'Completar configuración' : 'Conectar Stripe'}
                </>
              )}
            </button>
          ) : (
            <button onClick={handleOpenDashboard} className="aura-cta aura-cta--ghost px-6">
              <ExternalLink className="h-4 w-4" />
              Abrir dashboard de Stripe
            </button>
          )}

          {connectStatus?.has_account && !connectStatus.onboarding_completed && (
            <button onClick={fetchConnectStatus} className="aura-cta aura-cta--ghost">
              Actualizar estado
            </button>
          )}
        </div>
      </GlassPanel>

      <GlassPanel className="space-y-3 border-white/10 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 p-6">
        <h3 className="text-lg font-semibold">ℹ️ Información importante</h3>
        <ul className="space-y-2 text-sm text-white/80">
          <li>El proceso de configuración toma aproximadamente 5 minutos.</li>
          <li>Necesitarás tu RFC, CLABE bancaria e identificación oficial.</li>
          <li>La plataforma cobra 3% + $5 MXN por cada depósito procesado.</li>
          <li>Los pagos llegan a tu cuenta en 2-3 días hábiles.</li>
        </ul>
      </GlassPanel>
    </div>
  )
}

function StatusIcon({ value }: { value: boolean }) {
  return value ? (
    <div className="flex items-center gap-1 text-emerald-200">
      <CheckCircle className="h-4 w-4" />
      <span className="text-xs uppercase tracking-[0.2em]">OK</span>
    </div>
  ) : (
    <div className="flex items-center gap-1 text-rose-200">
      <XCircle className="h-4 w-4" />
      <span className="text-xs uppercase tracking-[0.2em]">Pendiente</span>
    </div>
  )
}
