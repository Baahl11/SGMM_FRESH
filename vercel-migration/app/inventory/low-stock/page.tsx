'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/app-layout';
import { useRouter } from 'next/navigation';
import { AlertTriangle, PackageSearch, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface InventoryItem {
  id: string;
  nombre: string;
  descripcion?: string | null;
  stock_actual: number;
  stock_minimo: number;
  precio_unitario: number;
  categoria?: string | null;
}

export default function LowStockPage() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLowStock() {
      try {
        setLoading(true);
        const response = await fetch('/api/inventory/low-stock');
        if (!response.ok) {
          throw new Error('No se pudieron cargar los items con stock bajo');
        }
        const body = await response.json();
        const lowStock = Array.isArray(body.items) ? body.items : [];
        setItems(lowStock);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Error al cargar los items con stock bajo.');
      } finally {
        setLoading(false);
      }
    }

    fetchLowStock();
  }, []);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/inventory')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Regresar
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 text-white flex items-center justify-center">
                <PackageSearch className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Stock Crítico</h1>
                <p className="text-sm text-gray-500">Lista prioritaria de insumos que requieren reposición inmediata.</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3 py-4 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Insumos en estado crítico</CardTitle>
              <p className="text-sm text-gray-500">
                Se muestran los items cuyo stock actual es menor o igual al mínimo configurado.
              </p>
            </div>
            <Badge variant="destructive">{items.length} item{items.length === 1 ? '' : 's'}</Badge>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100">
            {loading && (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            )}

            {!loading && items.length === 0 && (
              <div className="py-10 text-center text-sm text-gray-500">
                ¡Excelente! No hay items por debajo del stock mínimo.
              </div>
            )}

            {!loading &&
              items.map((item) => {
                const shortage = Math.max((item.stock_minimo || 0) - (item.stock_actual || 0), 0);
                const totalValue = (item.stock_actual || 0) * (item.precio_unitario || 0);

                return (
                  <div key={item.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900">{item.nombre}</h3>
                        {item.categoria && <Badge variant="outline">{item.categoria}</Badge>}
                      </div>
                      {item.descripcion && (
                        <p className="text-sm text-gray-500 line-clamp-2">{item.descripcion}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                        <span>
                          Stock actual: <span className="font-medium text-gray-900">{item.stock_actual?.toLocaleString('es-MX')}</span>
                        </span>
                        <span>
                          Mínimo: <span className="font-medium text-gray-900">{item.stock_minimo?.toLocaleString('es-MX')}</span>
                        </span>
                        <span>
                          Faltan:{' '}
                          <span className="font-medium text-red-600">{shortage.toLocaleString('es-MX')}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/inventory/${item.id}`)}>
                        Ver detalle
                      </Button>
                      <div className="text-xs text-gray-500">
                        Valor restante:{' '}
                        {totalValue.toLocaleString('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
