"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Stethoscope,
  TrendingUp,
  Edit,
  Trash2,
  Plus,
  Filter
} from "lucide-react";
import AppLayout from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassPanel } from "@/components/ui/glass-panel";
import { CategoryBadgeList } from "@/components/treatments/category-badge";
import { TagsDisplay } from "@/components/treatments/tags-input";
import { cn } from "@/lib/utils";
import { TREATMENT_CATEGORIES, type TreatmentCategory } from "@/lib/types/treatment";

interface Treatment {
  id: number;
  nombre: string;
  costo_unitario?: number;
  precio?: number;
  precio_base?: number;
  descripcion?: string;
  duracion_minutos?: number;
  activo?: boolean;
  category?: string | null;
  tags?: string[] | null;
}

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2
});

const formatCurrency = (value?: number | null) => {
  const amount = typeof value === "number" ? value : 0;
  return currencyFormatter.format(amount);
};

export default function TreatmentsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<TreatmentCategory | 'all'>('all');
  const [searchTags, setSearchTags] = useState<string>('');

  const categoryOptions = useMemo(
    () => [
      { value: 'all' as const, label: 'Todas', icon: '📋' },
      ...TREATMENT_CATEGORIES
    ],
    []
  );

  const treatmentInsights = useMemo(() => {
    if (!treatments.length) {
      return {
        activeCount: 0,
        averagePrice: 0,
        averageMargin: 0,
        premiumCount: 0
      };
    }

    let totalPrice = 0;
    let totalMargin = 0;
    let activeCount = 0;
    let premiumCount = 0;

    treatments.forEach((treatment) => {
      const price = treatment.precio ?? treatment.precio_base ?? 0;
      const cost = treatment.costo_unitario ?? 0;
      const profit = price - cost;
      const margin = price > 0 ? (profit / price) : 0;

      totalPrice += price;
      totalMargin += margin;

      if (treatment.activo !== false) {
        activeCount += 1;
      }

      if (price >= 5000) {
        premiumCount += 1;
      }
    });

    return {
      activeCount,
      averagePrice: totalPrice / treatments.length,
      averageMargin: totalMargin / treatments.length,
      premiumCount
    };
  }, [treatments]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoadingAuth(false);
      
      if (!user) {
        router.push('/auth/signin');
        return;
      }
      
      fetchTreatments();
    };

    getUser();
  }, [router]);

  // Reload treatments when filters change
  useEffect(() => {
    if (user) {
      fetchTreatments();
    }
  }, [selectedCategory, searchTags]);

  const fetchTreatments = async () => {
    setLoading(true);
    setError(""); // Limpiar errores previos
    try {
      // Build query params
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (searchTags) {
        params.append('tags', searchTags);
      }
      
      const url = `/api/treatments${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (Array.isArray(data)) {
        setTreatments(data)
      } else {
        console.error('Expected array, got:', data)
        setTreatments([])
      }
    } catch (error: any) {
      // Si el error es de autenticación, redirigir al login
      if (error.message?.includes("Unauthorized") || error.message?.includes("401")) {
        router.push('/auth/signin');
        return;
      }
      setError(error.message || "Error loading treatments");
      console.error("❌ Error loading treatments:", error);
    }
    setLoading(false);
  };

  // Show loading spinner while checking authentication
  if (loadingAuth || loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center text-white/70">
            <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-300"></div>
            Cargando tratamientos...
          </div>
        </div>
      </AppLayout>
    );
  }

  // Si no está autenticado, redirigir
  if (!user) {
    return null;
  }

  const handleDeleteTreatment = async (treatmentId: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este tratamiento? Esta acción no se puede deshacer.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/treatments/${treatmentId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      // Actualizar la lista de tratamientos
      setTreatments(treatments.filter(t => t.id !== treatmentId));
      alert("Tratamiento eliminado exitosamente");
    } catch (error) {
      console.error("❌ Error deleting treatment:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      alert(`Error al eliminar el tratamiento: ${errorMessage}`);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <GlassPanel className="relative overflow-hidden p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-emerald-500/30 blur-[140px]" />
            <div className="absolute -bottom-40 left-0 h-72 w-72 rounded-full bg-indigo-500/30 blur-[160px]" />
          </div>
          <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="space-y-5 text-white">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-5 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
                <Stethoscope className="h-4 w-4" />
                Tratamientos
              </div>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl border border-white/20 bg-gradient-to-br from-emerald-400/30 to-cyan-400/30 p-4">
                  <Stethoscope className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Catálogo clínico inteligente</h1>
                  <p className="text-sm text-white/70">
                    Controla precios, márgenes y categorías para todo el staff.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-8 text-white/80">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Activos</p>
                  <p className="text-3xl font-semibold">{treatmentInsights.activeCount}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Ticket promedio</p>
                  <p className="text-3xl font-semibold">{formatCurrency(treatmentInsights.averagePrice)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Margen</p>
                  <p className="text-3xl font-semibold">{(treatmentInsights.averageMargin * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Premium</p>
                  <p className="text-3xl font-semibold">{treatmentInsights.premiumCount}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 text-white md:items-end">
              <Link
                href="/treatments/new"
                className="aura-cta aura-cta--primary w-full px-6 text-base md:w-auto"
              >
                <Plus className="h-4 w-4" />
                Nuevo tratamiento
              </Link>
              <button
                onClick={() => fetchTreatments()}
                className="aura-cta aura-cta--ghost w-full px-6 text-base md:w-auto"
              >
                Recargar datos
              </button>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="p-6 space-y-6 text-white">
          <div className="flex flex-wrap items-center gap-3 text-white/80">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-400/40 to-green-500/40 p-2">
              <Filter className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold">Curar catálogo</p>
              <p className="text-sm text-white/60">Filtra por categoría o etiqueta y mantén la vista siempre relevante.</p>
            </div>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchTags('');
              }}
              className="ml-auto text-sm font-semibold text-emerald-200 transition hover:text-emerald-100"
            >
              Limpiar filtros
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="md:w-1/2">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Buscar por etiquetas</p>
                <Input
                  value={searchTags}
                  onChange={(e) => setSearchTags(e.target.value)}
                  placeholder="toxina, premium, sucursal..."
                  className="mt-2 h-12 rounded-full border-white/15 bg-white/5 text-white placeholder:text-white/40 shadow-[0_20px_45px_rgba(2,6,23,0.45)]"
                />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Categorías</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {categoryOptions.map((option) => {
                    const isSelected = selectedCategory === option.value || (!selectedCategory && option.value === 'all');

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSelectedCategory(option.value)}
                        className={cn(
                          "glass-chip cursor-pointer border px-4 py-1.5 text-sm font-semibold tracking-wide",
                          isSelected
                            ? "border-white/80 bg-white/20 text-white shadow-[0_15px_45px_rgba(15,23,42,0.35)]"
                            : "border-white/15 text-white/70 hover:border-white/40 hover:text-white"
                        )}
                        aria-pressed={isSelected}
                      >
                        <span className="text-base">{option.icon}</span>
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-white/70">
              Mostrando {treatments.length} tratamientos con filtros activos
            </div>
          </div>
        </GlassPanel>

        {error && (
          <GlassPanel className="border border-rose-400/30 bg-rose-500/10 p-5 text-rose-50">
            <p className="text-sm font-semibold">{error}</p>
          </GlassPanel>
        )}

        {!error && (
          <>
            {treatments.length === 0 ? (
              <GlassPanel className="flex flex-col items-center gap-4 px-6 py-16 text-center text-white/70">
                <Stethoscope className="h-12 w-12 text-white/60" />
                <div>
                  <p className="text-xl font-semibold text-white">No hay tratamientos con los filtros actuales</p>
                  <p className="mt-2 text-sm text-white/70">
                    Ajusta la categoría o las etiquetas para volver a ver el catálogo completo.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchTags('');
                  }}
                  className="aura-cta aura-cta--primary"
                >
                  Limpiar filtros
                </button>
              </GlassPanel>
            ) : (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
                {treatments.map((treatment) => {
                  const price = treatment.precio ?? treatment.precio_base ?? 0;
                  const cost = treatment.costo_unitario ?? 0;
                  const profit = price - cost;
                  const margin = price > 0 ? (profit / price) * 100 : 0;

                  return (
                    <GlassPanel key={treatment.id} className="space-y-5 border-white/10 p-5 text-white">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-emerald-400/30 to-green-500/20 p-3">
                            <Stethoscope className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold leading-tight">{treatment.nombre}</h3>
                            {treatment.descripcion && (
                              <p className="text-sm text-white/60 line-clamp-2">{treatment.descripcion}</p>
                            )}
                          </div>
                        </div>
                        {treatment.category && (
                          <CategoryBadgeList category={treatment.category as TreatmentCategory} className="border-white/20 bg-white/10 text-white" />
                        )}
                      </div>

                      {treatment.tags && treatment.tags.length > 0 && (
                        <TagsDisplay
                          tags={treatment.tags}
                          className="[&>span]:border-white/20 [&>span]:bg-white/10 [&>span]:text-white"
                        />
                      )}

                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Costo</p>
                          <p className="mt-1 text-2xl font-semibold">{formatCurrency(cost)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Precio</p>
                          <p className="mt-1 text-2xl font-semibold">{formatCurrency(price)}</p>
                        </div>
                        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
                          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-emerald-100">
                            <TrendingUp className="h-3.5 w-3.5" />
                            Margen
                          </div>
                          <p className="mt-1 text-2xl font-semibold text-emerald-100">
                            {formatCurrency(profit)}
                            <span className="ml-2 text-sm font-normal text-emerald-200">({margin.toFixed(1)}%)</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 pt-2">
                        <Button
                          asChild
                          variant="ghost"
                          className="rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/15"
                        >
                          <Link href={`/treatments/${treatment.id}/edit`}>
                            <Edit className="h-4 w-4" />
                            Editar
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          className="rounded-full border border-rose-400/40 bg-transparent text-rose-200 hover:bg-rose-500/10"
                          onClick={() => handleDeleteTreatment(treatment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </Button>
                      </div>
                    </GlassPanel>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}