"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, MapPin, Users, Loader2, Check, X } from 'lucide-react';
import { getAllAddons, type AddonConfig } from '@/lib/stripe/addons';
import toast from 'react-hot-toast';

interface ActiveAddon {
  id: string;
  addon_type: string;
  quantity: number;
  unit_price: number;
  status: string;
}

interface QuotaUsage {
  current_doctors: number;
  max_doctors: number;
  current_locations: number;
  max_locations: number;
  plan_tier: string;
}

export function AddonsManager() {
  const [addons, setAddons] = useState<ActiveAddon[]>([]);
  const [quotaUsage, setQuotaUsage] = useState<QuotaUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [addonsRes, quotaRes] = await Promise.all([
        fetch('/api/addons'),
        fetch('/api/quota/usage'),
      ]);

      if (addonsRes.ok) {
        const data = await addonsRes.json();
        setAddons(data.addons || []);
      }

      if (quotaRes.ok) {
        const data = await quotaRes.json();
        setQuotaUsage(data.usage);
      }
    } catch (error) {
      console.error('Error loading addons:', error);
      toast.error('Error al cargar add-ons');
    } finally {
      setLoading(false);
    }
  };

  const purchaseAddon = async (addonType: string, quantity: number = 1) => {
    setPurchasing(addonType);

    try {
      const res = await fetch('/api/addons/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addon_type: addonType, quantity }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'Add-on agregado exitosamente');
        await loadData(); // Reload to show updated addons
      } else {
        toast.error(data.error || 'Error al agregar add-on');
      }
    } catch (error) {
      console.error('Error purchasing addon:', error);
      toast.error('Error al procesar compra');
    } finally {
      setPurchasing(null);
    }
  };

  const cancelAddon = async (addonId: string) => {
    if (!confirm('¿Estás seguro de cancelar este add-on?')) return;

    try {
      const res = await fetch(`/api/addons/${addonId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'Add-on cancelado');
        await loadData();
      } else {
        toast.error(data.error || 'Error al cancelar add-on');
      }
    } catch (error) {
      console.error('Error canceling addon:', error);
      toast.error('Error al cancelar add-on');
    }
  };

  const getActiveAddonQuantity = (addonType: string): number => {
    const addon = addons.find(a => a.addon_type === addonType && a.status === 'active');
    return addon?.quantity || 0;
  };

  const availableAddons = getAllAddons();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Usage Summary */}
      {quotaUsage && (
        <Card>
          <CardHeader>
            <CardTitle>Uso Actual</CardTitle>
            <CardDescription>Tu plan {quotaUsage.plan_tier.toUpperCase()} + Add-ons</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ubicaciones</p>
                <p className="text-2xl font-bold">
                  {quotaUsage.current_locations} <span className="text-sm text-muted-foreground">/ {quotaUsage.max_locations}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Doctores</p>
                <p className="text-2xl font-bold">
                  {quotaUsage.current_doctors} <span className="text-sm text-muted-foreground">/ {quotaUsage.max_doctors}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Add-ons */}
      <div className="grid md:grid-cols-2 gap-6">
        {availableAddons.map((config: AddonConfig) => {
          const currentQuantity = getActiveAddonQuantity(config.id);
          const activeAddon = addons.find(a => a.addon_type === config.id && a.status === 'active');
          const isPurchasing = purchasing === config.id;

          return (
            <Card key={config.id} className="relative overflow-hidden">
              {currentQuantity > 0 && (
                <div className="absolute top-4 right-4">
                  <Badge variant="default" className="flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Activo ({currentQuantity})
                  </Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{config.icon}</span>
                  {config.name}
                </CardTitle>
                <CardDescription>{config.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">${config.price}</span>
                  <span className="text-muted-foreground">MXN/mes</span>
                </div>

                {currentQuantity > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Cantidad actual:</span>
                      <span className="font-semibold">{currentQuantity}</span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => purchaseAddon(config.id, 1)}
                        disabled={isPurchasing || currentQuantity >= config.maxQuantity}
                        className="flex-1"
                      >
                        {isPurchasing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-1" />
                            Agregar +1
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => activeAddon && cancelAddon(activeAddon.id)}
                        disabled={isPurchasing}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Total: ${(currentQuantity * config.price).toLocaleString('es-MX')} MXN/mes
                    </p>
                  </div>
                ) : (
                  <Button
                    onClick={() => purchaseAddon(config.id, 1)}
                    disabled={isPurchasing}
                    className="w-full"
                  >
                    {isPurchasing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Add-on
                      </>
                    )}
                  </Button>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  Máximo {config.maxQuantity} unidades
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Help Text */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Nota:</strong> Los add-ons se facturan mensualmente y se suman a tu suscripción actual.
            Puedes cancelarlos en cualquier momento y el cargo se detendrá al final del periodo de facturación actual.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
