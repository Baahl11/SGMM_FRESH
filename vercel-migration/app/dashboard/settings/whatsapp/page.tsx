'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { MessageSquare, ArrowRight, CheckCircle, ExternalLink, AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-panel';

export default function WhatsAppMetaSettings() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [testing, setTesting] = useState(false);
  const [validated, setValidated] = useState(false);
  const [settings, setSettings] = useState({
    enabled: false,
    phoneNumberId: '',
    businessAccountId: '',
    accessToken: ''
  });

  const totalSteps = 4;

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('whatsapp_enabled, whatsapp_phone_number_id, whatsapp_business_account_id, whatsapp_access_token')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          enabled: data.whatsapp_enabled || false,
          phoneNumberId: data.whatsapp_phone_number_id || '',
          businessAccountId: data.whatsapp_business_account_id || '',
          accessToken: data.whatsapp_access_token || ''
        });
        
        // Si no tiene configuración, mostrar wizard automáticamente
        if (!data.whatsapp_enabled || !data.whatsapp_phone_number_id) {
          setShowWizard(true);
        }
      } else {
        setShowWizard(true);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/whatsapp-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp_enabled: true,
          whatsapp_provider: 'meta',
          whatsapp_phone_number_id: settings.phoneNumberId,
          whatsapp_business_account_id: settings.businessAccountId,
          whatsapp_access_token: settings.accessToken
        })
      });

      if (!response.ok) throw new Error('Error al guardar');

      toast.success('✅ Configuración guardada correctamente');
      setShowWizard(false);
      setValidated(false);
      setCurrentStep(1);
      loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!settings.phoneNumberId || !settings.accessToken) {
      toast.error('Completa Phone Number ID y Access Token primero');
      return;
    }

    setTesting(true);
    try {
      const response = await fetch('/api/whatsapp/validate-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number_id: settings.phoneNumberId,
          access_token: settings.accessToken
        })
      });

      const result = await response.json();

      if (result.success) {
        setValidated(true);
        toast.success('✓ ¡Conexión exitosa! Ya puedes guardar.');
      } else {
        toast.error(`Error: ${result.error || 'No se pudo conectar'}`);
      }
    } catch (error) {
      toast.error('Error al probar conexión');
    } finally {
      setTesting(false);
    }
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 1: return true;
      case 2: return settings.phoneNumberId.length > 10;
      case 3: return settings.accessToken.startsWith('EAA') && settings.accessToken.length > 50;
      case 4: return validated;
      default: return false;
    }
  };

  if (loading) {
    return (
      <GlassPanel className="flex min-h-[320px] items-center justify-center border-white/10 bg-white/5 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-300"></div>
      </GlassPanel>
    );
  }

  // WIZARD MODE
  if (showWizard) {
    return (
      <div className="space-y-6 text-white">
        {/* Header */}
        <GlassPanel className="relative overflow-hidden border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-70">
            <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-emerald-400/25 blur-[150px]" />
            <div className="absolute -bottom-32 left-0 h-72 w-72 rounded-full bg-green-500/20 blur-[140px]" />
          </div>
          <div className="relative space-y-4">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-5 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
              <MessageSquare className="h-4 w-4" />
              WhatsApp Setup
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Configuración de WhatsApp</h1>
              <p className="mt-2 text-sm text-white/70">
                Tutorial paso a paso - Solo 5 minutos ⏱️
              </p>
            </div>
          </div>
        </GlassPanel>

        {/* Progress Bar */}
        <GlassPanel className="border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex flex-1 items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                    step <= currentStep
                      ? 'border-emerald-400 bg-emerald-400/20 text-emerald-300'
                      : 'border-white/20 bg-white/5 text-white/40'
                  }`}
                >
                  {step < currentStep ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="font-semibold">{step}</span>
                  )}
                </div>
                {step < 4 && (
                  <div
                    className={`h-1 flex-1 ${
                      step < currentStep ? 'bg-emerald-400' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between px-2 text-xs text-white/60">
            <span>Crear App</span>
            <span>Phone ID</span>
            <span>Token</span>
            <span>Listo</span>
          </div>
        </GlassPanel>

        {/* Step Content */}
        <GlassPanel className="border-white/10 bg-white/5 p-6 sm:p-8">
          {/* PASO 1 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 text-2xl">
                  1️⃣
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Crear tu App de WhatsApp en Meta
                  </h2>
                  <p className="mt-1 text-white/70">
                    Primero necesitas crear una aplicación en Meta (Facebook)
                  </p>
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-blue-400/30 bg-blue-500/10 p-6">
                <h3 className="font-semibold text-white">📋 Pasos a seguir:</h3>
                
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                      1
                    </div>
                    <div>
                      <p className="text-white">Ve a Meta for Developers</p>
                      <a
                        href="https://developers.facebook.com/apps/create/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-sm text-blue-300 hover:text-blue-200"
                      >
                        Abrir Meta Developers
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                      2
                    </div>
                    <p className="text-white">
                      Haz clic en <strong className="text-emerald-300">"Create App"</strong> (botón verde)
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                      3
                    </div>
                    <p className="text-white">
                      Selecciona <strong className="text-emerald-300">"Business"</strong> como tipo de app
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                      4
                    </div>
                    <div>
                      <p className="text-white">Dale un nombre, ejemplo:</p>
                      <code className="mt-1 block rounded bg-black/30 px-3 py-1 text-sm text-emerald-300">
                        Mi Consultorio WhatsApp
                      </code>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                      5
                    </div>
                    <p className="text-white">
                      Agrega el producto <strong className="text-emerald-300">"WhatsApp"</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASO 2 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-2xl">
                  2️⃣
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Copiar tu Phone Number ID
                  </h2>
                  <p className="mt-1 text-white/70">
                    Este es el identificador de tu número de WhatsApp
                  </p>
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-6">
                <h3 className="font-semibold text-white">📋 Dónde encontrarlo:</h3>
                
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                      1
                    </div>
                    <p className="text-white">
                      En tu app de Meta, ve a <strong className="text-emerald-300">WhatsApp → API Setup</strong>
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                      2
                    </div>
                    <p className="text-white">
                      Busca "Phone number ID" (número largo de ~15 dígitos)
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-black/30 p-3">
                  <code className="text-sm text-emerald-300">123456789012345</code>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  📱 Pega aquí tu Phone Number ID
                </label>
                <input
                  type="text"
                  value={settings.phoneNumberId}
                  onChange={(e) => setSettings({ ...settings, phoneNumberId: e.target.value })}
                  placeholder="123456789012345"
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 font-mono text-white placeholder:text-white/40 focus:border-emerald-400 focus:outline-none"
                />
                {settings.phoneNumberId && settings.phoneNumberId.length < 10 && (
                  <p className="mt-2 text-sm text-red-300">
                    ⚠️ El Phone Number ID suele tener más de 10 dígitos
                  </p>
                )}
              </div>
            </div>
          )}

          {/* PASO 3 */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20 text-2xl">
                  3️⃣
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Generar Access Token Permanente
                  </h2>
                  <p className="mt-1 text-white/70">
                    Este token permite enviar mensajes de WhatsApp
                  </p>
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-purple-400/30 bg-purple-500/10 p-6">
                <h3 className="font-semibold text-white">🔑 Cómo obtener el token:</h3>
                
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                      1
                    </div>
                    <p className="text-white">
                      En <strong className="text-purple-300">WhatsApp → API Setup</strong>
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                      2
                    </div>
                    <div>
                      <p className="text-white mb-2">
                        ⚠️ <strong>IMPORTANTE:</strong> Necesitas uno PERMANENTE:
                      </p>
                      <ul className="space-y-1 text-sm text-white/80 ml-4">
                        <li>• Ve a <strong>App Settings → System Users</strong></li>
                        <li>• Crea un System User</li>
                        <li>• Dale permisos <strong>whatsapp_business_messaging</strong></li>
                        <li>• Genera token → <strong>"Never expires"</strong></li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-black/30 p-3">
                  <p className="text-xs text-white/60 mb-1">Empieza con "EAA":</p>
                  <code className="text-xs text-purple-300 break-all">
                    EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
                  </code>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  🔑 Pega aquí tu Access Token Permanente
                </label>
                <textarea
                  value={settings.accessToken}
                  onChange={(e) => setSettings({ ...settings, accessToken: e.target.value })}
                  placeholder="EAAxxxxxxxxxxxxxxxxxxxxxx (pega tu token completo)"
                  rows={4}
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 font-mono text-sm text-white placeholder:text-white/40 focus:border-purple-400 focus:outline-none resize-none"
                />
                {settings.accessToken && !settings.accessToken.startsWith('EAA') && (
                  <p className="mt-2 text-sm text-red-300">
                    ⚠️ El Access Token debe empezar con "EAA"
                  </p>
                )}
              </div>
            </div>
          )}

          {/* PASO 4 */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-2xl">
                  ✅
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Probar Conexión
                  </h2>
                  <p className="mt-1 text-white/70">
                    Vamos a verificar que todo funcione correctamente
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-white/20 bg-white/5 p-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-white/60 mb-1">Phone Number ID</p>
                    <code className="block rounded bg-black/30 px-3 py-2 text-sm text-emerald-300 truncate">
                      {settings.phoneNumberId}
                    </code>
                  </div>
                  <div>
                    <p className="text-xs text-white/60 mb-1">Access Token</p>
                    <code className="block rounded bg-black/30 px-3 py-2 text-sm text-purple-300 truncate">
                      {settings.accessToken.substring(0, 20)}...
                    </code>
                  </div>
                </div>

                <button
                  onClick={testConnection}
                  disabled={testing || validated}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 font-semibold text-white transition hover:from-blue-600 hover:to-blue-700 disabled:opacity-50"
                >
                  {testing ? '🔄 Probando conexión...' : validated ? '✓ Conexión exitosa' : '🧪 Probar Conexión con Meta'}
                </button>

                {validated && (
                  <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-6 w-6 text-emerald-300" />
                      <div>
                        <p className="font-semibold text-emerald-300">¡Perfecto!</p>
                        <p className="text-sm text-emerald-200">
                          Tu configuración es correcta. Ya puedes guardar.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {validated && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 text-lg font-semibold text-white transition hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : '💾 Guardar y Activar WhatsApp'}
                </button>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex justify-between gap-4">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10 disabled:opacity-30"
            >
              <ArrowLeft className="h-4 w-4" />
              Anterior
            </button>

            {currentStep < totalSteps && (
              <button
                onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
                disabled={!canGoNext()}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 font-semibold text-white transition hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-30"
              >
                Siguiente
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </GlassPanel>
      </div>
    );
  }

  // NORMAL MODE (configurado)
  return (
    <div className="space-y-6 text-white">
      <GlassPanel className="relative overflow-hidden border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-emerald-400/25 blur-[150px]" />
          <div className="absolute -bottom-32 left-0 h-72 w-72 rounded-full bg-green-500/20 blur-[140px]" />
        </div>
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-5 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
              <MessageSquare className="h-4 w-4" />
              WhatsApp
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">WhatsApp Cloud API</h1>
              <p className="mt-2 text-sm text-white/70">
                API oficial de Meta conectada. BYOK Model.
              </p>
            </div>
          </div>
          <div className="grid gap-3 text-white/80">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Estado</p>
              <p className="text-lg font-semibold text-white">{settings.enabled ? '✅ Activo' : '⏸️ Pausado'}</p>
              <p className="text-xs text-white/60">BYOK Model</p>
            </div>
          </div>
        </div>
      </GlassPanel>

      <GlassPanel className="border-white/10 bg-white/5 p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Configuración Actual</h3>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-white/60 mb-1">Phone Number ID</p>
              <code className="block rounded bg-black/30 px-3 py-2 text-sm text-emerald-300 truncate">
                {settings.phoneNumberId}
              </code>
            </div>
            <div>
              <p className="text-xs text-white/60 mb-1">Access Token</p>
              <code className="block rounded bg-black/30 px-3 py-2 text-sm text-purple-300 truncate">
                {settings.accessToken ? settings.accessToken.substring(0, 20) + '...' : 'No configurado'}
              </code>
            </div>
          </div>

          <button
            onClick={() => setShowWizard(true)}
            className="w-full rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            🔧 Reconfigurar WhatsApp
          </button>
        </div>
      </GlassPanel>
    </div>
  );
}
