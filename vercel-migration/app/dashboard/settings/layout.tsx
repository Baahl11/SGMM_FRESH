'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, Building2, Calendar, ArrowLeft, Clock, CalendarX, Globe, Mail, FileText, UserPlus, MessageSquare, MapPin, Receipt, Plus, CreditCard, Upload } from 'lucide-react'
import AppLayout from '@/components/layout/app-layout'
import { GlassPanel } from '@/components/ui/glass-panel'

const sections = [
  {
    name: 'Importar Datos',
    href: '/dashboard/settings/import',
    icon: Upload,
    description: 'Importa pacientes y citas desde Excel'
  },
  {
    name: 'Add-ons',
    href: '/dashboard/settings/addons',
    icon: Plus,
    description: 'Ubicaciones y doctores extra'
  },
  {
    name: 'Pagos',
    href: '/dashboard/settings/payments',
    icon: CreditCard,
    description: 'Stripe Connect y comisiones'
  },
  {
    name: 'Equipo',
    href: '/dashboard/settings/team',
    icon: UserPlus,
    description: 'Invita colaboradores'
  },
  {
    name: 'Doctores',
    href: '/dashboard/settings/doctors',
    icon: Users,
    description: 'Gestiona tu equipo médico'
  },
  {
    name: 'Ubicaciones',
    href: '/dashboard/settings/locations',
    icon: MapPin,
    description: 'Múltiples sedes'
  },
  {
    name: 'Consultorios',
    href: '/dashboard/settings/consultorios',
    icon: Building2,
    description: 'Espacios y ubicaciones'
  },
  {
    name: 'Tipos de Cita',
    href: '/dashboard/settings/appointment-types',
    icon: Calendar,
    description: 'Duraciones y servicios'
  },
  {
    name: 'Horarios',
    href: '/dashboard/settings/schedules',
    icon: Clock,
    description: 'Horarios de trabajo'
  },
  {
    name: 'Excepciones',
    href: '/dashboard/settings/exceptions',
    icon: CalendarX,
    description: 'Vacaciones y bloqueos'
  },
  {
    name: 'Reservas Online',
    href: '/dashboard/settings/booking',
    icon: Globe,
    description: 'Página pública de reservas'
  },
  {
    name: 'Notificaciones',
    href: '/dashboard/settings/notifications',
    icon: Mail,
    description: 'Email y SMS automáticos'
  },
  {
    name: 'WhatsApp Business',
    href: '/dashboard/settings/whatsapp',
    icon: MessageSquare,
    description: 'Recordatorios por WhatsApp'
  },
  {
    name: 'Templates WhatsApp',
    href: '/dashboard/settings/whatsapp-templates',
    icon: FileText,
    description: 'Plantillas aprobadas por Meta'
  },
  {
    name: 'Facturación',
    href: '/dashboard/settings/facturacion',
    icon: Receipt,
    description: 'Configuración de Facturama y CFDI'
  },
  {
    name: 'Formularios',
    href: '/dashboard/settings/forms',
    icon: FileText,
    description: 'Formularios de admisión'
  }
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <AppLayout>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.18),_transparent_45%),_rgba(5,6,13,1)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <GlassPanel className="flex items-center justify-between border-white/10 bg-white/5 px-4 py-4 text-white sm:px-6">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/70 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
              <div className="h-6 w-px bg-white/20" />
              <div>
                <p className="text-[0.7rem] uppercase tracking-[0.5em] text-white/50">Panel SGMM</p>
                <h1 className="text-2xl font-semibold">Configuración</h1>
              </div>
            </div>
          </GlassPanel>

          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <GlassPanel className="h-fit border-white/10 bg-white/5 p-4 text-white">
              <p className="mb-4 text-xs uppercase tracking-[0.45em] text-white/50">Módulos</p>
              <nav className="space-y-2">
                {sections.map((section) => {
                  const isActive = pathname === section.href
                  const Icon = section.icon

                  return (
                    <Link key={section.href} href={section.href} className="relative block">
                      <motion.div
                        whileHover={{ x: 4 }}
                        className={`flex items-start gap-3 overflow-hidden rounded-2xl border px-4 py-3 text-sm transition ${
                          isActive
                            ? 'border-white/40 bg-white/10 text-white'
                            : 'border-white/5 text-white/70 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="settings-active"
                            className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-white/5"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                          />
                        )}
                        <div className="relative z-10">
                          <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-white/50'}`} />
                        </div>
                        <div className="relative z-10 flex-1">
                          <p className="font-medium">{section.name}</p>
                          <p className="text-xs text-white/60">{section.description}</p>
                        </div>
                      </motion.div>
                    </Link>
                  )
                })}
              </nav>
            </GlassPanel>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {children}
            </motion.div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
