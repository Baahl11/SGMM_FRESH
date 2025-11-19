'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, Building2, Calendar, ArrowLeft, Clock, CalendarX, Globe, Mail, FileText, UserPlus, MessageSquare, MapPin, Receipt, Plus, CreditCard } from 'lucide-react'
import AppLayout from '@/components/layout/app-layout'

const sections = [
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200/50 dark:border-gray-800/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard"
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configuración
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <nav className="lg:col-span-1 space-y-1">
            {sections.map((section) => {
              const isActive = pathname === section.href
              const Icon = section.icon
              
              return (
                <Link
                  key={section.href}
                  href={section.href}
                  className="relative group block"
                >
                  <motion.div
                    whileHover={{ x: 4 }}
                    className={`
                      flex items-start gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer
                      ${isActive 
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }
                    `}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeSection"
                        className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-xl -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    
                    <div className="relative z-10">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                    </div>
                    
                    <div className="flex-1 relative z-10">
                      <div className={`text-sm font-medium ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                        {section.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {section.description}
                      </div>
                    </div>
                  </motion.div>
                </Link>
              )
            })}
          </nav>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {children}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
    </AppLayout>
  )
}
