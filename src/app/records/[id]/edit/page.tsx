"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { RecordForm } from "@/components/records/record-form";
import ApiService from "@/lib/api-service";

interface RecordData {
  patient_id: string;
  treatment_id: string;
  fecha: string;
  monto_pagado: number;
  monto_neto: number;
  costo_unitario: number;
  ganancia: number;
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia';
  tipo_tarjeta?: 'bbva' | 'openpay';
  meses_sin_intereses?: number;
  tasa_comision?: number;
  comision_monto?: number;
  notas: string;
}

export default function EditRecordPage() {
  const params = useParams();
  const router = useRouter();
  const [record, setRecord] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (params.id) {
      fetchRecord(parseInt(params.id as string));
    }
  }, [params.id]);

  const fetchRecord = async (id: number) => {
    try {
      setIsLoading(true);
      const response = await ApiService.getRecord(id);
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setRecord(response.data);
      }
    } catch (error) {
      console.error("Error al cargar el registro:", error);
      setError("Error al cargar el registro");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: RecordData) => {
    try {
      console.log("Actualizando registro:", data);
      const response = await ApiService.updateRecord(parseInt(params.id as string), data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      console.log("Registro actualizado exitosamente:", response.data);
      router.push("/records");
    } catch (error) {
      console.error("Error al actualizar el registro:", error);
      alert("Error al actualizar el registro: " + (error instanceof Error ? error.message : "Error desconocido"));
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar este registro?")) {
      return;
    }

    try {
      const response = await ApiService.deleteRecord(parseInt(params.id as string));
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      alert("Registro eliminado exitosamente");
      router.push("/records");
    } catch (error) {
      console.error("Error al eliminar el registro:", error);
      alert("Error al eliminar el registro: " + (error instanceof Error ? error.message : "Error desconocido"));
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <p>Cargando registro...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <p>Registro no encontrado</p>
        </div>
      </div>
    );
  }

  // Preparar datos iniciales para el formulario
  const initialData = {
    patient_id: record.patient_id?.toString() || "",
    treatment_id: record.treatment_id?.toString() || "",
    fecha: record.fecha ? new Date(record.fecha).toISOString().split("T")[0] : "",
    monto_pagado: record.monto_pagado || 0,
    monto_neto: record.monto_neto || 0,
    costo_unitario: record.costo_unitario || 0,
    ganancia: record.ganancia || 0,
    metodo_pago: record.metodo_pago || 'efectivo',
    tipo_tarjeta: record.tipo_tarjeta || undefined,
    meses_sin_intereses: record.meses_sin_intereses || 0,
    tasa_comision: record.tasa_comision || 0,
    comision_monto: record.comision_monto || 0,
    notas: record.notas || ""
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Editar Registro</h1>
        <p className="text-muted-foreground mt-2">
          Modifique los datos del registro de tratamiento
        </p>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Volver
        </button>
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Eliminar Registro
        </button>
      </div>

      <RecordForm 
        initialData={initialData}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
