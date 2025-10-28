'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Palette } from 'lucide-react'

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

interface AppointmentTypeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (type: Partial<AppointmentType>) => void
  appointmentType?: AppointmentType | null
}

const PRESET_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#f43f5e', // rose
  '#a855f7', // purple
]

const DURATION_PRESETS = [15, 20, 30, 45, 60, 90, 120]

export default function AppointmentTypeModal({ isOpen, onClose, onSave, appointmentType }: AppointmentTypeModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    duracion_minutos: 30,
    color: '#10b981',
    precio_default: null as number | null,
    requiere_confirmacion: false,
    activo: true
  })

  const [showColorPicker, setShowColorPicker] = useState(false)

  useEffect(() => {
    if (appointmentType) {
      setFormData({
        nombre: appointmentType.nombre,
        descripcion: appointmentType.descripcion || '',
        duracion_minutos: appointmentType.duracion_minutos,
        color: appointmentType.color,
        precio_default: appointmentType.precio_default,
        requiere_confirmacion: appointmentType.requiere_confirmacion,
        activo: appointmentType.activo
      })
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        duracion_minutos: 30,
        color: '#10b981',
        precio_default: null,
        requiere_confirmacion: false,
        activo: true
      })
    }
  }, [appointmentType, isOpen])

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
              className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: formData.color }} />
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {appointmentType ? 'Editar Tipo de Cita' : 'Nuevo Tipo de Cita'}
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
                    whileHover={{ scale: 1.1 }}
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-white shadow-lg"
                    style={{ backgroundColor: formData.color }}
                  >
                    <Clock className="w-8 h-8" />
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
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                    placeholder="Consulta General"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white resize-none"
                    placeholder="Descripción del tipo de cita..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Duración (minutos) *
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {DURATION_PRESETS.map((duration) => (
                      <motion.button
                        key={duration}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFormData({ ...formData, duracion_minutos: duration })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          formData.duracion_minutos === duration
                            ? 'text-white shadow-lg'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        style={
                          formData.duracion_minutos === duration
                            ? { backgroundColor: formData.color }
                            : {}
                        }
                      >
                        {duration}m
                      </motion.button>
                    ))}
                  </div>
                  <div className="mt-3">
                    <input
                      type="number"
                      min="5"
                      max="240"
                      step="5"
                      value={formData.duracion_minutos}
                      onChange={(e) => setFormData({ ...formData, duracion_minutos: parseInt(e.target.value) || 30 })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                      placeholder="O ingresa un valor personalizado"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Precio por Defecto (opcional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.precio_default || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        precio_default: e.target.value ? parseFloat(e.target.value) : null 
                      })}
                      className="w-full pl-8 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color de Identificación
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {PRESET_COLORS.map((color) => (
                      <motion.button
                        key={color}
                        type="button"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-10 h-10 rounded-xl transition-all ${
                          formData.color === color 
                            ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500 ring-offset-white dark:ring-offset-gray-800' 
                            : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className="w-10 h-10 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-gray-400 dark:hover:border-gray-500"
                    >
                      <Palette className="w-5 h-5 text-gray-400" />
                    </motion.button>
                  </div>

                  {showColorPicker && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3"
                    >
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-full h-12 rounded-xl cursor-pointer"
                      />
                    </motion.div>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Requiere Confirmación
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      El paciente debe confirmar la cita
                    </div>
                  </div>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFormData({ ...formData, requiere_confirmacion: !formData.requiere_confirmacion })}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      formData.requiere_confirmacion ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <motion.span
                      layout
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ${
                        formData.requiere_confirmacion ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </motion.button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Estado
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formData.activo ? 'Tipo activo' : 'Tipo desactivado'}
                    </div>
                  </div>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFormData({ ...formData, activo: !formData.activo })}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      formData.activo ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
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
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all"
                  >
                    {appointmentType ? 'Guardar Cambios' : 'Crear Tipo'}
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
