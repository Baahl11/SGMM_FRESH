'use client'

import { motion } from 'framer-motion'
import { Edit2, Trash2, Mail, Phone, BadgeCheck } from 'lucide-react'

interface Doctor {
  id: string
  nombre: string
  especialidad: string | null
  cedula_profesional: string | null
  telefono: string | null
  email: string | null
  color: string
  activo: boolean
}

interface DoctorCardProps {
  doctor: Doctor
  onEdit: () => void
  onDelete: () => void
}

export default function DoctorCard({ doctor, onEdit, onDelete }: DoctorCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition-all hover:border-white/40"
    >
      {/* Status Badge */}
      {!doctor.activo && (
        <div className="absolute top-3 right-3 z-10">
          <span className="rounded-lg border border-rose-300/40 bg-rose-500/15 px-2 py-1 text-xs font-medium text-rose-100">
            Inactivo
          </span>
        </div>
      )}

      {/* Color Accent */}
      <div 
        className="h-1.5 w-full"
        style={{ backgroundColor: doctor.color }}
      />

      <div className="p-6 text-white">
        {/* Avatar & Name */}
        <div className="flex items-start gap-4 mb-4">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="relative"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
              style={{ backgroundColor: doctor.color }}
            >
              {doctor.nombre.charAt(0).toUpperCase()}
            </div>
            {doctor.activo && (
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#05060d] bg-emerald-500">
                <BadgeCheck className="w-3 h-3 text-white" />
              </div>
            )}
          </motion.div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white truncate">
              {doctor.nombre}
            </h3>
            <p className="text-sm text-white/70 truncate">
              {doctor.especialidad || 'Sin especialidad'}
            </p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          {doctor.email && (
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Mail className="w-4 h-4 text-white/40" />
              <span className="truncate">{doctor.email}</span>
            </div>
          )}
          {doctor.telefono && (
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Phone className="w-4 h-4 text-white/40" />
              <span>{doctor.telefono}</span>
            </div>
          )}
          {doctor.cedula_profesional && (
            <div className="flex items-center gap-2 text-xs text-white/60">
              <span className="rounded border border-white/20 bg-white/10 px-2 py-1 font-mono text-white/80">
                Cédula: {doctor.cedula_profesional}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEdit}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:border-white/40"
          >
            <Edit2 className="w-4 h-4" />
            <span>Editar</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDelete}
            className="flex items-center justify-center rounded-xl border border-rose-400/40 px-3 py-2 text-rose-100 hover:bg-rose-500/10"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
