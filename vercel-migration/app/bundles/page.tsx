"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Save, 
  Edit, 
  Trash2, 
  Package, 
  DollarSign,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface Treatment {
  id: string;
  nombre: string;
  precio: number;
  selected?: boolean;
}

interface Bundle {
  id: string;
  nombre: string;
  descripcion?: string;
  precio_total: number;
  tratamientos: Treatment[];
  created_at: string;
}

export default function BundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio_total: 0,
    tratamientos_seleccionados: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load treatments from API
      const treatmentsResponse = await fetch('/api/treatments');
      if (treatmentsResponse.ok) {
        const treatmentsData = await treatmentsResponse.json();
        setTreatments(treatmentsData);
      }

      // Load existing bundles
      const bundlesResponse = await fetch('/api/bundles');
      if (bundlesResponse.ok) {
        const bundlesData = await bundlesResponse.json();
        setBundles(bundlesData);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBundle = async () => {
    try {
      const selectedTreatments = treatments.filter(t => 
        formData.tratamientos_seleccionados.includes(t.id)
      );

      const bundleData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio_total: formData.precio_total,
        tratamientos: selectedTreatments
      };

      const response = editingBundle 
        ? await fetch(`/api/bundles/${editingBundle.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bundleData)
          })
        : await fetch('/api/bundles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bundleData)
          });

      if (response.ok) {
        await loadData();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving bundle:', error);
    }
  };

  const handleDeleteBundle = async (bundleId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este paquete?')) return;

    try {
      const response = await fetch(`/api/bundles/${bundleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Error deleting bundle:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      precio_total: 0,
      tratamientos_seleccionados: []
    });
    setShowForm(false);
    setEditingBundle(null);
  };

  const startEdit = (bundle: Bundle) => {
    setEditingBundle(bundle);
    setFormData({
      nombre: bundle.nombre,
      descripcion: bundle.descripcion || '',
      precio_total: bundle.precio_total,
      tratamientos_seleccionados: bundle.tratamientos.map(t => t.id)
    });
    setShowForm(true);
  };

  const calculateSuggestedPrice = () => {
    const selectedTreatments = treatments.filter(t => 
      formData.tratamientos_seleccionados.includes(t.id)
    );
    return selectedTreatments.reduce((sum, t) => sum + (t.precio || 0), 0);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Paquetes de Tratamientos</h1>
          <p className="text-gray-600 mt-2">
            Crea paquetes personalizados combinando tus tratamientos
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Crear Nuevo Paquete
        </Button>
      </div>

      {/* Form for creating/editing bundles */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingBundle ? 'Editar Paquete' : 'Crear Nuevo Paquete'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nombre del Paquete *
                </label>
                <Input
                  placeholder="Ej: Consulta + Botox"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Precio Total *
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="2500"
                    value={formData.precio_total}
                    onChange={(e) => setFormData({...formData, precio_total: Number(e.target.value)})}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const suggested = calculateSuggestedPrice();
                      setFormData({...formData, precio_total: suggested});
                    }}
                  >
                    Usar suma: ${calculateSuggestedPrice()}
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Descripción
              </label>
              <Textarea
                placeholder="Describe las ventajas de este paquete..."
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Tratamientos Incluidos *
              </label>
              <div className="grid gap-2 md:grid-cols-2">
                {treatments.map(treatment => (
                  <div key={treatment.id} className="flex items-center gap-2 p-3 border rounded-lg">
                    <input
                      type="checkbox"
                      id={treatment.id}
                      checked={formData.tratamientos_seleccionados.includes(treatment.id)}
                      onChange={(e) => {
                        const tratamientos = e.target.checked
                          ? [...formData.tratamientos_seleccionados, treatment.id]
                          : formData.tratamientos_seleccionados.filter(id => id !== treatment.id);
                        setFormData({...formData, tratamientos_seleccionados: tratamientos});
                      }}
                    />
                    <label htmlFor={treatment.id} className="flex-1">
                      {treatment.nombre} - ${(treatment.precio || 0).toLocaleString()}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveBundle}
                disabled={!formData.nombre || formData.tratamientos_seleccionados.length === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                {editingBundle ? 'Actualizar' : 'Crear'} Paquete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List of existing bundles */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {bundles.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No has creado paquetes aún
            </h3>
            <p className="text-gray-600 mb-4">
              Crea tu primer paquete combinando tratamientos comunes
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primer Paquete
            </Button>
          </div>
        ) : (
          bundles.map(bundle => (
            <Card key={bundle.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{bundle.nombre}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-2xl font-bold text-green-600">
                        ${bundle.precio_total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(bundle)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteBundle(bundle.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {bundle.descripcion && (
                  <p className="text-gray-600 text-sm mb-4">{bundle.descripcion}</p>
                )}
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Tratamientos incluidos:</h4>
                  <div className="flex flex-wrap gap-1">
                    {bundle.tratamientos.map(treatment => (
                      <Badge key={treatment.id} variant="secondary" className="text-xs">
                        {treatment.nombre}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Creado: {new Date(bundle.created_at).toLocaleDateString()}</span>
                    <span>{bundle.tratamientos.length} tratamientos</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      )}
    </div>
  );
}