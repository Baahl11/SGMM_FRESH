"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { 
  calcularGananciaNeta, 
  METODOS_PAGO_OPTIONS, 
  TIPOS_TARJETA_OPTIONS, 
  MESES_SIN_INTERESES_OPTIONS,
  type PaymentCalculation 
} from "@/lib/payment"
import ApiService from "@/lib/api-service"

interface Patient {
  id: number;
  nombre: string;
}

interface Treatment {
  id: number;
  nombre: string;
  precio: number;
  costo_unitario: number;
}

interface RecordFormData {
  patient_id: string
  treatment_id: string
  fecha: string
  monto_pagado: number
  monto_neto: number
  costo_unitario: number
  ganancia: number
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia'
  tipo_tarjeta?: 'bbva' | 'openpay'
  meses_sin_intereses?: number
  tasa_comision?: number
  comision_monto?: number
  notas: string
}

interface RecordFormProps {
  initialData?: Partial<RecordFormData>
  patientId?: string
  onSubmit: (data: RecordFormData) => Promise<void>
}

export function RecordForm({ initialData, patientId, onSubmit }: RecordFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [calculation, setCalculation] = useState<PaymentCalculation | null>(null)    
  // Sanitize patientId to always be integer string
  const sanitizedPatientId = patientId ? String(parseInt(patientId)) : "";
  const [formData, setFormData] = useState<RecordFormData>({
    patient_id: sanitizedPatientId,
    treatment_id: "",
    fecha: new Date().toISOString().split("T")[0], // Mantener como fecha para el input
    monto_pagado: 0,
    monto_neto: 0,
    costo_unitario: 0,
    ganancia: 0,
    metodo_pago: "efectivo",
    tipo_tarjeta: undefined,
    meses_sin_intereses: 0,
    tasa_comision: 0,
    comision_monto: 0,
    notas: "",
    ...initialData,
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Recalcular cuando cambien los valores relevantes
    if (formData.monto_pagado > 0 && formData.costo_unitario > 0) {
      try {        const calc = calcularGananciaNeta(
          formData.monto_pagado,
          formData.costo_unitario,
          formData.metodo_pago,
          formData.tipo_tarjeta,
          formData.meses_sin_intereses || 0
        )
        setCalculation(calc)
        setFormData(prev => ({
          ...prev,
          monto_neto: formData.monto_pagado - calc.comision,
          ganancia: calc.ganancia,
          tasa_comision: calc.tasa,
          comision_monto: calc.comision
        }))
      } catch (error) {
        console.error("Error calculando comisión:", error)
        setCalculation(null)
      }
    }
  }, [
    formData.monto_pagado, 
    formData.costo_unitario, 
    formData.metodo_pago, 
    formData.tipo_tarjeta, 
    formData.meses_sin_intereses
  ])
  const loadData = async () => {
    console.log("🔄 [RECORD-FORM] Loading treatments and patients...")
    try {
      const [patientsRes, treatmentsRes] = await Promise.all([
        ApiService.getPatients(),
        ApiService.getTreatments()
      ])
      
      console.log("🔍 [RECORD-FORM] Patients response:", patientsRes)
      console.log("🔍 [RECORD-FORM] Treatments response:", treatmentsRes)
      
      if (patientsRes.data) {
        setPatients(patientsRes.data)
        console.log("✅ [RECORD-FORM] Patients loaded:", patientsRes.data.length)
      }
      if (treatmentsRes.data) {
        setTreatments(treatmentsRes.data)
        console.log("✅ [RECORD-FORM] Treatments loaded:", treatmentsRes.data.length)
        console.log("🔍 [RECORD-FORM] Treatment details:", treatmentsRes.data.map(t => ({ id: t.id, nombre: t.nombre, precio: t.precio })))
      }
      
      // Verificar si hay tratamientos con error
      if (treatmentsRes.error) {
        console.error("❌ [RECORD-FORM] Error loading treatments:", treatmentsRes.error)
      }
      if (patientsRes.error) {
        console.error("❌ [RECORD-FORM] Error loading patients:", patientsRes.error)
      }
    } catch (error) {
      console.error("❌ [RECORD-FORM] Error loading data:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await onSubmit(formData)
      router.push(patientId ? `/patients/${patientId}` : "/records")
    } catch (error) {
      console.error("Error al guardar el registro:", error)
    } finally {
      setIsLoading(false)
    }
  }
  const handleTreatmentChange = (treatmentId: string) => {
    const treatment = treatments.find(t => t.id.toString() === treatmentId)
    if (treatment) {
      setFormData(prev => ({
        ...prev,
        treatment_id: treatmentId,
        monto_pagado: treatment.precio,
        monto_neto: treatment.precio, // Initially no commission
        costo_unitario: treatment.costo_unitario
      }))
    }
  }
  const handleChange = (name: keyof RecordFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  console.log("Current treatments state:", treatments)
  console.log("Current patients state:", patients)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información del Registro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!patientId && (
            <div className="space-y-2">
              <Label htmlFor="patient_id">Paciente</Label>
              <Select
                value={formData.patient_id}
                onValueChange={(value) => handleChange('patient_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id.toString()}>
                      {patient.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="treatment_id">Tratamiento</Label>
            <Select
              value={formData.treatment_id}
              onValueChange={handleTreatmentChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tratamiento" />
              </SelectTrigger>              <SelectContent className="max-h-60 overflow-y-auto">
                {(() => {
                  console.log("🔍 [RECORD-FORM] Rendering dropdown with treatments:", treatments.length)
                  console.log("🔍 [RECORD-FORM] Treatments data:", treatments)
                  if (treatments.length === 0) {
                    return (
                      <SelectItem value="0" disabled>
                        No hay tratamientos disponibles
                      </SelectItem>
                    );
                  }
                  return treatments.map((treatment) => {
                    console.log("🔍 [RECORD-FORM] Rendering treatment:", treatment.id, treatment.nombre, treatment.precio)
                    return (
                      <SelectItem key={treatment.id} value={treatment.id.toString()}>
                        {treatment.nombre} - ${treatment.precio.toLocaleString()}
                      </SelectItem>
                    )
                  });
                })()}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha</Label>
            <Input
              id="fecha"
              type="date"
              value={formData.fecha}
              onChange={(e) => handleChange('fecha', e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información de Pago</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monto_pagado">Monto Pagado</Label>
              <Input
                id="monto_pagado"
                type="number"
                step="0.01"
                value={formData.monto_pagado}
                onChange={(e) => handleChange('monto_pagado', parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="costo_unitario">Costo Unitario</Label>
              <Input
                id="costo_unitario"
                type="number"
                step="0.01"
                value={formData.costo_unitario}
                onChange={(e) => handleChange('costo_unitario', parseFloat(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metodo_pago">Método de Pago</Label>
            <Select
              value={formData.metodo_pago}
              onValueChange={(value) => handleChange('metodo_pago', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar método de pago" />
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

          {formData.metodo_pago === 'tarjeta' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="tipo_tarjeta">Tipo de Tarjeta</Label>
                <Select
                  value={formData.tipo_tarjeta || ''}
                  onValueChange={(value) => handleChange('tipo_tarjeta', value as 'bbva' | 'openpay')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo de tarjeta" />
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

              <div className="space-y-2">
                <Label htmlFor="meses_sin_intereses">Meses Sin Intereses</Label>
                <Select
                  value={formData.meses_sin_intereses?.toString() || '0'}
                  onValueChange={(value) => handleChange('meses_sin_intereses', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar MSI" />
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
            </>
          )}

          {calculation && (
            <Card className="bg-gray-50">
              <CardContent className="pt-4">
                <h4 className="font-medium mb-2">Resumen de Cálculos</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Monto Pagado:</div>
                  <div className="font-medium">${formData.monto_pagado.toLocaleString()}</div>
                  
                  {calculation.tasa > 0 && (
                    <>
                      <div>Tasa de Comisión:</div>
                      <div className="font-medium">{calculation.tasa.toFixed(2)}%</div>
                      
                      <div>Comisión:</div>
                      <div className="font-medium text-red-600">-${calculation.comision.toFixed(2)}</div>
                      
                      <div>Monto Neto:</div>
                      <div className="font-medium">${calculation.montoNeto.toFixed(2)}</div>
                    </>
                  )}
                  
                  <div>Costo:</div>
                  <div className="font-medium text-red-600">-${formData.costo_unitario.toLocaleString()}</div>
                  
                  <div>Ganancia:</div>
                  <div className={`font-bold ${calculation.ganancia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${calculation.ganancia.toFixed(2)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              value={formData.notas}
              onChange={(e) => handleChange('notas', e.target.value)}
              placeholder="Notas adicionales..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Guardando..." : "Guardar Registro"}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
