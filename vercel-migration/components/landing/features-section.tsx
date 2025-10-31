"use client";

import { 
  Calendar, 
  Users, 
  Clock, 
  BarChart3, 
  Grid3x3, 
  CalendarClock,
  Stethoscope,
  Package,
  MessageSquare,
  Zap,
  TrendingUp,
  Shield
} from "lucide-react";

// Features destacadas - LAS MÁS IMPACTANTES
const heroFeatures = [
  {
    icon: Package,
    title: "Inventario 100% Automatizado",
    description: "Descuenta automáticamente medicamentos e insumos al registrar una consulta. Alertas inteligentes cuando el stock está bajo. Reportes de consumo por período.",
    detailPoints: [
      "Movimientos automáticos al usar productos en consulta",
      "Alertas por WhatsApp cuando hay bajo stock",
      "Control de caducidades y lotes",
      "Reportes de rentabilidad por producto"
    ],
    gradient: "from-emerald-500 to-teal-500",
    badge: "🔥 Más solicitado"
  },
  {
    icon: MessageSquare,
    title: "Mensajería WhatsApp Integrada",
    description: "Envía recordatorios automáticos y confirmaciones de cita por WhatsApp. Reduce inasistencias hasta un 80% y mejora la comunicación con tus pacientes.",
    detailPoints: [
      "Recordatorios automáticos 24h antes de la cita",
      "Confirmaciones con un clic desde el chat",
      "Notificaciones de cambios o cancelaciones",
      "Mensajes personalizables por doctor"
    ],
    gradient: "from-green-500 to-emerald-600",
    badge: "⚡ Más usado"
  },
  {
    icon: Calendar,
    title: "Calendario Multi-Doctor y Multi-Consultorio",
    description: "Gestiona horarios de 10+ doctores y consultorios simultáneamente. 4 vistas diferentes: timeline por doctor, por consultorio, grid completo, o vista estándar.",
    detailPoints: [
      "Vista timeline para ver toda la semana de un doctor",
      "Vista grid para comparar disponibilidad entre doctores",
      "Configuración de horarios por día con excepciones",
      "Detección automática de conflictos y traslapes"
    ],
    gradient: "from-blue-500 to-indigo-600",
    badge: "⭐ Exclusivo"
  }
];

// Features complementarias
const standardFeatures = [
  {
    icon: Stethoscope,
    title: "Expediente Clínico Digital",
    description: "Historial completo, recetas, notas SOAP, archivos adjuntos. Cumple NOM-004-SSA3-2012.",
    gradient: "from-violet-500 to-purple-500"
  },
  {
    icon: BarChart3,
    title: "Reportes y Análisis en Tiempo Real",
    description: "Dashboard con métricas de citas, ingresos, pacientes nuevos, y tendencias mensuales.",
    gradient: "from-indigo-500 to-blue-500"
  },
  {
    icon: Zap,
    title: "Facturación CFDI 4.0 Automática",
    description: "Genera facturas válidas para el SAT desde el sistema. Integración con Finkok.",
    gradient: "from-amber-500 to-orange-500"
  },
  {
    icon: CalendarClock,
    title: "Horarios Inteligentes",
    description: "Configura automáticamente horarios por día, excepciones, vacaciones, y días inhábiles.",
    gradient: "from-orange-500 to-red-500"
  },
  {
    icon: Grid3x3,
    title: "Multi-Ubicación",
    description: "Gestiona múltiples clínicas o sucursales desde una sola cuenta con vista unificada.",
    gradient: "from-rose-500 to-pink-500"
  },
  {
    icon: Shield,
    title: "Datos en México, 100% Seguros",
    description: "Servidores en territorio nacional. Cumplimiento total LFPDPPP. Tus datos nunca salen del país.",
    gradient: "from-slate-600 to-slate-800"
  }
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-grid-white/[0.05]" />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 text-sm font-medium bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">
            <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse" />
            3 funciones que cambiarán tu consultorio
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Lo que hace a{" "}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              AgendaMedPro diferente
            </span>
          </h2>
          
          <p className="text-xl text-blue-100 leading-relaxed">
            Mientras otras agendas solo programan citas, nosotros automatizamos todo tu consultorio.
          </p>
        </div>

        {/* Hero Features - Las 3 principales */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {heroFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300 hover:transform hover:scale-105"
              >
                {/* Badge */}
                <div className="absolute -top-3 right-4">
                  <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                    {feature.badge}
                  </span>
                </div>

                {/* Icon with gradient background */}
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6 shadow-lg`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-blue-200 mb-6 leading-relaxed">
                  {feature.description}
                </p>

                {/* Detail points */}
                <ul className="space-y-2">
                  {feature.detailPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-blue-100">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Separator */}
        <div className="flex items-center justify-center mb-16">
          <div className="h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent w-full max-w-md" />
          <span className="px-4 text-blue-300 text-sm font-medium whitespace-nowrap">Y además incluye</span>
          <div className="h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent w-full max-w-md" />
        </div>

        {/* Standard Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {standardFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/30 transition-all duration-300"
              >
                {/* Icon with gradient background */}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 transform group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-blue-200 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
