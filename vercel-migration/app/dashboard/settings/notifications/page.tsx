'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Mail,
  Send,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Info,
  HelpCircle
} from 'lucide-react';
import { TwilioCredentialsSection } from '@/components/settings/twilio-credentials-section';
import { GlassPanel } from '@/components/ui/glass-panel';

interface EmailConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  email_enabled: boolean;
  signature: string;
  daily_email_limit: number;
  email_provider: string;
  current_daily_usage: number;
  use_resend_fallback: boolean;
  resend_api_key: string;
  // New fields for provider selection
  primary_provider?: 'smtp' | 'twilio';
  enable_fallback?: boolean;
  fallback_provider?: 'smtp' | 'twilio';
  sendgrid_api_key?: string;
  sendgrid_from_email?: string;
  sendgrid_from_name?: string;
}

export default function EmailConfigPage() {
  const [config, setConfig] = useState<Partial<EmailConfig>>({
    smtp_port: 587,
    smtp_secure: false,
    email_enabled: false,
    daily_email_limit: 500,
    use_resend_fallback: false,
    primary_provider: 'twilio', // Default to Twilio since user already has it
    enable_fallback: false,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [showSmtpHelp, setShowSmtpHelp] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/email-config');
      const data = await response.json();
      
      if (data.config) {
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const detectProvider = (email: string) => {
    const domain = email.split('@')[1]?.toLowerCase();
    
    if (domain?.includes('gmail')) {
      setConfig(prev => ({
        ...prev,
        email_provider: 'gmail',
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_secure: false,
        daily_email_limit: 500,
      }));
    } else if (domain?.includes('outlook') || domain?.includes('hotmail') || domain?.includes('live')) {
      setConfig(prev => ({
        ...prev,
        email_provider: 'outlook',
        smtp_host: 'smtp-mail.outlook.com',
        smtp_port: 587,
        smtp_secure: false,
        daily_email_limit: 300,
      }));
    } else if (domain?.includes('yahoo')) {
      setConfig(prev => ({
        ...prev,
        email_provider: 'yahoo',
        smtp_host: 'smtp.mail.yahoo.com',
        smtp_port: 587,
        smtp_secure: false,
        daily_email_limit: 500,
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        email_provider: 'custom',
      }));
    }
  };

  const handleSave = async () => {
    if (!config.from_email || !config.smtp_user || !config.smtp_password) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/email-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) throw new Error('Error saving config');

      const data = await response.json();
      setConfig(data.config);
      toast.success('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail) {
      toast.error('Por favor ingresa un email para la prueba');
      return;
    }

    setTesting(true);
    try {
      const response = await fetch('/api/email-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_email: testEmail }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`✅ Email de prueba enviado exitosamente via ${data.provider}`);
      } else {
        toast.error(data.error || 'Error al enviar email de prueba');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al enviar email de prueba');
    } finally {
      setTesting(false);
    }
  };

  const inputClass = 'w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none';

  if (loading) {
    return (
      <GlassPanel className="flex min-h-[320px] items-center justify-center border-white/10 bg-white/5 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-300" />
      </GlassPanel>
    );
  }

  const primaryProviderLabel = config.primary_provider === 'twilio' ? 'Twilio / SendGrid' : 'SMTP Tradicional';
  const fallbackProviderLabel = config.fallback_provider === 'twilio' ? 'Twilio / SendGrid' : 'SMTP Tradicional';

  return (
    <div className="space-y-6 text-white">
      <GlassPanel className="relative overflow-hidden border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-emerald-400/25 blur-[150px]" />
          <div className="absolute -bottom-32 left-0 h-72 w-72 rounded-full bg-sky-500/20 blur-[140px]" />
        </div>
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-5 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
              <Mail className="h-4 w-4" />
              Notificaciones
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Email + SMS automatizados</h1>
              <p className="mt-2 text-sm text-white/70">
                Define tu proveedor y mantén la agenda informada con confirmaciones, recordatorios y avisos en segundos.
              </p>
            </div>
          </div>
          <div className="grid gap-3 text-white/80 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Estado</p>
              <p className="text-lg font-semibold text-white">{config.email_enabled ? 'Activo' : 'Pausado'}</p>
              <p className="text-xs text-white/60">{primaryProviderLabel}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Uso diario</p>
              <p className="text-lg font-semibold text-white">
                {config.current_daily_usage || 0} / {config.daily_email_limit || 500}
              </p>
              <p className="text-xs text-white/60">Emails enviados hoy</p>
            </div>
          </div>
        </div>
      </GlassPanel>

      <GlassPanel className="space-y-6 border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">Canal principal</p>
            <h2 className="text-xl font-semibold text-white">Notificaciones por email</h2>
            <p className="text-sm text-white/70">Activa el envío automático al crear, confirmar o cancelar una cita.</p>
          </div>
          <button
            onClick={() => setConfig((prev) => ({ ...prev, email_enabled: !prev.email_enabled }))}
            className={`relative h-11 w-24 rounded-full border border-white/20 transition ${
              config.email_enabled ? 'bg-emerald-500/40' : 'bg-white/10'
            }`}
          >
            <span
              className={`absolute top-1.5 h-8 w-8 rounded-full bg-white transition ${
                config.email_enabled ? 'left-14 translate-x-[-100%]' : 'left-1'
              }`}
            />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {['twilio', 'smtp'].map((provider) => (
            <button
              key={provider}
              onClick={() => setConfig((prev) => ({ ...prev, primary_provider: provider as 'twilio' | 'smtp' }))}
              className={`rounded-3xl border p-5 text-left transition ${
                config.primary_provider === provider
                  ? 'border-white/50 bg-white/10'
                  : 'border-white/10 bg-white/5 hover:border-white/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${config.primary_provider === provider ? 'bg-emerald-300' : 'bg-white/30'}`} />
                <p className="text-lg font-semibold text-white">
                  {provider === 'twilio' ? 'Twilio (SendGrid)' : 'SMTP Tradicional'}
                </p>
              </div>
              <p className="mt-2 text-sm text-white/70">
                {provider === 'twilio'
                  ? 'API segura + SMS integrado desde tu cuenta Twilio.'
                  : 'Usa Gmail, Outlook o tu servidor para disparar correos.'}
              </p>
            </button>
          ))}
        </div>
      </GlassPanel>

      {config.primary_provider === 'twilio' && (
        <GlassPanel className="space-y-5 border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-violet-400/40 bg-violet-500/15 p-3">
              <Send className="h-5 w-5 text-violet-100" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Twilio / SendGrid</p>
              <h3 className="text-lg font-semibold text-white">Credenciales de correo</h3>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-sky-200" />
              <p>
                Con una sola cuenta de Twilio puedes enviar emails (SendGrid) y SMS. Obtén tu API key en{' '}
                <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" rel="noopener noreferrer" className="underline">
                  SendGrid → Settings → API Keys
                </a>.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-[0.35em] text-white/60">SendGrid API Key *</label>
              <input
                type="password"
                value={config.sendgrid_api_key || ''}
                onChange={(e) => setConfig((prev) => ({ ...prev, sendgrid_api_key: e.target.value }))}
                placeholder="SG.••••••••••••••••••••••"
                className={`${inputClass} mt-2`}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.35em] text-white/60">Email remitente *</label>
              <input
                type="email"
                value={config.sendgrid_from_email || ''}
                onChange={(e) => setConfig((prev) => ({ ...prev, sendgrid_from_email: e.target.value }))}
                placeholder="doctor@clinica.com"
                className={`${inputClass} mt-2`}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.35em] text-white/60">Nombre remitente *</label>
              <input
                type="text"
                value={config.sendgrid_from_name || ''}
                onChange={(e) => setConfig((prev) => ({ ...prev, sendgrid_from_name: e.target.value }))}
                placeholder="Dr. Juan Pérez - Clínica"
                className={`${inputClass} mt-2`}
              />
            </div>
          </div>
        </GlassPanel>
      )}

      {config.primary_provider === 'smtp' && (
        <GlassPanel className="space-y-5 border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-cyan-400/40 bg-cyan-500/15 p-3">
              <Send className="h-5 w-5 text-cyan-100" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">SMTP</p>
              <h3 className="text-lg font-semibold text-white">Servidor personalizado</h3>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-amber-200" />
              <div>
                <p className="font-semibold text-white">Tips rápidos</p>
                <ul className="mt-2 space-y-1 text-white/70">
                  <li>Email y usuario SMTP suelen ser iguales.</li>
                  <li>Usa contraseñas de aplicación (Gmail/Outlook).</li>
                  <li>Puertos comunes: 587 (TLS) o 465 (SSL).</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-[0.35em] text-white/60">Email remitente *</label>
              <input
                type="email"
                value={config.from_email || ''}
                onChange={(e) => {
                  setConfig((prev) => ({ ...prev, from_email: e.target.value }));
                  detectProvider(e.target.value);
                }}
                placeholder="doctor@clinica.com"
                className={`${inputClass} mt-2`}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.35em] text-white/60">Nombre remitente *</label>
              <input
                type="text"
                value={config.from_name || ''}
                onChange={(e) => setConfig((prev) => ({ ...prev, from_name: e.target.value }))}
                placeholder="Clínica SGMM"
                className={`${inputClass} mt-2`}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.35em] text-white/60">Servidor SMTP *</label>
                <input
                  type="text"
                  value={config.smtp_host || ''}
                  onChange={(e) => setConfig((prev) => ({ ...prev, smtp_host: e.target.value }))}
                  placeholder="smtp.gmail.com"
                  className={`${inputClass} mt-2`}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.35em] text-white/60">Puerto *</label>
                <input
                  type="number"
                  value={config.smtp_port || 587}
                  onChange={(e) => setConfig((prev) => ({ ...prev, smtp_port: parseInt(e.target.value) }))}
                  className={`${inputClass} mt-2`}
                />
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.35em] text-white/60">Usuario SMTP *</label>
              <input
                type="text"
                value={config.smtp_user || ''}
                onChange={(e) => setConfig((prev) => ({ ...prev, smtp_user: e.target.value }))}
                placeholder="tu-correo@dominio.com"
                className={`${inputClass} mt-2`}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.35em] text-white/60">Contraseña de aplicación *</label>
              <div className="relative mt-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={config.smtp_password || ''}
                  onChange={(e) => setConfig((prev) => ({ ...prev, smtp_password: e.target.value }))}
                  placeholder="••••••••••"
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.35em] text-white/60">Límite diario</label>
              <input
                type="number"
                value={config.daily_email_limit || 500}
                onChange={(e) => setConfig((prev) => ({ ...prev, daily_email_limit: parseInt(e.target.value) }))}
                className={`${inputClass} mt-2`}
              />
              <p className="mt-1 text-xs text-white/60">Gmail 500/día · Outlook 300/día</p>
            </div>
            {config.email_provider && (
              <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Proveedor detectado: {config.email_provider.toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </GlassPanel>
      )}

      <GlassPanel className="space-y-4 border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">Fallback</p>
            <h3 className="text-lg font-semibold text-white">Proveedor de respaldo</h3>
            <p className="text-sm text-white/70">Si alcanzas el límite diario, cambia automáticamente al otro proveedor.</p>
          </div>
          <button
            onClick={() => setConfig((prev) => ({
              ...prev,
              enable_fallback: !prev.enable_fallback,
              fallback_provider: !prev.enable_fallback
                ? prev.primary_provider === 'smtp'
                  ? 'twilio'
                  : 'smtp'
                : prev.fallback_provider
            }))}
            className={`relative h-11 w-24 rounded-full border border-white/20 transition ${
              config.enable_fallback ? 'bg-amber-500/40' : 'bg-white/10'
            }`}
          >
            <span
              className={`absolute top-1.5 h-8 w-8 rounded-full bg-white transition ${
                config.enable_fallback ? 'left-14 translate-x-[-100%]' : 'left-1'
              }`}
            />
          </button>
        </div>

        {config.enable_fallback && (
          <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm text-amber-50">
            <p className="font-semibold text-white">Secuencia de envío</p>
            <p className="text-white/80">
              Primero intentamos con <strong>{primaryProviderLabel}</strong>. Si falla o llegas al tope, usamos <strong>{fallbackProviderLabel}</strong> sin intervención manual.
            </p>
          </div>
        )}
      </GlassPanel>

      <TwilioCredentialsSection />

      <GlassPanel className="space-y-4 border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <Send className="h-5 w-5 text-emerald-200" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">Prueba rápida</p>
            <h3 className="text-lg font-semibold text-white">Enviar email de prueba</h3>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="paciente@ejemplo.com"
            className={`${inputClass} flex-1`}
          />
          <button
            onClick={handleTest}
            disabled={testing || !testEmail}
            className="aura-cta aura-cta--primary justify-center disabled:opacity-40"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Enviar prueba
              </>
            )}
          </button>
        </div>
      </GlassPanel>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="aura-cta aura-cta--primary px-8 text-base disabled:opacity-40"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Guardar configuración
            </>
          )}
        </button>
      </div>
    </div>
  );
}
