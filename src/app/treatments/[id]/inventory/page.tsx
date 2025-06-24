'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Package, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { authenticatedFetch } from '@/lib/auth-service';

interface Treatment {
  id: number;
  nombre: string;
  costo_unitario: number;
  precio: number;
  descripcion?: string;
}

interface InventoryItem {
  id: number;
  nombre: string;
  descripcion?: string;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number;
}

interface TreatmentInventoryItem {
  id: number;
  treatment_id: number;
  inventory_item_id: number;
  cantidad_requerida: number;
  inventory_item_name: string;
  treatment_name: string;
}

export default function TreatmentInventoryPage() {
  const params = useParams();
  const router = useRouter();
  const treatmentId = parseInt(params.id as string);

  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [treatmentInventory, setTreatmentInventory] = useState<TreatmentInventoryItem[]>([]);  const [availableInventory, setAvailableInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const [newItem, setNewItem] = useState({
    inventory_item_id: 0,
    cantidad_requerida: 1
  });

  useEffect(() => {
    fetchData();
  }, [treatmentId]);  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch treatment info
      console.log(`Fetching treatment ${treatmentId}...`);
      const treatmentResponse = await authenticatedFetch(`/api/treatments/${treatmentId}`);
      
      if (treatmentResponse.ok) {
        const treatmentData = await treatmentResponse.json();
        setTreatment(treatmentData);
        console.log('Treatment loaded:', treatmentData);
      } else {
        console.error('Error fetching treatment:', treatmentResponse.status, treatmentResponse.statusText);
        if (treatmentResponse.status === 404) {
          setError(`Tratamiento con ID ${treatmentId} no encontrado`);
          return;
        }
      }

      // Fetch treatment inventory
      console.log(`Fetching treatment inventory for ${treatmentId}...`);
      const inventoryResponse = await authenticatedFetch(`/api/treatments/${treatmentId}/inventory`);
      
      if (inventoryResponse.ok) {
        const inventoryData = await inventoryResponse.json();
        setTreatmentInventory(inventoryData);
        console.log('Treatment inventory loaded:', inventoryData);
      } else {
        console.error('Error fetching treatment inventory:', inventoryResponse.status, inventoryResponse.statusText);
      }

      // Fetch available inventory items
      console.log('Fetching available inventory...');
      const availableResponse = await authenticatedFetch('/api/inventory');
      
      if (availableResponse.ok) {
        const availableData = await availableResponse.json();
        setAvailableInventory(availableData);
        console.log('Available inventory loaded:', availableData);
      } else {
        console.error('Error fetching available inventory:', availableResponse.status, availableResponse.statusText);
      }
      
    } catch (error) {
      console.error('Error in fetchData:', error);
      setError('Error al cargar datos. Por favor, verifica tu conexión.');
    } finally {
      setIsLoading(false);
    }
  };
  const handleAddItem = async () => {
    if (!newItem.inventory_item_id) {
      toast.error('Selecciona un item de inventario');
      return;
    }

    try {
      const response = await authenticatedFetch(`/api/treatments/${treatmentId}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });

      if (response.ok) {
        toast.success('Item agregado exitosamente');
        setShowAddDialog(false);
        setNewItem({ inventory_item_id: 0, cantidad_requerida: 1 });
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al agregar item');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Error al agregar item');
    }
  };
  const handleRemoveItem = async (itemId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este item?')) {
      return;
    }

    try {
      const response = await authenticatedFetch(`/api/treatments/${treatmentId}/inventory/${itemId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Item eliminado exitosamente');
        fetchData();
      } else {
        console.error('Error removing item:', response.status);
        toast.error('Error al eliminar item');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Error al eliminar item');
    }
  };

  const getAvailableItems = () => {
    const usedItemIds = treatmentInventory.map(ti => ti.inventory_item_id);
    return availableInventory.filter(item => !usedItemIds.includes(item.id));
  };
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <div className="mt-4">
              <Link href="/treatments">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Tratamientos
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!treatment) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Tratamiento no encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p>El tratamiento con ID {treatmentId} no existe.</p>
            <div className="mt-4">
              <Link href="/treatments">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Tratamientos
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/treatments">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Tratamientos
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Inventario para {treatment.nombre}</h1>
          <p className="text-muted-foreground">Configura qué consumibles requiere este tratamiento</p>
        </div>
      </div>

      {treatment.costo_unitario === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800">Tratamiento sin costo unitario</h3>
                <p className="text-sm text-yellow-700">
                  Este tratamiento tiene costo unitario de $0, por lo que no consumirá inventario automáticamente.
                  Para que consuma inventario, edita el tratamiento y asigna un costo unitario mayor a $0.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Items Configurados</CardTitle>
                <CardDescription>Consumibles que se descuentan automáticamente</CardDescription>
              </div>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Agregar Consumible</DialogTitle>
                    <DialogDescription>
                      Selecciona un item de inventario que se consume con este tratamiento
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="inventory-item">Item de Inventario</Label>
                      <Select 
                        value={newItem.inventory_item_id.toString()} 
                        onValueChange={(value) => setNewItem({...newItem, inventory_item_id: parseInt(value)})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar item" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableItems().map((item) => (
                            <SelectItem key={item.id} value={item.id.toString()}>
                              {item.nombre} ({item.unidad_medida})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="cantidad">Cantidad Requerida</Label>
                      <Input
                        id="cantidad"
                        type="number"
                        min="1"
                        value={newItem.cantidad_requerida}
                        onChange={(e) => setNewItem({...newItem, cantidad_requerida: parseInt(e.target.value) || 1})}
                      />
                    </div>
                    <Button onClick={handleAddItem} className="w-full">
                      Agregar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {treatmentInventory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay items configurados</p>
                  <p className="text-sm">Este tratamiento no consumirá inventario automáticamente</p>
                </div>
              ) : (
                treatmentInventory.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.inventory_item_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Cantidad: {item.cantidad_requerida}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>¿Cómo funciona?</CardTitle>
            <CardDescription>Información sobre el consumo automático de inventario</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Consumo Automático</h4>
              <p className="text-sm text-blue-700">
                Cuando se registra un paciente con este tratamiento, el sistema descuenta automáticamente 
                los items configurados del inventario.
              </p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">Condiciones</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• El tratamiento debe tener costo unitario &gt; $0</li>
                <li>• Debe haber stock suficiente disponible</li>
                <li>• Se registra automáticamente en movimientos</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Alertas</h4>
              <p className="text-sm text-yellow-700">
                Si no hay stock suficiente, se descuenta lo disponible y se genera una alerta 
                en el dashboard de inventario.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
