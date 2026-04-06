"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/layout/app-layout";
import { GlassPanel } from "@/components/ui/glass-panel";
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
    try {
      const response = await fetch('/api/patients')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (Array.isArray(data)) {
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
          const response = await fetch(`/api/records/patient/${patient.id}`);
          
          if (!response.ok) {
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
      <div className="space-y-8">
        {/* Header Section */}
        <GlassPanel className="relative overflow-hidden p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-cyan-500/30 blur-[140px]" />
            <div className="absolute -bottom-40 left-0 h-72 w-72 rounded-full bg-violet-500/30 blur-[160px]" />
          </div>
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl border border-white/20 bg-gradient-to-br from-emerald-400/30 to-cyan-400/30 p-3 text-white">
                <Users className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Gestión de pacientes
                </h1>
                <p className="text-sm text-white/70">
                  Administra historiales, etiquetas y próximas citas.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push('/patients/new')}
                className="aura-cta aura-cta--primary px-6"
              >
                <Plus className="h-4 w-4" />
                Nuevo paciente
              </button>
            </div>
          </div>
        </GlassPanel>

      {/* Box de búsqueda y filtros */}
      <GlassPanel className="p-6 space-y-6">
        <div className="flex items-center gap-3 text-white">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-400/40 to-green-500/40 p-2">
            <Filter className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold">Buscar y filtrar pacientes</p>
            <p className="text-sm text-white/60">Utiliza búsqueda inteligente y ordenamientos para encontrar rápido.</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <Label htmlFor="search" className="text-xs uppercase tracking-[0.3em] text-white/60">Buscar paciente</Label>
            <Input
              id="search"
              placeholder="Nombre, teléfono o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-2 h-12 rounded-full border-white/15 bg-white/5 text-white placeholder:text-white/40 shadow-[0_20px_45px_rgba(2,6,23,0.45)]"
            />
          </div>
          <div className="md:w-64">
            <Label htmlFor="sortBy" className="text-xs uppercase tracking-[0.3em] text-white/60">Ordenar por</Label>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger
                id="sortBy"
                className="mt-2 h-12 rounded-full border-white/15 bg-white/5 text-left text-white shadow-[0_20px_45px_rgba(2,6,23,0.45)]"
              >
                <SelectValue placeholder="Seleccionar orden" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[var(--surface-night)] text-white">
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
                    Más pagado
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

        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70">
          Mostrando {filteredPatients.length} de {patients.length} pacientes
        </div>
      </GlassPanel>

      {error && (
        <GlassPanel className="border border-rose-400/30 bg-rose-500/10 p-4 text-sm font-medium text-rose-50">
          {error}
        </GlassPanel>
      )}

      {/* Lista de pacientes - usar filteredPatients en lugar de patients */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <GlassPanel className="col-span-full flex flex-col items-center gap-4 px-6 py-12 text-center text-white/70">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-300"></div>
            <p>Cargando pacientes...</p>
          </GlassPanel>
        ) : filteredPatients.length === 0 ? (
          <GlassPanel className="col-span-full space-y-4 px-6 py-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <Search className="h-8 w-8 text-white/60" />
            </div>
            <h3 className="text-2xl font-semibold text-white">
              {patients.length === 0 ? 'No hay pacientes' : 'Sin coincidencias'}
            </h3>
            <p className="mx-auto max-w-md text-sm text-white/70">
              {patients.length === 0
                ? 'Comienza agregando tu primer paciente para desbloquear reportes y recordatorios.'
                : 'Intenta ajustar los filtros o borra el término de búsqueda para ver más resultados.'}
            </p>
            {patients.length === 0 && (
              <div className="pt-4">
                <Link href="/patients/new" className="aura-cta aura-cta--primary inline-flex items-center gap-2 px-6">
                  <Plus className="h-4 w-4" />
                  Agregar paciente
                </Link>
              </div>
            )}
          </GlassPanel>
        ) : (
          filteredPatients.map((patient) => (
            <GlassPanel
              key={patient.id}
              className="space-y-4 p-5 transition hover:border-emerald-300/40"
            >
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/40 to-purple-500/40 p-3 text-white">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {patient.nombre} {patient.apellido || ''}
                    </p>
                    {patient.tags && patient.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {patient.tags.slice(0, 3).map((tag) => (
                          <TagBadge key={tag.id} tag={tag} size="sm" />
                        ))}
                        {patient.tags.length > 3 && (
                          <span className="text-xs text-white/60 self-center">
                            +{patient.tags.length - 3} más
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/patients/${patient.id}`)}
                    className="h-10 w-10 rounded-full border border-white/20 bg-white/5 text-white hover:border-emerald-300/40"
                    title="Editar paciente"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletePatient(patient.id)}
                    className="h-10 w-10 rounded-full border border-rose-400/40 bg-rose-500/10 text-rose-50 hover:bg-rose-500/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3 text-sm text-white/80">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                    <Phone className="h-4 w-4 text-white/60" />
                  </div>
                  {patient.telefono || 'No especificado'}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                    <Mail className="h-4 w-4 text-white/60" />
                  </div>
                  {patient.email || 'No especificado'}
                </div>
              </div>

              {sortBy === 'mas_pagado' && patient.totalPagado && patient.totalPagado > 0 && (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100">
                  <DollarSign className="h-4 w-4" />
                  Total pagado: ${patient.totalPagado.toLocaleString()}
                </div>
              )}

              {sortBy === 'proxima_cita' && patient.proximaCita && (
                <div className="flex items-center gap-3 rounded-2xl border border-sky-400/30 bg-sky-500/10 px-4 py-3 text-sm font-semibold text-sky-100">
                  <Clock className="h-4 w-4" />
                  Próxima cita: {new Date(patient.proximaCita).toLocaleDateString()}
                </div>
              )}
            </GlassPanel>
          ))
        )}
      </div>
      </div>
    </AppLayout>
  );
}