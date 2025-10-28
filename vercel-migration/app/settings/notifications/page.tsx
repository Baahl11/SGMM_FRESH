'use client';

/**
 * Notification Preferences Page
 * Phase 3.3 - Notifications & Reminders
 */

import { useState, useEffect } from 'react';
import { Bell, Mail, Moon, Clock, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';
import type { NotificationPreferences } from '@/lib/types/notifications';

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/notifications/preferences');
      const data = await response.json();

      if (response.ok) {
        setPreferences(data.preferences);
      } else {
        toast.error(data.error || 'Error al cargar preferencias');
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast.error('Error al cargar preferencias');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    try {
      setIsSaving(true);
      const response = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          browser_enabled: preferences.browser_enabled,
          email_enabled: preferences.email_enabled,
          email_address: preferences.email_address,
          notify_unsent_invoices: preferences.notify_unsent_invoices,
          notify_unpaid_invoices: preferences.notify_unpaid_invoices,
          notify_expiring_certificates: preferences.notify_expiring_certificates,
          notify_upcoming_appointments: preferences.notify_upcoming_appointments,
          notify_low_inventory: preferences.notify_low_inventory,
          dnd_start_hour: preferences.dnd_start_hour,
          dnd_end_hour: preferences.dnd_end_hour,
          unsent_invoice_days: preferences.unsent_invoice_days,
          unpaid_invoice_days: preferences.unpaid_invoice_days,
          certificate_expiry_days: preferences.certificate_expiry_days,
          appointment_reminder_hours: preferences.appointment_reminder_hours,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPreferences(data.preferences);
        toast.success('Preferencias guardadas correctamente');
      } else {
        toast.error(data.error || 'Error al guardar preferencias');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Error al guardar preferencias');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: value });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando preferencias...</p>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Error al cargar preferencias</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Preferencias de Notificaciones</h1>
        <p className="text-muted-foreground">
          Personaliza cómo y cuándo recibes notificaciones
        </p>
      </div>

      {/* Channels */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Canales de Notificación
          </CardTitle>
          <CardDescription>Elige cómo quieres recibir notificaciones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Browser Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="browser_enabled">Notificaciones del navegador</Label>
              <p className="text-sm text-muted-foreground">
                Recibe notificaciones en tiempo real mientras navegas
              </p>
            </div>
            <Switch
              id="browser_enabled"
              checked={preferences.browser_enabled}
              onCheckedChange={(checked) => updatePreference('browser_enabled', checked)}
            />
          </div>

          {/* Email Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email_enabled">Notificaciones por correo</Label>
                <p className="text-sm text-muted-foreground">
                  Recibe resúmenes diarios por correo electrónico
                </p>
              </div>
              <Switch
                id="email_enabled"
                checked={preferences.email_enabled}
                onCheckedChange={(checked) => updatePreference('email_enabled', checked)}
              />
            </div>

            {preferences.email_enabled && (
              <div className="ml-6">
                <Label htmlFor="email_address">Correo electrónico</Label>
                <Input
                  id="email_address"
                  type="email"
                  placeholder="tu@email.com"
                  value={preferences.email_address || ''}
                  onChange={(e) => updatePreference('email_address', e.target.value)}
                  className="mt-2"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Tipos de Notificaciones
          </CardTitle>
          <CardDescription>Selecciona qué tipo de alertas quieres recibir</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify_unsent_invoices">Facturas no enviadas</Label>
              <p className="text-sm text-muted-foreground">
                Alerta cuando una factura lleva {preferences.unsent_invoice_days}+ días sin enviar
              </p>
            </div>
            <Switch
              id="notify_unsent_invoices"
              checked={preferences.notify_unsent_invoices}
              onCheckedChange={(checked) => updatePreference('notify_unsent_invoices', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify_unpaid_invoices">Facturas sin pagar</Label>
              <p className="text-sm text-muted-foreground">
                Alerta cuando una factura lleva {preferences.unpaid_invoice_days}+ días sin pagar
              </p>
            </div>
            <Switch
              id="notify_unpaid_invoices"
              checked={preferences.notify_unpaid_invoices}
              onCheckedChange={(checked) => updatePreference('notify_unpaid_invoices', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify_expiring_certificates">Certificados por vencer</Label>
              <p className="text-sm text-muted-foreground">
                Alerta {preferences.certificate_expiry_days} días antes de vencimiento
              </p>
            </div>
            <Switch
              id="notify_expiring_certificates"
              checked={preferences.notify_expiring_certificates}
              onCheckedChange={(checked) => updatePreference('notify_expiring_certificates', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify_upcoming_appointments">Citas próximas</Label>
              <p className="text-sm text-muted-foreground">
                Recuerda {preferences.appointment_reminder_hours} horas antes de la cita
              </p>
            </div>
            <Switch
              id="notify_upcoming_appointments"
              checked={preferences.notify_upcoming_appointments}
              onCheckedChange={(checked) => updatePreference('notify_upcoming_appointments', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify_low_inventory">Inventario bajo</Label>
              <p className="text-sm text-muted-foreground">
                Alerta cuando los productos estén por agotarse
              </p>
            </div>
            <Switch
              id="notify_low_inventory"
              checked={preferences.notify_low_inventory}
              onCheckedChange={(checked) => updatePreference('notify_low_inventory', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Timing Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Configuración de Tiempos
          </CardTitle>
          <CardDescription>Ajusta cuándo quieres recibir recordatorios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unsent_invoice_days">Días para facturas no enviadas</Label>
              <Input
                id="unsent_invoice_days"
                type="number"
                min="1"
                value={preferences.unsent_invoice_days}
                onChange={(e) => updatePreference('unsent_invoice_days', parseInt(e.target.value))}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="unpaid_invoice_days">Días para facturas sin pagar</Label>
              <Input
                id="unpaid_invoice_days"
                type="number"
                min="1"
                value={preferences.unpaid_invoice_days}
                onChange={(e) => updatePreference('unpaid_invoice_days', parseInt(e.target.value))}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="certificate_expiry_days">Días antes de vencimiento</Label>
              <Input
                id="certificate_expiry_days"
                type="number"
                min="1"
                value={preferences.certificate_expiry_days}
                onChange={(e) => updatePreference('certificate_expiry_days', parseInt(e.target.value))}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="appointment_reminder_hours">Horas antes de la cita</Label>
              <Input
                id="appointment_reminder_hours"
                type="number"
                min="1"
                value={preferences.appointment_reminder_hours}
                onChange={(e) => updatePreference('appointment_reminder_hours', parseInt(e.target.value))}
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Do Not Disturb */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            No Molestar
          </CardTitle>
          <CardDescription>
            Define un horario en el que no quieres recibir notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dnd_start_hour">Hora de inicio (0-23)</Label>
              <Select
                value={preferences.dnd_start_hour?.toString() || 'none'}
                onValueChange={(value) => 
                  updatePreference('dnd_start_hour', value === 'none' ? null : parseInt(value))
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Sin límite" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin límite</SelectItem>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i.toString().padStart(2, '0')}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dnd_end_hour">Hora de fin (0-23)</Label>
              <Select
                value={preferences.dnd_end_hour?.toString() || 'none'}
                onValueChange={(value) => 
                  updatePreference('dnd_end_hour', value === 'none' ? null : parseInt(value))
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Sin límite" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin límite</SelectItem>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i.toString().padStart(2, '0')}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {preferences.dnd_start_hour !== null && preferences.dnd_end_hour !== null && (
            <p className="text-sm text-muted-foreground">
              No recibirás notificaciones entre las {preferences.dnd_start_hour!.toString().padStart(2, '0')}:00 
              {' '}y las {preferences.dnd_end_hour!.toString().padStart(2, '0')}:00
            </p>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>Guardando...</>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Preferencias
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
