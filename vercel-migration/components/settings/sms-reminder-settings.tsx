"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Info, MessageSquare, Clock, DollarSign, CheckCircle2 } from 'lucide-react';
import {
  SmsReminderConfig,
  ReminderTiming,
  TIMING_OPTIONS,
  SMS_PROVIDERS,
  estimateMonthlyCost
} from '@/lib/utils/sms-reminders';

interface SmsReminderSettingsProps {
  config: SmsReminderConfig;
  onConfigChange: (config: Partial<SmsReminderConfig>) => void;
}

export function SmsReminderSettings({ config, onConfigChange }: SmsReminderSettingsProps) {
  const toggleTiming = (timing: ReminderTiming) => {
    const timings = config.default_timings.includes(timing)
      ? config.default_timings.filter(t => t !== timing)
      : [...config.default_timings, timing];
    onConfigChange({ default_timings: timings });
  };

  const costEstimate = estimateMonthlyCost(20, config.default_timings.length, config.provider);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Recordatorios por SMS
          </CardTitle>
          <CardDescription>
            Envía recordatorios automáticos de citas por mensaje de texto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Activar Recordatorios SMS</Label>
              <p className="text-sm text-muted-foreground">
                Enviar mensajes automáticos a los pacientes
              </p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => onConfigChange({ enabled: checked })}
            />
          </div>

          {config.enabled && (
            <>
              {/* Provider Selection */}
              <div className="space-y-2">
                <Label htmlFor="provider">Proveedor de SMS</Label>
                <Select
                  value={config.provider}
                  onValueChange={(value: any) => onConfigChange({ provider: value })}
                >
                  <SelectTrigger id="provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SMS_PROVIDERS).map(([key, provider]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <span>{provider.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {provider.pricing}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {SMS_PROVIDERS[config.provider].features.join(' • ')}
                </p>
              </div>

              {/* Default Timings */}
              <div className="space-y-3">
                <Label>Horarios de Recordatorio Predeterminados</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(TIMING_OPTIONS) as ReminderTiming[])
                    .filter(t => t !== 'custom')
                    .map((timing) => (
                      <Button
                        key={timing}
                        type="button"
                        variant={config.default_timings.includes(timing) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleTiming(timing)}
                        className="justify-start"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        {TIMING_OPTIONS[timing].label}
                      </Button>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selecciona cuándo enviar recordatorios automáticamente
                </p>
              </div>

              {/* Additional Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Confirmación de Cita</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar SMS al agendar la cita
                    </p>
                  </div>
                  <Switch
                    checked={config.send_confirmation}
                    onCheckedChange={(checked) => onConfigChange({ send_confirmation: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Incluir Nombre del Doctor</Label>
                    <p className="text-sm text-muted-foreground">
                      Mostrar doctor en el mensaje
                    </p>
                  </div>
                  <Switch
                    checked={config.include_doctor_name}
                    onCheckedChange={(checked) => onConfigChange({ include_doctor_name: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Incluir Ubicación</Label>
                    <p className="text-sm text-muted-foreground">
                      Mostrar dirección del consultorio
                    </p>
                  </div>
                  <Switch
                    checked={config.include_location}
                    onCheckedChange={(checked) => onConfigChange({ include_location: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Requiere Confirmación</Label>
                    <p className="text-sm text-muted-foreground">
                      Paciente debe responder "SI" para confirmar
                    </p>
                  </div>
                  <Switch
                    checked={config.require_confirmation}
                    onCheckedChange={(checked) => onConfigChange({ require_confirmation: checked })}
                  />
                </div>
              </div>

              {/* Country Code */}
              <div className="space-y-2">
                <Label htmlFor="country-code">Código de País</Label>
                <Select
                  value={config.country_code}
                  onValueChange={(value) => onConfigChange({ country_code: value })}
                >
                  <SelectTrigger id="country-code">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+52">+52 (México)</SelectItem>
                    <SelectItem value="+1">+1 (USA/Canadá)</SelectItem>
                    <SelectItem value="+34">+34 (España)</SelectItem>
                    <SelectItem value="+54">+54 (Argentina)</SelectItem>
                    <SelectItem value="+56">+56 (Chile)</SelectItem>
                    <SelectItem value="+57">+57 (Colombia)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quiet Hours */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Respetar Horario Comercial</Label>
                  <Switch
                    checked={config.business_hours_only}
                    onCheckedChange={(checked) => onConfigChange({ business_hours_only: checked })}
                  />
                </div>

                {config.business_hours_only && (
                  <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-blue-200">
                    <div className="space-y-2">
                      <Label htmlFor="quiet-start">No Enviar Desde</Label>
                      <Input
                        id="quiet-start"
                        type="time"
                        value={config.quiet_hours_start}
                        onChange={(e) => onConfigChange({ quiet_hours_start: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quiet-end">No Enviar Hasta</Label>
                      <Input
                        id="quiet-end"
                        type="time"
                        value={config.quiet_hours_end}
                        onChange={(e) => onConfigChange({ quiet_hours_end: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cost Estimate */}
      {config.enabled && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-green-900">
              <DollarSign className="h-4 w-4" />
              Estimación de Costos Mensuales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-700">Proveedor:</span>
              <span className="font-medium text-green-900">
                {SMS_PROVIDERS[config.provider].name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Recordatorios por cita:</span>
              <span className="font-medium text-green-900">
                {config.default_timings.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Costo por cita:</span>
              <span className="font-medium text-green-900">
                ${costEstimate.perAppointment.toFixed(4)} {costEstimate.currency}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-green-200">
              <span className="font-medium text-green-900">Estimado mensual (20 citas/día):</span>
              <span className="font-bold text-green-900">
                ${costEstimate.total.toFixed(2)} {costEstimate.currency}
              </span>
            </div>
            <p className="text-xs text-green-700 pt-2">
              * Basado en tarifas estándar del proveedor. Costos reales pueden variar.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info Box */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-blue-900">
              <p className="font-medium">Configuración de SMS</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Los recordatorios se envían automáticamente según los horarios configurados</li>
                <li>Los pacientes sin número de teléfono no recibirán SMS</li>
                <li>Puedes programar recordatorios adicionales manualmente para cada cita</li>
                <li>Los mensajes incluyen fecha, hora y doctor de la cita</li>
                <li>Las confirmaciones se registran cuando el paciente responde</li>
              </ul>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="font-medium mb-1">🔑 Credenciales de Twilio</p>
                <p className="text-blue-800">
                  Para enviar SMS, configura tus credenciales de Twilio en{' '}
                  <a 
                    href="/dashboard/settings/notifications" 
                    className="underline font-semibold hover:text-blue-600"
                  >
                    Configuración → Notificaciones
                  </a>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
