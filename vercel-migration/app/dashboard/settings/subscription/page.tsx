'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GlassPanel } from '@/components/ui/glass-panel'
import { ExternalLink, Loader2, CreditCard, CheckCircle, AlertTriangle, Clock } from 'lucide-react'

interface Subscription {
  plan_tier: string
  status: string
  trial_end: string | null
  current_period_end: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

const PLAN_LABELS: Record<string, string> = {
  basico: 'Básico',
  pro: 'Pro',
  enterprise: 'Enterprise',
  lifetime: 'Licencia Vitalicia',
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.FC<{ className?: string }> }> = {
  active:   { label: 'Activa',     color: 'text-emerald-300', icon: CheckCircle },
  trialing: { label: 'En prueba',  color: 'text-sky-300',     icon: Clock },
  canceled: { label: 'Cancelada',  color: 'text-red-400',     icon: AlertTriangle },
  past_due: { label: 'Pago vencido', color: 'text-yellow-300', icon: AlertTriangle },
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function SubscriptionSettingsPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSubscription = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan_tier, status, trial_end, current_period_end, stripe_customer_id, stripe_subscription_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!error && data) setSubscription(data)
      setLoading(false)
    }
    fetchSubscription()
  }, [])

  const handleOpenPortal = async () => {
    setPortalLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.url
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al abrir el portal')
      setPortalLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    const confirmed = window.confirm(
      'Esta accion cancelara tu suscripcion actual y desvinculara el metodo de pago de Stripe. ¿Deseas continuar?'
    )

    if (!confirmed) {
      return
    }

    setCancelLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/stripe/subscription/cancel', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo cancelar la suscripcion')

      setSubscription((current) => {
        if (!current) return current
        return {
          ...current,
          status: 'canceled',
          current_period_end: data.canceledAt || new Date().toISOString(),
          stripe_customer_id: null,
          stripe_subscription_id: null,
        }
      })

      setSuccess('Suscripcion cancelada y pagos desvinculados correctamente.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cancelar suscripcion')
    } finally {
      setCancelLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    )
  }

  const statusInfo = subscription ? (STATUS_LABELS[subscription.status] ?? STATUS_LABELS['active']) : null
  const StatusIcon = statusInfo?.icon ?? CheckCircle
  const isTrialing = subscription?.status === 'trialing'
  const planLabel = subscription ? (PLAN_LABELS[subscription.plan_tier] ?? subscription.plan_tier) : '—'
  const canCancelSubscription = Boolean(
    subscription &&
    subscription.stripe_subscription_id &&
    (subscription.status === 'active' || subscription.status === 'trialing')
  )

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Suscripción</h1>
        <p className="mt-1 text-sm text-white/60">
          Gestiona tu plan, método de pago y cancelación.
        </p>
      </div>

      {subscription ? (
        <>
          <GlassPanel className="divide-y divide-white/5">
            <div className="flex items-center justify-between px-6 py-5">
              <div>
                <p className="text-sm text-white/50 uppercase tracking-widest">Plan actual</p>
                <p className="mt-1 text-xl font-semibold text-white">{planLabel}</p>
              </div>
              <div className={`flex items-center gap-2 text-sm font-medium ${statusInfo?.color ?? 'text-white'}`}>
                <StatusIcon className="h-4 w-4" />
                {statusInfo?.label}
              </div>
            </div>

            {isTrialing && subscription.trial_end && (
              <div className="px-6 py-4">
                <p className="text-sm text-sky-300/80">
                  Tu prueba termina el{' '}
                  <strong className="text-sky-200">{formatDate(subscription.trial_end)}</strong>.
                  {subscription.stripe_subscription_id
                    ? ' Después se activará el cobro configurado en Stripe.'
                    : ' Para continuar después, deberás elegir un plan y agregar tu tarjeta.'}
                </p>
              </div>
            )}

            {!isTrialing && subscription.current_period_end && (
              <div className="px-6 py-4">
                <p className="text-sm text-white/60">
                  Próximo cobro:{' '}
                  <strong className="text-white">{formatDate(subscription.current_period_end)}</strong>
                </p>
              </div>
            )}

            {subscription.stripe_customer_id && (
              <div className="px-6 py-5">
                <button
                  onClick={handleOpenPortal}
                  disabled={portalLoading || cancelLoading}
                  className="aura-cta aura-cta--primary"
                >
                  {portalLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Abriendo portal...</>
                  ) : (
                    <><CreditCard className="h-4 w-4" /> Gestionar plan y pagos <ExternalLink className="h-4 w-4" /></>
                  )}
                </button>
                <p className="mt-3 text-xs text-white/40">
                  El portal de Stripe te permite cambiar de plan, actualizar tu método de pago o cancelar.
                </p>
              </div>
            )}

            {canCancelSubscription && (
              <div className="px-6 py-5">
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                  <p className="text-sm font-semibold text-red-200">Zona de cancelacion</p>
                  <p className="mt-1 text-xs text-red-100/80">
                    Esto cancela tu suscripcion y desvincula tu metodo de pago para detener cobros futuros.
                  </p>
                  <button
                    onClick={handleCancelSubscription}
                    disabled={cancelLoading || portalLoading}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-400/50 bg-red-500/20 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {cancelLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Cancelando suscripcion...</>
                    ) : (
                      <><AlertTriangle className="h-4 w-4" /> Cancelar suscripcion ahora</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </GlassPanel>

          {success && (
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-5 py-4 text-sm text-emerald-200">
              {success}
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/20 px-5 py-4 text-sm text-red-300">
              {error}
            </div>
          )}
        </>
      ) : (
        <GlassPanel className="px-6 py-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-yellow-400" />
          <p className="mt-4 text-white/70">No encontramos una suscripción activa en tu cuenta.</p>
          <a href="/select-trial-plan" className="aura-cta aura-cta--primary mt-6 inline-flex">
            Ver planes disponibles
          </a>
        </GlassPanel>
      )}
    </div>
  )
}
