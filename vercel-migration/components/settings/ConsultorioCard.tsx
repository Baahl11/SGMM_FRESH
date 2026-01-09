'use client'

import { motion } from 'framer-motion'
import { Edit2, MapPin, Users, Info } from 'lucide-react'
import { GlassPanel } from '@/components/ui/glass-panel'

interface Consultorio {
  id: string
  nombre: string
  ubicacion: string | null
  descripcion: string | null
  capacidad: number
  activo: boolean
}

interface ConsultorioCardProps {
  consultorio: Consultorio
  onEdit: () => void
}

export default function ConsultorioCard({ consultorio, onEdit }: ConsultorioCardProps) {
  return (
    <motion.div whileHover={{ y: -6 }} className="group">
      <GlassPanel className="relative overflow-hidden border-white/10 bg-gradient-to-br from-slate-900/70 via-slate-900/55 to-slate-900/35 p-6 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -top-16 right-0 h-40 w-40 rounded-full bg-emerald-400/25 blur-[140px]" />
          <div className="absolute -bottom-20 left-6 h-32 w-32 rounded-full bg-teal-400/20 blur-[120px]" />
        </div>

        {!consultorio.activo && (
          <div className="absolute top-4 right-4 z-10">
            <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-rose-200">
              Inactivo
            </span>
          </div>
        )}

        <div className="relative flex items-start gap-4">
          <motion.div
            whileHover={{ scale: 1.08, rotate: -3 }}
            className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 text-white"
            style={{ background: 'rgba(16,185,129,0.15)', boxShadow: '0 12px 30px rgba(16,185,129,0.35)' }}
          >
            <MapPin className="h-7 w-7" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold tracking-tight">{consultorio.nombre}</h3>
            <p className="text-sm text-white/70 truncate">{consultorio.ubicacion || 'Sin ubicación'}</p>
          </div>
        </div>

        {consultorio.descripcion && (
          <div className="relative mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start gap-3 text-sm text-white/75">
              <Info className="h-4 w-4 text-emerald-200" />
              <p className="line-clamp-2">{consultorio.descripcion}</p>
            </div>
          </div>
        )}

        <div className="relative mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Users className="h-4 w-4" />
            <span>
              Capacidad: <span className="font-semibold text-white">{consultorio.capacidad}</span>
            </span>
          </div>
          {consultorio.activo && (
            <span className="rounded-full border border-emerald-200/40 bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-100">
              Disponible
            </span>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onEdit}
          className="aura-cta aura-cta--ghost relative mt-5 w-full justify-center border-white/25 text-sm"
        >
          <Edit2 className="h-4 w-4" />
          Editar consultorio
        </motion.button>
      </GlassPanel>
    </motion.div>
  )
}
