'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Search, Package, TrendingDown, TrendingUp, AlertTriangle, Check, Edit, Trash2, Minus, History } from 'lucide-react';
import AuthService from '@/lib/auth-service';
import { safeGet, asArray, sortBy } from '@/lib/safeFetch';
import { fetchWithAuth } from '@/lib/api-service';

// Helper function for authenticated fetch calls
const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  console.log('🔧 authenticatedFetch: Delegating to fetchWithAuth for:', url);
  // Usar fetchWithAuth blindado que normaliza cualquier URL
  return fetchWithAuth(url, options);
};

interface InventoryItem {
  id: number;
  nombre: string;
  descripcion?: string;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number;
  costo_unitario: number;
  proveedor?: string;
  codigo_producto?: string;
  fecha_vencimiento?: string;
  ubicacion?: string;
  status: string;
  percentage: number;
  created_at: string;
  updated_at: string;
}

interface InventoryMovement {
  id: number;
  item_id: number;
  tipo: string;
  cantidad: number;
  cantidad_anterior: number;
  cantidad_nueva: number;
  motivo?: string;
  item_name: string;
  created_at: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const [newItem, setNewItem] = useState({
    nombre: '',
    descripcion: '',
    unidad_medida: 'piezas',
    stock_actual: 0,
    stock_minimo: 10,
    stock_maximo: 100,
    costo_unitario: 0,
    proveedor: '',
    codigo_producto: '',
    fecha_vencimiento: '',
    ubicacion: ''
  });

  const [newMovement, setNewMovement] = useState({
    item_id: 0,
    tipo: 'entrada',
    cantidad: 0,
    motivo: ''
  });

  useEffect(() => {
    fetchItems();
    fetchMovements();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Frontend: Starting fetchItems...');
      // USAR ruta API estática para MSI compatibility
      const searchQuery = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
      const result = await safeGet<any>(`/api/inventory${searchQuery}`, { success: false, data: [] });
      console.log('🔍 Frontend: safeGet result:', result);
      const data = result.data;
      console.log('🔍 Frontend: extracted data:', data);
      
      if (result.ok) {
        console.log('🔍 Frontend: Result is OK, processing...');
        // La API regresa directamente un array, no un objeto con success y data
        const rawItems = asArray(data);
        console.log('🔍 Frontend: rawItems after asArray:', rawItems);
        
        // Filtrar por searchTerm en el frontend si hay uno
        const filteredItems = searchTerm 
          ? rawItems.filter((item: any) => 
              item.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.codigo_producto?.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : rawItems;
        
        console.log('🔍 Frontend: filteredItems:', filteredItems);
        
        const processedItems = filteredItems.map((item: any) => {
          const percentage = (item.stock_maximo || 0) > 0 ? ((item.stock_actual || 0) / item.stock_maximo) * 100 : 0;
          let status = 'out';
          
          if ((item.stock_actual || 0) === 0) {
            status = 'out';
          } else if ((item.stock_actual || 0) <= (item.stock_minimo || 0)) {
            status = 'low';
          } else if (percentage >= 80) {
            status = 'high';
          } else if (percentage >= 40) {
            status = 'medium';
          } else {
            status = 'low';
          }
          
          console.log(`📊 Item: ${item.nombre}, Stock: ${item.stock_actual}/${item.stock_maximo}, Percentage: ${percentage.toFixed(1)}%, Status: ${status}`);
          
          return {
            ...item,
            percentage: Math.round(percentage),
            status
          };
        });
        
        console.log('🔍 Frontend: processedItems before setState:', processedItems);
        setItems(processedItems);
        console.log('✅ Frontend: setItems called with:', processedItems.length, 'items');
      } else {
        // Si la API falla, mostrar datos de fallback de ejemplo
        setItems([]);
        if (!result.ok) {
          console.log('⚠️ API falló, mostrando inventario vacío');
        }
      }
    } catch (error) {
      console.error('❌ Error al cargar inventario:', error);
      setItems([]);
      toast.error('Error al cargar inventario');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMovements = async () => {
    try {
      console.log('🔍 Frontend: Fetching movements from API...');
      // USAR ruta API estática para MSI compatibility
      const result = await safeGet<any>('/api/inventory/movements', { success: false, data: [] });
      const data = result.data;
      
      console.log('🔍 Frontend: Movements API response:', { ok: result.ok, data });
      
      if (result.ok && data.success) {
        // Usar asArray para garantizar que siempre sea un array
        const movementsArray = asArray(data.data) as InventoryMovement[];
        // Ordenar por fecha de forma segura
        const sortedMovements = sortBy(movementsArray, (movement: InventoryMovement) => new Date(movement.created_at || 0).getTime());
        setMovements(sortedMovements.reverse()); // Los más recientes primero
        console.log('✅ Frontend: Movements data set successfully:', sortedMovements.length, 'movements');
      } else {
        console.log('⚠️ Movements API falló, mostrando array vacío');
        setMovements([]);
      }
    } catch (error) {
      console.error('❌ Frontend: Error fetching movements:', error);
      setMovements([]);
    }
  };

  const handleCreateItem = async () => {
    try {
      const response = await authenticatedFetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });

      const result = await response.json();
      if (response.ok) {
        // El backend devuelve directamente el objeto del item creado
        toast.success('Item creado exitosamente');
        setShowAddDialog(false);
        setNewItem({
          nombre: '',
          descripcion: '',
          unidad_medida: 'piezas',
          stock_actual: 0,
          stock_minimo: 10,
          stock_maximo: 100,
          costo_unitario: 0,
          proveedor: '',
          codigo_producto: '',
          fecha_vencimiento: '',
          ubicacion: ''
        });
        fetchItems();
      } else {
        toast.error(result?.error || 'Error al crear item');
      }
    } catch (error) {
      toast.error('Error al crear item');
    }
  };

  const handleUpdateItem = async () => {
    if (!selectedItem) return;
    
    try {
      // TODO: El backend no tiene endpoint PUT /items/{id} todavía
      // Comentado temporalmente hasta que se implemente el endpoint
      /*
      const response = await authenticatedFetch(`/api/proxy/inventory/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedItem)
      });

      const result = await response.json();
      if (response.ok) {
        // El backend devuelve directamente el objeto del item actualizado
        toast.success('Item actualizado exitosamente');
        setShowEditDialog(false);
        setSelectedItem(null);
        fetchItems();
      } else {
        toast.error(result?.error || 'Error al actualizar item');
      }
      */
      toast.error('Función de editar no disponible aún');
    } catch (error) {
      toast.error('Error al actualizar item');
    }
  };

  const handleCreateMovement = async () => {
    try {
      // TODO: El backend no tiene endpoint POST /movements todavía
      // Comentado temporalmente hasta que se implemente el endpoint
      /*
      const response = await authenticatedFetch('/api/proxy/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMovement)
      });

      const result = await response.json();
      if (response.ok) {
        // El backend devuelve directamente el objeto del movimiento creado
        toast.success('Movimiento registrado exitosamente');
        setShowMovementDialog(false);
        setNewMovement({
          item_id: 0,
          tipo: 'entrada',
          cantidad: 0,
          motivo: ''
        });
        fetchItems();
        fetchMovements();
      } else {
        toast.error(result?.error || 'Error al registrar movimiento');
      }
      */
      toast.error('Función de movimientos no disponible aún');
    } catch (error) {
      toast.error('Error al registrar movimiento');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'out': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'high': return <Check className="h-4 w-4" />;
      case 'medium': return <Package className="h-4 w-4" />;
      case 'low': return <AlertTriangle className="h-4 w-4" />;
      case 'out': return <Minus className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'high': return 'Stock Alto';
      case 'medium': return 'Stock Medio';
      case 'low': return 'Stock Bajo';
      case 'out': return 'Agotado';
      default: return 'Desconocido';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Control de Inventario</h1>
          <p className="text-muted-foreground">Gestiona el stock de consumibles y materiales</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <History className="h-4 w-4 mr-2" />
                Nuevo Movimiento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Movimiento</DialogTitle>
                <DialogDescription>
                  Registra una entrada o salida de inventario
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="movement-item">Item</Label>
                  <Select 
                    value={newMovement.item_id.toString()} 
                    onValueChange={(value) => setNewMovement({...newMovement, item_id: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar item" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="movement-tipo">Tipo</Label>
                  <Select 
                    value={newMovement.tipo} 
                    onValueChange={(value) => setNewMovement({...newMovement, tipo: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="salida">Salida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="movement-cantidad">Cantidad</Label>
                  <Input
                    id="movement-cantidad"
                    type="number"
                    value={newMovement.cantidad}
                    onChange={(e) => setNewMovement({...newMovement, cantidad: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="movement-motivo">Motivo</Label>
                  <Input
                    id="movement-motivo"
                    value={newMovement.motivo}
                    onChange={(e) => setNewMovement({...newMovement, motivo: e.target.value})}
                    placeholder="Razón del movimiento"
                  />
                </div>
                <Button onClick={handleCreateMovement} className="w-full">
                  Registrar Movimiento
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Agregar Item de Inventario</DialogTitle>
                <DialogDescription>
                  Crea un nuevo item para el control de inventario
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={newItem.nombre}
                    onChange={(e) => setNewItem({...newItem, nombre: e.target.value})}
                    placeholder="Nombre del item"
                  />
                </div>
                <div>
                  <Label htmlFor="codigo">Código</Label>
                  <Input
                    id="codigo"
                    value={newItem.codigo_producto}
                    onChange={(e) => setNewItem({...newItem, codigo_producto: e.target.value})}
                    placeholder="Código del producto"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Input
                    id="descripcion"
                    value={newItem.descripcion}
                    onChange={(e) => setNewItem({...newItem, descripcion: e.target.value})}
                    placeholder="Descripción del item"
                  />
                </div>
                <div>
                  <Label htmlFor="unidad">Unidad</Label>
                  <Select 
                    value={newItem.unidad_medida} 
                    onValueChange={(value) => setNewItem({...newItem, unidad_medida: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="piezas">Piezas</SelectItem>
                      <SelectItem value="ml">Mililitros</SelectItem>
                      <SelectItem value="gramos">Gramos</SelectItem>
                      <SelectItem value="cajas">Cajas</SelectItem>
                      <SelectItem value="rollos">Rollos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="stock-actual">Stock Inicial</Label>
                  <Input
                    id="stock-actual"
                    type="number"
                    value={newItem.stock_actual}
                    onChange={(e) => setNewItem({...newItem, stock_actual: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="stock-min">Stock Mínimo</Label>
                  <Input
                    id="stock-min"
                    type="number"
                    value={newItem.stock_minimo}
                    onChange={(e) => setNewItem({...newItem, stock_minimo: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="stock-max">Stock Máximo</Label>
                  <Input
                    id="stock-max"
                    type="number"
                    value={newItem.stock_maximo}
                    onChange={(e) => setNewItem({...newItem, stock_maximo: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="costo">Costo Unitario</Label>
                  <Input
                    id="costo"
                    type="number"
                    step="0.01"
                    value={newItem.costo_unitario}
                    onChange={(e) => setNewItem({...newItem, costo_unitario: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="proveedor">Proveedor</Label>
                  <Input
                    id="proveedor"
                    value={newItem.proveedor}
                    onChange={(e) => setNewItem({...newItem, proveedor: e.target.value})}
                    placeholder="Nombre del proveedor"
                  />
                </div>
                <div>
                  <Label htmlFor="ubicacion">Ubicación</Label>
                  <Input
                    id="ubicacion"
                    value={newItem.ubicacion}
                    onChange={(e) => setNewItem({...newItem, ubicacion: e.target.value})}
                    placeholder="Dónde se almacena"
                  />
                </div>
                <div>
                  <Label htmlFor="vencimiento">Fecha de Vencimiento</Label>
                  <Input
                    id="vencimiento"
                    type="date"
                    value={newItem.fecha_vencimiento}
                    onChange={(e) => setNewItem({...newItem, fecha_vencimiento: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateItem}>
                  Crear Item
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList>
          <TabsTrigger value="inventory">Items de Inventario</TabsTrigger>
          <TabsTrigger value="movements">Movimientos</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Items de Inventario</CardTitle>
                  <CardDescription>Lista de todos los consumibles y materiales</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchItems()}
                    className="w-64"
                  />
                  <Button variant="outline" onClick={fetchItems}>
                    Buscar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p>Cargando inventario...</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {items.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{item.nombre}</h3>
                            <Badge variant="outline" className={getStatusColor(item.status)}>
                              {getStatusIcon(item.status)}
                              <span className="ml-1">{getStatusText(item.status)}</span>
                            </Badge>
                          </div>
                          {item.descripcion && (
                            <p className="text-sm text-muted-foreground mb-2">{item.descripcion}</p>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Stock:</span> {item.stock_actual} {item.unidad_medida}
                            </div>
                            <div>
                              <span className="font-medium">Mín/Máx:</span> {item.stock_minimo}/{item.stock_maximo}
                            </div>
                            <div>
                              <span className="font-medium">Costo:</span> ${item.costo_unitario}
                            </div>
                            <div>
                              <span className="font-medium">%:</span> {item.percentage}%
                            </div>
                          </div>
                          {(item.proveedor || item.ubicacion || item.codigo_producto) && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-2 pt-2 border-t">
                              {item.codigo_producto && (
                                <div><span className="font-medium">Código:</span> {item.codigo_producto}</div>
                              )}
                              {item.proveedor && (
                                <div><span className="font-medium">Proveedor:</span> {item.proveedor}</div>
                              )}
                              {item.ubicacion && (
                                <div><span className="font-medium">Ubicación:</span> {item.ubicacion}</div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setShowEditDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            item.status === 'high' ? 'bg-green-500' :
                            item.status === 'medium' ? 'bg-yellow-500' :
                            item.status === 'low' ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.max(0, Math.min(item.percentage, 100))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Movimientos</CardTitle>
              <CardDescription>Registro de entradas, salidas y ajustes de inventario</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {movements.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay movimientos registrados</p>
                    <p className="text-sm">Los movimientos de inventario aparecerán aquí</p>
                  </div>
                ) : (
                  movements.map((movement) => (
                    <div key={movement.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={movement.tipo === 'entrada' ? 'default' : 'destructive'}>
                              {movement.tipo === 'entrada' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                              {movement.tipo.toUpperCase()}
                            </Badge>
                            <span className="font-medium">{movement.item_name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {movement.tipo === 'entrada' ? 'Añadido' : 'Retirado'}: {movement.cantidad} unidades
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Stock: {movement.cantidad_anterior} → {movement.cantidad_nueva}
                          </p>
                          {movement.motivo && (
                            <p className="text-sm text-muted-foreground mt-1">
                              <span className="font-medium">Motivo:</span> {movement.motivo}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          {new Date(movement.created_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Item de Inventario</DialogTitle>
            <DialogDescription>
              Modifica la información del item seleccionado
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-nombre">Nombre</Label>
                <Input
                  id="edit-nombre"
                  value={selectedItem.nombre}
                  onChange={(e) => setSelectedItem({...selectedItem, nombre: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-codigo">Código</Label>
                <Input
                  id="edit-codigo"
                  value={selectedItem.codigo_producto || ''}
                  onChange={(e) => setSelectedItem({...selectedItem, codigo_producto: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-descripcion">Descripción</Label>
                <Input
                  id="edit-descripcion"
                  value={selectedItem.descripcion || ''}
                  onChange={(e) => setSelectedItem({...selectedItem, descripcion: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-stock-min">Stock Mínimo</Label>
                <Input
                  id="edit-stock-min"
                  type="number"
                  value={selectedItem.stock_minimo}
                  onChange={(e) => setSelectedItem({...selectedItem, stock_minimo: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label htmlFor="edit-stock-max">Stock Máximo</Label>
                <Input
                  id="edit-stock-max"
                  type="number"
                  value={selectedItem.stock_maximo}
                  onChange={(e) => setSelectedItem({...selectedItem, stock_maximo: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label htmlFor="edit-costo">Costo Unitario</Label>
                <Input
                  id="edit-costo"
                  type="number"
                  step="0.01"
                  value={selectedItem.costo_unitario}
                  onChange={(e) => setSelectedItem({...selectedItem, costo_unitario: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label htmlFor="edit-proveedor">Proveedor</Label>
                <Input
                  id="edit-proveedor"
                  value={selectedItem.proveedor || ''}
                  onChange={(e) => setSelectedItem({...selectedItem, proveedor: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-ubicacion">Ubicación</Label>
                <Input
                  id="edit-ubicacion"
                  value={selectedItem.ubicacion || ''}
                  onChange={(e) => setSelectedItem({...selectedItem, ubicacion: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-vencimiento">Fecha de Vencimiento</Label>
                <Input
                  id="edit-vencimiento"
                  type="date"
                  value={selectedItem.fecha_vencimiento || ''}
                  onChange={(e) => setSelectedItem({...selectedItem, fecha_vencimiento: e.target.value})}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateItem}>
              Actualizar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
