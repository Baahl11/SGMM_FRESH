"use client";

import { GlassPanel } from '@/components/ui/glass-panel';
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
import { Info, Mail, MessageSquare, Users, Clock } from 'lucide-react';
import { WaitlistSettings } from '@/lib/utils/waitlist';

interface WaitlistSettingsProps {
  settings: WaitlistSettings;
  onSettingsChange: (settings: Partial<WaitlistSettings>) => void;
}

export function WaitlistSettingsComponent({ settings, onSettingsChange }: WaitlistSettingsProps) {
  return (
    <div className="space-y-6">
      <GlassPanel className="border-white/10 bg-white/5 p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Lista de Espera Automática</h3>
            <p className="text-sm text-white/60">Gestiona automáticamente pacientes en lista de espera y notifícales cuando se liberen espacios</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5">
            <div className="space-y-0.5">
              <Label className="text-white font-medium">Activar Lista de Espera</Label>
              <p className="text-sm text-white/60">Permite agregar pacientes a la lista de espera</p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => onSettingsChange({ enabled: checked })}
            />
          </div>

          {settings.enabled && (
            <>
              <div className="h-px bg-white/10" />

              {/* Auto Notify */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5">
                <div className="space-y-0.5">
                  <Label className="text-white">Notificación Automática</Label>
                  <p className="text-sm text-white/60">Notificar automáticamente cuando se libere un espacio</p>
                </div>
                <Switch
                  checked={settings.auto_notify}
                  onCheckedChange={(checked) => onSettingsChange({ auto_notify: checked })}
                />
              </div>

              {/* Notification Methods */}
              <div className="space-y-3">
                <Label className="text-white font-medium">Métodos de Notificación</Label>
                <div className="space-y-2 p-3 rounded-xl border border-white/10 bg-white/5">
                  <div className="flex items-center space-x-3">
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
                    <Label htmlFor="method-email" className="flex items-center gap-2 cursor-pointer text-white/80">
                      <Mail className="h-4 w-4" />
                      Correo Electrónico
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
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
                    <Label htmlFor="method-sms" className="flex items-center gap-2 cursor-pointer text-white/80">
                      <MessageSquare className="h-4 w-4" />
                      SMS
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-white/10 text-xs text-white/60">Próximamente</span>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
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
                    <Label htmlFor="method-whatsapp" className="flex items-center gap-2 cursor-pointer text-white/80">
                      <MessageSquare className="h-4 w-4" />
                      WhatsApp
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-white/10 text-xs text-white/60">Próximamente</span>
                    </Label>
                  </div>
                </div>
              </div>

              {/* Notification Window */}
              <div className="space-y-2">
                <Label htmlFor="notification-window" className="text-white">Ventana de Notificación</Label>
                <Select
                  value={settings.notification_window_hours.toString()}
                  onValueChange={(value) => onSettingsChange({ notification_window_hours: parseInt(value) })}
                >
                  <SelectTrigger id="notification-window" className="bg-white/5 border-white/20 text-white">
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
                <p className="text-xs text-white/50">Tiempo máximo que el paciente tiene para responder</p>
              </div>

              {/* Max Notifications */}
              <div className="space-y-2">
                <Label htmlFor="max-notifications" className="text-white">Notificaciones Máximas por Día</Label>
                <Select
                  value={settings.max_notifications_per_day.toString()}
                  onValueChange={(value) => onSettingsChange({ max_notifications_per_day: parseInt(value) })}
                >
                  <SelectTrigger id="max-notifications" className="bg-white/5 border-white/20 text-white">
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
              </div>

              <div className="h-px bg-white/10" />

              {/* Priority Booking */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5">
                <div className="space-y-0.5">
                  <Label className="text-white">Priorización Inteligente</Label>
                  <p className="text-sm text-white/60">Los pacientes con mayor prioridad reciben notificaciones primero</p>
                </div>
                <Switch
                  checked={settings.priority_booking}
                  onCheckedChange={(checked) => onSettingsChange({ priority_booking: checked })}
                />
              </div>

              {/* Auto-book VIP */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5">
                <div className="space-y-0.5">
                  <Label className="text-white">Auto-Agenda para Pacientes Urgentes</Label>
                  <p className="text-sm text-white/60">Agendar automáticamente citas para pacientes con prioridad &quot;Urgente&quot;</p>
                </div>
                <Switch
                  checked={settings.auto_book_for_vip}
                  onCheckedChange={(checked) => onSettingsChange({ auto_book_for_vip: checked })}
                />
              </div>
            </>
          )}
        </div>
      </GlassPanel>

      {/* Info Box */}
      <GlassPanel className="border-white/10 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-rose-500/10 p-5 text-white">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm">
            <p className="font-medium text-purple-300">¿Cómo funciona la Lista de Espera?</p>
            <ul className="space-y-1 ml-4 list-disc text-white/70">
              <li>Los pacientes pueden agregarse manualmente a la lista de espera</li>
              <li>Cuando se cancela o libera una cita, el sistema busca coincidencias automáticamente</li>
              <li>Los pacientes se notifican según su prioridad (Urgente &gt; Alta &gt; Normal &gt; Baja)</li>
              <li>Los pacientes tienen un tiempo limitado para confirmar su disponibilidad</li>
              <li>Puedes configurar notificaciones por email, SMS o WhatsApp</li>
            </ul>
          </div>
        </div>
      </GlassPanel>

      {/* Summary */}
      {settings.enabled && (
        <GlassPanel className="border-white/10 bg-white/5 p-4 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-white/60" />
            <span className="text-sm font-medium">Resumen de Configuración</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Estado:</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs">Activo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Notificación automática:</span>
              <span className="text-white/80">{settings.auto_notify ? 'Sí' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Métodos activos:</span>
              <span className="text-white/80">{settings.notification_methods.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Ventana respuesta:</span>
              <span className="text-white/80">{settings.notification_window_hours}h</span>
            </div>
          </div>
        </GlassPanel>
      )}
    </div>
  );
}
