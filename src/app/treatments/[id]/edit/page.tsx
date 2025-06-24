"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import ApiService from "@/lib/api-service"

interface TreatmentFormData {
  nombre: string
  descripcion: string
  precio: number
  costo_unitario: number
}

export default function EditTreatmentPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [treatment, setTreatment] = useState<TreatmentFormData | null>(null)
  const [formData, setFormData] = useState<TreatmentFormData>({
    nombre: "",
    descripcion: "",
    precio: 0,
    costo_unitario: 0
  })

  useEffect(() => {
    if (params.id) {
      fetchTreatment(parseInt(params.id as string))
    }
  }, [params.id])

  const fetchTreatment = async (id: number) => {
    try {
      const response = await ApiService.getTreatment(id)
      if (response.data) {
        setTreatment(response.data)
        setFormData(response.data)
      }
    } catch (error) {
      console.error("Error al cargar el tratamiento:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await ApiService.updateTreatment(parseInt(params.id as string), formData)
      if (response.error) {
        throw new Error(response.error)
      }
      router.push("/treatments")
    } catch (error) {
      console.error("Error al actualizar el tratamiento:", error)
      alert("Error al actualizar el tratamiento")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }))
  }

  if (!treatment) {
    return <div>Cargando...</div>
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Editar Tratamiento</h1>
        <p className="text-muted-foreground mt-2">
          Modificar los datos del tratamiento
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
              </div>
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
                {isLoading ? "Guardando..." : "Actualizar Tratamiento"}
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
