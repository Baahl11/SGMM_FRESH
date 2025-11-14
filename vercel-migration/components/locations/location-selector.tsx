'use client'

import { useState, useEffect } from 'react'
import { MapPin, ChevronDown } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface Location {
  id: string
  nombre: string
  codigo: string | null
  ciudad: string | null
  timezone: string
  es_principal: boolean
  activo: boolean
}

interface LocationSelectorProps {
  selectedLocationId?: string
  onLocationChange: (locationId: string | 'all') => void
  allowAll?: boolean // Para reportes cross-location (solo Plan Pro+)
  className?: string
  disabled?: boolean
}

export function LocationSelector({
  selectedLocationId,
  onLocationChange,
  allowAll = false,
  className = '',
  disabled = false
}: LocationSelectorProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [userPlan, setUserPlan] = useState<'basico' | 'pro' | 'enterprise'>('basico')

  useEffect(() => {
    fetchLocations()
    fetchUserPlan()
  }, [])

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations')
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
        
        // Auto-select ubicación principal si no hay selección
        if (!selectedLocationId && data.length > 0) {
          const principal = data.find((l: Location) => l.es_principal)
          onLocationChange(principal?.id || data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserPlan = async () => {
    try {
      const response = await fetch('/api/user/subscription')
      if (response.ok) {
        const data = await response.json()
        setUserPlan(data.plan_tier || 'basico')
      }
    } catch (error) {
      console.error('Error fetching user plan:', error)
    }
  }

  if (loading) {
    return <div className="h-10 w-48 animate-pulse bg-gray-200 rounded-md" />
  }

  // Si es Plan Básico y solo tiene 1 ubicación, no mostrar selector
  if (userPlan === 'basico' && locations.length <= 1 && !allowAll) {
    const location = locations[0]
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-md border border-blue-200">
        <MapPin className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-900">
          {location?.nombre || 'Mi Consultorio'}
        </span>
        {location?.es_principal && (
          <Badge variant="secondary" className="text-xs">Principal</Badge>
        )}
      </div>
    )
  }

  // Si no hay ubicaciones, mostrar mensaje
  if (locations.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-md border border-amber-200">
        <MapPin className="h-4 w-4 text-amber-600" />
        <span className="text-sm text-amber-900">
          No hay ubicaciones configuradas
        </span>
      </div>
    )
  }

  return (
    <Select 
      value={selectedLocationId || 'all'} 
      onValueChange={onLocationChange}
      disabled={disabled}
    >
      <SelectTrigger className={`w-64 ${className}`}>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <SelectValue placeholder="Selecciona ubicación" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {allowAll && userPlan !== 'basico' && (
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <span className="font-medium">📊 Todas las ubicaciones</span>
            </div>
          </SelectItem>
        )}
        {locations.map((location) => (
          <SelectItem key={location.id} value={location.id}>
            <div className="flex items-center gap-2">
              <span>{location.nombre}</span>
              {location.ciudad && (
                <span className="text-xs text-gray-500">({location.ciudad})</span>
              )}
              {location.es_principal && (
                <Badge variant="secondary" className="text-xs ml-2">Principal</Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
