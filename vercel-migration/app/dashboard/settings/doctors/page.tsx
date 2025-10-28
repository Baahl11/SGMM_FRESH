'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Sparkles } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import DoctorCard from '@/components/settings/DoctorCard'
import DoctorModal from '@/components/settings/DoctorModal'
import { useQuotaCheck } from '@/lib/hooks/use-quota-check'
import { UpgradeModal } from '@/components/subscription/upgrade-modal'
import { QuotaBadge } from '@/components/subscription/quota-badge'

interface Doctor {
  id: string
  nombre: string
  especialidad: string | null
  cedula_profesional: string | null
  telefono: string | null
  email: string | null
  color: string
  activo: boolean
  created_at: string
  updated_at: string
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const { usage, checkCanAddDoctor } = useQuotaCheck()

  useEffect(() => {
    loadDoctors()
  }, [])

  async function loadDoctors() {
    try {
      const response = await fetch('/api/doctors')
      if (!response.ok) throw new Error('Error al cargar doctores')
      const data = await response.json()
      console.log('🔥 [doctors-page] Doctors loaded:', data)
      setDoctors(data.doctors || [])
    } catch (error) {
      toast.error('Error al cargar doctores')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(doctorData: Partial<Doctor>) {
    try {
      if (editingDoctor) {
        // Update
        const response = await fetch(`/api/doctors/${editingDoctor.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(doctorData)
        })
        if (!response.ok) throw new Error('Error al actualizar')
        const updated = await response.json()
        setDoctors(doctors.map(d => d.id === updated.id ? updated : d))
        toast.success('Doctor actualizado exitosamente')
      } else {
        // Create - Check quota first
        const quotaCheck = await checkCanAddDoctor()
        if (!quotaCheck.allowed) {
          setShowUpgradeModal(true)
          setIsModalOpen(false)
          return
        }

        const response = await fetch('/api/doctors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(doctorData)
        })
        if (!response.ok) throw new Error('Error al crear')
        const newDoctor = await response.json()
        setDoctors([...doctors, newDoctor])
        toast.success('Doctor creado exitosamente')
      }
      setIsModalOpen(false)
      setEditingDoctor(null)
    } catch (error) {
      toast.error('Error al guardar doctor')
      console.error(error)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de desactivar este doctor?')) return
    
    try {
      const response = await fetch(`/api/doctors/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Error al desactivar')
      const updated = await response.json()
      setDoctors(doctors.map(d => d.id === updated.doctor.id ? updated.doctor : d))
      toast.success('Doctor desactivado')
    } catch (error) {
      toast.error('Error al desactivar doctor')
      console.error(error)
    }
  }

  const filteredDoctors = doctors.filter(doctor =>
    doctor.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.especialidad?.toLowerCase().includes(searchQuery.toLowerCase())
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-blue-500" />
                Doctores
              </h2>
              {usage && <QuotaBadge usage={usage} type="doctors" />}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {doctors.length} {doctors.length === 1 ? 'profesional registrado' : 'profesionales registrados'}
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setEditingDoctor(null)
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Doctor</span>
          </motion.button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o especialidad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>

        {/* Doctors Grid */}
        {filteredDoctors.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 px-4"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'No se encontraron doctores' : 'Aún no hay doctores'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
              {searchQuery 
                ? 'Intenta con otro término de búsqueda'
                : 'Comienza agregando tu primer doctor al equipo médico'
              }
            </p>
            {!searchQuery && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25"
              >
                <Plus className="w-5 h-5" />
                <span>Agregar Primer Doctor</span>
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredDoctors.map((doctor, index) => (
                <motion.div
                  key={doctor.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <DoctorCard
                    doctor={doctor}
                    onEdit={() => {
                      setEditingDoctor(doctor)
                      setIsModalOpen(true)
                    }}
                    onDelete={() => handleDelete(doctor.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Modal */}
      <DoctorModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingDoctor(null)
        }}
        onSave={handleSave}
        doctor={editingDoctor}
      />

      {/* Upgrade Modal */}
      {usage && (
        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          currentPlan={usage.plan_tier}
          limitType="doctors"
          currentCount={usage.current_doctors}
          maxCount={usage.max_doctors}
        />
      )}
    </>
  )
}
