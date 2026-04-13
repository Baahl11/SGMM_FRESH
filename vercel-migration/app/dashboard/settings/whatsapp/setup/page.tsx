'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, CheckCircle, ExternalLink, Copy, AlertCircle } from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-panel';
import Link from 'next/link';

export default function WhatsAppSetupWizard() {
  const supabase = createClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState({
    phoneNumberId: '',
    businessAccountId: '',
    accessToken: ''
  });
  const [testing, setTesting] = useState(false);
  const [validated, setValidated] = useState(false);

  const totalSteps = 4;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`✓ ${label} copiado`);
  };

  const testConnection = async () => {
    if (!config.phoneNumberId || !config.accessToken) {
      toast.error('Completa Phone Number ID y Access Token primero');
      return;
    }

    setTesting(true);
    try {
      const response = await fetch('/api/whatsapp/validate-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number_id: config.phoneNumberId,
          access_token: config.accessToken
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

  const saveConfig = async () => {
    try {
      const response = await fetch('/api/user/whatsapp-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp_enabled: true,
          whatsapp_phone_number_id: config.phoneNumberId,
          whatsapp_business_account_id: config.businessAccountId,
          whatsapp_access_token: config.accessToken
        })
      });

      if (!response.ok) throw new Error('Error al guardar');

      toast.success('✓ ¡Configuración guardada!');
      setTimeout(() => {
        window.location.href = '/dashboard/settings/whatsapp';
      }, 1500);
    } catch (error) {
      toast.error('Error al guardar configuración');
    }
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 1: return true; // Solo lectura
      case 2: return config.phoneNumberId.length > 10;
      case 3: return config.accessToken.startsWith('EAAG');
      case 4: return validated;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Configuración de WhatsApp
          </h1>
          <p className="mt-2 text-white/70">
            Tutorial paso a paso - 5 minutos ⏱️
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
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
        </div>

        {/* Step Content */}
        <GlassPanel className="border-white/10 bg-white/5 p-6 sm:p-8">
          {/* PASO 1: Crear App en Meta */}
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
                      <p className="text-white">Dale un nombre a tu app, ejemplo:</p>
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
                      Una vez creada, busca y agrega el producto <strong className="text-emerald-300">"WhatsApp"</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-yellow-400/30 bg-yellow-500/10 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-yellow-300" />
                  <div className="text-sm text-yellow-100">
                    <strong>Importante:</strong> Si no tienes cuenta de Meta Business,
                    te pedirá crear una. Es gratis y toma 2 minutos.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: Obtener Phone Number ID */}
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
                      Busca la sección "Phone number ID" (aparece abajo del número de teléfono)
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                      3
                    </div>
                    <p className="text-white">
                      Es un número LARGO de ~15 dígitos, ejemplo:
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
                  value={config.phoneNumberId}
                  onChange={(e) => setConfig({ ...config, phoneNumberId: e.target.value })}
                  placeholder="123456789012345"
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 font-mono text-white placeholder:text-white/40 focus:border-emerald-400 focus:outline-none"
                />
                {config.phoneNumberId && config.phoneNumberId.length < 10 && (
                  <p className="mt-2 text-sm text-red-300">
                    ⚠️ El Phone Number ID suele tener más de 10 dígitos
                  </p>
                )}
              </div>
            </div>
          )}

          {/* PASO 3: Obtener Access Token */}
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
                      En la misma página <strong className="text-purple-300">WhatsApp → API Setup</strong>
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                      2
                    </div>
                    <p className="text-white">
                      Busca "Temporary access token" y haz clic en <strong className="text-purple-300">"Generate token"</strong>
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                      3
                    </div>
                    <div>
                      <p className="text-white mb-2">
                        ⚠️ <strong>IMPORTANTE:</strong> Ese token es temporal (24h). Necesitas uno PERMANENTE:
                      </p>
                      <ul className="space-y-1 text-sm text-white/80 ml-4">
                        <li>• Ve a <strong>App Settings → System Users</strong></li>
                        <li>• Crea un System User (ej: "WhatsApp Bot")</li>
                        <li>• Dale permisos <strong>whatsapp_business_messaging</strong></li>
                        <li>• Genera token → Selecciona <strong>"Never expires"</strong></li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-black/30 p-3">
                  <p className="text-xs text-white/60 mb-1">Empieza con "EAAG":</p>
                  <code className="text-xs text-purple-300 break-all">
                    EAAGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
                  </code>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  🔑 Pega aquí tu Access Token Permanente
                </label>
                <textarea
                  value={config.accessToken}
                  onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                  placeholder="EAAGxxxxxxxxxxxxxxxxxxxx"
                  rows={4}
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 font-mono text-sm text-white placeholder:text-white/40 focus:border-purple-400 focus:outline-none resize-none"
                />
                {config.accessToken && !config.accessToken.startsWith('EAAG') && (
                  <p className="mt-2 text-sm text-red-300">
                    ⚠️ El Access Token debe empezar con "EAAG"
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-yellow-400/30 bg-yellow-500/10 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-yellow-300" />
                  <div className="text-sm text-yellow-100">
                    <strong>Tip:</strong> Guarda este token en un lugar seguro. Si lo pierdes,
                    tendrás que generar uno nuevo.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASO 4: Probar y Guardar */}
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
                      {config.phoneNumberId}
                    </code>
                  </div>
                  <div>
                    <p className="text-xs text-white/60 mb-1">Access Token</p>
                    <code className="block rounded bg-black/30 px-3 py-2 text-sm text-purple-300 truncate">
                      {config.accessToken.substring(0, 20)}...
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
                  onClick={saveConfig}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 text-lg font-semibold text-white transition hover:from-emerald-600 hover:to-emerald-700"
                >
                  💾 Guardar y Activar WhatsApp
                </button>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
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

        {/* Quick Links */}
        <div className="mt-6 text-center">
          <Link
            href="/dashboard/settings/whatsapp"
            className="text-sm text-white/60 hover:text-white/80"
          >
            ← Volver a configuración de WhatsApp
          </Link>
        </div>
      </div>
    </div>
  );
}
