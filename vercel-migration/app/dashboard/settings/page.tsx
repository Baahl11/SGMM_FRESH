'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { GlassPanel } from '@/components/ui/glass-panel';
import {
  Users,
  Building2,
  Calendar,
  Clock,
  CalendarX,
  Globe,
  Mail,
  FileText,
  UserPlus,
  MessageSquare,
  Settings,
  Plus,
  ArrowRight,
  Sparkles,
  CreditCard,
  Upload
} from 'lucide-react';

const sections = [
  {
    name: 'Importar Datos',
    href: '/dashboard/settings/import',
    icon: Upload,
    description: 'Importa pacientes y citas desde Excel',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    name: 'Add-ons',
    href: '/dashboard/settings/addons',
    icon: Plus,
    description: 'Ubicaciones y doctores extra',
    color: 'from-violet-500 to-violet-600'
  },
  {
    name: 'Pagos',
    href: '/dashboard/settings/payments',
    icon: CreditCard,
    description: 'Stripe Connect y comisiones',
    color: 'from-amber-500 to-orange-500'
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
];

const quickTips = [
  'Configura primero tus Horarios y Tipos de Cita para abrir agenda.',
  'Activa Notificaciones para automatizar recordatorios por email y SMS.',
  'Conecta WhatsApp Business para confirmar citas con mejores tasas.',
  'Invita a tu staff desde Equipo y controla permisos por rol.'
];

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <GlassPanel className="relative overflow-hidden p-6 sm:p-8 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-indigo-400/30 blur-[160px]" />
          <div className="absolute -bottom-32 left-0 h-72 w-72 rounded-full bg-sky-500/30 blur-[150px]" />
        </div>
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-5 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
              <Settings className="h-4 w-4" />
              Configuración
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Administra tu clínica</h1>
              <p className="mt-2 text-sm text-white/70">Control total de ubicaciones, equipo, agendas y automatizaciones en un solo panel.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 text-white/80">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Secciones disponibles</p>
              <p className="text-3xl font-semibold text-white">{sections.length}</p>
              <p className="text-xs text-white/60">Módulos configurables</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Automatizaciones</p>
              <p className="text-3xl font-semibold text-emerald-200">Ready</p>
              <p className="text-xs text-white/60">Notificaciones y WhatsApp</p>
            </div>
          </div>
        </div>
      </GlassPanel>

      <GlassPanel className="border-white/10 bg-white/5 p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Link key={section.href} href={section.href} className="group h-full">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  whileHover={{ y: -4 }}
                  className="relative flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-5 text-white transition hover:border-white/40"
                >
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${section.color} shadow-lg shadow-black/20`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold">{section.name}</h3>
                    <p className="text-sm text-white/70">{section.description}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-6 text-xs uppercase tracking-[0.25em] text-white/50">
                    <span>Gestionar</span>
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                  <div className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${section.color} opacity-0 transition group-hover:opacity-10`} />
                </motion.div>
              </Link>
            );
          })}
        </div>
      </GlassPanel>

      <GlassPanel className="space-y-4 border-white/10 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 p-6 text-white">
        <div className="flex items-center gap-3 text-lg font-semibold">
          <Sparkles className="h-5 w-5 text-amber-200" />
          Consejos rápidos
        </div>
        <ul className="space-y-3 text-sm text-white/80">
          {quickTips.map((tip) => (
            <li key={tip} className="flex items-start gap-3">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/70" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </GlassPanel>
    </div>
  );
}
