'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, DollarSign, Clock, Edit2, Trash2, Download } from 'lucide-react'
import toast from 'react-hot-toast'

interface Service {
  id: string
  name: string
  duration: number
  price: number
  description?: string
}

interface TreatmentApi {
  id: string
  nombre: string
  duracion_minutos?: number | null
  precio_base?: number | null
  descripcion?: string | null
  activo?: boolean | null
}

interface ServicesManagerProps {
  services: Service[]
  onChange: (services: Service[]) => void
}

export default function ServicesManager({ services, onChange }: ServicesManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loadingTreatments, setLoadingTreatments] = useState(false)
  const [formData, setFormData] = useState<Partial<Service>>({
    name: '',
    duration: 30,
    price: 0,
    description: ''
  })

  const handleAdd = () => {
    if (!formData.name || !formData.duration || formData.price === undefined) {
      return
    }

    const newService: Service = {
      id: Date.now().toString(),
      name: formData.name,
      duration: formData.duration,
      price: formData.price,
      description: formData.description
    }

    onChange([...services, newService])
    setFormData({ name: '', duration: 30, price: 0, description: '' })
    setIsAdding(false)
  }

  const handleEdit = (service: Service) => {
    setEditingId(service.id)
    setFormData(service)
    setIsAdding(true)
  }

  const handleUpdate = () => {
    if (!editingId || !formData.name || !formData.duration || formData.price === undefined) {
      return
    }

    onChange(
      services.map(s => 
        s.id === editingId 
          ? { ...s, ...formData } as Service
          : s
      )
    )
    
    setFormData({ name: '', duration: 30, price: 0, description: '' })
    setIsAdding(false)
    setEditingId(null)
  }

  const handleDelete = (id: string) => {
    onChange(services.filter(s => s.id !== id))
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({ name: '', duration: 30, price: 0, description: '' })
  }

  const handleImportTreatments = async () => {
    setLoadingTreatments(true)
    try {
      const response = await fetch('/api/treatments')
      if (!response.ok) throw new Error('Error al cargar tratamientos')
      
      const treatments: TreatmentApi[] = await response.json()
      
      if (!treatments || treatments.length === 0) {
        toast.error('No tienes tratamientos registrados')
        return
      }

      // Convertir tratamientos a servicios
      const existingIds = new Set(services.map(s => s.id))
      let addedCount = 0

      const newServices = treatments
        .filter((t) => t.activo !== false)
        .map((t) => ({
          id: `treatment-${t.id}`,
          name: t.nombre,
          duration: t.duracion_minutos || 30,
          price: t.precio_base || 0,
          description: t.descripcion || undefined
        }))
        .filter((s: Service) => {
          if (existingIds.has(s.id)) return false
          addedCount++
          return true
        })

      if (addedCount === 0) {
        toast.error('Todos los tratamientos ya están agregados')
        return
      }

      onChange([...services, ...newServices])
      toast.success(`${addedCount} ${addedCount === 1 ? 'tratamiento agregado' : 'tratamientos agregados'}`)
    } catch (error) {
      console.error('Error importing treatments:', error)
      toast.error('Error al importar tratamientos')
    } finally {
      setLoadingTreatments(false)
    }
  }

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold">Servicios ofrecidos</h3>
          <p className="text-sm text-white/60">
            Define los servicios que los pacientes pueden agendar
          </p>
        </div>
        {!isAdding && (
          <div className="flex flex-wrap gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleImportTreatments}
              disabled={loadingTreatments}
              className="aura-cta aura-cta--ghost"
            >
              <Download className="h-4 w-4" />
              <span>{loadingTreatments ? 'Cargando...' : 'Importar tratamientos'}</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsAdding(true)}
              className="aura-cta aura-cta--primary"
            >
              <Plus className="h-4 w-4" />
              <span>Agregar servicio</span>
            </motion.button>
          </div>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-5"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-[0.35em] text-white/60">
                  Nombre del servicio
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Consulta general"
                  className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-emerald-300/60 focus:outline-none focus:ring-emerald-300/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-[0.35em] text-white/60">
                    <Clock className="mr-1 inline h-3.5 w-3.5" /> Duración (minutos)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                    min="5"
                    step="5"
                    className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white focus:border-emerald-300/60 focus:outline-none focus:ring-emerald-300/20"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.35em] text-white/60">
                    <DollarSign className="mr-1 inline h-3.5 w-3.5" /> Precio
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="50"
                    className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white focus:border-emerald-300/60 focus:outline-none focus:ring-emerald-300/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.35em] text-white/60">
                  Descripción (opcional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción breve del servicio..."
                  rows={2}
                  className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-emerald-300/60 focus:outline-none focus:ring-emerald-300/20"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={handleCancel}
                  className="aura-cta aura-cta--ghost"
                >
                  Cancelar
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={editingId ? handleUpdate : handleAdd}
                  disabled={!formData.name || !formData.duration || formData.price === undefined}
                  className="aura-cta aura-cta--primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {editingId ? 'Actualizar' : 'Agregar'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {services.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/20 px-6 py-10 text-center text-white/70">
            <p className="text-lg font-semibold text-white">Sin servicios</p>
            <p className="text-sm">
              Agrega al menos un servicio para activar el sistema de reservas
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="aura-cta aura-cta--primary"
            >
              Crear servicio
            </button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {services.map((service) => (
              <motion.div
                key={service.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-3xl border border-white/10 bg-white/5 p-4 text-white transition hover:border-white/40"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">
                      {service.name}
                    </h4>
                    {service.description && (
                      <p className="mt-1 text-sm text-white/70">
                        {service.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-sm text-white/70">
                        <Clock className="h-4 w-4" />
                        {service.duration} min
                      </span>
                      <span className="flex items-center gap-1 text-sm font-semibold text-emerald-200">
                        <DollarSign className="h-4 w-4" />
                        ${service.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(service)}
                      className="rounded-2xl border border-white/10 p-2 text-white/70 transition hover:border-white/40 hover:text-white"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="rounded-2xl border border-white/10 p-2 text-white/70 transition hover:border-rose-400/50 hover:text-rose-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
