import { createClient } from '@supabase/supabase-js'
import emailService from '@/lib/email-service'
import { WHATSAPP_SALES_URL } from '@/lib/marketing/constants'

type BillingCycle = 'monthly' | 'annual'

type TrialWelcomeInput = {
  userId: string
  email: string
  name?: string | null
  planTier?: string | null
  priceId?: string | null
  trialStart?: string | null
  trialEnd?: string | null
  amountCents?: number | null
  currency?: string | null
  billingCycle?: BillingCycle | null
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agendamedpro.com'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function formatDate(iso: string | null | undefined) {
  if (!iso) return 'No disponible'
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function inferBillingCycle(priceId?: string | null, fallback?: BillingCycle | null): BillingCycle {
  if (fallback) return fallback
  if (!priceId) return 'monthly'
  return /(annual|year)/i.test(priceId) ? 'annual' : 'monthly'
}

function formatAmount(amountCents?: number | null, currency?: string | null) {
  if (typeof amountCents === 'number' && Number.isFinite(amountCents)) {
    const code = (currency ?? 'mxn').toUpperCase()
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 2,
    }).format(amountCents / 100)
  }
  return null
}

function fallbackPrice(planTier: string, billing: BillingCycle) {
  const normalized = (planTier || 'pro').toLowerCase()
  if (normalized === 'enterprise') {
    return billing === 'annual' ? '$29,990 MXN' : '$2,999 MXN'
  }
  if (normalized === 'pro') {
    return billing === 'annual' ? '$14,990 MXN' : '$1,499 MXN'
  }
  return billing === 'annual' ? '$4,990 MXN' : '$499 MXN'
}

function planLabel(planTier?: string | null) {
  const tier = (planTier || 'pro').toLowerCase()
  if (tier === 'enterprise') return 'Enterprise'
  if (tier === 'basico') return 'Basico'
  return 'Pro'
}

function buildEmailHtml(input: {
  name: string
  plan: string
  trialStart: string
  trialEnd: string
  firstChargeDate: string
  amountLabel: string
  billingLabel: string
  dashboardUrl: string
  subscriptionUrl: string
  supportUrl: string
}) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;background:#f8fafc;">
      <div style="background:linear-gradient(135deg,#0f766e 0%,#0ea5e9 100%);padding:28px;text-align:center;border-radius:14px 14px 0 0;">
        <h1 style="color:#ffffff;margin:0;font-size:24px;">Tu trial de 14 dias ya esta activo</h1>
      </div>
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-top:none;padding:30px;border-radius:0 0 14px 14px;">
        <p style="font-size:16px;color:#334155;line-height:1.7;margin-top:0;">Hola <strong>${input.name}</strong>,</p>
        <p style="font-size:15px;color:#475569;line-height:1.7;">Tu cuenta fue activada correctamente y ya tienes acceso completo a AgendaMedPro.</p>

        <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:16px;margin:20px 0;">
          <p style="margin:0;color:#115e59;"><strong>Plan:</strong> ${input.plan}</p>
          <p style="margin:6px 0 0;color:#115e59;"><strong>Inicio de trial:</strong> ${input.trialStart}</p>
          <p style="margin:6px 0 0;color:#115e59;"><strong>Fin de trial:</strong> ${input.trialEnd}</p>
        </div>

        <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:10px;padding:16px;margin:20px 0;">
          <p style="margin:0;color:#9a3412;"><strong>Primer cobro programado:</strong> ${input.firstChargeDate}</p>
          <p style="margin:6px 0 0;color:#9a3412;"><strong>Monto:</strong> ${input.amountLabel} (${input.billingLabel})</p>
          <p style="margin:8px 0 0;color:#9a3412;font-size:13px;">Si no deseas continuar, cancela antes de esa fecha y no se realiza cobro.</p>
        </div>

        <div style="text-align:center;margin:26px 0 10px;">
          <a href="${input.dashboardUrl}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;">Entrar a mi dashboard</a>
        </div>
        <div style="text-align:center;margin:10px 0 24px;">
          <a href="${input.subscriptionUrl}" style="display:inline-block;background:#ffffff;color:#0f172a;text-decoration:none;padding:11px 20px;border-radius:8px;border:1px solid #cbd5e1;font-weight:600;">Gestionar suscripcion</a>
        </div>

        <p style="font-size:13px;color:#64748b;line-height:1.6;margin:0;">Soporte: <a href="${input.supportUrl}" style="color:#0f766e;">WhatsApp</a></p>
      </div>
    </div>
  `
}

export async function sendTrialWelcomeEmail(input: TrialWelcomeInput) {
  const { data: sub, error: subError } = await supabaseAdmin
    .from('subscriptions')
    .select('id, onboarding_emails_sent, plan_tier, trial_start, trial_end, current_period_end, stripe_price_id')
    .eq('user_id', input.userId)
    .maybeSingle()

  if (subError || !sub) {
    return { ok: false, reason: 'subscription_not_found' as const }
  }

  const alreadySent: string[] = sub.onboarding_emails_sent ?? []
  if (alreadySent.includes('day0_welcome')) {
    return { ok: true, skipped: true as const }
  }

  const normalizedName = input.name?.trim() || input.email.split('@')[0] || 'Doctor'
  const billing = inferBillingCycle(input.priceId ?? sub.stripe_price_id, input.billingCycle ?? null)
  const amountLabel = formatAmount(input.amountCents ?? null, input.currency ?? 'mxn')
    ?? fallbackPrice(input.planTier ?? sub.plan_tier ?? 'pro', billing)

  const trialStart = input.trialStart ?? sub.trial_start
  const trialEnd = input.trialEnd ?? sub.trial_end
  const firstChargeDate = trialEnd ?? sub.current_period_end
  const plan = planLabel(input.planTier ?? sub.plan_tier)
  const billingLabel = billing === 'annual' ? 'cobro anual' : 'cobro mensual'

  const html = buildEmailHtml({
    name: normalizedName,
    plan,
    trialStart: formatDate(trialStart),
    trialEnd: formatDate(trialEnd),
    firstChargeDate: formatDate(firstChargeDate),
    amountLabel,
    billingLabel,
    dashboardUrl: `${BASE_URL}/dashboard`,
    subscriptionUrl: `${BASE_URL}/dashboard/settings/subscription`,
    supportUrl: WHATSAPP_SALES_URL,
  })

  await emailService.sendCustomEmail(
    input.email,
    `Tu trial de 14 dias esta activo (${plan})`,
    html,
    true
  )

  await supabaseAdmin
    .from('subscriptions')
    .update({ onboarding_emails_sent: [...alreadySent, 'day0_welcome'] })
    .eq('id', sub.id)

  return { ok: true, skipped: false as const }
}
