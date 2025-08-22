"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { RecordForm } from "@/components/records/record-form"
import ApiService from "@/lib/api-service"

interface RecordData {
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

export default function NewRecordPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <NewRecordForm />
    </Suspense>
  );
}

function NewRecordForm() {
  const searchParams = useSearchParams()
  const patientId = searchParams?.get("patientId")
  const handleSubmit = async (data: RecordData) => {
    try {
      console.log("Enviando nuevo registro:", data);
      const response = await ApiService.createRecord(data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      console.log("Registro creado exitosamente:", response.data);
      // Redirigir a la página de registros o del paciente
      window.location.href = data.patient_id ? `/patients/${data.patient_id}` : "/records";
    } catch (error) {
      console.error("Error al crear el registro:", error);
      alert("Error al crear el registro: " + (error instanceof Error ? error.message : "Error desconocido"));
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Nuevo Registro</h1>
        <p className="text-muted-foreground mt-2">
          Registre un nuevo tratamiento o pago
        </p>
      </div>

      <RecordForm onSubmit={handleSubmit} patientId={patientId || undefined} />
    </div>
  )
}
