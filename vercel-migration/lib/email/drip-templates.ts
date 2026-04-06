/**
 * Onboarding drip email templates.
 * Each template receives { name, email, dashboardUrl }.
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://agendamedpro.com'
const DASHBOARD = `${BASE_URL}/dashboard`

type DripData = { name: string; email: string }

export type DripEmailId = 'day0_welcome' | 'day1_tips' | 'day3_patients' | 'day5_review'

export interface DripEmail {
  id: DripEmailId
  subject: string
  html: (d: DripData) => string
}

function wrapper(content: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;">
      <div style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:32px;text-align:center;border-radius:12px 12px 0 0;">
        <h1 style="color:white;margin:0;font-size:24px;letter-spacing:-0.5px;">AgendaMedPro</h1>
      </div>
      <div style="background:white;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
        ${content}
      </div>
      <p style="text-align:center;font-size:12px;color:#94a3b8;padding:16px 0;">
        AgendaMedPro · <a href="${BASE_URL}/privacidad" style="color:#94a3b8;">Privacidad</a>
      </p>
    </div>`
}

function cta(label: string, url: string) {
  return `<div style="text-align:center;margin:28px 0;">
    <a href="${url}" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;display:inline-block;">
      ${label} →
    </a>
  </div>`
}

export const DRIP_EMAILS: DripEmail[] = [
  {
    id: 'day0_welcome',
    subject: '¡Bienvenido a AgendaMedPro! Tu clínica más organizada empieza hoy 🎉',
    html: ({ name }) => wrapper(`
      <h2 style="color:#1e293b;margin-top:0;">¡Hola ${name}! 👋</h2>
      <p style="color:#475569;line-height:1.7;">Ya tienes acceso a <strong>7 días gratis</strong> de AgendaMedPro. En los próximos días te mandaremos tips concretos para sacarle el máximo provecho.</p>
      <p style="color:#475569;line-height:1.7;">Para empezar, te recomendamos completar estas 3 acciones rápidas:</p>
      <ol style="color:#475569;line-height:2;">
        <li>Configura tu perfil y datos del consultorio</li>
        <li>Agenda tu primera cita de prueba</li>
        <li>Activa los recordatorios por WhatsApp</li>
      </ol>
      ${cta('Ir a mi dashboard', DASHBOARD)}
      <p style="color:#94a3b8;font-size:13px;text-align:center;">¿Tienes dudas? Escríbenos por WhatsApp: <a href="https://wa.me/522223404585" style="color:#6366f1;">+52 222 340 4585</a></p>
    `),
  },
  {
    id: 'day1_tips',
    subject: '3 cosas que los consultorios más productivos hacen diferente 📅',
    html: ({ name }) => wrapper(`
      <h2 style="color:#1e293b;margin-top:0;">Hola ${name},</h2>
      <p style="color:#475569;line-height:1.7;">Llevas 1 día usando AgendaMedPro. Aquí los 3 trucos que usan los consultorios que más reducen inasistencias:</p>
      <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:16px;margin:16px 0;border-radius:0 8px 8px 0;">
        <strong style="color:#15803d;">1. Activa recordatorios 24h antes</strong>
        <p style="color:#475569;margin:6px 0 0;">Los recordatorios automáticos por WhatsApp reducen inasistencias hasta un 90%.</p>
      </div>
      <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:16px;margin:16px 0;border-radius:0 8px 8px 0;">
        <strong style="color:#1d4ed8;">2. Usa la vista semanal multidoctor</strong>
        <p style="color:#475569;margin:6px 0 0;">Si tienes más de 1 médico, la vista de agenda paralela te ayuda a optimizar horarios.</p>
      </div>
      <div style="background:#faf5ff;border-left:4px solid #a855f7;padding:16px;margin:16px 0;border-radius:0 8px 8px 0;">
        <strong style="color:#7e22ce;">3. Captura confirmaciones de cita</strong>
        <p style="color:#475569;margin:6px 0 0;">Los pacientes que confirman tienen 3x menos probabilidad de no presentarse.</p>
      </div>
      ${cta('Explorar estas funciones', `${DASHBOARD}/agenda`)}
    `),
  },
  {
    id: 'day3_patients',
    subject: 'Tu expediente clínico digital está listo para recibir pacientes 📋',
    html: ({ name }) => wrapper(`
      <h2 style="color:#1e293b;margin-top:0;">Hola ${name},</h2>
      <p style="color:#475569;line-height:1.7;">Ya llevas 3 días con AgendaMedPro. Es el momento perfecto para importar o crear tu lista de pacientes.</p>
      <p style="color:#475569;line-height:1.7;">Con el módulo de <strong>Pacientes</strong> puedes:</p>
      <ul style="color:#475569;line-height:2;">
        <li>📁 Guardar expedientes clínicos completos</li>
        <li>📂 Adjuntar estudios y documentos</li>
        <li>🔍 Buscar por nombre, teléfono o email al instante</li>
        <li>📊 Ver historial de citas y tratamientos</li>
      </ul>
      ${cta('Ir a Pacientes', `${DASHBOARD}/patients`)}
      <p style="color:#94a3b8;font-size:13px;">¿Necesitas migrar datos de otro sistema? <a href="https://wa.me/522223404585?text=Necesito+ayuda+para+migrar+mis+pacientes" style="color:#6366f1;">Escríbenos y te ayudamos.</a></p>
    `),
  },
  {
    id: 'day5_review',
    subject: 'Tu prueba termina en 2 días — ¿qué has logrado? 🎯',
    html: ({ name }) => wrapper(`
      <h2 style="color:#1e293b;margin-top:0;">Hola ${name},</h2>
      <p style="color:#475569;line-height:1.7;">Tu prueba gratuita de AgendaMedPro termina en <strong>2 días</strong>. Para no perder acceso a todo lo que ya configuraste, activa tu plan ahora.</p>
      <div style="background:#fefce8;border:1px solid #fde047;padding:20px;border-radius:8px;margin:20px 0;">
        <p style="color:#713f12;margin:0;font-size:15px;text-align:center;">
          🔒 Todo tu historial, citas y configuración se conserva al activar tu plan.
        </p>
      </div>
      <p style="color:#475569;line-height:1.7;">Recuerda los beneficios: agenda inteligente, recordatorios WhatsApp, facturación CFDI, expedientes clínicos y soporte dedicado.</p>
      ${cta('Activar mi plan', `${DASHBOARD}/settings/subscription`)}
      <p style="color:#94a3b8;font-size:13px;text-align:center;">¿Tienes preguntas sobre el precio o las funciones? <a href="https://wa.me/522223404585" style="color:#6366f1;">Habla con nosotros.</a></p>
    `),
  },
]

export const DRIP_BY_ID = Object.fromEntries(
  DRIP_EMAILS.map((e) => [e.id, e])
) as Record<DripEmailId, DripEmail>
