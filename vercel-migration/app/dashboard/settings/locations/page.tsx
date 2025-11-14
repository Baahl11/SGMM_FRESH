'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Plus, Edit, Trash2, Building2, Clock, Star, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando ubicaciones...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            Ubicaciones
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona las sedes de tu clínica
          </p>
        </div>
        
        <Button
          onClick={() => {
            setEditingLocation(null)
            setModalOpen(true)
          }}
          disabled={!canAddMore}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nueva Ubicación
        </Button>
      </div>

      {/* Plan Limit Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Ubicaciones utilizadas en Plan {planName}
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {locationCount} / {maxLocations}
              </p>
            </div>
            {subscription?.plan_tier === 'basico' && locationCount >= maxLocations && (
              <Alert className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Has alcanzado el límite. Actualiza a Plan Pro para hasta 5 ubicaciones.
                </AlertDescription>
              </Alert>
            )}
            {subscription?.plan_tier === 'pro' && locationCount >= maxLocations && (
              <Alert className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Has alcanzado el límite de 5 ubicaciones. Actualiza a Enterprise para ubicaciones ilimitadas.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Locations Grid */}
      {locations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No hay ubicaciones configuradas</p>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primera ubicación
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location) => (
            <Card 
              key={location.id} 
              className={`hover:shadow-lg transition-shadow ${
                !location.activo ? 'opacity-60' : ''
              }`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 flex-1">
                    <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <CardTitle className="text-lg">{location.nombre}</CardTitle>
                  </div>
                  <div className="flex gap-1 ml-2">
                    {location.es_principal && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        Principal
                      </Badge>
                    )}
                    {!location.activo && (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </div>
                </div>
                {location.codigo && (
                  <p className="text-xs text-gray-500 mt-1">Código: {location.codigo}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Dirección */}
                {(location.direccion || location.ciudad || location.estado) && (
                  <div className="text-sm text-gray-600 space-y-1">
                    {location.direccion && <p>{location.direccion}</p>}
                    {(location.ciudad || location.estado) && (
                      <p className="font-medium">
                        {location.ciudad}
                        {location.ciudad && location.estado && ', '}
                        {location.estado}
                      </p>
                    )}
                    {location.codigo_postal && (
                      <p className="text-xs">C.P. {location.codigo_postal}</p>
                    )}
                  </div>
                )}
                
                {/* Contacto */}
                {(location.telefono || location.email) && (
                  <div className="text-sm text-gray-600 space-y-1 pt-2 border-t">
                    {location.telefono && <p>📞 {location.telefono}</p>}
                    {location.email && <p>✉️ {location.email}</p>}
                  </div>
                )}
                
                {/* Timezone */}
                <div className="flex items-center gap-2 text-sm text-gray-500 pt-2">
                  <Clock className="h-4 w-4" />
                  <span>{location.timezone}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingLocation(location)
                      setModalOpen(true)
                    }}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  {!location.es_principal && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(location.id)}
                      disabled={deleting === location.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
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
