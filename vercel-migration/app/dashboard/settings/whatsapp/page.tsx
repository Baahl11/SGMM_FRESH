'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Save, ExternalLink, CheckCircle, Sparkles, Settings, Zap, Phone, Globe, Code2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlassPanel } from '@/components/ui/glass-panel';

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

  const inputClass = 'h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/60 focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400/30';

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
    <div className="space-y-6 pb-16">
      {/* Hero Section */}
      <GlassPanel className="relative overflow-hidden border border-white/10 bg-gradient-to-br from-emerald-500/20 via-indigo-500/10 to-slate-900/60 p-6 md:p-8">
        <div className="mb-6 flex items-center gap-3 text-white/80">
          <div className="rounded-2xl bg-white/10 p-3">
            <MessageSquare className="h-6 w-6" />
          </div>
          <span className="text-sm uppercase tracking-[0.3em] text-white/60">WhatsApp Business</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-white md:text-4xl mb-4">
              Conecta WhatsApp con tu Consultorio
            </h1>
            <p className="text-base text-white/80 max-w-3xl">
              Elige el método perfecto para tu consultorio. Desde links directos gratuitos hasta integraciones automáticas completas.
            </p>
          </div>
          {settings.whatsapp_enabled && settings.whatsapp_phone && (
            <a
              href="/dashboard/settings/whatsapp/test"
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-400/30 text-yellow-100 text-sm font-medium transition-all"
            >
              <Sparkles className="h-4 w-4" />
              Probar WhatsApp
            </a>
          )}
        </div>
      </GlassPanel>

      <Tabs defaultValue={settings.whatsapp_config_level || 'basic'} className="space-y-6">
        <div className="flex items-center justify-center">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 bg-white/5 border border-white/10 p-1">
            <TabsTrigger value="basic" className="data-[state=active]:bg-emerald-500/20">
              <Zap className="h-4 w-4 mr-2" />
              Básico
            </TabsTrigger>
            <TabsTrigger value="intermediate" className="data-[state=active]:bg-yellow-500/20">
              <Sparkles className="h-4 w-4 mr-2" />
              Intermedio
            </TabsTrigger>
            <TabsTrigger value="advanced" className="data-[state=active]:bg-purple-500/20">
              <Settings className="h-4 w-4 mr-2" />
              Avanzado
            </TabsTrigger>
          </TabsList>
        </div>

        {/* NIVEL 1: BÁSICO */}
        <TabsContent value="basic" className="space-y-6">
          <GlassPanel className="border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 to-transparent">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-emerald-500/20 p-3">
                    <Phone className="h-8 w-8 text-emerald-200" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-2xl font-semibold text-white">WhatsApp Link Directo</h2>
                      <Badge className="bg-emerald-500/30 text-emerald-100 border-emerald-400/30">
                        RECOMENDADO
                      </Badge>
                    </div>
                    <p className="text-white/70">La forma más simple - Sin API ni configuraciones complejas</p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                    Ventajas
                  </h3>
                  <ul className="space-y-2 text-sm text-white/80">
                    <li>✅ Sin configuración técnica</li>
                    <li>✅ Funciona inmediatamente</li>
                    <li>✅ Gratis para siempre</li>
                    <li>✅ Los pacientes te escriben directamente</li>
                    <li>✅ Sin límite de mensajes</li>
                  </ul>
                </div>

                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/20 p-5">
                  <h3 className="font-semibold text-white mb-3">📋 Cómo Funciona:</h3>
                  <ol className="space-y-1 text-sm text-white/80">
                    <li>1. Guardas tu número aquí</li>
                    <li>2. Los recordatorios incluyen botón de WhatsApp</li>
                    <li>3. Pacientes hacen clic</li>
                    <li>4. WhatsApp se abre automáticamente</li>
                    <li>5. Recibes el mensaje directo</li>
                  </ol>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl bg-white/5 border border-white/10 p-6">
                <div>
                  <Label htmlFor="phone" className="text-white">Tu Número de WhatsApp *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+52 55 1234 5678"
                    value={settings.whatsapp_phone}
                    onChange={(e) => setSettings({ ...settings, whatsapp_phone: e.target.value })}
                    className={inputClass}
                  />
                  <p className="text-xs text-white/60 mt-2">
                    Incluye código de país (ej: +52 para México, +1 para USA)
                  </p>
                </div>

                <div>
                  <Label htmlFor="message" className="text-white">Mensaje Predeterminado (Opcional)</Label>
                  <Textarea
                    id="message"
                    placeholder="¡Hola! Me contacto desde AgendaMedPro"
                    value={settings.whatsapp_default_message}
                    onChange={(e) => setSettings({ ...settings, whatsapp_default_message: e.target.value })}
                    rows={3}
                    className={inputClass + ' resize-none'}
                  />
                  <p className="text-xs text-white/60 mt-2">
                    Este mensaje aparecerá pre-escrito cuando tus pacientes te contacten
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button 
                    onClick={handleSaveBasic} 
                    disabled={isSaving}
                    className="aura-cta"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Guardando...' : 'Guardar Configuración'}
                  </Button>
                  <Button 
                    onClick={handleTestWhatsApp} 
                    variant="ghost"
                    disabled={!settings.whatsapp_phone}
                    className="rounded-2xl border border-white/20 bg-white/5 text-white hover:bg-white/10"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Probar Link
                  </Button>
                </div>
              </div>

              {settings.whatsapp_phone && (
                <div className="rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-400/20 p-6">
                  <h3 className="font-semibold text-white mb-3">👁️ Vista Previa:</h3>
                  <p className="text-sm text-white/70 mb-4">Así verán tus pacientes el botón en los recordatorios:</p>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contactar por WhatsApp
                  </Button>
                </div>
              )}
            </div>
          </GlassPanel>
        </TabsContent>

        {/* NIVEL 2: INTERMEDIO */}
        <TabsContent value="intermediate" className="space-y-6">
          <GlassPanel className="border border-yellow-400/20 bg-gradient-to-br from-yellow-500/10 to-transparent">
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-yellow-500/20 p-3">
                  <Globe className="h-8 w-8 text-yellow-200" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-1">WhatsApp Business API Guiado</h2>
                  <p className="text-white/70">Mensajes automáticos con configuración paso a paso</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                  <div className="text-3xl font-bold text-white mb-2">~$50</div>
                  <p className="text-white/60 text-sm">USD/mes</p>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                  <div className="text-3xl font-bold text-white mb-2">2-3</div>
                  <p className="text-white/60 text-sm">días para activar</p>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                  <div className="text-3xl font-bold text-white mb-2">50-200</div>
                  <p className="text-white/60 text-sm">citas/día ideal</p>
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
                <h3 className="font-semibold text-white">✨ Características Premium:</h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm text-white/80">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    Recordatorios automáticos por WhatsApp
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    Confirmaciones automáticas
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    Número Business verificado
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    Mensajes con logo personalizado
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    Estadísticas de mensajes
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    Respuestas automáticas
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-400/20 p-6">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-400" />
                  Proveedores Recomendados
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <a 
                    href="https://www.360dialog.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="rounded-2xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-all group"
                  >
                    <div className="font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                      360Dialog ⭐
                    </div>
                    <p className="text-xs text-white/60 mb-2">Setup más rápido</p>
                    <p className="text-sm font-bold text-emerald-400">$49/mes</p>
                  </a>

                  <a 
                    href="https://www.twilio.com/whatsapp" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="rounded-2xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-all group"
                  >
                    <div className="font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                      Twilio
                    </div>
                    <p className="text-xs text-white/60 mb-2">Más conocido</p>
                    <p className="text-sm font-bold text-emerald-400">$0.005/msg</p>
                  </a>

                  <a 
                    href="https://www.messagebird.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="rounded-2xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-all group"
                  >
                    <div className="font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                      MessageBird
                    </div>
                    <p className="text-xs text-white/60 mb-2">Alternativa</p>
                    <p className="text-sm font-bold text-emerald-400">Variable</p>
                  </a>
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-400/20 p-6">
                <h3 className="font-semibold text-white mb-2">🚧 Asistente Guiado - En Desarrollo</h3>
                <p className="text-sm text-white/70 mb-4">
                  Estamos creando un asistente paso a paso que te guiará en la configuración completa. 
                  Por ahora, puedes usar el nivel Básico (gratis) o contactar directamente a los proveedores arriba.
                </p>
                <Button disabled variant="ghost" className="rounded-2xl border border-white/20 bg-white/5">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Próximamente
                </Button>
              </div>
            </div>
          </GlassPanel>
        </TabsContent>

        {/* NIVEL 3: AVANZADO */}
        <TabsContent value="advanced" className="space-y-6">
          <GlassPanel className="border border-purple-400/20 bg-gradient-to-br from-purple-500/10 to-transparent">
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-purple-500/20 p-3">
                  <Code2 className="h-8 w-8 text-purple-200" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-1">Configuración Manual de API</h2>
                  <p className="text-white/70">Para usuarios con experiencia técnica</p>
                </div>
              </div>

              <div className="rounded-2xl bg-orange-500/10 border border-orange-400/20 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-6 w-6 text-orange-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-white mb-2">⚠️ Advertencia</h3>
                    <p className="text-sm text-white/80">
                      Esta opción requiere conocimientos técnicos sobre APIs, webhooks y configuración de servidores. 
                      Solo recomendada si ya tienes experiencia previa con WhatsApp Business API.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
                <h3 className="font-semibold text-white">Usa esta opción solo si:</h3>
                <div className="grid gap-3 text-sm text-white/80">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-400" />
                    Ya tienes cuenta en un proveedor de WhatsApp Business API
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-400" />
                    Conoces webhooks y cómo configurarlos
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-400" />
                    Necesitas configuración personalizada avanzada
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-400" />
                    Tienes equipo técnico disponible para soporte
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-400/20 p-6">
                <h3 className="font-semibold text-white mb-3">🔧 Acceso a Configuración Completa</h3>
                <p className="text-sm text-white/80 mb-4">
                  La configuración manual de WhatsApp Business API te permite ingresar tus credenciales directamente 
                  y configurar webhooks, plantillas de mensajes y más.
                </p>
                <Button asChild className="aura-cta">
                  <a href="/dashboard/settings/whatsapp-api">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ir a Configuración Avanzada
                  </a>
                </Button>
              </div>

              <div className="rounded-2xl bg-blue-500/10 border border-blue-400/20 p-5">
                <h3 className="font-semibold text-white mb-2">💡 ¿Necesitas ayuda?</h3>
                <p className="text-sm text-white/80 mb-4">
                  Si no estás seguro de cuál opción elegir, te recomendamos comenzar con el <strong>Nivel Básico</strong>. 
                  Es gratis, funciona inmediatamente, y cubre las necesidades del 95% de los consultorios médicos.
                </p>
                <Button 
                  variant="ghost" 
                  className="rounded-2xl border border-white/20 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => {
                    const basicTab = document.querySelector('[value="basic"]') as HTMLElement;
                    basicTab?.click();
                  }}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Ver Opción Básica
                </Button>
              </div>
            </div>
          </GlassPanel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
