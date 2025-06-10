"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"

// Mock data - será reemplazado con datos reales de la API
const mockTreatments = [
  { id: "1", nombre: "Limpieza Dental", precio: 1500 },
  { id: "2", nombre: "Extracción", precio: 2000 },
]

import { PaymentForm } from "./payment-form"
import { PaymentMethod, Terminal, InstallmentPeriod } from "@/lib/payment"

interface RecordFormData {
  patient_id?: string
  treatment_id: string
  fecha: string
  monto_pagado: number
  metodo_pago: PaymentMethod
  terminal?: Terminal
  installments?: InstallmentPeriod
  notas: string
  facturado: boolean
}

interface RecordFormProps {
  initialData?: RecordFormData
  patientId?: string
  onSubmit: (data: RecordFormData) => Promise<void>
}

type SelectChangeValue = {
  treatment_id: string
  metodo_pago: string
  facturado: boolean
}

export function RecordForm({ initialData, patientId, onSubmit }: RecordFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<RecordFormData>(
    initialData || {
      patient_id: patientId,
      treatment_id: "",
      fecha: new Date().toISOString().split("T")[0],
      monto_pagado: 0,
      metodo_pago: "cash",
      terminal: undefined,
      installments: undefined,
      notas: "",
      facturado: false,
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await onSubmit(formData)
      router.push(patientId ? `/patients/${patientId}` : "/records")
    } catch (error) {
      console.error("Error al guardar el registro:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "monto_pagado" ? parseFloat(value) || 0 : value,
    }))
  }

  const handleSelectChange = <K extends keyof SelectChangeValue>(
    name: K,
    value: SelectChangeValue[K]
  ): void => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="treatment_id">Tratamiento</Label>
              <Select
                value={formData.treatment_id}
                onValueChange={(value: string) =>
                  handleSelectChange("treatment_id", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tratamiento" />
                </SelectTrigger>
                <SelectContent>
                  {mockTreatments.map((treatment) => (
                    <SelectItem key={treatment.id} value={treatment.id}>
                      {treatment.nombre} - ${treatment.precio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                name="fecha"
                type="date"
                value={formData.fecha}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monto_pagado">Monto Pagado</Label>
              <Input
                id="monto_pagado"
                name="monto_pagado"
                type="number"
                min="0"
                step="0.01"
                value={formData.monto_pagado}
                onChange={handleChange}
                required
              />
            </div>

            <div className="md:col-span-2">
              <PaymentForm
                amount={formData.monto_pagado}
                onTotalChange={(total) => {
                  if (total !== formData.monto_pagado) {
                    setFormData((prev) => ({
                      ...prev,
                      monto_pagado: total,
                    }));
                  }
                }}
                onPaymentMethodChange={(method, terminal, installments) => {
                  if (method !== formData.metodo_pago || 
                      terminal !== formData.terminal || 
                      installments !== formData.installments) {
                    setFormData((prev) => ({
                      ...prev,
                      metodo_pago: method,
                      terminal,
                      installments,
                    }));
                  }
                }}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notas">Notas</Label>
              <Input
                id="notas"
                name="notas"
                placeholder="Notas adicionales"
                value={formData.notas}
                onChange={handleChange}
              />
            </div>

            <div className="flex items-center space-x-2 md:col-span-2">
              <input
                id="facturado"
                name="facturado"
                type="checkbox"
                checked={formData.facturado}
                onChange={(e) => handleSelectChange("facturado", e.target.checked)}
                className="h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-primary"
              />
              <Label htmlFor="facturado" className="select-none">
                Requiere factura
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
              {isLoading ? "Guardando..." : "Guardar Registro"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
