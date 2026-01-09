/**
 * MedicalRecordComplete Component
 * Complete electronic medical record with NOM-004-SSA3-2012 compliance
 * Uses Accordion sections to organize information (NOT nested tabs)
 */

'use client';

import React, { useMemo, useState } from 'react';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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
  Stethoscope,
  Calendar,
  Activity,
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
import type { Antecedentes, MedicalRecord, Medicamento } from '@/types/medical-record';

type NoteMedication = Medicamento & {
  medicamento?: string;
  via_administracion?: string;
  indicacion?: string;
  activo?: boolean;
};

type MedicalNote = MedicalRecord & {
  plan_tratamiento?: string;
  cie10_code?: string;
  notasPrivadas?: string;
  medico?: string;
  medicoEspecialidad?: string;
  presion_arterial?: string;
  presion_arterial_sistolica?: number;
  presion_arterial_diastolica?: number;
  frecuencia_cardiaca?: number;
  temperatura?: number;
  peso?: number;
  saturacion_oxigeno?: number;
  talla?: number;
  tratamiento?: NoteMedication[];
  antecedentes?: Antecedentes & { alergias?: string[] };
};

interface MedicalRecordCompleteProps {
  patientId: string;
  patientData?: PatientDemographics;
  medicalHistory?: MedicalHistory;
  allergies: PatientAllergy[];
  medications: CurrentMedication[];
  medicalNotes: MedicalNote[];
  totalConsultations: number;
  onOpenTimeline?: () => void;
  onCreateConsultation?: () => void;
}

export function MedicalRecordComplete({
  patientId,
  patientData,
  medicalHistory,
  allergies,
  medications,
  medicalNotes,
  totalConsultations,
  onOpenTimeline,
  onCreateConsultation,
}: MedicalRecordCompleteProps) {
  // Default: Consultas open, others can be expanded by user
  const [activeSections, setActiveSections] = useState<string[]>(['consultas']);

  const sortedNotes = useMemo<MedicalNote[]>(() => {
    const notesArray = Array.isArray(medicalNotes) ? medicalNotes : [];
    return [...notesArray].sort((a, b) => {
      const dateA = new Date(a?.fecha_consulta ?? a?.created_at ?? 0).getTime();
      const dateB = new Date(b?.fecha_consulta ?? b?.created_at ?? 0).getTime();
      return dateB - dateA;
    });
  }, [medicalNotes]);

  const latestNote = sortedNotes[0];

  const antecedentesFallback = useMemo<Antecedentes | undefined>(() => {
    if (!latestNote?.antecedentes) {
      return undefined;
    }
    return latestNote.antecedentes;
  }, [latestNote]);

  const resolvedAllergies = useMemo<PatientAllergy[]>(() => {
    if (Array.isArray(allergies) && allergies.length > 0) {
      return allergies;
    }
    if (!antecedentesFallback?.alergias || antecedentesFallback.alergias.length === 0) {
      return [];
    }

    const timestamp = latestNote?.fecha_consulta ?? latestNote?.created_at ?? new Date().toISOString();

    return antecedentesFallback.alergias
      .filter((alergia) => typeof alergia === 'string' && alergia.trim().length > 0)
      .map((alergia, index) => ({
        id: `${latestNote?.id ?? 'note'}-alergia-${index}`,
        patient_id: patientId,
        user_id: latestNote?.user_id ?? '',
        tipo_alergia: 'otro',
        alergeno: alergia,
        severidad: undefined,
        reaccion: undefined,
        notas: undefined,
        fecha_descubrimiento: timestamp,
        created_at: timestamp,
        updated_at: timestamp,
      }));
  }, [allergies, antecedentesFallback, latestNote, patientId]);

  const resolvedMedications = useMemo<CurrentMedication[]>(() => {
    if (Array.isArray(medications) && medications.length > 0) {
      return medications;
    }

    const tratamientos: NoteMedication[] = Array.isArray(latestNote?.tratamiento)
      ? (latestNote.tratamiento as NoteMedication[])
      : [];
    if (tratamientos.length === 0) {
      return [];
    }

    const baseTimestamp = latestNote?.fecha_consulta ?? latestNote?.created_at ?? new Date().toISOString();

    return tratamientos
      .filter((med) => med && (med.nombre || med.medicamento))
      .map((med, index) => ({
        id: `${latestNote?.id ?? 'note'}-med-${index}`,
        patient_id: patientId,
        user_id: latestNote?.user_id ?? '',
        medicamento: med.nombre ?? med.medicamento ?? '',
        dosis: med.dosis ?? '',
        frecuencia: med.frecuencia ?? '',
        via_administracion: med.via ?? med.via_administracion ?? undefined,
        indicacion: med.duracion ?? med.indicacion ?? undefined,
        fecha_inicio: baseTimestamp,
        activo: med.activo ?? true,
        created_at: baseTimestamp,
        updated_at: baseTimestamp,
      }));
  }, [medications, latestNote, patientId]);

  const consultationsCount = totalConsultations || sortedNotes.length;
  const activeMedicationCount = resolvedMedications.filter((med) => med.activo).length;
  const allergyCount = resolvedAllergies.length;

  return (
    <div className="space-y-6 text-white">
      {/* Header con NOM-004 */}
      <GlassPanel className="overflow-hidden border-white/15 bg-gradient-to-r from-indigo-500/40 via-purple-500/30 to-blue-500/30 p-6 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Expediente Médico Electrónico</h2>
            <p className="text-sm text-white/80">NOM-004-SSA3-2012 • Sistema de Gestión Médica</p>
          </div>
          {(onOpenTimeline || onCreateConsultation) && (
            <div className="flex flex-wrap gap-3">
              {onCreateConsultation && (
                <Button
                  size="sm"
                  className="rounded-full border border-white/30 bg-white/10 px-6 py-2 text-sm font-semibold text-white shadow-[0_0_40px_rgba(139,92,246,0.6)] backdrop-blur transition-all hover:border-white/50 hover:bg-white/20 hover:shadow-[0_0_50px_rgba(139,92,246,0.8)]"
                  onClick={onCreateConsultation}
                >
                  Registrar consulta
                </Button>
              )}
              {onOpenTimeline && (
                <Button
                  size="sm"
                  className="rounded-full border border-white/40 bg-gradient-to-r from-indigo-500/50 via-purple-500/50 to-cyan-400/50 px-6 py-2 text-sm font-bold text-white shadow-[0_0_50px_rgba(99,102,241,0.7)] backdrop-blur transition-all hover:from-indigo-400/60 hover:via-purple-400/60 hover:to-cyan-300/60 hover:shadow-[0_0_60px_rgba(99,102,241,0.9)]"
                  onClick={onOpenTimeline}
                >
                  Ver expediente completo
                </Button>
              )}
            </div>
          )}
        </div>
      </GlassPanel>

      {/* Accordion Sections */}
      <GlassPanel className="border-white/10 bg-white/5 p-0">
        <div className="p-6">
          <Accordion 
            type="multiple" 
            value={activeSections}
            onValueChange={setActiveSections}
            className="space-y-4"
          >
            {/* 1. DATOS DEMOGRÁFICOS */}
            <AccordionItem value="demograficos" className="rounded-2xl border border-white/10 bg-white/5">
              <AccordionTrigger className="px-4 text-white hover:no-underline hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Datos Demográficos</div>
                    <div className="text-xs text-white/60">Información personal del paciente</div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-white">
                <DemographicSection 
                  patientData={patientData}
                />
              </AccordionContent>
            </AccordionItem>

            {/* 2. HISTORIA CLÍNICA */}
            <AccordionItem value="historia" className="rounded-2xl border border-white/10 bg-white/5">
              <AccordionTrigger className="px-4 text-white hover:no-underline hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Historia Clínica Completa</div>
                    <div className="text-xs text-white/60">Antecedentes heredo-familiares, personales y gineco-obstétricos</div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-white">
                <MedicalHistorySection 
                  medicalHistory={medicalHistory}
                  antecedentesFallback={antecedentesFallback}
                />
              </AccordionContent>
            </AccordionItem>

            {/* 3. ALERGIAS */}
            <AccordionItem value="alergias" className="rounded-2xl border border-white/10 bg-white/5">
              <AccordionTrigger className="px-4 text-white hover:no-underline hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Alergias</div>
                    <div className="text-xs text-white/60">
                      {allergyCount > 0 
                        ? `${allergyCount} alergia${allergyCount > 1 ? 's' : ''} registrada${allergyCount > 1 ? 's' : ''}`
                        : 'Sin alergias registradas'
                      }
                    </div>
                  </div>
                  {allergyCount > 0 && (
                    <Badge variant="destructive" className="ml-auto mr-2">
                      {allergyCount}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-white">
                <AllergiesSection 
                  allergies={resolvedAllergies}
                />
              </AccordionContent>
            </AccordionItem>

            {/* 4. MEDICAMENTOS ACTUALES */}
            <AccordionItem value="medicamentos" className="rounded-2xl border border-white/10 bg-white/5">
              <AccordionTrigger className="px-4 text-white hover:no-underline hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Medicamentos Actuales</div>
                    <div className="text-xs text-white/60">
                      {activeMedicationCount > 0
                        ? `${activeMedicationCount} medicamento${activeMedicationCount > 1 ? 's' : ''} activo${activeMedicationCount > 1 ? 's' : ''}`
                        : 'Sin medicamentos activos'
                      }
                    </div>
                  </div>
                  {activeMedicationCount > 0 && (
                    <Badge variant="secondary" className="ml-auto mr-2">
                      {activeMedicationCount}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-white">
                <MedicationsSection 
                  medications={resolvedMedications}
                />
              </AccordionContent>
            </AccordionItem>

            {/* 5. CONSULTAS Y EVOLUCIÓN */}
            <AccordionItem value="consultas" className="rounded-2xl border border-white/10 bg-white/5">
              <AccordionTrigger className="px-4 text-white hover:no-underline hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Consultas y Evolución</div>
                    <div className="text-xs text-white/60">
                      {consultationsCount} consulta{consultationsCount !== 1 ? 's' : ''} registrada{consultationsCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  {consultationsCount > 0 && (
                    <Badge variant="outline" className="ml-auto mr-2">
                      {consultationsCount}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-white">
                <ConsultationsTimeline 
                  medicalNotes={sortedNotes}
                  totalConsultations={consultationsCount}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </GlassPanel>
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
  medicalHistory,
  antecedentesFallback,
}: { 
  medicalHistory?: MedicalHistory;
  antecedentesFallback?: Antecedentes;
}) {
  if (!medicalHistory && !antecedentesFallback) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No hay historia clínica registrada</p>
        <p className="text-xs text-gray-400 mt-2">La información se completará en consultas futuras</p>
      </div>
    );
  }

  if (!medicalHistory && antecedentesFallback) {
    return (
      <div className="space-y-6">
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-800">
          Información tomada de la última historia clínica registrada en consultas.
        </div>

        {antecedentesFallback.heredo_familiares && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Antecedentes Heredo-Familiares
            </h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap border rounded-lg p-3 bg-white">
              {antecedentesFallback.heredo_familiares}
            </p>
          </div>
        )}

        {antecedentesFallback.personales_no_patologicos && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Antecedentes Personales No Patológicos
            </h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap border rounded-lg p-3 bg-white">
              {antecedentesFallback.personales_no_patologicos}
            </p>
          </div>
        )}

        {antecedentesFallback.personales_patologicos && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Antecedentes Personales Patológicos
            </h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap border rounded-lg p-3 bg-white">
              {antecedentesFallback.personales_patologicos}
            </p>
          </div>
        )}

        {antecedentesFallback.gineco_obstetricos && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Antecedentes Gineco-Obstétricos
            </h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap border rounded-lg p-3 bg-white">
              {antecedentesFallback.gineco_obstetricos}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (!medicalHistory) {
    return null;
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
      <div className="py-8 text-center text-white/60">
        <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-white/40" />
        <p className="text-sm">No hay alergias registradas</p>
        <p className="mt-2 text-xs text-white/50">Se documenta ausencia de alergias conocidas</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {allergies.map((allergy) => (
        <GlassPanel key={allergy.id} className="border border-rose-400/40 bg-rose-500/5 p-4 text-white">
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
                <p className="mt-1 text-sm text-white/70">
                  <span className="font-medium">Reacción:</span> {allergy.reaccion}
                </p>
              )}
              {allergy.notas && (
                <p className="mt-1 text-sm text-white/60">{allergy.notas}</p>
              )}
            </div>
          </div>
        </GlassPanel>
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
      <div className="py-8 text-center text-white/60">
        <Pill className="mx-auto mb-3 h-12 w-12 text-white/40" />
        <p className="text-sm">No hay medicamentos activos</p>
        <p className="mt-2 text-xs text-white/50">Sin tratamiento farmacológico actual</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeMeds.map((med) => (
        <GlassPanel key={med.id} className="border-white/10 bg-white/5 p-4 text-white">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10">
              <Pill className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h5 className="font-semibold text-lg">{med.medicamento}</h5>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
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
        </GlassPanel>
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
  const tipoLabels: Record<string, string> = {
    primera_vez: 'Historia Clínica Inicial',
    evolucion: 'Nota de Evolución',
    interconsulta: 'Interconsulta',
  };
  const tipoBadgeClasses: Record<string, string> = {
    primera_vez: 'bg-green-100 text-green-700 border-green-300',
    evolucion: 'bg-blue-100 text-blue-700 border-blue-300',
    interconsulta: 'bg-purple-100 text-purple-700 border-purple-300',
  };

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
      <div className="py-8 text-center text-white/60">
        <Stethoscope className="mx-auto mb-3 h-12 w-12 text-white/40" />
        <p className="mb-3 text-sm">No hay consultas registradas</p>
        <p className="text-xs text-white/50">
          Las consultas aparecerán aquí después de cada cita médica
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {medicalNotes.map((note, index) => {
        const noteId = note?.id ? String(note.id) : `note-${index}`;
        const isExpanded = expandedNotes.has(noteId);
        const diagnosis = note?.diagnostico_descripcion ?? note?.diagnostico ?? '';
        const cie10 = note?.diagnostico_cie10 ?? note?.cie10_code ?? '';
        const planContent = note?.indicaciones_generales ?? note?.plan_tratamiento ?? '';
        const vitals = note?.signos_vitales ?? {};
        const presionSistolica = vitals?.presion_arterial_sistolica ?? note?.presion_arterial_sistolica ?? null;
        const presionDiastolica = vitals?.presion_arterial_diastolica ?? note?.presion_arterial_diastolica ?? null;
        const presionArterial = presionSistolica !== null && presionDiastolica !== null
          ? `${presionSistolica}/${presionDiastolica} mmHg`
          : note?.presion_arterial ?? null;
        const frecuenciaCardiaca = vitals?.frecuencia_cardiaca ?? note?.frecuencia_cardiaca ?? null;
        const temperatura = vitals?.temperatura ?? note?.temperatura ?? null;
        const peso = vitals?.peso ?? note?.peso ?? null;
        const saturacion = vitals?.saturacion_oxigeno ?? note?.saturacion_oxigeno ?? null;
        const talla = vitals?.talla ?? note?.talla ?? null;
        const tipo = note?.tipo_consulta as keyof typeof tipoLabels | undefined;
        const tipoLabel = tipo ? tipoLabels[tipo] ?? note?.tipo_consulta : note?.tipo_consulta;
        const tipoBadgeClass = tipo ? tipoBadgeClasses[tipo] ?? 'bg-white/10 text-white' : 'bg-white/10 text-white';
        const tratamiento = Array.isArray(note?.tratamiento) ? note.tratamiento : [];
        const notasPrivadas = note?.notas_privadas ?? note?.notasPrivadas ?? '';
        const medicoNombre = note?.medico_nombre ?? note?.medico ?? '';
        const medicoEspecialidad = note?.medico_especialidad ?? note?.medicoEspecialidad ?? '';

        return (
          <GlassPanel
            key={noteId}
            className="cursor-pointer border-white/10 bg-white/5 p-4 text-white transition hover:border-white/20"
            onClick={() => toggleNote(noteId)}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10">
                  <Calendar className="h-6 w-6" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {note?.tipo_consulta && (
                      <Badge className={`border ${tipoBadgeClass}`}>
                        {tipoLabel}
                      </Badge>
                    )}
                    {note?.fecha_consulta && (
                      <span className="text-sm text-white/60">
                        {format(new Date(note.fecha_consulta), "d 'de' MMMM, yyyy", { locale: es })}
                      </span>
                    )}
                  </div>
                  <ChevronRight 
                    className={`h-5 w-5 text-white/50 transition-transform ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                  />
                </div>

                {diagnosis && (
                  <div className="mb-2">
                    <p className="line-clamp-1 text-sm font-semibold text-white">
                      {diagnosis}
                    </p>
                  </div>
                )}

                {isExpanded && (
                  <div className="mt-4 space-y-3 animate-in slide-in-from-top-2">
                    {diagnosis && (
                      <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-3">
                        <div className="flex items-start gap-2">
                          <Stethoscope className="mt-0.5 h-4 w-4 text-blue-200" />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-medium text-blue-100">Diagnóstico:</span>
                            <p className="mt-1 text-sm font-medium text-white">{diagnosis}</p>
                            {cie10 && (
                              <p className="mt-1 text-xs text-white/70">CIE-10: {cie10}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {planContent && (
                      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3">
                        <div className="flex items-start gap-2">
                          <ClipboardList className="mt-0.5 h-4 w-4 text-emerald-200" />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-medium text-emerald-100">Plan de Tratamiento:</span>
                            <p className="mt-1 whitespace-pre-wrap text-sm text-white/80">{planContent}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {tratamiento.length > 0 && (
                      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-3">
                        <span className="text-xs font-medium text-emerald-200">Prescripciones:</span>
                        <div className="mt-2 space-y-2">
                          {tratamiento.map((med: any, medIndex: number) => (
                            <div key={medIndex} className="rounded-xl border border-white/10 bg-white/5 p-2 text-xs text-white">
                              <p className="font-semibold">{med.nombre}</p>
                              <p className="text-white/70">
                                {[med.dosis, med.via, med.frecuencia, med.duracion]
                                  .filter(Boolean)
                                  .join(' • ')}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {notasPrivadas && (
                      <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
                        <span className="text-xs font-medium text-white/70">Notas Privadas:</span>
                        <div className="mt-1 whitespace-pre-wrap text-sm text-white/80">
                          {notasPrivadas}
                        </div>
                      </div>
                    )}

                    {(presionArterial || frecuenciaCardiaca || temperatura || peso || saturacion || talla) && (
                      <div className="rounded-2xl border border-purple-400/20 bg-purple-500/10 p-3">
                        <span className="mb-2 block text-xs font-medium text-purple-100">Signos Vitales:</span>
                        <div className="flex flex-wrap gap-4">
                          {presionArterial && (
                            <div className="flex items-center gap-1 text-xs text-white/80">
                              <Activity className="h-3 w-3 text-rose-200" />
                              <span>PA:</span>
                              <span className="font-semibold text-white">{presionArterial}</span>
                            </div>
                          )}
                          {frecuenciaCardiaca && (
                            <div className="flex items-center gap-1 text-xs text-white/80">
                              <Heart className="h-3 w-3 text-pink-200" />
                              <span>FC:</span>
                              <span className="font-semibold text-white">{frecuenciaCardiaca} bpm</span>
                            </div>
                          )}
                          {temperatura && (
                            <div className="flex items-center gap-1 text-xs text-white/80">
                              <span>Temp:</span>
                              <span className="font-semibold text-white">{temperatura}°C</span>
                            </div>
                          )}
                          {peso && (
                            <div className="flex items-center gap-1 text-xs text-white/80">
                              <span>Peso:</span>
                              <span className="font-semibold text-white">{peso} kg</span>
                            </div>
                          )}
                          {talla && (
                            <div className="flex items-center gap-1 text-xs text-white/80">
                              <span>Talla:</span>
                              <span className="font-semibold text-white">{talla} cm</span>
                            </div>
                          )}
                          {saturacion && (
                            <div className="flex items-center gap-1 text-xs text-white/80">
                              <span>SpO₂:</span>
                              <span className="font-semibold text-white">{saturacion}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {(medicoNombre || medicoEspecialidad) && (
                      <div className="border-t border-white/10 pt-3 text-xs text-white/70">
                        <span className="font-medium text-white">Médico:</span> {medicoNombre}
                        {medicoEspecialidad && (
                          <span className="text-white/60"> • {medicoEspecialidad}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </GlassPanel>
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
