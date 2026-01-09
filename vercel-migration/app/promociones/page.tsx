"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CreatePromotionDialog } from "@/components/promociones/create-promotion-dialog"
import AppLayout from '@/components/layout/app-layout'
import { GlassPanel } from "@/components/ui/glass-panel";
import { Plus, Pencil, Trash2, Package, Loader2, Tag } from 'lucide-react'
import { cn } from "@/lib/utils";

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

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 0
});

const formatCurrency = (value?: number | null) => currencyFormatter.format(value ?? 0)

export default function PromocionesPage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const heroStats = useMemo(() => {
    if (!promotions.length) {
      return {
        total: 0,
        avgDiscount: 0,
        totalSavings: 0
      }
    }

    let accumulatedDiscount = 0
    let accumulatedSavings = 0

    promotions.forEach((promotion) => {
      const normalPrice = calculateTotalNormalPrice(promotion)
      const savings = Math.max(normalPrice - promotion.precio_total, 0)
      accumulatedSavings += savings
      const discount = normalPrice > 0 ? (savings / normalPrice) * 100 : 0
      accumulatedDiscount += discount
    })

    return {
      total: promotions.length,
      avgDiscount: accumulatedDiscount / promotions.length,
      totalSavings: accumulatedSavings
    }
  }, [promotions])

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
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center text-white/70">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-emerald-200" />
            Cargando promociones...
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
      <div className="space-y-8">
        <GlassPanel className="relative overflow-hidden p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-fuchsia-400/30 blur-[140px]" />
            <div className="absolute -bottom-32 left-0 h-72 w-72 rounded-full bg-violet-500/30 blur-[160px]" />
          </div>
          <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between text-white">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-5 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
                <Tag className="h-4 w-4" />
                Promociones activas
              </div>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl border border-white/20 bg-gradient-to-br from-fuchsia-400/30 to-rose-400/30 p-4">
                  <Package className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Laboratorio de promociones</h1>
                  <p className="text-sm text-white/70">
                    Crea bundles irresistibles, controla márgenes y sincroniza todo.
                  </p>
                </div>
              </div>
              <div className="grid gap-6 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Promociones</p>
                  <p className="text-3xl font-semibold">{heroStats.total}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Ahorro promedio</p>
                  <p className="text-3xl font-semibold">{heroStats.avgDiscount.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Ahorro acumulado</p>
                  <p className="text-3xl font-semibold">{formatCurrency(heroStats.totalSavings)}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <Button
                onClick={() => setDialogOpen(true)}
                className="aura-cta aura-cta--primary w-full px-6 text-base md:w-auto"
              >
                <Plus className="h-4 w-4" />
                Nueva promoción
              </Button>
              <button
                onClick={() => fetchPromotions()}
                className="aura-cta aura-cta--ghost w-full px-6 text-base md:w-auto"
              >
                Actualizar catálogo
              </button>
            </div>
          </div>
        </GlassPanel>

        {error && (
          <GlassPanel className="border border-rose-400/30 bg-rose-500/10 p-5 text-rose-50">
            <p className="text-sm font-semibold">{error}</p>
          </GlassPanel>
        )}

        {!error && (
          promotions.length === 0 ? (
            <GlassPanel className="flex flex-col items-center gap-4 px-6 py-16 text-center text-white/80">
              <Tag className="h-12 w-12 text-white/60" />
              <div>
                <p className="text-xl font-semibold text-white">Sin promociones aún</p>
                <p className="mt-2 text-sm text-white/70">
                  Crea tu primer bundle para disparar campañas y ofertas estacionales.
                </p>
              </div>
              <Button
                onClick={() => setDialogOpen(true)}
                className="aura-cta aura-cta--primary"
              >
                <Plus className="h-4 w-4" />
                Crear primera promoción
              </Button>
            </GlassPanel>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {promotions.map((promotion) => {
                const normalPrice = calculateTotalNormalPrice(promotion)
                const savings = Math.max(normalPrice - promotion.precio_total, 0)
                const savingsPercent = normalPrice > 0 ? ((savings / normalPrice) * 100) : 0

                return (
                  <GlassPanel key={promotion.id} className="space-y-5 border-white/10 p-6 text-white">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-white/50">Bundle clínico</p>
                        <h3 className="text-2xl font-semibold leading-tight">{promotion.nombre}</h3>
                        {promotion.descripcion && (
                          <p className="mt-1 text-sm text-white/70">
                            {promotion.descripcion}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em]",
                          promotion.activo
                            ? "border border-emerald-300/40 bg-emerald-400/15 text-emerald-100"
                            : "border border-white/20 bg-white/5 text-white/60"
                        )}
                      >
                        {promotion.activo ? "Activa" : "Inactiva"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {promotion.promotion_treatments.map((pt) => (
                        <span
                          key={pt.id}
                          className="glass-chip border-white/20 bg-white/10 text-sm text-white"
                        >
                          {pt.cantidad}x {pt.treatment.nombre}
                        </span>
                      ))}
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Precio normal</p>
                        <p className="mt-2 text-2xl font-semibold text-white/80">
                          <span className="line-through opacity-70">{formatCurrency(normalPrice)}</span>
                        </p>
                      </div>
                      <div className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 p-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-emerald-100">Precio promo</p>
                        <p className="mt-2 text-2xl font-semibold text-emerald-50">
                          {formatCurrency(promotion.precio_total)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-fuchsia-300/40 bg-fuchsia-400/15 p-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-white/80">Ahorro</p>
                        <p className="mt-2 text-2xl font-semibold">
                          {formatCurrency(savings)}
                          <span className="ml-2 text-sm font-normal text-white/70">({savingsPercent.toFixed(0)}%)</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        className="rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/15"
                        variant="ghost"
                        onClick={() => router.push(`/promociones/${promotion.id}/edit`)}
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        className="rounded-full border border-rose-400/50 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20"
                        variant="ghost"
                        onClick={() => handleDelete(promotion.id, promotion.nombre)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </GlassPanel>
                )
              })}
            </div>
          )
        )}
      </div>

      <CreatePromotionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchPromotions}
      />
    </AppLayout>
  )
}
