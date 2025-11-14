'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { MapPin, Building2 } from 'lucide-react'

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
}

interface LocationModalProps {
  open: boolean
  onClose: () => void
  location?: Location | null
  onSuccess: () => void
}

export function LocationModal({ open, onClose, location, onSuccess }: LocationModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    direccion: '',
    ciudad: '',
    estado: '',
    pais: 'México',
    codigo_postal: '',
    telefono: '',
    email: '',
    timezone: 'America/Mexico_City',
    activo: true,
    es_principal: false
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (location) {
      setFormData({
        nombre: location.nombre,
        codigo: location.codigo || '',
        direccion: location.direccion || '',
        ciudad: location.ciudad || '',
        estado: location.estado || '',
        pais: location.pais || 'México',
        codigo_postal: location.codigo_postal || '',
        telefono: location.telefono || '',
        email: location.email || '',
        timezone: location.timezone,
        activo: location.activo,
        es_principal: location.es_principal
      })
    } else {
      // Reset form for new location
      setFormData({
        nombre: '',
        codigo: '',
        direccion: '',
        ciudad: '',
        estado: '',
        pais: 'México',
        codigo_postal: '',
        telefono: '',
        email: '',
        timezone: 'America/Mexico_City',
        activo: true,
        es_principal: false
      })
    }
  }, [location, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    setLoading(true)
    try {
      const url = location ? `/api/locations/${location.id}` : '/api/locations'
      const method = location ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(location ? 'Ubicación actualizada' : 'Ubicación creada exitosamente')
        onSuccess()
      } else {
        if (data.code === 'LOCATION_LIMIT_REACHED') {
          toast.error(`Has alcanzado el límite de ${data.limit} ubicaciones para tu plan`)
        } else {
          toast.error(data.error || 'Error al guardar ubicación')
        }
      }
    } catch (error) {
      console.error('Error saving location:', error)
      toast.error('Error al guardar ubicación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            {location ? 'Editar Ubicación' : 'Nueva Ubicación'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-gray-700">Información Básica</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="nombre">
                  Nombre de la Ubicación <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Consultorio Centro"
                  required
                />
              </div>

              <div>
                <Label htmlFor="codigo">Código (opcional)</Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="Ej: CEN-01"
                />
              </div>

              <div>
                <Label htmlFor="timezone">Zona Horaria</Label>
                <select
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="America/Mexico_City">México (Centro)</option>
                  <option value="America/Tijuana">Tijuana (Pacífico)</option>
                  <option value="America/Hermosillo">Hermosillo (Pacífico)</option>
                  <option value="America/Chihuahua">Chihuahua (Montaña)</option>
                  <option value="America/Cancun">Cancún (Sureste)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-gray-700 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Dirección
            </h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="direccion">Calle y Número</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Av. Principal #123"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ciudad">Ciudad</Label>
                  <Input
                    id="ciudad"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    placeholder="Guadalajara"
                  />
                </div>

                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    placeholder="Jalisco"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="codigo_postal">Código Postal</Label>
                  <Input
                    id="codigo_postal"
                    value={formData.codigo_postal}
                    onChange={(e) => setFormData({ ...formData, codigo_postal: e.target.value })}
                    placeholder="44100"
                  />
                </div>

                <div>
                  <Label htmlFor="pais">País</Label>
                  <Input
                    id="pais"
                    value={formData.pais}
                    onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-gray-700">Información de Contacto</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="33 1234 5678"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="consultorio@ejemplo.com"
                />
              </div>
            </div>
          </div>

          {/* Opciones */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="activo"
                checked={formData.activo}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, activo: checked as boolean })
                }
              />
              <Label htmlFor="activo" className="font-normal cursor-pointer">
                Ubicación activa
              </Label>
            </div>

            {!location?.es_principal && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="es_principal"
                  checked={formData.es_principal}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, es_principal: checked as boolean })
                  }
                />
                <Label htmlFor="es_principal" className="font-normal cursor-pointer">
                  Establecer como ubicación principal
                </Label>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : location ? 'Actualizar' : 'Crear Ubicación'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
