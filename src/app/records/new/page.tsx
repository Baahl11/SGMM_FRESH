"use client"

import { useSearchParams } from "next/navigation"
import { RecordForm } from "@/components/records/record-form"

interface RecordData {
  patient_id?: string
  treatment_id: string
  fecha: string
  monto_pagado: number
  metodo_pago: string
  notas: string
  facturado: boolean
}

export default function NewRecordPage() {
  const searchParams = useSearchParams()
  const patientId = searchParams.get("patientId")

  const handleSubmit = async (data: RecordData) => {
    // TODO: Integrar con el backend
    console.log("Nuevo registro:", data)
    // Simular delay de red
    await new Promise((resolve) => setTimeout(resolve, 1000))
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
