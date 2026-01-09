'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Clock, Palette, X } from 'lucide-react'
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

interface AppointmentTypeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (type: Partial<AppointmentType>) => void
  appointmentType?: AppointmentType | null
}

const PRESET_COLORS = [
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#06b6d4',
  '#f43f5e',
  '#a855f7',
]

const DURATION_PRESETS = [15, 20, 30, 45, 60, 90, 120]

const BASE_STATE = {
  nombre: '',
  descripcion: '',
  duracion_minutos: 30,
  color: PRESET_COLORS[0],
  precio_default: null as number | null,
  requiere_confirmacion: false,
  activo: true,
}

export default function AppointmentTypeModal({ isOpen, onClose, onSave, appointmentType }: AppointmentTypeModalProps) {
  const [formData, setFormData] = useState(BASE_STATE)
  const [showColorPicker, setShowColorPicker] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setShowColorPicker(false)
    }

    if (appointmentType && isOpen) {
      setFormData({
        nombre: appointmentType.nombre,
        descripcion: appointmentType.descripcion || '',
        duracion_minutos: appointmentType.duracion_minutos,
        color: appointmentType.color,
        precio_default: appointmentType.precio_default,
        requiere_confirmacion: appointmentType.requiere_confirmacion,
        activo: appointmentType.activo,
      })
      return
    }

    if (isOpen) {
      setFormData(BASE_STATE)
    }
  }, [appointmentType, isOpen])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    onSave(formData)
  }

  const inputClass = 'mt-3 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-emerald-200 focus:ring-emerald-200/30 focus:outline-none transition'
  const labelClass = 'text-xs uppercase tracking-[0.35em] text-white/60'
  const sectionClass = 'rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 24 }}
              transition={{ type: 'spring', duration: 0.45 }}
              className="w-full max-w-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <GlassPanel className="relative max-h-[90vh] overflow-y-auto border-white/10 bg-gradient-to-b from-slate-950/95 via-slate-950/90 to-slate-950/85 p-0">
                <div className="pointer-events-none absolute inset-0 opacity-70">
                  <div className="absolute -top-24 left-4 h-72 w-72 rounded-full bg-emerald-400/25 blur-[170px]" />
                  <div className="absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-violet-500/20 blur-[150px]" />
                </div>

                <div className="relative border-b border-white/10 px-6 py-6 sm:px-10 sm:py-8">
                  <div className="flex items-start gap-4">
                    <motion.div
                      whileHover={{ rotate: 5, scale: 1.05 }}
                      className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white"
                      style={{ boxShadow: `0 18px 45px ${formData.color}33` }}
                    >
                      <Clock className="h-8 w-8" />
                    </motion.div>
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                        {appointmentType ? 'Actualizar servicio' : 'Nuevo servicio'}
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                        {appointmentType ? 'Editar tipo de cita' : 'Crear tipo de cita'}
                      </h2>
                      <p className="mt-1 text-sm text-white/70">
                        Configura duración, confirmación y color para mantener tu catálogo impecable.
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

                <form onSubmit={handleSubmit} className="relative space-y-6 px-6 py-6 sm:px-10 sm:py-10">
                  <div className="flex flex-col gap-5 sm:flex-row">
                    <div className={`${sectionClass} flex-1`}>
                      <label className={labelClass}>Nombre *</label>
                      <input
                        type="text"
                        required
                        value={formData.nombre}
                        onChange={(event) => setFormData({ ...formData, nombre: event.target.value })}
                        className={inputClass}
                        placeholder="Consulta General"
                      />
                      <label className={`${labelClass} mt-6 block`}>Descripción</label>
                      <textarea
                        value={formData.descripcion}
                        onChange={(event) => setFormData({ ...formData, descripcion: event.target.value })}
                        rows={3}
                        className={`${inputClass} min-h-[120px] resize-none`}
                        placeholder="Detalles adicionales, protocolos o notas internas"
                      />
                    </div>
                    <div className={`${sectionClass} flex-1`}>
                      <div className="flex items-center justify-between">
                        <span className={labelClass}>Badge de agenda</span>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="flex h-14 w-14 items-center justify-center rounded-2xl text-white"
                          style={{ backgroundColor: formData.color }}
                        >
                          <Clock className="h-6 w-6" />
                        </motion.div>
                      </div>
                      <p className="mt-3 text-xs text-white/60">Se usa en tarjetas, confirmaciones y paneles.</p>
                    </div>
                  </div>

                  <div className={sectionClass}>
                    <label className={`${labelClass} block`}>Duración (minutos) *</label>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {DURATION_PRESETS.map((duration) => (
                        <motion.button
                          key={duration}
                          type="button"
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setFormData({ ...formData, duracion_minutos: duration })}
                          className={`rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                            formData.duracion_minutos === duration
                              ? 'text-slate-900'
                              : 'border border-white/15 text-white/70 hover:border-white/40'
                          }`}
                          style={
                            formData.duracion_minutos === duration
                              ? { background: formData.color, boxShadow: `0 12px 32px ${formData.color}44` }
                              : undefined
                          }
                        >
                          {duration}m
                        </motion.button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min="5"
                      max="240"
                      step="5"
                      value={formData.duracion_minutos}
                      onChange={(event) => setFormData({ ...formData, duracion_minutos: parseInt(event.target.value, 10) || 30 })}
                      className={`${inputClass} mt-4`}
                      placeholder="Ingresa un valor personalizado"
                    />
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className={sectionClass}>
                      <label className={labelClass}>Precio sugerido</label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/60">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.precio_default ?? ''}
                          onChange={(event) => setFormData({
                            ...formData,
                            precio_default: event.target.value ? parseFloat(event.target.value) : null,
                          })}
                          className={`${inputClass} pl-8`}
                          placeholder="0.00"
                        />
                      </div>
                      <p className="mt-3 text-xs text-white/55">Solo informativo; puedes editarlo por cita.</p>
                    </div>
                    <div className={sectionClass}>
                      <label className={labelClass}>Color de identificación</label>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {PRESET_COLORS.map((color) => (
                          <motion.button
                            key={color}
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setFormData({ ...formData, color })}
                            className={`h-11 w-11 rounded-2xl border-2 transition ${
                              formData.color === color
                                ? 'border-white shadow-lg shadow-black/30'
                                : 'border-transparent opacity-70 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowColorPicker((state) => !state)}
                          className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-dashed border-white/25 text-white/60"
                        >
                          <Palette className="h-5 w-5" />
                        </motion.button>
                      </div>
                      {showColorPicker && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4"
                        >
                          <input
                            type="color"
                            value={formData.color}
                            onChange={(event) => setFormData({ ...formData, color: event.target.value })}
                            className="h-12 w-full cursor-pointer rounded-2xl border border-white/15 bg-transparent"
                          />
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <div className={`${sectionClass} space-y-4`}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">Requiere confirmación</p>
                        <p className="text-xs text-white/60">Solicita respuesta del paciente antes de bloquear agenda.</p>
                      </div>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setFormData({ ...formData, requiere_confirmacion: !formData.requiere_confirmacion })}
                        className={`relative inline-flex h-12 w-24 items-center rounded-full border px-1 transition ${
                          formData.requiere_confirmacion ? 'border-violet-300/60 bg-violet-400/25' : 'border-white/15 bg-white/5'
                        }`}
                      >
                        <motion.span
                          layout
                          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                          className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-900 shadow-xl ${
                            formData.requiere_confirmacion ? 'translate-x-12' : 'translate-x-0'
                          }`}
                        >
                          {formData.requiere_confirmacion ? 'ON' : 'OFF'}
                        </motion.span>
                      </motion.button>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">Estado del servicio</p>
                        <p className="text-xs text-white/60">{formData.activo ? 'Disponible en agenda y folletos' : 'Oculto para pacientes y staff'}</p>
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
                      {appointmentType ? 'Guardar cambios' : 'Crear tipo'}
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
