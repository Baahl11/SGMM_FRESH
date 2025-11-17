'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Globe, Save, Copy, Check, ExternalLink, AlertCircle } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import ServicesManager from '@/components/settings/booking/ServicesManager'
import ScheduleManager from '@/components/settings/booking/ScheduleManager'

interface Service {
  id: string
  name: string
  duration: number
  price: number
  description?: string
}

interface TimeRange {
  start: string
  end: string
}

interface BookingSettings {
  available_days: string[]
  time_ranges: Record<string, TimeRange[]>
  slot_duration_minutes: number
  buffer_time_minutes: number
  min_advance_hours: number
  max_advance_days: number
  services: Service[]
  page_title: string
  welcome_message: string | null
  show_prices: boolean
  require_phone: boolean
  auto_confirm: boolean
  send_confirmation_email: boolean
  send_confirmation_sms: boolean
  send_confirmation_whatsapp: boolean
  // Deposit settings
  require_deposit: boolean
  deposit_type: 'fixed' | 'percentage'
  deposit_amount: number
  deposit_percentage: number
  deposit_min_amount: number
  deposit_max_amount: number
  refund_policy: 'no_refund' | '24_hours' | '48_hours' | '72_hours' | 'anytime'
  deposit_message: string
  services_requiring_deposit: string[]
}

export default function BookingSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<BookingSettings | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadSettings()
    loadUserProfile()
  }, [])

  async function loadSettings() {
    try {
      const response = await fetch('/api/booking-settings')
      if (!response.ok) throw new Error('Error al cargar configuración')
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      toast.error('Error al cargar configuración')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function loadUserProfile() {
    try {
      const response = await fetch('/api/user/profile')
      if (!response.ok) throw new Error('Error al cargar perfil')
      const data = await response.json()
      setUserProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  async function handleSave() {
    if (!settings) return

    // Validations
    if (settings.services.length === 0) {
      toast.error('Debes agregar al menos un servicio')
      return
    }

    const hasSchedules = settings.available_days.some(day => {
      const ranges = settings.time_ranges[day]
      return ranges && ranges.length > 0
    })

    if (!hasSchedules) {
      toast.error('Debes configurar horarios para al menos un día')
      return
    }

    if (!userProfile?.booking_slug) {
      toast.error('Debes configurar un slug único para tu página de reservas')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/booking-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (!response.ok) throw new Error('Error al guardar')
      
      const updated = await response.json()
      setSettings(updated)
      toast.success('Configuración guardada exitosamente')
    } catch (error) {
      toast.error('Error al guardar configuración')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleCopyUrl = () => {
    if (!userProfile?.booking_slug) return

    const url = `${window.location.origin}/book/${userProfile.booking_slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('URL copiada al portapapeles')
    setTimeout(() => setCopied(false), 2000)
  }

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

  if (!settings) return null

  const bookingUrl = userProfile?.booking_slug 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/book/${userProfile.booking_slug}`
    : null

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
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Globe className="w-6 h-6 text-blue-500" />
              Reservas Online
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Configura tu sistema de reservas públicas
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </motion.button>
        </div>

        {/* Public URL Card */}
        {userProfile?.booking_slug ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl p-6 text-white shadow-lg"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Tu Página Pública de Reservas
                </h3>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 font-mono text-sm break-all">
                  {bookingUrl}
                </div>
                <p className="text-sm text-white/80 mt-2">
                  Comparte esta URL con tus pacientes para que puedan agendar citas online
                </p>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={handleCopyUrl}
                  className="p-2.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all backdrop-blur-sm"
                  title="Copiar URL"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
                {bookingUrl && (
                  <a
                    href={bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all backdrop-blur-sm"
                    title="Abrir en nueva pestaña"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-yellow-900 dark:text-yellow-200 mb-2">
                  Configura tu URL única
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-3">
                  Necesitas un "slug" único para tu página de reservas.
                  Este será parte de tu URL pública: <code className="bg-yellow-100 dark:bg-yellow-900/50 px-1.5 py-0.5 rounded">{typeof window !== 'undefined' ? window.location.origin : ''}/book/tu-slug</code>
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="mi-consultorio"
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                      e.target.value = value
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && e.currentTarget.value) {
                        const slug = e.currentTarget.value
                        try {
                          const response = await fetch('/api/user/profile', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ booking_slug: slug })
                          })
                          if (!response.ok) {
                            const error = await response.json()
                            toast.error(error.error || 'Error al guardar slug')
                            return
                          }
                          const updated = await response.json()
                          setUserProfile(updated)
                          toast.success('URL configurada exitosamente')
                        } catch (error) {
                          toast.error('Error al configurar URL')
                        }
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-yellow-300 dark:border-yellow-700 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={async (e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement
                      if (!input.value) {
                        toast.error('Ingresa un slug válido')
                        return
                      }
                      const slug = input.value
                      try {
                        const response = await fetch('/api/user/profile', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ booking_slug: slug })
                        })
                        if (!response.ok) {
                          const error = await response.json()
                          toast.error(error.error || 'Error al guardar slug')
                          return
                        }
                        const updated = await response.json()
                        setUserProfile(updated)
                        toast.success('URL configurada exitosamente')
                      } catch (error) {
                        toast.error('Error al configurar URL')
                      }
                    }}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-all"
                  >
                    Guardar
                  </button>
                </div>
                <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
                  Solo letras minúsculas, números y guiones. Ej: dr-lopez, consultorio-norte
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Page Customization */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Personalización de la Página
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título de la página
              </label>
              <input
                type="text"
                value={settings.page_title}
                onChange={(e) => setSettings({ ...settings, page_title: e.target.value })}
                placeholder="Ej: Agenda tu cita"
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mensaje de bienvenida (opcional)
              </label>
              <textarea
                value={settings.welcome_message || ''}
                onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value || null })}
                placeholder="Mensaje personalizado para tus pacientes..."
                rows={3}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-all">
                <input
                  type="checkbox"
                  checked={settings.show_prices}
                  onChange={(e) => setSettings({ ...settings, show_prices: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mostrar precios
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-all">
                <input
                  type="checkbox"
                  checked={settings.require_phone}
                  onChange={(e) => setSettings({ ...settings, require_phone: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Requerir teléfono
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <ServicesManager
            services={settings.services}
            onChange={(services) => setSettings({ ...settings, services })}
          />
        </div>

        {/* Schedule */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <ScheduleManager
            availableDays={settings.available_days}
            timeRanges={settings.time_ranges}
            slotDuration={settings.slot_duration_minutes}
            bufferTime={settings.buffer_time_minutes}
            onChange={(data) => setSettings({
              ...settings,
              available_days: data.availableDays,
              time_ranges: data.timeRanges,
              slot_duration_minutes: data.slotDuration,
              buffer_time_minutes: data.bufferTime
            })}
          />
        </div>

        {/* Booking Limits */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Límites de Reserva
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Anticipación mínima (horas)
              </label>
              <input
                type="number"
                value={settings.min_advance_hours}
                onChange={(e) => setSettings({ ...settings, min_advance_hours: parseInt(e.target.value) || 0 })}
                min="0"
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                No se puede agendar con menos anticipación
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Anticipación máxima (días)
              </label>
              <input
                type="number"
                value={settings.max_advance_days}
                onChange={(e) => setSettings({ ...settings, max_advance_days: parseInt(e.target.value) || 0 })}
                min="1"
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Hasta cuántos días en el futuro se puede agendar
              </p>
            </div>
          </div>
        </div>

        {/* Confirmation Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Confirmaciones
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-all">
              <input
                type="checkbox"
                checked={settings.auto_confirm}
                onChange={(e) => setSettings({ ...settings, auto_confirm: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                  Auto-confirmar reservas
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Las reservas se confirman automáticamente sin tu aprobación
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-all">
              <input
                type="checkbox"
                checked={settings.send_confirmation_email}
                onChange={(e) => setSettings({ ...settings, send_confirmation_email: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enviar confirmación por Email
              </span>
            </label>

            <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-all">
              <input
                type="checkbox"
                checked={settings.send_confirmation_whatsapp}
                onChange={(e) => setSettings({ ...settings, send_confirmation_whatsapp: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enviar confirmación por WhatsApp
              </span>
            </label>
          </div>
        </div>

        {/* Deposit Settings - NEW */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                💰 Depósitos de Reserva
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Reduce no-shows cobrando un depósito al apartar la cita
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.require_deposit || false}
                onChange={(e) => setSettings({ ...settings, require_deposit: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                {settings.require_deposit ? 'Activado' : 'Desactivado'}
              </span>
            </label>
          </div>

          {settings.require_deposit && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              {/* Deposit Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de depósito
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-all border-2 border-transparent data-[checked=true]:border-blue-500">
                    <input
                      type="radio"
                      name="deposit_type"
                      checked={settings.deposit_type === 'fixed'}
                      onChange={() => setSettings({ ...settings, deposit_type: 'fixed' })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                        Monto fijo
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Ej: $200 MXN siempre
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-all border-2 border-transparent data-[checked=true]:border-blue-500">
                    <input
                      type="radio"
                      name="deposit_type"
                      checked={settings.deposit_type === 'percentage'}
                      onChange={() => setSettings({ ...settings, deposit_type: 'percentage' })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                        Porcentaje
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Ej: 20% del precio
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Amount Configuration */}
              {settings.deposit_type === 'fixed' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Monto del depósito (MXN)
                  </label>
                  <input
                    type="number"
                    value={settings.deposit_amount || 100}
                    onChange={(e) => setSettings({ ...settings, deposit_amount: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="10"
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Porcentaje del precio (%)
                    </label>
                    <input
                      type="number"
                      value={settings.deposit_percentage || 20}
                      onChange={(e) => setSettings({ ...settings, deposit_percentage: parseInt(e.target.value) || 0 })}
                      min="0"
                      max="100"
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Mínimo (MXN)
                      </label>
                      <input
                        type="number"
                        value={settings.deposit_min_amount || 50}
                        onChange={(e) => setSettings({ ...settings, deposit_min_amount: parseFloat(e.target.value) || 0 })}
                        min="0"
                        step="10"
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Máximo (MXN)
                      </label>
                      <input
                        type="number"
                        value={settings.deposit_max_amount || 1000}
                        onChange={(e) => setSettings({ ...settings, deposit_max_amount: parseFloat(e.target.value) || 0 })}
                        min="0"
                        step="10"
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Refund Policy */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Política de reembolso
                </label>
                <select
                  value={settings.refund_policy || '24_hours'}
                  onChange={(e) => setSettings({ ...settings, refund_policy: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                >
                  <option value="no_refund">Sin reembolso</option>
                  <option value="24_hours">Reembolso si cancela con más de 24 horas</option>
                  <option value="48_hours">Reembolso si cancela con más de 48 horas</option>
                  <option value="72_hours">Reembolso si cancela con más de 72 horas</option>
                  <option value="anytime">Reembolso completo siempre</option>
                </select>
              </div>

              {/* Custom Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mensaje personalizado
                </label>
                <textarea
                  value={settings.deposit_message || ''}
                  onChange={(e) => setSettings({ ...settings, deposit_message: e.target.value })}
                  placeholder="Se requiere un depósito para confirmar tu cita..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white resize-none"
                />
              </div>

              {/* Services requiring deposit */}
              {settings.services && settings.services.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Servicios que requieren depósito (opcional)
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Deja vacío para aplicar a todos los servicios
                  </p>
                  <div className="space-y-2">
                    {settings.services.map((service) => (
                      <label
                        key={service.id}
                        className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={(settings.services_requiring_deposit || []).includes(service.id)}
                          onChange={(e) => {
                            const current = settings.services_requiring_deposit || [];
                            const updated = e.target.checked
                              ? [...current, service.id]
                              : current.filter((id) => id !== service.id);
                            setSettings({ ...settings, services_requiring_deposit: updated });
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {service.name} {service.price > 0 && `- $${service.price} MXN`}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">💡 Beneficios de los depósitos</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Reduce no-shows de 15% a 3%</li>
                      <li>Pacientes más comprometidos con su cita</li>
                      <li>El depósito se aplica al costo total de la consulta</li>
                      <li>Pagos automáticos con Stripe (tarjetas de crédito/débito)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  )
}
