"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Sparkles, 
  Plus, 
  Pencil, 
  Trash2, 
  TrendingUp, 
  Clock,
  Save,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import type {
  QuickPhrase,
  QuickPhraseContext,
  QuickPhraseCategory,
  CreateQuickPhraseDTO,
  MedicalRecordCategory,
  TreatmentPhraseCategory
} from "@/lib/types/quick-phrase";
import {
  MEDICAL_RECORD_CATEGORIES,
  TREATMENT_PHRASE_CATEGORIES,
  getCategoryConfig,
  validateQuickPhrase
} from "@/lib/types/quick-phrase";

interface QuickPhraseManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultContext?: QuickPhraseContext;
}

type ViewMode = 'list' | 'create' | 'edit';

/**
 * Complete manager for Quick Phrases library
 * Create, edit, delete phrases with stats
 */
export function QuickPhraseManager({
  open,
  onOpenChange,
  defaultContext = 'medical_record'
}: QuickPhraseManagerProps) {
  const [phrases, setPhrases] = useState<QuickPhrase[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedContext, setSelectedContext] = useState<QuickPhraseContext>(defaultContext);
  const [editingPhrase, setEditingPhrase] = useState<QuickPhrase | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateQuickPhraseDTO>({
    title: '',
    content: '',
    context: defaultContext,
    category: 'otro' as QuickPhraseCategory
  });

  useEffect(() => {
    if (open) {
      fetchPhrases();
      setViewMode('list');
    }
  }, [open]);

  const fetchPhrases = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/quick-phrases?sort=usage_count&order=desc');
      if (response.ok) {
        const data = await response.json();
        setPhrases(data);
      }
    } catch (error) {
      console.error('Error fetching phrases:', error);
      toast.error("No se pudieron cargar las frases");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const errors = validateQuickPhrase(formData);
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    try {
      const response = await fetch('/api/quick-phrases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const newPhrase = await response.json();
        setPhrases(prev => [newPhrase, ...prev]);
        toast.success("✅ Frase creada exitosamente");
        resetForm();
        setViewMode('list');
      }
    } catch (error) {
      console.error('Error creating phrase:', error);
      toast.error("No se pudo crear la frase");
    }
  };

  const handleUpdate = async () => {
    if (!editingPhrase) return;

    const errors = validateQuickPhrase(formData);
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    try {
      const response = await fetch(`/api/quick-phrases/${editingPhrase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedPhrase = await response.json();
        setPhrases(prev => prev.map(p => p.id === editingPhrase.id ? updatedPhrase : p));
        toast.success("✅ Frase actualizada exitosamente");
        resetForm();
        setViewMode('list');
      }
    } catch (error) {
      console.error('Error updating phrase:', error);
      toast.error("No se pudo actualizar la frase");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta frase?')) return;

    try {
      const response = await fetch(`/api/quick-phrases/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setPhrases(prev => prev.filter(p => p.id !== id));
        toast.success("🗑️ Frase eliminada correctamente");
      }
    } catch (error) {
      console.error('Error deleting phrase:', error);
      toast.error("No se pudo eliminar la frase");
    }
  };

  const startEdit = (phrase: QuickPhrase) => {
    setEditingPhrase(phrase);
    setFormData({
      title: phrase.title,
      content: phrase.content,
      context: phrase.context,
      category: phrase.category
    });
    setViewMode('edit');
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      context: selectedContext,
      category: 'otro' as QuickPhraseCategory
    });
    setEditingPhrase(null);
  };

  const cancelEdit = () => {
    resetForm();
    setViewMode('list');
  };

  // Filter phrases by selected context tab
  const filteredPhrases = phrases.filter(
    p => p.context === selectedContext || p.context === 'both'
  );

  // Get appropriate categories based on selected context
  const availableCategories = selectedContext === 'medical_record'
    ? MEDICAL_RECORD_CATEGORIES
    : TREATMENT_PHRASE_CATEGORIES;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Biblioteca de Frases Rápidas
          </DialogTitle>
          <DialogDescription>
            Gestiona tus frases reutilizables para historiales médicos y tratamientos
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Context Tabs */}
          <Tabs 
            value={selectedContext} 
            onValueChange={(v) => setSelectedContext(v as QuickPhraseContext)}
            className="flex-1 flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="medical_record" className="gap-2">
                🩺 Historial Médico
                <span className="text-xs opacity-60">
                  ({phrases.filter(p => p.context === 'medical_record' || p.context === 'both').length})
                </span>
              </TabsTrigger>
              <TabsTrigger value="treatment" className="gap-2">
                💊 Tratamientos
                <span className="text-xs opacity-60">
                  ({phrases.filter(p => p.context === 'treatment' || p.context === 'both').length})
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedContext} className="flex-1 overflow-hidden mt-4">
              {viewMode === 'list' ? (
                <div className="flex flex-col h-full">
                  {/* Header with create button */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-gray-500">
                      {filteredPhrases.length} {filteredPhrases.length === 1 ? 'frase' : 'frases'}
                    </div>
                    <Button
                      onClick={() => {
                        resetForm();
                        setViewMode('create');
                      }}
                      size="sm"
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Nueva frase
                    </Button>
                  </div>

                  {/* List */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {loading ? (
                      <div className="text-center py-8 text-gray-500">Cargando...</div>
                    ) : filteredPhrases.length === 0 ? (
                      <div className="text-center py-12">
                        <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 mb-2">No hay frases aún</p>
                        <p className="text-xs text-gray-400">Crea tu primera frase rápida</p>
                      </div>
                    ) : (
                      filteredPhrases.map(phrase => {
                        const categoryConfig = getCategoryConfig(phrase.context, phrase.category);
                        
                        return (
                          <div
                            key={phrase.id}
                            className="p-4 border rounded-lg hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-lg">{categoryConfig.icon}</span>
                                <div className="min-w-0">
                                  <h4 className="font-medium text-sm truncate">{phrase.title}</h4>
                                  <p className="text-xs text-gray-500">{categoryConfig.label}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEdit(phrase)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(phrase.id)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                              {phrase.content}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              {phrase.usage_count > 0 && (
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3" />
                                  <span>Usada {phrase.usage_count} {phrase.usage_count === 1 ? 'vez' : 'veces'}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(phrase.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                // Create/Edit Form
                <div className="space-y-4 overflow-y-auto pr-2">
                  <div>
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ej: Paciente estable"
                      maxLength={100}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.title.length}/100 caracteres
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="category">Categoría</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value as QuickPhraseCategory })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCategories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            <span className="flex items-center gap-2">
                              <span>{cat.icon}</span>
                              <span>{cat.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="content">Contenido</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Escribe el contenido de la frase..."
                      rows={8}
                      maxLength={5000}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.content.length}/5000 caracteres
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={viewMode === 'create' ? handleCreate : handleUpdate}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {viewMode === 'create' ? 'Crear frase' : 'Guardar cambios'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={cancelEdit}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
