"use client";

import { useEffect, useState } from "react";
import ApiService from "@/lib/api-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface Treatment {
  id: number;
  nombre: string;
  costo_unitario: number;
  precio: number;
  descripcion?: string;
}

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchTreatments();
  }, []);

  const fetchTreatments = async () => {
    setLoading(true);
    const { data, error } = await ApiService.getTreatments();
    if (error) {
      setError(error);
    } else if (data) {
      setTreatments(data);
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <CardTitle>Tratamientos</CardTitle>
        <Link href="/treatments/new">
          <Button>Nuevo Tratamiento</Button>
        </Link>
      </div>

      {loading && <p>Cargando tratamientos...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {treatments.map((treatment) => (
            <Card key={treatment.id}>
              <CardHeader>
                <CardTitle>{treatment.nombre}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Costo unitario: ${treatment.costo_unitario.toFixed(2)}</p>
                <p>Precio: ${treatment.precio.toFixed(2)}</p>
                {treatment.descripcion && <p>Descripción: {treatment.descripcion}</p>}
                <Link href={`/treatments/${treatment.id}/edit`}>
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
