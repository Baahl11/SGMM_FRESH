"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Check, X } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { QuickPhraseSelector } from "@/components/quick-phrases/quick-phrase-selector";
import { QuickPhraseManager } from "@/components/quick-phrases/quick-phrase-manager";

interface PatientNote {
  id: string;
  patient_id: string;
  tipo_nota: "pendiente" | "idea" | "importante" | "general" | "completada";
  titulo?: string | null;
  contenido: string;
  completada: boolean;
  fecha_completada?: string | null;
  created_at: string;
  updated_at: string;
}

interface PatientNotesProps {
  patientId: string;
}

const tipoConfig: Record<PatientNote["tipo_nota"], {
  emoji: string;
  label: string;
  gradient: string;
  bgLight: string;
  border: string;
}> = {
  pendiente: {
    emoji: "📌",
    label: "Pendiente",
    gradient: "from-amber-400/80 to-orange-500/80",
    bgLight: "from-amber-500/10 to-orange-500/5",
    border: "border-amber-300/40",
  },
  idea: {
    emoji: "💡",
    label: "Idea",
    gradient: "from-sky-400/80 to-cyan-500/80",
    bgLight: "from-sky-400/10 to-cyan-500/5",
    border: "border-cyan-300/40",
  },
  importante: {
    emoji: "⚠️",
    label: "Importante",
    gradient: "from-rose-500/80 to-orange-500/80",
    bgLight: "from-rose-500/10 to-orange-500/5",
    border: "border-rose-400/40",
  },
  general: {
    emoji: "📋",
    label: "General",
    gradient: "from-slate-400/80 to-slate-600/80",
    bgLight: "from-white/10 to-white/5",
    border: "border-white/30",
  },
  completada: {
    emoji: "✅",
    label: "Completada",
    gradient: "from-emerald-400/80 to-green-500/80",
    bgLight: "from-emerald-500/10 to-green-500/5",
    border: "border-emerald-400/40",
  },
};

export function PatientNotes({ patientId }: PatientNotesProps) {
  const [notes, setNotes] = useState<PatientNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<PatientNote | null>(null);
  const [tipoNota, setTipoNota] = useState<PatientNote["tipo_nota"]>("general");
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [quickPhraseOpen, setQuickPhraseOpen] = useState(false);
  const [managePhrasesOpen, setManagePhrasesOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchNotes();
  }, [patientId]);

  const fetchNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/patient-notes?patient_id=${patientId}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("No se pudieron cargar las notas");
      }
      const data: PatientNote[] = await response.json();
      setNotes(data);
    } catch (err) {
      console.error("Error fetching notes", err);
      setError("No pudimos cargar las notas del paciente. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const resetFormFields = () => {
    setEditingNote(null);
    setTipoNota("general");
    setTitulo("");
    setContenido("");
  };

  const handleQuickPhraseSelect = (phraseContent: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContenido((prev) => (prev ? `${prev}\n\n${phraseContent}` : phraseContent));
      return;
    }

    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const before = textarea.value.slice(0, start);
    const after = textarea.value.slice(end);
    const nextValue = before + phraseContent + after;
    setContenido(nextValue);

    requestAnimationFrame(() => {
      const cursor = start + phraseContent.length;
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const handleSubmit = async () => {
    if (!contenido.trim()) {
      setError("El contenido de la nota es obligatorio.");
      return;
    }

    setSaving(true);
    setError(null);
    const payload = editingNote
      ? {
          tipo_nota: tipoNota,
          titulo: titulo.trim() || null,
          contenido,
        }
      : {
          patient_id: patientId,
          tipo_nota: tipoNota,
          titulo: titulo.trim() || null,
          contenido,
        };

    try {
      const response = await fetch(
        editingNote ? `/api/patient-notes/${editingNote.id}` : "/api/patient-notes",
        {
          method: editingNote ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("No se pudo guardar la nota");
      }

      await fetchNotes();
      resetFormFields();
      setDialogOpen(false);
    } catch (err) {
      console.error("Error saving note", err);
      setError("Tuvimos un problema guardando la nota. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleComplete = async (note: PatientNote) => {
    try {
      const response = await fetch(`/api/patient-notes/${note.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completada: !note.completada }),
      });

      if (!response.ok) {
        throw new Error("No se pudo actualizar la nota");
      }

      fetchNotes();
    } catch (err) {
      console.error("Error toggling note", err);
      setError("No pudimos actualizar el estado de la nota.");
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      const response = await fetch(`/api/patient-notes/${noteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("No se pudo eliminar la nota");
      }

      fetchNotes();
    } catch (err) {
      console.error("Error deleting note", err);
      setError("No pudimos eliminar la nota. Intenta más tarde.");
    }
  };

  const handleEdit = (note: PatientNote) => {
    setEditingNote(note);
    setTipoNota(note.tipo_nota);
    setTitulo(note.titulo ?? "");
    setContenido(note.contenido);
    setDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetFormFields();
    }
  };

  return (
    <div className="space-y-6">
      <GlassPanel className="flex flex-col gap-4 border-white/15 bg-white/5 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/60">Notas & Seguimiento</p>
          <h2 className="mt-2 text-2xl font-semibold">📝 Notas & Recordatorios</h2>
          <p className="mt-1 text-sm text-white/70">
            Documenta ideas, pendientes y recordatorios accionables del paciente.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button
              onClick={resetFormFields}
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 text-white shadow-[0_10px_40px_-15px_rgba(147,51,234,0.9)] hover:from-violet-600 hover:to-fuchsia-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              {editingNote ? "Editar Nota" : "Nueva Nota"}
            </Button>
          </DialogTrigger>
          <DialogContent className="border border-white/10 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white">
            <DialogHeader>
              <DialogTitle>{editingNote ? "Editar nota" : "Nueva nota"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/80">Tipo de nota</label>
                <Select value={tipoNota} onValueChange={(value: PatientNote["tipo_nota"]) => setTipoNota(value)}>
                  <SelectTrigger className="border-white/20 bg-white/5 text-white">
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 text-white">
                    {Object.entries(tipoConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.emoji} {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-white/80">Título (opcional)</label>
                <Input
                  value={titulo}
                  onChange={(event) => setTitulo(event.target.value)}
                  placeholder="Ej: Llamar para seguimiento..."
                  className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-white/80">Contenido</label>
                  <QuickPhraseSelector
                    context="medical_record"
                    onSelect={handleQuickPhraseSelect}
                    onManage={() => setManagePhrasesOpen(true)}
                    open={quickPhraseOpen}
                    onOpenChange={setQuickPhraseOpen}
                  />
                </div>
                <Textarea
                  ref={textareaRef}
                  value={contenido}
                  onChange={(event) => setContenido(event.target.value)}
                  placeholder="Escribe tu nota aquí o inserta frases rápidas"
                  rows={5}
                  className="min-h-[140px] resize-none border-white/20 bg-white/5 text-white placeholder:text-white/40"
                />
                <p className="mt-1 text-xs text-white/50">💡 Usa frases rápidas para documentar hallazgos recurrentes.</p>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600 disabled:opacity-70"
                >
                  {saving ? "Guardando..." : editingNote ? "Actualizar" : "Crear nota"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </GlassPanel>

      {error && (
        <GlassPanel className="border border-rose-400/40 bg-gradient-to-r from-rose-500/20 to-orange-500/10 p-4 text-sm text-rose-50">
          {error}
        </GlassPanel>
      )}

      {loading ? (
        <GlassPanel className="flex items-center justify-center border-white/10 bg-white/5 py-12 text-white">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-white"></div>
        </GlassPanel>
      ) : notes.length === 0 ? (
        <GlassPanel className="border border-dashed border-white/20 bg-white/5 py-12 text-center text-white">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/30">
            <Plus className="h-8 w-8 text-white/70" />
          </div>
          <h3 className="text-lg font-semibold">Sin notas aún</h3>
          <p className="mt-1 text-sm text-white/70">
            Guarda pendientes clínicos, ideas de follow-up o recordatorios internos.
          </p>
          <Button
            onClick={() => {
              resetFormFields();
              setDialogOpen(true);
            }}
            variant="outline"
            className="mt-6 border-white/30 text-white hover:bg-white/10"
          >
            <Plus className="mr-2 h-4 w-4" />
            Crear primera nota
          </Button>
        </GlassPanel>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => {
            const config = tipoConfig[note.tipo_nota];
            return (
              <GlassPanel
                key={note.id}
                className={`border ${config.border} bg-gradient-to-r ${config.bgLight} p-6 text-white`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-white/70">
                      <Badge className={`bg-gradient-to-r ${config.gradient} text-white shadow-inner`}> 
                        {config.emoji} {config.label}
                      </Badge>
                      <span>
                        {formatDistanceToNow(new Date(note.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    </div>
                    {note.titulo && <h4 className="mb-1 text-lg font-semibold">{note.titulo}</h4>}
                    <p className="whitespace-pre-wrap text-white/85">{note.contenido}</p>
                    {note.completada && note.fecha_completada && (
                      <p className="mt-2 text-xs text-emerald-200">
                        ✓ Completada el {format(new Date(note.fecha_completada), "dd 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {note.tipo_nota === "pendiente" && !note.completada && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleComplete(note)}
                        className="border-emerald-300/60 text-emerald-100 hover:bg-emerald-500/10"
                      >
                        <Check className="mr-1 h-3 w-3" />
                        Marcar
                      </Button>
                    )}
                    {note.completada && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleComplete(note)}
                        className="border-amber-300/60 text-amber-100 hover:bg-amber-500/10"
                      >
                        <X className="mr-1 h-3 w-3" />
                        Reabrir
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(note)}
                      className="border-white/30 text-white hover:bg-white/10"
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(note.id)}
                      className="border-rose-400/60 text-rose-100 hover:bg-rose-500/10"
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </GlassPanel>
            );
          })}
        </div>
      )}

      <QuickPhraseManager
        open={managePhrasesOpen}
        onOpenChange={setManagePhrasesOpen}
        defaultContext="medical_record"
      />
    </div>
  );
}
