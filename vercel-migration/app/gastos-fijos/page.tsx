'use client';

import { createClient } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AppLayout from "@/components/layout/app-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GastoVariableModal from "@/components/gastos/gasto-variable-modal";
import GastoFijoModal from "@/components/gastos/gasto-fijo-modal";
import { 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Plus,
  Filter,
  Download,
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
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Trash2,
  Edit,
  Eye,
  Upload
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GastoFijo {
  id: number;
  concepto: string;
  monto: number;
  frecuencia: string;
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
  count: number;
  por_categoria: Array<{ categoria: string; total: number; count: number }>;
  promedio: number;
}

const CATEGORIAS_CONFIG = {
  reparacion: { label: 'Reparación', icon: Wrench, color: 'text-red-600 bg-red-50' },
  mantenimiento: { label: 'Mantenimiento', icon: Wrench, color: 'text-orange-600 bg-orange-50' },
  compras_equipo: { label: 'Compra de Equipo', icon: ShoppingCart, color: 'text-blue-600 bg-blue-50' },
  insumos_extraordinarios: { label: 'Insumos Extraordinarios', icon: ShoppingCart, color: 'text-cyan-600 bg-cyan-50' },
  servicios_profesionales: { label: 'Servicios Profesionales', icon: Briefcase, color: 'text-purple-600 bg-purple-50' },
  marketing: { label: 'Marketing', icon: Megaphone, color: 'text-pink-600 bg-pink-50' },
  capacitacion: { label: 'Capacitación', icon: GraduationCap, color: 'text-indigo-600 bg-indigo-50' },
  tecnologia: { label: 'Tecnología', icon: Laptop, color: 'text-green-600 bg-green-50' },
  viajes: { label: 'Viajes', icon: Plane, color: 'text-yellow-600 bg-yellow-50' },
  otros: { label: 'Otros', icon: MoreHorizontal, color: 'text-gray-600 bg-gray-50' },
};

const ESTADO_CONFIG = {
  pendiente: { label: 'Pendiente', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  aprobado: { label: 'Aprobado', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  rechazado: { label: 'Rechazado', icon: XCircle, color: 'bg-red-100 text-red-800' },
  pagado: { label: 'Pagado', icon: CheckCircle, color: 'bg-blue-100 text-blue-800' },
};

export default function GastosPage() {
  const supabase = createClient();
  const router = useRouter();
  
  // Auth
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // Gastos Fijos
  const [gastosFijos, setGastosFijos] = useState<GastoFijo[]>([]);
  const [loadingFijos, setLoadingFijos] = useState(true);
  
  // Gastos Variables
  const [gastosVariables, setGastosVariables] = useState<GastoVariable[]>([]);
  const [loadingVariables, setLoadingVariables] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [mesFilter, setMesFilter] = useState<string>('0');
  const [añoFilter, setAñoFilter] = useState<string>(new Date().getFullYear().toString());

  // Modal states
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [editingGasto, setEditingGasto] = useState<GastoVariable | null>(null);
  const [showFijoModal, setShowFijoModal] = useState(false);
  const [editingGastoFijo, setEditingGastoFijo] = useState<GastoFijo | null>(null);

  // Auth check
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
  }, [router]);

  // Load data
  useEffect(() => {
    if (user) {
      loadGastosFijos();
      loadGastosVariables();
      loadStats();
    }
  }, [user, mesFilter, añoFilter]);

  const loadGastosFijos = async () => {
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
  };

  const loadGastosVariables = async () => {
    try {
      setLoadingVariables(true);
      
      let url = '/api/gastos-variables?';
      if (mesFilter && mesFilter !== '0' && añoFilter) {
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
  };

  const loadStats = async () => {
    try {
      let url = '/api/gastos-variables/stats?';
      if (mesFilter && mesFilter !== '0' && añoFilter) {
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
  };

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

  const handleEditGastoFijo = async (gasto: GastoFijo) => {
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

  // Filtrar gastos variables
  const gastosVariablesFiltrados = gastosVariables.filter(gasto => {
    if (searchQuery && !gasto.concepto.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !gasto.proveedor?.toLowerCase().includes(searchQuery.toLowerCase())) {
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
    .filter(g => g.activo)
    .reduce((sum, g) => {
      if (g.frecuencia === 'mensual') return sum + g.monto;
      if (g.frecuencia === 'anual') return sum + (g.monto / 12);
      if (g.frecuencia === 'trimestral') return sum + (g.monto / 3);
      return sum;
    }, 0);

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Gestión de Gastos
                </h1>
                <p className="text-gray-600">Control completo de gastos fijos y variables</p>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Gastos Fijos Mensuales
              </CardTitle>
              <Calendar className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalFijosMensual)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {gastosFijos.filter(g => g.activo).length} gastos activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Gastos Variables {mesFilter && mesFilter !== '0' ? `(${new Date(2025, parseInt(mesFilter)-1).toLocaleDateString('es-MX', { month: 'long' })})` : añoFilter}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(stats?.total || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.count || 0} gastos registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Gastos
              </CardTitle>
              <Receipt className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalFijosMensual + (stats?.total || 0))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Fijos + Variables del período
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="variables" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="fijos">Gastos Fijos Recurrentes</TabsTrigger>
            <TabsTrigger value="variables">Gastos Variables / Ocasionales</TabsTrigger>
          </TabsList>

          {/* TAB: Gastos Fijos */}
          <TabsContent value="fijos">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Gastos Fijos Recurrentes</CardTitle>
                  <Button size="sm" onClick={() => setShowFijoModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Gasto Fijo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingFijos ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  </div>
                ) : gastosFijos.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No hay gastos fijos registrados</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {gastosFijos.map((gasto) => (
                      <div key={gasto.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <p className="font-medium">{gasto.concepto}</p>
                          <p className="text-sm text-gray-500">
                            {gasto.frecuencia === 'mensual' && 'Mensual'}
                            {gasto.frecuencia === 'anual' && 'Anual'}
                            {gasto.frecuencia === 'trimestral' && 'Trimestral'}
                            {gasto.notas && ` • ${gasto.notas}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold text-green-600">{formatCurrency(gasto.monto)}</p>
                            <p className="text-xs text-gray-500">
                              {gasto.frecuencia === 'mensual' && '/mes'}
                              {gasto.frecuencia === 'anual' && '/año'}
                              {gasto.frecuencia === 'trimestral' && '/trimestre'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => handleEditGastoFijo(gasto)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-red-600"
                              onClick={() => handleDeleteGastoFijo(gasto.id)}
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Gastos Variables */}
          <TabsContent value="variables">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center mb-4">
                  <CardTitle>Gastos Variables / Ocasionales</CardTitle>
                  <Button size="sm" onClick={() => setShowVariableModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Gasto Variable
                  </Button>
                </div>
                
                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {Object.entries(CATEGORIAS_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={mesFilter} onValueChange={setMesFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Mes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Todos los meses</SelectItem>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {new Date(2025, i).toLocaleDateString('es-MX', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      {Object.entries(ESTADO_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              
              <CardContent>
                {loadingVariables ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                  </div>
                ) : gastosVariablesFiltrados.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">
                      {searchQuery || categoriaFilter !== 'all' || estadoFilter !== 'all' 
                        ? 'No se encontraron gastos con estos filtros' 
                        : 'No hay gastos variables registrados'}
                    </p>
                    {(searchQuery || categoriaFilter !== 'all' || estadoFilter !== 'all') && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSearchQuery('');
                          setCategoriaFilter('all');
                          setEstadoFilter('all');
                          setMesFilter('0');
                        }}
                      >
                        Limpiar filtros
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {gastosVariablesFiltrados.map((gasto) => {
                      const CategoriaIcon = CATEGORIAS_CONFIG[gasto.categoria as keyof typeof CATEGORIAS_CONFIG]?.icon || MoreHorizontal;
                      const estadoConfig = ESTADO_CONFIG[gasto.estado as keyof typeof ESTADO_CONFIG];
                      
                      return (
                        <div key={gasto.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className={`p-2 rounded-lg ${CATEGORIAS_CONFIG[gasto.categoria as keyof typeof CATEGORIAS_CONFIG]?.color || 'bg-gray-50'}`}>
                                <CategoriaIcon className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium">{gasto.concepto}</p>
                                  <Badge className={estadoConfig?.color}>
                                    {estadoConfig?.label}
                                  </Badge>
                                  {gasto.es_deducible && (
                                    <Badge variant="outline" className="text-xs">Deducible</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  {CATEGORIAS_CONFIG[gasto.categoria as keyof typeof CATEGORIAS_CONFIG]?.label || gasto.categoria}
                                  {gasto.proveedor && ` • ${gasto.proveedor}`}
                                  {gasto.metodo_pago && ` • ${gasto.metodo_pago}`}
                                </p>
                                {gasto.descripcion && (
                                  <p className="text-sm text-gray-500">{gasto.descripcion}</p>
                                )}
                                {gasto.factura_numero && (
                                  <p className="text-xs text-gray-400 mt-1">Factura: {gasto.factura_numero}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-orange-600 text-lg">{formatCurrency(gasto.monto)}</p>
                              <p className="text-xs text-gray-500">{formatDate(gasto.fecha)}</p>
                              <div className="flex gap-2 mt-2">
                                {gasto.factura_url && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0"
                                    onClick={() => window.open(gasto.factura_url, '_blank')}
                                    title="Ver factura"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleEditGasto(gasto)}
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 text-red-600"
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Modal para crear/editar gasto variable */}
      <GastoVariableModal
        isOpen={showVariableModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        gasto={editingGasto}
      />

      {/* Modal para crear/editar gasto fijo */}
      <GastoFijoModal
        isOpen={showFijoModal}
        onClose={handleFijoModalClose}
        onSuccess={handleFijoModalSuccess}
        gasto={editingGastoFijo}
      />
    </AppLayout>
  );
}