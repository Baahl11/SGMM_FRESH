"use client";

import { useState, useEffect } from 'react';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Badge } from '@/components/ui/badge';
import { Plus, MapPin, Users, Loader2, Check, X, Sparkles } from 'lucide-react';
import { getAllAddons, type AddonConfig } from '@/lib/stripe/addons';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

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
        if (data.checkoutUrl) {
          toast.success('Redirigiéndote a Stripe para completar el pago...');
          window.location.href = data.checkoutUrl;
          return;
        }

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
      <GlassPanel className="border-white/10 p-12">
        <div className="flex flex-col items-center justify-center gap-4 text-white">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
          <p className="text-sm text-white/60">Cargando add-ons...</p>
        </div>
      </GlassPanel>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Panel */}
      <GlassPanel className="relative overflow-hidden border-white/10 p-6 sm:p-8 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-purple-400/30 blur-[140px]" />
          <div className="absolute -bottom-32 left-0 h-72 w-72 rounded-full bg-sky-500/20 blur-[150px]" />
        </div>
        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-5 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
            <Sparkles className="h-4 w-4" />
            Expansión
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Add-ons Premium</h2>
            <p className="mt-2 text-sm text-white/70">
              Expande la capacidad de tu plan agregando ubicaciones y doctores adicionales.
            </p>
          </div>
        </div>
      </GlassPanel>

      {/* Current Usage Summary */}
      {quotaUsage && (
        <div className="grid gap-6 md:grid-cols-2">
          <GlassPanel className="border-white/10 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border border-sky-400/40 bg-sky-500/20 p-4">
                <MapPin className="h-6 w-6 text-sky-200" />
              </div>
              <div className="flex-1">
                <p className="text-sm uppercase tracking-wide text-white/60">Ubicaciones</p>
                <p className="mt-1 text-3xl font-bold text-white">
                  {quotaUsage.current_locations}
                  <span className="text-lg text-white/50"> / {quotaUsage.max_locations}</span>
                </p>
                <p className="mt-1 text-xs text-white/60">
                  Plan {quotaUsage.plan_tier.toUpperCase()}
                </p>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="border-white/10 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/20 p-4">
                <Users className="h-6 w-6 text-emerald-200" />
              </div>
              <div className="flex-1">
                <p className="text-sm uppercase tracking-wide text-white/60">Doctores</p>
                <p className="mt-1 text-3xl font-bold text-white">
                  {quotaUsage.current_doctors}
                  <span className="text-lg text-white/50"> / {quotaUsage.max_doctors}</span>
                </p>
                <p className="mt-1 text-xs text-white/60">
                  {quotaUsage.max_doctors - quotaUsage.current_doctors} disponibles
                </p>
              </div>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* Available Add-ons */}
      <div className="grid gap-6 md:grid-cols-2">
        {availableAddons.map((config: AddonConfig) => {
          const currentQuantity = getActiveAddonQuantity(config.id);
          const activeAddon = addons.find(a => a.addon_type === config.id && a.status === 'active');
          const isPurchasing = purchasing === config.id;

          return (
            <motion.div
              key={config.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <GlassPanel className="relative border-white/10 p-6 text-white transition hover:border-white/30">
                {currentQuantity > 0 && (
                  <div className="absolute right-4 top-4">
                    <Badge className="border-emerald-300/60 bg-emerald-500/15 text-emerald-50">
                      <Check className="mr-1 h-3 w-3" />
                      Activo ({currentQuantity})
                    </Badge>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{config.icon}</span>
                      <h3 className="text-xl font-semibold">{config.name}</h3>
                    </div>
                    <p className="text-sm text-white/60">{config.description}</p>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-purple-200">${config.price}</span>
                    <span className="text-white/50">MXN/mes</span>
                  </div>

                  {currentQuantity > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <span className="text-sm text-white/70">Cantidad actual:</span>
                        <span className="text-lg font-semibold">{currentQuantity}</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => purchaseAddon(config.id, 1)}
                          disabled={isPurchasing || currentQuantity >= config.maxQuantity}
                          className="aura-cta aura-cta--ghost flex-1"
                        >
                          {isPurchasing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Plus className="h-4 w-4" />
                              Agregar +1
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => activeAddon && cancelAddon(activeAddon.id)}
                          disabled={isPurchasing}
                          className="aura-cta aura-cta--ghost border-rose-400/40 text-rose-100 hover:bg-rose-500/10"
                        >
                          <X className="h-4 w-4" />
                          Cancelar
                        </button>
                      </div>

                      <p className="text-center text-xs text-white/50">
                        Total: ${(currentQuantity * config.price).toLocaleString('es-MX')} MXN/mes
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => purchaseAddon(config.id, 1)}
                      disabled={isPurchasing}
                      className="aura-cta aura-cta--primary w-full"
                    >
                      {isPurchasing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Agregar Add-on
                        </>
                      )}
                    </button>
                  )}

                  <p className="text-center text-xs text-white/50">
                    Máximo {config.maxQuantity} unidades permitidas
                  </p>
                </div>
              </GlassPanel>
            </motion.div>
          );
        })}
      </div>

      {/* Help Text */}
      <GlassPanel className="border-purple-400/30 bg-purple-500/10 p-6 text-white">
        <div className="flex gap-4">
          <div className="text-2xl">💡</div>
          <div className="flex-1 space-y-1">
            <p className="font-semibold">Información importante</p>
            <p className="text-sm text-white/70">
              Los add-ons se facturan mensualmente y se suman a tu suscripción actual.
              Puedes cancelarlos en cualquier momento y el cargo se detendrá al final del periodo de facturación actual.
            </p>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
