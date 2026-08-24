"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, Zap, Crown, Loader2 } from "lucide-react";
import { getPriceId, BillingCycle, PlanName } from "@/lib/stripe/client";

type RecurringBilling = Extract<BillingCycle, "monthly" | "annual">;

type StandardPlan = {
  name: string;
  planId: Extract<PlanName, "pro" | "enterprise">;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  icon: typeof Zap;
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
    name: "Pro",
    planId: "pro",
    description: "Para clínicas en crecimiento",
    monthlyPrice: 1499,
    annualPrice: 14990,
    icon: Zap,
    gradient: "from-purple-500 to-pink-500",
    features: [
      "Hasta 10 doctores",
      "5 consultorios",
      "Citas ilimitadas",
      "Inventario ilimitado",
      "Tratamientos ilimitados",
      "Agenda multivista",
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
    cta: "Comenzar prueba gratis",
    popular: false,
    isContact: false
  }
];

export function PricingSection() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<RecurringBilling>("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

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
            14 días gratis, cancela cuando quieras
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

        <div className="grid md:grid-cols-2 gap-8 lg:gap-6">
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
