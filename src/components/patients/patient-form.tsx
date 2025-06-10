"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"

interface PatientFormData {
  nombre: string
  fecha_nacimiento: string
  telefono: string
  email: string
  direccion: string
  requiere_factura: boolean
}

interface PatientFormProps {
  initialData?: PatientFormData
  onSubmit: (data: PatientFormData) => Promise<void>
}

export function PatientForm({ initialData, onSubmit }: PatientFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<PatientFormData>(
    initialData || {
      nombre: "",
      fecha_nacimiento: "",
      telefono: "",
      email: "",
      direccion: "",
      requiere_factura: false,
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await onSubmit(formData)
      router.push("/patients")
    } catch (error) {
      console.error("Error al guardar el paciente:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Completo</Label>
              <Input
                id="nombre"
                name="nombre"
                placeholder="Nombre del paciente"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
              <Input
                id="fecha_nacimiento"
                name="fecha_nacimiento"
                type="date"
                value={formData.fecha_nacimiento}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                type="tel"
                placeholder="Número de teléfono"
                value={formData.telefono}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                name="direccion"
                placeholder="Dirección del paciente"
                value={formData.direccion}
                onChange={handleChange}
              />
            </div>
            <div className="flex items-center space-x-2 md:col-span-2">
              <input
                id="requiere_factura"
                name="requiere_factura"
                type="checkbox"
                checked={formData.requiere_factura}
                onChange={handleChange}
                className="h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-primary"
              />
              <Label htmlFor="requiere_factura" className="select-none">
                Requiere facturar su pago
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar Paciente"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
