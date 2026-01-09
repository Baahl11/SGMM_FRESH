import Link from 'next/link'
import { Shield, Lock, KeySquare, AlertTriangle, ArrowLeft } from 'lucide-react'
import { GlassPanel } from '@/components/ui/glass-panel'

const policySections = [
  {
    title: 'Principios generales',
    icon: Shield,
    items: [
      'Cada usuario recibe un rol mínimo necesario (principio de menor privilegio).',
      'Las cuentas son personales e intransferibles; está prohibido compartir credenciales.',
      'Todo acceso queda registrado y es monitoreado para cumplir con la NOM-024 y GDPR.',
    ],
  },
  {
    title: 'Controles de acceso',
    icon: Lock,
    items: [
      'Los propietarios definen quién administra sedes, catálogos y facturación.',
      'El personal clínico sólo accede a agendas, expedientes y salas asignadas.',
      'Recepción y call center operan agendas pero no pueden exportar reportes sensibles.',
    ],
  },
  {
    title: 'Credenciales y autenticación',
    icon: KeySquare,
    items: [
      'Se exige contraseña con al menos 10 caracteres, mayúsculas, minúsculas y número.',
      'Cada 180 días se solicita rotación automática de contraseña.',
      'La autenticación en dos pasos (2FA) es obligatoria para propietarios y administradores.',
    ],
  },
  {
    title: 'Respuesta a incidentes',
    icon: AlertTriangle,
    items: [
      'Todo acceso sospechoso se bloquea de inmediato y se notifica al responsable.',
      'Las sesiones se cierran tras 15 minutos de inactividad en dispositivos compartidos.',
      'Cuentas inactivas por más de 45 días pasan a estado suspendido automáticamente.',
    ],
  },
]

export default function TeamPoliciesPage() {
  return (
    <div className="space-y-6 text-white">
      <GlassPanel className="relative overflow-hidden border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/0 p-6">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -top-28 right-0 h-72 w-72 rounded-full bg-emerald-400/25 blur-[140px]" />
          <div className="absolute -bottom-24 left-0 h-60 w-60 rounded-full bg-sky-400/20 blur-[130px]" />
        </div>
        <div className="relative flex flex-col gap-4">
          <Link
            href="/dashboard/settings/team"
            className="inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al equipo
          </Link>
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/70">
              <Shield className="h-4 w-4" />
              Seguridad
            </span>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Políticas de acceso</h1>
            <p className="text-sm text-white/70">
              Estos lineamientos aplican para todo el personal que usa el panel administrativo. Revísalos con tu equipo
              antes de otorgar nuevos accesos.
            </p>
          </div>
        </div>
      </GlassPanel>

      <div className="grid gap-4 md:grid-cols-2">
        {policySections.map((section) => (
          <GlassPanel key={section.title} className="space-y-4 border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3 text-white">
              <section.icon className="h-5 w-5 text-emerald-200" />
              <h2 className="text-xl font-semibold">{section.title}</h2>
            </div>
            <ul className="space-y-3 text-sm text-white/70">
              {section.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </GlassPanel>
        ))}
      </div>

      <GlassPanel className="space-y-4 border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Recomendaciones adicionales</h2>
        <ul className="space-y-2 text-sm text-white/70">
          <li>• Documenta cada alta o baja de personal en un acta interna.</li>
          <li>• Solicita la devolución de dispositivos antes de suspender una cuenta.</li>
          <li>• Programa auditorías trimestrales para validar roles y permisos.</li>
        </ul>
        <p className="text-xs text-white/50">
          ¿Tienes dudas? Escribe a soporte para recibir la versión firmada de estas políticas.
        </p>
      </GlassPanel>
    </div>
  )
}
