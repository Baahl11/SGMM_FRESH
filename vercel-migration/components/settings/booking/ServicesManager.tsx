'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, DollarSign, Clock, Edit2, Trash2, Download } from 'lucide-react'
import toast from 'react-hot-toast'

interface Service {
  id: string
  name: string
  duration: number
  price: number
  description?: string
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
      
      const treatments = await response.json()
      
      if (!treatments || treatments.length === 0) {
        toast.error('No tienes tratamientos registrados')
        return
      }

      // Convertir tratamientos a servicios
      const existingIds = new Set(services.map(s => s.id))
      let addedCount = 0

      const newServices = treatments
        .filter((t: any) => t.activo !== false) // Solo tratamientos activos
        .map((t: any) => ({
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Servicios Ofrecidos
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Define los servicios que los pacientes pueden agendar
          </p>
        </div>
        {!isAdding && (
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleImportTreatments}
              disabled={loadingTreatments}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium shadow-lg shadow-green-500/25 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{loadingTreatments ? 'Cargando...' : 'Importar Tratamientos'}</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-lg shadow-blue-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Servicio</span>
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
            className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del servicio *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Consulta general"
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Duración (minutos) *
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                    min="5"
                    step="5"
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Precio *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="50"
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción breve del servicio..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                >
                  Cancelar
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={editingId ? handleUpdate : handleAdd}
                  disabled={!formData.name || !formData.duration || formData.price === undefined}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {editingId ? 'Actualizar' : 'Agregar'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {services.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No hay servicios configurados</p>
            <p className="text-sm mt-1">Agrega al menos un servicio para activar el sistema de reservas</p>
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
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {service.name}
                    </h4>
                    {service.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {service.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {service.duration} min
                      </span>
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        ${service.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(service)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
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
