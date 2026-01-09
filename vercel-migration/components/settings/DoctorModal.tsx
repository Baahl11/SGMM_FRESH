'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Palette, Shield } from 'lucide-react'
import { GlassPanel } from '@/components/ui/glass-panel'

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

  const inputClass = 'mt-3 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-emerald-200 focus:ring-emerald-200/30 focus:outline-none transition'
  const labelClass = 'text-xs uppercase tracking-[0.35em] text-white/60'

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


                    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-8">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', duration: 0.45 }}
                        className="w-full max-w-2xl"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <GlassPanel className="relative overflow-hidden border-white/10 bg-gradient-to-b from-slate-950/95 via-slate-950/90 to-slate-950/85 p-0">
                          <div className="pointer-events-none absolute inset-0 opacity-75">
                            <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-indigo-500/35 blur-[170px]" />
                            <div className="absolute -bottom-28 left-0 h-72 w-72 rounded-full bg-sky-400/25 blur-[150px]" />
                          </div>

                          <div className="relative border-b border-white/10 px-6 py-6 sm:px-10 sm:py-8">
                            <div className="flex items-start gap-4">
                              <motion.div
                                whileHover={{ scale: 1.05, rotate: 4 }}
                                className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white"
                                style={{ boxShadow: `0 15px 45px ${formData.color}33` }}
                              >
                                <Shield className="h-7 w-7" />
                              </motion.div>
                              <div className="flex-1">
                                <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                                  {doctor ? 'Actualizar perfil' : 'Nuevo integrante'}
                                </p>
                                <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                                  {doctor ? 'Editar doctor' : 'Registrar doctor'}
                                </h2>
                                <p className="mt-1 text-sm text-white/70">
                                  Completa los datos clínicos, canal de contacto y color de agenda.
                                </p>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="rounded-2xl border border-white/15 p-2 text-white/70 transition hover:border-white/40 hover:text-white"
                              >
                                <X className="h-5 w-5" />
                              </motion.button>
                            </div>
                          </div>

                          <form onSubmit={handleSubmit} className="relative space-y-8 px-6 py-6 sm:px-10 sm:py-10">
                            <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="flex h-24 w-24 items-center justify-center rounded-3xl text-3xl font-semibold text-white"
                                style={{ background: formData.color }}
                              >
                                {formData.nombre.charAt(0).toUpperCase() || '?'}
                              </motion.div>
                              <p className="text-sm text-white/70">Este color se usa en agendas, excepciones y reportes.</p>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                              <div className="sm:col-span-2">
                                <label className={labelClass}>Nombre completo *</label>
                                <input
                                  type="text"
                                  required
                                  value={formData.nombre}
                                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                  className={inputClass}
                                  placeholder="Dr. Juan Pérez"
                                />
                              </div>
                              <div>
                                <label className={labelClass}>Especialidad</label>
                                <input
                                  type="text"
                                  value={formData.especialidad}
                                  onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                                  className={inputClass}
                                  placeholder="Medicina General"
                                />
                              </div>
                              <div>
                                <label className={labelClass}>Correo *</label>
                                <input
                                  type="email"
                                  required
                                  value={formData.email}
                                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                  className={inputClass}
                                  placeholder="doctor@ejemplo.com"
                                />
                              </div>
                              <div>
                                <label className={labelClass}>Cédula profesional</label>
                                <input
                                  type="text"
                                  value={formData.cedula_profesional}
                                  onChange={(e) => setFormData({ ...formData, cedula_profesional: e.target.value })}
                                  className={inputClass}
                                  placeholder="12345678"
                                />
                              </div>
                              <div>
                                <label className={labelClass}>Teléfono</label>
                                <input
                                  type="tel"
                                  value={formData.telefono}
                                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                  className={inputClass}
                                  placeholder="555-1234"
                                />
                              </div>
                            </div>

                            <div>
                              <label className={labelClass}>Color de identificación</label>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {PRESET_COLORS.map((color) => (
                                  <motion.button
                                    key={color}
                                    type="button"
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.92 }}
                                    onClick={() => setFormData({ ...formData, color })}
                                    className={`h-11 w-11 rounded-2xl border-2 transition ${
                                      formData.color === color ? 'border-white shadow-lg shadow-black/20' : 'border-transparent opacity-70 hover:opacity-100'
                                    }`}
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => setShowColorPicker(!showColorPicker)}
                                  className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-dashed border-white/30 text-white/60"
                                >
                                  <Palette className="h-5 w-5" />
                                </motion.button>
                              </div>
                              {showColorPicker && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="mt-3"
                                >
                                  <input
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    className="h-12 w-full cursor-pointer rounded-2xl border border-white/10 bg-transparent"
                                  />
                                </motion.div>
                              )}
                            </div>

                            <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm font-semibold text-white">Estado del doctor</p>
                                <p className="text-xs text-white/60">
                                  {formData.activo ? 'Puede aparecer en agendas e informes' : 'Oculto y sin acceso activo'}
                                </p>
                              </div>
                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.96 }}
                                onClick={() => setFormData({ ...formData, activo: !formData.activo })}
                                className={`relative inline-flex h-12 w-24 items-center rounded-full border px-1 transition ${
                                  formData.activo ? 'border-emerald-300/60 bg-emerald-400/25' : 'border-white/15 bg-white/5'
                                }`}
                              >
                                <motion.span
                                  layout
                                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-900 shadow-xl ${
                                    formData.activo ? 'translate-x-12' : 'translate-x-0'
                                  }`}
                                >
                                  {formData.activo ? 'ON' : 'OFF'}
                                </motion.span>
                              </motion.button>
                            </div>

                            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={onClose}
                                className="aura-cta aura-cta--ghost w-full justify-center sm:w-auto"
                              >
                                Cancelar
                              </motion.button>
                              <motion.button
                                type="submit"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                className="aura-cta aura-cta--primary w-full justify-center sm:w-auto"
                              >
                                {doctor ? 'Guardar cambios' : 'Crear doctor'}
                              </motion.button>
                            </div>
                          </form>
                        </GlassPanel>
                      </motion.div>
                    </div>
        </>
      )}
    </AnimatePresence>
  )
}
