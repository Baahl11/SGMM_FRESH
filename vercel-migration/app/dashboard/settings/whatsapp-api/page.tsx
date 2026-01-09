'use client';

/**
 * WhatsApp Business Configuration Page (Migrated to Dashboard Settings)
 * BYOK (Bring Your Own Keys) Model
 */

import { useState, useEffect } from 'react';
import { MessageSquare, Save, TestTube, ExternalLink, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { GlassPanel } from '@/components/ui/glass-panel';

interface MessagingConfig {
  id: string;
  whatsapp_business_id: string | null;
  whatsapp_phone_number_id: string | null;
  whatsapp_access_token: string | null;
  whatsapp_phone_number: string | null;
  whatsapp_verified: boolean;
  whatsapp_enabled: boolean;
  auto_reminders_enabled: boolean;
  reminder_24h_enabled: boolean;
  reminder_1h_enabled: boolean;
  daily_message_limit: number;
  current_daily_usage: number;
  connection_status: 'connected' | 'disconnected' | 'error';
  last_connection_test: string | null;
  // Personalization fields
  doctor_name: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  clinic_phone: string | null;
  custom_message_signature: string | null;
}

export default function WhatsAppConfigPage() {
  const [config, setConfig] = useState<MessagingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const inputClass = 'h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/60 focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400/30';

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/messaging/config');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error response from API:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        // If 401 unauthorized, show different message
        if (response.status === 401) {
          toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');
          return;
        }
        
        // If 404 or no config, create default config
        if (response.status === 404 || errorData.error?.includes('no rows')) {
          setConfig({
            id: '',
            whatsapp_business_id: null,
            whatsapp_phone_number_id: null,
            whatsapp_access_token: null,
            whatsapp_phone_number: null,
            whatsapp_verified: false,
            whatsapp_enabled: false,
            auto_reminders_enabled: false,
            reminder_24h_enabled: true,
            reminder_1h_enabled: false,
            daily_message_limit: 1000,
            current_daily_usage: 0,
            connection_status: 'disconnected',
            last_connection_test: null,
            doctor_name: null,
            clinic_name: null,
            clinic_address: null,
            clinic_phone: null,
            custom_message_signature: null,
          });
          return;
        }
        
        toast.error(errorData.error || 'Error al cargar configuración');
        return;
      }

      const data = await response.json();
      
      if (data.config) {
        setConfig(data.config);
      } else {
        // No config yet - create default
        setConfig({
          id: '',
          whatsapp_business_id: null,
          whatsapp_phone_number_id: null,
          whatsapp_access_token: null,
          whatsapp_phone_number: null,
          whatsapp_verified: false,
          whatsapp_enabled: false,
          auto_reminders_enabled: false,
          reminder_24h_enabled: true,
          reminder_1h_enabled: false,
          daily_message_limit: 1000,
          current_daily_usage: 0,
          connection_status: 'disconnected',
          last_connection_test: null,
          doctor_name: null,
          clinic_name: null,
          clinic_address: null,
          clinic_phone: null,
          custom_message_signature: null,
        });
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Error de conexión. Verifica tu internet e intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    // Validate required fields if WhatsApp is enabled
    if (config.whatsapp_enabled) {
      if (!config.whatsapp_business_id || !config.whatsapp_phone_number_id || !config.whatsapp_access_token) {
        toast.error('Debes completar todos los campos de credenciales para habilitar WhatsApp');
        return;
      }
    }

    try {
      setIsSaving(true);
      const response = await fetch('/api/messaging/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp_business_id: config.whatsapp_business_id,
          whatsapp_phone_number_id: config.whatsapp_phone_number_id,
          whatsapp_access_token: config.whatsapp_access_token,
          whatsapp_phone_number: config.whatsapp_phone_number,
          whatsapp_enabled: config.whatsapp_enabled,
          auto_reminders_enabled: config.auto_reminders_enabled,
          reminder_24h_enabled: config.reminder_24h_enabled,
          reminder_1h_enabled: config.reminder_1h_enabled,
          daily_message_limit: config.daily_message_limit,
          // Personalization fields
          doctor_name: config.doctor_name,
          clinic_name: config.clinic_name,
          clinic_address: config.clinic_address,
          clinic_phone: config.clinic_phone,
          custom_message_signature: config.custom_message_signature,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setConfig(data.config);
        toast.success('Configuración guardada correctamente');
      } else {
        toast.error(data.error || 'Error al guardar configuración');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config?.whatsapp_business_id || !config?.whatsapp_phone_number_id || !config?.whatsapp_access_token) {
      toast.error('Completa las credenciales antes de probar la conexión');
      return;
    }

    try {
      setIsTesting(true);
      const response = await fetch('/api/messaging/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp_business_id: config.whatsapp_business_id,
          whatsapp_phone_number_id: config.whatsapp_phone_number_id,
          whatsapp_access_token: config.whatsapp_access_token,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setConfig({ ...config, connection_status: 'connected', last_connection_test: new Date().toISOString() });
        toast.success('✅ Conexión exitosa con WhatsApp Business API');
      } else {
        setConfig({ ...config, connection_status: 'error' });
        toast.error(data.error || 'Error al conectar con WhatsApp Business API');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setConfig({ ...config, connection_status: 'error' });
      toast.error('Error al probar conexión');
    } finally {
      setIsTesting(false);
    }
  };

  const updateConfig = (key: keyof MessagingConfig, value: any) => {
    if (!config) return;
    setConfig({ ...config, [key]: value });
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-sm text-muted-foreground">Error al cargar configuración</p>
      </div>
    );
  }

  const connectionStatus = config.connection_status;
  const isConnected = connectionStatus === 'connected';
  const hasError = connectionStatus === 'error';
  const lastConnectionTestLabel = config.last_connection_test
    ? new Date(config.last_connection_test).toLocaleString('es-MX')
    : 'Sin pruebas todavía';
  const canTestConnection = Boolean(
    config.whatsapp_business_id && config.whatsapp_phone_number_id && config.whatsapp_access_token,
  );
  const reminderSummary = [
    config.reminder_24h_enabled ? '24h' : null,
    config.reminder_1h_enabled ? '1h' : null,
  ]
    .filter(Boolean)
    .join(' y ');

  const heroStats = [
    {
      label: 'Estado',
      value: isConnected ? 'Conectado' : hasError ? 'Error' : 'Desconectado',
      helper: isConnected
        ? 'Integración lista para enviar'
        : hasError
          ? 'Revisa el token permanente'
          : 'Aún no se valida la conexión',
      accent: isConnected ? 'text-emerald-200' : hasError ? 'text-rose-200' : 'text-white',
    },
    {
      label: 'Mensajes del día',
      value: `${config.current_daily_usage}/${config.daily_message_limit}`,
      helper: 'Consumo del límite diario',
      accent: 'text-sky-200',
    },
    {
      label: 'Recordatorios',
      value: config.auto_reminders_enabled ? 'Activos' : 'Inactivos',
      helper: config.auto_reminders_enabled ? reminderSummary || 'Sin horarios definidos' : 'Actívalos en Automatización',
      accent: config.auto_reminders_enabled ? 'text-emerald-200' : 'text-white',
    },
  ];

  const setupSteps = [
    {
      number: '01',
      title: 'Crea tu cuenta',
      description: 'Abre Facebook Business Manager y habilita WhatsApp',
      link: 'https://business.facebook.com',
      linkLabel: 'business.facebook.com',
    },
    {
      number: '02',
      title: 'Configura WhatsApp',
      description: 'Desde Meta agrega un número y habilita el Cloud API',
    },
    {
      number: '03',
      title: 'Genera el token',
      description: 'Crea un usuario del sistema y genera un token permanente',
    },
    {
      number: '04',
      title: 'Pega las credenciales',
      description: 'Completa el formulario de abajo y prueba la conexión',
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      <GlassPanel className="relative overflow-hidden border border-white/10 bg-gradient-to-br from-emerald-500/20 via-indigo-500/10 to-slate-900/60 p-6 md:p-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="mb-6 flex items-center gap-3 text-white/80">
              <div className="rounded-2xl bg-white/10 p-3">
                <MessageSquare className="h-6 w-6" />
              </div>
              <span className="text-sm uppercase tracking-[0.3em] text-white/60">WhatsApp Business</span>
            </div>
            <h1 className="text-3xl font-semibold text-white md:text-4xl">
              Conecta WhatsApp y automatiza tus recordatorios
            </h1>
            <p className="mt-4 text-base text-white/80">
              Mantén a tus pacientes informados con recordatorios 24/7 usando tu propia cuenta de WhatsApp Business API.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="aura-cta">
                <a
                  href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver guía de conexión
                </a>
              </Button>
              <Button
                variant="ghost"
                className="rounded-2xl border border-white/20 bg-white/5 text-white hover:bg-white/10"
                asChild
              >
                <a href="https://developers.facebook.com/docs/whatsapp" target="_blank" rel="noopener noreferrer">
                  Documentación oficial
                </a>
              </Button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {heroStats.map((stat) => (
              <div key={stat.label} className="rounded-3xl border border-white/10 bg-white/5 p-5 text-white">
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">{stat.label}</p>
                <p className={`mt-3 text-2xl font-semibold ${stat.accent}`}>{stat.value}</p>
                <p className="mt-2 text-sm text-white/70">{stat.helper}</p>
              </div>
            ))}
          </div>
        </div>
      </GlassPanel>

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassPanel className="space-y-6 p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">Checklist</p>
              <h2 className="text-2xl font-semibold text-white">Conexión en 4 pasos</h2>
              <p className="mt-1 text-sm text-white/70">Sigue estos pasos antes de pegar tus credenciales</p>
            </div>
            <Button
              variant="ghost"
              className="rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10"
              asChild
            >
              <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" target="_blank" rel="noopener noreferrer">
                Ver guía completa <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {setupSteps.map((step) => (
              <div key={step.number} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">Paso {step.number}</p>
                <p className="mt-3 text-lg font-semibold">{step.title}</p>
                <p className="mt-2 text-sm text-white/70">{step.description}</p>
                {step.link && (
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center text-xs font-semibold text-emerald-200 hover:text-white"
                  >
                    {step.linkLabel}
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel className="space-y-6 p-6">
          <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                isConnected
                  ? 'bg-emerald-400/10 text-emerald-200'
                  : hasError
                    ? 'bg-rose-400/10 text-rose-200'
                    : 'bg-white/10 text-white'
              }`}
            >
              {isConnected ? <CheckCircle className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">Estado actual</p>
              <p className="text-xl font-semibold text-white">
                {isConnected ? 'Conectado con Meta' : hasError ? 'Error con tus credenciales' : 'Sin conexión activa'}
              </p>
              <p className="text-sm text-white/70">Última prueba: {lastConnectionTestLabel}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            <p className="font-semibold text-white">Número vinculado</p>
            <p className="text-lg text-white">
              {config.whatsapp_phone_number ? config.whatsapp_phone_number : 'Sin número registrado'}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.3em] text-white/50">Business Account ID</p>
            <p className="font-mono text-sm text-white">
              {config.whatsapp_business_id || 'Pendiente'}
            </p>
          </div>
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80">
            <p className="text-sm">
              Ejecuta una prueba rápida para confirmar que Meta acepta mensajes desde tu cuenta de AgendaMedPro.
            </p>
            <Button
              onClick={handleTestConnection}
              disabled={isTesting || !canTestConnection}
              className="aura-cta w-full justify-center"
            >
              <TestTube className="mr-2 h-4 w-4" />
              {isTesting ? 'Probando conexión...' : 'Probar conexión ahora'}
            </Button>
            {!canTestConnection && (
              <p className="text-xs text-white/60">Completa tus credenciales antes de probar.</p>
            )}
          </div>
        </GlassPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <GlassPanel className="space-y-6 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">Credenciales</p>
            <h2 className="text-2xl font-semibold text-white">WhatsApp Business API</h2>
            <p className="mt-2 text-sm text-white/70">Ciframos tus llaves con AES-256 y rotamos los secretos cada 24h.</p>
          </div>
          <div className="space-y-5">
            <div>
              <Label htmlFor="business_id" className="text-white">
                WhatsApp Business Account ID
              </Label>
              <Input
                id="business_id"
                placeholder="123456789012345"
                value={config.whatsapp_business_id || ''}
                onChange={(e) => updateConfig('whatsapp_business_id', e.target.value)}
                className={inputClass}
              />
              <p className="mt-2 text-xs text-white/60">Business Manager → WhatsApp → Configuración.</p>
            </div>
            <div>
              <Label htmlFor="phone_id" className="text-white">
                Phone Number ID
              </Label>
              <Input
                id="phone_id"
                placeholder="987654321098765"
                value={config.whatsapp_phone_number_id || ''}
                onChange={(e) => updateConfig('whatsapp_phone_number_id', e.target.value)}
                className={inputClass}
              />
              <p className="mt-2 text-xs text-white/60">ID único del número configurado en Meta.</p>
            </div>
            <div>
              <Label htmlFor="phone_number" className="text-white">
                Número de WhatsApp (incluye código de país)
              </Label>
              <Input
                id="phone_number"
                placeholder="+5215512345678"
                value={config.whatsapp_phone_number || ''}
                onChange={(e) => updateConfig('whatsapp_phone_number', e.target.value)}
                className={inputClass}
              />
              <p className="mt-2 text-xs text-white/60">Formato recomendado: +52 y 10 dígitos sin espacios.</p>
            </div>
            <div>
              <Label htmlFor="access_token" className="text-white">
                Token permanente
              </Label>
              <div className="relative">
                <Input
                  id="access_token"
                  type={showToken ? 'text' : 'password'}
                  placeholder="EAAxxxxxxxxxxxxxxxxxxxxx"
                  value={config.whatsapp_access_token || ''}
                  onChange={(e) => updateConfig('whatsapp_access_token', e.target.value)}
                  className={`${inputClass} pr-12`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="mt-2 text-xs text-white/60">Genera un token para un usuario del sistema y marca que nunca expire.</p>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="space-y-6 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">Automatización</p>
            <h2 className="text-2xl font-semibold text-white">Recordatorios inteligentes</h2>
            <p className="mt-2 text-sm text-white/70">Controla qué mensajes se disparan y limita el consumo diario.</p>
          </div>
          <div className="space-y-6 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold">Habilitar WhatsApp</p>
                <p className="text-sm text-white/70">Sólo disponible cuando la conexión está verificada.</p>
              </div>
              <Switch
                checked={config.whatsapp_enabled}
                onCheckedChange={(checked) => updateConfig('whatsapp_enabled', checked)}
                disabled={!isConnected}
              />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold">Recordatorios automáticos</p>
                <p className="text-sm text-white/70">Envía avisos sin intervención manual.</p>
              </div>
              <Switch
                checked={config.auto_reminders_enabled}
                onCheckedChange={(checked) => updateConfig('auto_reminders_enabled', checked)}
                disabled={!config.whatsapp_enabled}
              />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold">Recordatorio 24h</p>
                <p className="text-sm text-white/70">Se envía el día anterior a la cita.</p>
              </div>
              <Switch
                checked={config.reminder_24h_enabled}
                onCheckedChange={(checked) => updateConfig('reminder_24h_enabled', checked)}
                disabled={!config.auto_reminders_enabled}
              />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold">Recordatorio 1h</p>
                <p className="text-sm text-white/70">Último empujón antes de la cita.</p>
              </div>
              <Switch
                checked={config.reminder_1h_enabled}
                onCheckedChange={(checked) => updateConfig('reminder_1h_enabled', checked)}
                disabled={!config.auto_reminders_enabled}
              />
            </div>
            <div>
              <Label htmlFor="daily_limit" className="text-white">
                Límite diario de mensajes
              </Label>
              <Input
                id="daily_limit"
                type="number"
                min="1"
                max="10000"
                value={config.daily_message_limit}
                onChange={(e) => updateConfig('daily_message_limit', Number(e.target.value) || 0)}
                className={inputClass}
              />
              <p className="mt-2 text-xs text-white/60">
                Mensajes usados hoy: {config.current_daily_usage} / {config.daily_message_limit}
              </p>
            </div>
          </div>
        </GlassPanel>
      </div>

      <GlassPanel className="space-y-8 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/60">Personalización</p>
          <h2 className="text-2xl font-semibold text-white">Firma y datos de la clínica</h2>
          <p className="mt-2 text-sm text-white/70">Lo que completes aquí aparecerá en todos los recordatorios automáticos.</p>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-5">
            <div>
              <Label htmlFor="doctor_name" className="text-white">
                Nombre del doctor
              </Label>
              <Input
                id="doctor_name"
                placeholder="Dr. Juan Pérez"
                value={config.doctor_name || ''}
                onChange={(e) => updateConfig('doctor_name', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <Label htmlFor="clinic_name" className="text-white">
                Nombre de la clínica
              </Label>
              <Input
                id="clinic_name"
                placeholder="Clínica SGMM"
                value={config.clinic_name || ''}
                onChange={(e) => updateConfig('clinic_name', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <Label htmlFor="clinic_address" className="text-white">
                Dirección completa
              </Label>
              <Input
                id="clinic_address"
                placeholder="Av. Reforma 123, Col. Centro, CDMX"
                value={config.clinic_address || ''}
                onChange={(e) => updateConfig('clinic_address', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <Label htmlFor="clinic_phone" className="text-white">
                Teléfono de contacto
              </Label>
              <Input
                id="clinic_phone"
                placeholder="55 1234 5678"
                value={config.clinic_phone || ''}
                onChange={(e) => updateConfig('clinic_phone', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <Label htmlFor="custom_signature" className="text-white">
                Firma personalizada (opcional)
              </Label>
              <Input
                id="custom_signature"
                placeholder="Equipo Médico Integral"
                value={config.custom_message_signature || ''}
                onChange={(e) => updateConfig('custom_message_signature', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-emerald-900/40 to-slate-900 p-6 text-white/90">
            <p className="text-sm uppercase tracking-[0.35em] text-emerald-200">Vista previa</p>
            <div className="mt-4 space-y-3 text-sm leading-relaxed">
              <p>Hola [Nombre del paciente],</p>
              <p>
                Te recordamos tu cita médica mañana [Fecha] a las [Hora].
                Por favor confirma tu asistencia respondiendo a este mensaje.
              </p>
              {config.clinic_address ? (
                <p>📍 {config.clinic_address}</p>
              ) : (
                <p className="text-white/60">Agrega una dirección para mostrarla aquí.</p>
              )}
              {config.clinic_phone ? (
                <p>📞 {config.clinic_phone}</p>
              ) : (
                <p className="text-white/60">Incluye un teléfono para contactos urgentes.</p>
              )}
              <p className="pt-4 text-white">
                Saludos,
                {config.doctor_name && (
                  <>
                    <br />
                    {config.doctor_name}
                  </>
                )}
                {config.clinic_name && (
                  <>
                    <br />
                    {config.clinic_name}
                  </>
                )}
                {config.custom_message_signature && (
                  <>
                    <br />
                    <em>{config.custom_message_signature}</em>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </GlassPanel>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="aura-cta px-8">
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Guardando...' : 'Guardar configuración'}
        </Button>
      </div>
    </div>
  );
}
