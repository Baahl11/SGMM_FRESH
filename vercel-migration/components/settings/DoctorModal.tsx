'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Palette } from 'lucide-react'

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

interface DoctorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (doctor: Partial<Doctor>) => void
  doctor?: Doctor | null
}

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#f43f5e', // rose
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#a855f7', // purple
]

export default function DoctorModal({ isOpen, onClose, onSave, doctor }: DoctorModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    especialidad: '',
    cedula_profesional: '',
    telefono: '',
    email: '',
    color: '#3b82f6',
    activo: true
  })

  const [showColorPicker, setShowColorPicker] = useState(false)

  useEffect(() => {
    if (doctor) {
      setFormData({
        nombre: doctor.nombre,
        especialidad: doctor.especialidad || '',
        cedula_profesional: doctor.cedula_profesional || '',
        telefono: doctor.telefono || '',
        email: doctor.email || '',
        color: doctor.color,
        activo: doctor.activo
      })
    } else {
      setFormData({
        nombre: '',
        especialidad: '',
        cedula_profesional: '',
        telefono: '',
        email: '',
        color: '#3b82f6',
        activo: true
      })
    }
  }, [doctor, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <div 
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ backgroundColor: formData.color }}
                />
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {doctor ? 'Editar Doctor' : 'Nuevo Doctor'}
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

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Avatar Preview */}
                <div className="flex justify-center">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                    style={{ backgroundColor: formData.color }}
                  >
                    {formData.nombre.charAt(0).toUpperCase() || '?'}
                  </motion.div>
                </div>

                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                    placeholder="Dr. Juan Pérez"
                  />
                </div>

                {/* Especialidad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Especialidad
                  </label>
                  <input
                    type="text"
                    value={formData.especialidad}
                    onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                    placeholder="Medicina General"
                  />
                </div>

                {/* Grid 2 columnas */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Cédula */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cédula Profesional
                    </label>
                    <input
                      type="text"
                      value={formData.cedula_profesional}
                      onChange={(e) => setFormData({ ...formData, cedula_profesional: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                      placeholder="12345678"
                    />
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                      placeholder="555-1234"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                    placeholder="doctor@ejemplo.com"
                  />
                </div>

                {/* Color Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color de Identificación
                  </label>
                  <div className="flex gap-2">
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
                            : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className="w-10 h-10 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
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

                {/* Active Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Estado
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formData.activo ? 'Doctor activo en el sistema' : 'Doctor desactivado'}
                    </div>
                  </div>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFormData({ ...formData, activo: !formData.activo })}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      formData.activo ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
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

                {/* Actions */}
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
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all"
                  >
                    {doctor ? 'Guardar Cambios' : 'Crear Doctor'}
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
