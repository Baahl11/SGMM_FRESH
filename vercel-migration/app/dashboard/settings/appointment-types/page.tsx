'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Calendar } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import AppointmentTypeCard from '@/components/settings/AppointmentTypeCard'
import AppointmentTypeModal from '@/components/settings/AppointmentTypeModal'

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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-violet-500" />
              Tipos de Cita
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {appointmentTypes.length} {appointmentTypes.length === 1 ? 'tipo configurado' : 'tipos configurados'}
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setEditingType(null)
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg shadow-violet-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Tipo</span>
          </motion.button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>

        {filteredTypes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 px-4"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 rounded-2xl flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-violet-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'No se encontraron tipos de cita' : 'Aún no hay tipos de cita'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
              {searchQuery 
                ? 'Intenta con otro término de búsqueda'
                : 'Define los tipos de servicio que ofreces'
              }
            </p>
            {!searchQuery && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium shadow-lg shadow-violet-500/25"
              >
                <Plus className="w-5 h-5" />
                <span>Agregar Primer Tipo</span>
              </motion.button>
            )}
          </motion.div>
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
