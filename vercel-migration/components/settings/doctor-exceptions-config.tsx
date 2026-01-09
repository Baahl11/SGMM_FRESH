"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Calendar, Trash2, Edit2, Plus, AlertCircle, X, Shield, Clock3 } from "lucide-react";
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
  fecha_inicio: string;
  fecha_fin: string;
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

  const [showForm, setShowForm] = useState(false);
  const [editingException, setEditingException] = useState<DoctorException | null>(null);
  const [formData, setFormData] = useState({
    tipo: "vacaciones" as DoctorException["tipo"],
    fecha_inicio: "",
    fecha_fin: "",
    motivo: "",
  });

  useEffect(() => {
    loadDoctors();
  }, []);

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
    const doctor = doctors.find((d) => d.id === doctorId) || null;
    setSelectedDoctor(doctor);
    setShowForm(false);
    setEditingException(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ tipo: "vacaciones", fecha_inicio: "", fecha_fin: "", motivo: "" });
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

    const overlap = exceptions.some((exc) => {
      if (!exc.activo) return false;
      if (editingException && exc.id === editingException.id) return false;
      const excInicio = new Date(exc.fecha_inicio);
      const excFin = new Date(exc.fecha_fin);
      return inicio <= excFin && fin >= excInicio;
    });

    if (overlap) {
      return "Ya existe una excepción activa en este rango";
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

      const endpoint = editingException
        ? `/api/doctor-exceptions/${editingException.id}`
        : "/api/doctor-exceptions";
      const method = editingException ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al guardar");
      }

      setSuccess(true);
      setShowForm(false);
      resetForm();
      await loadExceptions(selectedDoctor.id);
      setTimeout(() => setSuccess(false), 3000);
      onSave?.();
    } catch (err: unknown) {
      console.error("Error saving exception:", err);
      setError(err instanceof Error ? err.message : "Error al guardar la excepción");
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
      if (selectedDoctor) {
        await loadExceptions(selectedDoctor.id);
      }
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      console.error("Error deleting exception:", err);
      setError(err instanceof Error ? err.message : "Error al eliminar la excepción");
    } finally {
      setSaving(false);
    }
  };

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case "vacaciones":
        return "border border-sky-400/50 bg-sky-500/15 text-sky-100";
      case "festivo":
        return "border border-purple-400/50 bg-purple-500/15 text-purple-100";
      case "bloqueo":
        return "border border-rose-400/50 bg-rose-500/15 text-rose-100";
      default:
        return "border border-white/20 bg-white/10 text-white";
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case "vacaciones":
        return "Vacaciones";
      case "festivo":
        return "Día festivo";
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

  const activeExceptions = exceptions.filter((e) => e.activo);
  const blockedDays = activeExceptions.reduce((sum, exc) => {
    const start = new Date(exc.fecha_inicio);
    const end = new Date(exc.fecha_fin);
    const diff = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
    return sum + diff;
  }, 0);
  const nextException = activeExceptions
    .slice()
    .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio))[0];

  return (
    <div className="space-y-6 text-white">
      <GlassPanel className="space-y-6 border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">Gestión</p>
            <h2 className="text-2xl font-semibold">Excepciones por doctor</h2>
          </div>
          {selectedDoctor && !showForm && (
            <button onClick={handleNewException} className="aura-cta aura-cta--primary">
              <Plus className="h-4 w-4" />
              Nueva excepción
            </button>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr,320px]">
          <div className="space-y-2">
            <Label className="text-sm uppercase tracking-[0.35em] text-white/60">
              Seleccionar doctor
            </Label>
            <Select value={selectedDoctor?.id || ""} onValueChange={handleDoctorChange}>
              <SelectTrigger className="h-12 rounded-2xl border border-white/15 bg-white/5 text-white">
                <SelectValue placeholder="Seleccione un doctor" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[var(--surface-night)] text-white">
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: doctor.color }}
                      />
                      <span>{doctor.nombre}</span>
                      {doctor.especialidad && (
                        <span className="text-xs text-white/60">({doctor.especialidad})</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
            {selectedDoctor ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <Calendar className="h-5 w-5 text-emerald-200" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/50">Excepciones activas</p>
                    <p className="text-lg font-semibold text-white">{activeExceptions.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <Clock3 className="h-5 w-5 text-sky-200" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/50">Próximo bloqueo</p>
                    <p className="text-sm text-white/80">
                      {nextException ? formatDateRange(nextException.fecha_inicio, nextException.fecha_fin) : "Sin bloqueos"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <Shield className="h-5 w-5 text-amber-200" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/50">Días protegidos</p>
                    <p className="text-sm text-white/80">{blockedDays}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-white/60">
                Selecciona un doctor para ver métricas de bloqueos.
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm text-rose-100">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-300/40 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            <AlertCircle className="h-4 w-4" />
            <span>Excepción guardada correctamente</span>
          </div>
        )}

        {selectedDoctor && showForm && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">Formulario</p>
                <h3 className="text-lg font-semibold">
                  {editingException ? "Editar excepción" : "Nueva excepción"}
                </h3>
              </div>
              <button
                onClick={handleCancelForm}
                className="rounded-full border border-white/15 p-2 text-white/70 transition hover:border-white/40 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.35em] text-white/60">Tipo de excepción</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value as DoctorException["tipo"] })}
                >
                  <SelectTrigger className="h-12 rounded-2xl border border-white/15 bg-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[var(--surface-night)] text-white">
                    <SelectItem value="vacaciones">🏖️ Vacaciones</SelectItem>
                    <SelectItem value="festivo">🎉 Día festivo</SelectItem>
                    <SelectItem value="bloqueo">🚫 Bloqueo manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.35em] text-white/60">Fecha inicio</Label>
                  <Input
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                    className="h-12 rounded-2xl border border-white/15 bg-white/5 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.35em] text-white/60">Fecha fin</Label>
                  <Input
                    type="date"
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                    className="h-12 rounded-2xl border border-white/15 bg-white/5 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.35em] text-white/60">Motivo (opcional)</Label>
                <Textarea
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  placeholder="Ej: Vacaciones de verano, Navidad, etc."
                  rows={2}
                  className="rounded-2xl border border-white/15 bg-white/5 text-white placeholder:text-white/40"
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  onClick={handleCancelForm}
                  className="aura-cta aura-cta--ghost"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveException}
                  className="aura-cta aura-cta--primary"
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Guardar excepción"}
                </button>
              </div>
            </div>
          </div>
        )}
      </GlassPanel>

      <GlassPanel className="border-white/10 bg-white/5 p-6">
        {!selectedDoctor ? (
          <div className="flex flex-col items-center gap-3 text-center text-white/70">
            <Calendar className="h-10 w-10 text-white/40" />
            <p>Selecciona un doctor para administrar sus bloqueos y vacaciones.</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center gap-3 text-white/70">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-transparent" />
            Cargando excepciones...
          </div>
        ) : activeExceptions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/20 px-6 py-10 text-center text-white/70">
            <Shield className="h-10 w-10 text-white/40" />
            <div>
              <p className="text-lg font-semibold text-white">Sin excepciones activas</p>
              <p className="text-sm">Agrega vacaciones, festivos o bloqueos manuales.</p>
            </div>
            <button className="aura-cta aura-cta--ghost" onClick={handleNewException}>
              Crear excepción
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm uppercase tracking-[0.35em] text-white/60">
                Excepciones activas ({activeExceptions.length})
              </p>
            </div>
            {activeExceptions
              .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio))
              .map((exception) => (
                <div
                  key={exception.id}
                  className="rounded-3xl border border-white/10 bg-white/5 p-4"
                  style={{ boxShadow: `0 0 30px ${selectedDoctor?.color ?? "#fff"}10` }}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={`${getTipoBadgeColor(exception.tipo)} text-xs`}>
                          {getTipoLabel(exception.tipo)}
                        </Badge>
                        <span className="text-sm text-white/80">
                          {formatDateRange(exception.fecha_inicio, exception.fecha_fin)}
                        </span>
                      </div>
                      {exception.motivo && (
                        <p className="text-sm text-white/70">{exception.motivo}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(exception)}
                        className="rounded-2xl border border-white/10 p-2 text-white/70 transition hover:border-white/40 hover:text-white"
                        disabled={saving}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(exception.id)}
                        className="rounded-2xl border border-white/10 p-2 text-rose-200 transition hover:border-rose-400/50"
                        disabled={saving}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
