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

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-blue-200 mb-4 text-lg">
            ¿Quieres ver cómo funcionan estas características en vivo?
          </p>
          <a 
            href="https://wa.me/522223404585?text=Hola,%20quiero%20ver%20una%20demo%20de%20AgendaMedPro" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl transition-all shadow-lg hover:shadow-2xl transform hover:scale-105"
          >
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            💬 Agenda una demo personalizada por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
