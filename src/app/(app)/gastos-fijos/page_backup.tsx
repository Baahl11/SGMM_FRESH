"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, DollarSign, Calendar, FileText, TrendingDown, Calculator } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ApiService from "@/lib/api-service";

interface GastoFijo {
  id: number;
  nombre: string;      // Backend devuelve 'nombre'
  monto: number;
  categoria: string;   // Backend devuelve 'categoria'
  fecha: string;       // Backend devuelve 'fecha'
  notas?: string;
}

interface GastoFijoFormData {
  concepto: string;
  monto: string;
  frecuencia: string;
  fecha_inicio: string;
  notas: string;
}

export default function GastosFijosPage() {
  const [gastosFijos, setGastosFijos] = useState<GastoFijo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGasto, setEditingGasto] = useState<GastoFijo | null>(null);
  const [formData, setFormData] = useState<GastoFijoFormData>({
    concepto: "",
    monto: "",
    frecuencia: "mensual",
    fecha_inicio: "",
    notas: ""
  });

  useEffect(() => {
    loadGastosFijos();
  }, []);

  const loadGastosFijos = async () => {
    try {
      const response = await ApiService.getGastosFijos();
      if (response.data) {
        setGastosFijos(response.data);
      }
    } catch (error) {
      console.error("Error loading gastos fijos:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      concepto: "",
      monto: "",
      frecuencia: "mensual",
      fecha_inicio: "",
      notas: ""
    });
    setEditingGasto(null);
  };

  const openEditDialog = (gasto: GastoFijo) => {
    setEditingGasto(gasto);
    setFormData({
      concepto: gasto.nombre,         // Backend devuelve 'nombre'
      monto: gasto.monto.toString(),
      frecuencia: gasto.categoria,    // Backend devuelve 'categoria'
      fecha_inicio: gasto.fecha.split('T')[0], // Backend devuelve 'fecha'
      notas: gasto.notas || ""
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const gastoData = {
      nombre: formData.concepto,  // Backend espera 'nombre', no 'concepto'
      monto: parseFloat(formData.monto),
      categoria: formData.frecuencia,  // Backend espera 'categoria', no 'frecuencia'
      fecha: formData.fecha_inicio,    // Backend espera 'fecha', no 'fecha_inicio'
      notas: formData.notas || null
    };

    try {
      if (editingGasto) {
        await ApiService.updateGastoFijo(editingGasto.id, gastoData);
      } else {
        await ApiService.createGastoFijo(gastoData);
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadGastosFijos();
    } catch (error) {
      console.error("Error saving gasto fijo:", error);
      alert("Error al guardar el gasto fijo");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este gasto fijo?")) {
      return;
    }

    try {
      await ApiService.deleteGastoFijo(id);
      loadGastosFijos();
    } catch (error) {
      console.error("Error deleting gasto fijo:", error);
      alert("Error al eliminar el gasto fijo");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const calculateMonthlyTotal = () => {
    return gastosFijos.reduce((total, gasto) => {
      switch (gasto.categoria) {  // Backend devuelve 'categoria'
        case "mensual":
          return total + gasto.monto;
        case "anual":
          return total + (gasto.monto / 12);
        case "trimestral":
          return total + (gasto.monto / 3);
        default:
          return total + gasto.monto;
      }
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando gastos fijos...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center bg-white rounded-xl p-6 shadow-sm border border-blue-100">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
            <Calculator className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
              Gastos Fijos
            </h1>
            <p className="text-gray-600">
              Gestiona los gastos fijos del consultorio
            </p>
          </div>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-sm flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Gasto Fijo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingGasto ? "Editar Gasto Fijo" : "Nuevo Gasto Fijo"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="concepto">Concepto</Label>
                <Input
                  id="concepto"
                  value={formData.concepto}
                  onChange={(e) => setFormData(prev => ({ ...prev, concepto: e.target.value }))}
                  placeholder="Ej: Renta, Luz, Internet..."
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="monto">Monto</Label>
                <Input
                  id="monto"
                  type="number"
                  step="0.01"
                  value={formData.monto}
                  onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="frecuencia">Frecuencia</Label>
                <Select 
                  value={formData.frecuencia} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, frecuencia: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensual">Mensual</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="fecha_inicio">Fecha de Inicio</Label>
                <Input
                  id="fecha_inicio"
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="notas">Notas (Opcional)</Label>
                <Textarea
                  id="notas"
                  value={formData.notas}
                  onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                  placeholder="Notas adicionales..."
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingGasto ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Gastos Activos
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gastosFijos.length}</div>
            <p className="text-xs text-muted-foreground">
              Gastos fijos registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gasto Mensual Estimado
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(calculateMonthlyTotal())}
            </div>
            <p className="text-xs text-muted-foreground">
              Promedio mensual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gasto Anual Estimado
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(calculateMonthlyTotal() * 12)}
            </div>
            <p className="text-xs text-muted-foreground">
              Proyección anual
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gastos Fijos List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Gastos Fijos</CardTitle>
        </CardHeader>
        <CardContent>
          {gastosFijos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No hay gastos fijos registrados
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Gasto Fijo
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {gastosFijos.map((gasto) => (
                <div
                  key={gasto.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{gasto.nombre}</h3>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium text-green-600">
                        {formatCurrency(gasto.monto)}
                      </span>
                      {" • "}
                      <span className="capitalize">{gasto.categoria}</span>
                      {" • "}
                      <span>Desde: {new Date(gasto.fecha).toLocaleDateString('es-MX')}</span>
                    </div>
                    {gasto.notas && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {gasto.notas}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(gasto)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(gasto.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
