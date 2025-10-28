"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Copy, Save, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Doctor {
  id: string;
  nombre: string;
  especialidad?: string;
  color: string;
}

interface Consultorio {
  id: string;
  nombre: string;
  ubicacion?: string;
}

interface DaySchedule {
  dia_semana: number; // 0=Domingo, 1=Lunes, ..., 6=Sábado
  activo: boolean;
  hora_inicio: string;
  hora_fin: string;
  consultorio_id: string | null;
}

interface DoctorScheduleConfigProps {
  onSave?: () => void;
}

export default function DoctorScheduleConfig({ onSave }: DoctorScheduleConfigProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [consultorios, setConsultorios] = useState<Consultorio[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Días de la semana (empezando en Lunes para UX)
  const weekDays = [
    { id: 1, name: 'Lunes', shortName: 'Lun' },
    { id: 2, name: 'Martes', shortName: 'Mar' },
    { id: 3, name: 'Miércoles', shortName: 'Mié' },
    { id: 4, name: 'Jueves', shortName: 'Jue' },
    { id: 5, name: 'Viernes', shortName: 'Vie' },
    { id: 6, name: 'Sábado', shortName: 'Sáb' },
    { id: 0, name: 'Domingo', shortName: 'Dom' },
  ];

  // Estado de horarios por día
  const [schedule, setSchedule] = useState<Record<number, DaySchedule>>(
    weekDays.reduce((acc, day) => ({
      ...acc,
      [day.id]: {
        dia_semana: day.id,
        activo: false,
        hora_inicio: '09:00',
        hora_fin: '18:00',
        consultorio_id: null,
      }
    }), {})
  );

  // Load doctors and consultorios
  useEffect(() => {
    loadDoctors();
    loadConsultorios();
  }, []);

  // Load schedule when doctor is selected
  useEffect(() => {
    if (selectedDoctor) {
      loadDoctorSchedule(selectedDoctor.id);
    }
  }, [selectedDoctor]);

  const loadDoctors = async () => {
    try {
      const response = await fetch('/api/doctors');
      if (response.ok) {
        const data = await response.json();
        setDoctors(Array.isArray(data) ? data.filter((d: Doctor) => d) : []);
      }
    } catch (err) {
      console.error('Error loading doctors:', err);
    }
  };

  const loadConsultorios = async () => {
    try {
      const response = await fetch('/api/consultorios');
      if (response.ok) {
        const data = await response.json();
        setConsultorios(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error loading consultorios:', err);
    }
  };

  const loadDoctorSchedule = async (doctorId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/doctor-schedules?doctor_id=${doctorId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          // Convert array to record
          const scheduleRecord = data.reduce((acc, item) => ({
            ...acc,
            [item.dia_semana]: {
              dia_semana: item.dia_semana,
              activo: item.activo,
              hora_inicio: item.hora_inicio,
              hora_fin: item.hora_fin,
              consultorio_id: item.consultorio_id,
            }
          }), {} as Record<number, DaySchedule>);
          
          // Merge with default schedule
          setSchedule(prevSchedule => ({
            ...prevSchedule,
            ...scheduleRecord
          }));
        } else {
          // Reset to default if no schedule exists
          setSchedule(
            weekDays.reduce((acc, day) => ({
              ...acc,
              [day.id]: {
                dia_semana: day.id,
                activo: false,
                hora_inicio: '09:00',
                hora_fin: '18:00',
                consultorio_id: null,
              }
            }), {})
          );
        }
      }
    } catch (err) {
      console.error('Error loading doctor schedule:', err);
      setError('Error al cargar el horario del doctor');
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (dayId: number) => {
    setSchedule(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        activo: !prev[dayId].activo
      }
    }));
  };

  const handleTimeChange = (dayId: number, field: 'hora_inicio' | 'hora_fin', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        [field]: value
      }
    }));
  };

  const handleConsultorioChange = (dayId: number, consultorioId: string) => {
    setSchedule(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        consultorio_id: consultorioId
      }
    }));
  };

  const copyToAllDays = (sourceDayId: number) => {
    const sourceSchedule = schedule[sourceDayId];
    
    setSchedule(prev => {
      const newSchedule = { ...prev };
      weekDays.forEach(day => {
        if (day.id !== sourceDayId) {
          newSchedule[day.id] = {
            dia_semana: day.id,
            activo: sourceSchedule.activo,
            hora_inicio: sourceSchedule.hora_inicio,
            hora_fin: sourceSchedule.hora_fin,
            consultorio_id: sourceSchedule.consultorio_id,
          };
        }
      });
      return newSchedule;
    });
  };

  const validateSchedule = (): string | null => {
    for (const day of weekDays) {
      const daySchedule = schedule[day.id];
      
      if (daySchedule.activo) {
        // Validate time range
        const [startHour, startMin] = daySchedule.hora_inicio.split(':').map(Number);
        const [endHour, endMin] = daySchedule.hora_fin.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        
        if (endMinutes <= startMinutes) {
          return `${day.name}: La hora de fin debe ser mayor que la hora de inicio`;
        }
        
        if (endMinutes - startMinutes < 30) {
          return `${day.name}: El horario debe ser de al menos 30 minutos`;
        }
        
        // Validate consultorio
        if (!daySchedule.consultorio_id) {
          return `${day.name}: Debe seleccionar un consultorio`;
        }
      }
    }
    
    return null;
  };

  const handleSave = async () => {
    if (!selectedDoctor) {
      setError('Por favor selecciona un doctor');
      return;
    }

    // Validate schedule
    const validationError = validateSchedule();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // Convert schedule to array
      const scheduleArray = weekDays.map(day => ({
        doctor_id: selectedDoctor.id,
        dia_semana: day.id,
        activo: schedule[day.id].activo,
        hora_inicio: schedule[day.id].hora_inicio,
        hora_fin: schedule[day.id].hora_fin,
        consultorio_id: schedule[day.id].consultorio_id,
      }));

      const response = await fetch('/api/doctor-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: selectedDoctor.id,
          schedules: scheduleArray
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar el horario');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      if (onSave) {
        onSave();
      }
    } catch (err) {
      console.error('Error saving schedule:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar el horario');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Doctor Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Configurar Horarios de Doctor
          </CardTitle>
          <CardDescription>
            Define los horarios de trabajo semanales para cada doctor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Seleccionar Doctor</Label>
              <Select
                value={selectedDoctor?.id || ''}
                onValueChange={(value) => {
                  const doctor = doctors.find(d => d.id === value);
                  setSelectedDoctor(doctor || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un doctor..." />
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
                          <span className="text-xs text-gray-500">({doctor.especialidad})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  ✅ Horario guardado exitosamente
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Configuration */}
      {selectedDoctor && (
        <Card>
          <CardHeader>
            <CardTitle>
              Horario Semanal - {selectedDoctor.nombre}
            </CardTitle>
            <CardDescription>
              Configura los días y horarios de trabajo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando horario...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {weekDays.map((day) => {
                  const daySchedule = schedule[day.id];
                  
                  return (
                    <div
                      key={day.id}
                      className={`
                        border rounded-lg p-4 transition-colors
                        ${daySchedule.activo ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}
                      `}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={daySchedule.activo}
                            onCheckedChange={() => handleDayToggle(day.id)}
                          />
                          <Label className="font-medium cursor-pointer" onClick={() => handleDayToggle(day.id)}>
                            {day.name}
                          </Label>
                          {!daySchedule.activo && (
                            <Badge variant="secondary">No labora</Badge>
                          )}
                        </div>
                        
                        {daySchedule.activo && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToAllDays(day.id)}
                            className="flex items-center gap-2"
                          >
                            <Copy className="h-3 w-3" />
                            Copiar a todos
                          </Button>
                        )}
                      </div>

                      {daySchedule.activo && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Hora Inicio */}
                          <div>
                            <Label className="text-xs text-gray-600">Hora Inicio</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <Input
                                type="time"
                                value={daySchedule.hora_inicio}
                                onChange={(e) => handleTimeChange(day.id, 'hora_inicio', e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Hora Fin */}
                          <div>
                            <Label className="text-xs text-gray-600">Hora Fin</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <Input
                                type="time"
                                value={daySchedule.hora_fin}
                                onChange={(e) => handleTimeChange(day.id, 'hora_fin', e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Consultorio */}
                          <div>
                            <Label className="text-xs text-gray-600">Consultorio</Label>
                            <Select
                              value={daySchedule.consultorio_id || ''}
                              onValueChange={(value) => handleConsultorioChange(day.id, value)}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Seleccionar..." />
                              </SelectTrigger>
                              <SelectContent>
                                {consultorios.map((consultorio) => (
                                  <SelectItem key={consultorio.id} value={consultorio.id}>
                                    {consultorio.nombre}
                                    {consultorio.ubicacion && ` - ${consultorio.ubicacion}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Guardando...' : 'Guardar Horario'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
