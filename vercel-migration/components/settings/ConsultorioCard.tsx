'use client'

import { motion } from 'framer-motion'
import { Edit2, MapPin, Users, Info } from 'lucide-react'

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
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:shadow-xl hover:shadow-emerald-500/10"
    >
      {!consultorio.activo && (
        <div className="absolute top-3 right-3 z-10">
          <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
            Inactivo
          </span>
        </div>
      )}

      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />

      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <motion.div
            whileHover={{ scale: 1.1, rotate: -5 }}
            className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg"
          >
            <MapPin className="w-7 h-7" />
          </motion.div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {consultorio.nombre}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {consultorio.ubicacion || 'Sin ubicación'}
            </p>
          </div>
        </div>

        {consultorio.descripcion && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {consultorio.descripcion}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Capacidad: <span className="font-semibold text-gray-900 dark:text-white">{consultorio.capacidad}</span>
            </span>
          </div>

          {consultorio.activo && (
            <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
              Disponible
            </span>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onEdit}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors text-sm font-medium opacity-0 group-hover:opacity-100"
        >
          <Edit2 className="w-4 h-4" />
          <span>Editar</span>
        </motion.button>
      </div>
    </motion.div>
  )
}
