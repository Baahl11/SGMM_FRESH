"use client";

import { useState, useEffect } from 'react';
import { MessageSquare, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { GlassPanel } from '@/components/ui/glass-panel';

interface TwilioCredentials {
  account_sid: string;
  auth_token: string;
  phone_number: string;
}

export function TwilioCredentialsSection() {
  const [credentials, setCredentials] = useState<TwilioCredentials>({
    account_sid: '',
    auth_token: '',
    phone_number: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAuthToken, setShowAuthToken] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const response = await fetch('/api/user/sms-credentials');
      if (response.ok) {
        const data = await response.json();
        if (data.credentials) {
          setCredentials({
            account_sid: data.credentials.account_sid || '',
            auth_token: data.credentials.auth_token || '',
            phone_number: data.credentials.phone_number || ''
          });
          setIsConfigured(!!(data.credentials.account_sid && data.credentials.auth_token));
        }
      }
    } catch (error) {
      console.error('Error loading Twilio credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!credentials.account_sid || !credentials.auth_token || !credentials.phone_number) {
      toast.error('Por favor completa todos los campos de Twilio');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/user/sms-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'twilio',
          credentials: credentials
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('✅ Credenciales de Twilio guardadas exitosamente');
        setIsConfigured(true);
      } else {
        toast.error(`❌ Error: ${data.error || 'Error al guardar credenciales'}`);
      }
    } catch (error) {
      toast.error('❌ Error al guardar credenciales de Twilio');
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none';

  if (loading) {
    return (
      <GlassPanel className="flex items-center justify-center border-white/10 bg-white/5 py-10">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-300" />
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="space-y-5 border-white/10 bg-white/5 p-6 text-white">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.35em] text-white/60">
          <MessageSquare className="h-4 w-4 text-emerald-200" />
          Twilio SMS
        </div>
        {isConfigured && (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100">
            <CheckCircle className="h-3.5 w-3.5" /> Configurado
          </span>
        )}
      </div>

      <p className="text-sm text-white/70">
        Activa recordatorios por SMS conectando tu propia cuenta de Twilio. Utilizamos tus credenciales encriptadas y solo se emplean para enviar mensajes automatizados.
      </p>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-4 w-4 text-sky-200" />
          <div>
            <p className="font-semibold text-white">¿Cómo obtener tus credenciales?</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-white/70">
              <li>
                Abre <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="underline">twilio.com</a> y crea una cuenta.
              </li>
              <li>Desde la consola copia tu <strong>Account SID</strong> y <strong>Auth Token</strong>.</li>
              <li>Compra un número y pégalo aquí con formato internacional (ej. +52).</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs uppercase tracking-[0.35em] text-white/60">Account SID *</label>
          <input
            type="text"
            value={credentials.account_sid}
            onChange={(e) => setCredentials((prev) => ({ ...prev, account_sid: e.target.value }))}
            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className={`${inputClass} mt-2`}
          />
          <p className="mt-1 text-xs text-white/60">
            Disponible en <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-emerald-200 underline inline-flex items-center gap-1">Twilio Console <ExternalLink className="h-3 w-3" /></a>
          </p>
        </div>

        <div>
          <label className="text-xs uppercase tracking-[0.35em] text-white/60">Auth Token *</label>
          <div className="relative mt-2">
            <input
              type={showAuthToken ? 'text' : 'password'}
              value={credentials.auth_token}
              onChange={(e) => setCredentials((prev) => ({ ...prev, auth_token: e.target.value }))}
              placeholder="••••••••••••••••••••••••••••••••"
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowAuthToken(!showAuthToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60"
            >
              {showAuthToken ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-white/60">Mantén este token en privado.</p>
        </div>

        <div>
          <label className="text-xs uppercase tracking-[0.35em] text-white/60">Número Twilio *</label>
          <input
            type="tel"
            value={credentials.phone_number}
            onChange={(e) => setCredentials((prev) => ({ ...prev, phone_number: e.target.value }))}
            placeholder="+521234567890"
            className={`${inputClass} mt-2`}
          />
          <p className="mt-1 text-xs text-white/60">Incluye el código de país, ej. +52 para México.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
        <div className="flex items-start gap-2">
          <CheckCircle className="mt-0.5 h-4 w-4" />
          <div>
            <p className="font-semibold">Seguridad</p>
            <p className="text-emerald-50/90">Ciframos tus credenciales y solo se usan para envíos automáticos.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving || !credentials.account_sid || !credentials.auth_token || !credentials.phone_number}
          className="aura-cta aura-cta--primary flex-1 justify-center disabled:opacity-40"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Guardar credenciales
            </>
          )}
        </button>
      </div>
    </GlassPanel>
  );
}
