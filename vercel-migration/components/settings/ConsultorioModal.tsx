'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin } from 'lucide-react'
import { GlassPanel } from '@/components/ui/glass-panel'

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

  const inputClass = 'mt-3 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-emerald-200 focus:ring-emerald-200/30 focus:outline-none transition'
  const labelClass = 'text-xs uppercase tracking-[0.35em] text-white/60'

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
                <div className="pointer-events-none absolute inset-0 opacity-70">
                  <div className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-emerald-400/30 blur-[160px]" />
                  <div className="absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-sky-400/20 blur-[150px]" />
                </div>

                <div className="relative border-b border-white/10 px-6 py-6 sm:px-10 sm:py-8">
                  <div className="flex items-start gap-4">
                    <motion.div
                      whileHover={{ rotate: -4, scale: 1.05 }}
                      className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white"
                    >
                      <MapPin className="h-8 w-8" />
                    </motion.div>
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                        {consultorio ? 'Actualizar espacio' : 'Nuevo espacio físico'}
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                        {consultorio ? 'Editar consultorio' : 'Crear consultorio'}
                      </h2>
                      <p className="mt-1 text-sm text-white/70">
                        Define nombre, ubicación y capacidad para mantener tus agendas sincronizadas.
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={onClose}
                      className="rounded-2xl border border-white/15 p-2 text-white/70 transition hover:border-white/40 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="relative space-y-8 px-6 py-6 sm:px-10 sm:py-10">
                  <div>
                    <label className={labelClass}>Nombre *</label>
                    <input
                      type="text"
                      required
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className={inputClass}
                      placeholder="Consultorio Principal"
                    />
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Ubicación</label>
                      <input
                        type="text"
                        value={formData.ubicacion}
                        onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                        className={inputClass}
                        placeholder="Planta baja - sala 101"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Capacidad</label>
                      <div className="mt-3 rounded-3xl border border-white/15 bg-white/5 p-4">
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={formData.capacidad}
                            onChange={(e) => setFormData({ ...formData, capacidad: parseInt(e.target.value) })}
                            className="flex-1 appearance-none rounded-full bg-white/10 accent-emerald-300"
                          />
                          <motion.div
                            key={formData.capacidad}
                            initial={{ scale: 1.15 }}
                            animate={{ scale: 1 }}
                            className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-xl font-semibold text-emerald-200"
                          >
                            {formData.capacidad}
                          </motion.div>
                        </div>
                        <p className="mt-3 text-xs text-white/60">
                          Número de atenciones simultáneas permitidas en este espacio.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Descripción</label>
                    <textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      rows={3}
                      placeholder="Detalles adicionales, equipamiento o notas internas..."
                      className={`${inputClass} min-h-[120px] resize-none`}
                    />
                  </div>

                  <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Estado del consultorio
                      </p>
                      <p className="text-xs text-white/60">
                        {formData.activo ? 'Visible para agendas y asignaciones' : 'Oculto y bloqueado temporalmente'}
                      </p>
                    </div>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setFormData({ ...formData, activo: !formData.activo })}
                      className={`relative inline-flex h-12 w-24 items-center rounded-full border px-1 transition ${
                        formData.activo
                          ? 'border-emerald-300/60 bg-emerald-400/25'
                          : 'border-white/15 bg-white/5'
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
                      {consultorio ? 'Guardar cambios' : 'Crear consultorio'}
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
