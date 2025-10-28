"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CreatePromotionDialog } from "@/components/promociones/create-promotion-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import AppLayout from '@/components/layout/app-layout'
import { Plus, Pencil, Trash2, Package, Loader2, Tag } from 'lucide-react'
import { Badge } from "@/components/ui/badge"

interface Treatment {
  id: string
  nombre: string
  precio_base: number
  costo_unitario: number
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
  created_at: string
  promotion_treatments: PromotionTreatment[]
}

export default function PromocionesPage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoadingAuth(false);
      
      if (!user) {
        router.push('/auth/signin');
        return;
      }
      
      fetchPromotions();
    };

    getUser();
  }, [router])

  const fetchPromotions = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/promotions')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setPromotions(data)
    } catch (error) {
      console.error('Error fetching promotions:', error)
      setError(error instanceof Error ? error.message : 'Error loading promotions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar la promoción "${nombre}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/promotions/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error deleting promotion')
      }

      // Refresh list
      fetchPromotions()
    } catch (error) {
      console.error('Error deleting promotion:', error)
      alert('Error al eliminar la promoción')
    }
  }

  const calculateTotalNormalPrice = (promotion: Promotion) => {
    return promotion.promotion_treatments.reduce((sum, pt) => {
      return sum + (pt.treatment.precio_base * pt.cantidad)
    }, 0)
  }

  if (loadingAuth || isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto py-10">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p>Cargando promociones...</p>
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
      <div className="space-y-8 p-6 bg-gradient-to-br from-purple-50/50 to-pink-50/50 min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center bg-white rounded-xl p-6 shadow-sm border border-purple-100">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Tag className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Promociones
              </h1>
              <p className="text-gray-600">Gestiona tus paquetes y promociones de tratamientos</p>
            </div>
          </div>
          <Button 
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Promoción
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <p className="text-red-600">❌ {error}</p>
            </CardContent>
          </Card>
        )}

        {/* Promotions List */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              Promociones Registradas
            </CardTitle>
            <CardDescription>
              {promotions.length} promocion{promotions.length !== 1 ? 'es' : ''} en total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {promotions.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-16 w-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <Tag className="h-8 w-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No hay promociones registradas</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  Crea promociones para agrupar tratamientos y ofrecer precios especiales.
                </p>
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                  onClick={() => router.push('/promociones/new')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Promoción
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tratamientos</TableHead>
                      <TableHead>Precio Normal</TableHead>
                      <TableHead>Precio Promoción</TableHead>
                      <TableHead>Descuento</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promotions.map((promotion) => {
                      const normalPrice = calculateTotalNormalPrice(promotion)
                      const savings = normalPrice - promotion.precio_total
                      const savingsPercent = normalPrice > 0 ? ((savings / normalPrice) * 100).toFixed(0) : 0

                      return (
                        <TableRow key={promotion.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div className="font-semibold text-gray-900">{promotion.nombre}</div>
                              {promotion.descripcion && (
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {promotion.descripcion}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {promotion.promotion_treatments.map((pt) => (
                                <div key={pt.id} className="text-sm">
                                  {pt.cantidad}x {pt.treatment.nombre}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-gray-500 line-through">
                              ${normalPrice.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-green-600">
                              ${promotion.precio_total.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              -{savingsPercent}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {promotion.activo ? (
                              <Badge className="bg-green-100 text-green-800">Activa</Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                                Inactiva
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/promociones/${promotion.id}/edit`)}
                                className="h-8 w-8 p-0 hover:bg-purple-50"
                                title="Editar promoción"
                              >
                                <Pencil className="h-4 w-4 text-purple-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(promotion.id, promotion.nombre)}
                                className="h-8 w-8 p-0 hover:bg-red-50"
                                title="Eliminar promoción"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Promotion Dialog */}
      <CreatePromotionDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        onSuccess={fetchPromotions}
      />
    </AppLayout>
  )
}
