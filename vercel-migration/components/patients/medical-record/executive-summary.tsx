"use client";

import { MedicalRecord } from "@/types/medical-record";
import { Activity, AlertTriangle, Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ExecutiveSummaryProps {
  records: MedicalRecord[];
  patientName: string;
}

export function ExecutiveSummary({ records, patientName }: ExecutiveSummaryProps) {
  if (records.length === 0) {
    return null; // No mostrar nada si no hay registros
  }

  const ultimaConsulta = records[0]; // Ya viene ordenado por fecha DESC

  return (
    <div className="space-y-3">
      {/* Header compacto */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            📋 {patientName}
          </h2>
          <p className="text-xs text-gray-600">
            {records.length} {records.length === 1 ? 'consulta registrada' : 'consultas registradas'}
          </p>
        </div>
        <Badge variant="outline" className="bg-white text-xs">
          NOM-004-SSA3-2012
        </Badge>
      </div>

      {/* Info compacta en una línea */}
      <div className="flex gap-3 text-xs">
        <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 rounded-lg">
          <Calendar className="h-3 w-3 text-blue-600" />
          <span className="font-medium text-blue-900">
            Última: {format(new Date(ultimaConsulta.fecha_consulta), "dd/MMM/yy", { locale: es })}
          </span>
        </div>
        {ultimaConsulta.diagnostico_descripcion && (
          <div className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 rounded-lg flex-1 min-w-0">
            <Activity className="h-3 w-3 text-purple-600 flex-shrink-0" />
            <span className="font-medium text-purple-900 truncate" title={ultimaConsulta.diagnostico_descripcion}>
              {ultimaConsulta.diagnostico_descripcion}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Funciones auxiliares
function getAllergies(records: MedicalRecord[]): string[] {
  const alergias = new Set<string>();
  records.forEach(record => {
    if (record.antecedentes?.alergias) {
      record.antecedentes.alergias.forEach(a => alergias.add(a));
    }
  });
  return Array.from(alergias);
}

function getChronicConditions(records: MedicalRecord[]): string[] {
  const condicionesCronicas = ['diabetes', 'hipertension', 'asma', 'artritis', 'hipotiroidismo'];
  const encontradas = new Set<string>();
  
  records.forEach(record => {
    const diagnostico = record.diagnostico_descripcion?.toLowerCase() || '';
    condicionesCronicas.forEach(condicion => {
      if (diagnostico.includes(condicion)) {
        encontradas.add(record.diagnostico_descripcion || condicion);
      }
    });
  });
  
  return Array.from(encontradas).slice(0, 5);
}

function getRecentVitalSigns(records: MedicalRecord[]) {
  return records
    .filter(r => r.signos_vitales)
    .map(r => ({
      fecha: r.fecha_consulta,
      presion_arterial: r.signos_vitales.presion_arterial_sistolica && r.signos_vitales.presion_arterial_diastolica
        ? `${r.signos_vitales.presion_arterial_sistolica}/${r.signos_vitales.presion_arterial_diastolica}`
        : null,
      frecuencia_cardiaca: r.signos_vitales.frecuencia_cardiaca,
      temperatura: r.signos_vitales.temperatura,
    }))
    .filter(sv => sv.presion_arterial || sv.frecuencia_cardiaca || sv.temperatura);
}
