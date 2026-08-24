/**
 * Fuente única de verdad de planes y precios (auditoría fable 2026-06-11, H2).
 *
 * ESTADO: el repositorio contiene precios divergentes ("desde $499",
 * Pro $1,499, Enterprise $2,999, valores distintos en FAQ/JSON-LD/emails).
 * PENDIENTE NEGOCIO (OD-2 en 19_OPEN_DECISIONS.md): el owner debe aprobar la
 * tabla definitiva. Estos valores reflejan los más repetidos en el código y
 * NO deben tratarse como aprobados hasta esa decisión.
 *
 * Regla: los componentes de UI, emails y schemas deben importar de aquí.
 * Los price IDs de Stripe/Mercado Pago viven en variables de entorno y se
 * mapean por clave de plan, nunca hardcodeados en componentes.
 */
export type PlanKey = 'basico' | 'pro' | 'enterprise'

export interface PlanPricing {
  key: PlanKey
  displayName: string
  monthlyMxn: number
  annualMxn: number
  trialDays: number
}

import { TRIAL_DAYS } from './trial'

export const PLANS: Record<PlanKey, PlanPricing> = {
  basico: { key: 'basico', displayName: 'Básico', monthlyMxn: 499, annualMxn: 4990, trialDays: TRIAL_DAYS },
  pro: { key: 'pro', displayName: 'Pro', monthlyMxn: 1499, annualMxn: 14990, trialDays: TRIAL_DAYS },
  enterprise: {
    key: 'enterprise',
    displayName: 'Enterprise',
    monthlyMxn: 2999,
    annualMxn: 29990,
    trialDays: TRIAL_DAYS,
  },
}

export const PRICING_APPROVED_BY_BUSINESS = false
