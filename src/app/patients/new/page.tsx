"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, UserPlus, Users, Search, ArrowLeft, CreditCard, DollarSign } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PatientWithTreatmentForm } from "@/components/patients/patient-with-treatment-form";
import MultiTreatmentForm from "@/components/patients/multi-treatment-form";
import ApiService from "@/lib/api-service";

interface Patient {
  id: number;
  nombre: string;
  telefono: string;
  email?: string;
  fecha_nacimiento: string;
  direccion?: string;
  requiere_factura: boolean;
}

export default function NewPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("single");
  
  // For multi-treatment with existing patient
  const [existingPatients, setExistingPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchPatient, setSearchPatient] = useState("");
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);

  const handleSinglePatientSubmit = async (data: any) => {
    setLoading(true);
    setError("");
    setSuccess("");    try {
      const response = await ApiService.createPatientWithTreatment(data);
      if (response.data && !response.error) {
        setSuccess("Paciente registrado exitosamente");
        setTimeout(() => {
          router.push("/patients");
        }, 2000);
      } else {
        setError(response.error || "Error al registrar el paciente");
      }
    } catch (err: any) {
      console.error("Error creating patient:", err);
      setError(err.message || "Error inesperado al registrar el paciente");
    } finally {
      setLoading(false);
    }
  };

  const handleMultiTreatmentSubmit = async (data: any) => {
    if (!selectedPatient) {
      setError("Debe seleccionar un paciente");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");    try {
      const response = await ApiService.createMultipleTreatmentRecord(selectedPatient.id, data);
      if (response.data && !response.error) {
        setSuccess("Tratamientos registrados exitosamente");
        setTimeout(() => {
          router.push(`/patients/${selectedPatient.id}`);
        }, 2000);
      } else {
        setError(response.error || "Error al registrar los tratamientos");
      }
    } catch (err: any) {
      console.error("Error creating multi-treatment record:", err);
      setError(err.message || "Error inesperado al registrar los tratamientos");
    } finally {
      setLoading(false);
    }
  };

  const searchPatients = async (term: string) => {
    if (term.length < 2) {
      setExistingPatients([]);
      return;
    }

    setLoadingPatients(true);
    try {
      const response = await ApiService.getPatients(term);
      if (response.data) {
        setExistingPatients(response.data.slice(0, 10)); // Limit to 10 results
      }
    } catch (error) {
      console.error("Error searching patients:", error);
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchPatient(value);
    searchPatients(value);
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientSelector(false);
    setSearchPatient("");
    setExistingPatients([]);
  };

  const clearSelectedPatient = () => {
    setSelectedPatient(null);
    setShowPatientSelector(false);
    setSearchPatient("");
    setExistingPatients([]);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setError("");
    setSuccess("");
    if (value === "single") {
      clearSelectedPatient();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/patients")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a Pacientes
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nuevo Registro</h1>
              <p className="text-gray-600 mt-1">
                Registra un nuevo paciente o añade tratamientos a un paciente existente
              </p>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single" className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Nuevo Paciente + Tratamiento
                </TabsTrigger>
                <TabsTrigger value="multiple" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Múltiples Tratamientos
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              {/* Single Patient + Treatment Tab */}
              <TabsContent value="single" className="space-y-6">
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
                    <UserPlus className="w-5 h-5" />
                    <span className="font-medium">Registro de Nuevo Paciente con Tratamiento</span>
                  </div>
                  <p className="text-gray-600 mt-2">
                    Registra un nuevo paciente junto con su primer tratamiento
                  </p>
                </div>

                <Separator />

                <PatientWithTreatmentForm
                  onSubmit={handleSinglePatientSubmit}
                />
              </TabsContent>

              {/* Multiple Treatments Tab */}
              <TabsContent value="multiple" className="space-y-6">
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-lg">
                    <Users className="w-5 h-5" />
                    <span className="font-medium">Múltiples Tratamientos para Paciente Existente</span>
                  </div>
                  <p className="text-gray-600 mt-2">
                    Selecciona un paciente y registra múltiples tratamientos (paquetes, promociones)
                  </p>
                </div>

                <Separator />

                {/* Patient Selection */}
                {!selectedPatient ? (
                  <Card className="border-dashed">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Search className="w-5 h-5" />
                        Seleccionar Paciente
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="patient-search">Buscar paciente por nombre o teléfono</Label>
                        <Input
                          id="patient-search"
                          placeholder="Escribe el nombre o teléfono del paciente..."
                          value={searchPatient}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          className="w-full"
                        />
                      </div>

                      {loadingPatients && (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="text-gray-600 mt-2">Buscando pacientes...</p>
                        </div>
                      )}

                      {existingPatients.length > 0 && (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          <Label>Resultados de búsqueda:</Label>
                          {existingPatients.map((patient) => (
                            <Card
                              key={patient.id}
                              className="cursor-pointer hover:bg-blue-50 border-blue-200 transition-colors"
                              onClick={() => handlePatientSelect(patient)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-semibold text-gray-900">{patient.nombre}</h4>
                                    <p className="text-sm text-gray-600">{patient.telefono}</p>
                                    {patient.email && (
                                      <p className="text-sm text-gray-500">{patient.email}</p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <Badge variant="outline">ID: {patient.id}</Badge>
                                    {patient.requiere_factura && (
                                      <Badge variant="secondary" className="ml-2">Facturación</Badge>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}

                      {searchPatient.length >= 2 && existingPatients.length === 0 && !loadingPatients && (
                        <div className="text-center py-4">
                          <p className="text-gray-600">
                            No se encontraron pacientes con ese criterio de búsqueda.
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => setActiveTab("single")}
                            className="mt-2"
                          >
                            Crear nuevo paciente
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {/* Selected Patient Info */}
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-green-900 flex items-center gap-2">
                              <Users className="w-5 h-5" />
                              Paciente Seleccionado
                            </h3>
                            <div className="mt-2 space-y-1">
                              <p className="text-green-800 font-medium">{selectedPatient.nombre}</p>
                              <p className="text-green-700 text-sm">{selectedPatient.telefono}</p>
                              {selectedPatient.email && (
                                <p className="text-green-700 text-sm">{selectedPatient.email}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-white">
                              ID: {selectedPatient.id}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={clearSelectedPatient}
                            >
                              Cambiar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Multi-Treatment Form */}
                    <MultiTreatmentForm
                      patientId={selectedPatient.id}
                      onSubmit={handleMultiTreatmentSubmit}
                      onCancel={clearSelectedPatient}
                      loading={loading}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
