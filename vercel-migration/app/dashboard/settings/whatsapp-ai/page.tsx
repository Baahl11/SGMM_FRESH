'use client';

import { GlassPanel } from '@/components/ui/glass-panel';
import { MessageSquare, Copy, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function WhatsAppAIGuide() {
  const [copied, setCopied] = useState<string | null>(null);

  const webhookUrl = 'https://agendamedpro.com/api/webhooks/whatsapp';
  const verifyToken = 'agendamedpro_verify_2026';

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <GlassPanel className="border-white/10 bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-emerald-500/5 p-8">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl border border-purple-400/30 bg-purple-500/20 p-4">
            <MessageSquare className="h-8 w-8 text-purple-300" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Asistente IA para WhatsApp
            </h1>
            <p className="mt-1 text-white/70">
              Configura respuestas automáticas inteligentes 24/7
            </p>
          </div>
        </div>
      </GlassPanel>

      {/* ¿Qué hace? */}
      <GlassPanel className="border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-2xl font-semibold text-white">
          ✨ ¿Qué hace el Asistente IA?
        </h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
            <p className="mb-2 font-semibold text-emerald-300">✅ Confirma citas</p>
            <p className="text-sm text-white/70">
              Detecta "Sí", "Confirmo", "OK" y actualiza automáticamente
            </p>
          </div>

          <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-4">
            <p className="mb-2 font-semibold text-blue-300">📅 Informa sobre citas</p>
            <p className="text-sm text-white/70">
              Muestra próximas citas cuando el paciente pregunta
            </p>
          </div>

          <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4">
            <p className="mb-2 font-semibold text-red-300">❌ Cancela y reagenda</p>
            <p className="text-sm text-white/70">
              Entiende "No puedo", "Cancelar" y ofrece opciones
            </p>
          </div>

          <div className="rounded-xl border border-purple-400/20 bg-purple-500/10 p-4">
            <p className="mb-2 font-semibold text-purple-300">🤖 Responde preguntas</p>
            <p className="text-sm text-white/70">
              Usa Claude AI para dar información relevante
            </p>
          </div>
        </div>
      </GlassPanel>

      {/* Cómo funciona */}
      <GlassPanel className="border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-2xl font-semibold text-white">
          🔄 ¿Cómo funciona la arquitectura?
        </h2>

        <div className="space-y-4 text-white/80">
          <div className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-4">
            <p className="font-semibold text-blue-200">📡 Webhook único (multi-tenant)</p>
            <p className="mt-2 text-sm">
              Todos los usuarios usan el MISMO webhook URL. AgendaMedPro identifica automáticamente
              a qué doctor pertenece cada mensaje usando el <code className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs">phone_number_id</code>.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-300">
                1
              </div>
              <div>
                <p className="font-semibold text-white">Paciente envía mensaje</p>
                <p className="text-sm text-white/60">
                  "¿Cuándo es mi próxima cita?"
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-300">
                2
              </div>
              <div>
                <p className="font-semibold text-white">Meta envía al webhook</p>
                <p className="text-sm text-white/60">
                  Incluye el <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-xs">phone_number_id</code> del doctor
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-300">
                3
              </div>
              <div>
                <p className="font-semibold text-white">AgendaMedPro identifica al doctor</p>
                <p className="text-sm text-white/60">
                  Busca en la DB: "¿Quién tiene este phone_number_id?"
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-300">
                4
              </div>
              <div>
                <p className="font-semibold text-white">Busca datos del paciente</p>
                <p className="text-sm text-white/60">
                  Citas próximas, historial, etc.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-300">
                5
              </div>
              <div>
                <p className="font-semibold text-white">Claude AI genera respuesta</p>
                <p className="text-sm text-white/60">
                  Respuesta personalizada basada en el contexto
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-300">
                6
              </div>
              <div>
                <p className="font-semibold text-white">Envía respuesta al paciente</p>
                <p className="text-sm text-white/60">
                  Usando el <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-xs">access_token</code> del doctor
                </p>
              </div>
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* Configuración */}
      <GlassPanel className="border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-2xl font-semibold text-white">
          ⚙️ Configuración (solo 3 pasos)
        </h2>

        <div className="space-y-6">
          {/* Paso 1 */}
          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 text-xl font-bold text-purple-300">
                1
              </div>
              <h3 className="text-lg font-semibold text-white">
                Abre Meta Developers Console
              </h3>
            </div>

            <div className="ml-13 space-y-3">
              <p className="text-white/80">
                Ve a{' '}
                <a
                  href="https://developers.facebook.com/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-blue-400 hover:text-blue-300"
                >
                  Facebook Developers
                  <ExternalLink className="h-4 w-4" />
                </a>
              </p>

              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-sm text-white/70">
                  Tu App → WhatsApp → <strong className="text-white">Configuration</strong> → <strong className="text-white">Webhook</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Paso 2 */}
          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 text-xl font-bold text-purple-300">
                2
              </div>
              <h3 className="text-lg font-semibold text-white">
                Configura el Webhook
              </h3>
            </div>

            <div className="ml-13 space-y-4">
              {/* Webhook URL */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/90">
                  Callback URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={webhookUrl}
                    readOnly
                    className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-3 font-mono text-sm text-white"
                  />
                  <button
                    onClick={() => copyToClipboard(webhookUrl, 'url')}
                    className="rounded-xl border border-white/20 bg-white/10 px-4 hover:bg-white/20"
                  >
                    {copied === 'url' ? (
                      <Check className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Copy className="h-5 w-5 text-white/70" />
                    )}
                  </button>
                </div>
              </div>

              {/* Verify Token */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/90">
                  Verify Token
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={verifyToken}
                    readOnly
                    className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-3 font-mono text-sm text-white"
                  />
                  <button
                    onClick={() => copyToClipboard(verifyToken, 'token')}
                    className="rounded-xl border border-white/20 bg-white/10 px-4 hover:bg-white/20"
                  >
                    {copied === 'token' ? (
                      <Check className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Copy className="h-5 w-5 text-white/70" />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-xs text-white/50">
                  Este token es el mismo para todos los usuarios de AgendaMedPro
                </p>
              </div>

              <div className="rounded-xl border border-yellow-400/30 bg-yellow-500/10 p-4">
                <p className="text-sm text-yellow-100">
                  ⚠️ <strong>Importante:</strong> NO cambies estos valores. Son específicos de AgendaMedPro.
                </p>
              </div>
            </div>
          </div>

          {/* Paso 3 */}
          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 text-xl font-bold text-purple-300">
                3
              </div>
              <h3 className="text-lg font-semibold text-white">
                Suscribirse a campos del webhook
              </h3>
            </div>

            <div className="ml-13 space-y-3">
              <p className="text-white/80">
                En la sección <strong className="text-white">Webhook fields</strong>, activa:
              </p>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" checked disabled className="h-4 w-4" />
                    <span className="font-mono text-sm text-white">messages</span>
                    <span className="text-xs text-white/50">(Requerido)</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" checked disabled className="h-4 w-4" />
                    <span className="font-mono text-sm text-white">message_status</span>
                    <span className="text-xs text-white/50">(Opcional)</span>
                  </label>
                </div>
              </div>

              <p className="text-sm text-white/60">
                Esto permite que AgendaMedPro reciba notificaciones cuando llegan mensajes.
              </p>
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* Probar */}
      <GlassPanel className="border-white/10 bg-gradient-to-br from-emerald-500/10 to-blue-500/5 p-6">
        <h2 className="mb-4 text-2xl font-semibold text-white">
          🧪 Probar el Asistente
        </h2>

        <div className="space-y-4">
          <p className="text-white/80">
            Envía un mensaje de WhatsApp a tu número configurado:
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="mb-2 text-sm font-semibold text-white/70">Mensaje de prueba:</p>
              <div className="rounded-lg bg-emerald-500/20 p-3">
                <p className="text-sm text-white">
                  "¿Cuándo es mi próxima cita?"
                </p>
              </div>
              <p className="mt-2 text-xs text-emerald-400">
                → El asistente buscará tus citas y responderá
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="mb-2 text-sm font-semibold text-white/70">Confirmar cita:</p>
              <div className="rounded-lg bg-blue-500/20 p-3">
                <p className="text-sm text-white">
                  "Sí, confirmo"
                </p>
              </div>
              <p className="mt-2 text-xs text-blue-400">
                → Confirmará automáticamente tu cita
              </p>
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* Footer */}
      <div className="flex gap-4">
        <a
          href="/dashboard/settings/whatsapp"
          className="flex-1 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-center font-semibold text-white hover:bg-white/10"
        >
          ← Volver a Ajustes
        </a>
        <a
          href="/dashboard/test-reminders"
          className="flex-1 rounded-xl border border-emerald-400/30 bg-emerald-500/20 px-6 py-3 text-center font-semibold text-white hover:bg-emerald-500/30"
        >
          Probar Recordatorios →
        </a>
      </div>
    </div>
  );
}
