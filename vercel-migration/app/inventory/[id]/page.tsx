'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, Pencil, AlertTriangle } from 'lucide-react';
import AppLayout from '@/components/layout/app-layout';
import { InventoryMovements } from '@/components/inventory/inventory-movements';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface InventoryItem {
  id: string;
  nombre: string;
  descripcion?: string | null;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo?: number;
  precio_unitario: number;
  categoria?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}

export default function InventoryItemPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const itemId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchItem() {
      if (!itemId) return;
      try {
        setLoading(true);
        const response = await fetch(`/api/inventory/${itemId}`);
        if (!response.ok) {
          throw new Error('No se pudo cargar el item de inventario');
        }
        const data = await response.json();
        setItem(data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Error al cargar el item de inventario.');
      } finally {
        setLoading(false);
      }
    }

    fetchItem();
  }, [itemId]);

  const stockStatus = useMemo(() => {
    if (!item) return { label: '—', variant: 'default' as const };
    if (item.stock_actual <= item.stock_minimo) {
      return { label: 'Stock bajo', variant: 'destructive' as const };
    }
    if (item.stock_maximo && item.stock_actual > item.stock_maximo) {
      return { label: 'Stock excedente', variant: 'secondary' as const };
    }
    return { label: 'Stock saludable', variant: 'outline' as const };
  }, [item]);

  const monetaryValue = useMemo(() => {
    if (!item) return 0;
    return (item.stock_actual || 0) * (item.precio_unitario || 0);
  }, [item]);

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
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center">
                <Package className="h-6 w-6" />
              </div>
              <div>
                {loading ? (
                  <Skeleton className="h-7 w-48" />
                ) : (
                  <h1 className="text-2xl font-bold text-gray-900">{item?.nombre}</h1>
                )}
                <p className="text-sm text-gray-500">Detalle completo del consumible</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {item?.categoria && <Badge variant="outline">{item.categoria}</Badge>}
            {item && (
              <Badge variant="secondary">
                {item.precio_unitario.toLocaleString('es-MX', {
                  style: 'currency',
                  currency: 'MXN',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                / unidad
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/inventory')}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
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

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Stock actual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <p className="text-3xl font-semibold text-gray-900">{item?.stock_actual?.toLocaleString('es-MX')}</p>
              )}
              <div className="text-sm text-gray-500">
                Mínimo configurado: {item?.stock_minimo?.toLocaleString('es-MX')}
              </div>
              <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Valor en inventario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <p className="text-3xl font-semibold text-gray-900">
                  {monetaryValue.toLocaleString('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              )}
              <div className="text-sm text-gray-500">
                Precio unitario registrado:{' '}
                {item?.precio_unitario?.toLocaleString('es-MX', {
                  style: 'currency',
                  currency: 'MXN',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información adicional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <>
                  <div>
                    <span className="font-medium text-gray-700">Creado:</span>{' '}
                    {item?.created_at ? new Date(item.created_at).toLocaleString('es-MX') : '—'}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Última actualización:</span>{' '}
                    {item?.updated_at ? new Date(item.updated_at).toLocaleString('es-MX') : '—'}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {item?.descripcion && (
          <Card>
            <CardHeader>
              <CardTitle>Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 whitespace-pre-line">{item.descripcion}</p>
            </CardContent>
          </Card>
        )}

        {itemId && <InventoryMovements itemId={itemId} />}
      </div>
    </AppLayout>
  );
}
