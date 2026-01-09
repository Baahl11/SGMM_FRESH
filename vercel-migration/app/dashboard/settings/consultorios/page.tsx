'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Building2 } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import ConsultorioCard from '@/components/settings/ConsultorioCard'
import ConsultorioModal from '@/components/settings/ConsultorioModal'
import { useQuotaCheck } from '@/lib/hooks/use-quota-check'
import { UpgradeModal } from '@/components/subscription/upgrade-modal'
import { QuotaBadge } from '@/components/subscription/quota-badge'
import { GlassPanel } from '@/components/ui/glass-panel'

interface Consultorio {
  id: string
  nombre: string
  ubicacion: string | null
  descripcion: string | null
  capacidad: number
  activo: boolean
  created_at: string
  updated_at: string
}

export default function ConsultoriosPage() {
  const [consultorios, setConsultorios] = useState<Consultorio[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingConsultorio, setEditingConsultorio] = useState<Consultorio | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const { usage, checkCanAddLocation } = useQuotaCheck()

  useEffect(() => {
    loadConsultorios()
  }, [])

  async function loadConsultorios() {
    try {
      const response = await fetch('/api/consultorios')
      if (!response.ok) throw new Error('Error al cargar consultorios')
      const data = await response.json()
      setConsultorios(data)
    } catch (error) {
      toast.error('Error al cargar consultorios')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(consultorioData: Partial<Consultorio>) {
    try {
      if (editingConsultorio) {
        const response = await fetch(`/api/consultorios/${editingConsultorio.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(consultorioData)
        })
        if (!response.ok) throw new Error('Error al actualizar')
        const updated = await response.json()
        setConsultorios(consultorios.map(c => c.id === updated.id ? updated : c))
        toast.success('Consultorio actualizado exitosamente')
      } else {
        // Create - Check quota first
        const quotaCheck = await checkCanAddLocation()
        if (!quotaCheck.allowed) {
          setShowUpgradeModal(true)
          setIsModalOpen(false)
          return
        }

        const response = await fetch('/api/consultorios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(consultorioData)
        })
        if (!response.ok) throw new Error('Error al crear')
        const newConsultorio = await response.json()
        setConsultorios([...consultorios, newConsultorio])
        toast.success('Consultorio creado exitosamente')
      }
      setIsModalOpen(false)
      setEditingConsultorio(null)
    } catch (error) {
      toast.error('Error al guardar consultorio')
      console.error(error)
    }
  }

  const filteredConsultorios = consultorios.filter(consultorio =>
    consultorio.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    consultorio.ubicacion?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalCapacity = consultorios.reduce((sum, c) => sum + (c.capacidad || 0), 0)
  const activeConsultorios = consultorios.filter((c) => c.activo).length
  const hasFilters = searchQuery.trim().length > 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
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
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-emerald-400/25 blur-[140px]" />
            <div className="absolute -bottom-16 left-0 h-56 w-56 rounded-full bg-teal-400/20 blur-[130px]" />
          </div>
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/70">
                <Building2 className="h-4 w-4" />
                Espacios
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Consultorios</h1>
                <p className="mt-2 max-w-2xl text-sm text-white/70">
                  Administra los espacios físicos por sede, define capacidad y tiempos para mantener la operación coordinada.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {usage && <QuotaBadge usage={usage} type="locations" />}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setEditingConsultorio(null)
                  setIsModalOpen(true)
                }}
                className="aura-cta aura-cta--primary"
              >
                <Plus className="h-4 w-4" />
                Nuevo consultorio
              </motion.button>
            </div>
          </div>
        </GlassPanel>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <GlassPanel className="border-white/10 bg-white/5 p-5 text-white">
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">Espacios</p>
            <p className="text-3xl font-semibold">{consultorios.length}</p>
            <p className="text-sm text-white/70">totales</p>
          </GlassPanel>
          <GlassPanel className="border-white/10 bg-white/5 p-5 text-white">
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">Activos</p>
            <p className="text-3xl font-semibold text-emerald-200">{activeConsultorios}</p>
            <p className="text-sm text-white/70">en uso</p>
          </GlassPanel>
          <GlassPanel className="border-white/10 bg-white/5 p-5 text-white">
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">Capacidad</p>
            <p className="text-3xl font-semibold text-sky-200">{totalCapacity}</p>
            <p className="text-sm text-white/70">pacientes / día</p>
          </GlassPanel>
          <GlassPanel className="border-white/10 bg-white/5 p-5 text-white">
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">Ubicaciones</p>
            <p className="text-3xl font-semibold text-amber-200">{new Set(consultorios.map((c) => c.ubicacion || 'Sin asignar')).size}</p>
            <p className="text-sm text-white/70">sede(s)</p>
          </GlassPanel>
        </div>

        <GlassPanel className="border-white/10 bg-white/5 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Buscar por nombre o ubicación..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-2xl border border-white/15 bg-white/5 pl-12 pr-4 text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
            />
          </div>
        </GlassPanel>

        {filteredConsultorios.length === 0 ? (
          <GlassPanel className="flex flex-col items-center gap-4 border-white/10 bg-white/5 px-6 py-16 text-center text-white/70">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-dashed border-white/30">
              <Building2 className="h-8 w-8 text-white/70" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {hasFilters ? 'Sin resultados' : 'Aún no hay consultorios'}
              </h3>
              <p className="text-sm text-white/60">
                {hasFilters ? 'Ajusta los filtros o limpia la búsqueda.' : 'Agrega el primer espacio para habilitar agendas físicas.'}
              </p>
            </div>
            {hasFilters ? (
              <button
                className="aura-cta aura-cta--ghost"
                onClick={() => setSearchQuery('')}
              >
                Limpiar filtros
              </button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsModalOpen(true)}
                className="aura-cta aura-cta--primary"
              >
                <Plus className="h-4 w-4" />
                Agregar primer consultorio
              </motion.button>
            )}
          </GlassPanel>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {filteredConsultorios.map((consultorio, index) => (
                <motion.div
                  key={consultorio.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <ConsultorioCard
                    consultorio={consultorio}
                    onEdit={() => {
                      setEditingConsultorio(consultorio)
                      setIsModalOpen(true)
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <ConsultorioModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingConsultorio(null)
        }}
        onSave={handleSave}
        consultorio={editingConsultorio}
      />

      {/* Upgrade Modal */}
      {usage && (
        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          currentPlan={usage.plan_tier}
          limitType="locations"
          currentCount={usage.current_locations}
          maxCount={usage.max_locations}
        />
      )}
    </>
  )
}
