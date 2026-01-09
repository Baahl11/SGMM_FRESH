'use client'

import { motion } from 'framer-motion'
import { Edit2, Clock, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react'
import { GlassPanel } from '@/components/ui/glass-panel'

interface AppointmentType {
  id: string
  nombre: string
  descripcion: string | null
  duracion_minutos: number
  color: string
  precio_default: number | null
  requiere_confirmacion: boolean
  activo: boolean
}

interface AppointmentTypeCardProps {
  type: AppointmentType
  onEdit: () => void
}

export default function AppointmentTypeCard({ type, onEdit }: AppointmentTypeCardProps) {
  const durationPercent = Math.min((type.duracion_minutos / 120) * 100, 100)

  return (
    <motion.div whileHover={{ y: -6 }} className="group">
      <GlassPanel
        className="relative overflow-hidden border-white/10 bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-900/40 p-6 text-white transition-all"
        style={{ boxShadow: `0 20px 60px rgba(2,6,23,0.55)` }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div
            className="absolute -top-16 right-0 h-40 w-40 rounded-full blur-[140px]"
            style={{ backgroundColor: `${type.color}33` }}
          />
          <div className="absolute -bottom-20 left-4 h-36 w-36 rounded-full bg-slate-500/20 blur-[120px]" />
        </div>

        {!type.activo && (
          <div className="absolute top-4 right-4 z-10">
            <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-rose-200">
              Inactivo
            </span>
          </div>
        )}

        <div className="relative flex items-start gap-4">
          <motion.div
            whileHover={{ scale: 1.08 }}
            className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 text-white"
            style={{ backgroundColor: `${type.color}22`, boxShadow: `0 10px 25px ${type.color}30` }}
          >
            <Clock className="h-6 w-6" />
          </motion.div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold tracking-tight">{type.nombre}</h3>
            {type.descripcion && (
              <p className="mt-1 text-sm text-white/70 line-clamp-2">{type.descripcion}</p>
            )}
          </div>
        </div>

        <div className="relative mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span className="tracking-[0.3em]">DURACIÓN</span>
            <span className="font-semibold text-white">{type.duracion_minutos} min</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${durationPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: type.color, boxShadow: `0 10px 25px ${type.color}44` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-white/50">
            <span>0 min</span>
            <span>120 min</span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {type.precio_default !== null && (
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              <DollarSign className="h-4 w-4" />
              <span className="font-semibold">${type.precio_default.toFixed(2)}</span>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
            {type.requiere_confirmacion ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-sky-200" />
                <span className="text-white">Requiere confirmación</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-white/60" />
                <span className="text-white/70">Cita directa</span>
              </>
            )}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onEdit}
          className="aura-cta aura-cta--ghost relative mt-5 w-full justify-center border-white/25 text-sm"
        >
          <Edit2 className="h-4 w-4" />
          Editar servicio
        </motion.button>
      </GlassPanel>
    </motion.div>
  )
}
