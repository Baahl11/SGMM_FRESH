'use client';

import { useState, useEffect } from 'react';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, MessageSquare, Mail, Globe, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { generateAppointmentReminderMessage, generateContactMessage } from '@/lib/whatsapp-helpers';

interface WhatsAppSettings {
  whatsapp_phone: string;
  whatsapp_enabled: boolean;
  whatsapp_default_message: string;
}

export default function WhatsAppTestPage() {
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user/whatsapp-settings');
      if (response.ok) {
        const data = await response.json();
        if (data.whatsapp_enabled && data.whatsapp_phone) {
          setSettings(data);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!settings || !settings.whatsapp_enabled) {
    return (
      <div className="space-y-6 pb-16">
        <GlassPanel className="border border-orange-400/20 bg-gradient-to-br from-orange-500/10 to-transparent p-8 text-center">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 text-orange-400" />
          <h1 className="text-2xl font-semibold text-white mb-2">
            WhatsApp no configurado
          </h1>
          <p className="text-white/70 mb-6">
            Primero debes configurar tu número de WhatsApp en Configuración
          </p>
          <a
            href="/dashboard/settings/whatsapp"
            className="inline-block px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            Ir a Configuración
          </a>
        </GlassPanel>
      </div>
    );
  }

  // Sample appointment data for testing
  const sampleAppointment = {
    doctorName: 'González',
    patientName: 'Juan Pérez',
    appointmentDate: '15 de Enero, 2026',
    appointmentTime: '10:00 AM',
  };

  const appointmentMessage = generateAppointmentReminderMessage(sampleAppointment);
  const contactMessage = generateContactMessage({
    doctorName: 'González',
    customMessage: settings.whatsapp_default_message,
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Hero */}
      <GlassPanel className="border border-emerald-400/20 bg-gradient-to-br from-emerald-500/20 via-indigo-500/10 to-slate-900/60 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-2xl bg-emerald-500/20 p-3">
            <MessageSquare className="h-6 w-6 text-emerald-200" />
          </div>
          <Badge className="bg-emerald-500/30 text-emerald-100 border-emerald-400/30">
            MODO PRUEBA
          </Badge>
        </div>
        <h1 className="text-3xl font-semibold text-white md:text-4xl mb-4">
          Prueba tu Configuración de WhatsApp
        </h1>
        <p className="text-base text-white/80 max-w-3xl">
          Tu número configurado: <strong className="text-emerald-300">{settings.whatsapp_phone}</strong>
        </p>
      </GlassPanel>

      {/* Test Scenarios */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Scenario 1: Email Reminder */}
        <GlassPanel className="border border-white/10 bg-white/5">
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-500/20 p-3">
                <Mail className="h-6 w-6 text-blue-200" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Email de Recordatorio</h3>
                <p className="text-sm text-white/60">Cómo lo verán tus pacientes</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
              <p className="text-sm text-white/80">
                <strong>De:</strong> AgendaMedPro &lt;no-reply@agendamedpro.com&gt;
              </p>
              <p className="text-sm text-white/80">
                <strong>Asunto:</strong> Recordatorio de Cita - 15 de Enero
              </p>
              <div className="border-t border-white/10 pt-3 mt-3">
                <p className="text-sm text-white/90 mb-4">
                  Hola Juan Pérez,<br /><br />
                  Te recordamos tu cita:<br />
                  📅 15 de Enero, 2026<br />
                  ⏰ 10:00 AM<br />
                  👨‍⚕️ Dr. González
                </p>
                <WhatsAppButton
                  phone={settings.whatsapp_phone}
                  message={appointmentMessage}
                  size="sm"
                >
                  Contactar al Doctor
                </WhatsAppButton>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-white/60">
              <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-emerald-400" />
              <p>
                El botón abre WhatsApp con el mensaje pre-escrito: "{appointmentMessage}"
              </p>
            </div>
          </div>
        </GlassPanel>

        {/* Scenario 2: Public Profile */}
        <GlassPanel className="border border-white/10 bg-white/5">
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-purple-500/20 p-3">
                <Globe className="h-6 w-6 text-purple-200" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Perfil Público</h3>
                <p className="text-sm text-white/60">En tu página de citas</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 mx-auto mb-3 flex items-center justify-center">
                  <span className="text-2xl">👨‍⚕️</span>
                </div>
                <h4 className="text-white font-semibold mb-1">Dr. González</h4>
                <p className="text-sm text-white/60 mb-4">Medicina General</p>
                
                <WhatsAppButton
                  phone={settings.whatsapp_phone}
                  message={contactMessage}
                  size="sm"
                  className="w-full"
                >
                  Enviar Mensaje
                </WhatsAppButton>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-white/60">
              <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-emerald-400" />
              <p>
                Mensaje personalizado: "{contactMessage}"
              </p>
            </div>
          </div>
        </GlassPanel>

        {/* Scenario 3: Appointment Confirmation */}
        <GlassPanel className="border border-white/10 bg-white/5">
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-green-500/20 p-3">
                <Calendar className="h-6 w-6 text-green-200" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Confirmación de Cita</h3>
                <p className="text-sm text-white/60">Después de agendar</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 mx-auto mb-3 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-emerald-400" />
                </div>
                <h4 className="text-white font-semibold mb-1">¡Cita Agendada!</h4>
                <p className="text-sm text-white/60 mb-4">
                  15 de Enero, 2026 a las 10:00 AM
                </p>
                
                <WhatsAppButton
                  phone={settings.whatsapp_phone}
                  message={appointmentMessage}
                  size="sm"
                  className="w-full"
                >
                  Confirmar por WhatsApp
                </WhatsAppButton>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-white/60">
              <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-emerald-400" />
              <p>
                El paciente puede confirmar directamente contigo
              </p>
            </div>
          </div>
        </GlassPanel>

        {/* Scenario 4: Direct Test */}
        <GlassPanel className="border border-yellow-400/20 bg-gradient-to-br from-yellow-500/10 to-transparent">
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-yellow-500/20 p-3">
                <MessageSquare className="h-6 w-6 text-yellow-200" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Prueba Directa</h3>
                <p className="text-sm text-white/60">Envíate un mensaje de prueba</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-4">
              <p className="text-sm text-white/80">
                Click en cualquiera de estos botones para probar:
              </p>
              
              <div className="space-y-2">
                <WhatsAppButton
                  phone={settings.whatsapp_phone}
                  message="🧪 Prueba de configuración desde AgendaMedPro"
                  size="sm"
                  className="w-full"
                >
                  Mensaje de Prueba Simple
                </WhatsAppButton>

                <WhatsAppButton
                  phone={settings.whatsapp_phone}
                  message={appointmentMessage}
                  size="sm"
                  className="w-full"
                >
                  Mensaje de Cita
                </WhatsAppButton>

                <WhatsAppButton
                  phone={settings.whatsapp_phone}
                  message={settings.whatsapp_default_message}
                  size="sm"
                  className="w-full"
                >
                  Mensaje Personalizado
                </WhatsAppButton>
              </div>
            </div>

            <div className="rounded-2xl bg-blue-500/10 border border-blue-400/20 p-4">
              <p className="text-xs text-white/70">
                💡 <strong>Tip:</strong> Si los botones funcionan correctamente, verás que WhatsApp 
                se abre automáticamente con el mensaje pre-escrito. Tus pacientes tendrán la misma experiencia.
              </p>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Instructions */}
      <GlassPanel className="border border-white/10 bg-white/5">
        <div className="p-6 space-y-4">
          <h3 className="text-xl font-semibold text-white">📋 Cómo Funciona</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                <span className="text-emerald-400 font-bold">1</span>
              </div>
              <p className="text-sm text-white/80">
                Los botones de arriba simulan cómo los verán tus pacientes en emails y páginas
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                <span className="text-emerald-400 font-bold">2</span>
              </div>
              <p className="text-sm text-white/80">
                Al hacer clic, WhatsApp Web o la app se abre automáticamente
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                <span className="text-emerald-400 font-bold">3</span>
              </div>
              <p className="text-sm text-white/80">
                El mensaje aparece pre-escrito, solo necesitan presionar enviar
              </p>
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
