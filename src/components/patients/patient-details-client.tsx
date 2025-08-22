"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import Link from "next/link";
import ApiService from "@/lib/api-service";

export default function PatientDetailsClient() {
  const params = useParams();
  const [patient, setPatient] = useState<any>(null);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!params?.id) return;
      const patientId = parseInt(params.id as string);
      
      try {
        setIsLoading(true);
        
        const patientRes = await ApiService.getPatient(patientId);
        if (patientRes.data && !patientRes.error) {
          setPatient(patientRes.data);
        } else {
          setPatient(null);
        }

        const recordsRes = await ApiService.getRecords(patientId);
        if (recordsRes.data && !recordsRes.error) {
          setTreatments(recordsRes.data);
        } else {
          setTreatments([]);
        }
      } catch (err) {
        console.error('Error loading patient data:', err);
        setError("Error al cargar datos del paciente");
        setPatient(null);
        setTreatments([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [params?.id]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Cargando datos del paciente...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 text-center">
        <div className="text-red-600 mb-4">{error}</div>
        <Button variant="outline" asChild>
          <Link href="/patients">Volver a Pacientes</Link>
        </Button>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="container mx-auto py-10 text-center">
        <div className="text-red-600 mb-4">Paciente no encontrado</div>
        <Button variant="outline" asChild>
          <Link href="/patients">Volver a Pacientes</Link>
        </Button>
      </div>
    );
  }

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
            <Link href={`/patients/${params?.id}/edit`}>
              Editar Paciente
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/records/new?patientId=${params?.id}`}>
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
                <dd>{patient.fecha_nacimiento || 'No especificada'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Teléfono
                </dt>
                <dd>{patient.telefono || 'No especificado'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Correo Electrónico
                </dt>
                <dd>{patient.email || 'No especificado'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Dirección
                </dt>
                <dd>{patient.direccion || 'No especificada'}</dd>
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
                <dd>{"No programado"}</dd>
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
              {treatments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay tratamientos registrados</p>
                  <Button className="mt-4" asChild>
                    <Link href={`/records/new?patientId=${params?.id}`}>
                      Registrar Primer Tratamiento
                    </Link>
                  </Button>
                </div>
              ) : (
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
                        <TableCell>
                          {treatment.fecha || treatment.fecha_tratamiento || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {treatment.tratamiento || 
                           treatment.treatment_name || 
                           treatment.nombre_tratamiento || 
                           treatment.treatment?.nombre || 
                           'N/A'}
                        </TableCell>
                        <TableCell>
                          ${treatment.monto_pagado || treatment.monto || treatment.precio || 0}
                        </TableCell>
                        <TableCell>
                          {treatment.estado || treatment.status || 'Completado'}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            Ver Detalles
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
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
  );
}
