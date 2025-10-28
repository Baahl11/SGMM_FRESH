"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trash2, Edit2, Plus, AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Doctor {
  id: string;
  nombre: string;
  especialidad?: string;
  color: string;
}

interface DoctorException {
  id: string;
  doctor_id: string;
  tipo: "vacaciones" | "festivo" | "bloqueo";
  fecha_inicio: string; // YYYY-MM-DD
  fecha_fin: string; // YYYY-MM-DD
  motivo?: string;
  activo: boolean;
  created_at: string;
}

interface DoctorExceptionsConfigProps {
  onSave?: () => void;
}

export default function DoctorExceptionsConfig({ onSave }: DoctorExceptionsConfigProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [exceptions, setExceptions] = useState<DoctorException[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingException, setEditingException] = useState<DoctorException | null>(null);
  const [formData, setFormData] = useState({
    tipo: "vacaciones" as "vacaciones" | "festivo" | "bloqueo",
    fecha_inicio: "",
    fecha_fin: "",
    motivo: "",
  });

  // Load doctors
  useEffect(() => {
    loadDoctors();
  }, []);

  // Load exceptions when doctor is selected
  useEffect(() => {
    if (selectedDoctor) {
      loadExceptions(selectedDoctor.id);
    } else {
      setExceptions([]);
    }
  }, [selectedDoctor]);

  const loadDoctors = async () => {
    try {
      const res = await fetch("/api/doctors");
      if (!res.ok) throw new Error("Error al cargar doctores");
      const data = await res.json();
      setDoctors(data);
    } catch (err) {
      console.error("Error loading doctors:", err);
      setError("No se pudieron cargar los doctores");
    }
  };

  const loadExceptions = async (doctorId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/doctor-exceptions?doctor_id=${doctorId}`);
      if (!res.ok) throw new Error("Error al cargar excepciones");
      const data = await res.json();
      setExceptions(data);
    } catch (err) {
      console.error("Error loading exceptions:", err);
      setError("No se pudieron cargar las excepciones");
      setExceptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorChange = (doctorId: string) => {
    const doctor = doctors.find((d) => d.id === doctorId);
    setSelectedDoctor(doctor || null);
    setShowForm(false);
    setEditingException(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      tipo: "vacaciones",
      fecha_inicio: "",
      fecha_fin: "",
      motivo: "",
    });
    setEditingException(null);
  };

  const handleNewException = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (exception: DoctorException) => {
    setFormData({
      tipo: exception.tipo,
      fecha_inicio: exception.fecha_inicio,
      fecha_fin: exception.fecha_fin,
      motivo: exception.motivo || "",
    });
    setEditingException(exception);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    resetForm();
  };

  const validateForm = (): string | null => {
    if (!formData.fecha_inicio) return "Debe seleccionar fecha de inicio";
    if (!formData.fecha_fin) return "Debe seleccionar fecha de fin";
    
    const inicio = new Date(formData.fecha_inicio);
    const fin = new Date(formData.fecha_fin);
    
    if (fin < inicio) {
      return "La fecha de fin debe ser posterior a la fecha de inicio";
    }

    // Check for overlapping exceptions (excluding the one being edited)
    const hasOverlap = exceptions.some((exc) => {
      if (editingException && exc.id === editingException.id) return false;
      if (!exc.activo) return false;

      const excInicio = new Date(exc.fecha_inicio);
      const excFin = new Date(exc.fecha_fin);

      // Check if date ranges overlap
      return (inicio <= excFin && fin >= excInicio);
    });

    if (hasOverlap) {
      return "Ya existe una excepción activa en este rango de fechas";
    }

    return null;
  };

  const handleSaveException = async () => {
    if (!selectedDoctor) return;

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = {
        doctor_id: selectedDoctor.id,
        tipo: formData.tipo,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        motivo: formData.motivo || null,
        activo: true,
      };

      let res;
      if (editingException) {
        // Update existing exception
        res = await fetch(`/api/doctor-exceptions/${editingException.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new exception
        res = await fetch("/api/doctor-exceptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al guardar");
      }

      setSuccess(true);
      setShowForm(false);
      resetForm();
      
      // Reload exceptions
      await loadExceptions(selectedDoctor.id);

      setTimeout(() => setSuccess(false), 3000);
      if (onSave) onSave();
    } catch (err: any) {
      console.error("Error saving exception:", err);
      setError(err.message || "Error al guardar la excepción");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (exceptionId: string) => {
    if (!confirm("¿Está seguro de eliminar esta excepción?")) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/doctor-exceptions/${exceptionId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Error al eliminar");

      setSuccess(true);
      
      // Reload exceptions
      if (selectedDoctor) {
        await loadExceptions(selectedDoctor.id);
      }

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error deleting exception:", err);
      setError(err.message || "Error al eliminar la excepción");
    } finally {
      setSaving(false);
    }
  };

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case "vacaciones":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "festivo":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "bloqueo":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case "vacaciones":
        return "Vacaciones";
      case "festivo":
        return "Día Festivo";
      case "bloqueo":
        return "Bloqueo";
      default:
        return tipo;
    }
  };

  const formatDateRange = (inicio: string, fin: string) => {
    try {
      const startDate = new Date(inicio);
      const endDate = new Date(fin);
      
      if (inicio === fin) {
        return format(startDate, "d 'de' MMMM, yyyy", { locale: es });
      }
      
      return `${format(startDate, "d MMM", { locale: es })} - ${format(endDate, "d MMM, yyyy", { locale: es })}`;
    } catch {
      return `${inicio} - ${fin}`;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Excepciones de Horario
          </CardTitle>
          <CardDescription>
            Gestiona vacaciones, días festivos y bloqueos de agenda para cada doctor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Doctor selector */}
          <div className="space-y-2">
            <Label>Seleccionar Doctor</Label>
            <Select
              value={selectedDoctor?.id || ""}
              onValueChange={handleDoctorChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: doctor.color }}
                      />
                      <span>{doctor.nombre}</span>
                      {doctor.especialidad && (
                        <span className="text-xs text-gray-500">
                          ({doctor.especialidad})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Alerts */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Excepción guardada correctamente
              </AlertDescription>
            </Alert>
          )}

          {/* Main content area */}
          {selectedDoctor && (
            <div className="space-y-4">
              {/* Add exception button */}
              {!showForm && (
                <Button
                  onClick={handleNewException}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Excepción
                </Button>
              )}

              {/* Exception form */}
              {showForm && (
                <Card className="border-2 border-blue-200 bg-blue-50/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {editingException ? "Editar Excepción" : "Nueva Excepción"}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelForm}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Tipo */}
                    <div className="space-y-2">
                      <Label>Tipo de Excepción</Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(value: any) =>
                          setFormData({ ...formData, tipo: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vacaciones">🏖️ Vacaciones</SelectItem>
                          <SelectItem value="festivo">🎉 Día Festivo</SelectItem>
                          <SelectItem value="bloqueo">🚫 Bloqueo Manual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date range */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Fecha Inicio</Label>
                        <Input
                          type="date"
                          value={formData.fecha_inicio}
                          onChange={(e) =>
                            setFormData({ ...formData, fecha_inicio: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fecha Fin</Label>
                        <Input
                          type="date"
                          value={formData.fecha_fin}
                          onChange={(e) =>
                            setFormData({ ...formData, fecha_fin: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    {/* Motivo */}
                    <div className="space-y-2">
                      <Label>Motivo (opcional)</Label>
                      <Textarea
                        value={formData.motivo}
                        onChange={(e) =>
                          setFormData({ ...formData, motivo: e.target.value })
                        }
                        placeholder="Ej: Vacaciones de verano, Día de Navidad, etc."
                        rows={2}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveException}
                        disabled={saving}
                        className="flex-1"
                      >
                        {saving ? "Guardando..." : "Guardar"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancelForm}
                        disabled={saving}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Exceptions list */}
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  Cargando excepciones...
                </div>
              ) : exceptions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay excepciones configuradas para este doctor
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Excepciones Activas ({exceptions.filter(e => e.activo).length})
                  </Label>
                  {exceptions
                    .filter((e) => e.activo)
                    .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio))
                    .map((exception) => (
                      <Card key={exception.id} className="border-l-4" style={{ borderLeftColor: selectedDoctor.color }}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={getTipoBadgeColor(exception.tipo)}
                                >
                                  {getTipoLabel(exception.tipo)}
                                </Badge>
                                <span className="text-sm font-medium">
                                  {formatDateRange(exception.fecha_inicio, exception.fecha_fin)}
                                </span>
                              </div>
                              {exception.motivo && (
                                <p className="text-sm text-gray-600">
                                  {exception.motivo}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(exception)}
                                disabled={saving}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(exception.id)}
                                disabled={saving}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          )}

          {!selectedDoctor && (
            <div className="text-center py-8 text-gray-500">
              Seleccione un doctor para ver y gestionar sus excepciones
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
