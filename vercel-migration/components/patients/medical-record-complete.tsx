/**
 * MedicalRecordComplete Component
 * Complete electronic medical record with NOM-004-SSA3-2012 compliance
 * Uses Accordion sections to organize information (NOT nested tabs)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  User, 
  Heart, 
  Pill, 
  AlertTriangle, 
  FileText, 
  Stethoscope,
  Calendar,
  Activity,
  Syringe,
  ClipboardList,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { 
  MedicalHistory, 
  PatientAllergy, 
  CurrentMedication,
  PatientDemographics,
} from '@/lib/types/medical-history';

interface MedicalRecordCompleteProps {
  patientId: string;
  patientName: string;
  patientData?: PatientDemographics;
  medicalHistory?: MedicalHistory;
  allergies: PatientAllergy[];
  medications: CurrentMedication[];
  medicalNotes: any[]; // Timeline de consultas
  totalConsultations: number;
}

export function MedicalRecordComplete({
  patientId,
  patientName,
  patientData,
  medicalHistory,
  allergies,
  medications,
  medicalNotes,
  totalConsultations,
}: MedicalRecordCompleteProps) {
  // Default: Consultas open, others can be expanded by user
  const [activeSections, setActiveSections] = useState<string[]>(['consultas']);

  return (
    <div className="space-y-4">
      {/* Header con NOM-004 */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Expediente Médico Electrónico
              </h2>
              <p className="text-blue-100 text-sm">
                NOM-004-SSA3-2012 • Sistema de Gestión Médica
              </p>
            </div>
            {/* Botón "Abrir Completo" removido - todo está aquí */}
          </div>
        </div>

        {/* Accordion Sections */}
        <div className="p-6">
          <Accordion 
            type="multiple" 
            value={activeSections}
            onValueChange={setActiveSections}
            className="space-y-3"
          >
            {/* 1. DATOS DEMOGRÁFICOS */}
            <AccordionItem value="demograficos" className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Datos Demográficos</div>
                    <div className="text-xs text-gray-500">
                      Información personal del paciente
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <DemographicSection 
                  patientData={patientData}
                />
              </AccordionContent>
            </AccordionItem>

            {/* 2. HISTORIA CLÍNICA */}
            <AccordionItem value="historia" className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Historia Clínica Completa</div>
                    <div className="text-xs text-gray-500">
                      Antecedentes heredo-familiares, personales y gineco-obstétricos
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <MedicalHistorySection 
                  medicalHistory={medicalHistory}
                />
              </AccordionContent>
            </AccordionItem>

            {/* 3. ALERGIAS */}
            <AccordionItem value="alergias" className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Alergias</div>
                    <div className="text-xs text-gray-500">
                      {allergies.length > 0 
                        ? `${allergies.length} alergia${allergies.length > 1 ? 's' : ''} registrada${allergies.length > 1 ? 's' : ''}`
                        : 'Sin alergias registradas'
                      }
                    </div>
                  </div>
                  {allergies.length > 0 && (
                    <Badge variant="destructive" className="ml-auto mr-2">
                      {allergies.length}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <AllergiesSection 
                  allergies={allergies}
                />
              </AccordionContent>
            </AccordionItem>

            {/* 4. MEDICAMENTOS ACTUALES */}
            <AccordionItem value="medicamentos" className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Pill className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Medicamentos Actuales</div>
                    <div className="text-xs text-gray-500">
                      {medications.filter(m => m.activo).length > 0
                        ? `${medications.filter(m => m.activo).length} medicamento${medications.filter(m => m.activo).length > 1 ? 's' : ''} activo${medications.filter(m => m.activo).length > 1 ? 's' : ''}`
                        : 'Sin medicamentos activos'
                      }
                    </div>
                  </div>
                  {medications.filter(m => m.activo).length > 0 && (
                    <Badge variant="secondary" className="ml-auto mr-2">
                      {medications.filter(m => m.activo).length}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <MedicationsSection 
                  medications={medications}
                />
              </AccordionContent>
            </AccordionItem>

            {/* 5. CONSULTAS Y EVOLUCIÓN */}
            <AccordionItem value="consultas" className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Consultas y Evolución</div>
                    <div className="text-xs text-gray-500">
                      {totalConsultations} consulta{totalConsultations !== 1 ? 's' : ''} registrada{totalConsultations !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-auto mr-2">
                    {totalConsultations}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <ConsultationsTimeline 
                  medicalNotes={medicalNotes}
                  totalConsultations={totalConsultations}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </Card>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS (Sections)
// ============================================

function DemographicSection({ 
  patientData
}: { 
  patientData?: PatientDemographics;
}) {
  if (!patientData || Object.keys(patientData).length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No hay datos demográficos adicionales registrados</p>
        <p className="text-xs text-gray-400 mt-2">La información básica está en la ficha principal</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {patientData.domicilio && (
          <DataField label="Domicilio" value={patientData.domicilio} />
        )}
        {patientData.estado_civil && (
          <DataField label="Estado Civil" value={patientData.estado_civil} />
        )}
        {patientData.ocupacion && (
          <DataField label="Ocupación" value={patientData.ocupacion} />
        )}
        {patientData.lugar_nacimiento && (
          <DataField label="Lugar de Nacimiento" value={patientData.lugar_nacimiento} />
        )}
        {patientData.religion && (
          <DataField label="Religión" value={patientData.religion} />
        )}
      </div>
    </div>
  );
}

function MedicalHistorySection({ 
  medicalHistory
}: { 
  medicalHistory?: MedicalHistory;
}) {
  if (!medicalHistory) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No hay historia clínica registrada</p>
        <p className="text-xs text-gray-400 mt-2">La información se completará en consultas futuras</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Antecedentes Heredo-Familiares */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Heart className="w-4 h-4" />
          Antecedentes Heredo-Familiares
        </h4>
        <div className="space-y-2 pl-6">
          {medicalHistory.diabetes_familiar && <CheckItem label="Diabetes Mellitus" />}
          {medicalHistory.hipertension_familiar && <CheckItem label="Hipertensión Arterial" />}
          {medicalHistory.cancer_familiar && <CheckItem label="Cáncer" />}
          {medicalHistory.cardiopatias_familiar && <CheckItem label="Cardiopatías" />}
          {medicalHistory.otros_familiares && (
            <DataField label="Otros" value={medicalHistory.otros_familiares} />
          )}
          {medicalHistory.antecedentes_heredofamiliares && (
            <DataField label="Detalles" value={medicalHistory.antecedentes_heredofamiliares} />
          )}
        </div>
      </div>

      {/* Antecedentes Personales No Patológicos */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Antecedentes Personales No Patológicos
        </h4>
        <div className="space-y-2 pl-6">
          {medicalHistory.tabaquismo && (
            <CheckItem 
              label="Tabaquismo" 
              details={medicalHistory.tabaquismo_detalles}
            />
          )}
          {medicalHistory.alcoholismo && (
            <CheckItem 
              label="Alcoholismo" 
              details={medicalHistory.alcoholismo_detalles}
            />
          )}
          {medicalHistory.drogas && (
            <CheckItem 
              label="Drogas" 
              details={medicalHistory.drogas_detalles}
            />
          )}
          {medicalHistory.ejercicio && (
            <DataField label="Ejercicio" value={medicalHistory.ejercicio} />
          )}
          {medicalHistory.alimentacion && (
            <DataField label="Alimentación" value={medicalHistory.alimentacion} />
          )}
          {medicalHistory.higiene && (
            <DataField label="Higiene" value={medicalHistory.higiene} />
          )}
        </div>
      </div>

      {/* Antecedentes Personales Patológicos */}
      {medicalHistory.antecedentes_patologicos && (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Antecedentes Personales Patológicos
          </h4>
          <div className="space-y-2 pl-6">
            <DataField label="Detalles" value={medicalHistory.antecedentes_patologicos} />
            {medicalHistory.hospitalizaciones_previas && (
              <DataField label="Hospitalizaciones" value={medicalHistory.hospitalizaciones_previas} />
            )}
            {medicalHistory.cirugias_previas && (
              <DataField label="Cirugías" value={medicalHistory.cirugias_previas} />
            )}
            {medicalHistory.traumatismos && (
              <DataField label="Traumatismos" value={medicalHistory.traumatismos} />
            )}
            {medicalHistory.transfusiones && (
              <DataField label="Transfusiones" value={medicalHistory.transfusiones} />
            )}
          </div>
        </div>
      )}

      {/* Antecedentes Gineco-Obstétricos */}
      {(medicalHistory.menarca || medicalHistory.gestaciones) && (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Antecedentes Gineco-Obstétricos
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pl-6">
            {medicalHistory.menarca && (
              <DataField label="Menarca" value={`${medicalHistory.menarca} años`} />
            )}
            {medicalHistory.gestaciones !== undefined && (
              <DataField label="Gestaciones" value={medicalHistory.gestaciones.toString()} />
            )}
            {medicalHistory.partos !== undefined && (
              <DataField label="Partos" value={medicalHistory.partos.toString()} />
            )}
            {medicalHistory.cesareas !== undefined && (
              <DataField label="Cesáreas" value={medicalHistory.cesareas.toString()} />
            )}
            {medicalHistory.abortos !== undefined && (
              <DataField label="Abortos" value={medicalHistory.abortos.toString()} />
            )}
            {medicalHistory.metodo_anticonceptivo && (
              <DataField label="Método Anticonceptivo" value={medicalHistory.metodo_anticonceptivo} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AllergiesSection({ 
  allergies
}: { 
  allergies: PatientAllergy[];
}) {
  if (allergies.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No hay alergias registradas</p>
        <p className="text-xs text-gray-400 mt-2">Se documenta ausencia de alergias conocidas</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {allergies.map((allergy) => (
        <Card key={allergy.id} className="p-4 border-l-4 border-l-red-500">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="destructive">{allergy.tipo_alergia}</Badge>
                {allergy.severidad && (
                  <Badge variant="outline" className={getSeveridadColor(allergy.severidad)}>
                    {allergy.severidad}
                  </Badge>
                )}
              </div>
              <h5 className="font-semibold text-lg">{allergy.alergeno}</h5>
              {allergy.reaccion && (
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Reacción:</span> {allergy.reaccion}
                </p>
              )}
              {allergy.notas && (
                <p className="text-sm text-gray-500 mt-1">{allergy.notas}</p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function MedicationsSection({ 
  medications
}: { 
  medications: CurrentMedication[];
}) {
  const activeMeds = medications.filter(m => m.activo);
  
  if (activeMeds.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Pill className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No hay medicamentos activos</p>
        <p className="text-xs text-gray-400 mt-2">Sin tratamiento farmacológico actual</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeMeds.map((med) => (
        <Card key={med.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <Pill className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h5 className="font-semibold text-lg">{med.medicamento}</h5>
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                <DataField label="Dosis" value={med.dosis} />
                <DataField label="Frecuencia" value={med.frecuencia} />
                {med.via_administracion && (
                  <DataField label="Vía" value={med.via_administracion} />
                )}
                {med.indicacion && (
                  <div className="col-span-2">
                    <DataField label="Indicación" value={med.indicacion} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function ConsultationsTimeline({ 
  medicalNotes, 
  totalConsultations 
}: { 
  medicalNotes: any[]; 
  totalConsultations: number;
}) {
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  const toggleNote = (noteId: string) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  if (medicalNotes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm mb-3">No hay consultas registradas</p>
        <p className="text-xs text-gray-400">
          Las consultas aparecerán aquí después de cada cita médica
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {medicalNotes.map((note, index) => {
        const noteId = note.id || `note-${index}`;
        const isExpanded = expandedNotes.has(noteId);
        
        return (
          <Card 
            key={noteId} 
            className="overflow-hidden hover:shadow-md transition-all cursor-pointer"
            onClick={() => toggleNote(noteId)}
          >
            <div className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {note.tipo_consulta && (
                        <Badge variant="outline">{note.tipo_consulta}</Badge>
                      )}
                      {note.fecha_consulta && (
                        <span className="text-sm text-gray-500">
                          {format(new Date(note.fecha_consulta), "d 'de' MMMM, yyyy", { locale: es })}
                        </span>
                      )}
                    </div>
                    <ChevronRight 
                      className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </div>

                  {/* Vista Previa - Siempre visible */}
                  {note.diagnostico && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">
                        {note.diagnostico}
                      </p>
                    </div>
                  )}

                  {/* Contenido Expandible */}
                  {isExpanded && (
                    <div className="mt-4 space-y-3 animate-in slide-in-from-top-2">
                      {/* Diagnóstico Completo */}
                      {note.diagnostico && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Stethoscope className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-medium text-blue-600">Diagnóstico:</span>
                              <p className="text-sm font-medium text-gray-900 mt-1">{note.diagnostico}</p>
                              {note.cie10_code && (
                                <p className="text-xs text-gray-500 mt-1">CIE-10: {note.cie10_code}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Plan de Tratamiento */}
                      {note.plan_tratamiento && (
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="flex items-start gap-2">
                            <ClipboardList className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-medium text-green-600">Plan de Tratamiento:</span>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap mt-1">{note.plan_tratamiento}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Notas Privadas */}
                      {note.notas_privadas && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <span className="text-xs font-medium text-gray-600">Notas Privadas:</span>
                          <div className="text-sm text-gray-700 whitespace-pre-wrap mt-1">
                            {note.notas_privadas}
                          </div>
                        </div>
                      )}

                      {/* Signos Vitales */}
                      {(note.presion_arterial || note.frecuencia_cardiaca || note.temperatura || note.peso) && (
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <span className="text-xs font-medium text-purple-600 mb-2 block">Signos Vitales:</span>
                          <div className="flex flex-wrap gap-4">
                            {note.presion_arterial && (
                              <div className="flex items-center gap-1 text-xs">
                                <Activity className="w-3 h-3 text-red-500" />
                                <span className="text-gray-600">PA:</span>
                                <span className="font-medium">{note.presion_arterial}</span>
                              </div>
                            )}
                            {note.frecuencia_cardiaca && (
                              <div className="flex items-center gap-1 text-xs">
                                <Heart className="w-3 h-3 text-pink-500" />
                                <span className="text-gray-600">FC:</span>
                                <span className="font-medium">{note.frecuencia_cardiaca} bpm</span>
                              </div>
                            )}
                            {note.temperatura && (
                              <div className="flex items-center gap-1 text-xs">
                                <span className="text-gray-600">Temp:</span>
                                <span className="font-medium">{note.temperatura}°C</span>
                              </div>
                            )}
                            {note.peso && (
                              <div className="flex items-center gap-1 text-xs">
                                <span className="text-gray-600">Peso:</span>
                                <span className="font-medium">{note.peso} kg</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Footer con médico */}
                      {note.medico && (
                        <div className="pt-3 border-t text-xs text-gray-500">
                          <span className="font-medium">Médico:</span> {note.medico}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================

function DataField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  );
}

function CheckItem({ label, details }: { label: string; details?: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <div className="w-2 h-2 rounded-full bg-green-600" />
      </div>
      <div>
        <span className="text-sm font-medium">{label}</span>
        {details && <p className="text-xs text-gray-500 mt-1">{details}</p>}
      </div>
    </div>
  );
}

function getSeveridadColor(severidad: string): string {
  switch (severidad) {
    case 'leve':
      return 'text-green-600 border-green-600';
    case 'moderada':
      return 'text-yellow-600 border-yellow-600';
    case 'severa':
      return 'text-orange-600 border-orange-600';
    case 'anafilaxia':
      return 'text-red-600 border-red-600';
    default:
      return 'text-gray-600';
  }
}
