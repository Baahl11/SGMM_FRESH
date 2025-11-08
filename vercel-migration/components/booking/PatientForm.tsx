'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, MessageSquare } from 'lucide-react'

interface Service {
  id: string
  name: string
  duration: number
  price: number
  description?: string
}

interface PatientFormProps {
  services: Service[]
  selectedService: string | null
  showPrices: boolean
  requirePhone: boolean
  onServiceChange: (serviceId: string) => void
  onSubmit: (data: {
    patient_name: string
    patient_email: string
    patient_phone: string
    patient_notes: string
  }) => void
  isSubmitting: boolean
}

export default function PatientForm({
  services,
  selectedService,
  showPrices,
  requirePhone,
  onServiceChange,
  onSubmit,
  isSubmitting
}: PatientFormProps) {
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_email: '',
    patient_phone: '',
    patient_notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.patient_name.trim()) {
      newErrors.patient_name = 'El nombre es requerido'
    }

    if (!formData.patient_email.trim()) {
      newErrors.patient_email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.patient_email)) {
      newErrors.patient_email = 'Email inválido'
    }

    if (requirePhone && !formData.patient_phone.trim()) {
      newErrors.patient_phone = 'El teléfono es requerido'
    }

    if (!selectedService) {
      newErrors.service = 'Debes seleccionar un servicio'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const selectedServiceData = services.find(s => s.id === selectedService)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Service Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Selecciona un servicio
        </h3>
        <div className="space-y-2">
          {services.map((service) => (
            <motion.button
              key={service.id}
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onServiceChange(service.id)}
              className={`
                w-full text-left p-4 rounded-lg border transition-all
                ${selectedService === service.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                }
              `}
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
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {service.duration} min
                    </span>
                    {showPrices && (
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        ${service.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                {selectedService === service.id && (
                  <div className="ml-3 flex-shrink-0">
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </motion.button>
          ))}
        </div>
        {errors.service && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">{errors.service}</p>
        )}
      </div>

      {/* Patient Information */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Tus datos
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Nombre completo *
            </label>
            <input
              type="text"
              value={formData.patient_name}
              onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
              placeholder="Ej: María García López"
              className={`
                w-full px-4 py-3 bg-white dark:bg-gray-900 border rounded-lg 
                focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all
                text-gray-900 dark:text-white placeholder-gray-400
                ${errors.patient_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}
              `}
            />
            {errors.patient_name && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.patient_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email *
            </label>
            <input
              type="email"
              value={formData.patient_email}
              onChange={(e) => setFormData({ ...formData, patient_email: e.target.value })}
              placeholder="ejemplo@correo.com"
              className={`
                w-full px-4 py-3 bg-white dark:bg-gray-900 border rounded-lg 
                focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all
                text-gray-900 dark:text-white placeholder-gray-400
                ${errors.patient_email ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}
              `}
            />
            {errors.patient_email && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.patient_email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Phone className="w-4 h-4 inline mr-1" />
              Teléfono {requirePhone && '*'}
            </label>
            <input
              type="tel"
              value={formData.patient_phone}
              onChange={(e) => setFormData({ ...formData, patient_phone: e.target.value })}
              placeholder="+52 555-1234"
              className={`
                w-full px-4 py-3 bg-white dark:bg-gray-900 border rounded-lg 
                focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all
                text-gray-900 dark:text-white placeholder-gray-400
                ${errors.patient_phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}
              `}
            />
            {errors.patient_phone && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.patient_phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Notas adicionales (opcional)
            </label>
            <textarea
              value={formData.patient_notes}
              onChange={(e) => setFormData({ ...formData, patient_notes: e.target.value })}
              placeholder="Motivo de consulta, síntomas, alergias, etc..."
              rows={4}
              className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Summary & Submit */}
      {selectedServiceData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800"
        >
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            Resumen de tu cita
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Servicio:</span>
              <span className="font-medium text-gray-900 dark:text-white">{selectedServiceData.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Duración:</span>
              <span className="font-medium text-gray-900 dark:text-white">{selectedServiceData.duration} minutos</span>
            </div>
            {showPrices && (
              <div className="flex justify-between pt-2 border-t border-blue-200 dark:border-blue-800">
                <span className="text-gray-600 dark:text-gray-400">Precio:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400 text-lg">
                  ${selectedServiceData.price.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      <motion.button
        type="submit"
        disabled={isSubmitting}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Agendando...' : 'Confirmar reserva'}
      </motion.button>
    </form>
  )
}
