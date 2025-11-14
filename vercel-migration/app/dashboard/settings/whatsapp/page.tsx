'use client';

/**
 * WhatsApp Business Configuration Page (Migrated to Dashboard Settings)
 * BYOK (Bring Your Own Keys) Model
 */

import { useState, useEffect } from 'react';
import { MessageSquare, Save, TestTube, ExternalLink, CheckCircle, XCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/messaging/config');
      const data = await response.json();

      if (response.ok) {
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
      toast.error('Error al cargar configuración');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Configuración de WhatsApp Business</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configura tu cuenta de WhatsApp Business para enviar recordatorios automáticos a tus pacientes
        </p>
      </div>

      {/* Setup Guide */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">¿Primera vez configurando WhatsApp?</CardTitle>
              <CardDescription>Sigue estos pasos para conectar tu cuenta de WhatsApp Business</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <Card className="border-2 border-blue-200 bg-white hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-lg shadow-md">
                    1
                  </div>
                  <CardTitle className="text-base">Crear Cuenta</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Crea una cuenta en Facebook Business Manager
                </p>
                <Button variant="outline" size="sm" className="w-full border-blue-300 text-blue-600 hover:bg-blue-50" asChild>
                  <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer">
                    Ir a Facebook <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="border-2 border-indigo-200 bg-white hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-bold text-lg shadow-md">
                    2
                  </div>
                  <CardTitle className="text-base">Configurar WhatsApp</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Configura WhatsApp Business en el administrador de Meta
                </p>
                <div className="h-8 flex items-center">
                  <span className="text-xs text-indigo-600 font-medium">📱 En Business Manager</span>
                </div>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="border-2 border-purple-200 bg-white hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white font-bold text-lg shadow-md">
                    3
                  </div>
                  <CardTitle className="text-base">Generar Token</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Crea un usuario del sistema y genera un token permanente
                </p>
                <div className="h-8 flex items-center">
                  <span className="text-xs text-purple-600 font-medium">🔑 Token de acceso</span>
                </div>
              </CardContent>
            </Card>

            {/* Step 4 */}
            <Card className="border-2 border-green-200 bg-white hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white font-bold text-lg shadow-md">
                    4
                  </div>
                  <CardTitle className="text-base">Pegar Credenciales</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Copia tus credenciales en el formulario de abajo
                </p>
                <div className="h-8 flex items-center">
                  <span className="text-xs text-green-600 font-medium">✅ ¡Listo para usar!</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Help Button */}
          <div className="mt-6 flex justify-center">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg" asChild>
              <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" target="_blank" rel="noopener noreferrer">
                📖 Ver guía completa paso a paso <ExternalLink className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      {config.last_connection_test && (
        <Alert variant={config.connection_status === 'connected' ? 'default' : 'destructive'}>
          {config.connection_status === 'connected' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {config.connection_status === 'connected' ? '✅ Conectado' : '❌ Error de conexión'}
          </AlertTitle>
          <AlertDescription>
            Última prueba: {new Date(config.last_connection_test).toLocaleString('es-MX')}
          </AlertDescription>
        </Alert>
      )}

      {/* WhatsApp Credentials Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Credenciales de WhatsApp Business API
          </CardTitle>
          <CardDescription>
            Configura las credenciales obtenidas desde Meta Business Manager
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Business Account ID */}
          <div className="space-y-2">
            <Label htmlFor="business_id">WhatsApp Business Account ID</Label>
            <Input
              id="business_id"
              placeholder="123456789012345"
              value={config.whatsapp_business_id || ''}
              onChange={(e) => updateConfig('whatsapp_business_id', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Encuentralo en: Business Manager → WhatsApp → Configuración
            </p>
          </div>

          {/* Phone Number ID */}
          <div className="space-y-2">
            <Label htmlFor="phone_id">Phone Number ID</Label>
            <Input
              id="phone_id"
              placeholder="987654321098765"
              value={config.whatsapp_phone_number_id || ''}
              onChange={(e) => updateConfig('whatsapp_phone_number_id', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              ID único de tu número de teléfono en WhatsApp Manager
            </p>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone_number">Número de WhatsApp (con código de país)</Label>
            <Input
              id="phone_number"
              placeholder="+5215512345678"
              value={config.whatsapp_phone_number || ''}
              onChange={(e) => updateConfig('whatsapp_phone_number', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Formato: +52 (México) seguido de 10 dígitos sin espacios
            </p>
          </div>

          {/* Access Token */}
          <div className="space-y-2">
            <Label htmlFor="access_token">Access Token (Permanente)</Label>
            <div className="relative">
              <Input
                id="access_token"
                type={showToken ? 'text' : 'password'}
                placeholder="EAAxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={config.whatsapp_access_token || ''}
                onChange={(e) => updateConfig('whatsapp_access_token', e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Genera un token permanente para un usuario del sistema en Business Manager
            </p>
          </div>

          {/* Test Connection Button */}
          <Button
            onClick={handleTestConnection}
            disabled={isTesting || !config.whatsapp_business_id || !config.whatsapp_phone_number_id || !config.whatsapp_access_token}
            variant="outline"
            className="w-full"
          >
            <TestTube className="mr-2 h-4 w-4" />
            {isTesting ? 'Probando conexión...' : 'Probar Conexión'}
          </Button>
        </CardContent>
      </Card>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Mensajería</CardTitle>
          <CardDescription>
            Activa y configura los recordatorios automáticos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable WhatsApp */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Habilitar WhatsApp</Label>
              <p className="text-sm text-muted-foreground">
                Activa el envío de mensajes por WhatsApp
              </p>
            </div>
            <Switch
              checked={config.whatsapp_enabled}
              onCheckedChange={(checked) => updateConfig('whatsapp_enabled', checked)}
              disabled={config.connection_status !== 'connected'}
            />
          </div>

          {/* Auto Reminders */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Recordatorios Automáticos</Label>
              <p className="text-sm text-muted-foreground">
                Envía recordatorios automáticos a pacientes con citas próximas
              </p>
            </div>
            <Switch
              checked={config.auto_reminders_enabled}
              onCheckedChange={(checked) => updateConfig('auto_reminders_enabled', checked)}
              disabled={!config.whatsapp_enabled}
            />
          </div>

          {/* Reminder 24h */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Recordatorio 24 horas antes</Label>
              <p className="text-sm text-muted-foreground">
                Envía recordatorio un día antes de la cita
              </p>
            </div>
            <Switch
              checked={config.reminder_24h_enabled}
              onCheckedChange={(checked) => updateConfig('reminder_24h_enabled', checked)}
              disabled={!config.auto_reminders_enabled}
            />
          </div>

          {/* Reminder 1h */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Recordatorio 1 hora antes</Label>
              <p className="text-sm text-muted-foreground">
                Envía recordatorio una hora antes de la cita
              </p>
            </div>
            <Switch
              checked={config.reminder_1h_enabled}
              onCheckedChange={(checked) => updateConfig('reminder_1h_enabled', checked)}
              disabled={!config.auto_reminders_enabled}
            />
          </div>

          {/* Daily Limit */}
          <div className="space-y-2">
            <Label htmlFor="daily_limit">Límite diario de mensajes</Label>
            <Input
              id="daily_limit"
              type="number"
              min="1"
              max="10000"
              value={config.daily_message_limit}
              onChange={(e) => updateConfig('daily_message_limit', parseInt(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Mensajes usados hoy: {config.current_daily_usage} / {config.daily_message_limit}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Personalization Card */}
      <Card>
        <CardHeader>
          <CardTitle>Personalización de Mensajes</CardTitle>
          <CardDescription>
            Configura la información que aparecerá en los mensajes automáticos a tus pacientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Doctor Name */}
          <div className="space-y-2">
            <Label htmlFor="doctor_name">Nombre del Doctor</Label>
            <Input
              id="doctor_name"
              placeholder="Dr. Juan Pérez"
              value={config.doctor_name || ''}
              onChange={(e) => updateConfig('doctor_name', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Se mostrará en los mensajes como: "Saludos de Dr. Juan Pérez"
            </p>
          </div>

          {/* Clinic Name */}
          <div className="space-y-2">
            <Label htmlFor="clinic_name">Nombre de la Clínica/Consultorio</Label>
            <Input
              id="clinic_name"
              placeholder="Clínica Dental Sonrisas"
              value={config.clinic_name || ''}
              onChange={(e) => updateConfig('clinic_name', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Nombre de tu clínica o consultorio médico
            </p>
          </div>

          {/* Clinic Address */}
          <div className="space-y-2">
            <Label htmlFor="clinic_address">Dirección</Label>
            <Input
              id="clinic_address"
              placeholder="Av. Reforma 123, Col. Centro, CDMX"
              value={config.clinic_address || ''}
              onChange={(e) => updateConfig('clinic_address', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Dirección completa para que tus pacientes sepan dónde acudir
            </p>
          </div>

          {/* Clinic Phone */}
          <div className="space-y-2">
            <Label htmlFor="clinic_phone">Teléfono de Contacto</Label>
            <Input
              id="clinic_phone"
              placeholder="55 1234 5678"
              value={config.clinic_phone || ''}
              onChange={(e) => updateConfig('clinic_phone', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Número de teléfono para que los pacientes puedan comunicarse
            </p>
          </div>

          {/* Custom Signature */}
          <div className="space-y-2">
            <Label htmlFor="custom_signature">Firma Personalizada (Opcional)</Label>
            <Input
              id="custom_signature"
              placeholder="Equipo Médico Integral"
              value={config.custom_message_signature || ''}
              onChange={(e) => updateConfig('custom_message_signature', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Firma opcional que aparecerá al final de cada mensaje
            </p>
          </div>

          {/* Preview Box */}
          <div className="mt-6 p-4 bg-muted rounded-lg space-y-2">
            <p className="text-sm font-medium">Vista Previa del Mensaje:</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Hola [Nombre del Paciente],</p>
              <p>Te recordamos tu cita médica mañana [Fecha] a las [Hora].</p>
              {config.clinic_address && (
                <p>📍 Dirección: {config.clinic_address}</p>
              )}
              {config.clinic_phone && (
                <p>📞 Teléfono: {config.clinic_phone}</p>
              )}
              <p className="mt-2">Si necesitas cancelar o reprogramar, contáctanos.</p>
              <p className="mt-2">
                Saludos,
                {config.doctor_name && <><br />{config.doctor_name}</>}
                {config.clinic_name && <><br />{config.clinic_name}</>}
                {config.custom_message_signature && <><br /><em>{config.custom_message_signature}</em></>}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </div>
    </div>
  );
}
