'use client'

import { motion } from 'framer-motion'
import { Edit2, Clock, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react'

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
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:shadow-xl"
      style={{ boxShadow: `0 4px 20px ${type.color}15` }}
    >
      {!type.activo && (
        <div className="absolute top-3 right-3 z-10">
          <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
            Inactivo
          </span>
        </div>
      )}

      <div className="h-1.5 w-full" style={{ backgroundColor: type.color }} />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
            style={{ backgroundColor: type.color }}
          >
            <Clock className="w-6 h-6" />
          </motion.div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white break-words">
              {type.nombre}
            </h3>
            {type.descripcion && (
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                {type.descripcion}
              </p>
            )}
          </div>
        </div>

        {/* Timeline Visual */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              DURACIÓN
            </span>
          </div>
          
          {/* Timeline bar */}
          <div className="relative">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((type.duracion_minutos / 120) * 100, 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: type.color }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">0 min</span>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm font-bold text-gray-900 dark:text-white"
              >
                {type.duracion_minutos} min
              </motion.span>
              <span className="text-xs text-gray-500 dark:text-gray-400">120 min</span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Precio */}
          {type.precio_default !== null && (
            <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  ${type.precio_default.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {/* Confirmación */}
          <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            {type.requiere_confirmacion ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  Confirmación
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Directa
                </span>
              </>
            )}
          </div>
        </div>

        {/* Edit Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onEdit}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium opacity-0 group-hover:opacity-100"
          style={{ color: type.color }}
        >
          <Edit2 className="w-4 h-4" />
          <span>Editar</span>
        </motion.button>
      </div>
    </motion.div>
  )
}
