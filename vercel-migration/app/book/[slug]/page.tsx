'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { Calendar, MapPin, Phone, Mail, CheckCircle, AlertCircle } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import DateTimeSelector from '@/components/booking/DateTimeSelector'
import PatientForm from '@/components/booking/PatientForm'

interface ClinicInfo {
  nombre_clinica: string
  direccion_clinica: string | null
  telefono_clinica: string | null
  especialidad: string | null
}

interface BookingSettings {
  services: Array<{
    id: string
    name: string
    duration: number
    price: number
    description?: string
  }>
  page_title: string
  welcome_message: string | null
  show_prices: boolean
  require_phone: boolean
}

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [loading, setLoading] = useState(true)
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo | null>(null)
  const [settings, setSettings] = useState<BookingSettings | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Booking flow state
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  
  // Deposit state
  const [depositInfo, setDepositInfo] = useState<any>(null)
  const [loadingDeposit, setLoadingDeposit] = useState(false)

  useEffect(() => {
    loadClinicInfo()
  }, [slug])

  // Check deposit requirement when service changes
  useEffect(() => {
    if (selectedService) {
      checkDepositRequirement()
    } else {
      setDepositInfo(null)
    }
  }, [selectedService])

  async function checkDepositRequirement() {
    if (!selectedService) return

    setLoadingDeposit(true)
    try {
      const service = settings?.services.find(s => s.id === selectedService)
      const response = await fetch('/api/bookings/deposits/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic_slug: slug,
          service_id: selectedService,
          service_price: service?.price || 0
        })
      })

      if (response.ok) {
        const data = await response.json()
        setDepositInfo(data)
      }
    } catch (error) {
      console.error('Error checking deposit:', error)
    } finally {
      setLoadingDeposit(false)
    }
  }

  async function loadClinicInfo() {
    try {
      const response = await fetch(`/api/public/clinic/${slug}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError('Esta página de reservas no existe')
        } else {
          setError('Error al cargar información')
        }
        return
      }

      const data = await response.json()
      setClinicInfo(data.clinic)
      setSettings(data.settings)
    } catch (err) {
      console.error('Error loading clinic info:', err)
      setError('Error al cargar la página')
    } finally {
      setLoading(false)
    }
  }

  async function handleBookingSubmit(patientData: {
    patient_name: string
    patient_email: string
    patient_phone: string
    patient_notes: string
  }) {
    if (!selectedDate || !selectedTime || !selectedService) {
      toast.error('Por favor completa todos los campos')
      return
    }

    const service = settings?.services.find(s => s.id === selectedService)
    if (!service) {
      toast.error('Servicio no válido')
      return
    }

    setIsSubmitting(true)
    try {
      // Step 1: Create the booking
      const bookingResponse = await fetch(`/api/public/book/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...patientData,
          service_name: service.name,
          service_price: service.price,
          service_duration_minutes: service.duration,
          booking_date: selectedDate,
          booking_time: selectedTime
        })
      })

      if (!bookingResponse.ok) {
        const errorData = await bookingResponse.json()
        throw new Error(errorData.error || 'Error al crear reserva')
      }

      const bookingData = await bookingResponse.json()

      // Step 2: If deposit required, create payment
      if (depositInfo && depositInfo.required) {
        const depositResponse = await fetch('/api/bookings/deposits/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            booking_id: bookingData.booking.id,
            amount: depositInfo.amount,
            patient_email: patientData.patient_email,
            patient_name: patientData.patient_name
          })
        })

        if (!depositResponse.ok) {
          throw new Error('Error al crear pago de depósito')
        }

        const depositData = await depositResponse.json()

        // Redirect to Stripe Checkout
        if (depositData.checkout_url) {
          window.location.href = depositData.checkout_url
          return
        }
      }

      // If no deposit required, show success
      setBookingSuccess(true)
      toast.success('¡Reserva confirmada!')
    } catch (err: any) {
      console.error('Error creating booking:', err)
      toast.error(err.message || 'Error al crear reserva')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (error || !clinicInfo || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {error || 'Página no disponible'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Esta página de reservas no está disponible en este momento.
          </p>
        </div>
      </div>
    )
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            ¡Reserva Confirmada!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Hemos recibido tu solicitud de cita. Recibirás un correo de confirmación pronto.
          </p>
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 mb-6">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Fecha:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(selectedDate!).toLocaleDateString('es-MX', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Hora:</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedTime}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all"
          >
            Agendar otra cita
          </button>
        </motion.div>
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

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
              {settings.page_title}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {clinicInfo.nombre_clinica}
            </p>
            {settings.welcome_message && (
              <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl mx-auto">
                {settings.welcome_message}
              </p>
            )}
          </motion.div>

          {/* Clinic Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {clinicInfo.direccion_clinica && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex items-center gap-3"
              >
                <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-gray-500 dark:text-gray-400">Ubicación</p>
                  <p className="text-gray-900 dark:text-white font-medium">{clinicInfo.direccion_clinica}</p>
                </div>
              </motion.div>
            )}
            {clinicInfo.telefono_clinica && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex items-center gap-3"
              >
                <Phone className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-gray-500 dark:text-gray-400">Teléfono</p>
                  <p className="text-gray-900 dark:text-white font-medium">{clinicInfo.telefono_clinica}</p>
                </div>
              </motion.div>
            )}
            {clinicInfo.especialidad && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex items-center gap-3"
              >
                <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-gray-500 dark:text-gray-400">Especialidad</p>
                  <p className="text-gray-900 dark:text-white font-medium">{clinicInfo.especialidad}</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Date & Time Selection */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <DateTimeSelector
                slug={slug}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onDateChange={setSelectedDate}
                onTimeChange={setSelectedTime}
              />
            </motion.div>

            {/* Right: Service & Patient Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <PatientForm
                services={settings.services}
                selectedService={selectedService}
                showPrices={settings.show_prices}
                requirePhone={settings.require_phone}
                depositInfo={depositInfo}
                loadingDeposit={loadingDeposit}
                onServiceChange={setSelectedService}
                onSubmit={handleBookingSubmit}
                isSubmitting={isSubmitting}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </>
  )
}
