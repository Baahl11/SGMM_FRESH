"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Stethoscope, Activity, AlertCircle, Pill } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface MedicalRecordSummaryProps {
  patientId: string;
  patientName: string;
  medicalNotes: any[];
  totalConsultations: number;
  onOpenFullRecord: () => void;
}

export function MedicalRecordSummary({
  patientId,
  patientName,
  medicalNotes,
  totalConsultations,
  onOpenFullRecord,
}: MedicalRecordSummaryProps) {
  return (
    <div className="space-y-6">
      {/* Header futurista */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-xl rounded-xl">
              <Stethoscope className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Expediente Médico Electrónico</h2>
              <p className="text-blue-100">Sistema NOM-004-SSA3-2012</p>
            </div>
          </div>
          
          <Button
            onClick={onOpenFullRecord}
            size="lg"
            className="rounded-full border border-white/50 bg-gradient-to-r from-indigo-500/50 via-fuchsia-500/40 to-cyan-400/50 px-8 py-3 text-base font-bold text-white shadow-[0_0_50px_rgba(99,102,241,0.7)] backdrop-blur transition-all hover:from-indigo-400/60 hover:via-fuchsia-400/60 hover:to-cyan-300/60 hover:shadow-[0_0_70px_rgba(99,102,241,0.9)]"
          >
            <Activity className="h-5 w-5 mr-2" />
            Abrir Expediente Completo
          </Button>
        </div>
      </div>

      {/* Notas Médicas Privadas */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
            <span className="text-xl">📝</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Notas Médicas Privadas</h3>
            <p className="text-sm text-gray-600">Solo visible para ti</p>
          </div>
        </div>

        {medicalNotes.length === 0 ? (
          <Card className="border-2 border-dashed border-yellow-300 bg-yellow-50/50">
            <CardContent className="py-8 text-center">
              <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📝</span>
              </div>
              {totalConsultations === 0 ? (
                <>
                  <h4 className="font-semibold text-gray-900 mb-2">Sin consultas médicas registradas</h4>
                  <p className="text-gray-600 mb-4">
                    Este paciente no tiene consultas médicas en su expediente
                  </p>
                  <Button
                    onClick={onOpenFullRecord}
                    className="rounded-full border border-amber-300/60 bg-amber-500/20 px-5 py-2 text-sm font-semibold text-amber-50 shadow-[0_0_35px_rgba(251,191,36,0.5)] backdrop-blur transition-all hover:bg-amber-500/30 hover:shadow-[0_0_45px_rgba(251,191,36,0.7)]"
                  >
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Crear Primera Consulta
                  </Button>
                </>
              ) : (
                <>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {totalConsultations} {totalConsultations === 1 ? 'Consulta Registrada' : 'Consultas Registradas'}
                  </h4>
                  <p className="text-gray-600 mb-4">
                    Las consultas no tienen notas privadas agregadas. Abre el expediente completo para ver todas las consultas o agregar notas.
                  </p>
                  <Button
                    onClick={onOpenFullRecord}
                    className="rounded-full border border-sky-300/60 bg-sky-500/20 px-5 py-2 text-sm font-semibold text-sky-50 shadow-[0_0_35px_rgba(59,130,246,0.5)] backdrop-blur transition-all hover:bg-sky-500/30 hover:shadow-[0_0_45px_rgba(59,130,246,0.7)]"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Ver {totalConsultations} {totalConsultations === 1 ? 'Consulta' : 'Consultas'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {medicalNotes.map((note: any) => (
              <Card
                key={note.id}
                className="border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-50 hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-yellow-400/5 to-yellow-400/0 group-hover:via-yellow-400/10 transition-all duration-500"></div>
                
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                          📝 {note.tipo_consulta === 'primera_vez' ? 'Historia Clínica' : note.tipo_consulta === 'evolucion' ? 'Evolución' : 'Interconsulta'}
                        </Badge>
                        <span className="text-sm font-medium text-gray-600">
                          {format(new Date(note.fecha_consulta), "dd 'de' MMMM, yyyy", { locale: es })}
                        </span>
                      </div>
                      
                      {note.diagnostico_descripcion && (
                        <div className="flex items-start gap-2 mb-3">
                          <Activity className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500">Diagnóstico</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {note.diagnostico_descripcion}
                              {note.diagnostico_cie10 && (
                                <span className="text-xs text-gray-500 ml-2">({note.diagnostico_cie10})</span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-yellow-200 mb-4">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {note.notas_privadas}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-yellow-200">
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Dr. {note.medico_nombre}</span>
                      {note.medico_especialidad && ` • ${note.medico_especialidad}`}
                    </div>
                    <Button
                      size="sm"
                      onClick={onOpenFullRecord}
                      className="rounded-full border border-white/20 bg-white/5 px-4 py-1 text-xs font-semibold text-blue-100 shadow-[0_0_25px_rgba(59,130,246,0.4)] backdrop-blur transition-all hover:bg-white/10 hover:shadow-[0_0_35px_rgba(59,130,246,0.6)]"
                    >
                      Ver en expediente completo →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Coming Soon - Evolución de Signos Vitales */}
      <Card className="border-2 border-dashed border-gray-300 bg-gray-50/50">
        <CardContent className="py-8 text-center">
          <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="h-8 w-8 text-gray-400" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">📊 Gráficas de Signos Vitales</h4>
          <p className="text-gray-600">Próximamente: Visualiza la evolución de PA, FC, Peso y más</p>
        </CardContent>
      </Card>
    </div>
  );
}
