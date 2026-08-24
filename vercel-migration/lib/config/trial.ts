/**
 * Fuente única de verdad del periodo de prueba (auditoría fable 2026-06-11, H1).
 *
 * ANTES: app/api/activate-trial calculaba 7 días mientras Stripe, migraciones,
 * UI, emails y FAQ comunicaban 14. Se unifica en 14 días (el valor comunicado
 * públicamente; reducirlo silenciosamente perjudicaría a usuarios nuevos).
 * Cualquier cambio futuro debe hacerse aquí y validarse con negocio.
 */
export const TRIAL_DAYS = 14

export function trialEndDate(from: Date = new Date()): Date {
  const end = new Date(from)
  end.setDate(end.getDate() + TRIAL_DAYS)
  return end
}
