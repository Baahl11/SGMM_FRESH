"use client";

import { useState, useEffect } from 'react';
import { createClient } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/components/layout/app-layout';
import { GlassPanel } from '@/components/ui/glass-panel';
import {
  UserPlus,
  User,
  Stethoscope,
  Plus,
  X,
  Search,
  Calendar,
  DollarSign,
  ClipboardList,
  Users,
  Phone,
  Mail,
  MapPin,
  FileText
} from 'lucide-react';

interface Patient {
  id: number;
  nombre: string;
  telefono: string;
  email?: string;
  direccion?: string;
  fecha_nacimiento: string;
  requiere_factura: boolean;
}

interface Treatment {
  id: number;
  nombre: string;
  precio: number;
  descripcion?: string;
}

interface NewPatientForm {
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  fecha_nacimiento: string;
  requiere_factura: boolean;
}

interface NewTreatmentForm {
  patient_id: number;
  treatment_id: number;
  fecha: string;
  monto_pagado: number;
  notas: string;
}

export default function NewPatientPage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // Estados para el formulario de nuevo paciente
  const [newPatientForm, setNewPatientForm] = useState<NewPatientForm>({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    fecha_nacimiento: '',
    requiere_factura: false
  });

  // Estados para el formulario multi-tratamiento
  const [patients, setPatients] = useState<Patient[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [treatmentForms, setTreatmentForms] = useState<NewTreatmentForm[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingTreatments, setLoadingTreatments] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoadingAuth(false);
      
      if (!user) {
        router.push('/auth/signin');
        return;
      }
      
      loadTreatments();
    };

    getUser();
  }, [router]);

  const loadPatients = async () => {
    setLoadingPatients(true);
    try {
      console.log('🔥 loadPatients: Loading patients...');
      
      const response = await fetch('/api/patients');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        console.log(`✅ Patients loaded: ${data.length} patients`);
        setPatients(data);
      } else {
        console.log('⚠️ No patients data received');
        setPatients([]);
      }
    } catch (error) {
      console.error('❌ loadPatients error:', error);
      setPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  };

  const loadTreatments = async () => {
    setLoadingTreatments(true);
    try {
      console.log('🔥 loadTreatments: Loading treatments...');
      
      const response = await fetch('/api/treatments');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        console.log(`✅ Treatments loaded: ${data.length} treatments`);
        setTreatments(data);
      } else {
        console.log('⚠️ No treatments data received');
        setTreatments([]);
      }
    } catch (error) {
      console.error('❌ loadTreatments error:', error);
      setTreatments([]);
    } finally {
      setLoadingTreatments(false);
    }
  };

  const handleNewPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔥 handleNewPatientSubmit: Creating new patient...');
      
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPatientForm),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Patient created successfully:', result);

      alert('Paciente creado exitosamente');
      router.push('/patients');
    } catch (error) {
      console.error('❌ Error creating patient:', error);
      alert('Error al crear el paciente');
    } finally {
      setLoading(false);
    }
  };

  const handleMultiTreatmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatient) {
      alert('Por favor selecciona un paciente');
      return;
    }

    if (treatmentForms.length === 0) {
      alert('Por favor agrega al menos un tratamiento');
      return;
    }

    setLoading(true);

    try {
      console.log('🔥 handleMultiTreatmentSubmit: Creating treatments...');
      
      for (const form of treatmentForms) {
        const response = await fetch('/api/records', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...form,
            patient_id: selectedPatient.id
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      console.log('✅ All treatments created successfully');
      alert('Tratamientos agregados exitosamente');
      router.push('/patients');
    } catch (error) {
      console.error('❌ Error creating treatments:', error);
      alert('Error al crear los tratamientos');
    } finally {
      setLoading(false);
    }
  };

  const addTreatmentForm = () => {
    setTreatmentForms([...treatmentForms, {
      patient_id: 0,
      treatment_id: 0,
      fecha: new Date().toISOString().split('T')[0],
      monto_pagado: 0,
      notas: ''
    }]);
  };

  const removeTreatmentForm = (index: number) => {
    setTreatmentForms(treatmentForms.filter((_, i) => i !== index));
  };

  const updateTreatmentForm = (index: number, field: keyof NewTreatmentForm, value: any) => {
    const updated = treatmentForms.map((form, i) => 
      i === index ? { ...form, [field]: value } : form
    );
    setTreatmentForms(updated);
  };

  const filteredPatients = patients.filter(patient =>
    patient.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.telefono.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const glassInputClass = "rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/60 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:border-transparent";
  const glassSelectClass = "rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:border-transparent";

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      <div className="relative min-h-screen overflow-hidden bg-[#010511] px-4 py-8 text-white sm:px-6 lg:px-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[200px]" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-600/20 blur-[180px]" />
          <div className="absolute top-1/3 left-0 h-72 w-72 rounded-full bg-cyan-500/20 blur-[160px]" />
        </div>

        <div className="relative mx-auto max-w-6xl space-y-8">
          <GlassPanel className="relative overflow-hidden border-white/10 bg-white/5 p-6 sm:p-8">
            <div className="pointer-events-none absolute inset-0 opacity-80">
              <div className="absolute -top-20 right-6 h-60 w-60 rounded-full bg-emerald-400/40 blur-[140px]" />
              <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-cyan-500/30 blur-[140px]" />
            </div>
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-900/40">
                  <UserPlus className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/60">Registro rápido</p>
                  <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Nuevo Paciente</h1>
                  <p className="mt-2 text-sm text-white/70">Agrega pacientes o registra múltiples tratamientos en un flujo Aura Glass.</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/patients')}
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                Volver a Pacientes
              </Button>
            </div>
          </GlassPanel>

          <Tabs defaultValue="single" className="space-y-6">
            <GlassPanel className="border-white/10 bg-white/5 p-2">
              <TabsList className="grid w-full grid-cols-2 gap-2 rounded-2xl bg-transparent">
                <TabsTrigger
                  value="single"
                  className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white/70 transition data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-lg"
                >
                  <User className="h-4 w-4" />
                  Paciente Individual
                </TabsTrigger>
                <TabsTrigger
                  value="multi"
                  className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white/70 transition data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-lg"
                  onClick={loadPatients}
                >
                  <Stethoscope className="h-4 w-4" />
                  Múltiples Tratamientos
                </TabsTrigger>
              </TabsList>
            </GlassPanel>

            <TabsContent value="single" className="space-y-6">
              <GlassPanel className="border-white/10 bg-white/5 p-6">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/50">Paso 1</p>
                    <h2 className="text-lg font-semibold text-white">Información del Paciente</h2>
                  </div>
                </div>

                <form onSubmit={handleNewPatientSubmit} className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nombre" className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Users className="h-4 w-4 text-emerald-300" />
                        Nombre completo *
                      </Label>
                      <Input
                        id="nombre"
                        type="text"
                        value={newPatientForm.nombre}
                        onChange={(e) => setNewPatientForm({ ...newPatientForm, nombre: e.target.value })}
                        placeholder="Ingresa el nombre completo"
                        required
                        className={glassInputClass}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fecha_nacimiento" className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Calendar className="h-4 w-4 text-cyan-300" />
                        Fecha de nacimiento *
                      </Label>
                      <Input
                        id="fecha_nacimiento"
                        type="date"
                        value={newPatientForm.fecha_nacimiento}
                        onChange={(e) => setNewPatientForm({ ...newPatientForm, fecha_nacimiento: e.target.value })}
                        required
                        className={glassInputClass}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefono" className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Phone className="h-4 w-4 text-emerald-300" />
                        Teléfono *
                      </Label>
                      <Input
                        id="telefono"
                        type="tel"
                        value={newPatientForm.telefono}
                        onChange={(e) => setNewPatientForm({ ...newPatientForm, telefono: e.target.value })}
                        placeholder="Número de teléfono"
                        required
                        className={glassInputClass}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Mail className="h-4 w-4 text-sky-300" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={newPatientForm.email}
                        onChange={(e) => setNewPatientForm({ ...newPatientForm, email: e.target.value })}
                        placeholder="Correo electrónico"
                        className={glassInputClass}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="direccion" className="flex items-center gap-2 text-sm font-semibold text-white">
                      <MapPin className="h-4 w-4 text-rose-300" />
                      Dirección
                    </Label>
                    <Input
                      id="direccion"
                      type="text"
                      value={newPatientForm.direccion}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, direccion: e.target.value })}
                      placeholder="Dirección completa"
                      className={glassInputClass}
                    />
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-amber-300/40 bg-amber-500/10 p-4 text-sm text-amber-50">
                    <Checkbox
                      id="requiere_factura"
                      checked={newPatientForm.requiere_factura}
                      onCheckedChange={(checked) => setNewPatientForm({ ...newPatientForm, requiere_factura: checked as boolean })}
                    />
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-amber-200" />
                      <Label htmlFor="requiere_factura" className="cursor-pointer text-sm font-semibold text-amber-50">
                        Requiere factura
                      </Label>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-emerald-500 to-green-600 px-8 text-white shadow-lg shadow-emerald-900/30 hover:from-emerald-600 hover:to-green-700"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                          Creando...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4" />
                          Crear Paciente
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </GlassPanel>
            </TabsContent>

            <TabsContent value="multi" className="space-y-6">
              <GlassPanel className="border-white/10 bg-white/5 p-6">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600">
                    <Search className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/50">Paso 1</p>
                    <h2 className="text-lg font-semibold text-white">Seleccionar Paciente</h2>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="patient-search" className="text-sm font-semibold text-white">Buscar paciente</Label>
                    <Input
                      id="patient-search"
                      type="text"
                      placeholder="Buscar por nombre o teléfono..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={glassInputClass}
                    />
                  </div>

                  {loadingPatients ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-10 text-white/70">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white" />
                      <p className="mt-3 text-sm">Cargando pacientes...</p>
                    </div>
                  ) : (
                    <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                      {filteredPatients.length === 0 ? (
                        <p className="rounded-2xl border border-dashed border-white/20 bg-white/5 py-6 text-center text-sm text-white/60">
                          No se encontraron pacientes
                        </p>
                      ) : (
                        filteredPatients.map((patient) => (
                          <div
                            key={patient.id}
                            className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                              selectedPatient?.id === patient.id
                                ? 'border-emerald-400/60 bg-emerald-500/10 shadow-lg shadow-emerald-900/40'
                                : 'border-white/10 bg-white/5 hover:border-white/30'
                            }`}
                            onClick={() => setSelectedPatient(patient)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold text-white">{patient.nombre}</h3>
                                <p className="text-sm text-white/70">{patient.telefono}</p>
                              </div>
                              {selectedPatient?.id === patient.id && (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400/80">
                                  <div className="h-3 w-3 rounded-full bg-white" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </GlassPanel>

              {selectedPatient && (
                <GlassPanel className="border-white/10 bg-white/5 p-6">
                  <div className="flex flex-col gap-4 border-b border-white/10 pb-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600">
                        <ClipboardList className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-white/50">Paso 2</p>
                        <h2 className="text-lg font-semibold text-white">Tratamientos · {selectedPatient.nombre}</h2>
                      </div>
                    </div>
                    <Button
                      onClick={addTreatmentForm}
                      variant="outline"
                      size="sm"
                      className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Tratamiento
                    </Button>
                  </div>

                  <form onSubmit={handleMultiTreatmentSubmit} className="mt-6 space-y-6">
                    {treatmentForms.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 py-10 text-center text-white/70">
                        <ClipboardList className="mx-auto mb-4 h-12 w-12 text-white/40" />
                        <p>Sin tratamientos agregados aún</p>
                        <Button
                          type="button"
                          onClick={addTreatmentForm}
                          className="mt-4 bg-white/10 text-white hover:bg-white/20"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Agregar Primer Tratamiento
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {treatmentForms.map((form, index) => (
                          <div key={index} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="flex items-center justify-between pb-4">
                              <h4 className="text-base font-semibold text-white">Tratamiento {index + 1}</h4>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeTreatmentForm(index)}
                                className="border-white/20 text-white/80 hover:bg-white/10"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label className="text-sm font-semibold text-white">Tratamiento</Label>
                                <select
                                  value={form.treatment_id}
                                  onChange={(e) => updateTreatmentForm(index, 'treatment_id', parseInt(e.target.value))}
                                  className={`${glassSelectClass} appearance-none`}
                                  required
                                >
                                  <option value={0}>Seleccionar tratamiento</option>
                                  {treatments.map((treatment) => (
                                    <option key={treatment.id} value={treatment.id} className="text-slate-900">
                                      {treatment.nombre} - ${treatment.precio}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-sm font-semibold text-white">Fecha</Label>
                                <Input
                                  type="date"
                                  value={form.fecha}
                                  onChange={(e) => updateTreatmentForm(index, 'fecha', e.target.value)}
                                  required
                                  className={glassInputClass}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-sm font-semibold text-white">
                                  <DollarSign className="h-4 w-4 text-emerald-300" />
                                  Monto pagado
                                </Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={form.monto_pagado}
                                  onChange={(e) => updateTreatmentForm(index, 'monto_pagado', parseFloat(e.target.value) || 0)}
                                  placeholder="0.00"
                                  className={glassInputClass}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-sm font-semibold text-white">Notas</Label>
                                <Input
                                  type="text"
                                  value={form.notas}
                                  onChange={(e) => updateTreatmentForm(index, 'notas', e.target.value)}
                                  placeholder="Notas opcionales"
                                  className={glassInputClass}
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        <div className="flex justify-end pt-4">
                          <Button
                            type="submit"
                            disabled={loading}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 text-white shadow-lg shadow-emerald-900/30 hover:from-green-600 hover:to-emerald-700"
                          >
                            {loading ? (
                              <div className="flex items-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                                Guardando...
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Stethoscope className="h-4 w-4" />
                                Guardar Tratamientos
                              </div>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </form>
                </GlassPanel>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}