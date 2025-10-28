"use client"

import { useState, useEffect } from "react"
import { useSession } from 'next-auth/react'
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import AppLayout from '@/components/layout/app-layout'
import { ArrowLeft, Plus, Trash2, Loader2, Tag, DollarSign, Save } from 'lucide-react'
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface Treatment {
  id: string
  nombre: string
  precio_base: number
  costo_unitario: number
}

interface SelectedTreatment {
  treatment_id: string
  cantidad: number
  treatment: Treatment
}

interface PromotionTreatment {
  id: string
  cantidad: number
  treatment: Treatment
}

interface Promotion {
  id: string
  nombre: string
  descripcion?: string
  precio_total: number
  descuento_porcentaje: number
  activo: boolean
  promotion_treatments: PromotionTreatment[]
}

export default function EditPromocionPage({ params }: { params: Promise<{ id: string }> }) {
  const [promotionId, setPromotionId] = useState<string | null>(null)
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Form state
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [precioTotal, setPrecioTotal] = useState("")
  const [activo, setActivo] = useState(true)
  
  // Treatments
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [selectedTreatments, setSelectedTreatments] = useState<SelectedTreatment[]>([])
  const [loadingTreatments, setLoadingTreatments] = useState(true)
  const [loadingPromotion, setLoadingPromotion] = useState(true)
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    params.then(({ id }) => {
      setPromotionId(id)
    })
  }, [params])

  useEffect(() => {
    if (status === 'loading' || !promotionId) return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetchTreatments()
    fetchPromotion()
  }, [session, status, router, promotionId])

  const fetchTreatments = async () => {
    try {
      setLoadingTreatments(true)
      const response = await fetch('/api/treatments')
      if (!response.ok) throw new Error('Error loading treatments')
      const data = await response.json()
      setTreatments(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching treatments:', error)
      setError('Error al cargar tratamientos')
    } finally {
      setLoadingTreatments(false)
    }
  }

  const fetchPromotion = async () => {
    if (!promotionId) return
    
    try {
      setLoadingPromotion(true)
      const response = await fetch(`/api/promotions/${promotionId}`)
      if (!response.ok) throw new Error('Error loading promotion')
      
      const promotion: Promotion = await response.json()
      
      // Set form fields
      setNombre(promotion.nombre)
      setDescripcion(promotion.descripcion || "")
      setPrecioTotal(promotion.precio_total.toString())
      setActivo(promotion.activo)
      
      // Set selected treatments
      setSelectedTreatments(
        promotion.promotion_treatments.map(pt => ({
          treatment_id: pt.treatment.id,
          cantidad: pt.cantidad,
          treatment: pt.treatment
        }))
      )
    } catch (error) {
      console.error('Error fetching promotion:', error)
      setError('Error al cargar la promoción')
    } finally {
      setLoadingPromotion(false)
    }
  }

  const addTreatment = (treatmentId: string) => {
    const treatment = treatments.find(t => t.id === treatmentId)
    if (!treatment) return

    if (selectedTreatments.find(st => st.treatment_id === treatmentId)) {
      alert('Este tratamiento ya está agregado')
      return
    }

    setSelectedTreatments([
      ...selectedTreatments,
      {
        treatment_id: treatmentId,
        cantidad: 1,
        treatment
      }
    ])
  }

  const removeTreatment = (treatmentId: string) => {
    setSelectedTreatments(selectedTreatments.filter(st => st.treatment_id !== treatmentId))
  }

  const updateQuantity = (treatmentId: string, cantidad: number) => {
    if (cantidad < 1) return
    setSelectedTreatments(
      selectedTreatments.map(st =>
        st.treatment_id === treatmentId ? { ...st, cantidad } : st
      )
    )
  }

  // Calculate totals
  const totalNormal = selectedTreatments.reduce((sum, st) => {
    return sum + (st.treatment.precio_base * st.cantidad)
  }, 0)

  const precioPromocion = parseFloat(precioTotal) || 0
  const ahorro = totalNormal - precioPromocion
  const descuentoPorcentaje = totalNormal > 0 ? ((ahorro / totalNormal) * 100) : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nombre.trim()) {
      alert('El nombre es requerido')
      return
    }

    if (selectedTreatments.length === 0) {
      alert('Debes agregar al menos un tratamiento')
      return
    }

    if (!precioTotal || parseFloat(precioTotal) <= 0) {
      alert('El precio total debe ser mayor a 0')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/promotions/${promotionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          descripcion,
          precio_total: parseFloat(precioTotal),
          descuento_porcentaje: descuentoPorcentaje,
          activo,
          treatments: selectedTreatments.map(st => ({
            treatment_id: st.treatment_id,
            cantidad: st.cantidad
          }))
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error updating promotion')
      }

      // Success - redirect to promotions list
      router.push('/promociones')
    } catch (error) {
      console.error('Error updating promotion:', error)
      setError(error instanceof Error ? error.message : 'Error al actualizar la promoción')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loadingPromotion) {
    return (
      <AppLayout>
        <div className="container mx-auto py-10">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-600" />
            <p>Cargando promoción...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!session) return null

  return (
    <AppLayout>
      <div className="space-y-8 p-6 bg-gradient-to-br from-purple-50/50 to-pink-50/50 min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center bg-white rounded-xl p-6 shadow-sm border border-purple-100">
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/promociones">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Tag className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Editar Promoción
                </h1>
                <p className="text-gray-600">Modifica los datos del paquete</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600">❌ {error}</p>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column - Form */}
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle>Información de la Promoción</CardTitle>
                <CardDescription>Modifica los datos básicos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre de la Promoción *</Label>
                  <Input
                    id="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Paquete Botox Premium"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Descripción opcional de la promoción..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="precio">Precio Total de la Promoción *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="precio"
                      type="number"
                      value={precioTotal}
                      onChange={(e) => setPrecioTotal(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activo">Estado</Label>
                  <Select value={activo ? "true" : "false"} onValueChange={(v) => setActivo(v === "true")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Activa</SelectItem>
                      <SelectItem value="false">Inactiva</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Right Column - Treatments */}
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle>Tratamientos Incluidos</CardTitle>
                <CardDescription>Modifica los tratamientos del paquete</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Agregar Tratamiento</Label>
                  {loadingTreatments ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Cargando tratamientos...</span>
                    </div>
                  ) : (
                    <Select onValueChange={addTreatment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tratamiento" />
                      </SelectTrigger>
                      <SelectContent>
                        {treatments.map(treatment => (
                          <SelectItem key={treatment.id} value={treatment.id}>
                            {treatment.nombre} - ${treatment.precio_base.toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  {selectedTreatments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                      <Plus className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No hay tratamientos agregados</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedTreatments.map(st => (
                        <div
                          key={st.treatment_id}
                          className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-100"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{st.treatment.nombre}</div>
                            <div className="text-sm text-gray-600">
                              ${st.treatment.precio_base.toLocaleString()} c/u
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={st.cantidad}
                              onChange={(e) => updateQuantity(st.treatment_id, parseInt(e.target.value))}
                              min="1"
                              className="w-16 text-center"
                            />
                            <span className="text-sm text-gray-600">x</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTreatment(st.treatment_id)}
                              className="h-8 w-8 p-0 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Card */}
          {selectedTreatments.length > 0 && (
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4 text-purple-900">Resumen de la Promoción</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Precio Normal</p>
                    <p className="text-2xl font-bold text-gray-900 line-through">
                      ${totalNormal.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Precio Promoción</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${precioPromocion.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ahorro</p>
                    <p className="text-2xl font-bold text-purple-600">
                      ${ahorro.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Descuento</p>
                    <Badge className="text-lg px-3 py-1 bg-green-100 text-green-800">
                      -{descuentoPorcentaje.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" asChild disabled={loading}>
              <Link href="/promociones">Cancelar</Link>
            </Button>
            <Button
              type="submit"
              disabled={loading || selectedTreatments.length === 0}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
