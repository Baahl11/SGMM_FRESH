'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  AlertCircle, 
  HelpCircle,
  ExternalLink,
  Send,
  Shield,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface SMTPConfig {
  id?: number;
  email: string;
  smtp_host: string;
  smtp_port: number;
  use_tls: boolean;
  from_name: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface EmailSetupProps {
  userEmail?: string;
}

export default function EmailSetup({ userEmail }: EmailSetupProps) {
  const [config, setConfig] = useState<SMTPConfig | null>(null);
  const [formData, setFormData] = useState({
    email: userEmail || '',
    app_password: '',
    from_name: 'Consultorio Médico'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/smtp/config');
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setConfig(data);
          setFormData({
            email: data.email,
            app_password: '', // No mostrar contraseña existente
            from_name: data.from_name
          });
        }
      }
    } catch (error) {
      console.error('Error cargando configuración SMTP:', error);
    } finally {
      setLoading(false);
    }
  };

  const detectEmailProvider = (email: string) => {
    const domain = email.split('@')[1]?.toLowerCase();
    switch (domain) {
      case 'gmail.com':
        return {
          name: 'Gmail',
          icon: '📧',
          helpUrl: 'https://support.google.com/accounts/answer/185833',
          steps: [
            '1. Ve a tu cuenta de Google',
            '2. Selecciona "Seguridad"',
            '3. En "Iniciar sesión en Google", selecciona "Contraseñas de aplicaciones"',
            '4. Genera una contraseña para "Correo"',
            '5. Usa esa contraseña de 16 caracteres aquí'
          ]
        };
      case 'outlook.com':
      case 'hotmail.com':
      case 'live.com':
        return {
          name: 'Outlook/Hotmail',
          icon: '🔷',
          helpUrl: 'https://support.microsoft.com/account-billing/using-app-passwords-with-apps-that-don-t-support-two-step-verification',
          steps: [
            '1. Ve a la configuración de seguridad de Microsoft',
            '2. Selecciona "Opciones de seguridad avanzadas"',
            '3. Bajo "Contraseñas de aplicación", selecciona "Crear nueva contraseña de aplicación"',
            '4. Elige "Correo" como aplicación',
            '5. Usa la contraseña generada aquí'
          ]
        };
      case 'yahoo.com':
      case 'yahoo.es':
        return {
          name: 'Yahoo',
          icon: '🟣',
          helpUrl: 'https://help.yahoo.com/kb/generate-manage-third-party-passwords-sln15241.html',
          steps: [
            '1. Ve a la información de tu cuenta de Yahoo',
            '2. Selecciona "Seguridad de la cuenta"',
            '3. Junto a "Contraseñas de aplicación", selecciona "Generar contraseña"',
            '4. Ingresa el nombre de la aplicación',
            '5. Usa la contraseña generada aquí'
          ]
        };
      default:
        return {
          name: 'Otro proveedor',
          icon: '📮',
          helpUrl: '#',
          steps: [
            '1. Busca "contraseña de aplicación" en tu proveedor de email',
            '2. Activa la autenticación de dos factores si es necesario',
            '3. Genera una contraseña específica para aplicaciones',
            '4. Usa esa contraseña aquí (no tu contraseña normal)'
          ]
        };
    }
  };

  const provider = formData.email ? detectEmailProvider(formData.email) : null;

  const handleSave = async () => {
    if (!formData.email || !formData.app_password) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    if (!formData.email.includes('@')) {
      toast.error('Por favor ingresa un email válido');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/smtp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          app_password: formData.app_password,
          from_name: formData.from_name || 'Consultorio Médico'
        })
      });

      if (response.ok) {
        const savedConfig = await response.json();
        setConfig(savedConfig);
        toast.success('✅ Configuración SMTP guardada exitosamente');
        
        // Limpiar contraseña del formulario por seguridad
        setFormData(prev => ({ ...prev, app_password: '' }));
      } else {
        const error = await response.text();
        toast.error(`Error guardando configuración: ${error}`);
      }
    } catch (error) {
      console.error('Error guardando configuración SMTP:', error);
      toast.error('Error guardando configuración SMTP');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!formData.email || !formData.app_password) {
      toast.error('Necesitas email y contraseña para probar');
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);
      
      const response = await fetch('/api/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          app_password: formData.app_password
        })
      });

      if (response.ok) {
        const result = await response.json();
        setTestResult(result);
        
        if (result.success) {
          toast.success('✅ Configuración SMTP probada exitosamente');
        } else {
          toast.error(`❌ Error en test SMTP: ${result.error || 'Error desconocido'}`);
        }
      } else {
        toast.error('Error realizando test SMTP');
      }
    } catch (error) {
      console.error('Error probando SMTP:', error);
      toast.error('Error probando configuración SMTP');
    } finally {
      setTesting(false);
    }
  };

  const sendTestEmail = async () => {
    if (!config || !config.is_active) {
      toast.error('Primero guarda y activa la configuración SMTP');
      return;
    }

    try {
      setTesting(true);
      const response = await fetch('/api/smtp/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email: formData.email,
          subject: '🧪 Test Email - Sistema SGMM',
          message: 'Este es un email de prueba para verificar que la configuración SMTP está funcionando correctamente.\n\n¡Si recibes este mensaje, todo está configurado perfectamente!\n\nSaludos,\nSistema SGMM'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success('📧 Email de prueba enviado! Revisa tu bandeja de entrada');
        } else {
          toast.error(`❌ Error enviando email: ${result.error || 'Error desconocido'}`);
        }
      } else {
        toast.error('Error enviando email de prueba');
      }
    } catch (error) {
      console.error('Error enviando email de prueba:', error);
      toast.error('Error enviando email de prueba');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          Configuración de Email SMTP
          {config?.is_active && (
            <Badge variant="default" className="ml-2">
              ✅ Activo
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Configura tu email personal para enviar facturas y recordatorios automáticamente
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Estado actual */}
        {config && (
          <Alert className="border-green-200 bg-green-50">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Configuración activa:</strong> {config.email} desde {config.from_name}
              <br />
              <span className="text-sm">Última actualización: {new Date(config.updated_at || '').toLocaleString()}</span>
            </AlertDescription>
          </Alert>
        )}

        {/* Formulario de configuración */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email del consultorio *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="doctor@gmail.com"
                className="mt-1"
              />
              {provider && (
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                  {provider.icon} Detectado: {provider.name}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="app_password">Contraseña de aplicación *</Label>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-auto p-1">
                      <HelpCircle className="h-4 w-4 text-blue-500" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>¿Cómo generar contraseña de aplicación?</DialogTitle>
                      <DialogDescription>
                        {provider && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{provider.icon}</span>
                              <strong>{provider.name}</strong>
                            </div>
                            <div className="text-sm space-y-2">
                              {provider.steps.map((step, index) => (
                                <div key={index} className="flex items-start gap-2">
                                  <span className="text-blue-500 font-semibold">{step.split('.')[0]}.</span>
                                  <span>{step.split('.').slice(1).join('.').trim()}</span>
                                </div>
                              ))}
                            </div>
                            {provider.helpUrl !== '#' && (
                              <Button asChild variant="outline" size="sm" className="w-full">
                                <a href={provider.helpUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Guía oficial de {provider.name}
                                </a>
                              </Button>
                            )}
                          </div>
                        )}
                      </DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="relative">
                <Input
                  id="app_password"
                  type={showPassword ? "text" : "password"}
                  value={formData.app_password}
                  onChange={(e) => setFormData(prev => ({ ...prev, app_password: e.target.value }))}
                  placeholder="xxxx-xxxx-xxxx-xxxx"
                  className="mt-1 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                ⚠️ Nunca uses tu contraseña normal. Genera una contraseña específica para aplicaciones.
              </p>
            </div>

            <div>
              <Label htmlFor="from_name">Nombre del remitente</Label>
              <Input
                id="from_name"
                value={formData.from_name}
                onChange={(e) => setFormData(prev => ({ ...prev, from_name: e.target.value }))}
                placeholder="Consultorio Dental Dr. García"
                className="mt-1"
              />
            </div>
          </div>

          <div className="space-y-4">
            {/* Test de conexión */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-3">🧪 Probar configuración</h4>
              <div className="space-y-3">
                <Button
                  onClick={handleTest}
                  disabled={testing || !formData.email || !formData.app_password}
                  variant="outline"
                  className="w-full"
                >
                  {testing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
                      Probando...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Probar conexión SMTP
                    </>
                  )}
                </Button>

                {testResult && (
                  <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    {testResult.success ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                      {testResult.success ? "✅ Conexión SMTP exitosa" : `❌ Error: ${testResult.error}`}
                    </AlertDescription>
                  </Alert>
                )}

                {config?.is_active && (
                  <Button
                    onClick={sendTestEmail}
                    disabled={testing}
                    variant="default"
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {testing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar email de prueba
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Información del sistema */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">⚡ ¿Qué podrás hacer?</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Enviar facturas automáticamente por email</li>
                <li>• Recordatorios de citas (24h y 2h antes)</li>
                <li>• Campañas promocionales</li>
                <li>• Notificaciones del sistema</li>
                <li>• <strong>100% gratuito</strong> (sin SendGrid)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={loadCurrentConfig}
            disabled={loading}
          >
            🔄 Recargar
          </Button>
          
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saving || !formData.email || !formData.app_password}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Guardar y Activar
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
