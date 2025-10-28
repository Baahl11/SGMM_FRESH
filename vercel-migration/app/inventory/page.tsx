'use client'

import { createClient } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, Plus, Edit, Trash2, AlertCircle, TrendingUp, TrendingDown, X, Save, Eye } from 'lucide-react'
import AppLayout from "@/components/layout/app-layout"

// UI Components
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
  descripcion?: string;
  stock_actual: number;
  stock_minimo: number;
  precio_unitario: number;
  categoria?: string;
}

export default function InventoryPage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  // Form state
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [stockActual, setStockActual] = useState("");
  const [stockMinimo, setStockMinimo] = useState("");
  const [precioUnitario, setPrecioUnitario] = useState("");
  const [categoria, setCategoria] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoadingAuth(false);
      
      if (!user) {
        router.push('/auth/signin');
        return;
      }
      
      fetchInventory();
    };

    getUser();
  }, [router])

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/inventory');
      if (!response.ok) throw new Error('Error al cargar inventario');
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setNombre("");
    setDescripcion("");
    setStockActual("");
    setStockMinimo("");
    setPrecioUnitario("");
    setCategoria("");
    setEditingItem(null);
  };

  const handleAddItem = async () => {
    if (!nombre || !stockActual || !precioUnitario) {
      alert("Por favor completa los campos requeridos");
      return;
    }

    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          descripcion,
          stock_actual: parseFloat(stockActual),
          stock_minimo: parseFloat(stockMinimo) || 0,
          precio_unitario: parseFloat(precioUnitario),
          categoria,
        }),
      });

      if (!response.ok) throw new Error('Error al crear item');

      await fetchInventory();
      resetForm();
      setShowAddModal(false);
      alert('Item agregado exitosamente');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleEditItem = async () => {
    if (!editingItem || !nombre || !stockActual || !precioUnitario) {
      alert("Por favor completa los campos requeridos");
      return;
    }

    try {
      const response = await fetch(`/api/inventory/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          descripcion,
          stock_actual: parseFloat(stockActual),
          stock_minimo: parseFloat(stockMinimo) || 0,
          precio_unitario: parseFloat(precioUnitario),
          categoria,
        }),
      });

      if (!response.ok) throw new Error('Error al actualizar item');

      await fetchInventory();
      resetForm();
      setShowAddModal(false);
      alert('Item actualizado exitosamente');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este item?')) return;

    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar item');

      await fetchInventory();
      alert('Item eliminado exitosamente');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setNombre(item.nombre);
    setDescripcion(item.descripcion || "");
    setStockActual(item.stock_actual.toString());
    setStockMinimo(item.stock_minimo.toString());
    setPrecioUnitario(item.precio_unitario.toString());
    setCategoria(item.categoria || "");
    setShowAddModal(true);
  };

  if (loadingAuth || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const lowStockItems = items.filter(item => item.stock_actual <= item.stock_minimo);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white rounded-xl p-6 shadow-sm border border-orange-100 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Inventario
              </h1>
              <p className="text-gray-600">Gestión de insumos médicos y equipamiento</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/inventory/low-stock"
              className="inline-flex items-center justify-center rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Stock bajo
            </Link>
            <Link
              href="/inventory/reports"
              className="inline-flex items-center justify-center rounded-md border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Reportes
            </Link>
            <Button onClick={() => { resetForm(); setShowAddModal(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Item
            </Button>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <Card className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-semibold text-red-900">
                    {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} con stock bajo
                  </p>
                  <p className="text-sm text-red-700">
                    {lowStockItems.map(i => i.nombre).join(', ')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const isLowStock = item.stock_actual <= item.stock_minimo;
            const stockPercentage = item.stock_minimo > 0 
              ? (item.stock_actual / item.stock_minimo) * 100 
              : 100;

            return (
              <Card key={item.id} className={`${isLowStock ? 'border-red-300 bg-red-50/30' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{item.nombre}</CardTitle>
                      {item.descripcion && (
                        <p className="text-sm text-gray-600 mt-1">{item.descripcion}</p>
                      )}
                      {item.categoria && (
                        <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {item.categoria}
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Stock Info */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Stock Actual</p>
                      <p className={`text-2xl font-bold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                        {item.stock_actual}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Mínimo</p>
                      <p className="text-lg font-semibold text-gray-700">{item.stock_minimo}</p>
                    </div>
                  </div>

                  {/* Stock Progress Bar */}
                  <div className="space-y-1">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          stockPercentage > 100 ? 'bg-green-500' :
                          stockPercentage > 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      {stockPercentage > 100 ? (
                        <><TrendingUp className="h-3 w-3 text-green-600" /> <span className="text-green-600">Stock excedente</span></>
                      ) : stockPercentage > 50 ? (
                        <><TrendingUp className="h-3 w-3 text-yellow-600" /> <span className="text-yellow-600">Stock normal</span></>
                      ) : (
                        <><TrendingDown className="h-3 w-3 text-red-600" /> <span className="text-red-600">Stock bajo</span></>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">Precio Unitario</p>
                    <p className="text-xl font-bold text-blue-900">${item.precio_unitario.toFixed(2)}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Valor total: ${(item.stock_actual * item.precio_unitario).toFixed(2)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Link 
                      href={`/inventory/${item.id}`}
                      className="flex-1 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Detalle
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => openEditModal(item)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {items.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay items en el inventario</h3>
              <p className="text-gray-600 mb-4">Comienza agregando tu primer item</p>
              <Button onClick={() => { resetForm(); setShowAddModal(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Primer Item
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
                <h3 className="text-lg font-semibold">
                  {editingItem ? 'Editar Item' : 'Agregar Item'}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={nombre}
                    onChange={(e: any) => setNombre(e.target.value)}
                    placeholder="Ej: Botox Allergan 100U"
                  />
                </div>
                <div>
                  <Label htmlFor="descripcion">Descripción</Label>
                  <textarea
                    id="descripcion"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Descripción del item..."
                    className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stock">Stock Actual *</Label>
                    <Input
                      id="stock"
                      type="number"
                      step="0.01"
                      value={stockActual}
                      onChange={(e: any) => setStockActual(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="minimo">Stock Mínimo</Label>
                    <Input
                      id="minimo"
                      type="number"
                      step="0.01"
                      value={stockMinimo}
                      onChange={(e: any) => setStockMinimo(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="precio">Precio Unitario *</Label>
                  <Input
                    id="precio"
                    type="number"
                    step="0.01"
                    value={precioUnitario}
                    onChange={(e: any) => setPrecioUnitario(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="categoria">Categoría</Label>
                  <Input
                    id="categoria"
                    value={categoria}
                    onChange={(e: any) => setCategoria(e.target.value)}
                    placeholder="Ej: Insumos, Medicamentos"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex gap-3 sticky bottom-0 bg-white">
                <Button 
                  onClick={editingItem ? handleEditItem : handleAddItem} 
                  className="flex-1"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {editingItem ? 'Guardar Cambios' : 'Agregar Item'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}