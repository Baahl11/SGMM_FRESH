"use client";

import { useEffect, useState } from "react";
import ApiService from "@/lib/api-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface Record {
  id: number;
  paciente_id: number;
  tratamiento_id: number;
  fecha: string;
  cantidad: number;
  precio_total: number;
  pagado: boolean;
}

export default function RecordsPage() {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    const { data, error } = await ApiService.getRecords();
    if (error) {
      setError(error);
    } else if (data) {
      setRecords(data);
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <CardTitle>Registros</CardTitle>
        <Link href="/records/new">
          <Button>Nuevo Registro</Button>
        </Link>
      </div>

      {loading && <p>Cargando registros...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.map((record) => (
            <Card key={record.id}>
              <CardHeader>
                <CardTitle>Registro #{record.id}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Paciente ID: {record.paciente_id}</p>
                <p>Tratamiento ID: {record.tratamiento_id}</p>
                <p>Fecha: {record.fecha}</p>
                <p>Cantidad: {record.cantidad}</p>
                <p>Precio total: ${record.precio_total.toFixed(2)}</p>
                <p>Pagado: {record.pagado ? "Sí" : "No"}</p>
                <Link href={`/records/${record.id}/edit`}>
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
