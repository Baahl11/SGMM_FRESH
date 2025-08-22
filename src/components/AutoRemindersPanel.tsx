'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Mail, MessageCircle, Clock, Users, CheckCircle, AlertTriangle, Play, Pause, Settings } from 'lucide-react';

interface ReminderConfig {
  enabled: boolean;
  email_enabled: boolean;
  whatsapp_enabled: boolean;
  timing_24h: boolean;
  timing_2h: boolean;
  timing_48h: boolean;
  custom_message: string;
  auto_send: boolean;
  schedule: {
    enabled: boolean;
    times: string[];
    days_ahead: number;
  };
  notification_preferences: {
    doctor_email: string;
    send_summary: boolean;
    summary_frequency: 'daily' | 'weekly' | 'manual';
  };
}

interface ReminderStats {
  total_appointments: number;
  reminders_needed: number;
  emails_sent: number;
  whatsapp_sent: number;
  errors: number;
  last_run?: string;
}

export default function AutoRemindersPanel() {
  const [config, setConfig] = useState<ReminderConfig | null>(null);
  const [stats, setStats] = useState<ReminderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  // Cargar configuración inicial
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/proxy/messaging/reminders/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/proxy/messaging/reminders/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        setLastResult({ type: 'success', message: 'Configuración guardada exitosamente' });
      }
    } catch (error) {
      setLastResult({ type: 'error', message: 'Error al guardar configuración' });
    } finally {
      setSaving(false);
    }
  };

  const testConfig = async () => {
    if (!config) return;
    
    setTesting(true);
    try {
      const response = await fetch('/api/proxy/messaging/reminders/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });
      
      if (response.ok) {
        const data = await response.json();
        setLastResult({ type: 'test', data: data.test_result, recommendations: data.recommendations });
      }
    } catch (error) {
      setLastResult({ type: 'error', message: 'Error al probar configuración' });
    } finally {
      setTesting(false);
    }
  };

  const sendRemindersNow = async (dryRun = true) => {
    try {
      const response = await fetch('/api/proxy/messaging/reminders/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, dry_run: dryRun })
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.summary);
        setLastResult({ 
          type: 'sent', 
          data: data.summary, 
          results: data.results,
          dry_run: dryRun 
        });
      }
    } catch (error) {
      setLastResult({ type: 'error', message: 'Error al enviar recordatorios' });
    }
  };

  if (loading || !config) {
    return <div className="p-6">Cargando configuración de recordatorios...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Recordatorios Automáticos
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona el envío automático de recordatorios a tus pacientes
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={testConfig}
            disabled={testing}
          >
            {testing ? 'Probando...' : 'Probar Config'}
          </Button>
          <Button 
            onClick={saveConfig}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>

      {lastResult && (
        <Alert className={lastResult.type === 'error' ? 'border-red-500' : 'border-green-500'}>
          <AlertDescription>
            {lastResult.message}
            {lastResult.recommendations && (
              <ul className="mt-2 list-disc list-inside">
                {lastResult.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="text-sm">{rec}</li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config">Configuración</TabsTrigger>
          <TabsTrigger value="schedule">Programación</TabsTrigger>
          <TabsTrigger value="monitor">Monitoreo</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración General
              </CardTitle>
              <CardDescription>
                Configura cómo y cuándo se envían los recordatorios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enabled">Sistema de Recordatorios</Label>
                  <p className="text-sm text-gray-500">Habilitar/deshabilitar todo el sistema</p>
                </div>
                <Switch
                  id="enabled"
                  checked={config.enabled}
                  onCheckedChange={(checked) => setConfig({...config, enabled: checked})}
                />
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Recordatorios por Email
                  </h3>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email_enabled">Habilitar Email</Label>
                    <Switch
                      id="email_enabled"
                      checked={config.email_enabled}
                      onCheckedChange={(checked) => setConfig({...config, email_enabled: checked})}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Recordatorios por WhatsApp
                  </h3>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="whatsapp_enabled">Habilitar WhatsApp</Label>
                    <Switch
                      id="whatsapp_enabled"
                      checked={config.whatsapp_enabled}
                      onCheckedChange={(checked) => setConfig({...config, whatsapp_enabled: checked})}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Timing de Recordatorios
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>48 horas antes</Label>
                      <p className="text-xs text-gray-500">Recordatorio temprano</p>
                    </div>
                    <Switch
                      checked={config.timing_48h}
                      onCheckedChange={(checked) => setConfig({...config, timing_48h: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>24 horas antes</Label>
                      <p className="text-xs text-gray-500">Recordatorio estándar</p>
                    </div>
                    <Switch
                      checked={config.timing_24h}
                      onCheckedChange={(checked) => setConfig({...config, timing_24h: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>2 horas antes</Label>
                      <p className="text-xs text-gray-500">Recordatorio urgente</p>
                    </div>
                    <Switch
                      checked={config.timing_2h}
                      onCheckedChange={(checked) => setConfig({...config, timing_2h: checked})}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label htmlFor="custom_message">Mensaje Personalizado</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Usa {'{paciente}'}, {'{fecha}'}, {'{hora}'}, {'{tratamiento}'} para personalizar
                </p>
                <Textarea
                  id="custom_message"
                  value={config.custom_message}
                  onChange={(e) => setConfig({...config, custom_message: e.target.value})}
                  placeholder="Hola {paciente}, te recordamos tu cita para {tratamiento} el {fecha} a las {hora}. ¡Te esperamos!"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Programación Automática</CardTitle>
              <CardDescription>
                Configura cuándo se ejecutan automáticamente los recordatorios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Envío Automático</Label>
                  <p className="text-sm text-gray-500">Los recordatorios se envían automáticamente</p>
                </div>
                <div className="flex items-center gap-2">
                  {config.auto_send ? <Play className="h-4 w-4 text-green-500" /> : <Pause className="h-4 w-4 text-gray-400" />}
                  <Switch
                    checked={config.auto_send}
                    onCheckedChange={(checked) => setConfig({...config, auto_send: checked})}
                  />
                </div>
              </div>

              {config.auto_send && (
                <>
                  <Separator />
                  <div>
                    <Label>Horarios de Envío</Label>
                    <p className="text-sm text-gray-500 mb-2">Horas del día en que se ejecutará el sistema</p>
                    <div className="flex gap-2">
                      {config.schedule.times.map((time, index) => (
                        <Input
                          key={index}
                          type="time"
                          value={time}
                          onChange={(e) => {
                            const newTimes = [...config.schedule.times];
                            newTimes[index] = e.target.value;
                            setConfig({
                              ...config,
                              schedule: { ...config.schedule, times: newTimes }
                            });
                          }}
                          className="w-24"
                        />
                      ))}
                      <Button
                        variant="outline"
                        onClick={() => setConfig({
                          ...config,
                          schedule: { 
                            ...config.schedule, 
                            times: [...config.schedule.times, '12:00'] 
                          }
                        })}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitor" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Estadísticas de Envío
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total de citas:</span>
                      <Badge>{stats.total_appointments}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Necesitan recordatorio:</span>
                      <Badge variant="secondary">{stats.reminders_needed}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Emails enviados:</span>
                      <Badge variant="outline">{stats.emails_sent}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>WhatsApp enviados:</span>
                      <Badge variant="outline">{stats.whatsapp_sent}</Badge>
                    </div>
                    {stats.errors > 0 && (
                      <div className="flex justify-between">
                        <span>Errores:</span>
                        <Badge variant="destructive">{stats.errors}</Badge>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">No hay estadísticas disponibles</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => sendRemindersNow(true)}
                >
                  Vista Previa (Dry Run)
                </Button>
                <Button 
                  className="w-full"
                  onClick={() => sendRemindersNow(false)}
                  disabled={!config.enabled}
                >
                  Enviar Recordatorios Ahora
                </Button>
                <Button 
                  className="w-full" 
                  variant="secondary"
                  onClick={loadConfig}
                >
                  Actualizar Estadísticas
                </Button>
              </CardContent>
            </Card>
          </div>

          {lastResult?.results && (
            <Card>
              <CardHeader>
                <CardTitle>Último Resultado de Envío</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lastResult.results.map((result: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span>{result.patient_name}</span>
                      <div className="flex gap-2">
                        {result.email_sent && <Mail className="h-4 w-4 text-blue-500" />}
                        {result.whatsapp_sent && <MessageCircle className="h-4 w-4 text-green-500" />}
                        <Badge variant={result.errors?.length ? "destructive" : "secondary"}>
                          {result.timing}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
