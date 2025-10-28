"use client";

import { useState, useEffect } from "react";
import { MedicalRecord } from "@/types/medical-record";
import { ExecutiveSummary } from "./executive-summary";
import { ConsultationWizard } from "./consultation-wizard";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Calendar, 
  Activity, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Pill,
  Download,
  Edit,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface MedicalTimelineProps {
  patientId: string;
  patientName: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function MedicalTimeline({ 
  patientId, 
  patientName, 
  open, 
  onClose,
  onSuccess 
}: MedicalTimelineProps) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);

  // Cargar registros al abrir el modal
  useEffect(() => {
    if (open) {
      fetchRecords();
    }
  }, [open]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/medical-records?patient_id=${patientId}`);
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      }
    } catch (error) {
      console.error('Error fetching medical records:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (recordId: string) => {
    setExpandedRecords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  const handleWizardSuccess = () => {
    fetchRecords();
    setWizardOpen(false);
    setEditingRecord(null);
    onSuccess?.();
  };

  const handleEditRecord = (record: MedicalRecord) => {
    setEditingRecord(record);
    setWizardOpen(true);
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta consulta? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`/api/medical-records/${recordId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchRecords();
        onSuccess?.();
      } else {
        alert('Error al eliminar la consulta');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('Error al eliminar la consulta');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-[98vw] w-[98vw] h-[95vh] flex flex-col p-0 overflow-hidden">
          <VisuallyHidden>
            <DialogTitle>Expediente Médico - {patientName}</DialogTitle>
          </VisuallyHidden>
          
          {/* Header compacto - NO scrolleable */}
          {records.length > 0 && (
            <div className="flex-shrink-0 border-b bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
              <ExecutiveSummary records={records} patientName={patientName} />
            </div>
          )}

          {/* Timeline scrolleable */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando expediente...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Sin consultas registradas
                </h3>
                <p className="text-gray-600 mb-6">
                  Comienza el expediente médico creando la primera consulta
                </p>
                <Button onClick={() => setWizardOpen(true)} size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Crear Primera Consulta
                </Button>
              </div>
            ) : (
              <div className="relative">
                {/* Línea vertical del timeline */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-indigo-200 to-purple-200"></div>

                {/* Consultas */}
                <div className="space-y-6">
                  {records.map((record, index) => (
                    <ConsultationCard
                      key={record.id}
                      record={record}
                      isExpanded={expandedRecords.has(record.id)}
                      onToggle={() => toggleExpand(record.id)}
                      onEdit={() => handleEditRecord(record)}
                      onDelete={() => handleDeleteRecord(record.id)}
                      isFirst={index === 0}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer fijo con botón flotante */}
          {records.length > 0 && (
            <div className="p-4 border-t bg-white">
              <Button 
                onClick={() => setWizardOpen(true)} 
                size="lg" 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                ➕ Agregar Nueva Consulta
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Wizard de nueva consulta */}
      <ConsultationWizard
        open={wizardOpen}
        onClose={() => {
          setWizardOpen(false);
          setEditingRecord(null);
        }}
        patientId={patientId}
        patientName={patientName}
        onSuccess={handleWizardSuccess}
        editingRecord={editingRecord}
      />
    </>
  );
}

// Card individual de consulta
interface ConsultationCardProps {
  record: MedicalRecord;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isFirst: boolean;
}

function ConsultationCard({ record, isExpanded, onToggle, onEdit, onDelete, isFirst }: ConsultationCardProps) {
  const tipoLabels = {
    primera_vez: 'Historia Clínica Inicial',
    evolucion: 'Nota de Evolución',
    interconsulta: 'Interconsulta'
  };

  const tipoColors = {
    primera_vez: 'bg-green-100 text-green-700 border-green-300',
    evolucion: 'bg-blue-100 text-blue-700 border-blue-300',
    interconsulta: 'bg-purple-100 text-purple-700 border-purple-300'
  };

  return (
    <div className="relative pl-20">
      {/* Círculo en el timeline */}
      <div className={cn(
        "absolute left-6 top-4 w-5 h-5 rounded-full border-4 bg-white z-10",
        isFirst ? "border-blue-500 shadow-lg shadow-blue-200" : "border-gray-300"
      )}></div>

      <Card className={cn(
        "hover:shadow-lg transition-all duration-200",
        isFirst && "border-blue-200 shadow-md"
      )}>
        <CardContent className="p-6">
          {/* Header de la consulta */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <Badge className={cn("text-sm px-3 py-1", tipoColors[record.tipo_consulta])}>
                  {tipoLabels[record.tipo_consulta]}
                </Badge>
                {isFirst && (
                  <Badge variant="outline" className="text-sm px-3 py-1 bg-blue-50">
                    Más reciente
                  </Badge>
                )}
                {record.notas_privadas && (
                  <Badge variant="outline" className="text-sm px-3 py-1 bg-yellow-50 border-yellow-300 text-yellow-800">
                    📝 Con notas
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-base text-gray-600">
                <Calendar className="h-5 w-5" />
                <span className="font-medium">
                  {format(new Date(record.fecha_consulta), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                </span>
                <span className="text-gray-400">•</span>
                <span>{format(new Date(record.fecha_consulta), "HH:mm", { locale: es })} hrs</span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onToggle}
              className="ml-4"
            >
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </div>

          {/* Vista rápida (siempre visible) */}
          <div className="space-y-4">
            {/* Diagnóstico */}
            {record.diagnostico_descripcion && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">Diagnóstico</p>
                  <p className="text-base font-semibold text-gray-900">
                    {record.diagnostico_descripcion}
                    {record.diagnostico_cie10 && (
                      <span className="text-sm text-gray-500 ml-2">({record.diagnostico_cie10})</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Signos vitales en línea */}
            <div className="flex flex-wrap gap-4 text-sm">
              {record.signos_vitales.presion_arterial_sistolica && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg">
                  <span className="text-gray-600">PA:</span>
                  <span className="font-medium text-gray-900">
                    {record.signos_vitales.presion_arterial_sistolica}/{record.signos_vitales.presion_arterial_diastolica}
                  </span>
                </div>
              )}
              {record.signos_vitales.frecuencia_cardiaca && (
                <div className="flex items-center gap-2 px-3 py-2 bg-pink-50 rounded-lg">
                  <span className="text-gray-600">FC:</span>
                  <span className="font-medium text-gray-900">{record.signos_vitales.frecuencia_cardiaca} bpm</span>
                </div>
              )}
              {record.signos_vitales.temperatura && (
                <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg">
                  <span className="text-gray-600">Temp:</span>
                  <span className="font-medium text-gray-900">{record.signos_vitales.temperatura}°C</span>
                </div>
              )}
              {record.signos_vitales.peso && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                  <span className="text-gray-600">Peso:</span>
                  <span className="font-medium text-gray-900">{record.signos_vitales.peso} kg</span>
                </div>
              )}
            </div>
          </div>

          {/* Detalles expandibles */}
          {isExpanded && (
            <div className="mt-6 pt-6 border-t">
              {/* Grid de 2 columnas para aprovechar el ancho */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Columna izquierda */}
                <div className="space-y-5">
                  {/* Padecimiento actual */}
                  {record.padecimiento_actual && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Padecimiento Actual</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{record.padecimiento_actual}</p>
                    </div>
                  )}

                  {/* Exploración física */}
                  {record.exploracion_fisica && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Exploración Física</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{record.exploracion_fisica}</p>
                    </div>
                  )}

                  {/* Pronóstico */}
                  {record.pronostico && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Pronóstico</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{record.pronostico}</p>
                    </div>
                  )}
                </div>

                {/* Columna derecha */}
                <div className="space-y-5">
                  {/* Tratamiento */}
                  {record.tratamiento.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">💊 Tratamiento Prescrito</p>
                      <div className="space-y-2">
                        {record.tratamiento.map((med, idx) => (
                          <div key={idx} className="text-xs bg-green-50 p-2 rounded border border-green-200">
                            <p className="font-medium text-gray-900">{med.nombre}</p>
                            <p className="text-gray-600">
                              {med.dosis} • {med.via} • {med.frecuencia} • {med.duracion}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Indicaciones generales */}
                  {record.indicaciones_generales && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Indicaciones Generales</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{record.indicaciones_generales}</p>
                    </div>
                  )}

                  {/* Notas privadas / Recordatorios */}
                  {record.notas_privadas && (
                    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-lg p-4 shadow-sm">
                      <p className="text-sm font-bold text-yellow-900 mb-2 flex items-center gap-2">
                        📝 Notas Privadas / Recordatorios
                        <Badge variant="outline" className="text-xs bg-yellow-200 border-yellow-400">
                          Solo para ti
                        </Badge>
                      </p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{record.notas_privadas}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Médico - Fuera del grid, abajo */}
              <div className="pt-5 mt-5 border-t">
                <p className="text-xs text-gray-500">
                  Atendido por: <span className="font-medium text-gray-900">{record.medico_nombre}</span>
                  {record.medico_cedula && ` • Cédula: ${record.medico_cedula}`}
                  {record.medico_especialidad && ` • ${record.medico_especialidad}`}
                </p>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm">
                  <Download className="h-3 w-3 mr-1" />
                  Exportar PDF
                </Button>
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={onDelete}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Eliminar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
