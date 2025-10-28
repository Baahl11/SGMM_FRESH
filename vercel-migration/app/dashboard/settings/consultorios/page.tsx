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
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-6 h-6 text-emerald-500" />
                Consultorios
              </h2>
              {usage && <QuotaBadge usage={usage} type="locations" />}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {consultorios.length} {consultorios.length === 1 ? 'espacio disponible' : 'espacios disponibles'}
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setEditingConsultorio(null)
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Consultorio</span>
          </motion.button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o ubicación..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>

        {filteredConsultorios.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 px-4"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'No se encontraron consultorios' : 'Aún no hay consultorios'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
              {searchQuery 
                ? 'Intenta con otro término de búsqueda'
                : 'Comienza agregando tu primer espacio de atención'
              }
            </p>
            {!searchQuery && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25"
              >
                <Plus className="w-5 h-5" />
                <span>Agregar Primer Consultorio</span>
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
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
