'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Users, Building2, Calendar, Clock, CalendarX, Globe, Mail, FileText, UserPlus, MessageSquare, Settings, Plus } from 'lucide-react'

const sections = [
  {
    name: 'Add-ons',
    href: '/dashboard/settings/addons',
    icon: Plus,
    description: 'Ubicaciones y doctores extra',
    color: 'from-violet-500 to-violet-600'
  },
  {
    name: 'Equipo',
    href: '/dashboard/settings/team',
    icon: UserPlus,
    description: 'Invita colaboradores',
    color: 'from-blue-500 to-blue-600'
  },
  {
    name: 'Doctores',
    href: '/dashboard/settings/doctors',
    icon: Users,
    description: 'Gestiona tu equipo médico',
    color: 'from-purple-500 to-purple-600'
  },
  {
    name: 'Consultorios',
    href: '/dashboard/settings/consultorios',
    icon: Building2,
    description: 'Espacios y ubicaciones',
    color: 'from-green-500 to-green-600'
  },
  {
    name: 'Tipos de Cita',
    href: '/dashboard/settings/appointment-types',
    icon: Calendar,
    description: 'Duraciones y servicios',
    color: 'from-orange-500 to-orange-600'
  },
  {
    name: 'Horarios',
    href: '/dashboard/settings/schedules',
    icon: Clock,
    description: 'Horarios de trabajo',
    color: 'from-cyan-500 to-cyan-600'
  },
  {
    name: 'Excepciones',
    href: '/dashboard/settings/exceptions',
    icon: CalendarX,
    description: 'Vacaciones y bloqueos',
    color: 'from-red-500 to-red-600'
  },
  {
    name: 'Reservas Online',
    href: '/dashboard/settings/booking',
    icon: Globe,
    description: 'Página pública de reservas',
    color: 'from-indigo-500 to-indigo-600'
  },
  {
    name: 'Notificaciones',
    href: '/dashboard/settings/notifications',
    icon: Mail,
    description: 'Email y SMS automáticos',
    color: 'from-pink-500 to-pink-600'
  },
  {
    name: 'WhatsApp Business',
    href: '/dashboard/settings/whatsapp',
    icon: MessageSquare,
    description: 'Recordatorios por WhatsApp',
    color: 'from-emerald-500 to-emerald-600'
  },
  {
    name: 'Formularios',
    href: '/dashboard/settings/forms',
    icon: FileText,
    description: 'Formularios de admisión',
    color: 'from-yellow-500 to-yellow-600'
  }
]

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200/50 dark:border-gray-800/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-20">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Configuración
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Administra todas las opciones de tu clínica
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section, index) => {
            const Icon = section.icon
            
            return (
              <Link
                key={section.href}
                href={section.href}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="relative group"
                >
                  <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
                    {/* Gradient background on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                    
                    {/* Icon */}
                    <div className={`relative inline-flex p-4 bg-gradient-to-br ${section.color} rounded-xl shadow-md mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Content */}
                    <div className="relative">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {section.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {section.description}
                      </p>
                    </div>

                    {/* Arrow indicator */}
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </motion.div>
              </Link>
            )
          })}
        </div>

        {/* Quick Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl border border-blue-200 dark:border-blue-800"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            💡 Consejos Rápidos
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Comienza configurando tus <strong>Horarios</strong> y <strong>Tipos de Cita</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Activa las <strong>Notificaciones</strong> para enviar recordatorios automáticos por email</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Usa <strong>WhatsApp Business</strong> para recordatorios más efectivos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Invita a tu equipo desde la sección <strong>Equipo</strong> para colaborar</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  )
}
