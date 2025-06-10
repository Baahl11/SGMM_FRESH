"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { PatientForm } from "@/components/patients/patient-form"

// Mock data - será reemplazado con datos reales de la API
const mockPatient = {
  id: 1,
  nombre: "Juan Pérez",
  fecha_nacimiento: "1990-05-15",
  telefono: "555-0123",
  email: "juan@ejemplo.com",
  direccion: "Calle Principal 123",
  requiere_factura: false,
}

export default function EditPatientPage() {
  const params = useParams()
  const [patient, setPatient] = useState(mockPatient)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch patient data from API
    // Simular carga de datos
    const loadData = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setPatient(mockPatient)
      setIsLoading(false)
    }
    loadData()
  }, [params.id])

  const handleSubmit = async (data: any) => {
    // TODO: Integrar con el backend
    console.log("Actualizar paciente:", data)
    // Simular delay de red
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Editar Paciente</h1>
        <p className="text-muted-foreground mt-2">
          Modifique los datos del paciente
        </p>
      </div>

      <PatientForm initialData={patient} onSubmit={handleSubmit} />
    </div>
  )
}
