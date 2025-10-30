"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Package, Plus, X } from "lucide-react";
import AppLayout from "@/components/layout/app-layout";

// UI Components (igual que edit page)
const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>{children}</div>
)

const CardHeader = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`p-6 pb-4 border-b border-gray-100 ${className}`}>{children}</div>
)

const CardTitle = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
)

const CardContent = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`p-6 ${className}`}>{children}</div>
)

const Button = ({ children, className = "", variant = "default", size = "default", onClick, disabled = false, type = "button" }: any) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md transition-colors font-medium"
  const variantClasses: Record<string, string> = {
    default: "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed",
    outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700",
    destructive: "bg-red-600 text-white hover:bg-red-700"
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
  <input className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />
)

const Label = ({ children, htmlFor, className = "" }: any) => (
  <label htmlFor={htmlFor} className={`text-sm font-medium text-gray-700 ${className}`}>{children}</label>
)

interface InventoryItem {
  id: string;
  nombre: string;
  stock_actual: number;
  precio_unitario: number;
}

interface SelectedConsumible {
  inventory_item_id: string;
  cantidad_requerida: number;
  nombre: string;
  stock_actual: number;
  precio_unitario: number;
}

export default function NewTreatmentPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [nombre, setNombre] = useState("");
  const [costoUnitario, setCostoUnitario] = useState("");
  const [precio, setPrecio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [duracionMinutos, setDuracionMinutos] = useState("30");

  // Inventory state
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedConsumibles, setSelectedConsumibles] = useState<SelectedConsumible[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [loadingInventory, setLoadingInventory] = useState(true);

  // Fetch available inventory items
  useEffect(() => {
    fetchInventoryItems();
  }, []);

  const fetchInventoryItems = async () => {
    try {
      const response = await fetch("/api/inventory");
      if (!response.ok) throw new Error("Error al cargar inventario");
      const data = await response.json();
      setInventoryItems(data);
    } catch (err) {
      console.error("Error fetching inventory:", err);
    } finally {
      setLoadingInventory(false);
    }
  };

  const handleAddConsumible = () => {
    if (!selectedItemId || !cantidad) {
      alert("Selecciona un consumible y cantidad");
      return;
    }

    const item = inventoryItems.find(i => i.id === selectedItemId);
    if (!item) return;

    const cantidadNum = parseFloat(cantidad);
    if (cantidadNum <= 0) {
      alert("La cantidad debe ser mayor a 0");
      return;
    }

    // Check if already added
    if (selectedConsumibles.some(c => c.inventory_item_id === selectedItemId)) {
      alert("Este consumible ya está en la lista");
      return;
    }

    setSelectedConsumibles([
      ...selectedConsumibles,
      {
        inventory_item_id: item.id,
        cantidad_requerida: cantidadNum,
        nombre: item.nombre,
        stock_actual: item.stock_actual,
        precio_unitario: item.precio_unitario,
      },
    ]);

    // Reset modal
    setSelectedItemId("");
    setCantidad("1");
    setShowAddModal(false);
  };

  const handleRemoveConsumible = (itemId: string) => {
    setSelectedConsumibles(selectedConsumibles.filter(c => c.inventory_item_id !== itemId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      // Step 1: Create the treatment
      const response = await fetch("/api/treatments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          costo_unitario: parseFloat(costoUnitario) || 0,
          precio: parseFloat(precio) || 0,
          descripcion: descripcion || null,
          duracion_minutos: parseInt(duracionMinutos) || 30,
          activo: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear el tratamiento");
      }

      const createdTreatment = await response.json();
      const treatmentId = createdTreatment.id;

      // Step 2: Assign consumibles if any were selected
      if (selectedConsumibles.length > 0) {
        console.log(`📦 Asignando ${selectedConsumibles.length} consumibles al tratamiento ${treatmentId}`);
        
        for (const consumible of selectedConsumibles) {
          try {
            const inventoryResponse = await fetch(`/api/treatments/${treatmentId}/inventory`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                inventory_item_id: consumible.inventory_item_id,
                cantidad_requerida: consumible.cantidad_requerida,
              }),
            });

            if (!inventoryResponse.ok) {
              const errorData = await inventoryResponse.json();
              console.error(`❌ Error asignando ${consumible.nombre}:`, errorData);
              // Continue with other items even if one fails
            } else {
              console.log(`✅ Asignado: ${consumible.nombre} (${consumible.cantidad_requerida})`);
            }
          } catch (inventoryErr) {
            console.error(`❌ Error asignando consumible:`, inventoryErr);
            // Continue with other items
          }
        }
      }

      alert(`Tratamiento creado exitosamente${selectedConsumibles.length > 0 ? ` con ${selectedConsumibles.length} consumible(s) asignado(s)` : ''}`);
      router.push("/treatments");
    } catch (err: any) {
      console.error("Error creating treatment:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Calculate profit margin
  const precioNum = parseFloat(precio) || 0;
  const costoNum = parseFloat(costoUnitario) || 0;
  const ganancia = precioNum - costoNum;
  const margen = precioNum > 0 ? (ganancia / precioNum) * 100 : 0;

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
          <h1 className="text-3xl font-bold text-gray-900">Nuevo Tratamiento</h1>
        </div>

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
                  placeholder="Ej: Aplicación de Botox, Limpieza Dental"
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
                  <p className="text-xs text-gray-500 mt-1">Costo de materiales y recursos</p>
                </div>
                <div>
                  <Label htmlFor="precio">Precio de Venta *</Label>
                  <Input
                    id="precio"
                    type="number"
                    step="0.01"
                    value={precio}
                    onChange={(e: any) => setPrecio(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Precio que cobra al paciente</p>
                </div>
              </div>

              {/* Profit Margin Display */}
              {precioNum > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-900">Ganancia Estimada</p>
                      <p className="text-2xl font-bold text-green-700">${ganancia.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-700">Margen</p>
                      <p className="text-xl font-semibold text-green-800">{margen.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="duracion">Duración (minutos)</Label>
                <Input
                  id="duracion"
                  type="number"
                  value={duracionMinutos}
                  onChange={(e: any) => setDuracionMinutos(e.target.value)}
                  placeholder="30"
                />
                <p className="text-xs text-gray-500 mt-1">Tiempo estimado del procedimiento</p>
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripción detallada del tratamiento..."
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={saving} className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Creando..." : "Crear Tratamiento"}
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

        {/* Consumibles Section */}
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle>Consumibles Asignados (Opcional)</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Los consumibles se descontarán automáticamente del inventario al aplicar el tratamiento
                </p>
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={() => setShowAddModal(true)}
              disabled={loadingInventory || inventoryItems.filter(item => !selectedConsumibles.some(s => s.inventory_item_id === item.id)).length === 0}
              type="button"
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Consumible
            </Button>
          </CardHeader>
          <CardContent>
            {loadingInventory ? (
              <div className="text-center py-8 text-gray-500">Cargando consumibles disponibles...</div>
            ) : selectedConsumibles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="font-medium">No hay consumibles asignados</p>
                <p className="text-sm mt-2">Puedes agregar consumibles ahora o editarlos más tarde</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedConsumibles.map((item) => (
                  <div key={item.inventory_item_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.nombre}</p>
                      <div className="flex gap-4 mt-1 text-sm text-gray-600">
                        <span>Cantidad: <strong>{item.cantidad_requerida}</strong></span>
                        <span>Stock disponible: <strong>{item.stock_actual}</strong></span>
                        <span>Precio unitario: <strong>${item.precio_unitario}</strong></span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveConsumible(item.inventory_item_id)}
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                  <p className="text-sm text-blue-800">
                    <strong>{selectedConsumibles.length}</strong> consumible(s) seleccionado(s). 
                    Se asignarán al guardar el tratamiento.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Consumible Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Agregar Consumible</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <Label htmlFor="item">Consumible</Label>
                  <select
                    id="item"
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar...</option>
                    {inventoryItems
                      .filter(item => !selectedConsumibles.some(s => s.inventory_item_id === item.id))
                      .map((item) => (
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
                    value={cantidad}
                    onChange={(e: any) => setCantidad(e.target.value)}
                    placeholder="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Cantidad que se descontará cada vez que se aplique el tratamiento
                  </p>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex gap-3">
                <Button onClick={handleAddConsumible} className="flex-1" type="button">
                  Agregar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedItemId("");
                    setCantidad("1");
                  }}
                  type="button"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
