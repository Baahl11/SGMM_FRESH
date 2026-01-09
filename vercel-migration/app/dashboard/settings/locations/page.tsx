'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { GlassPanel } from '@/components/ui/glass-panel'
import { MapPin, Plus, Edit, Trash2, Building2, Clock, Star, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { LocationModal } from '@/components/locations/location-modal'
import { toast } from 'sonner'

interface Location {
  id: string
  nombre: string
  codigo: string | null
  direccion: string | null
  ciudad: string | null
  estado: string | null
  pais: string | null
  codigo_postal: string | null
  telefono: string | null
  email: string | null
  timezone: string
  activo: boolean
  es_principal: boolean
  created_at: string
}

interface Subscription {
  plan_tier: 'basico' | 'pro' | 'enterprise'
  max_locations: number
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [locationsRes, subRes] = await Promise.all([
        fetch('/api/locations'),
        fetch('/api/user/subscription')
      ])

      if (locationsRes.ok) {
        const locationsData = await locationsRes.json()
        setLocations(locationsData)
      }

      if (subRes.ok) {
        const subData = await subRes.json()
        setSubscription(subData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (locationId: string) => {
    const location = locations.find(l => l.id === locationId)
    
    if (location?.es_principal) {
      toast.error('No puedes eliminar la ubicación principal')
      return
    }

    if (!confirm('¿Estás seguro de que deseas eliminar esta ubicación?')) {
      return
    }

    setDeleting(locationId)
    try {
      const response = await fetch(`/api/locations/${locationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Ubicación eliminada exitosamente')
        fetchData()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Error al eliminar ubicación')
      }
    } catch (error) {
      console.error('Error deleting location:', error)
      toast.error('Error al eliminar ubicación')
    } finally {
      setDeleting(null)
    }
  }

  const handleModalSuccess = () => {
    fetchData()
    setModalOpen(false)
    setEditingLocation(null)
  }

  const locationCount = locations.filter(l => l.activo).length
  const maxLocations = subscription?.max_locations || 1
  const canAddMore = locationCount < maxLocations
  const planName = subscription?.plan_tier === 'basico' ? 'Básico' : subscription?.plan_tier === 'pro' ? 'Pro' : 'Enterprise'

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <GlassPanel className="flex items-center gap-3 border-white/10 bg-white/5 px-6 py-4 text-white">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-transparent" />
          Cargando ubicaciones...
        </GlassPanel>
      </div>
    )
  }

  const limitAlert = locationCount >= maxLocations
  const upgradeCopy = subscription?.plan_tier === 'basico'
    ? 'Actualiza a Pro para habilitar hasta 5 ubicaciones activas.'
    : 'Actualiza a Enterprise para ubicaciones ilimitadas y horarios avanzados.'

  return (
    <div className="space-y-6">
      <GlassPanel className="relative overflow-hidden border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/0 p-6 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-sky-400/25 blur-[160px]" />
          <div className="absolute -bottom-24 left-0 h-64 w-64 rounded-full bg-emerald-400/20 blur-[150px]" />
        </div>
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/70">
              <Building2 className="h-4 w-4" />
              Infraestructura
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Ubicaciones</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/70">
                Centraliza las sedes de tu red médica, define horarios locales y mantiene la operación sincronizada.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                setEditingLocation(null)
                setModalOpen(true)
              }}
              disabled={!canAddMore}
              className="aura-cta aura-cta--primary disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              Nueva ubicación
            </Button>
            <Button asChild className="aura-cta aura-cta--ghost">
              <Link href="/dashboard/settings/locations/policies">
                <MapPin className="h-4 w-4" />
                Políticas de sedes
              </Link>
            </Button>
          </div>
        </div>
      </GlassPanel>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <GlassPanel className="border-white/10 bg-white/5 p-5 text-white">
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">Plan</p>
          <p className="text-3xl font-semibold">{planName}</p>
          <p className="text-sm text-white/70">Suscripción activa</p>
        </GlassPanel>
        <GlassPanel className="border-white/10 bg-white/5 p-5 text-white">
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">Ubicaciones activas</p>
          <p className="text-3xl font-semibold text-emerald-200">{locationCount}</p>
          <p className="text-sm text-white/70">en operación</p>
        </GlassPanel>
        <GlassPanel className="border-white/10 bg-white/5 p-5 text-white">
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">Capacidad</p>
          <p className="text-3xl font-semibold text-sky-200">{locationCount} / {maxLocations}</p>
          <p className="text-sm text-white/70">Usadas</p>
        </GlassPanel>
        <GlassPanel className={`border ${limitAlert ? 'border-amber-400/60 bg-amber-500/10' : 'border-white/10 bg-white/5'} p-5 text-white`}>
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-5 w-5" />
            {limitAlert ? 'Límite alcanzado' : 'Espacio disponible'}
          </div>
          <p className="mt-2 text-sm text-white/70">
            {limitAlert ? upgradeCopy : 'Aún puedes registrar más sedes en este plan.'}
          </p>
        </GlassPanel>
      </div>

      {locations.length === 0 ? (
        <GlassPanel className="flex flex-col items-center gap-4 border-white/10 bg-white/5 px-6 py-16 text-center text-white/80">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-dashed border-white/20">
            <Building2 className="h-8 w-8" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">Sin ubicaciones configuradas</p>
            <p className="text-sm text-white/60">Define la primera sede para activar agenda y comunicación.</p>
          </div>
          <Button onClick={() => setModalOpen(true)} className="aura-cta aura-cta--primary">
            <Plus className="h-4 w-4" />
            Crear primera ubicación
          </Button>
        </GlassPanel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <GlassPanel
              key={location.id}
              className={`border ${location.activo ? 'border-white/10' : 'border-white/5 opacity-60'} bg-white/5 p-6 text-white transition hover:border-white/30`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-2xl border border-white/20 bg-white/10 p-2">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{location.nombre}</h3>
                    {location.codigo && (
                      <p className="text-xs text-white/60">Código: {location.codigo}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {location.es_principal && (
                    <Badge className="rounded-full border border-white/30 bg-white/10 text-xs text-white">
                      <Star className="h-3 w-3" /> Principal
                    </Badge>
                  )}
                  {!location.activo && (
                    <Badge className="rounded-full border border-amber-400/40 bg-amber-500/10 text-xs text-amber-100">
                      Inactivo
                    </Badge>
                  )}
                </div>
              </div>

              {(location.direccion || location.ciudad || location.estado) && (
                <div className="mt-4 space-y-1 text-sm text-white/70">
                  {location.direccion && <p>{location.direccion}</p>}
                  {(location.ciudad || location.estado) && (
                    <p className="font-medium text-white">
                      {location.ciudad}
                      {location.ciudad && location.estado && ', '}
                      {location.estado}
                    </p>
                  )}
                  {location.codigo_postal && (
                    <p className="text-xs text-white/60">C.P. {location.codigo_postal}</p>
                  )}
                </div>
              )}

              {(location.telefono || location.email) && (
                <div className="mt-4 border-t border-white/10 pt-3 text-sm text-white/70">
                  {location.telefono && <p>📞 {location.telefono}</p>}
                  {location.email && <p>✉️ {location.email}</p>}
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/50">
                <Clock className="h-4 w-4" />
                {location.timezone}
              </div>

              <div className="mt-5 flex gap-2 border-t border-white/10 pt-4">
                <Button
                  variant="ghost"
                  className="flex-1 rounded-2xl border border-white/20 text-white hover:border-emerald-300/60"
                  onClick={() => {
                    setEditingLocation(location)
                    setModalOpen(true)
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                {!location.es_principal && (
                  <Button
                    variant="ghost"
                    className="rounded-2xl border border-rose-400/40 text-rose-100 hover:bg-rose-500/10"
                    onClick={() => handleDelete(location.id)}
                    disabled={deleting === location.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </GlassPanel>
          ))}
        </div>
      )}

      <LocationModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingLocation(null)
        }}
        location={editingLocation}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}
