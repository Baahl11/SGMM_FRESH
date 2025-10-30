"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Info, Bell, Mail, MessageSquare, Users, Clock } from 'lucide-react';
import { WaitlistSettings } from '@/lib/utils/waitlist';

interface WaitlistSettingsProps {
  settings: WaitlistSettings;
  onSettingsChange: (settings: Partial<WaitlistSettings>) => void;
}

export function WaitlistSettingsComponent({ settings, onSettingsChange }: WaitlistSettingsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Espera Automática
          </CardTitle>
          <CardDescription>
            Gestiona automáticamente pacientes en lista de espera y notifícales cuando se liberen espacios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Activar Lista de Espera</Label>
              <p className="text-sm text-muted-foreground">
                Permite agregar pacientes a la lista de espera
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => onSettingsChange({ enabled: checked })}
            />
          </div>

          {settings.enabled && (
            <>
              {/* Auto Notify */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificación Automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificar automáticamente cuando se libere un espacio
                  </p>
                </div>
                <Switch
                  checked={settings.auto_notify}
                  onCheckedChange={(checked) => onSettingsChange({ auto_notify: checked })}
                />
              </div>

              {/* Notification Methods */}
              <div className="space-y-3">
                <Label>Métodos de Notificación</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="method-email"
                      checked={settings.notification_methods.includes('email')}
                      onCheckedChange={(checked) => {
                        const methods = checked
                          ? ([...settings.notification_methods, 'email'] as ('email' | 'sms' | 'whatsapp')[])
                          : settings.notification_methods.filter(m => m !== 'email');
                        onSettingsChange({ notification_methods: methods });
                      }}
                    />
                    <Label htmlFor="method-email" className="flex items-center gap-2 cursor-pointer">
                      <Mail className="h-4 w-4" />
                      Correo Electrónico
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="method-sms"
                      checked={settings.notification_methods.includes('sms')}
                      onCheckedChange={(checked) => {
                        const methods = checked
                          ? ([...settings.notification_methods, 'sms'] as ('email' | 'sms' | 'whatsapp')[])
                          : settings.notification_methods.filter(m => m !== 'sms');
                        onSettingsChange({ notification_methods: methods });
                      }}
                    />
                    <Label htmlFor="method-sms" className="flex items-center gap-2 cursor-pointer">
                      <MessageSquare className="h-4 w-4" />
                      SMS
                      <Badge variant="secondary" className="ml-1">Próximamente</Badge>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="method-whatsapp"
                      checked={settings.notification_methods.includes('whatsapp')}
                      onCheckedChange={(checked) => {
                        const methods = checked
                          ? ([...settings.notification_methods, 'whatsapp'] as ('email' | 'sms' | 'whatsapp')[])
                          : settings.notification_methods.filter(m => m !== 'whatsapp');
                        onSettingsChange({ notification_methods: methods });
                      }}
                    />
                    <Label htmlFor="method-whatsapp" className="flex items-center gap-2 cursor-pointer">
                      <MessageSquare className="h-4 w-4" />
                      WhatsApp
                      <Badge variant="secondary" className="ml-1">Próximamente</Badge>
                    </Label>
                  </div>
                </div>
              </div>

              {/* Notification Window */}
              <div className="space-y-2">
                <Label htmlFor="notification-window">Ventana de Notificación</Label>
                <Select
                  value={settings.notification_window_hours.toString()}
                  onValueChange={(value) => onSettingsChange({ notification_window_hours: parseInt(value) })}
                >
                  <SelectTrigger id="notification-window">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 horas</SelectItem>
                    <SelectItem value="12">12 horas</SelectItem>
                    <SelectItem value="24">24 horas</SelectItem>
                    <SelectItem value="48">48 horas</SelectItem>
                    <SelectItem value="72">72 horas</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Tiempo máximo que el paciente tiene para responder a la notificación
                </p>
              </div>

              {/* Max Notifications Per Day */}
              <div className="space-y-2">
                <Label htmlFor="max-notifications">Notificaciones Máximas por Día</Label>
                <Select
                  value={settings.max_notifications_per_day.toString()}
                  onValueChange={(value) => onSettingsChange({ max_notifications_per_day: parseInt(value) })}
                >
                  <SelectTrigger id="max-notifications">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 notificaciones</SelectItem>
                    <SelectItem value="10">10 notificaciones</SelectItem>
                    <SelectItem value="20">20 notificaciones</SelectItem>
                    <SelectItem value="50">50 notificaciones</SelectItem>
                    <SelectItem value="100">Sin límite</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Límite de notificaciones enviadas por día para evitar spam
                </p>
              </div>

              {/* Priority Booking */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Priorización Inteligente</Label>
                  <p className="text-sm text-muted-foreground">
                    Los pacientes con mayor prioridad reciben notificaciones primero
                  </p>
                </div>
                <Switch
                  checked={settings.priority_booking}
                  onCheckedChange={(checked) => onSettingsChange({ priority_booking: checked })}
                />
              </div>

              {/* Auto-book for VIP */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Agenda para Pacientes Urgentes</Label>
                  <p className="text-sm text-muted-foreground">
                    Agendar automáticamente citas para pacientes con prioridad "Urgente"
                  </p>
                </div>
                <Switch
                  checked={settings.auto_book_for_vip}
                  onCheckedChange={(checked) => onSettingsChange({ auto_book_for_vip: checked })}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-blue-900">
              <p className="font-medium">¿Cómo funciona la Lista de Espera?</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Los pacientes pueden agregarse manualmente a la lista de espera</li>
                <li>Cuando se cancela o libera una cita, el sistema busca coincidencias automáticamente</li>
                <li>Los pacientes se notifican según su prioridad (Urgente &gt; Alta &gt; Normal &gt; Baja)</li>
                <li>Los pacientes tienen un tiempo limitado para confirmar su disponibilidad</li>
                <li>Puedes configurar notificaciones por email, SMS o WhatsApp</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Configuration Summary */}
      {settings.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Resumen de Configuración
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estado:</span>
              <Badge variant="default">Activo</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Notificación automática:</span>
              <span>{settings.auto_notify ? 'Sí' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Métodos de notificación:</span>
              <span>{settings.notification_methods.length} activo(s)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ventana de respuesta:</span>
              <span>{settings.notification_window_hours} horas</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Límite diario:</span>
              <span>{settings.max_notifications_per_day === 100 ? 'Sin límite' : `${settings.max_notifications_per_day} notificaciones`}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
