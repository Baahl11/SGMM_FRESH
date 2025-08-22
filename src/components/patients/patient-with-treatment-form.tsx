"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { 
  calcularGananciaNeta, 
  METODOS_PAGO_OPTIONS, 
  TIPOS_TARJETA_OPTIONS, 
  MESES_SIN_INTERESES_OPTIONS,
  type PaymentCalculation 
} from "@/lib/payment"
import ApiService from "@/lib/api-service"
import { PatientTreatmentHistory } from "./patient-treatment-history"
import { PatientImageGallery } from "./patient-image-gallery"
import simpleCalendarService from "@/lib/google-calendar"
import { formatDateForInput } from "@/lib/date-utils"

interface Treatment {
  id: number;
  nombre: string;
  precio: number;
  costo_unitario: number;
  descripcion?: string;
}

interface PatientWithTreatmentData {
  // Datos del paciente
  nombre: string
  fecha_nacimiento: string
  telefono: string
  email: string
  direccion: string
  requiere_factura: boolean
  
  // Tratamiento realizado
  tratamiento_realizado_id: string
  fecha_tratamiento: string
  monto_pagado: number
  costo_unitario: number
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia'
  tipo_tarjeta?: 'bbva' | 'banamex' | 'amex' | 'openpay' | 'otros'
  meses_sin_intereses?: number
  
  // Campos de cálculo de comisiones (opcionales)
  comision_monto?: number
  tasa_comision?: number
  monto_neto?: number
  ganancia?: number
  
  // Tratamiento futuro
  tratamiento_futuro_id?: string
  fecha_proxima_cita?: string
  hora_proxima_cita?: string
  
  // Notas
  notas: string
}

interface PatientWithTreatmentFormProps {
  initialData?: Partial<PatientWithTreatmentData>
  patientRecords?: any[]
  onSubmit: (data: PatientWithTreatmentData) => Promise<void>
  onDeleteRecord?: (recordId: number) => Promise<void>
  onEditRecord?: (recordId: number, editData: any) => Promise<void>
  patientId?: number // Add patientId for image management
}

export function PatientWithTreatmentForm({ 
  initialData, 
  patientRecords = [], 
  onSubmit, 
  onDeleteRecord,
  onEditRecord,
  patientId
}: PatientWithTreatmentFormProps) {const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [calculation, setCalculation] = useState<PaymentCalculation | null>(null)
  const [patientImages, setPatientImages] = useState<string[]>([])
  const [isLoadingImages, setIsLoadingImages] = useState(false)
  const [isCalendarConfigured, setIsCalendarConfigured] = useState(false)
  const [formData, setFormData] = useState<PatientWithTreatmentData>({
    nombre: "",
    fecha_nacimiento: "",
    telefono: "",
    email: "",
    direccion: "",
    requiere_factura: false,
    tratamiento_realizado_id: "",
    fecha_tratamiento: new Date().toISOString().split('T')[0], // Fecha de hoy por defecto
    monto_pagado: 0,
    costo_unitario: 0,
    metodo_pago: "efectivo",
    tipo_tarjeta: undefined,
    meses_sin_intereses: 0,    tratamiento_futuro_id: "",
    fecha_proxima_cita: "",
    hora_proxima_cita: "09:00",
    notas: "",
    ...initialData,
  })
  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        // Formatear la fecha de nacimiento para input date HTML
        fecha_nacimiento: formatDateForInput(initialData.fecha_nacimiento) || "",
      }))
    }
  }, [initialData])
  // Check Google Calendar configuration status
  useEffect(() => {
    setIsCalendarConfigured(simpleCalendarService.isConfigured())
  }, [])

  useEffect(() => {
    loadTreatments()
    if (patientId) {
      loadPatientImages()
    }
  }, [patientId])

  const loadPatientImages = async () => {
    if (!patientId) return
    
    setIsLoadingImages(true)
    try {
      const response = await ApiService.getPatientImages(patientId)
      console.log("API response structure:", response)
      
      // The API now returns { data: [images_array] } directly
      if (response.data && Array.isArray(response.data)) {
        setPatientImages(response.data)
        console.log("Patient images loaded:", response.data.length)
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Fallback for nested data structure
        setPatientImages(response.data.data)
        console.log("Patient images loaded (fallback):", response.data.data.length)
      } else {
        setPatientImages([])
        console.log("No images data found in response, setting empty array")
      }
    } catch (error) {
      console.error("Error loading patient images:", error)
      setPatientImages([])
    } finally {
      setIsLoadingImages(false)
    }
  }
  useEffect(() => {
    // Recalcular cuando cambien los valores de pago
    if (formData.monto_pagado > 0 && formData.costo_unitario > 0) {
      try {
        // Solo calcular si tenemos todos los datos necesarios
        const shouldCalculate = 
          formData.metodo_pago === 'efectivo' ||
          formData.metodo_pago === 'transferencia' ||
          (formData.metodo_pago === 'tarjeta' && formData.tipo_tarjeta);

        if (shouldCalculate) {
          const calc = calcularGananciaNeta(
            formData.monto_pagado,
            formData.costo_unitario,
            formData.metodo_pago,
            formData.tipo_tarjeta,
            formData.meses_sin_intereses || 0
          )
          setCalculation(calc)
        } else {
          // Limpiar el cálculo si faltan datos
          setCalculation(null)
        }
      } catch (error) {
        console.error("Error calculando comisión:", error)
        setCalculation(null)
      }
    } else {
      setCalculation(null)
    }
  }, [
    formData.monto_pagado, 
    formData.costo_unitario, 
    formData.metodo_pago, 
    formData.tipo_tarjeta, 
    formData.meses_sin_intereses
  ])
  const loadTreatments = async () => {
    console.log("Loading treatments for patient form...")
    try {
      const response = await ApiService.getTreatments()
      console.log("Treatments response:", response)
      if (response.data) {
        setTreatments(response.data)
        console.log("Treatments loaded:", response.data.length)
        // Debug: examinar estructura de cada treatment
        response.data.forEach((treatment: any, index: number) => {
          console.log(`Treatment ${index}:`, treatment)
          console.log(`Treatment ${index} keys:`, Object.keys(treatment))
          console.log(`Treatment ${index} precio:`, treatment.precio, typeof treatment.precio)
        })
      } else {
        console.log("No treatments data received")
      }
    } catch (error) {
      console.error("Error loading treatments:", error)
    }
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validación de campos requeridos
    if (!formData.nombre || !formData.fecha_nacimiento || !formData.telefono) {
      alert("Por favor complete todos los campos requeridos del paciente")
      return
    }

    // Validación más flexible para tratamientos
    const hasTreatmentData = formData.tratamiento_realizado_id && 
                           formData.monto_pagado > 0 && 
                           formData.costo_unitario >= 0; // PERMITIR costo 0 (consultas, servicios puros)
    
    const hasAppointmentData = formData.tratamiento_futuro_id && 
                              formData.fecha_proxima_cita && 
                              formData.hora_proxima_cita;
    
    // FIX: Permitir crear paciente sin tratamientos ni citas
    // Ahora es OPCIONAL agregar tratamientos al crear un paciente
    console.log("📝 Validación de envío:", {
      hasTreatmentData,
      hasAppointmentData,
      patientId,
      isNewPatient: !patientId
    });
    
    // Si hay tratamiento seleccionado pero faltan datos, mostrar error específico
    if (formData.tratamiento_realizado_id && (!formData.monto_pagado || formData.monto_pagado <= 0)) {
      alert("Por favor complete el monto pagado para el tratamiento realizado")
      return
    }
    
    if (formData.tratamiento_realizado_id && (formData.costo_unitario === undefined || formData.costo_unitario < 0)) {
      alert("Por favor verifique el costo unitario del tratamiento. Use 0 para servicios sin costo de materiales.")
      return
    }
    
    if (formData.metodo_pago === 'tarjeta' && !formData.tipo_tarjeta) {
      alert("Por favor seleccione el tipo de tarjeta")
      return
    }
    
    setIsLoading(true)
    try {
      // Prepare data with commission calculations if there's a treatment
      let dataToSend = { ...formData };
      
      if (hasTreatmentData) {
        // Always calculate commissions for treatments, even if calculation state is null
        let finalCalculation = calculation;
        
        if (!finalCalculation) {
          // Force calculation if not already done
          console.log("🔄 Force calculating commission for new patient submission");
          finalCalculation = calcularGananciaNeta(
            formData.monto_pagado,
            formData.costo_unitario,
            formData.metodo_pago,
            formData.tipo_tarjeta,
            formData.meses_sin_intereses || 0
          );
        }
        
        dataToSend = {
          ...dataToSend,
          comision_monto: finalCalculation.comision,
          tasa_comision: finalCalculation.tasa,
          monto_neto: finalCalculation.montoNeto,
          ganancia: finalCalculation.ganancia
        };
        
        console.log("💰 Commission data being sent:", {
          comision_monto: finalCalculation.comision,
          tasa_comision: finalCalculation.tasa,
          monto_neto: finalCalculation.montoNeto,
          ganancia: finalCalculation.ganancia,
          metodo_pago: formData.metodo_pago
        });
      }
      
      await onSubmit(dataToSend)
      router.push("/patients")
    } catch (error) {
      console.error("Error al guardar el paciente:", error)
      alert("Error al guardar el paciente")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSelectChange = (name: keyof PatientWithTreatmentData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  const handleTreatmentRealizadoChange = (treatmentId: string) => {
    const treatment = treatments.find(t => t.id.toString() === treatmentId)
    if (treatment) {
      setFormData(prev => ({
        ...prev,
        tratamiento_realizado_id: treatmentId,
        monto_pagado: treatment.precio,
        costo_unitario: treatment.costo_unitario
      }))
    }
  }

  console.log("PatientWithTreatmentForm - treatments state:", treatments)
  console.log("PatientWithTreatmentForm - treatments length:", treatments.length)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información del Paciente */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Paciente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Completo *</Label>              <Input
                id="nombre"
                name="nombre"
                placeholder="Nombre del paciente"
                value={formData.nombre}
                onChange={handleChange}
                required
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento *</Label>              <Input
                id="fecha_nacimiento"
                name="fecha_nacimiento"
                type="date"
                value={formData.fecha_nacimiento}
                onChange={handleChange}
                required
                autoComplete="bday"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono *</Label>              <Input
                id="telefono"
                name="telefono"
                type="tel"
                placeholder="Número de teléfono"
                value={formData.telefono}
                onChange={handleChange}
                required
                autoComplete="tel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>              <Input
                id="email"
                name="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="direccion">Dirección</Label>              <Input
                id="direccion"
                name="direccion"
                placeholder="Dirección del paciente"
                value={formData.direccion}
                onChange={handleChange}
                autoComplete="street-address"
              />
            </div>
            <div className="flex items-center space-x-2 md:col-span-2">
              <input
                id="requiere_factura"
                name="requiere_factura"
                type="checkbox"
                checked={formData.requiere_factura}
                onChange={handleChange}
                className="h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-primary"
              />
              <Label htmlFor="requiere_factura" className="select-none">
                Requiere facturar su pago
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>      {/* Tratamiento Realizado */}
      <Card>        <CardHeader>
          <CardTitle>Tratamiento Realizado (Opcional)</CardTitle>
          <p className="text-sm text-gray-600">
            Complete esta sección solo si ya realizó un tratamiento. También puede solo programar una cita futura.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tratamiento</Label>
            <Select
              value={formData.tratamiento_realizado_id}
              onValueChange={handleTreatmentRealizadoChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tratamiento realizado (opcional)" />
              </SelectTrigger><SelectContent className="max-h-60 overflow-y-auto">
                {treatments.map((treatment) => (
                  <SelectItem key={treatment.id} value={treatment.id.toString()}>
                    {treatment.nombre} - ${treatment.precio.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>          <div className="space-y-2">
            <Label htmlFor="fecha_tratamiento">Fecha del Tratamiento</Label>
            <Input
              id="fecha_tratamiento"
              name="fecha_tratamiento"
              type="date"
              value={formData.fecha_tratamiento}
              onChange={(e) => handleSelectChange('fecha_tratamiento', e.target.value)}
            />
          </div>          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monto_pagado">Monto Pagado</Label>
              <Input
                id="monto_pagado"
                name="monto_pagado"
                type="number"
                step="0.01"
                value={formData.monto_pagado}
                onChange={(e) => handleSelectChange('monto_pagado', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costo_unitario">Costo Unitario</Label>
              <Input
                id="costo_unitario"
                name="costo_unitario"
                type="number"
                step="0.01"
                value={formData.costo_unitario}
                onChange={(e) => handleSelectChange('costo_unitario', parseFloat(e.target.value) || 0)}
                placeholder="0.00 (Usar 0 para servicios como consultas)"
              />
              <p className="text-xs text-gray-500">
                💡 Use 0 para servicios puros sin costo de materiales (consultas, revisiones)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Método de Pago</Label>
            <Select
              value={formData.metodo_pago}
              onValueChange={(value) => handleSelectChange('metodo_pago', value)}
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
                <Label>Tipo de Tarjeta *</Label>
                <Select
                  value={formData.tipo_tarjeta || ''}
                  onValueChange={(value) => handleSelectChange('tipo_tarjeta', value as 'bbva' | 'banamex' | 'amex' | 'openpay' | 'otros')}
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
                <Label>Meses Sin Intereses</Label>
                <Select
                  value={formData.meses_sin_intereses?.toString() || '0'}
                  onValueChange={(value) => handleSelectChange('meses_sin_intereses', parseInt(value))}
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

          {formData.metodo_pago === 'tarjeta' && !formData.tipo_tarjeta && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ Por favor seleccione el tipo de tarjeta para calcular las comisiones
              </p>
            </div>
          )}

          {calculation && (
            <Card className="bg-gray-50">
              <CardContent className="pt-4">
                <h4 className="font-medium mb-2">Resumen de Cálculos de Pago</h4>
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
        </CardContent>
      </Card>

      {/* Próxima Cita */}
      <Card>
        <CardHeader>
          <CardTitle>Próxima Cita (Opcional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">          <div className="space-y-2">
            <Label>Tratamiento Futuro</Label>
            <Select
              value={formData.tratamiento_futuro_id || 'none'}
              onValueChange={(value) => handleSelectChange('tratamiento_futuro_id', value === 'none' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tratamiento para próxima cita" />
              </SelectTrigger>              <SelectContent className="max-h-60 overflow-y-auto">
                <SelectItem value="none">Sin tratamiento futuro</SelectItem>
                {treatments.map((treatment) => (
                  <SelectItem key={treatment.id} value={treatment.id.toString()}>
                    {treatment.nombre} - ${treatment.precio.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>          <div className="space-y-2">
            <Label htmlFor="fecha_proxima_cita">Fecha de Próxima Cita</Label>
            <Input
              id="fecha_proxima_cita"
              name="fecha_proxima_cita"
              type="date"
              value={formData.fecha_proxima_cita}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hora_proxima_cita">Hora de Próxima Cita</Label>
            <Input
              id="hora_proxima_cita"
              name="hora_proxima_cita"
              type="time"
              value={formData.hora_proxima_cita}
              onChange={handleChange}
              placeholder="09:00"
            />
            <p className="text-xs text-gray-500">
              💡 Se pueden programar múltiples citas a la misma hora
            </p>
          </div>          {/* Indicador y Botón de Google Calendar */}
          {formData.tratamiento_futuro_id && formData.fecha_proxima_cita && formData.hora_proxima_cita && (
            <div className={`p-3 rounded-lg border ${isCalendarConfigured ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  {isCalendarConfigured ? (
                    <>
                      <Calendar className="h-4 w-4 text-green-600" />
                      <span className="text-green-800 font-medium">
                        ✓ Listo para agregar al calendario
                      </span>
                    </>                  ) : (
                    <>
                      <Calendar className="h-4 w-4 text-blue-600" />                      <span className="text-blue-800">
                        💡 Calendario no configurado
                      </span>
                    </>
                  )}                </div>
                
                {isCalendarConfigured ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"                    onClick={() => {
                      const selectedTreatment = treatments.find(t => t.id === parseInt(formData.tratamiento_futuro_id!));
                      const appointmentDate = new Date(`${formData.fecha_proxima_cita}T${formData.hora_proxima_cita}:00`);
                      const endDate = new Date(appointmentDate.getTime() + (60 * 60 * 1000)); // 1 hora después
                      
                      const calendarEvent = {
                        title: `Cita: ${selectedTreatment?.nombre || 'Tratamiento'} - ${formData.nombre}`,
                        description: `Cita programada para el paciente ${formData.nombre}.\nTratamiento: ${selectedTreatment?.nombre || 'N/A'}\nTeléfono: ${formData.telefono}`,
                        startDateTime: appointmentDate.toISOString(),
                        endDateTime: endDate.toISOString(),
                        patientEmail: formData.email,
                        patientName: formData.nombre,
                        patientPhone: formData.telefono,
                        location: 'UME López & López'
                      };
                      
                      simpleCalendarService.openCalendarEvent(calendarEvent);
                    }}
                    className="flex items-center gap-2"                  >
                    <Calendar className="h-4 w-4" />
                    Agregar al Calendario
                  </Button>
                ) : (
                  <Link href="/settings/calendar">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      Configurar
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>{/* Próxima Cita */}
      {patientRecords && patientRecords.filter(record => record.monto_pagado === 0).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Próxima Cita</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patientRecords.filter(record => record.monto_pagado === 0).map((record) => {
                const treatment = treatments.find(t => t.id === record.treatment_id);
                return (
                  <div key={record.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="font-medium">{treatment?.nombre || `Tratamiento ID: ${record.treatment_id}`}</h4>
                        <p className="text-sm text-gray-600">
                          Fecha: {new Date(record.fecha).toLocaleDateString('es-ES')}
                        </p>
                        <p className="text-sm text-gray-600">
                          Método de pago: {record.metodo_pago}
                          {record.tipo_tarjeta && ` (${record.tipo_tarjeta})`}
                          {record.meses_sin_intereses > 0 && ` - ${record.meses_sin_intereses} MSI`}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-medium">${record.monto_pagado.toFixed(2)}</p>
                        <p className="text-sm text-green-600">Ganancia: ${record.ganancia?.toFixed(2) || '0.00'}</p>
                        {onDeleteRecord && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDeleteRecord(record.id)}
                            className="mt-2"
                          >
                            Eliminar
                          </Button>
                        )}
                      </div>
                    </div>                    {record.notas && (
                      <p className="text-sm text-gray-600 mt-2">
                        <strong>Notas:</strong> {record.notas}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notas */}
      <Card>
        <CardHeader>
          <CardTitle>Notas Adicionales</CardTitle>
        </CardHeader>        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              placeholder="Observaciones, síntomas, recomendaciones..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Historial de Tratamientos - Solo mostrar tratamientos realizados */}
      {patientRecords && patientRecords.filter(record => record.monto_pagado > 0).length > 0 && (        <PatientTreatmentHistory 
          records={patientRecords.filter(record => record.monto_pagado > 0).map(record => ({
            id: record.id,
            treatment_name: record.treatment_name || "Tratamiento",
            fecha: record.fecha,
            monto_pagado: record.monto_pagado,
            costo_unitario: record.costo_unitario || 0,
            metodo_pago: record.metodo_pago,
            tipo_tarjeta: record.tipo_tarjeta,
            meses_sin_intereses: record.meses_sin_intereses,
            ganancia: record.ganancia,
            notas: record.notas,
            // Multiple treatments fields from enhanced data
            tiene_multiples_tratamientos: record.tiene_multiples_tratamientos || false,
            nombre_promocion: record.nombre_promocion,
            precio_normal_total: record.precio_normal_total,
            ahorro_total: record.ahorro_total,
            record_treatments: record.record_treatments || [],
            // Bundle field from backend
            is_bundle: record.is_bundle || false
          }))}
          onDeleteRecord={onDeleteRecord}
          onEditRecord={onEditRecord}
        />
      )}

      {/* Galería de Imágenes - Solo mostrar si tenemos patientId (edición) */}
      {patientId && (
        <PatientImageGallery
          patientId={patientId}
          images={patientImages}
          onImagesChange={loadPatientImages}
        />
      )}

      {/* Botones */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Guardando..." : "Guardar Paciente"}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
