'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Save, ExternalLink, CheckCircle, HelpCircle, Sparkles, Settings, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface WhatsAppSettings {
  whatsapp_phone: string;
  whatsapp_enabled: boolean;
  whatsapp_default_message: string;
  whatsapp_config_level: 'basic' | 'intermediate' | 'advanced';
}

export default function WhatsAppConfigPage() {
  const [settings, setSettings] = useState<WhatsAppSettings>({
    whatsapp_phone: '',
    whatsapp_enabled: false,
    whatsapp_default_message: '¡Hola! Me contacto desde AgendaMedPro',
    whatsapp_config_level: 'basic',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user/whatsapp-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBasic = async () => {
    if (!settings.whatsapp_phone.trim()) {
      toast.error('Por favor ingresa tu número de WhatsApp');
      return;
    }

    const cleanPhone = settings.whatsapp_phone.replace(/\s+/g, '');
    if (!/^\+\d{10,15}$/.test(cleanPhone)) {
      toast.error('Formato inválido. Debe incluir código de país (ej: +52 55 1234 5678)');
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch('/api/user/whatsapp-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          whatsapp_enabled: true,
          whatsapp_config_level: 'basic',
        }),
      });

      if (response.ok) {
        toast.success('✅ Configuración guardada correctamente');
        loadSettings();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Error al guardar configuración');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestWhatsApp = () => {
    const cleanPhone = settings.whatsapp_phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(settings.whatsapp_default_message || '¡Hola! Me contacto desde AgendaMedPro');
    const url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(url, '_blank');
    toast.success('Se abrió WhatsApp en una nueva pestaña');
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

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Configuración de WhatsApp</h1>
          <p className="text-gray-600">Elige el método que mejor se adapte a tus necesidades</p>
        </div>
      </div>

      <Tabs defaultValue={settings.whatsapp_config_level || 'basic'} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">
            <Zap className="h-4 w-4 mr-2" />
            Básico
          </TabsTrigger>
          <TabsTrigger value="intermediate">
            <Sparkles className="h-4 w-4 mr-2" />
            Intermedio
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Settings className="h-4 w-4 mr-2" />
            Avanzado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      WhatsApp Link Directo
                      <Badge className="bg-green-600">RECOMENDADO</Badge>
                    </CardTitle>
                    <CardDescription>
                      La forma más simple - Sin API ni configuraciones complejas
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Ventajas
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>✅ Sin configuración técnica</li>
                    <li>✅ Funciona inmediatamente</li>
                    <li>✅ Gratis para siempre</li>
                    <li>✅ Los pacientes te escriben directamente</li>
                    <li>✅ Sin límite de mensajes</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold mb-3">📋 Cómo Funciona:</h3>
                  <ol className="space-y-1 text-sm text-gray-700">
                    <li>1. Guardas tu número aquí</li>
                    <li>2. Los recordatorios incluyen botón de WhatsApp</li>
                    <li>3. Pacientes hacen clic</li>
                    <li>4. WhatsApp se abre automáticamente</li>
                    <li>5. Recibes el mensaje directo</li>
                  </ol>
                </div>
              </div>

              <div className="space-y-4 bg-white p-6 rounded-lg border">
                <div>
                  <Label htmlFor="phone">Tu Número de WhatsApp *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+52 55 1234 5678"
                    value={settings.whatsapp_phone}
                    onChange={(e) => setSettings({ ...settings, whatsapp_phone: e.target.value })}
                    className="text-lg mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Incluye código de país (ej: +52 para México, +1 para USA)
                  </p>
                </div>

                <div>
                  <Label htmlFor="message">Mensaje Predeterminado (Opcional)</Label>
                  <Textarea
                    id="message"
                    placeholder="¡Hola! Me contacto desde AgendaMedPro"
                    value={settings.whatsapp_default_message}
                    onChange={(e) => setSettings({ ...settings, whatsapp_default_message: e.target.value })}
                    rows={3}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Este mensaje aparecerá pre-escrito cuando tus pacientes te contacten
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={handleSaveBasic} 
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Guardando...' : 'Guardar Configuración'}
                  </Button>
                  <Button 
                    onClick={handleTestWhatsApp} 
                    variant="outline"
                    disabled={!settings.whatsapp_phone}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Probar Link
                  </Button>
                </div>
              </div>

              {settings.whatsapp_phone && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border">
                  <h3 className="font-semibold mb-3">👁️ Vista Previa:</h3>
                  <p className="text-sm text-gray-600 mb-3">Así verán tus pacientes el botón:</p>
                  <div className="bg-white p-4 rounded-lg border inline-block">
                    <Button className="bg-green-600 hover:bg-green-700">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contactar por WhatsApp
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intermediate" className="space-y-4">
          <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-600 rounded-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle>WhatsApp Business API</CardTitle>
                  <CardDescription>
                    Mensajes automáticos con asistente guiado
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="font-semibold mb-3">🚀 Próximamente</h3>
                <p className="text-sm text-gray-700 mb-4">
                  Estamos desarrollando un asistente paso a paso para configurar WhatsApp Business API.
                  Por ahora, puedes usar el nivel Básico (gratis) o Avanzado (manual).
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle>Configuración Manual de API</CardTitle>
                  <CardDescription>
                    Para usuarios técnicos
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-white p-6 rounded-lg border">
                <p className="text-sm text-gray-600 mb-4">
                  Si ya tienes credenciales de WhatsApp Business API, puedes configurarlas manualmente.
                </p>
                <Button variant="outline" asChild>
                  <a href="/dashboard/settings/whatsapp-api">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ir a Configuración Avanzada
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
