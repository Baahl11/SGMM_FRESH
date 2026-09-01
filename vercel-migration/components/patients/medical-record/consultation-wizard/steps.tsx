"use client";

import { useState, type FC } from "react";
import {
  Activity,
  AlertTriangle,
  Eye,
  FileText,
  Pill,
  Plus,
  Stethoscope,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { diagnosticosComunes, type TipoConsulta } from "@/types/medical-record";
import type { StepErrors, StepId } from "./model";
import type { UseConsultationForm } from "./form-state";
import {
  FieldError,
  GlassLabel,
  GlassSection,
  StepIntro,
  glassFieldClass,
  glassSelectContentClass,
} from "./glass";

export interface Doctor {
  id?: string;
  nombre?: string;
  especialidad?: string;
  cedula_profesional?: string;
  cedula?: string;
}

export interface StepProps {
  fs: UseConsultationForm;
  errors: StepErrors;
  doctors: Doctor[];
  selectedDoctorId: string;
  onDoctorSelect: (id: string) => void;
}

/** Avisos clínicos informativos (no bloquean la navegación). */
function vitalAlerts(form: UseConsultationForm["form"]): string[] {
  const out: string[] = [];
  const pas = parseFloat(form.signosVitales.presion_arterial_sistolica);
  const pad = parseFloat(form.signosVitales.presion_arterial_diastolica);
  const fc = parseFloat(form.signosVitales.frecuencia_cardiaca);
  const temp = parseFloat(form.signosVitales.temperatura);
  if (pas > 140 || pad > 90) out.push("⚠️ Presión arterial elevada");
  if (fc > 100) out.push("⚠️ Taquicardia");
  if (fc && fc < 60) out.push("ℹ️ Bradicardia");
  if (temp > 37.5) out.push("⚠️ Temperatura elevada (fiebre)");
  return out;
}

const fieldWrap = "space-y-1.5";

/* ---------------------------------------------------------------- Paso 1 */
const StepTipo: FC<StepProps> = ({ fs }) => {
  const { form, setField } = fs;
  const options: Array<{
    value: TipoConsulta;
    title: string;
    desc: string;
    icon: typeof FileText;
    ring: string;
    iconBg: string;
  }> = [
    {
      value: "primera_vez",
      title: "Primera vez",
      desc: "Historia clínica inicial con antecedentes completos",
      icon: FileText,
      ring: "border-emerald-400 bg-emerald-400/10",
      iconBg: "bg-emerald-400/20 text-emerald-100",
    },
    {
      value: "evolucion",
      title: "Evolución",
      desc: "Nota de seguimiento o control",
      icon: Activity,
      ring: "border-cyan-400 bg-cyan-400/10",
      iconBg: "bg-cyan-400/20 text-cyan-100",
    },
    {
      value: "interconsulta",
      title: "Interconsulta",
      desc: "Valoración por otro especialista",
      icon: Stethoscope,
      ring: "border-purple-400 bg-purple-400/10",
      iconBg: "bg-purple-400/20 text-purple-100",
    },
  ];

  return (
    <div className="space-y-6">
      <StepIntro
        icon={FileText}
        title="¿Qué tipo de consulta es?"
        subtitle="Selecciona el tipo de nota clínica según NOM-004"
        accent="indigo"
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {options.map((opt) => {
          const selected = form.tipoConsulta === opt.value;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setField("tipoConsulta", opt.value)}
              className={cn(
                "rounded-2xl border p-5 text-center transition-all",
                selected
                  ? opt.ring
                  : "border-white/10 bg-white/5 hover:border-white/25",
              )}
            >
              <span
                className={cn(
                  "mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full",
                  opt.iconBg,
                )}
              >
                <Icon className="h-6 w-6" />
              </span>
              <span className="block font-semibold text-white">{opt.title}</span>
              <span className="mt-1 block text-xs text-white/55">{opt.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- Paso 2 */
const VITALS: Array<{
  key: keyof UseConsultationForm["form"]["signosVitales"];
  label: string;
  placeholder: string;
  step?: string;
}> = [
  { key: "frecuencia_cardiaca", label: "Frecuencia cardíaca (bpm)", placeholder: "60-100" },
  { key: "frecuencia_respiratoria", label: "Frecuencia respiratoria (rpm)", placeholder: "12-20" },
  { key: "temperatura", label: "Temperatura (°C)", placeholder: "36.5", step: "0.1" },
  { key: "peso", label: "Peso (kg)", placeholder: "70.5", step: "0.1" },
  { key: "talla", label: "Talla (cm)", placeholder: "170" },
  { key: "saturacion_oxigeno", label: "Saturación O₂ (%)", placeholder: "95-100" },
];

const StepSignos: FC<StepProps> = ({ fs, errors }) => {
  const { form, setVital } = fs;
  const alerts = vitalAlerts(form);

  return (
    <div className="space-y-6">
      <StepIntro
        icon={Activity}
        title="Signos vitales"
        subtitle="Opcional — registra lo que hayas medido"
        accent="rose"
      />

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div
              key={a}
              className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100"
            >
              {a}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className={fieldWrap}>
          <GlassLabel>Presión arterial (mmHg)</GlassLabel>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Sistólica"
              value={form.signosVitales.presion_arterial_sistolica}
              onChange={(e) => setVital("presion_arterial_sistolica", e.target.value)}
              className={glassFieldClass("rose", !!errors.presion_arterial_sistolica)}
            />
            <span className="text-xl text-white/40">/</span>
            <Input
              type="number"
              placeholder="Diastólica"
              value={form.signosVitales.presion_arterial_diastolica}
              onChange={(e) => setVital("presion_arterial_diastolica", e.target.value)}
              className={glassFieldClass("rose", !!errors.presion_arterial_diastolica)}
            />
          </div>
          <FieldError>
            {errors.presion_arterial_sistolica || errors.presion_arterial_diastolica}
          </FieldError>
        </div>

        {VITALS.map((v) => (
          <div key={v.key} className={fieldWrap}>
            <GlassLabel>{v.label}</GlassLabel>
            <Input
              type="number"
              step={v.step}
              placeholder={v.placeholder}
              value={form.signosVitales[v.key]}
              onChange={(e) => setVital(v.key, e.target.value)}
              className={glassFieldClass("rose", !!errors[v.key])}
            />
            <FieldError>{errors[v.key]}</FieldError>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- Paso 3 */
const StepAntecedentes: FC<StepProps> = ({ fs }) => {
  const { form, setAntecedente, addAlergia, removeAlergia } = fs;

  return (
    <div className="space-y-6">
      <StepIntro
        icon={AlertTriangle}
        title="Antecedentes"
        subtitle="Historia clínica inicial (primera vez)"
        accent="emerald"
      />

      <GlassSection>
        <div className="space-y-5">
          <div className={fieldWrap}>
            <GlassLabel>Alergias</GlassLabel>
            <AlergiaInput onAdd={addAlergia} />
            <div className="flex flex-wrap gap-2 pt-1">
              {form.antecedentes.alergias.map((a, i) => (
                <Badge
                  key={`${a}-${i}`}
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={() => removeAlergia(i)}
                >
                  🚨 {a} <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}
            </div>
          </div>

          {(
            [
              ["heredo_familiares", "Heredo-familiares", "Diabetes, hipertensión, cáncer en familiares..."],
              ["personales_patologicos", "Personales patológicos", "Enfermedades previas, cirugías, hospitalizaciones..."],
              ["personales_no_patologicos", "Personales no patológicos", "Tabaquismo, alcoholismo, actividad física, alimentación..."],
              ["gineco_obstetricos", "Gineco-obstétricos", "Menarca, gestas, partos, cesáreas, FUM..."],
            ] as const
          ).map(([key, label, ph]) => (
            <div key={key} className={fieldWrap}>
              <GlassLabel>{label}</GlassLabel>
              <Textarea
                rows={2}
                placeholder={ph}
                value={form.antecedentes[key]}
                onChange={(e) => setAntecedente(key, e.target.value)}
                className={glassFieldClass("emerald")}
              />
            </div>
          ))}
        </div>
      </GlassSection>
    </div>
  );
};

function AlergiaInput({ onAdd }: { onAdd: (v: string) => void }) {
  const [value, setValue] = useState("");
  const commit = () => {
    onAdd(value);
    setValue("");
  };
  return (
    <div className="flex gap-2">
      <Input
        placeholder="Ej: Penicilina, Polen..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={glassFieldClass("emerald")}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="shrink-0 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
        onClick={commit}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

/* ---------------------------------------------------------------- Paso 4 */
const StepDiagnostico: FC<StepProps> = ({ fs, errors }) => {
  const { form, setField } = fs;

  return (
    <div className="space-y-6">
      <StepIntro
        icon={Stethoscope}
        title="Diagnóstico"
        subtitle="Establece el diagnóstico clínico"
        accent="cyan"
      />

      <div className={fieldWrap}>
        <GlassLabel>Padecimiento actual *</GlassLabel>
        <Textarea
          rows={4}
          placeholder="Describe el motivo de consulta y la evolución del padecimiento..."
          value={form.padecimientoActual}
          onChange={(e) => setField("padecimientoActual", e.target.value)}
          className={glassFieldClass("cyan", !!errors.padecimiento_actual)}
        />
        <FieldError>{errors.padecimiento_actual}</FieldError>
      </div>

      <div className={fieldWrap}>
        <GlassLabel>Exploración física</GlassLabel>
        <Textarea
          rows={4}
          placeholder="Hallazgos de la exploración física por aparatos y sistemas..."
          value={form.exploracionFisica}
          onChange={(e) => setField("exploracionFisica", e.target.value)}
          className={glassFieldClass("cyan")}
        />
      </div>

      <div className={fieldWrap}>
        <GlassLabel>Diagnóstico CIE-10 *</GlassLabel>
        <Select
          value={form.diagnosticoCIE10}
          onValueChange={(value) => {
            setField("diagnosticoCIE10", value);
            const diag = diagnosticosComunes.find((d) => d.codigo === value);
            if (diag && !form.diagnosticoDescripcion) {
              setField("diagnosticoDescripcion", diag.descripcion);
            }
          }}
        >
          <SelectTrigger className={glassFieldClass("cyan", !!errors.diagnostico)}>
            <SelectValue placeholder="Buscar código CIE-10..." />
          </SelectTrigger>
          <SelectContent className={glassSelectContentClass}>
            {diagnosticosComunes.map((d) => (
              <SelectItem key={d.codigo} value={d.codigo}>
                <span className="font-mono font-semibold">{d.codigo}</span> — {d.descripcion}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={fieldWrap}>
        <GlassLabel>Descripción del diagnóstico *</GlassLabel>
        <Input
          placeholder="O escribe tu propio diagnóstico..."
          value={form.diagnosticoDescripcion}
          onChange={(e) => setField("diagnosticoDescripcion", e.target.value)}
          className={glassFieldClass("cyan", !!errors.diagnostico)}
        />
        <FieldError>{errors.diagnostico}</FieldError>
      </div>

      <div className={fieldWrap}>
        <GlassLabel>Pronóstico</GlassLabel>
        <Select
          value={form.pronostico}
          onValueChange={(v) => setField("pronostico", v)}
        >
          <SelectTrigger className={glassFieldClass("cyan")}>
            <SelectValue placeholder="Selecciona el pronóstico..." />
          </SelectTrigger>
          <SelectContent className={glassSelectContentClass}>
            {["Bueno", "Regular", "Reservado", "Grave"].map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- Paso 5 */
const MED_FIELDS: Array<{
  field: "dosis" | "frecuencia" | "duracion";
  label: string;
  placeholder: string;
}> = [
  { field: "dosis", label: "Dosis", placeholder: "Ej: 500mg" },
  { field: "frecuencia", label: "Frecuencia", placeholder: "Ej: Cada 8 horas" },
  { field: "duracion", label: "Duración", placeholder: "Ej: 7 días" },
];

const StepTratamiento: FC<StepProps> = ({ fs, errors }) => {
  const { form, addMedicamento, updateMedicamento, removeMedicamento, setField } = fs;

  return (
    <div className="space-y-6">
      <StepIntro
        icon={Pill}
        title="Tratamiento"
        subtitle="Prescribe medicamentos e indicaciones"
        accent="emerald"
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <GlassLabel>Medicamentos</GlassLabel>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addMedicamento}
            className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar medicamento
          </Button>
        </div>

        {form.medicamentos.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 py-8 text-center text-white/45">
            <Pill className="mx-auto mb-2 h-8 w-8 text-white/25" />
            <p className="text-sm">Sin medicamentos. Usa “Agregar medicamento”.</p>
          </div>
        )}

        {form.medicamentos.map((med, idx) => (
          <GlassSection key={idx} className="border-emerald-400/20 bg-emerald-400/5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-emerald-100">
                Medicamento {idx + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeMedicamento(idx)}
                className="h-6 w-6 p-0 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className={cn(fieldWrap, "md:col-span-2")}>
                <GlassLabel>Nombre del medicamento *</GlassLabel>
                <Input
                  placeholder="Ej: Paracetamol"
                  value={med.nombre}
                  onChange={(e) => updateMedicamento(idx, "nombre", e.target.value)}
                  className={glassFieldClass("emerald", !!errors[`med_nombre_${idx}`])}
                />
                <FieldError>{errors[`med_nombre_${idx}`]}</FieldError>
              </div>
              <div className={fieldWrap}>
                <GlassLabel>Vía de administración</GlassLabel>
                <Select
                  value={med.via}
                  onValueChange={(v) => updateMedicamento(idx, "via", v)}
                >
                  <SelectTrigger className={glassFieldClass("emerald")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={glassSelectContentClass}>
                    {["oral", "intravenosa", "intramuscular", "subcutanea", "topica"].map(
                      (v) => (
                        <SelectItem key={v} value={v}>
                          {v.charAt(0).toUpperCase() + v.slice(1)}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              {MED_FIELDS.map((mf) => (
                <div key={mf.field} className={fieldWrap}>
                  <GlassLabel>{mf.label}</GlassLabel>
                  <Input
                    placeholder={mf.placeholder}
                    value={med[mf.field]}
                    onChange={(e) => updateMedicamento(idx, mf.field, e.target.value)}
                    className={glassFieldClass("emerald")}
                  />
                </div>
              ))}
            </div>
          </GlassSection>
        ))}
      </div>

      <div className={fieldWrap}>
        <GlassLabel>Indicaciones generales</GlassLabel>
        <Textarea
          rows={3}
          placeholder="Reposo, dieta, medidas generales, citas de seguimiento..."
          value={form.indicacionesGenerales}
          onChange={(e) => setField("indicacionesGenerales", e.target.value)}
          className={glassFieldClass("emerald")}
        />
      </div>

      <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="font-semibold text-amber-100">
            📝 Notas privadas / Recordatorios
          </span>
          <Badge
            variant="outline"
            className="border-amber-400/40 bg-amber-400/15 text-xs text-amber-100"
          >
            Solo visible para ti
          </Badge>
        </div>
        <p className="mb-3 text-xs text-amber-200/80">
          Recordatorios u observaciones de seguimiento que solo tú verás.
        </p>
        <Textarea
          rows={3}
          placeholder="Ej: Programar cita de control en 2 semanas, revisar laboratorio..."
          value={form.notasPrivadas}
          onChange={(e) => setField("notasPrivadas", e.target.value)}
          className="border-amber-400/30 bg-white/5 text-white placeholder:text-white/35 focus:border-amber-400"
        />
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- Paso 6 */
const StepRevision: FC<StepProps> = ({
  fs,
  errors,
  doctors,
  selectedDoctorId,
  onDoctorSelect,
}) => {
  const { form, setField } = fs;
  const tipoLabel =
    form.tipoConsulta === "primera_vez"
      ? "Primera vez"
      : form.tipoConsulta === "evolucion"
        ? "Evolución"
        : "Interconsulta";

  return (
    <div className="space-y-6">
      <StepIntro
        icon={Eye}
        title="Revisión y datos del médico"
        subtitle="Verifica la información antes de guardar"
        accent="purple"
      />

      <GlassSection icon={Stethoscope} title="Médico tratante" accent="purple">
        {doctors.length > 0 ? (
          <div className={cn(fieldWrap, "mb-4")}>
            <GlassLabel>Seleccionar doctor</GlassLabel>
            <Select value={selectedDoctorId} onValueChange={onDoctorSelect}>
              <SelectTrigger className={glassFieldClass("purple")}>
                <SelectValue placeholder="Selecciona un doctor registrado" />
              </SelectTrigger>
              <SelectContent className={glassSelectContentClass}>
                {doctors
                  .filter((d): d is Doctor & { id: string } => !!d.id)
                  .map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nombre}
                      {d.especialidad ? ` — ${d.especialidad}` : ""}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-white/50">
              O ingresa los datos manualmente abajo
            </p>
          </div>
        ) : (
          <div className="mb-4 rounded-lg border border-white/15 bg-white/5 p-3 text-xs text-white/70">
            💡 No tienes doctores registrados.{" "}
            <a
              href="/dashboard/settings/doctors"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline"
            >
              Agregar doctores
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className={fieldWrap}>
            <GlassLabel>Nombre completo *</GlassLabel>
            <Input
              placeholder="Dr. Juan Pérez García"
              value={form.medicoNombre}
              onChange={(e) => setField("medicoNombre", e.target.value)}
              className={glassFieldClass("purple", !!errors.medico_nombre)}
            />
            <FieldError>{errors.medico_nombre}</FieldError>
          </div>
          <div className={fieldWrap}>
            <GlassLabel>Cédula profesional</GlassLabel>
            <Input
              placeholder="1234567"
              value={form.medicoCedula}
              onChange={(e) => setField("medicoCedula", e.target.value)}
              className={glassFieldClass("purple")}
            />
          </div>
          <div className={cn(fieldWrap, "md:col-span-2")}>
            <GlassLabel>Especialidad</GlassLabel>
            <Input
              placeholder="Medicina General, Cardiología..."
              value={form.medicoEspecialidad}
              onChange={(e) => setField("medicoEspecialidad", e.target.value)}
              className={glassFieldClass("purple")}
            />
          </div>
        </div>
      </GlassSection>

      <GlassSection title="Resumen de la consulta">
        <ul className="space-y-2 text-sm text-white/80">
          <li>
            <span className="text-white/50">Tipo:</span>{" "}
            <Badge className="bg-indigo-400/20 text-indigo-100">{tipoLabel}</Badge>
          </li>
          {form.diagnosticoDescripcion && (
            <li>
              <span className="text-white/50">Diagnóstico:</span>{" "}
              <span className="font-medium text-white">
                {form.diagnosticoDescripcion}
              </span>
            </li>
          )}
          {form.medicamentos.length > 0 && (
            <li>
              <span className="text-white/50">Medicamentos:</span>{" "}
              <span className="font-medium text-white">
                {form.medicamentos.length} prescrito(s)
              </span>
            </li>
          )}
        </ul>
      </GlassSection>

      <p className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/60">
        ℹ️ Esta consulta se guardará en el expediente clínico electrónico conforme a
        la NOM-004-SSA3-2012. Podrás exportarla a PDF después de guardar.
      </p>
    </div>
  );
};

export const STEP_COMPONENTS: Record<StepId, FC<StepProps>> = {
  tipo: StepTipo,
  signos: StepSignos,
  antecedentes: StepAntecedentes,
  diagnostico: StepDiagnostico,
  tratamiento: StepTratamiento,
  revision: StepRevision,
};

export const STEP_META: Record<StepId, { label: string }> = {
  tipo: { label: "Tipo" },
  signos: { label: "Signos vitales" },
  antecedentes: { label: "Antecedentes" },
  diagnostico: { label: "Diagnóstico" },
  tratamiento: { label: "Tratamiento" },
  revision: { label: "Revisión" },
};
