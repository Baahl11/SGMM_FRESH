'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Plus, Trash2, Calculator, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Treatment {
  id: number
  nombre: string
  precio_base: number
  costo_unitario: number
}

interface SelectedTreatment {
  treatment_id: number
  nombre: string
  precio_base: number
  costo_unitario: number
  cantidad: number
}

interface CreatePromotionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo', commission: 0 },
  { value: 'transferencia', label: 'Transferencia', commission: 0 },
  { value: 'TDD', label: 'Tarjeta de Débito', commission: 1.5 },
]

const CREDIT_CARDS = [
  { value: 'BBVA', label: 'BBVA', commission: 3.5 },
  { value: 'Banamex', label: 'Banamex', commission: 1.5 },
  { value: 'Amex', label: 'American Express', commission: 2.65 },
  { value: 'OpenPay', label: 'OpenPay', commission: 3.364 },
]

const MSI_OPTIONS = [
  { value: '3', label: '3 MSI', commission: 7.5 },
  { value: '6', label: '6 MSI', commission: 10.0 },
  { value: '9', label: '9 MSI', commission: 12.5 },
  { value: '12', label: '12 MSI', commission: 15.0 },
]

export function CreatePromotionDialog({ open, onOpenChange, onSuccess }: CreatePromotionDialogProps) {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precioTotal, setPrecioTotal] = useState('')
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [selectedTreatments, setSelectedTreatments] = useState<SelectedTreatment[]>([])
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo')
  const [creditCard, setCreditCard] = useState<string>('BBVA')
  const [msi, setMsi] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [loadingTreatments, setLoadingTreatments] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load treatments on mount
  useEffect(() => {
    if (open) {
      loadTreatments()
    }
  }, [open])

  const loadTreatments = async () => {
    setLoadingTreatments(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('treatments')
        .select('id, nombre, precio_base, costo_unitario')
        .order('nombre')

      if (error) throw error
      setTreatments(data || [])
    } catch (err) {
      console.error('Error loading treatments:', err)
      setError('Error al cargar tratamientos')
    } finally {
      setLoadingTreatments(false)
    }
  }

  const addTreatment = () => {
    if (!selectedTreatmentId) return

    const treatment = treatments.find(t => t.id === parseInt(selectedTreatmentId))
    if (!treatment) return

    // Check if already added
    if (selectedTreatments.find(t => t.treatment_id === treatment.id)) {
      setError('Este tratamiento ya fue agregado')
      return
    }

    setSelectedTreatments([
      ...selectedTreatments,
      {
        treatment_id: treatment.id,
        nombre: treatment.nombre,
        precio_base: treatment.precio_base,
        costo_unitario: treatment.costo_unitario,
        cantidad: 1,
      },
    ])
    setSelectedTreatmentId('')
    setError(null)
  }

  const removeTreatment = (treatmentId: number) => {
    setSelectedTreatments(selectedTreatments.filter(t => t.treatment_id !== treatmentId))
  }

  const updateQuantity = (treatmentId: number, cantidad: number) => {
    if (cantidad < 1) return
    setSelectedTreatments(
      selectedTreatments.map(t =>
        t.treatment_id === treatmentId ? { ...t, cantidad } : t
      )
    )
  }

  // Calculate totals
  const precioNormalTotal = selectedTreatments.reduce(
    (sum, t) => sum + t.precio_base * t.cantidad,
    0
  )

  const costoTotal = selectedTreatments.reduce(
    (sum, t) => sum + t.costo_unitario * t.cantidad,
    0
  )

  const precioPromocional = parseFloat(precioTotal) || 0
  const descuentoPorcentaje = precioNormalTotal > 0
    ? ((precioNormalTotal - precioPromocional) / precioNormalTotal) * 100
    : 0

  const gananciaBase = precioPromocional - costoTotal

  // Calculate commission
  let commissionRate = 0
  if (paymentMethod === 'TDC') {
    const card = CREDIT_CARDS.find(c => c.value === creditCard)
    commissionRate = card?.commission || 0
    
    if (msi) {
      const msiOption = MSI_OPTIONS.find(m => m.value === msi)
      commissionRate = msiOption?.commission || commissionRate
    }
  } else if (paymentMethod === 'TDD') {
    commissionRate = 1.5
  }

  const comision = (precioPromocional * commissionRate) / 100
  const gananciaNeta = gananciaBase - comision

  const handleSubmit = async () => {
    // Validation
    if (!nombre.trim()) {
      setError('El nombre es requerido')
      return
    }

    if (selectedTreatments.length === 0) {
      setError('Debe agregar al menos un tratamiento')
      return
    }

    if (!precioTotal || parseFloat(precioTotal) <= 0) {
      setError('El precio total debe ser mayor a 0')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/promotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          precio_total: parseFloat(precioTotal),
          descuento_porcentaje: Math.round(descuentoPorcentaje * 100) / 100,
          activo: true,
          treatments: selectedTreatments.map(t => ({
            treatment_id: t.treatment_id,
            cantidad: t.cantidad,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear promoción')
      }

      // Success - reset form and close
      resetForm()
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      console.error('Error creating promotion:', err)
      setError(err instanceof Error ? err.message : 'Error al crear promoción')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setNombre('')
    setDescripcion('')
    setPrecioTotal('')
    setSelectedTreatments([])
    setSelectedTreatmentId('')
    setPaymentMethod('efectivo')
    setCreditCard('BBVA')
    setMsi('')
    setError(null)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !loading) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Nueva Promoción
          </DialogTitle>
          <DialogDescription>
            Crea una promoción combinando múltiples tratamientos con un precio especial
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre de la Promoción *</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Paquete Facial Completo"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción (opcional)</Label>
              <Input
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción de la promoción"
                className="mt-1"
              />
            </div>
          </div>

          {/* Treatment Selection */}
          <div className="space-y-3">
            <Label>Tratamientos Incluidos *</Label>
            <div className="flex gap-2">
              <Select
                value={selectedTreatmentId}
                onValueChange={setSelectedTreatmentId}
                disabled={loadingTreatments}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Seleccionar tratamiento..." />
                </SelectTrigger>
                <SelectContent>
                  {treatments.map((treatment) => (
                    <SelectItem key={treatment.id} value={treatment.id.toString()}>
                      {treatment.nombre} - ${treatment.precio_base.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={addTreatment}
                disabled={!selectedTreatmentId || loadingTreatments}
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            </div>

            {/* Selected Treatments List */}
            {selectedTreatments.length > 0 && (
              <div className="space-y-2 mt-4">
                {selectedTreatments.map((treatment) => (
                  <Card key={treatment.treatment_id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium">{treatment.nombre}</p>
                          <p className="text-sm text-muted-foreground">
                            Precio base: ${treatment.precio_base.toFixed(2)} | 
                            Costo: ${treatment.costo_unitario.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Cantidad:</Label>
                          <Input
                            type="number"
                            min="1"
                            value={treatment.cantidad}
                            onChange={(e) =>
                              updateQuantity(treatment.treatment_id, parseInt(e.target.value) || 1)
                            }
                            className="w-20"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTreatment(treatment.treatment_id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="precioTotal">Precio Promocional (Público) *</Label>
              <Input
                id="precioTotal"
                type="number"
                step="0.01"
                min="0"
                value={precioTotal}
                onChange={(e) => setPrecioTotal(e.target.value)}
                placeholder="0.00"
                className="mt-1"
              />
            </div>

            {/* Calculations Summary */}
            {selectedTreatments.length > 0 && precioTotal && (
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900">Resumen de Cálculos</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Precio Normal Total:</p>
                      <p className="font-semibold line-through">${precioNormalTotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Precio Promocional:</p>
                      <p className="font-semibold text-green-600">${precioPromocional.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Descuento:</p>
                      <Badge variant="secondary" className="font-semibold">
                        {descuentoPorcentaje.toFixed(1)}%
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Costo Total:</p>
                      <p className="font-semibold">${costoTotal.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Payment Method & Commission Calculator */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <Label className="text-base font-semibold">Calculadora de Comisiones</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentMethod">Método de Pago</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="paymentMethod" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label} {method.commission > 0 && `(${method.commission}%)`}
                      </SelectItem>
                    ))}
                    <SelectItem value="TDC">Tarjeta de Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentMethod === 'TDC' && (
                <>
                  <div>
                    <Label htmlFor="creditCard">Banco/Procesador</Label>
                    <Select value={creditCard} onValueChange={setCreditCard}>
                      <SelectTrigger id="creditCard" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CREDIT_CARDS.map((card) => (
                          <SelectItem key={card.value} value={card.value}>
                            {card.label} ({card.commission}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="msi">Meses Sin Intereses (Opcional)</Label>
                    <Select value={msi} onValueChange={setMsi}>
                      <SelectTrigger id="msi" className="mt-1">
                        <SelectValue placeholder="Sin MSI" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sin MSI</SelectItem>
                        {MSI_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label} ({option.commission}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            {/* Commission Summary */}
            {precioPromocional > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Ganancia Base:</p>
                      <p className="font-semibold text-lg">${gananciaBase.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Comisión ({commissionRate}%):</p>
                      <p className="font-semibold text-lg text-orange-600">-${comision.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ganancia Neta:</p>
                      <p className={`font-bold text-xl ${gananciaNeta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${gananciaNeta.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading || selectedTreatments.length === 0 || !nombre || !precioTotal}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Promoción'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
