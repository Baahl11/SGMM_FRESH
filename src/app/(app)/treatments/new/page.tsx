"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import ApiService from "@/lib/api-service"

interface TreatmentFormData {
  nombre: string
  descripcion: string
  precio: number
  costo_unitario: number
  // Campos de inventario
  crear_inventario: boolean
  stock_inicial?: number
  stock_minimo?: number
  stock_maximo?: number
  unidad_medida?: string
  proveedor?: string
  codigo_producto?: string
  ubicacion?: string
}

export default function NewTreatmentPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<TreatmentFormData>({
    nombre: "",
    descripcion: "",
    precio: 0,
    costo_unitario: 0,
    // Campos de inventario
    crear_inventario: false,
    stock_inicial: 0,
    stock_minimo: 5,
    stock_maximo: 100,
    unidad_medida: "unidad",
    proveedor: "",
    codigo_producto: "",
    ubicacion: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      // Solo enviar los campos válidos al backend de tratamientos
      const payload = {
        nombre: formData.nombre,
        descripcion: formData.descripcion && formData.descripcion.trim() !== "" ? formData.descripcion : null,
        costo_unitario: formData.costo_unitario,
        precio: formData.precio
      };
      const response = await ApiService.createTreatment(payload);
      if (response.error) {
        throw new Error(response.error)
      }
      // Si se debe crear inventario, hacerlo después de crear el tratamiento
      if (formData.crear_inventario && response.data && response.data.id) {
        const inventoryPayload = {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          stock_actual: formData.stock_inicial || 0,
          stock_minimo: formData.stock_minimo || 0,
          stock_maximo: formData.stock_maximo || 100,
          precio_unitario: formData.costo_unitario || 0,
          activo: true
        };
        const inventoryResponse = await ApiService.createInventoryItem(inventoryPayload);
        if (inventoryResponse.error) {
          throw new Error("Tratamiento creado, pero error al crear item de inventario: " + inventoryResponse.error);
        }
        // Link inventory item to treatment
        if (inventoryResponse.data && inventoryResponse.data.id) {
          const linkResponse = await ApiService.addTreatmentInventoryItem(
            response.data.id,
            inventoryResponse.data.id,
            1 // cantidadRequerida default to 1
          );
          if (linkResponse.error) {
            throw new Error("Error al asociar item de inventario al tratamiento: " + linkResponse.error);
          }
        }
      }
      router.push("/treatments")
    } catch (error) {
      console.error("Error al crear el tratamiento:", error)
      alert("Error al crear el tratamiento")
    } finally {
      setIsLoading(false)
    }
  }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const target = e.target as HTMLInputElement
    
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : 
              type === "checkbox" ? target.checked : value,
    }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      crear_inventario: checked
    }))
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Nuevo Tratamiento</h1>
        <p className="text-muted-foreground mt-2">
          Crear un nuevo tratamiento médico
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Información del Tratamiento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Tratamiento *</Label>
              <Input
                id="nombre"
                name="nombre"
                placeholder="Ej: Consulta General, Radiografía, etc."
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                name="descripcion"
                placeholder="Descripción detallada del tratamiento..."
                value={formData.descripcion}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="precio">Precio de Venta *</Label>
                <Input
                  id="precio"
                  name="precio"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.precio}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costo_unitario">Costo Unitario *</Label>
                <Input
                  id="costo_unitario"
                  name="costo_unitario"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.costo_unitario}
                  onChange={handleChange}
                  required
                />
              </div>            </div>

            {/* Sección de Inventario */}
            <div className="border-t pt-6">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox 
                  id="crear_inventario"
                  checked={formData.crear_inventario}
                  onCheckedChange={handleCheckboxChange}
                />
                <Label htmlFor="crear_inventario" className="text-base font-medium">
                  Crear item de inventario automáticamente
                </Label>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Al activar esta opción, se creará automáticamente un item de inventario con el mismo nombre del tratamiento.
              </p>

              {formData.crear_inventario && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-3">Configuración de Inventario</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stock_inicial">Stock Inicial</Label>
                      <Input
                        id="stock_inicial"
                        name="stock_inicial"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.stock_inicial}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unidad_medida">Unidad de Medida</Label>
                      <Input
                        id="unidad_medida"
                        name="unidad_medida"
                        placeholder="ej: unidad, ml, gramo"
                        value={formData.unidad_medida}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stock_minimo">Stock Mínimo</Label>
                      <Input
                        id="stock_minimo"
                        name="stock_minimo"
                        type="number"
                        min="0"
                        placeholder="5"
                        value={formData.stock_minimo}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock_maximo">Stock Máximo</Label>
                      <Input
                        id="stock_maximo"
                        name="stock_maximo"
                        type="number"
                        min="0"
                        placeholder="100"
                        value={formData.stock_maximo}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="proveedor">Proveedor</Label>
                      <Input
                        id="proveedor"
                        name="proveedor"
                        placeholder="Nombre del proveedor"
                        value={formData.proveedor}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ubicacion">Ubicación</Label>
                      <Input
                        id="ubicacion"
                        name="ubicacion"
                        placeholder="ej: Refrigerador, Estante A"
                        value={formData.ubicacion}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="codigo_producto">Código de Producto</Label>
                    <Input
                      id="codigo_producto"
                      name="codigo_producto"
                      placeholder="SKU o código del producto"
                      value={formData.codigo_producto}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Ganancia Bruta Estimada</h4>
              <div className="text-sm text-muted-foreground">
                ${(formData.precio - formData.costo_unitario).toFixed(2)}
                {formData.precio > 0 && (
                  <span className="ml-2">
                    ({(((formData.precio - formData.costo_unitario) / formData.precio) * 100).toFixed(1)}% margen)
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Crear Tratamiento"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
