"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, Plus, Package, X } from "lucide-react";
import AppLayout from "@/components/layout/app-layout";
import { TagsInput } from "@/components/treatments/tags-input";
import { TREATMENT_CATEGORIES, type TreatmentCategory } from "@/lib/types/treatment";
import { QuickPhraseSelector } from "@/components/quick-phrases/quick-phrase-selector";
import { QuickPhraseManager } from "@/components/quick-phrases/quick-phrase-manager";

// UI Components
const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`rounded-3xl border border-white/10 bg-[#061025]/80 text-white shadow-[0_25px_55px_rgba(2,6,23,0.45)] backdrop-blur-xl ${className}`}>{children}</div>
)

const CardHeader = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`border-b border-white/10 p-6 pb-4 ${className}`}>{children}</div>
)

const CardTitle = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <h3 className={`text-lg font-semibold text-white ${className}`}>{children}</h3>
)

const CardContent = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`p-6 ${className}`}>{children}</div>
)

const Button = ({ children, className = "", variant = "default", size = "default", onClick, disabled = false, type = "button" }: any) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md transition-colors font-medium"
  const variantClasses: Record<string, string> = {
    default: "border-0 bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-300 text-black hover:from-emerald-200 hover:via-cyan-200 hover:to-sky-200 disabled:opacity-50 disabled:cursor-not-allowed",
    outline: "border border-white/20 bg-white/5 text-white hover:bg-white/10",
    destructive: "border border-rose-400/40 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25"
  }
  const sizeClasses: Record<string, string> = {
    default: "px-4 py-2",
    sm: "px-3 py-1.5 text-sm"
  }
  
  return (
    <button 
      type={type}
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.default} ${sizeClasses[size] || sizeClasses.default} ${className}`} 
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

const Input = ({ className = "", ...props }: any) => (
  <input className={`flex h-10 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />
)

const Label = ({ children, htmlFor, className = "" }: any) => (
  <label htmlFor={htmlFor} className={`text-sm font-medium text-white/75 ${className}`}>{children}</label>
)

interface Treatment {
  id: string;
  nombre: string;
  costo_unitario?: number;
  precio?: number;
  precio_base?: number;
  descripcion?: string;
  duracion_minutos?: number;
  activo?: boolean;
  category?: string | null;
  tags?: string[] | null;
}

interface InventoryItem {
  id: string;
  nombre: string;
  stock_actual: number;
  precio_unitario: number;
}

interface TreatmentInventoryItem {
  id: number;
  treatment_id: string;
  inventory_item_id: string;
  cantidad_requerida: number;
  inventory_items?: InventoryItem;
}

export default function EditTreatmentPage() {
  const router = useRouter();
  const params = useParams();
  const treatmentId = params?.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [error, setError] = useState("");
  
  // Inventory state
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [assignedItems, setAssignedItems] = useState<TreatmentInventoryItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [loadingInventory, setLoadingInventory] = useState(false);

  // Form state
  const [nombre, setNombre] = useState("");
  const [costoUnitario, setCostoUnitario] = useState("");
  const [precio, setPrecio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [duracionMinutos, setDuracionMinutos] = useState("");
  const [category, setCategory] = useState<TreatmentCategory | "">("");
  const [tags, setTags] = useState<string[]>([]);

  // Quick Phrases state
  const [managePhrasesOpen, setManagePhrasesOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (treatmentId) {
      fetchTreatment();
      fetchInventoryItems();
      fetchAssignedItems();
    }
  }, [treatmentId]);

  // Insert quick phrase at cursor position
  const handleQuickPhraseSelect = (phraseContent: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setDescripcion(prev => prev ? `${prev}\n\n${phraseContent}` : phraseContent);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = descripcion;

    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = before + phraseContent + after;

    setDescripcion(newText);

    setTimeout(() => {
      textarea.focus();
      const newPosition = start + phraseContent.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const fetchTreatment = async () => {
    try {
      const response = await fetch(`/api/treatments/${treatmentId}`);
      if (!response.ok) throw new Error("Error al cargar el tratamiento");
      
      const data = await response.json();
      setTreatment(data);
      
      // Populate form
      setNombre(data.nombre || "");
      setCostoUnitario(data.costo_unitario?.toString() || "");
      setPrecio((data.precio || data.precio_base)?.toString() || "");
      setCategory(data.category || "");
      setTags(data.tags || []);
      setDescripcion(data.descripcion || "");
      setDuracionMinutos(data.duracion_minutos?.toString() || "");
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const response = await fetch("/api/inventory");
      if (!response.ok) throw new Error("Error al cargar inventario");
      const data = await response.json();
      setInventoryItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading inventory:", err);
    }
  };

  const fetchAssignedItems = async () => {
    setLoadingInventory(true);
    try {
      const response = await fetch(`/api/treatments/${treatmentId}/inventory`);
      if (response.ok) {
        const data = await response.json();
        setAssignedItems(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error loading assigned items:", err);
    }
    setLoadingInventory(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/treatments/${treatmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          costo_unitario: parseFloat(costoUnitario) || 0,
          precio: parseFloat(precio) || 0,
          descripcion,
          duracion_minutos: parseInt(duracionMinutos) || 30,
          activo: true,
          category: category || null,
          tags: tags.length > 0 ? tags : null,
        }),
      });

      if (!response.ok) throw new Error("Error al guardar el tratamiento");

      alert("Tratamiento actualizado exitosamente");
      router.push("/treatments");
    } catch (err: any) {
      setError(err.message);
    }
    setSaving(false);
  };

  const handleAddInventoryItem = async () => {
    if (!selectedItemId || !cantidad) {
      alert("Por favor selecciona un item y cantidad");
      return;
    }

    const payload = {
      inventory_item_id: selectedItemId, // UUID string, no parseInt!
      cantidad_requerida: parseFloat(cantidad),
    };
    try {
      const response = await fetch(`/api/treatments/${treatmentId}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al asignar consumible");
      }

      // Refresh assigned items
      await fetchAssignedItems();
      
      // Reset form
      setSelectedItemId("");
      setCantidad("1");
      setShowAddModal(false);
      
      alert("Consumible asignado exitosamente");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRemoveInventoryItem = async (itemId: number) => {
    if (!confirm("¿Eliminar este consumible del tratamiento?")) return;

    try {
      const response = await fetch(`/api/treatments/${treatmentId}/inventory/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar consumible");

      await fetchAssignedItems();
      alert("Consumible eliminado exitosamente");
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-300"></div>
            <p className="text-white/70">Cargando...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error && !treatment) {
    return (
      <AppLayout>
        <div className="container mx-auto py-10">
          <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 backdrop-blur">
            <p className="text-rose-100">{error}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Available items (not assigned yet)
  const availableItems = inventoryItems.filter(
    item => !assignedItems.some(assigned => assigned.inventory_item_id === item.id)
  );

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/treatments">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-white">Editar Tratamiento</h1>
        </div>

        <div className="space-y-6">
          {/* Treatment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Tratamiento</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={nombre}
                    onChange={(e: any) => setNombre(e.target.value)}
                    placeholder="Ej: Aplicación de Botox"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="costo">Costo Unitario</Label>
                    <Input
                      id="costo"
                      type="number"
                      step="0.01"
                      value={costoUnitario}
                      onChange={(e: any) => setCostoUnitario(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="precio">Precio *</Label>
                    <Input
                      id="precio"
                      type="number"
                      step="0.01"
                      value={precio}
                      onChange={(e: any) => setPrecio(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="duracion">Duración (minutos)</Label>
                  <Input
                    id="duracion"
                    type="number"
                    value={duracionMinutos}
                    onChange={(e: any) => setDuracionMinutos(e.target.value)}
                    placeholder="30"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <QuickPhraseSelector
                      context="treatment"
                      onSelect={handleQuickPhraseSelect}
                      onManage={() => setManagePhrasesOpen(true)}
                    />
                  </div>
                  <textarea
                    ref={textareaRef}
                    id="descripcion"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Descripción del tratamiento... o usa frases rápidas"
                    className="min-h-[100px] flex w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-300/20"
                  />
                  <p className="mt-1 text-xs text-white/55">
                    💡 Usa frases rápidas para indicaciones, contraindicaciones o cuidados comunes
                  </p>
                </div>

                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TreatmentCategory)}
                    className="flex h-10 w-full rounded-xl border border-white/15 bg-[#0b1325] px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-300/20"
                  >
                    <option value="">Sin categoría</option>
                    {TREATMENT_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-white/55">Organiza tus tratamientos por tipo</p>
                </div>

                <div>
                  <Label>Etiquetas (Tags)</Label>
                  <TagsInput
                    value={tags}
                    onChange={setTags}
                    placeholder="Agregar etiquetas (ej: botox, facial, antiaging)..."
                    maxTags={10}
                  />
                  <p className="mt-1 text-xs text-white/55">
                    Agrega etiquetas para facilitar la búsqueda. Presiona Enter para agregar.
                  </p>
                </div>

                {error && (
                  <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 p-3">
                    <p className="text-sm text-rose-100">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={saving} className="flex-1">
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                  <Link href="/treatments">
                    <Button type="button" variant="outline">
                      Cancelar
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Inventory Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-cyan-200" />
                <CardTitle>Consumibles Asignados</CardTitle>
              </div>
              <Button 
                size="sm" 
                onClick={() => setShowAddModal(true)}
                disabled={availableItems.length === 0}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Consumible
              </Button>
            </CardHeader>
            <CardContent>
              {loadingInventory ? (
                <div className="py-8 text-center text-white/60">Cargando consumibles...</div>
              ) : assignedItems.length === 0 ? (
                <div className="py-8 text-center text-white/65">
                  <Package className="mx-auto mb-3 h-12 w-12 text-white/25" />
                  <p>No hay consumibles asignados a este tratamiento</p>
                  <p className="mt-2 text-sm text-white/50">Los consumibles se descontarán automáticamente al aplicar el tratamiento</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignedItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex-1">
                        <p className="font-medium text-white">
                          {item.inventory_items?.nombre || `Item #${item.inventory_item_id}`}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-4 text-sm text-white/70">
                          <span>Cantidad: <strong>{item.cantidad_requerida}</strong></span>
                          <span>Stock: <strong>{item.inventory_items?.stock_actual || 0}</strong></span>
                          <span>Precio: <strong>${item.inventory_items?.precio_unitario || 0}</strong></span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveInventoryItem(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Inventory Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-md rounded-3xl border border-white/10 bg-[#061025]/90 text-white shadow-[0_35px_80px_rgba(2,6,23,0.65)] backdrop-blur-2xl">
              <div className="border-b border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white">Agregar Consumible</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <Label htmlFor="item">Consumible</Label>
                  <select
                    id="item"
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-white/15 bg-[#0b1325] px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-300/20"
                  >
                    <option value="">Seleccionar consumible...</option>
                    {availableItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nombre} (Stock: {item.stock_actual})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="cantidad">Cantidad Requerida</Label>
                  <Input
                    id="cantidad"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={cantidad}
                    onChange={(e: any) => setCantidad(e.target.value)}
                    placeholder="1.0"
                  />
                </div>
              </div>
              <div className="flex gap-3 border-t border-white/10 p-6">
                <Button onClick={handleAddInventoryItem} className="flex-1">
                  Agregar
                </Button>
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Phrase Manager Modal */}
        <QuickPhraseManager
          open={managePhrasesOpen}
          onOpenChange={setManagePhrasesOpen}
          defaultContext="treatment"
        />
      </div>
    </AppLayout>
  );
}
