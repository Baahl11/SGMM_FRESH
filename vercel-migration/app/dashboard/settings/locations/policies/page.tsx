import Link from 'next/link'
import { ArrowLeft, Building2, MapPin, ShieldCheck, Clock3, Globe2, AlertTriangle } from 'lucide-react'
import { GlassPanel } from '@/components/ui/glass-panel'

const policySections = [
  {
    title: 'Clasificación de sedes',
    icon: Building2,
    items: [
      'Cada sede debe registrarse con su nombre comercial, código interno y tipo (consultorio, quirófano, centro de diagnóstico).',
      'Las sedes principales concentran facturación y logística; las satélite dependen administrativamente de una sede principal.',
      'Todo alta o baja de sede debe quedar respaldada con acta interna firmada por operaciones.',
    ],
  },
  {
    title: 'Requisitos regulatorios',
    icon: ShieldCheck,
    items: [
      'Solo se publican sedes que cuenten con licencia sanitaria vigente y pólizas de responsabilidad.',
      'Los datos de domicilio deben coincidir con lo registrado ante COFEPRIS y SAT.',
      'Se almacena evidencia digital (PDF o fotografía) por cada trámite asociado a la sede.',
    ],
  },
  {
    title: 'Operación y horarios',
    icon: Clock3,
    items: [
      'Cada sede define un huso horario único para evitar discrepancias en agendas y recordatorios.',
      'Los horarios clínicos se revisan trimestralmente para detectar traslapes o bloqueos obsoletos.',
      'Las sedes inactivas por más de 60 días pasan a estado suspendido y se ocultan de canales públicos.',
    ],
  },
  {
    title: 'Datos de contacto y cobertura',
    icon: Globe2,
    items: [
      'Correo, teléfono y punto de contacto deben pertenecer al staff asignado; se evita usar datos personales.',
      'La información de cobertura (servicios ofrecidos) debe sincronizarse con marketing y seguros antes de publicarse.',
      'Cuando una sede comparte recursos con otra, se documenta en notas internas y se etiqueta en reportes.',
    ],
  },
]

export default function LocationPoliciesPage() {
  return (
    <div className="space-y-6 text-white">
      <GlassPanel className="relative overflow-hidden border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/0 p-6">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -top-28 right-0 h-72 w-72 rounded-full bg-cyan-400/25 blur-[140px]" />
          <div className="absolute -bottom-24 left-0 h-60 w-60 rounded-full bg-emerald-400/20 blur-[130px]" />
        </div>
        <div className="relative flex flex-col gap-4">
          <Link
            href="/dashboard/settings/locations"
            className="inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a sedes
          </Link>
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/70">
              <MapPin className="h-4 w-4" />
              Sedes
            </span>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Política de sedes</h1>
            <p className="text-sm text-white/70">
              Lineamientos para crear, operar y auditar cada ubicación física dentro de AgendaMed Pro. Comparte este documento con operaciones y compliance antes de habilitar nuevas sedes.
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
        <div className="flex items-center gap-3 text-white">
          <AlertTriangle className="h-5 w-5 text-amber-300" />
          <h2 className="text-xl font-semibold">Checklist previo a publicar una sede</h2>
        </div>
        <ul className="space-y-2 text-sm text-white/70">
          <li>• Confirma que la dirección coincide con la documentación legal y con Google Maps.</li>
          <li>• Verifica que los responsables clínicos asignados estén dados de alta y activos.</li>
          <li>• Revisa que los canales de contacto respondan en menos de 2 minutos dentro del horario anunciado.</li>
          <li>• Adjunta fotografías del inmueble y croquis de acceso para soporte.</li>
        </ul>
        <p className="text-xs text-white/50">
          ¿Necesitas la versión firmada? Solicítala a soporte con el asunto "Política de sedes".
        </p>
      </GlassPanel>
    </div>
  )
}
