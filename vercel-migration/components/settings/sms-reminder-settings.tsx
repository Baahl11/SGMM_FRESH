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
import { cn } from '@/lib/utils';
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
  appearance?: 'default' | 'glass';
}

export function SmsReminderSettings({
  config,
  onConfigChange,
  appearance = 'default',
}: SmsReminderSettingsProps) {
  const isGlass = appearance === 'glass';

  const toggleTiming = (timing: ReminderTiming) => {
    const timings = config.default_timings.includes(timing)
      ? config.default_timings.filter(t => t !== timing)
      : [...config.default_timings, timing];
    onConfigChange({ default_timings: timings });
  };

  const costEstimate = estimateMonthlyCost(20, config.default_timings.length, config.provider);
  const mutedTextClass = isGlass ? 'text-white/70' : 'text-muted-foreground';
  const secondaryTextClass = isGlass ? 'text-white/75' : 'text-blue-900';
  const tertiaryTextClass = isGlass ? 'text-white/80' : 'text-blue-800';

  return (
    <div className="space-y-6">
      <Card
        className={cn(
          isGlass &&
            'border-white/20 bg-white/[0.04] text-white shadow-[0_25px_90px_rgba(2,6,23,0.45)] backdrop-blur-xl'
        )}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Recordatorios por SMS
          </CardTitle>
          <CardDescription className={cn(isGlass && 'text-white/70')}>
            Envía recordatorios automáticos de citas por mensaje de texto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Activar Recordatorios SMS</Label>
                <p className={cn('text-sm', mutedTextClass)}>
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
                          <Badge
                            variant="secondary"
                            className={cn('text-xs', isGlass && 'border-white/20 bg-white/10 text-white/80')}
                          >
                            {provider.pricing}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className={cn('text-xs', mutedTextClass)}>
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
                        className={cn(
                          'justify-start',
                          isGlass &&
                            (config.default_timings.includes(timing)
                              ? 'border-emerald-300/40 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/25'
                              : 'border-white/20 bg-white/5 text-white hover:bg-white/10')
                        )}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        {TIMING_OPTIONS[timing].label}
                      </Button>
                    ))}
                </div>
                <p className={cn('text-xs', mutedTextClass)}>
                  Selecciona cuándo enviar recordatorios automáticamente
                </p>
              </div>

              {/* Additional Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Confirmación de Cita</Label>
                    <p className={cn('text-sm', mutedTextClass)}>
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
                    <p className={cn('text-sm', mutedTextClass)}>
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
                    <p className={cn('text-sm', mutedTextClass)}>
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
                    <p className={cn('text-sm', mutedTextClass)}>
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
                  <div className={cn('grid grid-cols-2 gap-4 pl-4 border-l-2', isGlass ? 'border-white/20' : 'border-blue-200')}>
                    <div className="space-y-2">
                      <Label htmlFor="quiet-start">No Enviar Desde</Label>
                      <Input
                        id="quiet-start"
                        type="time"
                        value={config.quiet_hours_start}
                        onChange={(e) => onConfigChange({ quiet_hours_start: e.target.value })}
                        className={cn(isGlass && 'border-white/20 bg-white/5 text-white')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quiet-end">No Enviar Hasta</Label>
                      <Input
                        id="quiet-end"
                        type="time"
                        value={config.quiet_hours_end}
                        onChange={(e) => onConfigChange({ quiet_hours_end: e.target.value })}
                        className={cn(isGlass && 'border-white/20 bg-white/5 text-white')}
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
        <Card
          className={cn(
            isGlass
              ? 'border-emerald-300/30 bg-emerald-500/12 text-emerald-50 backdrop-blur-xl'
              : 'border-green-200 bg-green-50'
          )}
        >
          <CardHeader>
            <CardTitle className={cn('text-sm flex items-center gap-2', isGlass ? 'text-emerald-100' : 'text-green-900')}>
              <DollarSign className="h-4 w-4" />
              Estimación de Costos Mensuales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={cn(isGlass ? 'text-emerald-100/80' : 'text-green-700')}>Proveedor:</span>
              <span className={cn('font-medium', isGlass ? 'text-emerald-50' : 'text-green-900')}>
                {SMS_PROVIDERS[config.provider].name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={cn(isGlass ? 'text-emerald-100/80' : 'text-green-700')}>Recordatorios por cita:</span>
              <span className={cn('font-medium', isGlass ? 'text-emerald-50' : 'text-green-900')}>
                {config.default_timings.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={cn(isGlass ? 'text-emerald-100/80' : 'text-green-700')}>Costo por cita:</span>
              <span className={cn('font-medium', isGlass ? 'text-emerald-50' : 'text-green-900')}>
                ${costEstimate.perAppointment.toFixed(4)} {costEstimate.currency}
              </span>
            </div>
            <div className={cn('flex justify-between pt-2 border-t', isGlass ? 'border-emerald-300/30' : 'border-green-200')}>
              <span className={cn('font-medium', isGlass ? 'text-emerald-100' : 'text-green-900')}>Estimado mensual (20 citas/día):</span>
              <span className={cn('font-bold', isGlass ? 'text-emerald-50' : 'text-green-900')}>
                ${costEstimate.total.toFixed(2)} {costEstimate.currency}
              </span>
            </div>
            <p className={cn('text-xs pt-2', isGlass ? 'text-emerald-100/80' : 'text-green-700')}>
              * Basado en tarifas estándar del proveedor. Costos reales pueden variar.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info Box */}
      <Card
        className={cn(
          isGlass
            ? 'border-cyan-300/30 bg-cyan-500/12 text-cyan-50 backdrop-blur-xl'
            : 'border-blue-200 bg-blue-50'
        )}
      >
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className={cn('h-5 w-5 flex-shrink-0 mt-0.5', isGlass ? 'text-cyan-100' : 'text-blue-600')} />
            <div className={cn('space-y-2 text-sm', secondaryTextClass)}>
              <p className="font-medium">Configuración de SMS</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Los recordatorios se envían automáticamente según los horarios configurados</li>
                <li>Los pacientes sin número de teléfono no recibirán SMS</li>
                <li>Puedes programar recordatorios adicionales manualmente para cada cita</li>
                <li>Los mensajes incluyen fecha, hora y doctor de la cita</li>
                <li>Las confirmaciones se registran cuando el paciente responde</li>
              </ul>
              <div className={cn('mt-3 pt-3 border-t', isGlass ? 'border-cyan-300/30' : 'border-blue-200')}>
                <p className="font-medium mb-1">🔑 Credenciales de Twilio</p>
                <p className={tertiaryTextClass}>
                  Para enviar SMS, configura tus credenciales de Twilio en{' '}
                  <a 
                    href="/dashboard/settings/notifications" 
                    className={cn('underline font-semibold', isGlass ? 'hover:text-cyan-50' : 'hover:text-blue-600')}
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
