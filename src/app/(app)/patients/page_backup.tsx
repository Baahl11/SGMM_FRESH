"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ApiService from "@/lib/api-service";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/date-utils";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  SortAsc, 
  Calendar, 
  DollarSign, 
  Clock, 
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Users,
  Filter
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link";

interface Patient {
  id: number;
  nombre: string;
  fecha_nacimiento: string;
  telefono: string;
  email?: string;
  direccion?: string;
  requiere_factura: boolean;
  created_at?: string;
  totalPagado?: number;
  proximaCita?: string | null;
}

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'alfabetico' | 'fecha_reciente' | 'mas_pagado' | 'proxima_cita'>('alfabetico')
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])

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

  const handleDeletePatient = async (patientId: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este paciente? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const response = await ApiService.deletePatient(patientId);
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Actualizar la lista de pacientes
      setPatients(patients.filter(p => p.id !== patientId));
      alert("Paciente eliminado exitosamente");
    } catch (error) {
      console.error("Error al eliminar paciente:", error);
      alert("Error al eliminar el paciente");
    }
  };

  // Agregar función de filtrado después de loadPatients
  const filterAndSortPatients = useCallback(async () => {
    if (!patients.length) return

    let filtered = patients.filter(patient => 
      patient.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.telefono?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Obtener datos adicionales para ordenamiento
    const patientsWithData = await Promise.all(
      filtered.map(async (patient) => {
        try {
          const recordsResponse = await ApiService.getRecordsWithNames(patient.id)
          const records = recordsResponse.error ? [] : recordsResponse.data || []
          
          const totalPagado = records
            .filter(record => record.monto_pagado > 0)
            .reduce((sum, record) => sum + record.monto_pagado, 0)
          
          const proximaCita = records
            .filter(record => record.monto_pagado === 0)
            .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())[0]

          return {
            ...patient,
            totalPagado,
            proximaCita: proximaCita?.fecha || null
          }
        } catch (error) {
          return {
            ...patient,
            totalPagado: 0,
            proximaCita: null
          }
        }
      })
    )    // Ordenar según el criterio seleccionado
    switch (sortBy) {
      case 'alfabetico':
        patientsWithData.sort((a, b) => a.nombre.localeCompare(b.nombre))
        break
      case 'fecha_reciente':
        patientsWithData.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        break
      case 'mas_pagado':
        patientsWithData.sort((a, b) => (b.totalPagado || 0) - (a.totalPagado || 0))
        break
      case 'proxima_cita':
        patientsWithData.sort((a, b) => {
          if (!a.proximaCita && !b.proximaCita) return 0
          if (!a.proximaCita) return 1
          if (!b.proximaCita) return -1
          return new Date(a.proximaCita).getTime() - new Date(b.proximaCita).getTime()
        })
        break
    }

    setFilteredPatients(patientsWithData)
  }, [patients, searchTerm, sortBy])

  // useEffect para aplicar filtros cuando cambien
  useEffect(() => {
    filterAndSortPatients()
  }, [filterAndSortPatients])
  // En el return, antes de la lista de pacientes, agregar el box de búsqueda:
  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 min-h-screen">
      {/* Header Section */}
      <div className="flex justify-between items-center bg-white rounded-xl p-6 shadow-sm border border-blue-100">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Gestión de Pacientes
            </h1>
            <p className="text-gray-600">Administra y busca tus pacientes</p>
          </div>
        </div>
        <Button onClick={() => router.push('/patients/new')} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Paciente
        </Button>
      </div>      {/* Box de búsqueda y filtros */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
              <Filter className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900">Buscar y Filtrar Pacientes</CardTitle>
          </div>
        </CardHeader>        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Campo de búsqueda */}
            <div className="flex-1">
              <Label htmlFor="search" className="text-gray-700 font-medium">Buscar paciente</Label>
              <Input
                id="search"
                placeholder="Buscar por nombre, teléfono o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
              {/* Selector de ordenamiento */}
            <div className="sm:w-64">
              <Label htmlFor="sortBy" className="text-gray-700 font-medium">Ordenar por</Label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger id="sortBy">
                  <SelectValue placeholder="Seleccionar orden" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alfabetico">
                    <div className="flex items-center gap-2">
                      <SortAsc className="h-4 w-4" />
                      Alfabéticamente
                    </div>
                  </SelectItem>
                  <SelectItem value="fecha_reciente">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fecha reciente
                    </div>
                  </SelectItem>
                  <SelectItem value="mas_pagado">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Más ha pagado
                    </div>
                  </SelectItem>
                  <SelectItem value="proxima_cita">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Próxima cita
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>          {/* Información de resultados */}
          <div className="text-sm text-gray-600 font-medium bg-gray-50 rounded-lg p-3">
            Mostrando {filteredPatients.length} de {patients.length} pacientes
          </div>
        </CardContent>
      </Card>      {/* Lista de pacientes - usar filteredPatients en lugar de patients */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPatients.map((patient) => (
          <Card key={patient.id} className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 border-b border-gray-100">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900">{patient.nombre}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/patients/${patient.id}/edit`)}
                    className="hover:bg-blue-50 hover:border-blue-200"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePatient(patient.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="h-6 w-6 bg-green-100 rounded-md flex items-center justify-center">
                  <Phone className="h-3 w-3 text-green-600" />
                </div>
                {patient.telefono || 'No especificado'}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="h-6 w-6 bg-blue-100 rounded-md flex items-center justify-center">
                  <Mail className="h-3 w-3 text-blue-600" />
                </div>
                {patient.email || 'No especificado'}
              </div>                {/* Información adicional según el filtro */}
              {sortBy === 'mas_pagado' && patient.totalPagado && patient.totalPagado > 0 && (
                <div className="flex items-center gap-3 text-sm font-medium text-green-700 bg-green-50 rounded-lg p-2">
                  <div className="h-6 w-6 bg-green-100 rounded-md flex items-center justify-center">
                    <DollarSign className="h-3 w-3 text-green-600" />
                  </div>
                  Total pagado: ${patient.totalPagado.toLocaleString()}
                </div>
              )}
              
              {sortBy === 'proxima_cita' && patient.proximaCita && (
                <div className="flex items-center gap-3 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg p-2">
                  <div className="h-6 w-6 bg-blue-100 rounded-md flex items-center justify-center">
                    <Clock className="h-3 w-3 text-blue-600" />
                  </div>
                  Próxima cita: {formatDate(patient.proximaCita)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>      {/* Mensaje si no hay resultados */}
      {filteredPatients.length === 0 && patients.length > 0 && (
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="text-center py-12">
            <div className="h-16 w-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No se encontraron pacientes</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Intenta ajustar los filtros de búsqueda para encontrar lo que buscas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
