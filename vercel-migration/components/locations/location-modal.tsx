'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
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

  const inputClass = 'mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-emerald-200 focus:ring-emerald-200/30 focus:outline-none transition'
  const labelClass = 'text-[11px] uppercase tracking-[0.3em] text-white/55'
  const sectionClass = 'rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6'
  const sectionTitleClass = 'text-xs font-semibold uppercase tracking-[0.35em] text-white/70'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[32px] border border-white/15 bg-slate-950/95 p-0 text-white shadow-[0_25px_120px_rgba(15,23,42,0.65)]">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -top-20 left-6 h-72 w-72 rounded-full bg-emerald-500/30 blur-[180px]" />
          <div className="absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-cyan-400/25 blur-[160px]" />
        </div>

        <div className="relative border-b border-white/10 px-6 py-6 sm:px-10 sm:py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">{location ? 'Edición' : 'Nuevo registro'}</p>
                <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">
                  {location ? 'Editar ubicación' : 'Nueva ubicación'}
                </h2>
                <p className="text-sm text-white/70">Define la dirección, horarios base y estatus operativo.</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative space-y-6 px-6 py-6 sm:px-10 sm:py-10">
          <div className={sectionClass}>
            <div className="flex items-center gap-3">
              <span className={sectionTitleClass}>Información básica</span>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="nombre" className={labelClass}>
                  Nombre de la ubicación
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Consultorio Centro"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <Label htmlFor="codigo" className={labelClass}>
                  Código interno (opcional)
                </Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="CEN-01"
                  className={inputClass}
                />
              </div>

              <div>
                <Label htmlFor="timezone" className={labelClass}>
                  Zona horaria
                </Label>
                <select
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white focus:border-emerald-200 focus:outline-none"
                >
                  <option value="America/Mexico_City" className="bg-slate-900">México (Centro)</option>
                  <option value="America/Tijuana" className="bg-slate-900">Tijuana (Pacífico)</option>
                  <option value="America/Hermosillo" className="bg-slate-900">Hermosillo (Pacífico)</option>
                  <option value="America/Chihuahua" className="bg-slate-900">Chihuahua (Montaña)</option>
                  <option value="America/Cancun" className="bg-slate-900">Cancún (Sureste)</option>
                </select>
              </div>
            </div>
          </div>

          <div className={sectionClass}>
            <div className="flex items-center gap-2 text-white">
              <MapPin className="h-4 w-4 text-emerald-300" />
              <span className={sectionTitleClass}>Dirección</span>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <Label htmlFor="direccion" className={labelClass}>
                  Calle y número
                </Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Av. Principal #123"
                  className={inputClass}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="ciudad" className={labelClass}>
                    Ciudad
                  </Label>
                  <Input
                    id="ciudad"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    placeholder="Guadalajara"
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label htmlFor="estado" className={labelClass}>
                    Estado
                  </Label>
                  <Input
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    placeholder="Jalisco"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="codigo_postal" className={labelClass}>
                    Código postal
                  </Label>
                  <Input
                    id="codigo_postal"
                    value={formData.codigo_postal}
                    onChange={(e) => setFormData({ ...formData, codigo_postal: e.target.value })}
                    placeholder="44100"
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label htmlFor="pais" className={labelClass}>
                    País
                  </Label>
                  <Input
                    id="pais"
                    value={formData.pais}
                    onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={sectionClass}>
            <span className={sectionTitleClass}>Información de contacto</span>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="telefono" className={labelClass}>
                  Teléfono
                </Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="33 1234 5678"
                  className={inputClass}
                />
              </div>
              <div>
                <Label htmlFor="email" className={labelClass}>
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="consultorio@ejemplo.com"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className={`${sectionClass} space-y-4`}>
            <span className={sectionTitleClass}>Operación</span>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <Checkbox
                id="activo"
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked as boolean })}
              />
              <div>
                <Label htmlFor="activo" className="cursor-pointer text-sm font-medium text-white">
                  Ubicación activa
                </Label>
                <p className="text-xs text-white/60">Aparece en agendas, reportes y asignaciones.</p>
              </div>
            </div>

            {!location?.es_principal && (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <Checkbox
                  id="es_principal"
                  checked={formData.es_principal}
                  onCheckedChange={(checked) => setFormData({ ...formData, es_principal: checked as boolean })}
                />
                <div>
                  <Label htmlFor="es_principal" className="cursor-pointer text-sm font-medium text-white">
                    Establecer como ubicación principal
                  </Label>
                  <p className="text-xs text-white/60">Se usará como dirección base en facturas y recibos.</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="aura-cta aura-cta--ghost w-full justify-center sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`aura-cta aura-cta--primary w-full justify-center sm:w-auto ${loading ? 'pointer-events-none opacity-60' : ''}`}
            >
              {loading ? 'Guardando…' : location ? 'Actualizar' : 'Crear ubicación'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
