'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Calendar } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import AppointmentTypeCard from '@/components/settings/AppointmentTypeCard'
import AppointmentTypeModal from '@/components/settings/AppointmentTypeModal'
import { GlassPanel } from '@/components/ui/glass-panel'
import { Input } from '@/components/ui/input'

interface AppointmentType {
  id: string
  nombre: string
  descripcion: string | null
  duracion_minutos: number
  color: string
  precio_default: number | null
  requiere_confirmacion: boolean
  activo: boolean
  created_at: string
  updated_at: string
}

export default function AppointmentTypesPage() {
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingType, setEditingType] = useState<AppointmentType | null>(null)

  useEffect(() => {
    loadAppointmentTypes()
  }, [])

  async function loadAppointmentTypes() {
    try {
      const response = await fetch('/api/appointment-types')
      if (!response.ok) throw new Error('Error al cargar tipos de cita')
      const data = await response.json()
      setAppointmentTypes(data)
    } catch (error) {
      toast.error('Error al cargar tipos de cita')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(typeData: Partial<AppointmentType>) {
    try {
      if (editingType) {
        const response = await fetch(`/api/appointment-types/${editingType.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(typeData)
        })
        if (!response.ok) throw new Error('Error al actualizar')
        const updated = await response.json()
        setAppointmentTypes(appointmentTypes.map(t => t.id === updated.id ? updated : t))
        toast.success('Tipo de cita actualizado exitosamente')
      } else {
        const response = await fetch('/api/appointment-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(typeData)
        })
        if (!response.ok) throw new Error('Error al crear')
        const newType = await response.json()
        setAppointmentTypes([...appointmentTypes, newType])
        toast.success('Tipo de cita creado exitosamente')
      }
      setIsModalOpen(false)
      setEditingType(null)
    } catch (error) {
      toast.error('Error al guardar tipo de cita')
      console.error(error)
    }
  }

  const filteredTypes = appointmentTypes.filter(type =>
    type.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    type.descripcion?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeTypes = appointmentTypes.filter((type) => type.activo).length
  const confirmRequired = appointmentTypes.filter((type) => type.requiere_confirmacion).length
  const avgDuration = appointmentTypes.length
    ? Math.round(
        appointmentTypes.reduce((sum, type) => sum + type.duracion_minutos, 0) /
          appointmentTypes.length
      )
    : 0

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <GlassPanel className="flex items-center gap-3 border-white/10 bg-white/5 px-6 py-4 text-white">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-transparent" />
          Cargando tipos de cita...
        </GlassPanel>
      </div>
    )
  }

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700',
          duration: 3000,
        }}
      />

      <div className="space-y-6">
        <GlassPanel className="relative overflow-hidden border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/0 p-6 text-white">
          <div className="pointer-events-none absolute inset-0 opacity-70">
            <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-purple-500/25 blur-[140px]" />
            <div className="absolute -bottom-16 left-0 h-56 w-56 rounded-full bg-indigo-500/20 blur-[130px]" />
          </div>
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/70">
                <Calendar className="h-4 w-4" />
                Servicios
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Tipos de cita</h1>
                <p className="mt-2 max-w-2xl text-sm text-white/70">
                  Define cada servicio con duración, precio sugerido y requisitos para mantener agendas impecables.
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setEditingType(null)
                setIsModalOpen(true)
              }}
              className="aura-cta aura-cta--primary"
            >
              <Plus className="h-4 w-4" />
              Nuevo tipo
            </motion.button>
          </div>
        </GlassPanel>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <GlassPanel className="border-white/10 bg-white/5 p-5 text-white">
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">Totales</p>
            <p className="text-3xl font-semibold">{appointmentTypes.length}</p>
            <p className="text-sm text-white/70">configurados</p>
          </GlassPanel>
          <GlassPanel className="border-white/10 bg-white/5 p-5 text-white">
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">Activos</p>
            <p className="text-3xl font-semibold text-emerald-200">{activeTypes}</p>
            <p className="text-sm text-white/70">publicados</p>
          </GlassPanel>
          <GlassPanel className="border-white/10 bg-white/5 p-5 text-white">
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">Duración promedio</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-semibold text-sky-200">{avgDuration || '--'}</p>
              <span className="text-sm text-white/60">min</span>
            </div>
            <p className="text-sm text-white/70">agenda estimada</p>
          </GlassPanel>
          <GlassPanel className="border-white/10 bg-white/5 p-5 text-white">
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">Requieren confirmación</p>
            <p className="text-3xl font-semibold text-amber-200">{confirmRequired}</p>
            <p className="text-sm text-white/70">con protocolo</p>
          </GlassPanel>
        </div>

        <GlassPanel className="border-white/10 bg-white/5 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 rounded-2xl border-white/15 bg-white/5 pl-12 text-white placeholder:text-white/40"
            />
          </div>
        </GlassPanel>

        {filteredTypes.length === 0 ? (
          <GlassPanel className="flex flex-col items-center gap-4 border-white/10 bg-white/5 px-6 py-16 text-center text-white/70">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-dashed border-white/30">
              <Calendar className="h-8 w-8 text-white/70" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {searchQuery ? 'Sin resultados' : 'Aún no hay tipos de cita'}
              </h3>
              <p className="text-sm text-white/60">
                {searchQuery
                  ? 'Intenta con otro término o limpia los filtros.'
                  : 'Crea tus servicios para abrir la agenda digital.'}
              </p>
            </div>
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="aura-cta aura-cta--ghost"
              >
                Limpiar búsqueda
              </button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsModalOpen(true)}
                className="aura-cta aura-cta--primary"
              >
                <Plus className="h-4 w-4" />
                Agregar primer tipo
              </motion.button>
            )}
          </GlassPanel>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredTypes.map((type, index) => (
                <motion.div
                  key={type.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <AppointmentTypeCard
                    type={type}
                    onEdit={() => {
                      setEditingType(type)
                      setIsModalOpen(true)
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <AppointmentTypeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingType(null)
        }}
        onSave={handleSave}
        appointmentType={editingType}
      />
    </>
  )
}
