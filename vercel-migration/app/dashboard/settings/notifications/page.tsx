'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Mail,
  Lock,
  Server,
  Send,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Info,
  HelpCircle
} from 'lucide-react';

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
}

export default function EmailConfigPage() {
  const [config, setConfig] = useState<Partial<EmailConfig>>({
    smtp_port: 587,
    smtp_secure: false,
    email_enabled: false,
    daily_email_limit: 500,
    use_resend_fallback: false,
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración de Email</h1>
        <p className="text-gray-600">
          Configura tu cuenta de email para enviar notificaciones automáticas a tus pacientes
        </p>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">¿Cómo conseguir una contraseña de aplicación?</p>
          <ul className="list-disc list-inside space-y-1 text-blue-800">
            <li><strong>Gmail:</strong> Ve a tu cuenta Google → Seguridad → Verificación en 2 pasos → Contraseñas de aplicaciones</li>
            <li><strong>Outlook:</strong> Ve a Configuración → Seguridad → Contraseñas de aplicaciones</li>
          </ul>
        </div>
      </div>

      {/* Enable Toggle */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Habilitar Notificaciones por Email</h3>
            <p className="text-sm text-gray-600 mt-1">
              Envía emails automáticos cuando se crean, confirman o cancelan reservas
            </p>
          </div>
          <button
            onClick={() => setConfig(prev => ({ ...prev, email_enabled: !prev.email_enabled }))}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              config.email_enabled ? 'bg-teal-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                config.email_enabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Usage Stats */}
      {config.current_daily_usage !== undefined && config.daily_email_limit && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Uso Diario</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-700">Emails enviados hoy</span>
                <span className="font-semibold text-gray-900">
                  {config.current_daily_usage} / {config.daily_email_limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-teal-500 to-blue-500 h-3 rounded-full transition-all"
                  style={{
                    width: `${Math.min((config.current_daily_usage / config.daily_email_limit) * 100, 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            El contador se reinicia automáticamente cada día a las 00:00
          </p>
        </div>
      )}

      {/* SMTP Configuration */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4 relative">
          <Server className="h-5 w-5 text-teal-600" />
          <h3 className="text-lg font-semibold text-gray-900">Configuración SMTP</h3>
          <div
            className="ml-1 relative"
            onMouseEnter={() => setShowSmtpHelp(true)}
            onMouseLeave={() => setShowSmtpHelp(false)}
          >
            <button
              type="button"
              aria-describedby="smtp-help-popover"
              onFocus={() => setShowSmtpHelp(true)}
              onBlur={() => setShowSmtpHelp(false)}
              className="flex h-6 w-6 items-center justify-center rounded-full border border-teal-300 text-teal-600 transition-colors hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
            {showSmtpHelp && (
              <div
                id="smtp-help-popover"
                role="tooltip"
                className="absolute left-0 top-full mt-2 w-max max-w-xl rounded-lg border border-teal-200 bg-white p-4 shadow-xl"
              >
                <p className="mb-2 text-sm font-semibold text-teal-700">Cómo llenar estos datos</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  <li><strong>Email remitente:</strong> el correo desde el cual saldrán los mensajes que reciben tus pacientes.</li>
                  <li><strong>Nombre del remitente:</strong> lo que verán tus pacientes como "De:" (por ejemplo, "Clínica Santa María").</li>
                  <li><strong>Servidor SMTP y puerto:</strong> usa los datos que te da tu proveedor. Ejemplos: Gmail "smtp.gmail.com" con puerto 587, Outlook "smtp-mail.outlook.com".</li>
                  <li><strong>Usuario SMTP:</strong> normalmente es el mismo correo remitente completo.</li>
                  <li><strong>Contraseña de aplicación:</strong> es una clave especial que generas en la sección de seguridad de tu correo cuando activas verificación en dos pasos. No uses tu contraseña normal.</li>
                  <li><strong>Límite diario:</strong> define cuántos correos quieres enviar por día para no superar el máximo de tu proveedor.</li>
                </ul>
                <p className="mt-2 text-xs text-gray-500">Si tienes dudas, escribe a soporte y te guiamos paso a paso.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* From Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email remitente *
            </label>
            <input
              type="email"
              value={config.from_email || ''}
              onChange={(e) => {
                setConfig(prev => ({ ...prev, from_email: e.target.value }));
                detectProvider(e.target.value);
              }}
              placeholder="doctor@clinica.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* From Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del remitente *
            </label>
            <input
              type="text"
              value={config.from_name || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, from_name: e.target.value }))}
              placeholder="Dr. Juan Pérez - Clínica XYZ"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Provider Detection */}
          {config.email_provider && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Proveedor detectado: {config.email_provider.toUpperCase()}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* SMTP Host */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Servidor SMTP *
              </label>
              <input
                type="text"
                value={config.smtp_host || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, smtp_host: e.target.value }))}
                placeholder="smtp.gmail.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* SMTP Port */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Puerto
              </label>
              <input
                type="number"
                value={config.smtp_port || 587}
                onChange={(e) => setConfig(prev => ({ ...prev, smtp_port: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* SMTP User */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuario SMTP *
            </label>
            <input
              type="text"
              value={config.smtp_user || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, smtp_user: e.target.value }))}
              placeholder="tu-email@gmail.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* SMTP Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña de aplicación *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={config.smtp_password || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, smtp_password: e.target.value }))}
                placeholder="••••••••••••••••"
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Daily Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Límite diario de emails
            </label>
            <input
              type="number"
              value={config.daily_email_limit || 500}
              onChange={(e) => setConfig(prev => ({ ...prev, daily_email_limit: parseInt(e.target.value) }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500"
            />
            <p className="text-xs text-gray-600 mt-1">
              Gmail: 500/día, Outlook: 300/día
            </p>
          </div>
        </div>
      </div>

      {/* Resend Fallback */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Fallback a Resend (Opcional)</h3>
            <p className="text-sm text-gray-600 mt-1">
              Si se rebasa el límite diario de SMTP, usar Resend como respaldo
            </p>
          </div>
          <button
            onClick={() => setConfig(prev => ({ ...prev, use_resend_fallback: !prev.use_resend_fallback }))}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              config.use_resend_fallback ? 'bg-teal-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                config.use_resend_fallback ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {config.use_resend_fallback && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resend API Key
            </label>
            <input
              type="password"
              value={config.resend_api_key || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, resend_api_key: e.target.value }))}
              placeholder="re_••••••••••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500"
            />
            <p className="text-xs text-gray-600 mt-1">
              Obtén tu API key en <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">resend.com</a>
            </p>
          </div>
        )}
      </div>

      {/* Test Email */}
      <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-lg border-2 border-blue-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Send className="h-5 w-5 text-teal-600" />
          <h3 className="text-lg font-semibold text-gray-900">Enviar Email de Prueba</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Verifica que tu configuración funciona correctamente
        </p>
        <div className="flex gap-3">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="email@ejemplo.com"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={handleTest}
            disabled={testing || !testEmail}
            className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Enviar Prueba
              </>
            )}
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-md hover:from-teal-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-lg font-semibold"
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5" />
              Guardar Configuración
            </>
          )}
        </button>
      </div>
    </div>
  );
}
