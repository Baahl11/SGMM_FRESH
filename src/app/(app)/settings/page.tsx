'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import EmailSetup from '@/components/email/EmailSetup';  // Import new component
import { 
  Settings, 
  Mail, 
  MessageSquare, 
  Bell, 
  Shield, 
  User, 
  Database,
  ArrowLeft,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface SystemSettings {
  messaging_email: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  whatsapp_notifications: boolean;
  system_email_configured: boolean;
  messaging_system_active: boolean;
  auto_configured?: boolean;
}

export default function SettingsPage() {
  const { userEmail, isAuthenticated } = useAuthContext();
  const router = useRouter();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadSettings();
  }, [isAuthenticated, router]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Intentar cargar configuración de mensajería desde el API
      let messagingConfig = null;
      try {
        const response = await fetch('/api/proxy/messaging/config');
        if (response.ok) {
          messagingConfig = await response.json();
        }
      } catch (error) {
        console.log('No hay configuración de mensajería previa');
      }
      
      const systemSettings: SystemSettings = {
        messaging_email: messagingConfig?.email || userEmail || '',
        notifications_enabled: true,
        email_notifications: true,
        whatsapp_notifications: false,
        system_email_configured: !!messagingConfig?.email,
        messaging_system_active: !!messagingConfig?.email,
        auto_configured: messagingConfig?.auto_configured || false
      };
      
      setSettings(systemSettings);

    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      
      // Guardar configuración de email de mensajería
      const response = await fetch('/api/proxy/messaging/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: settings.messaging_email,
          auto_configured: false // Si lo guardamos manualmente, no es auto-configurado
        })
      });

      if (response.ok) {
        toast.success('Configuración guardada exitosamente');
        loadSettings(); // Recargar para actualizar estado
      } else {
        toast.error('Error al guardar la configuración');
      }
      
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <p className="text-gray-500">Error al cargar la configuración</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/dashboard')}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Settings className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Configuración</h1>
                <p className="text-indigo-100 mt-1">
                  Personaliza la configuración del sistema y mensajería
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Configuración SMTP Ultra-Simple */}
        <EmailSetup userEmail={userEmail || undefined} />

        {/* Configuración de Notificaciones */}
        <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-600" />
              Configuración de Notificaciones
            </CardTitle>
            <CardDescription>
              Controla qué tipo de notificaciones quieres recibir y enviar
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifications-enabled">Notificaciones habilitadas</Label>
                  <p className="text-sm text-gray-500">Activar/desactivar todo el sistema de notificaciones</p>
                </div>
                <Switch
                  id="notifications-enabled"
                  checked={settings.notifications_enabled}
                  onCheckedChange={(checked) => updateSetting('notifications_enabled', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Notificaciones por Email</Label>
                  <p className="text-sm text-gray-500">Enviar recordatorios y facturas por email</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
                  disabled={!settings.notifications_enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="whatsapp-notifications">Notificaciones por WhatsApp</Label>
                  <p className="text-sm text-gray-500">Enviar recordatorios por WhatsApp Business</p>
                </div>
                <Switch
                  id="whatsapp-notifications"
                  checked={settings.whatsapp_notifications}
                  onCheckedChange={(checked) => updateSetting('whatsapp_notifications', checked)}
                  disabled={!settings.notifications_enabled}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accesos Rápidos */}
        <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-green-600" />
              Configuraciones Avanzadas
            </CardTitle>
            <CardDescription>
              Acceso a configuraciones específicas del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="justify-between h-auto p-4"
                onClick={() => router.push('/settings/messaging')}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium">Sistema de Mensajería</p>
                    <p className="text-sm text-gray-500">Email, WhatsApp, templates</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                className="justify-between h-auto p-4"
                onClick={() => router.push('/profile')}
              >
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-purple-600" />
                  <div className="text-left">
                    <p className="font-medium">Mi Perfil</p>
                    <p className="text-sm text-gray-500">Información personal</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                className="justify-between h-auto p-4"
                disabled
              >
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-gray-400" />
                  <div className="text-left">
                    <p className="font-medium text-gray-400">Base de Datos</p>
                    <p className="text-sm text-gray-400">Próximamente</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Button>

              <Button
                variant="outline"
                className="justify-between h-auto p-4"
                disabled
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-gray-400" />
                  <div className="text-left">
                    <p className="font-medium text-gray-400">Seguridad</p>
                    <p className="text-sm text-gray-400">Próximamente</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Información del Sistema */}
        <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-500/10 to-slate-500/10 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-gray-600" />
              Información del Sistema
            </CardTitle>
            <CardDescription>
              Detalles técnicos y estado del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label>Versión del sistema</Label>
                <p className="text-gray-600 mt-1">SGMM v2.0.0 - OAuth Edition</p>
              </div>
              <div>
                <Label>Backend</Label>
                <p className="text-gray-600 mt-1">Rust/Tauri + SQLite</p>
              </div>
              <div>
                <Label>Frontend</Label>
                <p className="text-gray-600 mt-1">Next.js + React + TypeScript</p>
              </div>
              <div>
                <Label>Autenticación</Label>
                <p className="text-gray-600 mt-1">
                  <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
                    Google OAuth 2.0
                  </Badge>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botón de Guardar */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={loadSettings}>
            Restablecer
          </Button>
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Guardando...
              </>
            ) : (
              'Guardar Configuración'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
