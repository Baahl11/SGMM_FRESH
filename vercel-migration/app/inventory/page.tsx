'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Package, Plus, Edit, Trash2, AlertCircle, TrendingUp, TrendingDown, X, Save, Eye } from 'lucide-react'
import { createClient } from "@/lib/supabase/client";
import AppLayout from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassPanel } from "@/components/ui/glass-panel";
import { cn } from "@/lib/utils";
import { ToastProvider, useToast } from "@/components/ui/toast-container";

interface InventoryItem {
  id: string;
  nombre: string;
  descripcion?: string;
  stock_actual: number;
  stock_minimo: number;
  precio_unitario: number;
  categoria?: string;
}

const formatCurrency = (value?: number) => {
  try {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value ?? 0);
  } catch (error) {
    return `$${(value ?? 0).toFixed(2)}`;
  }
};

function InventoryPageContent() {
  const toast = useToast();
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

  const lowStockItems = useMemo(() => (
    items.filter(item => item.stock_actual <= item.stock_minimo)
  ), [items]);

  const inventoryStats = useMemo(() => {
    if (!items.length) {
      return {
        totalItems: 0,
        totalValue: 0,
        lowStock: 0,
        categories: 0
      };
    }

    const totalValue = items.reduce((acc, item) => acc + (item.stock_actual * item.precio_unitario), 0);
    const categories = new Set(items.map(item => item.categoria).filter(Boolean)).size;

    return {
      totalItems: items.length,
      totalValue,
      lowStock: lowStockItems.length,
      categories
    };
  }, [items, lowStockItems]);

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
      toast.warning("Completa los campos requeridos");
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
      toast.success('Item agregado correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al agregar item');
    }
  };

  const handleEditItem = async () => {
    if (!editingItem || !nombre || !stockActual || !precioUnitario) {
      toast.warning("Completa los campos requeridos");
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
      toast.success('Item actualizado correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar item');
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
      toast.success('Item eliminado correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar item');
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
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center text-white/70">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-300" />
            Sincronizando inventario...
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!user) {
    return null
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <GlassPanel className="relative overflow-hidden p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-amber-400/25 blur-[140px]" />
            <div className="absolute -bottom-36 left-0 h-72 w-72 rounded-full bg-orange-500/30 blur-[160px]" />
          </div>
          <div className="relative flex flex-col gap-8 text-white md:flex-row md:items-center md:justify-between">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-5 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
                <Package className="h-4 w-4" />
                Inventario inteligente
              </div>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl border border-white/20 bg-gradient-to-br from-amber-400/30 to-red-400/30 p-4">
                  <Package className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Control en tiempo real</h1>
                  <p className="text-sm text-white/70">Monitorea consumos críticos, valor del stock y categorías.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Items</p>
                  <p className="text-3xl font-semibold">{inventoryStats.totalItems}</p>
                  <p className="text-xs text-white/60">Registrados</p>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Valor total</p>
                  <p className="text-3xl font-semibold">{formatCurrency(inventoryStats.totalValue)}</p>
                  <p className="text-xs text-white/60">MXN</p>
                </div>
                <div className="rounded-2xl border border-rose-300/40 bg-rose-500/15 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/70">Stock bajo</p>
                  <p className="text-3xl font-semibold">{inventoryStats.lowStock}</p>
                  <p className="text-xs text-white/70">Alertas críticas</p>
                </div>
                <div className="rounded-2xl border border-emerald-300/40 bg-emerald-500/15 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/70">Categorías</p>
                  <p className="text-3xl font-semibold">{inventoryStats.categories}</p>
                  <p className="text-xs text-white/70">Segmentos activos</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <button
                onClick={() => { resetForm(); setShowAddModal(true); }}
                className="aura-cta aura-cta--primary w-full px-6 text-base md:w-auto"
              >
                <Plus className="h-4 w-4" />
                Agregar item
              </button>
              <div className="flex flex-wrap gap-3">
                <Link href="/inventory/low-stock" className="aura-cta aura-cta--ghost px-6 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Stock bajo
                </Link>
                <Link href="/inventory/reports" className="aura-cta aura-cta--ghost px-6 text-sm">
                  <TrendingUp className="h-4 w-4" />
                  Reportes
                </Link>
              </div>
            </div>
          </div>
        </GlassPanel>

        {lowStockItems.length > 0 && (
          <GlassPanel className="border border-amber-400/30 bg-amber-500/10 p-5 text-amber-50">
            <div className="flex flex-wrap items-center gap-3">
              <AlertCircle className="h-6 w-6 text-amber-200" />
              <div>
                <p className="text-base font-semibold">
                  {lowStockItems.length} item{lowStockItems.length === 1 ? '' : 's'} requieren reposición
                </p>
                <p className="text-sm text-amber-100">
                  {lowStockItems.map((item) => item.nombre).join(', ')}
                </p>
              </div>
              <Link
                href="/inventory/low-stock"
                className="ml-auto text-sm font-semibold text-white/80 underline-offset-4 hover:underline"
              >
                Ver detalle
              </Link>
            </div>
          </GlassPanel>
        )}

        {items.length === 0 ? (
          <GlassPanel className="flex flex-col items-center gap-4 px-6 py-16 text-center text-white/70">
            <Package className="h-12 w-12 text-white/60" />
            <div>
              <p className="text-xl font-semibold text-white">Aún no hay items en inventario</p>
              <p className="mt-2 text-sm text-white/70">Registra tu primer insumo para activar el seguimiento automático.</p>
            </div>
            <button
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="aura-cta aura-cta--primary"
            >
              <Plus className="h-4 w-4" />
              Crear primer item
            </button>
          </GlassPanel>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const isLowStock = item.stock_actual <= item.stock_minimo;
              const stockPercentage = item.stock_minimo > 0 ? (item.stock_actual / item.stock_minimo) * 100 : 100;
              const stockStatus = stockPercentage > 100 ? 'excedente' : stockPercentage > 50 ? 'normal' : 'bajo';

              return (
                <GlassPanel
                  key={item.id}
                  className={cn(
                    'space-y-5 border-white/10 p-5 text-white transition-shadow',
                    isLowStock && 'border-rose-400/40 shadow-[0_25px_60px_rgba(244,63,94,0.25)]'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-white/50">Item</p>
                      <h3 className="text-xl font-semibold leading-tight">{item.nombre}</h3>
                      {item.descripcion && (
                        <p className="mt-1 text-sm text-white/70 line-clamp-2">{item.descripcion}</p>
                      )}
                      {item.categoria && (
                        <span className="glass-chip mt-3 border-white/30 bg-white/10 text-xs text-white">
                          {item.categoria}
                        </span>
                      )}
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em]',
                        isLowStock
                          ? 'border border-rose-300/60 bg-rose-500/20 text-rose-100'
                          : 'border border-white/20 bg-white/10 text-white/70'
                      )}
                    >
                      {isLowStock ? 'Stock bajo' : 'Saludable'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-white/50">Actual</p>
                      <p className="text-3xl font-semibold">{item.stock_actual}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.3em] text-white/50">Mínimo</p>
                      <p className="text-xl font-semibold text-white/80">{item.stock_minimo}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          stockStatus === 'excedente' && 'bg-emerald-400',
                          stockStatus === 'normal' && 'bg-amber-300',
                          stockStatus === 'bajo' && 'bg-rose-400'
                        )}
                        style={{ width: `${Math.min(stockPercentage, 120)}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      {stockStatus === 'excedente' && <TrendingUp className="h-3 w-3 text-emerald-300" />}
                      {stockStatus === 'normal' && <TrendingUp className="h-3 w-3 text-amber-300" />}
                      {stockStatus === 'bajo' && <TrendingDown className="h-3 w-3 text-rose-300" />}
                      <span className="capitalize">Stock {stockStatus}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">Precio unitario</p>
                    <p className="mt-2 text-2xl font-semibold">{formatCurrency(item.precio_unitario)}</p>
                    <p className="text-xs text-white/60">
                      Valor total: {formatCurrency(item.stock_actual * item.precio_unitario)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-1">
                    <Button
                      asChild
                      variant="ghost"
                      className="flex-1 rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/15"
                    >
                      <Link href={`/inventory/${item.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Detalle
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex-1 rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/15"
                      onClick={() => openEditModal(item)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      className="rounded-full border border-rose-400/60 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </GlassPanel>
              );
            })}
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
            <GlassPanel className="relative w-full max-w-md space-y-4 border-white/20 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">{editingItem ? 'Actualizar' : 'Nuevo'}</p>
                  <h3 className="text-2xl font-semibold">{editingItem ? 'Editar item' : 'Agregar item'}</h3>
                </div>
                <button
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="rounded-full border border-white/15 p-2 text-white/60 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="nombre" className="text-white/80">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={nombre}
                    onChange={(e: any) => setNombre(e.target.value)}
                    placeholder="Ej: Botox Allergan 100U"
                    className="mt-2 border-white/20 bg-white/5 text-white placeholder:text-white/40"
                  />
                </div>
                <div>
                  <Label htmlFor="descripcion" className="text-white/80">Descripción</Label>
                  <textarea
                    id="descripcion"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Descripción del item..."
                    className="mt-2 w-full rounded-2xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="stock" className="text-white/80">Stock actual *</Label>
                    <Input
                      id="stock"
                      type="number"
                      step="0.01"
                      value={stockActual}
                      onChange={(e: any) => setStockActual(e.target.value)}
                      placeholder="0"
                      className="mt-2 border-white/20 bg-white/5 text-white placeholder:text-white/40"
                    />
                  </div>
                  <div>
                    <Label htmlFor="minimo" className="text-white/80">Stock mínimo</Label>
                    <Input
                      id="minimo"
                      type="number"
                      step="0.01"
                      value={stockMinimo}
                      onChange={(e: any) => setStockMinimo(e.target.value)}
                      placeholder="0"
                      className="mt-2 border-white/20 bg-white/5 text-white placeholder:text-white/40"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="precio" className="text-white/80">Precio unitario *</Label>
                  <Input
                    id="precio"
                    type="number"
                    step="0.01"
                    value={precioUnitario}
                    onChange={(e: any) => setPrecioUnitario(e.target.value)}
                    placeholder="0.00"
                    className="mt-2 border-white/20 bg-white/5 text-white placeholder:text-white/40"
                  />
                </div>
                <div>
                  <Label htmlFor="categoria" className="text-white/80">Categoría</Label>
                  <Input
                    id="categoria"
                    value={categoria}
                    onChange={(e: any) => setCategoria(e.target.value)}
                    placeholder="Ej: Insumos, Medicamentos"
                    className="mt-2 border-white/20 bg-white/5 text-white placeholder:text-white/40"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  onClick={editingItem ? handleEditItem : handleAddItem}
                  className="aura-cta aura-cta--primary flex-1"
                >
                  <Save className="h-4 w-4" />
                  {editingItem ? 'Guardar cambios' : 'Agregar item'}
                </button>
                <button
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="aura-cta aura-cta--ghost flex-1"
                >
                  Cancelar
                </button>
              </div>
            </GlassPanel>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default function InventoryPage() {
  return (
    <ToastProvider>
      <InventoryPageContent />
    </ToastProvider>
  )
}