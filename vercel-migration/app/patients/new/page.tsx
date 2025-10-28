"use client";

import { useState, useEffect } from 'react';
import { createClient } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/components/layout/app-layout';
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
      <div className="space-y-8 p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center bg-white rounded-xl p-6 shadow-sm border border-blue-100">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                Nuevo Paciente
              </h1>
              <p className="text-gray-600">Agrega un nuevo paciente o tratamientos para pacientes existentes</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/patients')}
            className="hover:bg-gray-50"
          >
            Volver a Pacientes
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white rounded-xl shadow-sm border border-gray-200">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Paciente Individual
            </TabsTrigger>
            <TabsTrigger value="multi" className="flex items-center gap-2" onClick={loadPatients}>
              <Stethoscope className="h-4 w-4" />
              Múltiples Tratamientos
            </TabsTrigger>
          </TabsList>

          {/* Tab: Paciente Individual */}
          <TabsContent value="single" className="space-y-6">
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">Información del Paciente</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleNewPatientSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="nombre" className="text-gray-700 font-medium flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        Nombre completo *
                      </Label>
                      <Input
                        id="nombre"
                        type="text"
                        value={newPatientForm.nombre}
                        onChange={(e) => setNewPatientForm({...newPatientForm, nombre: e.target.value})}
                        placeholder="Ingresa el nombre completo"
                        required
                        className="border-gray-300 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fecha_nacimiento" className="text-gray-700 font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-green-600" />
                        Fecha de nacimiento *
                      </Label>
                      <Input
                        id="fecha_nacimiento"
                        type="date"
                        value={newPatientForm.fecha_nacimiento}
                        onChange={(e) => setNewPatientForm({...newPatientForm, fecha_nacimiento: e.target.value})}
                        required
                        className="border-gray-300 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefono" className="text-gray-700 font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4 text-emerald-600" />
                        Teléfono *
                      </Label>
                      <Input
                        id="telefono"
                        type="tel"
                        value={newPatientForm.telefono}
                        onChange={(e) => setNewPatientForm({...newPatientForm, telefono: e.target.value})}
                        placeholder="Número de teléfono"
                        required
                        className="border-gray-300 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700 font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4 text-indigo-600" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={newPatientForm.email}
                        onChange={(e) => setNewPatientForm({...newPatientForm, email: e.target.value})}
                        placeholder="Correo electrónico"
                        className="border-gray-300 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="direccion" className="text-gray-700 font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-600" />
                      Dirección
                    </Label>
                    <Input
                      id="direccion"
                      type="text"
                      value={newPatientForm.direccion}
                      onChange={(e) => setNewPatientForm({...newPatientForm, direccion: e.target.value})}
                      placeholder="Dirección completa"
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Checkbox
                      id="requiere_factura"
                      checked={newPatientForm.requiere_factura}
                      onCheckedChange={(checked) => setNewPatientForm({...newPatientForm, requiere_factura: checked as boolean})}
                    />
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-yellow-600" />
                      <Label htmlFor="requiere_factura" className="text-yellow-800 font-medium cursor-pointer">
                        Requiere factura
                      </Label>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-sm px-8"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Múltiples Tratamientos */}
          <TabsContent value="multi" className="space-y-6">
            {/* Selector de paciente */}
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <Search className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">Seleccionar Paciente</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="patient-search" className="text-gray-700 font-medium">Buscar paciente</Label>
                  <Input
                    id="patient-search"
                    type="text"
                    placeholder="Buscar por nombre o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>

                {loadingPatients ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Cargando pacientes...</p>
                  </div>
                ) : (
                  <div className="grid gap-3 max-h-64 overflow-y-auto">
                    {filteredPatients.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No se encontraron pacientes</p>
                    ) : (
                      filteredPatients.map((patient) => (
                        <div
                          key={patient.id}
                          className={`p-4 rounded-lg border cursor-pointer transition-all ${
                            selectedPatient?.id === patient.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedPatient(patient)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold text-gray-900">{patient.nombre}</h3>
                              <p className="text-sm text-gray-600">{patient.telefono}</p>
                            </div>
                            {selectedPatient?.id === patient.id && (
                              <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <div className="h-3 w-3 bg-white rounded-full"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Formularios de tratamiento */}
            {selectedPatient && (
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardHeader className="border-b border-gray-100">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <ClipboardList className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-semibold text-gray-900">Tratamientos</CardTitle>
                        <p className="text-sm text-gray-600">Paciente: {selectedPatient.nombre}</p>
                      </div>
                    </div>
                    <Button onClick={addTreatmentForm} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Tratamiento
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleMultiTreatmentSubmit} className="space-y-6">
                    {treatmentForms.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No hay tratamientos agregados</p>
                        <Button onClick={addTreatmentForm} className="mt-4" variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Primer Tratamiento
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {treatmentForms.map((form, index) => (
                          <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="font-semibold text-gray-900">Tratamiento {index + 1}</h4>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeTreatmentForm(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-gray-700 font-medium">Tratamiento</Label>
                                <select
                                  value={form.treatment_id}
                                  onChange={(e) => updateTreatmentForm(index, 'treatment_id', parseInt(e.target.value))}
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                  required
                                >
                                  <option value={0}>Seleccionar tratamiento</option>
                                  {treatments.map((treatment) => (
                                    <option key={treatment.id} value={treatment.id}>
                                      {treatment.nombre} - ${treatment.precio}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-gray-700 font-medium">Fecha</Label>
                                <Input
                                  type="date"
                                  value={form.fecha}
                                  onChange={(e) => updateTreatmentForm(index, 'fecha', e.target.value)}
                                  required
                                  className="border-gray-300 focus:border-blue-500"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-gray-700 font-medium flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-green-600" />
                                  Monto pagado
                                </Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={form.monto_pagado}
                                  onChange={(e) => updateTreatmentForm(index, 'monto_pagado', parseFloat(e.target.value) || 0)}
                                  placeholder="0.00"
                                  className="border-gray-300 focus:border-blue-500"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-gray-700 font-medium">Notas</Label>
                                <Input
                                  type="text"
                                  value={form.notas}
                                  onChange={(e) => updateTreatmentForm(index, 'notas', e.target.value)}
                                  placeholder="Notas opcionales"
                                  className="border-gray-300 focus:border-blue-500"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <div className="flex justify-end pt-4">
                          <Button 
                            type="submit" 
                            disabled={loading}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-sm px-8"
                          >
                            {loading ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}