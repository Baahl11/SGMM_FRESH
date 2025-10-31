"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Zap, Crown, Loader2, Hourglass } from "lucide-react";
import { getPriceId, BillingCycle, PlanName } from "@/lib/stripe/client";

type RecurringBilling = Extract<BillingCycle, "monthly" | "annual">;

type StandardPlan = {
  name: string;
  planId: Exclude<PlanName, "lifetime">;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  icon: typeof Sparkles;
  gradient: string;
  features: string[];
  cta: string;
  popular: boolean;
  isContact: boolean;
  whatsappContact?: string;
};

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0
});

const plans: readonly StandardPlan[] = [
  {
    name: "Básico",
    planId: "basico",
    description: "Perfecto para consultorios pequeños",
    monthlyPrice: 599,
    annualPrice: 5990,
    icon: Sparkles,
    gradient: "from-blue-500 to-cyan-500",
    features: [
      "1 doctor",
      "1 consultorio",
      "200 citas/mes",
      "20 items de inventario",
      "10 tipos de tratamientos",
      "Agenda con 4 vistas",
      "Gestión de pacientes",
      "Horarios automáticos",
      "Reportes básicos",
      "Soporte por email"
    ],
    cta: "Comenzar prueba gratis",
    popular: false,
    isContact: false
  },
  {
    name: "Pro",
    planId: "pro",
    description: "Para clínicas en crecimiento",
    monthlyPrice: 999,
    annualPrice: 9990,
    icon: Zap,
    gradient: "from-purple-500 to-pink-500",
    features: [
      "Hasta 10 doctores",
      "5 consultorios",
      "Citas ilimitadas",
      "Inventario ilimitado",
      "Tratamientos ilimitados",
      "Todo del plan Básico",
      "Bundles y paquetes",
      "Reportes avanzados",
      "Control de gastos fijos",
      "Mensajería interna",
      "Soporte prioritario"
    ],
    cta: "Comenzar prueba gratis",
    popular: true,
    isContact: false
  },
  {
    name: "Enterprise",
    planId: "enterprise",
    description: "Para grupos médicos y hospitales",
    monthlyPrice: 2999,
    annualPrice: 29990,
    icon: Crown,
    gradient: "from-orange-500 to-red-500",
    features: [
      "Doctores ilimitados",
      "Consultorios ilimitados",
      "Todo del plan Pro",
      "Multi-ubicación",
      "API personalizada",
      "Integraciones custom",
      "Capacitación presencial",
      "Gerente de cuenta dedicado",
      "SLA 99.9% uptime",
      "Soporte 24/7"
    ],
    cta: "Contactar ventas",
    popular: false,
    isContact: true,
    whatsappContact: "https://wa.me/521234567890?text=Hola,%20quiero%20información%20del%20plan%20Enterprise"
  }
];

const lifetimeOffer = {
  price: 19990,
  oldPrice: 24999,
  // Ahorro comparado con Plan Pro anual durante 5 años: $9,990/año × 5 años = $49,950
  yearlyProCost: 9990, // Costo anual del plan Pro
  fiveYearSavings: 29960, // (9990 × 5) - 19990 = 29,960
  included: [
    "Todas las funcionalidades del plan Pro",
    "Actualizaciones de por vida sin costo adicional",
    "Soporte prioritario vía WhatsApp",
    "Acceso anticipado a nuevas funcionalidades"
  ]
};

const LIFETIME_PROMO_END = process.env.NEXT_PUBLIC_LIFETIME_PROMO_END || "2025-12-08T05:59:59.000Z";

function getTimeLeft(targetDate: Date) {
  const total = targetDate.getTime() - Date.now();

  if (total <= 0) {
    return { total, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((total / (1000 * 60)) % 60);
  const seconds = Math.floor((total / 1000) % 60);

  return { total, days, hours, minutes, seconds };
}

export function PricingSection() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<RecurringBilling>("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const promoEndDate = useMemo(() => new Date(LIFETIME_PROMO_END), []);
  const [timeLeft, setTimeLeft] = useState({ total: 1, days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setTimeLeft(getTimeLeft(promoEndDate));

    if (promoEndDate.getTime() <= Date.now()) {
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(promoEndDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [promoEndDate]);

  const isPromoActive = timeLeft.total > 0;

  const handleCheckout = async (planId: PlanName, cycle: BillingCycle) => {
    try {
      const loadingKey = `${planId}-${cycle}`;
      setLoadingPlan(loadingKey);

      const priceId = getPriceId(planId, cycle);

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ priceId })
      });

      const data = await response.json();

      if (data.error) {
        if (response.status === 401) {
          router.push("/auth/signin?callbackUrl=/pricing");
          return;
        }

        alert(`Error: ${data.error}`);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      alert("Hubo un error al procesar tu solicitud. Intenta nuevamente.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section id="pricing" className="relative py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
      <div className="absolute inset-0 bg-grid-slate-700/25 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.3))]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 text-sm font-medium bg-blue-500/10 text-blue-300 rounded-full border border-blue-500/20">
            <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse" />
            15 días gratis, cancela cuando quieras
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Planes que crecen{" "}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              contigo
            </span>
          </h2>

          <p className="text-xl text-slate-300 leading-relaxed">
            Sin compromisos. Cancela cuando quieras. Todos los planes incluyen soporte en español y actualizaciones gratuitas.
          </p>
          
          <div className="mt-6 inline-flex items-center gap-2 bg-green-500/15 border border-green-500/30 rounded-lg px-4 py-2">
            <span className="text-green-300 font-semibold">💰 Ahorra 2 meses pagando anual</span>
          </div>
        </div>

        {isPromoActive && (
          <div className="mb-12">
            <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-900/40 via-slate-900 to-slate-900 p-8 md:p-12 shadow-xl shadow-amber-500/20">
              <div className="absolute inset-0 pointer-events-none opacity-20" aria-hidden>
                <div className="absolute right-16 -top-8 w-48 h-48 bg-amber-400 blur-3xl" />
                <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-orange-500 blur-3xl" />
              </div>

              <div className="relative grid md:grid-cols-[1.2fr,0.8fr] gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-4 py-1.5 text-amber-200 border border-amber-500/30 text-sm font-semibold">
                    <Hourglass className="w-4 h-4" />
                    Promoción por tiempo limitado
                  </div>
                  <h3 className="mt-4 text-3xl md:text-4xl font-bold text-white">
                    Licencia Lifetime
                    <span className="block text-amber-300 text-lg md:text-xl font-semibold mt-2">
                      Paga una sola vez, usa AgendaMedPro para siempre
                    </span>
                  </h3>
                  <p className="mt-5 text-slate-200 max-w-2xl">
                    Ideal para clínicas consolidadas que buscan ROI inmediato. Incluye todas las funcionalidades del plan Pro, actualizaciones de por vida y soporte preferencial.
                  </p>

                  <div className="mt-6 space-y-3">
                    <div className="flex flex-wrap items-end gap-4 text-white">
                      <div>
                        <span className="text-sm text-slate-300 line-through">{currencyFormatter.format(lifetimeOffer.oldPrice)}</span>
                        <div className="text-4xl md:text-5xl font-black">{currencyFormatter.format(lifetimeOffer.price)}</div>
                        <span className="text-sm text-slate-400">Pago único • Sin renovaciones</span>
                      </div>
                    </div>
                    
                    <div className="bg-green-500/15 border border-green-500/30 rounded-lg p-4">
                      <div className="text-green-300 font-bold text-lg mb-1">
                        🎉 Ahorra {currencyFormatter.format(lifetimeOffer.fiveYearSavings)} en 5 años
                      </div>
                      <p className="text-green-200 text-sm">
                        vs. pagar {currencyFormatter.format(lifetimeOffer.yearlyProCost)}/año del plan Pro
                        <span className="block text-xs text-green-300 mt-1">
                          = {currencyFormatter.format(lifetimeOffer.yearlyProCost * 5)} en 5 años - {currencyFormatter.format(lifetimeOffer.price)} = {currencyFormatter.format(lifetimeOffer.fiveYearSavings)} de ahorro
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 rounded-2xl p-6 border border-white/20 backdrop-blur">
                  <h4 className="text-lg font-semibold text-white mb-4">Incluye:</h4>
                  <ul className="space-y-3 text-slate-200 text-sm">
                    {lifetimeOffer.included.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-4 h-4 mt-0.5 text-amber-300" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6">
                    <Button
                      className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold"
                      size="lg"
                      onClick={() => handleCheckout("lifetime", "once")}
                      disabled={loadingPlan === "lifetime-once"}
                    >
                      {loadingPlan === "lifetime-once" ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        "Obtener licencia lifetime"
                      )}
                    </Button>
                  </div>

                  <div className="mt-4 text-center text-xs text-slate-400">
                    Renovamos el precio el {promoEndDate.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </div>
              </div>

              <div className="relative mt-8 flex flex-wrap items-center gap-6 text-sm text-amber-100">
                <div className="flex items-center gap-2">
                  <Hourglass className="w-4 h-4" />
                  <span>Tiempo restante:</span>
                </div>
                <div className="flex items-center gap-4 text-lg font-semibold" suppressHydrationWarning>
                  <span suppressHydrationWarning>{String(timeLeft.days).padStart(2, "0")}d</span>
                  <span suppressHydrationWarning>{String(timeLeft.hours).padStart(2, "0")}h</span>
                  <span suppressHydrationWarning>{String(timeLeft.minutes).padStart(2, "0")}m</span>
                  <span suppressHydrationWarning>{String(timeLeft.seconds).padStart(2, "0")}s</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8 lg:gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const monthlySavings = plan.monthlyPrice * 12 - plan.annualPrice;
            const monthlyLoadingKey = `${plan.planId}-monthly`;
            const annualLoadingKey = `${plan.planId}-annual`;
            const contactLink = plan.whatsappContact || "https://wa.me/522223404585?text=Hola,%20quiero%20información%20sobre%20AgendaMedPro";

            return (
              <div
                key={plan.planId}
                className={`relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border transition-all duration-300 ${
                  plan.popular
                    ? "border-purple-500/50 shadow-2xl shadow-purple-500/20"
                    : "border-slate-700/50 hover:border-slate-600/50"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg">
                      ⭐ Más popular
                    </div>
                  </div>
                )}

                {/* Header del plan */}
                <div className="text-center mb-6">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} mb-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-slate-400 text-sm">{plan.description}</p>
                </div>

                {!plan.isContact ? (
                  <>
                    {/* Precios lado a lado: Mensual | Anual */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {/* PLAN MENSUAL */}
                      <div className="bg-white/5 rounded-lg p-3 border border-slate-700/50 text-center">
                        <div className="text-xs text-slate-400 mb-2">Mensual</div>
                        <div className="text-2xl font-bold text-white mb-1">
                          {currencyFormatter.format(plan.monthlyPrice)}
                        </div>
                        <div className="text-xs text-slate-400 mb-3">/mes</div>
                        <Button
                          className="w-full bg-white/10 hover:bg-white/20 text-white text-xs py-2"
                          size="sm"
                          onClick={() => handleCheckout(plan.planId, "monthly")}
                          disabled={loadingPlan === monthlyLoadingKey}
                        >
                          {loadingPlan === monthlyLoadingKey ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              ...
                            </>
                          ) : (
                            "Elegir"
                          )}
                        </Button>
                      </div>

                      {/* PLAN ANUAL - DESTACADO */}
                      <div className={`rounded-lg p-3 border-2 text-center relative ${
                        plan.popular 
                          ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500" 
                          : "bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500"
                      }`}>
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                            plan.popular ? "bg-purple-500 text-white" : "bg-green-500 text-white"
                          }`}>
                            Ahorra {currencyFormatter.format(monthlySavings)}
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 font-semibold mb-2">Anual</div>
                        <div className="text-2xl font-bold text-white mb-1">
                          {currencyFormatter.format(plan.annualPrice)}
                        </div>
                        <div className="text-xs text-green-300 font-semibold mb-3">
                          = {currencyFormatter.format(Math.round(plan.annualPrice / 12))}/mes
                        </div>
                        <Button
                          className={`w-full text-xs py-2 font-bold ${
                            plan.popular
                              ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                              : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                          }`}
                          size="sm"
                          onClick={() => handleCheckout(plan.planId, "annual")}
                          disabled={loadingPlan === annualLoadingKey}
                        >
                          {loadingPlan === annualLoadingKey ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              ...
                            </>
                          ) : (
                            "Elegir anual"
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-6 text-center">
                      <div className="flex items-baseline justify-center mb-2">
                        <span className="text-slate-400 text-xl">$</span>
                        <span className="text-4xl font-bold text-white">{plan.monthlyPrice.toLocaleString("es-MX")}</span>
                        <span className="text-slate-400 text-lg ml-1">MXN/mes</span>
                      </div>
                      <p className="text-xs text-slate-400">Cotización personalizada</p>
                    </div>

                    <Button
                      className="w-full mb-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      size="lg"
                      onClick={() => window.open(contactLink, "_blank")}
                    >
                      {plan.cta}
                    </Button>
                  </>
                )}

                {/* Features del plan */}
                <div className="pt-4 border-t border-slate-700/50">
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start text-slate-300">
                        <Check className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0 ${
                          plan.popular ? "text-purple-400" : "text-blue-400"
                        }`} />
                        <span className="text-xs">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-slate-400 mb-4">
            Todos los precios son en pesos mexicanos (MXN). IVA incluido.
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-slate-500">
            <div className="flex items-center">
              <Check className="w-4 h-4 mr-2 text-green-400" />
              Sin permanencia
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 mr-2 text-green-400" />
              Cancela cuando quieras
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 mr-2 text-green-400" />
              Actualizaciones gratis
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
