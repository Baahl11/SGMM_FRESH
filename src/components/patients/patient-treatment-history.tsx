"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Calendar, DollarSign, CreditCard, Edit, Save, X } from "lucide-react"
import { 
  calcularGananciaNeta, 
  METODOS_PAGO_OPTIONS, 
  TIPOS_TARJETA_OPTIONS, 
  MESES_SIN_INTERESES_OPTIONS,
  type PaymentCalculation 
} from "@/lib/payment"

interface RecordTreatment {
  id: number;
  record_id: number;
  treatment_id?: number;
  nombre_tratamiento: string;
  precio_normal: number;
  precio_promocional: number;
  costo_unitario: number;
  ganancia_individual: number;
  orden: number;
}

interface TreatmentRecord {
  id: number
  treatment_name: string
  fecha: string
  monto_pagado: number
  costo_unitario: number
  metodo_pago: string
  tipo_tarjeta?: string
  meses_sin_intereses?: number
  ganancia: number
  notas?: string
  // Multiple treatments fields
  tiene_multiples_tratamientos?: boolean;
  nombre_promocion?: string;
  precio_normal_total?: number;
  ahorro_total?: number;
  record_treatments?: RecordTreatment[];
  // Bundle field
  is_bundle?: boolean;
}

interface EditRecordData {
  monto_pagado: number
  costo_unitario: number
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia'
  tipo_tarjeta?: 'bbva' | 'openpay'
  meses_sin_intereses?: number
  notas?: string
}

interface PatientTreatmentHistoryProps {
  records: TreatmentRecord[]
  onDeleteRecord?: (recordId: number) => Promise<void>
  onEditRecord?: (recordId: number, editData: EditRecordData) => Promise<void>
}

export function PatientTreatmentHistory({ records, onDeleteRecord, onEditRecord }: PatientTreatmentHistoryProps) {
  const [editingRecord, setEditingRecord] = useState<number | null>(null)
  const [editFormData, setEditFormData] = useState<EditRecordData>({
    monto_pagado: 0,
    costo_unitario: 0,
    metodo_pago: 'efectivo',
    tipo_tarjeta: undefined,
    meses_sin_intereses: 0,
    notas: ''
  })
  const [calculation, setCalculation] = useState<PaymentCalculation | null>(null)

  const handleDelete = async (recordId: number, treatmentName: string) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el tratamiento "${treatmentName}"?`)) {
      if (onDeleteRecord) {
        await onDeleteRecord(recordId)
      }
    }
  }

  const startEdit = (record: TreatmentRecord) => {
    setEditingRecord(record.id)
    setEditFormData({
      monto_pagado: record.monto_pagado,
      costo_unitario: record.costo_unitario,
      metodo_pago: record.metodo_pago as 'efectivo' | 'tarjeta' | 'transferencia',
      tipo_tarjeta: record.tipo_tarjeta as 'bbva' | 'openpay' | undefined,
      meses_sin_intereses: record.meses_sin_intereses || 0,
      notas: record.notas || ''
    })
    
    // Calcular comisión inicial
    if (record.monto_pagado > 0 && record.costo_unitario > 0) {
      try {
        const calc = calcularGananciaNeta(
          record.monto_pagado,
          record.costo_unitario,
          record.metodo_pago as 'efectivo' | 'tarjeta' | 'transferencia',
          record.tipo_tarjeta as 'bbva' | 'openpay' | undefined,
          record.meses_sin_intereses || 0
        )
        setCalculation(calc)
      } catch (error) {
        console.error("Error calculando comisión inicial:", error)
        setCalculation(null)
      }
    }
  }

  const cancelEdit = () => {
    setEditingRecord(null)
    setEditFormData({
      monto_pagado: 0,
      costo_unitario: 0,
      metodo_pago: 'efectivo',
      tipo_tarjeta: undefined,
      meses_sin_intereses: 0,
      notas: ''
    })
    setCalculation(null)
  }

  const saveEdit = async () => {
    if (editingRecord && onEditRecord) {
      await onEditRecord(editingRecord, editFormData)
      setEditingRecord(null)
      setCalculation(null)
    }
  }

  const updateEditData = (field: keyof EditRecordData, value: any) => {
    const newData = { ...editFormData, [field]: value }
    setEditFormData(newData)
    
    // Recalcular comisión cuando cambien los valores relevantes
    if (newData.monto_pagado > 0 && newData.costo_unitario > 0) {
      try {
        const shouldCalculate = 
          newData.metodo_pago === 'efectivo' ||
          newData.metodo_pago === 'transferencia' ||
          (newData.metodo_pago === 'tarjeta' && newData.tipo_tarjeta)

        if (shouldCalculate) {
          const calc = calcularGananciaNeta(
            newData.monto_pagado,
            newData.costo_unitario,
            newData.metodo_pago,
            newData.tipo_tarjeta,
            newData.meses_sin_intereses || 0
          )
          setCalculation(calc)
        } else {
          setCalculation(null)
        }
      } catch (error) {
        console.error("Error calculando comisión:", error)
        setCalculation(null)
      }
    } else {
      setCalculation(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'tarjeta':
        return <CreditCard className="h-4 w-4" />
      case 'efectivo':
        return <DollarSign className="h-4 w-4" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historial de Tratamientos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No hay tratamientos registrados para este paciente.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Historial de Tratamientos ({records.length})
        </CardTitle>
      </CardHeader>
      <CardContent>        <div className="space-y-4">
          {records.map((record) => {
            // Determinar si es tratamiento múltiple/bundle
            const isMultipleOrBundle = record.tiene_multiples_tratamientos || record.is_bundle
            
            return (
              <div 
                key={record.id} 
                className={`border rounded-lg p-4 ${
                  isMultipleOrBundle 
                    ? "border-purple-300 bg-purple-50 shadow-sm" 
                    : "border-blue-300 bg-blue-50 shadow-sm"
                }`}
              >
              <div className="flex justify-between items-start mb-3">
                <div>
                  {record.is_bundle ? (
                    <div>
                      <h4 className="font-semibold text-lg text-purple-700">
                        📦 {record.treatment_name}
                      </h4>
                      <p className="text-sm text-purple-600 font-medium">
                        Paquete promocional
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(record.fecha)}
                      </p>
                    </div>
                  ) : record.tiene_multiples_tratamientos ? (
                    <div>
                      <h4 className="font-semibold text-lg text-purple-700">
                        🎁 {record.nombre_promocion || 'Promoción Múltiple'}
                      </h4>
                      <p className="text-sm text-purple-600 font-medium">
                        {record.record_treatments?.length || 0} tratamientos incluidos
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(record.fecha)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-semibold text-lg text-blue-700">
                        🩺 {record.treatment_name}
                      </h4>
                      <p className="text-sm text-blue-600 font-medium">
                        Tratamiento individual
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(record.fecha)}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {onEditRecord && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(record)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDeleteRecord && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(record.id, record.treatment_name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              {editingRecord === record.id ? (
                // Formulario de edición
                <div className="space-y-4 border rounded-lg p-4 bg-white">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`monto_${record.id}`}>Monto Pagado</Label>
                      <Input
                        id={`monto_${record.id}`}
                        type="number"
                        step="0.01"
                        value={editFormData.monto_pagado}
                        onChange={(e) => updateEditData('monto_pagado', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`costo_${record.id}`}>Costo Unitario</Label>
                      <Input
                        id={`costo_${record.id}`}
                        type="number"
                        step="0.01"
                        value={editFormData.costo_unitario}
                        onChange={(e) => updateEditData('costo_unitario', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`metodo_${record.id}`}>Método de Pago</Label>
                    <Select
                      value={editFormData.metodo_pago}
                      onValueChange={(value) => updateEditData('metodo_pago', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {METODOS_PAGO_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {editFormData.metodo_pago === 'tarjeta' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`tarjeta_${record.id}`}>Tipo de Tarjeta</Label>
                        <Select
                          value={editFormData.tipo_tarjeta || ''}
                          onValueChange={(value) => updateEditData('tipo_tarjeta', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tarjeta" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS_TARJETA_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`msi_${record.id}`}>Meses Sin Intereses</Label>
                        <Select
                          value={editFormData.meses_sin_intereses?.toString() || '0'}
                          onValueChange={(value) => updateEditData('meses_sin_intereses', parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MESES_SIN_INTERESES_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value.toString()}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor={`notas_${record.id}`}>Notas</Label>
                    <Textarea
                      id={`notas_${record.id}`}
                      value={editFormData.notas}
                      onChange={(e) => updateEditData('notas', e.target.value)}
                      placeholder="Notas del tratamiento..."
                    />
                  </div>

                  {calculation && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Cálculo Actualizado:</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Comisión</p>
                          <p className="font-semibold text-red-600">{formatCurrency(calculation.comision)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Monto Neto</p>
                          <p className="font-semibold">{formatCurrency(editFormData.monto_pagado - calculation.comision)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Ganancia</p>
                          <p className={`font-semibold ${calculation.ganancia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(calculation.ganancia)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={cancelEdit}>
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={saveEdit}>
                      <Save className="h-4 w-4 mr-1" />
                      Guardar
                    </Button>
                  </div>
                </div>
              ) : (
                // Vista normal del registro
                <div>
                  {record.tiene_multiples_tratamientos && record.record_treatments && (
                    <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                      <h5 className="text-sm font-medium text-purple-700 mb-2">Tratamientos Incluidos:</h5>
                      <div className="space-y-2">
                        {record.record_treatments.map((treatment, index) => (
                          <div key={treatment.id} className="flex justify-between items-center text-sm">
                            <span className="text-purple-600">
                              {index + 1}. {treatment.nombre_tratamiento}
                            </span>
                            <span className="font-medium text-purple-700">
                              {formatCurrency(treatment.precio_promocional)}
                            </span>
                          </div>
                        ))}
                        {record.ahorro_total && record.ahorro_total > 0 && (
                          <div className="mt-3 pt-2 border-t border-purple-200">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-purple-600">Ahorro Total:</span>
                              <span className="font-medium text-green-600">
                                {formatCurrency(record.ahorro_total)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-muted-foreground">Monto Pagado</p>
                      <p className="font-semibold text-green-600">{formatCurrency(record.monto_pagado)}</p>
                    </div>
                    
                    <div>
                      <p className="font-medium text-muted-foreground">Método de Pago</p>
                      <p className="flex items-center gap-1 capitalize">
                        {getPaymentMethodIcon(record.metodo_pago)}
                        {record.metodo_pago}
                        {record.tipo_tarjeta && ` (${record.tipo_tarjeta.toUpperCase()})`}
                      </p>
                    </div>
                    
                    {record.meses_sin_intereses && record.meses_sin_intereses > 0 && (
                      <div>
                        <p className="font-medium text-muted-foreground">MSI</p>
                        <p>{record.meses_sin_intereses} meses</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="font-medium text-muted-foreground">Ganancia</p>
                      <p className={`font-semibold ${record.ganancia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(record.ganancia)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {!editingRecord && record.notas && (
                <div className="mt-3 pt-3 border-t">
                  <p className="font-medium text-muted-foreground text-sm">Notas:</p>
                  <p className="text-sm mt-1">{record.notas}</p>
                </div>
              )}
            </div>
          )})}
        </div>
      </CardContent>
    </Card>
  )
}
