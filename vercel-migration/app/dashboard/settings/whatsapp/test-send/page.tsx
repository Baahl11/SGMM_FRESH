'use client';

import { useState } from 'react';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppTestSendPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('¡Hola! Este es un mensaje de prueba desde AgendaMedPro 🩺');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSend = async () => {
    if (!phoneNumber) {
      toast.error('Por favor ingresa un número de teléfono');
      return;
    }

    if (!message) {
      toast.error('Por favor escribe un mensaje');
      return;
    }

    try {
      setIsSending(true);
      setResult(null);

      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phoneNumber,
          message: message,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('✅ Mensaje enviado correctamente!');
        setResult({
          success: true,
          message_sid: data.message_sid,
          status: data.status,
        });
      } else {
        toast.error(data.error || 'Error al enviar mensaje');
        setResult({
          success: false,
          error: data.error,
          details: data.details,
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar mensaje');
      setResult({
        success: false,
        error: 'Error de conexión',
      });
    } finally {
      setIsSending(false);
    }
  };

  const inputClass = 'h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/60 focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400/30';

  return (
    <div className="space-y-6 pb-16">
      {/* Hero */}
      <GlassPanel className="border border-emerald-400/20 bg-gradient-to-br from-emerald-500/20 via-indigo-500/10 to-slate-900/60 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-2xl bg-emerald-500/20 p-3">
            <MessageSquare className="h-6 w-6 text-emerald-200" />
          </div>
        </div>
        <h1 className="text-3xl font-semibold text-white md:text-4xl mb-4">
          Probar Envío de WhatsApp con Twilio
        </h1>
        <p className="text-base text-white/80 max-w-3xl">
          Envía mensajes de WhatsApp directamente desde tu sistema a cualquier número configurado en tu Twilio Sandbox.
        </p>
      </GlassPanel>

      {/* Form */}
      <GlassPanel className="border border-white/10 bg-white/5">
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone" className="text-white/90 mb-2">
                Número de WhatsApp del Destinatario
              </Label>
              <Input
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+521234567890"
                className={inputClass}
              />
              <p className="text-xs text-white/60 mt-2">
                Formato: +[código_país][número] (ej: +52 55 1234 5678)
              </p>
            </div>

            <div>
              <Label htmlFor="message" className="text-white/90 mb-2">
                Mensaje
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe tu mensaje aquí..."
                className={`${inputClass} h-32`}
                rows={4}
              />
              <p className="text-xs text-white/60 mt-2">
                {message.length} caracteres
              </p>
            </div>

            <Button
              onClick={handleSend}
              disabled={isSending}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-2xl"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? 'Enviando...' : 'Enviar Mensaje'}
            </Button>
          </div>

          {/* Result */}
          {result && (
            <div className={`rounded-2xl border p-4 ${
              result.success 
                ? 'bg-emerald-500/10 border-emerald-400/30' 
                : 'bg-red-500/10 border-red-400/30'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
                <h3 className="font-semibold text-white">
                  {result.success ? 'Mensaje Enviado' : 'Error al Enviar'}
                </h3>
              </div>
              
              {result.success ? (
                <div className="space-y-2 text-sm text-white/80">
                  <p><strong>Message SID:</strong> {result.message_sid}</p>
                  <p><strong>Estado:</strong> {result.status}</p>
                  <p className="text-xs text-white/60 mt-3">
                    ✅ El mensaje ha sido enviado a Twilio. Revisa tu WhatsApp en el número configurado.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 text-sm text-white/80">
                  <p><strong>Error:</strong> {result.error}</p>
                  {result.details && (
                    <pre className="text-xs bg-white/5 p-2 rounded overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </GlassPanel>

      {/* Instructions */}
      <GlassPanel className="border border-blue-400/20 bg-gradient-to-br from-blue-500/10 to-transparent">
        <div className="p-6 space-y-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            📝 Instrucciones de Prueba
          </h3>
          
          <div className="space-y-3 text-sm text-white/80">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <h4 className="font-semibold text-white mb-2">1. Configurar Twilio Sandbox (Primera vez)</h4>
              <p>Si es tu primera vez, necesitas activar el Sandbox de Twilio:</p>
              <ul className="list-disc list-inside space-y-1 mt-2 text-white/70">
                <li>Ve a tu <a href="https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn" target="_blank" className="text-emerald-400 hover:underline">Twilio Console → Try WhatsApp</a></li>
                <li>Escanea el código QR con WhatsApp</li>
                <li>Envía el código de activación que te piden (ej: "join [palabra-secreta]")</li>
                <li>Tu número quedará registrado en el Sandbox por 24 horas</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <h4 className="font-semibold text-white mb-2">2. Enviar Mensaje de Prueba</h4>
              <p>Una vez configurado el Sandbox:</p>
              <ul className="list-disc list-inside space-y-1 mt-2 text-white/70">
                <li>Ingresa TU número de WhatsApp en el campo de arriba</li>
                <li>Escribe un mensaje de prueba</li>
                <li>Haz clic en "Enviar Mensaje"</li>
                <li>Deberías recibir el mensaje en tu WhatsApp en segundos</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-yellow-500/10 border border-yellow-400/20 p-4">
              <h4 className="font-semibold text-white mb-2">⚠️ Importante</h4>
              <ul className="list-disc list-inside space-y-1 text-white/70">
                <li><strong>Sandbox:</strong> Solo puedes enviar a números registrados en el Sandbox</li>
                <li><strong>Producción:</strong> Para enviar a cualquier número, necesitas un número de WhatsApp Business aprobado</li>
                <li><strong>Costo:</strong> En Sandbox es gratis. En producción ~$0.005 por mensaje</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/20 p-4">
              <h4 className="font-semibold text-white mb-2">✅ Siguiente Paso</h4>
              <p>Si la prueba funciona, el siguiente paso es integrar el envío automático en:</p>
              <ul className="list-disc list-inside space-y-1 mt-2 text-white/70">
                <li>Recordatorios de citas (24h antes)</li>
                <li>Confirmaciones de citas</li>
                <li>Notificaciones de cambios</li>
              </ul>
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
