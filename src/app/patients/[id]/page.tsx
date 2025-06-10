"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import Link from "next/link"

// Mock data - será reemplazado con datos reales de la API
const mockPatient = {
  id: 1,
  nombre: "Juan Pérez",
  fecha_nacimiento: "1990-05-15",
  telefono: "555-0123",
  email: "juan@ejemplo.com",
  direccion: "Calle Principal 123",
}

const mockTreatments = [
  {
    id: 1,
    fecha: "2024-01-15",
    tratamiento: "Limpieza Dental",
    monto: 1500,
    estado: "Completado",
  },
  {
    id: 2,
    fecha: "2024-02-15",
    tratamiento: "Revisión",
    monto: 800,
    estado: "Programado",
  },
]

export default function PatientDetailsPage() {
  const params = useParams()
  const [patient] = useState(mockPatient)
  const [treatments] = useState(mockTreatments)

  return (
    <div className="container mx-auto py-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{patient.nombre}</h1>
          <p className="text-muted-foreground mt-2">
            Expediente del paciente
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" asChild>
            <Link href={`/patients/${params.id}/edit`}>
              Editar Paciente
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/records/new?patientId=${params.id}`}>
              Nuevo Registro
            </Link>
          </Button>
        </div>
      </div>

      {/* Patient Information */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Fecha de Nacimiento
                </dt>
                <dd>{patient.fecha_nacimiento}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Teléfono
                </dt>
                <dd>{patient.telefono}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Correo Electrónico
                </dt>
                <dd>{patient.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Dirección
                </dt>
                <dd>{patient.direccion}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Total de Tratamientos
                </dt>
                <dd className="text-2xl font-bold">{treatments.length}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Último Tratamiento
                </dt>
                <dd>{treatments[0]?.fecha || "Sin tratamientos"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Próximo Tratamiento
                </dt>
                <dd>{treatments[1]?.fecha || "No programado"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Treatments and Photos */}
      <Tabs defaultValue="treatments" className="w-full">
        <TabsList>
          <TabsTrigger value="treatments">Tratamientos</TabsTrigger>
          <TabsTrigger value="photos">Fotos de Progreso</TabsTrigger>
        </TabsList>

        <TabsContent value="treatments" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tratamiento</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {treatments.map((treatment) => (
                    <TableRow key={treatment.id}>
                      <TableCell>{treatment.fecha}</TableCell>
                      <TableCell>{treatment.tratamiento}</TableCell>
                      <TableCell>${treatment.monto}</TableCell>
                      <TableCell>{treatment.estado}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Ver Detalles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center p-8">
                <p className="text-muted-foreground">
                  No hay fotos de progreso disponibles
                </p>
                <Button className="mt-4">
                  Subir Nueva Foto
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
