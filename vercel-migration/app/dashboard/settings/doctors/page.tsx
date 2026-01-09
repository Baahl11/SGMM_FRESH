'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Sparkles, Stethoscope, Users as UsersIcon, UserCheck, UserX } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import DoctorCard from '@/components/settings/DoctorCard'
import DoctorModal from '@/components/settings/DoctorModal'
import { useQuotaCheck } from '@/lib/hooks/use-quota-check'
import { UpgradeModal } from '@/components/subscription/upgrade-modal'
import { QuotaBadge } from '@/components/subscription/quota-badge'
import { GlassPanel } from '@/components/ui/glass-panel'
import { Input } from '@/components/ui/input'

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

  const totalDoctors = doctors.length
  const activeDoctors = doctors.filter((doctor) => doctor.activo).length
  const inactiveDoctors = totalDoctors - activeDoctors
  const specialties = new Set(doctors.map((doctor) => doctor.especialidad?.trim()).filter(Boolean))

  useEffect(() => {
    loadDoctors()
  }, [])

  async function loadDoctors() {
    try {
      const response = await fetch('/api/doctors')
      if (!response.ok) throw new Error('Error al cargar doctores')
      const data = await response.json()
      console.log('🔥 [doctors-page] Doctors loaded:', data)

      const doctorsData = Array.isArray(data)
        ? data
        : Array.isArray((data as { doctors?: Doctor[] })?.doctors)
          ? (data as { doctors: Doctor[] }).doctors
          : []

      setDoctors(doctorsData)
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
      <GlassPanel className="flex h-96 items-center justify-center border-white/10 bg-white/5">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="h-10 w-10 rounded-full border-2 border-white/30 border-t-transparent"
        />
      </GlassPanel>
    )
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'border border-white/20 bg-white/10 text-white backdrop-blur-xl',
          duration: 3000,
        }}
      />

      <div className="space-y-6">
        <GlassPanel className="relative overflow-hidden border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/0 p-6 text-white">
          <div className="pointer-events-none absolute inset-0 opacity-70">
            <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-amber-400/25 blur-[140px]" />
            <div className="absolute -bottom-16 left-0 h-56 w-56 rounded-full bg-emerald-400/20 blur-[130px]" />
          </div>
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/70">
                <Sparkles className="h-4 w-4" />
                Talento Médico
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Doctores</h1>
                <p className="mt-2 max-w-2xl text-sm text-white/70">
                  Configura tu staff clínico, define especialidades y mantén el control de cupos disponibles.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {usage && <QuotaBadge usage={usage} type="doctors" />}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setEditingDoctor(null)
                  setIsModalOpen(true)
                }}
                className="aura-cta aura-cta--primary"
              >
                <Plus className="h-4 w-4" />
                Nuevo doctor
              </motion.button>
            </div>
          </div>
        </GlassPanel>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <GlassPanel className="border-white/10 bg-white/5 p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/50">Registrados</p>
                <p className="text-3xl font-semibold">{totalDoctors}</p>
              </div>
              <UsersIcon className="h-10 w-10 text-white/70" />
            </div>
          </GlassPanel>
          <GlassPanel className="border-white/10 bg-white/5 p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/50">Activos</p>
                <p className="text-3xl font-semibold text-emerald-200">{activeDoctors}</p>
              </div>
              <UserCheck className="h-10 w-10 text-emerald-300" />
            </div>
          </GlassPanel>
          <GlassPanel className="border-white/10 bg-white/5 p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/50">Inactivos</p>
                <p className="text-3xl font-semibold text-amber-200">{inactiveDoctors}</p>
              </div>
              <UserX className="h-10 w-10 text-amber-300" />
            </div>
          </GlassPanel>
          <GlassPanel className="border-white/10 bg-white/5 p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/50">Especialidades</p>
                <p className="text-3xl font-semibold text-sky-200">{specialties.size}</p>
              </div>
              <Stethoscope className="h-10 w-10 text-sky-300" />
            </div>
          </GlassPanel>
        </div>

        <GlassPanel className="border-white/10 bg-white/5 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              type="text"
              placeholder="Buscar por nombre o especialidad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 rounded-2xl border-white/15 bg-white/0 pl-10 text-white placeholder:text-white/40 focus-visible:ring-white/40"
            />
          </div>
        </GlassPanel>

        {/* Doctors Grid */}
        {filteredDoctors.length === 0 ? (
          <GlassPanel className="border-white/10 bg-white/5 py-14 text-white">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center px-4"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                <Sparkles className="h-8 w-8 text-amber-300" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                {searchQuery ? 'No se encontraron doctores' : 'Aún no hay doctores'}
              </h3>
              <p className="mb-6 max-w-sm text-center text-sm text-white/70">
                {searchQuery
                  ? 'Intenta con otro término de búsqueda'
                  : 'Comienza agregando tu primer doctor al equipo médico'}
              </p>
              {!searchQuery && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsModalOpen(true)}
                  className="aura-cta aura-cta--primary"
                >
                  <Plus className="h-4 w-4" />
                  Agregar primer doctor
                </motion.button>
              )}
            </motion.div>
          </GlassPanel>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
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
