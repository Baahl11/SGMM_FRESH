"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronRight, 
  ChevronLeft, 
  FileText, 
  Activity, 
  Stethoscope, 
  Pill, 
  Eye,
  AlertTriangle,
  CheckCircle2,
  Plus,
  X
} from "lucide-react";
import { CreateMedicalRecordDTO, Medicamento, TipoConsulta, diagnosticosComunes } from "@/types/medical-record";
import { toast } from "sonner";

interface ConsultationWizardProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  onSuccess: () => void;
  editingRecord?: any; // Record a editar (opcional)
}

export function ConsultationWizard({
  open,
  onClose,
  patientId,
  patientName,
  onSuccess,
  editingRecord
}: ConsultationWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  
  // Datos del formulario
  const [tipoConsulta, setTipoConsulta] = useState<TipoConsulta>('evolucion');
  const [signosVitales, setSignosVitales] = useState({
    presion_arterial_sistolica: '',
    presion_arterial_diastolica: '',
    frecuencia_cardiaca: '',
    frecuencia_respiratoria: '',
    temperatura: '',
    peso: '',
    talla: '',
    saturacion_oxigeno: ''
  });
  const [antecedentes, setAntecedentes] = useState({
    heredo_familiares: '',
    personales_patologicos: '',
    personales_no_patologicos: '',
    gineco_obstetricos: '',
    alergias: [] as string[]
  });
  const [nuevaAlergia, setNuevaAlergia] = useState('');
  const [padecimientoActual, setPadecimientoActual] = useState('');
  const [exploracionFisica, setExploracionFisica] = useState('');
  const [diagnosticoCIE10, setDiagnosticoCIE10] = useState('');
  const [diagnosticoDescripcion, setDiagnosticoDescripcion] = useState('');
  const [pronostico, setPronostico] = useState('');
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [indicacionesGenerales, setIndicacionesGenerales] = useState('');
  const [notasPrivadas, setNotasPrivadas] = useState('');
  const [medicoNombre, setMedicoNombre] = useState('');
  const [medicoCedula, setMedicoCedula] = useState('');
  const [medicoEspecialidad, setMedicoEspecialidad] = useState('');

  // Definir resetForm ANTES del useEffect que lo usa
  const resetForm = () => {
    setStep(1);
    setSelectedDoctorId('');
    setTipoConsulta('evolucion');
    setSignosVitales({
      presion_arterial_sistolica: '',
      presion_arterial_diastolica: '',
      frecuencia_cardiaca: '',
      frecuencia_respiratoria: '',
      temperatura: '',
      peso: '',
      talla: '',
      saturacion_oxigeno: ''
    });
    setAntecedentes({
      heredo_familiares: '',
      personales_patologicos: '',
      personales_no_patologicos: '',
      gineco_obstetricos: '',
      alergias: []
    });
    setPadecimientoActual('');
    setExploracionFisica('');
    setDiagnosticoCIE10('');
    setDiagnosticoDescripcion('');
    setPronostico('');
    setMedicamentos([]);
    setIndicacionesGenerales('');
    setNotasPrivadas('');
    setMedicoNombre('');
    setMedicoCedula('');
    setMedicoEspecialidad('');
  };

  // Cargar doctores
  useEffect(() => {
    if (open) {
      fetchDoctors();
    } else {
      // Reset cuando se cierra
      resetForm();
    }
  }, [open]);

  // Pre-llenar formulario si estamos editando
  useEffect(() => {
    if (editingRecord && open) {
      setTipoConsulta(editingRecord.tipo_consulta || 'evolucion');
      setSignosVitales({
        presion_arterial_sistolica: editingRecord.signos_vitales?.presion_arterial_sistolica?.toString() || '',
        presion_arterial_diastolica: editingRecord.signos_vitales?.presion_arterial_diastolica?.toString() || '',
        frecuencia_cardiaca: editingRecord.signos_vitales?.frecuencia_cardiaca?.toString() || '',
        frecuencia_respiratoria: editingRecord.signos_vitales?.frecuencia_respiratoria?.toString() || '',
        temperatura: editingRecord.signos_vitales?.temperatura?.toString() || '',
        peso: editingRecord.signos_vitales?.peso?.toString() || '',
        talla: editingRecord.signos_vitales?.talla?.toString() || '',
        saturacion_oxigeno: editingRecord.signos_vitales?.saturacion_oxigeno?.toString() || ''
      });
      setAntecedentes({
        heredo_familiares: editingRecord.antecedentes?.heredo_familiares || '',
        personales_patologicos: editingRecord.antecedentes?.personales_patologicos || '',
        personales_no_patologicos: editingRecord.antecedentes?.personales_no_patologicos || '',
        gineco_obstetricos: editingRecord.antecedentes?.gineco_obstetricos || '',
        alergias: editingRecord.antecedentes?.alergias || []
      });
      setPadecimientoActual(editingRecord.padecimiento_actual || '');
      setExploracionFisica(editingRecord.exploracion_fisica || '');
      setDiagnosticoCIE10(editingRecord.diagnostico_cie10 || '');
      setDiagnosticoDescripcion(editingRecord.diagnostico_descripcion || '');
      setPronostico(editingRecord.pronostico || '');
      setMedicamentos(editingRecord.tratamiento || []);
      setIndicacionesGenerales(editingRecord.indicaciones_generales || '');
      setNotasPrivadas(editingRecord.notas_privadas || '');
      setMedicoNombre(editingRecord.medico_nombre || '');
      setMedicoCedula(editingRecord.medico_cedula || '');
      setMedicoEspecialidad(editingRecord.medico_especialidad || '');
    }
  }, [editingRecord, open]);

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/doctors');
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Doctores cargados:', data.doctors);
        setDoctors(data.doctors || []);
      } else {
        console.error('Error al cargar doctores:', response.status);
      }
    } catch (error) {
      console.error('Error al cargar doctores:', error);
    }
  };

  // Cuando se selecciona un doctor del dropdown
  const handleDoctorSelect = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    const doctor = doctors.find((d) => d.id === doctorId);
    if (doctor) {
      setMedicoNombre(doctor.nombre || '');
      setMedicoCedula(doctor.cedula || '');
      setMedicoEspecialidad(doctor.especialidad || '');
    }
  };

  // Función para calcular alertas de signos vitales
  const getVitalSignAlerts = () => {
    const alerts: Array<{ type: string; message: string }> = [];
    const pas = parseFloat(signosVitales.presion_arterial_sistolica);
    const pad = parseFloat(signosVitales.presion_arterial_diastolica);
    const fc = parseFloat(signosVitales.frecuencia_cardiaca);
    const temp = parseFloat(signosVitales.temperatura);

    if (pas > 140 || pad > 90) {
      alerts.push({ type: 'warning', message: '⚠️ Presión arterial elevada detectada' });
    }
    if (fc > 100) {
      alerts.push({ type: 'warning', message: '⚠️ Taquicardia detectada' });
    }
    if (fc < 60) {
      alerts.push({ type: 'info', message: 'ℹ️ Bradicardia detectada' });
    }
    if (temp > 37.5) {
      alerts.push({ type: 'warning', message: '⚠️ Temperatura elevada (fiebre)' });
    }
    
    return alerts;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data: CreateMedicalRecordDTO = {
        patient_id: patientId,
        tipo_consulta: tipoConsulta,
        signos_vitales: {
          presion_arterial_sistolica: signosVitales.presion_arterial_sistolica ? parseFloat(signosVitales.presion_arterial_sistolica) : null,
          presion_arterial_diastolica: signosVitales.presion_arterial_diastolica ? parseFloat(signosVitales.presion_arterial_diastolica) : null,
          frecuencia_cardiaca: signosVitales.frecuencia_cardiaca ? parseFloat(signosVitales.frecuencia_cardiaca) : null,
          frecuencia_respiratoria: signosVitales.frecuencia_respiratoria ? parseFloat(signosVitales.frecuencia_respiratoria) : null,
          temperatura: signosVitales.temperatura ? parseFloat(signosVitales.temperatura) : null,
          peso: signosVitales.peso ? parseFloat(signosVitales.peso) : null,
          talla: signosVitales.talla ? parseFloat(signosVitales.talla) : null,
          saturacion_oxigeno: signosVitales.saturacion_oxigeno ? parseFloat(signosVitales.saturacion_oxigeno) : null,
        },
        antecedentes: tipoConsulta === 'primera_vez' ? antecedentes : undefined,
        padecimiento_actual: padecimientoActual,
        exploracion_fisica: exploracionFisica,
        diagnostico_cie10: diagnosticoCIE10,
        diagnostico_descripcion: diagnosticoDescripcion,
        pronostico,
        tratamiento: medicamentos,
        indicaciones_generales: indicacionesGenerales,
        notas_privadas: notasPrivadas,
        medico_nombre: medicoNombre,
        medico_cedula: medicoCedula,
        medico_especialidad: medicoEspecialidad,
      };

      // Si estamos editando, usar PUT, sino POST
      const url = editingRecord 
        ? `/api/medical-records/${editingRecord.id}` 
        : '/api/medical-records';
      const method = editingRecord ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(editingRecord ? 'Consulta actualizada exitosamente' : 'Consulta registrada exitosamente');
        onSuccess();
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al registrar consulta');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar la consulta');
    } finally {
      setLoading(false);
    }
  };

  const agregarMedicamento = () => {
    setMedicamentos([...medicamentos, {
      nombre: '',
      dosis: '',
      via: 'oral',
      frecuencia: '',
      duracion: ''
    }]);
  };

  const actualizarMedicamento = (index: number, field: keyof Medicamento, value: string) => {
    const nuevos = [...medicamentos];
    nuevos[index] = { ...nuevos[index], [field]: value };
    setMedicamentos(nuevos);
  };

  const eliminarMedicamento = (index: number) => {
    setMedicamentos(medicamentos.filter((_, i) => i !== index));
  };

  const agregarAlergia = () => {
    if (nuevaAlergia.trim()) {
      setAntecedentes({
        ...antecedentes,
        alergias: [...antecedentes.alergias, nuevaAlergia.trim()]
      });
      setNuevaAlergia('');
    }
  };

  const eliminarAlergia = (index: number) => {
    setAntecedentes({
      ...antecedentes,
      alergias: antecedentes.alergias.filter((_, i) => i !== index)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {editingRecord ? '✏️ Editar Consulta' : '📝 Nueva Consulta'} - {patientName}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded ${
                  s <= step ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {/* PASO 1: Tipo de Consulta */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <FileText className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  ¿Qué tipo de consulta es?
                </h3>
                <p className="text-gray-600">
                  Selecciona el tipo de nota clínica según NOM-004
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card
                  className={`cursor-pointer transition-all ${
                    tipoConsulta === 'primera_vez'
                      ? 'border-green-500 border-2 bg-green-50'
                      : 'hover:border-green-200'
                  }`}
                  onClick={() => setTipoConsulta('primera_vez')}
                >
                  <CardContent className="p-6 text-center">
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <h4 className="font-semibold mb-2">Primera Vez</h4>
                    <p className="text-xs text-gray-600">
                      Historia clínica inicial con antecedentes completos
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all ${
                    tipoConsulta === 'evolucion'
                      ? 'border-blue-500 border-2 bg-blue-50'
                      : 'hover:border-blue-200'
                  }`}
                  onClick={() => setTipoConsulta('evolucion')}
                >
                  <CardContent className="p-6 text-center">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Activity className="h-6 w-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold mb-2">Evolución</h4>
                    <p className="text-xs text-gray-600">
                      Nota de seguimiento o control
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all ${
                    tipoConsulta === 'interconsulta'
                      ? 'border-purple-500 border-2 bg-purple-50'
                      : 'hover:border-purple-200'
                  }`}
                  onClick={() => setTipoConsulta('interconsulta')}
                >
                  <CardContent className="p-6 text-center">
                    <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Stethoscope className="h-6 w-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold mb-2">Interconsulta</h4>
                    <p className="text-xs text-gray-600">
                      Valoración por otro especialista
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* PASO 2: Signos Vitales */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Activity className="h-12 w-12 text-red-600 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Signos Vitales</h3>
                <p className="text-gray-600">Registra los signos vitales del paciente</p>
              </div>

              {/* Alertas */}
              {getVitalSignAlerts().length > 0 && (
                <div className="space-y-2">
                  {getVitalSignAlerts().map((alert, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${
                        alert.type === 'warning'
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <p className="text-sm font-medium">{alert.message}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Presión Arterial (mmHg)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Sistólica"
                      value={signosVitales.presion_arterial_sistolica}
                      onChange={(e) =>
                        setSignosVitales({
                          ...signosVitales,
                          presion_arterial_sistolica: e.target.value
                        })
                      }
                    />
                    <span className="text-2xl text-gray-400">/</span>
                    <Input
                      type="number"
                      placeholder="Diastólica"
                      value={signosVitales.presion_arterial_diastolica}
                      onChange={(e) =>
                        setSignosVitales({
                          ...signosVitales,
                          presion_arterial_diastolica: e.target.value
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>Frecuencia Cardíaca (bpm)</Label>
                  <Input
                    type="number"
                    placeholder="60-100 bpm"
                    value={signosVitales.frecuencia_cardiaca}
                    onChange={(e) =>
                      setSignosVitales({
                        ...signosVitales,
                        frecuencia_cardiaca: e.target.value
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Frecuencia Respiratoria (rpm)</Label>
                  <Input
                    type="number"
                    placeholder="12-20 rpm"
                    value={signosVitales.frecuencia_respiratoria}
                    onChange={(e) =>
                      setSignosVitales({
                        ...signosVitales,
                        frecuencia_respiratoria: e.target.value
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Temperatura (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="36.5"
                    value={signosVitales.temperatura}
                    onChange={(e) =>
                      setSignosVitales({
                        ...signosVitales,
                        temperatura: e.target.value
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Peso (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="70.5"
                    value={signosVitales.peso}
                    onChange={(e) =>
                      setSignosVitales({ ...signosVitales, peso: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>Talla (cm)</Label>
                  <Input
                    type="number"
                    placeholder="170"
                    value={signosVitales.talla}
                    onChange={(e) =>
                      setSignosVitales({ ...signosVitales, talla: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>Saturación O₂ (%)</Label>
                  <Input
                    type="number"
                    placeholder="95-100%"
                    value={signosVitales.saturacion_oxigeno}
                    onChange={(e) =>
                      setSignosVitales({
                        ...signosVitales,
                        saturacion_oxigeno: e.target.value
                      })
                    }
                  />
                </div>
              </div>

              {/* Antecedentes (solo si es primera vez) */}
              {tipoConsulta === 'primera_vez' && (
                <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-green-600" />
                    Antecedentes (Primera Consulta)
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <Label>Alergias</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          placeholder="Ej: Penicilina, Polen..."
                          value={nuevaAlergia}
                          onChange={(e) => setNuevaAlergia(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && agregarAlergia()}
                        />
                        <Button type="button" onClick={agregarAlergia} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {antecedentes.alergias.map((alergia, idx) => (
                          <Badge
                            key={idx}
                            variant="destructive"
                            className="cursor-pointer"
                            onClick={() => eliminarAlergia(idx)}
                          >
                            🚨 {alergia} <X className="h-3 w-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Antecedentes Heredo-Familiares</Label>
                      <Textarea
                        placeholder="Diabetes, hipertensión, cáncer en familiares..."
                        value={antecedentes.heredo_familiares}
                        onChange={(e) =>
                          setAntecedentes({
                            ...antecedentes,
                            heredo_familiares: e.target.value
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label>Antecedentes Personales Patológicos</Label>
                      <Textarea
                        placeholder="Enfermedades previas, cirugías, hospitalizaciones..."
                        value={antecedentes.personales_patologicos}
                        onChange={(e) =>
                          setAntecedentes({
                            ...antecedentes,
                            personales_patologicos: e.target.value
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASO 3: Diagnóstico */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Stethoscope className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Diagnóstico</h3>
                <p className="text-gray-600">Establece el diagnóstico clínico</p>
              </div>

              <div>
                <Label>Padecimiento Actual</Label>
                <Textarea
                  placeholder="Describe el motivo de consulta y la evolución del padecimiento..."
                  rows={4}
                  value={padecimientoActual}
                  onChange={(e) => setPadecimientoActual(e.target.value)}
                  className="mb-4"
                />
              </div>

              <div>
                <Label>Exploración Física</Label>
                <Textarea
                  placeholder="Hallazgos de la exploración física por aparatos y sistemas..."
                  rows={4}
                  value={exploracionFisica}
                  onChange={(e) => setExploracionFisica(e.target.value)}
                  className="mb-4"
                />
              </div>

              <div>
                <Label>Diagnóstico CIE-10</Label>
                <Select
                  value={diagnosticoCIE10}
                  onValueChange={(value) => {
                    setDiagnosticoCIE10(value);
                    const diag = diagnosticosComunes.find((d) => d.codigo === value);
                    if (diag) setDiagnosticoDescripcion(diag.descripcion);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Buscar código CIE-10..." />
                  </SelectTrigger>
                  <SelectContent>
                    {diagnosticosComunes.map((diag) => (
                      <SelectItem key={diag.codigo} value={diag.codigo}>
                        <span className="font-mono font-semibold">{diag.codigo}</span> -{' '}
                        {diag.descripcion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Descripción del Diagnóstico</Label>
                <Input
                  placeholder="O escribe tu propio diagnóstico..."
                  value={diagnosticoDescripcion}
                  onChange={(e) => setDiagnosticoDescripcion(e.target.value)}
                />
              </div>

              <div>
                <Label>Pronóstico</Label>
                <Select value={pronostico} onValueChange={setPronostico}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el pronóstico..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bueno">Bueno</SelectItem>
                    <SelectItem value="Regular">Regular</SelectItem>
                    <SelectItem value="Reservado">Reservado</SelectItem>
                    <SelectItem value="Grave">Grave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* PASO 4: Tratamiento */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Pill className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Tratamiento</h3>
                <p className="text-gray-600">Prescribe medicamentos e indicaciones</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label>Medicamentos</Label>
                  <Button type="button" onClick={agregarMedicamento} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar medicamento
                  </Button>
                </div>

                <div className="space-y-4">
                  {medicamentos.map((med, idx) => (
                    <Card key={idx} className="border-green-200 bg-green-50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-sm font-semibold text-green-800">
                            Medicamento {idx + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => eliminarMedicamento(idx)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="md:col-span-2">
                            <Label className="text-xs">Nombre del medicamento</Label>
                            <Input
                              placeholder="Ej: Paracetamol"
                              value={med.nombre}
                              onChange={(e) =>
                                actualizarMedicamento(idx, 'nombre', e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Dosis</Label>
                            <Input
                              placeholder="Ej: 500mg"
                              value={med.dosis}
                              onChange={(e) =>
                                actualizarMedicamento(idx, 'dosis', e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Vía de administración</Label>
                            <Select
                              value={med.via}
                              onValueChange={(value) => actualizarMedicamento(idx, 'via', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="oral">Oral</SelectItem>
                                <SelectItem value="intravenosa">Intravenosa</SelectItem>
                                <SelectItem value="intramuscular">Intramuscular</SelectItem>
                                <SelectItem value="subcutanea">Subcutánea</SelectItem>
                                <SelectItem value="topica">Tópica</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Frecuencia</Label>
                            <Input
                              placeholder="Ej: Cada 8 horas"
                              value={med.frecuencia}
                              onChange={(e) =>
                                actualizarMedicamento(idx, 'frecuencia', e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Duración</Label>
                            <Input
                              placeholder="Ej: 7 días"
                              value={med.duracion}
                              onChange={(e) =>
                                actualizarMedicamento(idx, 'duracion', e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {medicamentos.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Pill className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">
                        No hay medicamentos agregados. Haz clic en &quot;Agregar medicamento&quot;
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Indicaciones Generales</Label>
                <Textarea
                  placeholder="Reposo, dieta, medidas generales, citas de seguimiento..."
                  rows={3}
                  value={indicacionesGenerales}
                  onChange={(e) => setIndicacionesGenerales(e.target.value)}
                />
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-lg p-4 shadow-sm">
                <Label className="flex items-center gap-2 text-yellow-900 mb-2 text-base font-semibold">
                  📝 Notas Privadas / Recordatorios
                  <Badge variant="outline" className="text-xs bg-yellow-200 border-yellow-400">
                    Solo visible para ti
                  </Badge>
                </Label>
                <p className="text-xs text-yellow-800 mb-3">
                  Agrega recordatorios, observaciones importantes o seguimiento pendiente que solo tú verás.
                </p>
                <Textarea
                  placeholder="Ejemplo: Programar cita de control en 2 semanas, revisar resultados de laboratorio, seguimiento de medicamento..."
                  rows={3}
                  value={notasPrivadas}
                  onChange={(e) => setNotasPrivadas(e.target.value)}
                  className="bg-white border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500"
                />
              </div>
            </div>
          )}

          {/* PASO 5: Preview */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Eye className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Revisión y Datos del Médico
                </h3>
                <p className="text-gray-600">Verifica la información antes de guardar</p>
              </div>

              {/* Datos del médico */}
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Datos del Médico Tratante</h4>
                  
                  {/* Selector de doctor */}
                  {doctors.length > 0 ? (
                    <div className="mb-4">
                      <Label>Seleccionar Doctor</Label>
                      <Select value={selectedDoctorId} onValueChange={handleDoctorSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un doctor registrado" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              {doctor.nombre} {doctor.especialidad ? `- ${doctor.especialidad}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-600 mt-1">
                        O ingresa los datos manualmente a continuación
                      </p>
                    </div>
                  ) : (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-xs text-blue-900">
                        💡 No tienes doctores registrados. <a href="/dashboard/settings/doctors" target="_blank" className="underline font-medium">Agregar doctores</a>
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Nombre completo *</Label>
                      <Input
                        placeholder="Dr. Juan Pérez García"
                        value={medicoNombre}
                        onChange={(e) => setMedicoNombre(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Cédula Profesional</Label>
                      <Input
                        placeholder="1234567"
                        value={medicoCedula}
                        onChange={(e) => setMedicoCedula(e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Especialidad</Label>
                      <Input
                        placeholder="Medicina General, Cardiología..."
                        value={medicoEspecialidad}
                        onChange={(e) => setMedicoEspecialidad(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resumen */}
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Resumen de la Consulta</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-gray-600">Tipo:</span>
                      <Badge>{tipoConsulta === 'primera_vez' ? 'Primera vez' : tipoConsulta === 'evolucion' ? 'Evolución' : 'Interconsulta'}</Badge>
                    </div>
                    {diagnosticoDescripcion && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-gray-600">Diagnóstico:</span>
                        <span className="font-medium">{diagnosticoDescripcion}</span>
                      </div>
                    )}
                    {medicamentos.length > 0 && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-gray-600">Medicamentos:</span>
                        <span className="font-medium">{medicamentos.length} prescritos</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-gray-700">
                  ℹ️ Esta consulta se guardará en el expediente clínico electrónico conforme a la
                  NOM-004-SSA3-2012. Podrás exportarla a PDF después de guardar.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer con navegación */}
        <div className="p-4 border-t flex items-center justify-between bg-gray-50">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          <span className="text-sm text-gray-600">
            Paso {step} de 5
          </span>

          {step < 5 ? (
            <Button onClick={() => setStep(Math.min(5, step + 1))}>
              Siguiente
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading || !medicoNombre}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Guardando...' : 'Guardar Consulta'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
