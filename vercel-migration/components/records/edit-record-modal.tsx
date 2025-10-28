"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { calcularComisionTarjeta, calcularGananciaNeta, MESES_SIN_INTERESES_OPTIONS, TIPOS_TARJETA_OPTIONS, METODOS_PAGO_OPTIONS } from "@/app/lib/payment"
import { Loader2 } from "lucide-react"

interface Treatment {
  id: string
  nombre: string
  precio_base: number
  costo_unitario: number
}

interface Record {
  id: string
  treatment_id: string
  fecha: string
  monto_pagado: number
  monto_neto: number
  costo_unitario: number
  ganancia: number
  metodo_pago: string
  tipo_tarjeta?: string
  meses_sin_intereses?: number
  tasa_comision?: number
  comision_monto?: number
  notas?: string
  treatment?: {
    id: string
    nombre: string
    precio_base: number
    costo_unitario: number
  }
}

interface EditRecordModalProps {
  open: boolean
  onClose: () => void
  record: Record
  onSuccess: () => void
}

export function EditRecordModal({ open, onClose, record, onSuccess }: EditRecordModalProps) {
  const [loading, setLoading] = useState(false)
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [loadingTreatments, setLoadingTreatments] = useState(true)
  
  // Form state
  const [treatmentId, setTreatmentId] = useState(record.treatment_id)
  const [fecha, setFecha] = useState(record.fecha.split('T')[0]) // Solo fecha YYYY-MM-DD
  const [montoPagado, setMontoPagado] = useState(record.monto_pagado.toString())
  const [metodoPago, setMetodoPago] = useState(record.metodo_pago)
  const [tipoTarjeta, setTipoTarjeta] = useState(record.tipo_tarjeta || '')
  const [mesesSinIntereses, setMesesSinIntereses] = useState(record.meses_sin_intereses?.toString() || '0')
  const [notas, setNotas] = useState(record.notas || '')
  
  // Calculated fields
  const [costoUnitario, setCostoUnitario] = useState(record.costo_unitario)
  const [montoNeto, setMontoNeto] = useState(record.monto_neto)
  const [comisionMonto, setComisionMonto] = useState(record.comision_monto || 0)
  const [tasaComision, setTasaComision] = useState(record.tasa_comision || 0)
  const [ganancia, setGanancia] = useState(record.ganancia)

  // Load treatments
  useEffect(() => {
    const fetchTreatments = async () => {
      try {
        setLoadingTreatments(true)
        // Add timestamp to bust cache
        const response = await fetch(`/api/treatments?t=${Date.now()}`)
        if (!response.ok) throw new Error('Error loading treatments')
        const data = await response.json()
        console.log('✅ Treatments loaded:', data.length, 'treatments', data)
        setTreatments(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('❌ Error loading treatments:', error)
        setTreatments([])
      } finally {
        setLoadingTreatments(false)
      }
    }

    if (open) {
      console.log('🔄 Modal opened, fetching treatments...')
      fetchTreatments()
    }
  }, [open])

  // Update cost when treatment changes
  useEffect(() => {
    const selectedTreatment = treatments.find(t => t.id === treatmentId)
    if (selectedTreatment) {
      setCostoUnitario(selectedTreatment.costo_unitario || 0)
      // Si el monto no fue editado manualmente, actualizar con el precio del tratamiento
      if (montoPagado === record.monto_pagado.toString()) {
        setMontoPagado(selectedTreatment.precio_base.toString())
      }
    }
  }, [treatmentId, treatments])

  // Recalculate when payment method or amount changes
  useEffect(() => {
    const monto = parseFloat(montoPagado) || 0
    const meses = parseInt(mesesSinIntereses) || 0

    if (metodoPago === 'tarjeta' && tipoTarjeta && monto > 0) {
      const resultado = calcularGananciaNeta(
        monto,
        costoUnitario,
        'tarjeta' as const,
        tipoTarjeta,
        meses
      )
      
      setComisionMonto(resultado.comision)
      setTasaComision(resultado.tasa)
      setMontoNeto(resultado.montoNeto)
      setGanancia(resultado.ganancia)
    } else {
      // Efectivo o transferencia: sin comisión
      const resultado = calcularGananciaNeta(
        monto,
        costoUnitario,
        metodoPago as 'efectivo' | 'transferencia'
      )
      
      setComisionMonto(0)
      setTasaComision(0)
      setMontoNeto(resultado.montoNeto)
      setGanancia(resultado.ganancia)
    }
  }, [montoPagado, metodoPago, tipoTarjeta, mesesSinIntereses, costoUnitario])

  const handleSubmit = async () => {
    try {
      setLoading(true)

      const updateData = {
        treatment_id: treatmentId,
        fecha: new Date(fecha).toISOString(),
        monto_pagado: parseFloat(montoPagado),
        monto_neto: montoNeto,
        costo_unitario: costoUnitario,
        ganancia: ganancia,
        metodo_pago: metodoPago,
        tipo_tarjeta: metodoPago === 'tarjeta' ? tipoTarjeta : null,
        meses_sin_intereses: metodoPago === 'tarjeta' ? parseInt(mesesSinIntereses) : 0,
        tasa_comision: tasaComision,
        comision_monto: comisionMonto,
        notas: notas
      }

      const response = await fetch(`/api/records/${record.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error updating record')
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error updating record:', error)
      alert(error instanceof Error ? error.message : 'Error al actualizar el registro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Tratamiento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Treatment Selector */}
          <div className="space-y-2">
            <Label htmlFor="treatment">Tratamiento</Label>
            {loadingTreatments ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Cargando tratamientos...</span>
              </div>
            ) : (
              <Select value={treatmentId} onValueChange={setTreatmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tratamiento" />
                </SelectTrigger>
                <SelectContent>
                  {treatments.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500">
                      No hay tratamientos disponibles. <a href="/treatments/new" className="text-blue-600 underline">Crear uno</a>
                    </div>
                  ) : (
                    treatments.map(treatment => {
                      console.log('Rendering treatment option:', treatment.id, treatment.nombre)
                      return (
                        <SelectItem key={treatment.id} value={treatment.id}>
                          {treatment.nombre} - ${treatment.precio_base?.toLocaleString() || '0'}
                        </SelectItem>
                      )
                    })
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha</Label>
            <Input
              id="fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="monto">Monto Pagado</Label>
            <Input
              id="monto"
              type="number"
              value={montoPagado}
              onChange={(e) => setMontoPagado(e.target.value)}
              step="0.01"
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="metodo">Método de Pago</Label>
            <Select value={metodoPago} onValueChange={setMetodoPago}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METODOS_PAGO_OPTIONS.map(metodo => (
                  <SelectItem key={metodo.value} value={metodo.value}>
                    {metodo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Card Type (only if payment method is card) */}
          {metodoPago === 'tarjeta' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="tipoTarjeta">Tipo de Tarjeta</Label>
                <Select value={tipoTarjeta} onValueChange={setTipoTarjeta}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo de tarjeta" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_TARJETA_OPTIONS.map(tipo => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="msi">Meses Sin Intereses</Label>
                <Select value={mesesSinIntereses} onValueChange={setMesesSinIntereses}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MESES_SIN_INTERESES_OPTIONS.map(msi => (
                      <SelectItem key={msi.value} value={msi.value.toString()}>
                        {msi.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas adicionales..."
              rows={3}
            />
          </div>

          {/* Summary Card */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-blue-900">Resumen</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Monto:</span>
                <span className="font-medium ml-2">${parseFloat(montoPagado || '0').toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-600">Comisión:</span>
                <span className="font-medium ml-2">${comisionMonto.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Monto Neto:</span>
                <span className="font-medium ml-2">${montoNeto.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Costo:</span>
                <span className="font-medium ml-2">${costoUnitario.toFixed(2)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Ganancia:</span>
                <span className={`font-bold ml-2 ${ganancia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${ganancia.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
