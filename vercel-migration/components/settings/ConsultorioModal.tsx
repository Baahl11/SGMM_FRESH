'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin } from 'lucide-react'

interface Consultorio {
  id: string
  nombre: string
  ubicacion: string | null
  descripcion: string | null
  capacidad: number
  activo: boolean
}

interface ConsultorioModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (consultorio: Partial<Consultorio>) => void
  consultorio?: Consultorio | null
}

export default function ConsultorioModal({ isOpen, onClose, onSave, consultorio }: ConsultorioModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    ubicacion: '',
    descripcion: '',
    capacidad: 1,
    activo: true
  })

  useEffect(() => {
    if (consultorio) {
      setFormData({
        nombre: consultorio.nombre,
        ubicacion: consultorio.ubicacion || '',
        descripcion: consultorio.descripcion || '',
        capacidad: consultorio.capacidad,
        activo: consultorio.activo
      })
    } else {
      setFormData({
        nombre: '',
        ubicacion: '',
        descripcion: '',
        capacidad: 1,
        activo: true
      })
    }
  }, [consultorio, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {consultorio ? 'Editar Consultorio' : 'Nuevo Consultorio'}
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </motion.button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="flex justify-center">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg"
                  >
                    <MapPin className="w-10 h-10" />
                  </motion.div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                    placeholder="Consultorio Principal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    value={formData.ubicacion}
                    onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                    placeholder="Planta Baja - Sala 101"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white resize-none"
                    placeholder="Detalles adicionales sobre el consultorio..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Capacidad
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData.capacidad}
                      onChange={(e) => setFormData({ ...formData, capacidad: parseInt(e.target.value) })}
                      className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <motion.div
                      key={formData.capacidad}
                      initial={{ scale: 1.3 }}
                      animate={{ scale: 1 }}
                      className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg"
                    >
                      {formData.capacidad}
                    </motion.div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Número de personas que pueden atenderse simultáneamente
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Estado
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formData.activo ? 'Consultorio disponible' : 'Consultorio no disponible'}
                    </div>
                  </div>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFormData({ ...formData, activo: !formData.activo })}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      formData.activo ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <motion.span
                      layout
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ${
                        formData.activo ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </motion.button>
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all"
                  >
                    {consultorio ? 'Guardar Cambios' : 'Crear Consultorio'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
