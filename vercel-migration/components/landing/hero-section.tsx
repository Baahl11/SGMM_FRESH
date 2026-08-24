'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Calendar, Users, Clock, BarChart3 } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Left column - Text content */}
          <div className="text-white">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6 border border-white/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-sm font-medium">🚀 Programa Beta • 14 días prueba gratis</span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              La agenda médica
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
                más completa
              </span>
              de México
            </h1>

            {/* Description */}
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              <strong>Agenda inteligente + Inventario automatizado + WhatsApp integrado.</strong> Gestiona citas, 
              stock de materiales y envía recordatorios automáticos. <strong>Todo en español</strong> y hecho en México.
            </p>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="flex items-center gap-3 text-white/90">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-yellow-400/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-yellow-300" />
                </div>
                <div>
                  <div className="font-semibold">4 Vistas de Agenda</div>
                  <div className="text-xs text-white/70">Calendario, Timeline, Grid, Multi-Doctor</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-400/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold">Inventario Automatizado</div>
                  <div className="text-xs text-white/70">Stock, alertas, consumo por cita</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-400/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </div>
                <div>
                  <div className="font-semibold">WhatsApp Integrado</div>
                  <div className="text-xs text-white/70">Usa tus propias credenciales</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-400/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <div className="font-semibold">Reportes Avanzados</div>
                  <div className="text-xs text-white/70">Ingresos, gastos, inventario</div>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/select-trial-plan">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6 font-semibold shadow-xl hover:shadow-2xl transition-all"
                >
                  🎉 Comenzar Prueba Gratis
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full sm:w-auto bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 text-lg px-8 py-6 font-semibold"
                >
                  Iniciar Sesión →
                </Button>
              </Link>
            </div>

            {/* Value Props - Por qué elegir AgendaMedPro */}
            <div className="mt-10 pt-10 border-t border-white/20">
              <p className="text-white/70 text-sm mb-4">🚀 Ventajas Competitivas</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-white">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mb-3 shadow-lg">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="font-semibold mb-1">Inventario Automático</div>
                  <div className="text-sm text-white/70">Descuenta por cita, alertas de stock</div>
                </div>
                <div className="text-white">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-3 shadow-lg">
                    <span className="text-2xl">🇲🇽</span>
                  </div>
                  <div className="font-semibold mb-1">100% Mexicana</div>
                  <div className="text-sm text-white/70">Datos en México, pesos MXN, SAT</div>
                </div>
                <div className="text-white">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mb-3 shadow-lg">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </div>
                  <div className="font-semibold mb-1">WhatsApp Business API</div>
                  <div className="text-sm text-white/70">Tus propias credenciales (BYOK)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Feature Cards */}
          <div className="hidden lg:block">
            <div className="relative space-y-4">
              {/* Card 1 - Agenda Multi-Vista */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300 hover:scale-105">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-1">4 Vistas de Agenda</h3>
                    <p className="text-white/70 text-sm">Calendario estándar, Timeline por doctor, Grid multi-doctor. Horarios recurrentes y excepciones.</p>
                    <div className="mt-3 flex gap-2">
                      <span className="bg-yellow-500/20 px-3 py-1 rounded-full text-yellow-300 text-xs font-semibold">Multi-Doctor</span>
                      <span className="bg-yellow-500/20 px-3 py-1 rounded-full text-yellow-300 text-xs font-semibold">Tiempo Real</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2 - Inventario */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300 hover:scale-105 ml-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-1">Inventario Automatizado</h3>
                    <p className="text-white/70 text-sm">Descuenta automáticamente materiales por cita. Alertas de stock bajo. Control total de consumibles.</p>
                    <div className="mt-3 inline-block bg-purple-500/20 px-3 py-1 rounded-full">
                      <span className="text-purple-300 text-xs font-semibold">⚡ Descuento automático</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3 - WhatsApp */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300 hover:scale-105">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-1">WhatsApp Business API</h3>
                    <p className="text-white/70 text-sm">Conecta tu cuenta de WhatsApp Business. Envía recordatorios y marketing. Tú pagas directamente a Twilio/Meta.</p>
                    <div className="mt-3 flex gap-2">
                      <span className="bg-green-500/20 px-3 py-1 rounded-full text-green-300 text-xs font-semibold">BYOK</span>
                      <span className="bg-blue-500/20 px-3 py-1 rounded-full text-blue-300 text-xs font-semibold">Tus credenciales</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4 - App PWA */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300 hover:scale-105 ml-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-1">App Instalable (PWA)</h3>
                    <p className="text-white/70 text-sm">Agrégala a tu pantalla de inicio. Funciona como app nativa. Sin descargar de tiendas.</p>
                    <div className="mt-3 flex gap-2">
                      <span className="bg-blue-500/20 px-3 py-1 rounded-full text-blue-300 text-xs font-semibold">📱 iOS</span>
                      <span className="bg-blue-500/20 px-3 py-1 rounded-full text-blue-300 text-xs font-semibold">🤖 Android</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="text-white/50 text-center">
          <div className="text-sm mb-2">Descubre más</div>
          <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  )
}
