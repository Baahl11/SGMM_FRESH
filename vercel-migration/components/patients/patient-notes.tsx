"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatDistanceToNow } from "date-fns";

interface PatientNote {
  id: string;
  patient_id: string;
  tipo_nota: 'pendiente' | 'idea' | 'importante' | 'general' | 'completada';
  titulo?: string;
  contenido: string;
  completada: boolean;
  fecha_completada?: string;
  created_at: string;
  updated_at: string;
}

interface PatientNotesProps {
  patientId: string;
}

const tipoConfig = {
  pendiente: {
    emoji: '📌',
    label: 'Pendiente',
    gradient: 'from-yellow-400 to-orange-500',
    bgLight: 'bg-yellow-50',
    border: 'border-yellow-300',
    text: 'text-yellow-900',
  },
  idea: {
    emoji: '💡',
    label: 'Idea',
    gradient: 'from-blue-400 to-cyan-500',
    bgLight: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-900',
  },
  importante: {
    emoji: '⚠️',
    label: 'Importante',
    gradient: 'from-red-500 to-pink-600',
    bgLight: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-red-900',
  },
  general: {
    emoji: '📋',
    label: 'General',
    gradient: 'from-gray-400 to-slate-500',
    bgLight: 'bg-gray-50',
    border: 'border-gray-300',
    text: 'text-gray-900',
  },
  completada: {
    emoji: '✅',
    label: 'Completada',
    gradient: 'from-green-400 to-emerald-500',
    bgLight: 'bg-green-50',
    border: 'border-green-300',
    text: 'text-green-900',
  },
};

export function PatientNotes({ patientId }: PatientNotesProps) {
  const [notes, setNotes] = useState<PatientNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<PatientNote | null>(null);
  
  // Form state
  const [tipoNota, setTipoNota] = useState<PatientNote['tipo_nota']>('general');
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');

  useEffect(() => {
    fetchNotes();
  }, [patientId]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/patient-notes?patient_id=${patientId}`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!contenido.trim()) return;

    try {
      if (editingNote) {
        // Actualizar nota existente
        const response = await fetch(`/api/patient-notes/${editingNote.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tipo_nota: tipoNota, titulo, contenido }),
        });
        
        if (response.ok) {
          fetchNotes();
          resetForm();
        }
      } else {
        // Crear nueva nota
        const response = await fetch('/api/patient-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: patientId,
            tipo_nota: tipoNota,
            titulo,
            contenido,
          }),
        });
        
        if (response.ok) {
          fetchNotes();
          resetForm();
        }
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleToggleComplete = async (note: PatientNote) => {
    try {
      const response = await fetch(`/api/patient-notes/${note.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completada: !note.completada }),
      });
      
      if (response.ok) {
        fetchNotes();
      }
    } catch (error) {
      console.error('Error toggling complete:', error);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('¿Eliminar esta nota?')) return;
    
    try {
      const response = await fetch(`/api/patient-notes/${noteId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchNotes();
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleEdit = (note: PatientNote) => {
    setEditingNote(note);
    setTipoNota(note.tipo_nota);
    setTitulo(note.titulo || '');
    setContenido(note.contenido);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingNote(null);
    setTipoNota('general');
    setTitulo('');
    setContenido('');
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header con botón de agregar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            📝 Notas & Recordatorios
          </h2>
          <p className="text-gray-600 mt-1">
            Gestiona ideas, pendientes y recordatorios del paciente
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Nota
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingNote ? 'Editar Nota' : 'Nueva Nota'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Nota</label>
                <Select value={tipoNota} onValueChange={(value: any) => setTipoNota(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(tipoConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.emoji} {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Título (opcional)</label>
                <Input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Llamar para seguimiento..."
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Contenido</label>
                <Textarea
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  placeholder="Escribe tu nota aquí..."
                  rows={5}
                  className="resize-none"
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>
                  {editingNote ? 'Actualizar' : 'Crear Nota'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de notas */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      ) : notes.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="py-12 text-center">
            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin notas aún</h3>
            <p className="text-gray-600 mb-4">
              Comienza agregando recordatorios, ideas o notas importantes
            </p>
            <Button
              onClick={() => setDialogOpen(true)}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Nota
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => {
            const config = tipoConfig[note.tipo_nota];
            return (
              <Card
                key={note.id}
                className={`border-2 ${config.border} ${config.bgLight} hover:shadow-lg transition-all duration-200 overflow-hidden`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={`bg-gradient-to-r ${config.gradient} text-white border-0`}>
                          {config.emoji} {config.label}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale: es })}
                        </span>
                      </div>
                      
                      {note.titulo && (
                        <h4 className="font-semibold text-gray-900 mb-1">{note.titulo}</h4>
                      )}
                      
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {note.contenido}
                      </p>
                      
                      {note.completada && note.fecha_completada && (
                        <p className="text-xs text-green-600 mt-2">
                          ✓ Completada el {format(new Date(note.fecha_completada), "dd 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    {note.tipo_nota === 'pendiente' && !note.completada && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleComplete(note)}
                        className="text-green-600 border-green-300 hover:bg-green-50"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Marcar completada
                      </Button>
                    )}
                    
                    {note.completada && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleComplete(note)}
                        className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Reabrir
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(note)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(note.id)}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
