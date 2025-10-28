'use client';

import { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/components/layout/app-layout';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  TrendingUp,
  DollarSign,
  Database,
  ArrowLeft,
  FileDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ConsumptionEntry {
  treatmentId: string;
  treatmentName: string;
  totalQuantity: number;
  totalCost: number;
  movements: number;
}

interface PeriodEntry {
  period: string;
  entradas: number;
  salidas: number;
  ajustes: number;
}

interface CostVsPriceEntry {
  recordId: string;
  treatmentId: string | null;
  treatmentName: string;
  price: number;
  cost: number;
  margin: number;
  marginPercentage: number | null;
  movements: number;
  createdAt: string | null;
}

interface InventoryReportResponse {
  rangeDays: number;
  generatedAt: string;
  summary: {
    totalEntradaCost: number;
    totalSalidaCost: number;
    movimientosProcesados: number;
  };
  consumptionByTreatment: ConsumptionEntry[];
  inventoryByPeriod: PeriodEntry[];
  costVsPrice: CostVsPriceEntry[];
}

export default function InventoryReportsPage() {
  const router = useRouter();
  const [range, setRange] = useState<'30' | '90' | '180' | '365'>('90');
  const [data, setData] = useState<InventoryReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReports() {
      try {
        setLoading(true);
        const response = await fetch(`/api/inventory/reports?rangeDays=${range}`);
        if (!response.ok) {
          throw new Error('No se pudieron generar los reportes avanzados');
        }
        const payload = await response.json();
        setData(payload);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Error al generar los reportes de inventario.');
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, [range]);

  const summaryCards = useMemo(() => {
    if (!data) return null;
    const totalCost = data.summary.totalSalidaCost;
    const totalEntries = data.summary.totalEntradaCost;
    const movementsCount = data.summary.movimientosProcesados;

    return [
      {
        title: 'Costo de salidas',
        value: totalCost.toLocaleString('es-MX', {
          style: 'currency',
          currency: 'MXN',
          maximumFractionDigits: 2,
        }),
        icon: <TrendingUp className="h-6 w-6 text-rose-500" />,
        description: 'Valor de insumos consumidos en el periodo',
      },
      {
        title: 'Valor de entradas',
        value: totalEntries.toLocaleString('es-MX', {
          style: 'currency',
          currency: 'MXN',
          maximumFractionDigits: 2,
        }),
        icon: <DollarSign className="h-6 w-6 text-emerald-500" />,
        description: 'Inversión registrada en inventario',
      },
      {
        title: 'Movimientos procesados',
        value: movementsCount.toLocaleString('es-MX'),
        icon: <Database className="h-6 w-6 text-blue-500" />,
        description: 'Total de eventos analizados',
      },
    ];
  }, [data]);

  const handleExport = (type: 'consumption' | 'cost' | 'period') => {
    if (!data) return;

    const dateStamp = new Date().toISOString().split('T')[0];

    let header: string[] = [];
    let rows: string[][] = [];
    if (type === 'consumption') {
      header = ['Tratamiento', 'Cantidad total', 'Costo total', 'Movimientos'];
      rows = data.consumptionByTreatment.map((entry) => [
        entry.treatmentName,
        entry.totalQuantity.toString(),
        entry.totalCost.toFixed(2),
        entry.movements.toString(),
      ]);
    } else if (type === 'cost') {
      header = ['Record ID', 'Tratamiento', 'Precio cobrado', 'Costo insumos', 'Margen', 'Margen %'];
      rows = data.costVsPrice.map((entry) => [
        entry.recordId,
        entry.treatmentName,
        entry.price.toFixed(2),
        entry.cost.toFixed(2),
        entry.margin.toFixed(2),
        entry.marginPercentage !== null ? entry.marginPercentage.toFixed(2) : '',
      ]);
    } else {
      header = ['Periodo (YYYY-MM)', 'Entradas', 'Salidas', 'Ajustes'];
      rows = data.inventoryByPeriod.map((entry) => [
        entry.period,
        entry.entradas.toString(),
        entry.salidas.toString(),
        entry.ajustes.toString(),
      ]);
    }

    const csvContent = [header, ...rows]
      .map((line) => line.map((value) => `"${value.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inventory-report-${type}-${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/inventory')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Regresar
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center">
                <LineChart className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reportes avanzados de inventario</h1>
                <p className="text-sm text-gray-500">Analiza consumo, tendencias y rentabilidad por tratamiento.</p>
              </div>
            </div>
          </div>
          <Select value={range} onValueChange={(value: '30' | '90' | '180' | '365') => setRange(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Rango" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
              <SelectItem value="180">Últimos 6 meses</SelectItem>
              <SelectItem value="365">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-4 text-center text-red-700">{error}</CardContent>
          </Card>
        )}

        {loading && (
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {!loading && summaryCards && (
          <div className="grid gap-4 md:grid-cols-3">
            {summaryCards.map((card) => (
              <Card key={card.title}>
                <CardContent className="flex flex-col gap-3 py-6">
                  <div className="flex items-center gap-3">
                    {card.icon}
                    <div>
                      <p className="text-sm text-gray-500">{card.title}</p>
                      <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{card.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && data && (
          <div className="space-y-8">
            <Card>
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Consumo por tratamiento</CardTitle>
                  <p className="text-sm text-gray-500">Top tratamientos por costo de insumos consumidos.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleExport('consumption')}>
                  <FileDown className="mr-2 h-4 w-4" /> Exportar CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-gray-200">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tratamiento</TableHead>
                        <TableHead className="text-right">Costo insumos</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">Movimientos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.consumptionByTreatment.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="py-6 text-center text-sm text-gray-500">
                            No hay movimientos de salida relacionados a tratamientos en el periodo seleccionado.
                          </TableCell>
                        </TableRow>
                      )}
                      {data.consumptionByTreatment.map((entry) => (
                        <TableRow key={entry.treatmentId}>
                          <TableCell className="font-medium text-gray-900">{entry.treatmentName}</TableCell>
                          <TableCell className="text-right text-sm text-gray-700">
                            {entry.totalCost.toLocaleString('es-MX', {
                              style: 'currency',
                              currency: 'MXN',
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right text-sm text-gray-700">
                            {entry.totalQuantity.toLocaleString('es-MX', { maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right text-sm text-gray-700">{entry.movements}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Inventario por periodo</CardTitle>
                  <p className="text-sm text-gray-500">Comparativo mensual de entradas, salidas y ajustes.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleExport('period')}>
                  <FileDown className="mr-2 h-4 w-4" /> Exportar CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-gray-200">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Periodo</TableHead>
                        <TableHead className="text-right">Entradas</TableHead>
                        <TableHead className="text-right">Salidas</TableHead>
                        <TableHead className="text-right">Ajustes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.inventoryByPeriod.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="py-6 text-center text-sm text-gray-500">
                            No se registraron movimientos en el periodo seleccionado.
                          </TableCell>
                        </TableRow>
                      )}
                      {data.inventoryByPeriod.map((entry) => (
                        <TableRow key={entry.period}>
                          <TableCell className="font-medium text-gray-900">{entry.period}</TableCell>
                          <TableCell className="text-right text-sm text-emerald-600">
                            {entry.entradas.toLocaleString('es-MX', { maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right text-sm text-rose-600">
                            {entry.salidas.toLocaleString('es-MX', { maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right text-sm text-amber-600">
                            {entry.ajustes.toLocaleString('es-MX', { maximumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Costo real vs precio de venta</CardTitle>
                  <p className="text-sm text-gray-500">Identifica tratamientos con márgenes ajustados.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleExport('cost')}>
                  <FileDown className="mr-2 h-4 w-4" /> Exportar CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-gray-200">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tratamiento</TableHead>
                        <TableHead className="text-right">Precio cobrado</TableHead>
                        <TableHead className="text-right">Costo consumibles</TableHead>
                        <TableHead className="text-right">Margen</TableHead>
                        <TableHead className="text-right">Margen %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.costVsPrice.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="py-6 text-center text-sm text-gray-500">
                            No se encontraron registros con ventas asociadas en el periodo.
                          </TableCell>
                        </TableRow>
                      )}
                      {data.costVsPrice.map((entry) => (
                        <TableRow key={entry.recordId}>
                          <TableCell className="font-medium text-gray-900">{entry.treatmentName}</TableCell>
                          <TableCell className="text-right text-sm text-gray-700">
                            {entry.price.toLocaleString('es-MX', {
                              style: 'currency',
                              currency: 'MXN',
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right text-sm text-gray-700">
                            {entry.cost.toLocaleString('es-MX', {
                              style: 'currency',
                              currency: 'MXN',
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium text-gray-900">
                            {entry.margin.toLocaleString('es-MX', {
                              style: 'currency',
                              currency: 'MXN',
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {entry.marginPercentage !== null ? (
                              <Badge
                                variant={entry.marginPercentage >= 40 ? 'secondary' : entry.marginPercentage >= 25 ? 'outline' : 'destructive'}
                                className="font-mono"
                              >
                                {entry.marginPercentage.toFixed(1)}%
                              </Badge>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
