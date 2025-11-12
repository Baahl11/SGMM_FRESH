"use client";

import { useState, useEffect } from 'react';
import { MessageSquare, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

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

  if (loading) {
    return (
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-teal-600" />
        <h3 className="text-lg font-semibold text-gray-900">Credenciales de Twilio SMS</h3>
        {isConfigured && (
          <span className="ml-auto flex items-center gap-1 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            Configurado
          </span>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Configura tus credenciales de Twilio para enviar recordatorios por SMS a tus pacientes
      </p>

      {/* Info Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">¿Cómo obtener tus credenciales de Twilio?</p>
          <ol className="list-decimal list-inside space-y-1 text-blue-800">
            <li>Crea una cuenta en <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">twilio.com</a></li>
            <li>Ve a la consola y copia tu <strong>Account SID</strong> y <strong>Auth Token</strong></li>
            <li>Compra un número de teléfono en Twilio para enviar SMS</li>
            <li>Pega las credenciales aquí y guarda</li>
          </ol>
        </div>
      </div>

      <div className="space-y-4">
        {/* Account SID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account SID *
          </label>
          <input
            type="text"
            value={credentials.account_sid}
            onChange={(e) => setCredentials(prev => ({ ...prev, account_sid: e.target.value }))}
            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
          <p className="text-xs text-gray-600 mt-1">
            Encuentra tu Account SID en el{' '}
            <a 
              href="https://console.twilio.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-teal-600 hover:underline inline-flex items-center gap-1"
            >
              Twilio Console
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>

        {/* Auth Token */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Auth Token *
          </label>
          <div className="relative">
            <input
              type={showAuthToken ? 'text' : 'password'}
              value={credentials.auth_token}
              onChange={(e) => setCredentials(prev => ({ ...prev, auth_token: e.target.value }))}
              placeholder="••••••••••••••••••••••••••••••••"
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            <button
              type="button"
              onClick={() => setShowAuthToken(!showAuthToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showAuthToken ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Tu Auth Token secreto - mantenerlo privado
          </p>
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número de Teléfono Twilio *
          </label>
          <input
            type="tel"
            value={credentials.phone_number}
            onChange={(e) => setCredentials(prev => ({ ...prev, phone_number: e.target.value }))}
            placeholder="+1234567890"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
          <p className="text-xs text-gray-600 mt-1">
            El número desde el cual se enviarán los SMS (debe incluir código de país, ej: +52 para México)
          </p>
        </div>

        {/* Security Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-900">
              <p className="font-medium mb-1">🔒 Seguridad</p>
              <p className="text-green-800">
                Tus credenciales se almacenan de forma segura y encriptada en la base de datos.
                Solo tú tienes acceso a esta información.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving || !credentials.account_sid || !credentials.auth_token || !credentials.phone_number}
            className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Guardar Credenciales de Twilio
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
