"use client"

import { PatientForm } from "@/components/patients/patient-form"

export default function NewPatientPage() {
  const handleSubmit = async (data: any) => {
    // TODO: Integrar con el backend
    console.log("Nuevo paciente:", data)
    // Simular delay de red
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Nuevo Paciente</h1>
        <p className="text-muted-foreground mt-2">
          Ingrese los datos del nuevo paciente
        </p>
      </div>

      <PatientForm onSubmit={handleSubmit} />
    </div>
  )
}
