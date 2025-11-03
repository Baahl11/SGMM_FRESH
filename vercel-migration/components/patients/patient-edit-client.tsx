"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AppLayout from '@/components/layout/app-layout';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft,
  User,
  Users,
  FileText,
  AlertCircle,
  Save,
  Calendar,
  Phone,
  Mail,
  MapPin
} from "lucide-react";

interface Patient {
  id: number;
  nombre: string;
  fecha_nacimiento: string;
  telefono: string;
  email?: string;
  direccion?: string;
  requiere_factura: boolean;
  created_at?: string;
}

interface PatientEditClientProps {
  patientId: string;
}

export default function PatientEditClient({ patientId }: PatientEditClientProps) {
  const router = useRouter();
  const supabase = createClient();
  
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    fecha_nacimiento: '',
    telefono: '',
    email: '',
    direccion: '',
    requiere_factura: false
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      setLoadingAuth(true);

      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoadingAuth(false);

      if (!user) {
        router.push('/auth/signin');
        return;
      }

      loadPatientData();
    };

    void initialize();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, router]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔥 PatientEditClient: Loading patient ${patientId}`);
      
      const response = await fetch(`/api/patients/${patientId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const patientData = await response.json();
      console.log('✅ Patient data loaded:', patientData);
      
      setPatient(patientData);
      setFormData({
        nombre: patientData.nombre || '',
        fecha_nacimiento: patientData.fecha_nacimiento || '',
        telefono: patientData.telefono || '',
        email: patientData.email || '',
        direccion: patientData.direccion || '',
        requiere_factura: patientData.requiere_factura || false
      });
    } catch (err) {
      console.error('❌ Error loading patient:', err);
      setError('Error al cargar la información del paciente');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('🔥 PatientEditClient: Updating patient...');
      
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Patient updated successfully:', result);

      setSuccess('Paciente actualizado exitosamente');
      
      // Redirect after a moment
      setTimeout(() => {
        router.push(`/patients/${patientId}`);
      }, 2000);

    } catch (err: any) {
      console.error('❌ Error updating patient:', err);
      setError(err.message || 'Error al actualizar el paciente');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto py-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Cargando datos del paciente...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error && !patient) {
    return (
      <AppLayout>
        <div className="container mx-auto py-10 text-center">
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
          <Button variant="outline" onClick={() => router.push('/patients')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Pacientes
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center bg-white rounded-xl p-6 shadow-sm border border-blue-100">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Editar Paciente
              </h1>
              {patient && (
                <p className="text-gray-600">
                  {patient.nombre} - ID: {patient.id}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push(`/patients/${patientId}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <Button variant="outline" onClick={() => router.push(`/patients/${patientId}`)}>
              <FileText className="h-4 w-4 mr-2" />
              Ver Detalles
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {/* Edit Form */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Información del Paciente
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="text-gray-700 font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    Nombre completo *
                  </Label>
                  <Input
                    id="nombre"
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
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
                    value={formData.fecha_nacimiento}
                    onChange={(e) => handleInputChange('fecha_nacimiento', e.target.value)}
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
                    value={formData.telefono}
                    onChange={(e) => handleInputChange('telefono', e.target.value)}
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
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
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
                  value={formData.direccion}
                  onChange={(e) => handleInputChange('direccion', e.target.value)}
                  placeholder="Dirección completa"
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <Checkbox
                  id="requiere_factura"
                  checked={formData.requiere_factura}
                  onCheckedChange={(checked) => handleInputChange('requiere_factura', checked as boolean)}
                />
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-yellow-600" />
                  <Label htmlFor="requiere_factura" className="text-yellow-800 font-medium cursor-pointer">
                    Requiere factura
                  </Label>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push(`/patients/${patientId}`)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-sm px-8"
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Guardando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Guardar Cambios
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Patient Stats */}
        {patient && (
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Información del Sistema
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-sm text-blue-600 font-medium">ID del Paciente</p>
                  <p className="text-xl font-bold text-blue-900">{patient.id}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-sm text-green-600 font-medium">Fecha de Registro</p>
                  <p className="text-lg font-bold text-green-900">
                    {patient.created_at 
                      ? new Date(patient.created_at).toLocaleDateString() 
                      : 'No disponible'
                    }
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-sm text-purple-600 font-medium">Estado</p>
                  <p className="text-lg font-bold text-purple-900">Activo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}