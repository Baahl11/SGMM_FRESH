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
      className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:shadow-xl hover:shadow-blue-500/10"
    >
      {/* Status Badge */}
      {!doctor.activo && (
        <div className="absolute top-3 right-3 z-10">
          <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
            Inactivo
          </span>
        </div>
      )}

      {/* Color Accent */}
      <div 
        className="h-1.5 w-full"
        style={{ backgroundColor: doctor.color }}
      />

      <div className="p-6">
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
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                <BadgeCheck className="w-3 h-3 text-white" />
              </div>
            )}
          </motion.div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {doctor.nombre}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {doctor.especialidad || 'Sin especialidad'}
            </p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          {doctor.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="truncate">{doctor.email}</span>
            </div>
          )}
          {doctor.telefono && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{doctor.telefono}</span>
            </div>
          )}
          {doctor.cedula_profesional && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
              <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                Cédula: {doctor.cedula_profesional}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium"
          >
            <Edit2 className="w-4 h-4" />
            <span>Editar</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDelete}
            className="flex items-center justify-center px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
