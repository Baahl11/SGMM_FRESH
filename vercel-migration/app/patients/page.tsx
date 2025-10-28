"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/layout/app-layout";
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
  Filter,
  FileText
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
import { TagBadge } from "@/components/patients/tag-badge";
import type { PatientTag } from "@/types/patient-tags";

interface Patient {
  id: number;
  nombre: string;
  apellido?: string;
  fecha_nacimiento: string;
  telefono: string;
  email?: string;
  direccion?: string;
  notas?: string;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
  totalPagado?: number;
  proximaCita?: string | null;
  tags?: PatientTag[];
}

interface Record {
  id: number;
  patient_id: number;
  fecha: string;
  monto_pagado: number;
  treatment_name?: string;
  patient_name?: string;
}

export default function PatientsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'alfabetico' | 'fecha_reciente' | 'mas_pagado' | 'proxima_cita'>('alfabetico')
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoadingAuth(false);
      
      if (!user) {
        router.push('/auth/signin');
        return;
      }
      
      fetchPatients();
    };

    getUser();
  }, [router]);

  const fetchPatients = async () => {
    setLoading(true);
    setError("");
    
    console.log('🔥 fetchPatients: Loading patients...');
    
    try {
      const response = await fetch('/api/patients')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (Array.isArray(data)) {
        console.log(`✅ Patients loaded: ${data.length} patients`);
        
        // Load tags for each patient
        const patientsWithTags = await Promise.all(
          data.map(async (patient) => {
            try {
              const tagsResponse = await fetch(`/api/patients/${patient.id}/tags`);
              if (tagsResponse.ok) {
                const tags = await tagsResponse.json();
                return { ...patient, tags };
              }
              return { ...patient, tags: [] };
            } catch {
              return { ...patient, tags: [] };
            }
          })
        );
        
        setPatients(patientsWithTags);
      } else {
        console.log('⚠️ No patients data received');
        setPatients([]);
        setError("No se pudieron cargar los pacientes");
      }
    } catch (error) {
      console.error('❌ fetchPatients error:', error);
      setError("Error al cargar los pacientes");
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePatient = async (patientId: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este paciente? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      console.log(`🔥 handleDeletePatient: Deleting patient ${patientId}`);
      
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Patient deleted successfully:', result);

      // Actualizar la lista de pacientes
      setPatients(patients.filter(p => p.id !== patientId));
      alert("Paciente eliminado exitosamente");
    } catch (error) {
      console.error("❌ Error al eliminar paciente:", error);
      alert("Error al eliminar el paciente");
    }
  };

  // Agregar función de filtrado después de loadPatients
  const filterAndSortPatients = useCallback(async () => {
    if (!patients.length) return

    let filtered = patients.filter(patient =>
      patient.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.telefono?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Obtener datos adicionales para ordenamiento
    const patientsWithData = await Promise.all(
      filtered.map(async (patient) => {
        try {
          console.log(`🔥 filterAndSortPatients: Getting records for patient ${patient.id}`);
          
          const response = await fetch(`/api/records/patient/${patient.id}`);
          
          if (!response.ok) {
            console.log(`⚠️ Failed to fetch records for patient ${patient.id}`);
            return {
              ...patient,
              totalPagado: 0,
              proximaCita: null
            };
          }

          const recordsResponse = await response.json();
          const records: Record[] = recordsResponse || [];

          const totalPagado = records
            .filter((record: Record) => record.monto_pagado > 0)
            .reduce((sum: number, record: Record) => sum + record.monto_pagado, 0)

          const proximaCita = records
            .filter((record: Record) => record.monto_pagado === 0)
            .sort((a: Record, b: Record) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())[0]

          return {
            ...patient,
            totalPagado,
            proximaCita: proximaCita?.fecha || null
          }
        } catch (error) {
          console.error(`❌ Error getting records for patient ${patient.id}:`, error);
          return {
            ...patient,
            totalPagado: 0,
            proximaCita: null
          }
        }
      })
    )

    // Ordenar según el criterio seleccionado
    switch (sortBy) {
      case 'alfabetico':
        patientsWithData.sort((a, b) => {
          const nombreA = `${a.nombre} ${a.apellido || ''}`.trim();
          const nombreB = `${b.nombre} ${b.apellido || ''}`.trim();
          return nombreA.localeCompare(nombreB);
        })
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

  if (loadingAuth || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <AppLayout>
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
      </div>

      {/* Box de búsqueda y filtros */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
              <Filter className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900">Buscar y Filtrar Pacientes</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
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
          </div>

          {/* Información de resultados */}
          <div className="text-sm text-gray-600 font-medium bg-gray-50 rounded-lg p-3">
            Mostrando {filteredPatients.length} de {patients.length} pacientes
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center">
            <span className="text-red-800 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Lista de pacientes - usar filteredPatients en lugar de patients */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando pacientes...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="col-span-full">
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardContent className="text-center py-12">
                <div className="h-16 w-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {patients.length === 0 ? 'No hay pacientes' : 'No se encontraron pacientes'}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {patients.length === 0 
                    ? 'Comienza agregando un nuevo paciente.'
                    : 'Intenta ajustar los filtros de búsqueda para encontrar lo que buscas.'
                  }
                </p>
                {patients.length === 0 && (
                  <div className="mt-6">
                    <Link href="/patients/new">
                      <Button>Agregar Paciente</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <Card key={patient.id} className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b border-gray-100">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {patient.nombre} {patient.apellido || ''}
                      </CardTitle>
                      {patient.tags && patient.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {patient.tags.slice(0, 3).map((tag) => (
                            <TagBadge key={tag.id} tag={tag} size="sm" />
                          ))}
                          {patient.tags.length > 3 && (
                            <span className="text-xs text-gray-500 self-center">
                              +{patient.tags.length - 3} más
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/patients/${patient.id}`)}
                      className="hover:bg-blue-50 hover:border-blue-200"
                      title="Editar paciente"
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
              </CardHeader>

              <CardContent className="p-4 space-y-3">
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
                </div>

                {/* Información adicional según el filtro */}
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
                    Próxima cita: {new Date(patient.proximaCita).toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
      </div>
    </AppLayout>
  );
}