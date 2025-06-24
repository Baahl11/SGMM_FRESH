"use client";

import { useEffect, useState } from "react";
import ApiService from "@/lib/api-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { FileText, User, Stethoscope, Calendar, DollarSign, TrendingUp, CreditCard, Edit, Plus } from "lucide-react";

interface Record {
  id: number;
  patient_id: number;
  treatment_id: number;
  patient_name: string;
  treatment_name: string;
  fecha: string;
  monto_pagado: number;
  costo_unitario: number;
  ganancia: number;
  metodo_pago: string;
  tipo_tarjeta?: string;
  meses_sin_intereses?: number;
  tasa_comision?: number;
  comision_monto?: number;
  notas?: string;
}

export default function RecordsPage() {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchRecords();
  }, []);  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await ApiService.getRecordsWithNames();
      if (error) {
        setError(error);
        console.error("Error fetching records:", error);
      } else if (data) {
        setRecords(data);
        console.log("Successfully loaded", data.length, "records");
      }
    } catch (err) {
      console.error("Exception in fetchRecords:", err);
      setError("Error al cargar los registros");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 min-h-screen">
      {/* Header Section */}
      <div className="flex justify-between items-center bg-white rounded-xl p-6 shadow-sm border border-blue-100">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
              Registros
            </h1>
            <p className="text-gray-600">Historial de tratamientos realizados</p>
          </div>
        </div>
        <Link href="/records/new">
          <Button className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Registro
          </Button>
        </Link>
      </div>      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-gray-600">Cargando registros...</div>
        </div>
      )}
      
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-4 shadow-sm">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map((record) => (
            <Card key={record.id} className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Registro #{record.id}</CardTitle>
                </div>
              </CardHeader>              <CardContent className="p-4 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-6 w-6 bg-blue-100 rounded-md flex items-center justify-center">
                      <User className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="text-gray-600">Paciente:</span>
                    <span className="font-medium text-gray-900">{record.patient_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-6 w-6 bg-green-100 rounded-md flex items-center justify-center">
                      <Stethoscope className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-gray-600">Tratamiento:</span>
                    <span className="font-medium text-gray-900">{record.treatment_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-6 w-6 bg-purple-100 rounded-md flex items-center justify-center">
                      <Calendar className="h-3 w-3 text-purple-600" />
                    </div>
                    <span className="text-gray-600">Fecha:</span>
                    <span className="font-medium text-gray-900">{new Date(record.fecha).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-xs text-green-700 mb-1">
                      <DollarSign className="h-3 w-3" />
                      Monto Pagado
                    </div>
                    <p className="font-bold text-green-900">${record.monto_pagado.toLocaleString()}</p>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-xs text-blue-700 mb-1">
                      <DollarSign className="h-3 w-3" />
                      Costo
                    </div>
                    <p className="font-bold text-blue-900">${record.costo_unitario.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className={`rounded-lg p-3 ${record.ganancia >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <TrendingUp className={`h-3 w-3 ${record.ganancia >= 0 ? 'text-emerald-700' : 'text-red-700'}`} />
                    <span className={record.ganancia >= 0 ? 'text-emerald-700' : 'text-red-700'}>Ganancia</span>
                  </div>
                  <p className={`font-bold ${record.ganancia >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
                    ${record.ganancia.toFixed(2)}
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-700 mb-2">
                    <CreditCard className="h-3 w-3" />
                    Método de Pago
                  </div>
                  <p className="font-medium text-gray-900 capitalize">{record.metodo_pago}</p>
                  
                  {record.tipo_tarjeta && (
                    <p className="text-xs text-gray-600 mt-1">Tarjeta: {record.tipo_tarjeta.toUpperCase()}</p>
                  )}
                  {record.meses_sin_intereses && record.meses_sin_intereses > 0 && (
                    <p className="text-xs text-gray-600">MSI: {record.meses_sin_intereses} meses</p>
                  )}
                  {record.comision_monto && record.comision_monto > 0 && (
                    <p className="text-xs text-red-600">Comisión: ${record.comision_monto.toFixed(2)}</p>
                  )}
                </div>
                
                <Link href={`/records/${record.id}/edit`} className="block">
                  <Button variant="outline" className="w-full hover:bg-purple-50 hover:border-purple-200">
                    <Edit className="mr-2 h-4 w-4" />
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
