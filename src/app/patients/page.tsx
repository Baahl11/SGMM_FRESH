"use client";

import { useEffect, useState } from "react";
import ApiService from "@/lib/api-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface Patient {
  id: number;
  nombre: string;
  fecha_nacimiento: string;
  telefono: string;
  email?: string;
  direccion?: string;
  requiere_factura: boolean;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    const { data, error } = await ApiService.getPatients();
    if (error) {
      setError(error);
    } else if (data) {
      setPatients(data);
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <CardTitle>Pacientes</CardTitle>
        <Link href="/patients/new">
          <Button>Nuevo Paciente</Button>
        </Link>
      </div>

      {loading && <p>Cargando pacientes...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((patient) => (
            <Card key={patient.id}>
              <CardHeader>
                <CardTitle>{patient.nombre}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Fecha de nacimiento: {patient.fecha_nacimiento}</p>
                <p>Teléfono: {patient.telefono}</p>
                {patient.email && <p>Email: {patient.email}</p>}
                {patient.direccion && <p>Dirección: {patient.direccion}</p>}
                <p>
                  Requiere factura: {patient.requiere_factura ? "Sí" : "No"}
                </p>
                <Link href={`/patients/${patient.id}/edit`}>
                  <Button variant="outline" className="mt-2 w-full">
                    Editar
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
