'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from "@/components/layout/app-layout";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GlassPanel } from "@/components/ui/glass-panel";
import GastoVariableModal from "@/components/gastos/gasto-variable-modal";
import GastoFijoModal from "@/components/gastos/gasto-fijo-modal";
import {
  buildSatDeductibilitySummary,
  evaluateSatDeductibility,
  type SatDeductibilityStatus,
  type SatDeductibilitySummary,
  type SatExpenseEvaluation
} from '@/lib/fiscal/sat-deductibility';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Plus,
  Receipt,
  Wrench,
  ShoppingCart,
  Briefcase,
  Megaphone,
  GraduationCap,
  Laptop,
  Plane,
  MoreHorizontal,
  FileText,
  Search,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface GastoFijo {
  id: number;
  concepto: string;
  monto: number;
  frecuencia: 'mensual' | 'anual' | 'trimestral';
  activo: boolean;
  fecha_inicio: string;
  notas?: string;
}

interface GastoVariable {
  id: number;
  concepto: string;
  descripcion?: string;
  categoria: string;
  monto: number;
  fecha: string;
  metodo_pago?: string;
  proveedor?: string;
  proveedor_rfc?: string;
  factura_numero?: string;
  factura_url?: string;
  factura_tipo?: string;
  es_deducible: boolean;
  notas?: string;
  tags?: string[];
  estado: string;
  created_at: string;
}

interface Stats {
  total: number;
  total_deducible: number;
  total_deducible_sat?: number;
  total_no_deducible_sat?: number;
  total_revision_sat?: number;
  count: number;
  por_categoria: Array<{ categoria: string; total: number; count: number }>;
  promedio: number;
  sat?: SatDeductibilitySummary;
}

const SAT_STATUS_STYLES: Record<SatDeductibilityStatus, { badgeClass: string; textClass: string }> = {
  deducible_probable: {
    badgeClass: 'border border-emerald-300/60 bg-emerald-500/15 text-emerald-100',
    textClass: 'text-emerald-100'
  },
  no_deducible: {
    badgeClass: 'border border-rose-300/60 bg-rose-500/15 text-rose-100',
    textClass: 'text-rose-100'
  },
  requiere_revision: {
    badgeClass: 'border border-amber-300/60 bg-amber-500/15 text-amber-100',
    textClass: 'text-amber-100'
  }
};

const CATEGORIAS_CONFIG = {
  reparacion: { label: 'Reparación', icon: Wrench, chipClass: 'border border-rose-400/40 bg-rose-500/20 text-rose-50' },
  mantenimiento: { label: 'Mantenimiento', icon: Wrench, chipClass: 'border border-amber-400/40 bg-amber-500/20 text-amber-50' },
  compras_equipo: { label: 'Compra de equipo', icon: ShoppingCart, chipClass: 'border border-sky-400/40 bg-sky-500/20 text-sky-50' },
  insumos_extraordinarios: { label: 'Insumos extraordinarios', icon: ShoppingCart, chipClass: 'border border-cyan-400/40 bg-cyan-500/20 text-cyan-50' },
  servicios_profesionales: { label: 'Servicios profesionales', icon: Briefcase, chipClass: 'border border-purple-400/40 bg-purple-500/20 text-purple-50' },
  marketing: { label: 'Marketing', icon: Megaphone, chipClass: 'border border-pink-400/40 bg-pink-500/20 text-pink-50' },
  capacitacion: { label: 'Capacitación', icon: GraduationCap, chipClass: 'border border-indigo-400/40 bg-indigo-500/20 text-indigo-50' },
  tecnologia: { label: 'Tecnología', icon: Laptop, chipClass: 'border border-emerald-400/40 bg-emerald-500/20 text-emerald-50' },
  viajes: { label: 'Viajes', icon: Plane, chipClass: 'border border-yellow-400/40 bg-yellow-500/20 text-yellow-50' },
  otros: { label: 'Otros', icon: MoreHorizontal, chipClass: 'border border-white/30 bg-white/10 text-white' }
} as const;

const ESTADO_CONFIG = {
  pendiente: { label: 'Pendiente', badgeClass: 'border border-amber-300/60 bg-amber-500/15 text-amber-50' },
  aprobado: { label: 'Aprobado', badgeClass: 'border border-emerald-300/60 bg-emerald-500/15 text-emerald-50' },
  rechazado: { label: 'Rechazado', badgeClass: 'border border-rose-300/60 bg-rose-500/15 text-rose-50' },
  pagado: { label: 'Pagado', badgeClass: 'border border-sky-300/60 bg-sky-500/15 text-sky-50' }
} as const;

export default function GastosPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [gastosFijos, setGastosFijos] = useState<GastoFijo[]>([]);
  const [loadingFijos, setLoadingFijos] = useState(true);

  const [gastosVariables, setGastosVariables] = useState<GastoVariable[]>([]);
  const [loadingVariables, setLoadingVariables] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [mesFilter, setMesFilter] = useState<string>('0');
  const [añoFilter] = useState<string>(new Date().getFullYear().toString());

  const [showVariableModal, setShowVariableModal] = useState(false);
  const [editingGasto, setEditingGasto] = useState<GastoVariable | null>(null);
  const [showFijoModal, setShowFijoModal] = useState(false);
  const [editingGastoFijo, setEditingGastoFijo] = useState<GastoFijo | null>(null);

  const loadGastosFijos = useCallback(async () => {
    try {
      setLoadingFijos(true);
      const response = await fetch('/api/gastos-fijos?only_active=true');
      if (response.ok) {
        const data = await response.json();
        setGastosFijos(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading gastos fijos:', error);
    } finally {
      setLoadingFijos(false);
    }
  }, []);

  const loadGastosVariables = useCallback(async () => {
    try {
      setLoadingVariables(true);
      let url = '/api/gastos-variables?';
      if (mesFilter !== '0' && añoFilter) {
        url += `mes=${mesFilter}&año=${añoFilter}`;
      } else if (añoFilter) {
        url += `año=${añoFilter}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        setGastosVariables(result.data || []);
      }
    } catch (error) {
      console.error('Error loading gastos variables:', error);
    } finally {
      setLoadingVariables(false);
    }
  }, [mesFilter, añoFilter]);

  const loadStats = useCallback(async () => {
    try {
      let url = '/api/gastos-variables/stats?';
      if (mesFilter !== '0' && añoFilter) {
        url += `mes=${mesFilter}&año=${añoFilter}`;
      } else if (añoFilter) {
        url += `año=${añoFilter}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [mesFilter, añoFilter]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoadingAuth(false);

      if (!user) {
        router.push('/auth/signin');
      }
    };

    getUser();
  }, [router, supabase]);

  useEffect(() => {
    if (user) {
      loadGastosFijos();
      loadGastosVariables();
      loadStats();
    }
  }, [user, loadGastosFijos, loadGastosVariables, loadStats]);

  const handleEditGasto = (gasto: GastoVariable) => {
    setEditingGasto(gasto);
    setShowVariableModal(true);
  };

  const handleDeleteGasto = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) return;

    try {
      const response = await fetch(`/api/gastos-variables/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadGastosVariables();
        loadStats();
      } else {
        alert('Error al eliminar el gasto');
      }
    } catch (error) {
      console.error('Error deleting gasto:', error);
      alert('Error al eliminar el gasto');
    }
  };

  const handleModalSuccess = () => {
    loadGastosVariables();
    loadStats();
    setEditingGasto(null);
  };

  const handleModalClose = () => {
    setShowVariableModal(false);
    setEditingGasto(null);
  };

  const handleFijoModalSuccess = () => {
    loadGastosFijos();
    setEditingGastoFijo(null);
  };

  const handleFijoModalClose = () => {
    setShowFijoModal(false);
    setEditingGastoFijo(null);
  };

  const handleEditGastoFijo = (gasto: GastoFijo) => {
    setEditingGastoFijo(gasto);
    setShowFijoModal(true);
  };

  const handleDeleteGastoFijo = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este gasto fijo?')) return;

    try {
      const response = await fetch(`/api/gastos-fijos/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadGastosFijos();
      } else {
        alert('Error al eliminar el gasto');
      }
    } catch (error) {
      console.error('Error deleting gasto fijo:', error);
      alert('Error al eliminar el gasto');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const gastosVariablesFiltrados = gastosVariables.filter((gasto) => {
    if (searchQuery &&
      !gasto.concepto.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !gasto.proveedor?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    if (categoriaFilter !== 'all' && gasto.categoria !== categoriaFilter) {
      return false;
    }

    if (estadoFilter !== 'all' && gasto.estado !== estadoFilter) {
      return false;
    }

    return true;
  });

  const totalFijosMensual = gastosFijos
    .filter((g) => g.activo)
    .reduce((sum, g) => {
      if (g.frecuencia === 'mensual') return sum + g.monto;
      if (g.frecuencia === 'anual') return sum + (g.monto / 12);
      if (g.frecuencia === 'trimestral') return sum + (g.monto / 3);
      return sum;
    }, 0);

  const satSummary = useMemo(
    () => stats?.sat ?? buildSatDeductibilitySummary(gastosVariables),
    [stats, gastosVariables]
  );

  const satEvaluationsById = useMemo(() => {
    const evaluations = new Map<number, SatExpenseEvaluation>();
    gastosVariables.forEach((gasto) => {
      evaluations.set(gasto.id, evaluateSatDeductibility(gasto));
    });
    return evaluations;
  }, [gastosVariables]);

  if (loadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-400" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <GlassPanel className="relative overflow-hidden p-6 sm:p-8 text-white">
          <div className="pointer-events-none absolute inset-0 opacity-70">
            <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-emerald-400/30 blur-[140px]" />
            <div className="absolute -bottom-32 left-0 h-72 w-72 rounded-full bg-sky-500/20 blur-[150px]" />
          </div>
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-5 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
                <DollarSign className="h-4 w-4" />
                Finanzas
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Gestión de gastos</h1>
                <p className="mt-2 text-sm text-white/70">Control completo de gastos fijos y variables para toda la operación.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowVariableModal(true)}
                className="aura-cta aura-cta--primary px-6"
              >
                <Plus className="h-4 w-4" />
                Nuevo gasto variable
              </button>
              <button
                onClick={() => setShowFijoModal(true)}
                className="aura-cta aura-cta--ghost px-6"
              >
                <Calendar className="h-4 w-4" />
                Nuevo gasto fijo
              </button>
            </div>
          </div>
          <div className="relative mt-6 grid gap-4 text-white/80 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Gastos fijos mensuales</p>
              <p className="text-3xl font-semibold text-emerald-200">{formatCurrency(totalFijosMensual)}</p>
              <p className="text-xs text-white/60">{gastosFijos.filter(g => g.activo).length} gastos activos</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Gastos variables {mesFilter !== '0' ? 'filtrados' : 'anuales'}</p>
              <p className="text-3xl font-semibold text-orange-200">{formatCurrency(stats?.total || 0)}</p>
              <p className="text-xs text-white/60">{stats?.count || 0} registros</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Total periodo</p>
              <p className="text-3xl font-semibold text-sky-200">{formatCurrency(totalFijosMensual + (stats?.total || 0))}</p>
              <p className="text-xs text-white/60">Fijos + variables</p>
            </div>
          </div>
        </GlassPanel>

        <div className="grid gap-6 md:grid-cols-4">
          <GlassPanel className="space-y-2 border-white/10 p-6 text-white">
            <div className="flex items-center justify-between text-white/80">
              <span className="text-sm">Gasto promedio</span>
              <TrendingUp className="h-4 w-4" />
            </div>
            <p className="text-3xl font-semibold">{formatCurrency(stats?.promedio || 0)}</p>
            <p className="text-xs text-white/60">Variables deducibles + no deducibles</p>
          </GlassPanel>
          <GlassPanel className="space-y-2 border-white/10 p-6 text-white">
            <div className="flex items-center justify-between text-white/80">
              <span className="text-sm">Deducible SAT probable</span>
              <CheckCircle className="h-4 w-4" />
            </div>
            <p className="text-3xl font-semibold text-emerald-200">{formatCurrency(satSummary.totalDeducibleProbable)}</p>
            <p className="text-xs text-white/60">{satSummary.countDeducibleProbable} gastos cumplen validación automática</p>
          </GlassPanel>
          <GlassPanel className="space-y-2 border-white/10 p-6 text-white">
            <div className="flex items-center justify-between text-white/80">
              <span className="text-sm">No deducible SAT</span>
              <XCircle className="h-4 w-4" />
            </div>
            <p className="text-3xl font-semibold text-rose-200">{formatCurrency(satSummary.totalNoDeducible)}</p>
            <p className="text-xs text-white/60">{satSummary.countNoDeducible} gastos no cumplen criterios SAT</p>
          </GlassPanel>
          <GlassPanel className="space-y-2 border-white/10 p-6 text-white">
            <div className="flex items-center justify-between text-white/80">
              <span className="text-sm">Requiere revisión SAT</span>
              <AlertTriangle className="h-4 w-4" />
            </div>
            <p className="text-3xl font-semibold text-amber-200">{formatCurrency(satSummary.totalRevision)}</p>
            <p className="text-xs text-white/60">{satSummary.countRevision} gastos necesitan validación contable</p>
          </GlassPanel>
        </div>

        <GlassPanel className="space-y-5 border-white/10 p-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Panel SAT deducciones</p>
              <h3 className="mt-1 text-xl font-semibold">Criterios oficiales y recomendaciones</h3>
            </div>
            <Badge variant="outline" className="border-white/30 text-white">
              {satSummary.countTotal} gastos evaluados
            </Badge>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-white/80">Criterios aplicados</p>
              {satSummary.criteria.map((criterion) => (
                <div key={criterion.title} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-sm font-medium text-white">{criterion.title}</p>
                  <p className="mt-1 text-xs text-white/65">{criterion.description}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-white/45">{criterion.legalReference}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-white/80">Recomendaciones automáticas</p>
              {satSummary.recommendations.length > 0 ? (
                satSummary.recommendations.map((recommendation) => (
                  <div key={recommendation} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
                    {recommendation}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
                  No hay recomendaciones pendientes para este periodo.
                </div>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-white/80">Fuentes oficiales</p>
              {satSummary.sources.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/80 transition hover:border-white/30"
                >
                  <span>{source.title}</span>
                  <ExternalLink className="h-4 w-4 text-white/60" />
                </a>
              ))}
              <p className="text-xs text-white/55">
                La clasificación es una guía operativa. La deducción final debe validarse con tu contador conforme al régimen fiscal del contribuyente.
              </p>
            </div>
          </div>
        </GlassPanel>

        <Tabs defaultValue="variables" className="space-y-6">
          <GlassPanel className="border-white/10 bg-white/5 p-2">
            <TabsList className="grid w-full grid-cols-2 gap-2 rounded-3xl bg-white/5 p-1 text-white">
              <TabsTrigger
                value="fijos"
                className="rounded-2xl px-4 py-2 text-sm font-semibold text-white/70 transition data-[state=active]:bg-white data-[state=active]:text-slate-900"
              >
                Gastos fijos
              </TabsTrigger>
              <TabsTrigger
                value="variables"
                className="rounded-2xl px-4 py-2 text-sm font-semibold text-white/70 transition data-[state=active]:bg-white data-[state=active]:text-slate-900"
              >
                Gastos variables / ocasionales
              </TabsTrigger>
            </TabsList>
          </GlassPanel>

          <TabsContent value="fijos" className="space-y-4">
            <GlassPanel className="space-y-6 border-white/10 p-6 text-white">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Gastos fijos recurrentes</h2>
                  <p className="text-sm text-white/60">Rentas, sueldos y membresías que no deben fallar.</p>
                </div>
                <button
                  onClick={() => setShowFijoModal(true)}
                  className="aura-cta aura-cta--ghost px-6"
                >
                  <Plus className="h-4 w-4" />
                  Nuevo gasto fijo
                </button>
              </div>

              <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                Los gastos fijos aún no capturan CFDI, RFC del proveedor ni método de pago en este módulo.
                Por ahora se consideran en revisión SAT y conviene respaldarlos en gastos variables con datos fiscales completos.
              </div>

              {loadingFijos ? (
                <div className="flex flex-col items-center gap-3 py-12 text-white/70">
                  <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-300" />
                  Cargando gastos fijos...
                </div>
              ) : gastosFijos.length === 0 ? (
                <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-white/20 px-6 py-12 text-center text-white/70">
                  <Receipt className="h-10 w-10 text-white/60" />
                  <div>
                    <p className="text-lg font-semibold text-white">Sin registros</p>
                    <p className="text-sm text-white/60">Agrega tus gastos recurrentes para proyectar flujos.</p>
                  </div>
                  <button onClick={() => setShowFijoModal(true)} className="aura-cta aura-cta--primary">
                    <Plus className="h-4 w-4" />
                    Registrar primer gasto fijo
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {gastosFijos.map((gasto) => (
                    <div key={gasto.id} className="rounded-3xl border border-white/10 bg-white/5 p-4 transition hover:border-white/30">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-lg font-semibold">{gasto.concepto}</p>
                          <p className="text-sm text-white/60">
                            {gasto.frecuencia === 'mensual' && 'Mensual'}
                            {gasto.frecuencia === 'anual' && 'Anual'}
                            {gasto.frecuencia === 'trimestral' && 'Trimestral'}
                            {gasto.notas && ` • ${gasto.notas}`}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-semibold text-emerald-200">{formatCurrency(gasto.monto)}</p>
                            <p className="text-xs text-white/60">
                              {gasto.frecuencia === 'mensual' && '/mes'}
                              {gasto.frecuencia === 'anual' && '/año'}
                              {gasto.frecuencia === 'trimestral' && '/trimestre'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-full border border-white/20 text-white hover:border-emerald-300/60"
                              onClick={() => handleEditGastoFijo(gasto)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-full border border-rose-400/40 text-rose-100 hover:bg-rose-500/10"
                              onClick={() => handleDeleteGastoFijo(gasto.id)}
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassPanel>
          </TabsContent>

          <TabsContent value="variables" className="space-y-4">
            <GlassPanel className="space-y-6 border-white/10 p-6 text-white">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Gastos variables / ocasionales</h2>
                  <p className="text-sm text-white/60">Seguimiento granular de compras extraordinarias y deducibles.</p>
                </div>
                <button
                  onClick={() => setShowVariableModal(true)}
                  className="aura-cta aura-cta--primary px-6"
                >
                  <Plus className="h-4 w-4" />
                  Nuevo gasto variable
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <Input
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 rounded-full border-white/15 bg-white/5 pl-10 text-white placeholder:text-white/40"
                  />
                </div>
                <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                  <SelectTrigger className="h-12 rounded-full border-white/15 bg-white/5 text-white">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[var(--surface-night)] text-white">
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {Object.entries(CATEGORIAS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={mesFilter} onValueChange={setMesFilter}>
                  <SelectTrigger className="h-12 rounded-full border-white/15 bg-white/5 text-white">
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[var(--surface-night)] text-white">
                    <SelectItem value="0">Todos los meses</SelectItem>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {new Date(2025, i).toLocaleDateString('es-MX', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                  <SelectTrigger className="h-12 rounded-full border-white/15 bg-white/5 text-white">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[var(--surface-night)] text-white">
                    <SelectItem value="all">Todos los estados</SelectItem>
                    {Object.entries(ESTADO_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loadingVariables ? (
                <div className="flex flex-col items-center gap-3 py-12 text-white/70">
                  <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-orange-300" />
                  Cargando gastos variables...
                </div>
              ) : gastosVariablesFiltrados.length === 0 ? (
                <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-white/20 px-6 py-12 text-center text-white/70">
                  <FileText className="h-10 w-10 text-white/60" />
                  <p className="text-lg font-semibold text-white">
                    {searchQuery || categoriaFilter !== 'all' || estadoFilter !== 'all'
                      ? 'No se encontraron gastos con estos filtros'
                      : 'No hay gastos variables registrados'}
                  </p>
                  {(searchQuery || categoriaFilter !== 'all' || estadoFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setCategoriaFilter('all');
                        setEstadoFilter('all');
                        setMesFilter('0');
                      }}
                      className="aura-cta aura-cta--ghost"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {gastosVariablesFiltrados.map((gasto) => {
                    const categoryConfig = CATEGORIAS_CONFIG[gasto.categoria as keyof typeof CATEGORIAS_CONFIG];
                    const CategoriaIcon = categoryConfig?.icon || MoreHorizontal;
                    const estadoConfig = ESTADO_CONFIG[gasto.estado as keyof typeof ESTADO_CONFIG];
                    const satEvaluation = satEvaluationsById.get(gasto.id);
                    const satStyle = satEvaluation ? SAT_STATUS_STYLES[satEvaluation.status] : null;

                    return (
                      <div key={gasto.id} className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-white/30">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex flex-1 items-start gap-4">
                            <div className={`rounded-2xl p-3 ${categoryConfig?.chipClass || 'border border-white/15 bg-white/10 text-white'}`}>
                              <CategoriaIcon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-lg font-semibold text-white">{gasto.concepto}</p>
                                {estadoConfig && (
                                  <Badge className={`${estadoConfig.badgeClass} text-xs font-semibold uppercase tracking-wide`}>
                                    {estadoConfig.label}
                                  </Badge>
                                )}
                                {satEvaluation && satStyle && (
                                  <Badge className={`${satStyle.badgeClass} text-xs font-semibold uppercase tracking-wide`}>
                                    {satEvaluation.statusLabel}
                                  </Badge>
                                )}
                                {gasto.es_deducible && (
                                  <Badge variant="outline" className="border-white/20 text-xs text-white/75">
                                    Marcado deducible (usuario)
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-white/60">
                                {categoryConfig?.label || gasto.categoria}
                                {gasto.proveedor && ` • ${gasto.proveedor}`}
                                {gasto.metodo_pago && ` • ${gasto.metodo_pago}`}
                              </p>
                              {gasto.proveedor_rfc && (
                                <p className="mt-1 text-xs text-white/50">RFC proveedor: {gasto.proveedor_rfc}</p>
                              )}
                              {gasto.descripcion && (
                                <p className="mt-2 text-sm text-white/70">{gasto.descripcion}</p>
                              )}
                              {satEvaluation && (
                                <p className={`mt-2 text-xs ${satStyle?.textClass || 'text-white/70'}`}>
                                  {satEvaluation.primaryReason}
                                </p>
                              )}
                              {gasto.factura_numero && (
                                <p className="mt-1 text-xs text-white/50">Factura: {gasto.factura_numero}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-3">
                            <div className="text-right">
                              <p className="text-2xl font-semibold text-orange-200">{formatCurrency(gasto.monto)}</p>
                              <p className="text-xs text-white/60">{formatDate(gasto.fecha)}</p>
                            </div>
                            <div className="flex gap-2">
                              {gasto.factura_url && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10 rounded-full border border-white/20 text-white hover:border-white/40"
                                  onClick={() => window.open(gasto.factura_url!, '_blank')}
                                  title="Ver factura"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-full border border-white/20 text-white hover:border-emerald-300/60"
                                onClick={() => handleEditGasto(gasto)}
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-full border border-rose-400/40 text-rose-100 hover:bg-rose-500/10"
                                onClick={() => handleDeleteGasto(gasto.id)}
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassPanel>
          </TabsContent>
        </Tabs>
      </div>

      <GastoVariableModal
        isOpen={showVariableModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        gasto={editingGasto}
      />

      <GastoFijoModal
        isOpen={showFijoModal}
        onClose={handleFijoModalClose}
        onSuccess={handleFijoModalSuccess}
        gasto={editingGastoFijo}
      />
    </AppLayout>
  );
}