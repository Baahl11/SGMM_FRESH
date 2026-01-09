'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Globe,
  Save,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  Layers,
  CalendarClock,
  Clock3,
  ShieldCheck
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import ServicesManager from '@/components/settings/booking/ServicesManager'
import ScheduleManager from '@/components/settings/booking/ScheduleManager'
import { GlassPanel } from '@/components/ui/glass-panel'

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

interface UserProfile {
  booking_slug?: string | null
  [key: string]: unknown
}

export default function BookingSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<BookingSettings | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [copied, setCopied] = useState(false)
  const [slugDraft, setSlugDraft] = useState('')
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const sanitizeSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9-]/g, '')

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
      const data: UserProfile = await response.json()
      setUserProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  async function persistSlug(slug: string) {
    if (!slug) {
      toast.error('Ingresa un slug válido')
      return
    }

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

      const updated: UserProfile = await response.json()
      setUserProfile(updated)
      setSlugDraft('')
      toast.success('URL configurada exitosamente')
    } catch (error) {
      console.error('Error al configurar URL:', error)
      toast.error('Error al configurar URL')
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

    const url = `${baseUrl}/book/${userProfile.booking_slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('URL copiada al portapapeles')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <GlassPanel className="flex items-center gap-3 border-white/10 bg-white/5 px-6 py-4 text-white">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-transparent" />
          Cargando configuración de reservas...
        </GlassPanel>
      </div>
    )
  }

  if (!settings) return null

  const bookingUrl = userProfile?.booking_slug
    ? `${baseUrl}/book/${userProfile.booking_slug}`
    : null

  const totalServices = settings.services.length
  const activeDays = settings.available_days.length
  const coveragePercent = activeDays ? Math.round((activeDays / 7) * 100) : 0
  const slotDuration = settings.slot_duration_minutes
  const bufferTime = settings.buffer_time_minutes
  const depositEnabled = settings.require_deposit
  const bookingWindowLabel = `${settings.min_advance_hours || 0}h / ${settings.max_advance_days || 0}d`
  const depositScope = settings.services_requiring_deposit?.length || 0
  const heroStats = [
    {
      label: 'Servicios publicados',
      value: totalServices,
      helper: 'listos para agenda',
      icon: Layers,
      accent: 'text-emerald-200'
    },
    {
      label: 'Días con agenda',
      value: activeDays,
      helper: `${coveragePercent}% cobertura semanal`,
      icon: CalendarClock,
      accent: 'text-sky-200'
    },
    {
      label: 'Duración de slot',
      value: slotDuration ? `${slotDuration} min` : '--',
      helper: bufferTime ? `Buffer ${bufferTime} min` : 'Sin buffer',
      icon: Clock3,
      accent: 'text-amber-200'
    },
    {
      label: 'Depósitos activos',
      value: depositEnabled ? (depositScope || totalServices || 1) : 0,
      helper: depositEnabled ? 'Servicios protegidos' : 'Desactivado',
      icon: ShieldCheck,
      accent: depositEnabled ? 'text-emerald-200' : 'text-white'
    }
  ]

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
            <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-emerald-400/30 blur-[140px]" />
            <div className="absolute -bottom-24 left-0 h-64 w-64 rounded-full bg-sky-500/20 blur-[140px]" />
          </div>
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/70">
                <Globe className="h-4 w-4" />
                Reservas
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Agenda pública</h1>
                <p className="mt-2 max-w-2xl text-sm text-white/70">
                  Controla servicios, horarios y confirmaciones desde un solo panel para que tu landing de reservas luzca impecable.
                </p>
              </div>
              <div className="grid gap-3 text-white/80 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/50">Ventana de anticipación</p>
                  <p className="text-2xl font-semibold text-emerald-200">{bookingWindowLabel}</p>
                  <p className="text-xs text-white/60">mínimo horas / máximo días</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/50">Confirmación</p>
                  <p className="text-2xl font-semibold">{settings.auto_confirm ? 'Automática' : 'Manual'}</p>
                  <p className="text-xs text-white/60">{settings.send_confirmation_whatsapp ? 'WhatsApp activo' : 'WhatsApp pendiente'}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={saving}
                className="aura-cta aura-cta--primary justify-center px-6 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </motion.button>
              {bookingUrl && (
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyUrl}
                    className="aura-cta aura-cta--ghost px-6"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copiado' : 'Copiar enlace'}
                  </button>
                  <a
                    href={bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aura-cta aura-cta--ghost px-6"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ver página
                  </a>
                </div>
              )}
            </div>
          </div>
        </GlassPanel>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {heroStats.map(({ label, value, helper, icon: Icon, accent }) => (
            <GlassPanel key={label} className="space-y-2 border-white/10 bg-white/5 p-5 text-white">
              <div className="flex items-center justify-between text-white/70">
                <p className="text-xs uppercase tracking-[0.35em]">{label}</p>
                <Icon className="h-4 w-4 text-white/50" />
              </div>
              <p className={`text-3xl font-semibold ${accent}`}>{value}</p>
              <p className="text-sm text-white/60">{helper}</p>
            </GlassPanel>
          ))}
        </div>

        {bookingUrl ? (
          <GlassPanel className="relative overflow-hidden border-white/10 bg-gradient-to-br from-emerald-500/15 via-sky-500/10 to-white/0 p-6 text-white">
            <div className="pointer-events-none absolute inset-0 opacity-40">
              <div className="absolute -top-10 left-10 h-32 w-32 rounded-full bg-emerald-400/40 blur-[120px]" />
            </div>
            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">Página pública</p>
                <h3 className="text-2xl font-semibold">Comparte tu enlace de reservas</h3>
                <div className="rounded-3xl border border-white/15 bg-white/5 p-4 font-mono text-sm text-white/90 break-all">
                  {bookingUrl}
                </div>
                <p className="text-xs text-white/60">Se sincroniza con tus cambios al guardar.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                <button
                  onClick={handleCopyUrl}
                  className="aura-cta aura-cta--ghost"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copiado' : 'Copiar link'}
                </button>
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aura-cta aura-cta--ghost"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir página
                </a>
              </div>
            </div>
          </GlassPanel>
        ) : (
          <GlassPanel className="space-y-4 border border-dashed border-white/20 bg-white/5 p-6 text-white">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
                <AlertCircle className="h-5 w-5 text-amber-200" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Activa tu URL pública</h3>
                <p className="text-sm text-white/70">Define un slug único para compartir {baseUrl}/book/tu-slug</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={slugDraft}
                onChange={(e) => setSlugDraft(sanitizeSlug(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    persistSlug(slugDraft)
                  }
                }}
                placeholder="mi-consultorio"
                className="h-12 flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 text-white placeholder:text-white/40 focus:border-emerald-300/60 focus:outline-none focus:ring-emerald-300/20"
              />
              <button
                onClick={() => persistSlug(slugDraft)}
                disabled={!slugDraft}
                className="aura-cta aura-cta--primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                Guardar URL
              </button>
            </div>
            <p className="text-xs text-white/60">Solo minúsculas, números y guiones. Ej: dr-lopez, consultorio-norte</p>
          </GlassPanel>
        )}

        <GlassPanel className="space-y-6 border-white/10 bg-white/5 p-6 text-white">
          <div>
            <h3 className="text-xl font-semibold">Personalización de la página</h3>
            <p className="text-sm text-white/70">Alinea el copy de tu landing con tu tono de marca.</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm uppercase tracking-[0.35em] text-white/60">Título principal</label>
              <input
                type="text"
                value={settings.page_title}
                onChange={(e) => setSettings({ ...settings, page_title: e.target.value })}
                placeholder="Ej: Agenda tu cita"
                className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-emerald-300/60 focus:outline-none focus:ring-emerald-300/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm uppercase tracking-[0.35em] text-white/60">Mensaje de bienvenida</label>
              <textarea
                value={settings.welcome_message || ''}
                onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value || null })}
                placeholder="Mensaje personalizado para tus pacientes..."
                rows={3}
                className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-emerald-300/60 focus:outline-none focus:ring-emerald-300/20"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-medium text-white/80">
                <input
                  type="checkbox"
                  checked={settings.show_prices}
                  onChange={(e) => setSettings({ ...settings, show_prices: e.target.checked })}
                  className="h-5 w-5 accent-emerald-400"
                />
                <span className="text-sm text-white">Mostrar precios</span>
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-medium text-white/80">
                <input
                  type="checkbox"
                  checked={settings.require_phone}
                  onChange={(e) => setSettings({ ...settings, require_phone: e.target.checked })}
                  className="h-5 w-5 accent-emerald-400"
                />
                <span className="text-sm text-white">Requerir teléfono</span>
              </label>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="space-y-4 border-white/10 bg-white/5 p-6 text-white">
          <div>
            <h3 className="text-xl font-semibold">Catálogo de servicios</h3>
            <p className="text-sm text-white/70">Todo lo que tus pacientes pueden reservar.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <ServicesManager
              services={settings.services}
              onChange={(services) => setSettings({ ...settings, services })}
            />
          </div>
        </GlassPanel>

        <GlassPanel className="space-y-4 border-white/10 bg-white/5 p-6 text-white">
          <div>
            <h3 className="text-xl font-semibold">Horario público</h3>
            <p className="text-sm text-white/70">Define días, rangos y buffers que estarán disponibles.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
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
        </GlassPanel>

        <GlassPanel className="space-y-4 border-white/10 bg-white/5 p-6 text-white">
          <div>
            <h3 className="text-xl font-semibold">Límites de reserva</h3>
            <p className="text-sm text-white/70">Controla qué tan pronto y qué tan lejos se puede agendar.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Anticipación mínima (horas)</p>
              <input
                type="number"
                value={settings.min_advance_hours}
                onChange={(e) => setSettings({ ...settings, min_advance_hours: parseInt(e.target.value) || 0 })}
                min="0"
                className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-emerald-300/60 focus:outline-none focus:ring-emerald-300/20"
              />
              <p className="mt-1 text-xs text-white/60">Evita citas con poca anticipación.</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Anticipación máxima (días)</p>
              <input
                type="number"
                value={settings.max_advance_days}
                onChange={(e) => setSettings({ ...settings, max_advance_days: parseInt(e.target.value) || 0 })}
                min="1"
                className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-emerald-300/60 focus:outline-none focus:ring-emerald-300/20"
              />
              <p className="mt-1 text-xs text-white/60">Hasta cuántos días adelante se publica la agenda.</p>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="space-y-4 border-white/10 bg-white/5 p-6 text-white">
          <div>
            <h3 className="text-xl font-semibold">Confirmaciones</h3>
            <p className="text-sm text-white/70">Activa los canales que recibirán tus pacientes.</p>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <input
                type="checkbox"
                checked={settings.auto_confirm}
                onChange={(e) => setSettings({ ...settings, auto_confirm: e.target.checked })}
                className="h-5 w-5 accent-emerald-400"
              />
              <div>
                <p className="text-sm font-semibold">Auto-confirmar reservas</p>
                <p className="text-xs text-white/60">Las citas se aprueban sin revisión manual.</p>
              </div>
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <input
                type="checkbox"
                checked={settings.send_confirmation_email}
                onChange={(e) => setSettings({ ...settings, send_confirmation_email: e.target.checked })}
                className="h-5 w-5 accent-emerald-400"
              />
              <span className="text-sm">Enviar confirmación por Email</span>
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <input
                type="checkbox"
                checked={settings.send_confirmation_whatsapp}
                onChange={(e) => setSettings({ ...settings, send_confirmation_whatsapp: e.target.checked })}
                className="h-5 w-5 accent-emerald-400"
              />
              <span className="text-sm">Enviar confirmación por WhatsApp</span>
            </label>
          </div>
        </GlassPanel>

        <GlassPanel className="space-y-4 border-white/10 bg-white/5 p-6 text-white">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Depósitos de reserva</h3>
              <p className="text-sm text-white/70">Protege tu agenda cobrando un anticipo.</p>
            </div>
            <label className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm">
              <span>{settings.require_deposit ? 'Depósitos activos' : 'Depósitos desactivados'}</span>
              <input
                type="checkbox"
                checked={settings.require_deposit || false}
                onChange={(e) => setSettings({ ...settings, require_deposit: e.target.checked })}
                className="h-5 w-10 cursor-pointer accent-emerald-400"
              />
            </label>
          </div>

          {settings.require_deposit && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-5"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">Tipo de depósito</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label className={`flex items-center gap-3 rounded-2xl border p-3 ${settings.deposit_type === 'fixed' ? 'border-emerald-300/60 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}>
                    <input
                      type="radio"
                      name="deposit_type"
                      checked={settings.deposit_type === 'fixed'}
                      onChange={() => setSettings({ ...settings, deposit_type: 'fixed' })}
                      className="h-4 w-4 accent-emerald-400"
                    />
                    <div>
                      <p className="text-sm font-semibold">Monto fijo</p>
                      <p className="text-xs text-white/60">Ej: $200 MXN siempre</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 rounded-2xl border p-3 ${settings.deposit_type === 'percentage' ? 'border-emerald-300/60 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}>
                    <input
                      type="radio"
                      name="deposit_type"
                      checked={settings.deposit_type === 'percentage'}
                      onChange={() => setSettings({ ...settings, deposit_type: 'percentage' })}
                      className="h-4 w-4 accent-emerald-400"
                    />
                    <div>
                      <p className="text-sm font-semibold">Porcentaje</p>
                      <p className="text-xs text-white/60">Ej: 20% del precio</p>
                    </div>
                  </label>
                </div>
              </div>

              {settings.deposit_type === 'fixed' ? (
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/60">Monto del depósito (MXN)</p>
                  <input
                    type="number"
                    value={settings.deposit_amount || 100}
                    onChange={(e) => setSettings({ ...settings, deposit_amount: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="10"
                    className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white focus:border-emerald-300/60 focus:outline-none focus:ring-emerald-300/20"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/60">Porcentaje del precio (%)</p>
                    <input
                      type="number"
                      value={settings.deposit_percentage || 20}
                      onChange={(e) => setSettings({ ...settings, deposit_percentage: parseInt(e.target.value) || 0 })}
                      min="0"
                      max="100"
                      className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white focus:border-emerald-300/60 focus:outline-none focus:ring-emerald-300/20"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-white/50">Mínimo (MXN)</p>
                      <input
                        type="number"
                        value={settings.deposit_min_amount || 50}
                        onChange={(e) => setSettings({ ...settings, deposit_min_amount: parseFloat(e.target.value) || 0 })}
                        min="0"
                        step="10"
                        className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white focus:border-emerald-300/60 focus:outline-none focus:ring-emerald-300/20"
                      />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-white/50">Máximo (MXN)</p>
                      <input
                        type="number"
                        value={settings.deposit_max_amount || 1000}
                        onChange={(e) => setSettings({ ...settings, deposit_max_amount: parseFloat(e.target.value) || 0 })}
                        min="0"
                        step="10"
                        className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white focus:border-emerald-300/60 focus:outline-none focus:ring-emerald-300/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">Política de reembolso</p>
                <select
                  value={settings.refund_policy || '24_hours'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      refund_policy: e.target.value as BookingSettings['refund_policy']
                    })
                  }
                  className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white focus:border-emerald-300/60 focus:outline-none focus:ring-emerald-300/20"
                >
                  <option value="no_refund">Sin reembolso</option>
                  <option value="24_hours">Reembolso +24 horas</option>
                  <option value="48_hours">Reembolso +48 horas</option>
                  <option value="72_hours">Reembolso +72 horas</option>
                  <option value="anytime">Reembolso completo</option>
                </select>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">Mensaje personalizado</p>
                <textarea
                  value={settings.deposit_message || ''}
                  onChange={(e) => setSettings({ ...settings, deposit_message: e.target.value })}
                  rows={3}
                  placeholder="Se requiere un depósito para confirmar tu cita..."
                  className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-emerald-300/60 focus:outline-none focus:ring-emerald-300/20"
                />
              </div>

              {settings.services && settings.services.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/60">Servicios con depósito</p>
                  <p className="text-xs text-white/60">Deja vacío para aplicar a todos.</p>
                  <div className="space-y-2">
                    {settings.services.map((service) => (
                      <label
                        key={service.id}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3 text-sm"
                      >
                        <span>{service.name}</span>
                        <input
                          type="checkbox"
                          checked={(settings.services_requiring_deposit || []).includes(service.id)}
                          onChange={(e) => {
                            const current = settings.services_requiring_deposit || []
                            const updated = e.target.checked
                              ? [...current, service.id]
                              : current.filter((id) => id !== service.id)
                            setSettings({ ...settings, services_requiring_deposit: updated })
                          }}
                          className="h-4 w-4 accent-emerald-400"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-emerald-200" />
                  <div>
                    <p className="font-semibold text-white">Beneficios</p>
                    <ul className="mt-2 space-y-1 text-xs text-white/70">
                      <li>Reduce no-shows de 15% a 3%.</li>
                      <li>Aplica el depósito al total de la cita.</li>
                      <li>Cobra automáticamente con Stripe.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </GlassPanel>
      </div>
    </>
  )
}
