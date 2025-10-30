'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Clock, Calendar, Bell, Users } from 'lucide-react';
import BufferTimeSettings from '@/components/settings/buffer-time-settings';
import GoogleCalendarSettings from '@/components/settings/google-calendar-settings';
import RecurringAppointmentsGuide from '@/components/appointments/recurring-guide';
import { WaitlistSettingsComponent } from '@/components/settings/waitlist-settings';
import { WaitlistGuide } from '@/components/waitlist/waitlist-guide';
import { useWaitlist } from '@/hooks/use-waitlist';
import { SmsReminderSettings } from '@/components/settings/sms-reminder-settings';
import { SmsRemindersGuide } from '@/components/sms/sms-reminders-guide';
import { useSmsReminders } from '@/hooks/use-sms-reminders';
import { MobileDragDropSettings } from '@/components/settings/mobile-drag-drop-settings';
import { MobileDragDropGuide } from '@/components/mobile/mobile-drag-drop-guide';
import { BookingLockSettings } from '@/components/settings/booking-lock-settings';
import { BookingLockGuide } from '@/components/booking/booking-lock-guide';
import { useState } from 'react';
import { loadMobileDragConfig, saveMobileDragConfig, MobileDragConfig } from '@/lib/utils/mobile-drag-drop';
import { loadBookingLockConfig, saveBookingLockConfig, BookingLockConfig } from '@/lib/utils/booking-lock';

export default function ConfiguracionPage() {
  const { settings, updateSettings } = useWaitlist();
  const { config: smsConfig, updateConfig: updateSmsConfig } = useSmsReminders();
  const [mobileDragConfig, setMobileDragConfig] = useState<MobileDragConfig>(loadMobileDragConfig());
  const [bookingLockConfig, setBookingLockConfig] = useState<BookingLockConfig>(loadBookingLockConfig());

  const handleMobileDragConfigChange = (updates: Partial<MobileDragConfig>) => {
    const updated = { ...mobileDragConfig, ...updates };
    setMobileDragConfig(updated);
    saveMobileDragConfig(updates);
  };

  const handleBookingLockConfigChange = (updates: Partial<BookingLockConfig>) => {
    const updated = { ...bookingLockConfig, ...updates };
    setBookingLockConfig(updated);
    saveBookingLockConfig(updates);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
        </div>
        <p className="text-gray-600">
          Configura el comportamiento de la agenda, notificaciones y otras opciones del sistema
        </p>
      </div>

      <Tabs defaultValue="agenda" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="agenda" className="gap-2">
            <Calendar className="h-4 w-4" />
            Agenda
          </TabsTrigger>
          <TabsTrigger value="notificaciones" className="gap-2">
            <Bell className="h-4 w-4" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-2">
            <Users className="h-4 w-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agenda" className="space-y-6">
          <div className="space-y-6">
            <BufferTimeSettings />
            
            {/* Drag and Drop Guide */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-1">
                    Arrastrar y Soltar Citas Activado
                  </h3>
                  <p className="text-sm text-blue-800 mb-3">
                    Ahora puedes mover citas fácilmente arrastrándolas entre horarios y días. 
                    Las citas programadas y confirmadas pueden moverse libremente.
                  </p>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p>• <strong>Citas movibles:</strong> Programadas, Confirmadas, Pendiente</p>
                    <p>• <strong>No movibles:</strong> Completadas, Canceladas, Fechas pasadas</p>
                    <p>• <strong>Feedback visual:</strong> Verde = válido, Rojo = conflicto</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recurring Appointments Guide */}
            <RecurringAppointmentsGuide />

            {/* Google Calendar Integration */}
            <GoogleCalendarSettings />

            {/* Waitlist Automation */}
            <WaitlistGuide />
            <WaitlistSettingsComponent 
              settings={settings} 
              onSettingsChange={updateSettings}
            />

            {/* Mobile Drag & Drop */}
            <MobileDragDropGuide />
            <MobileDragDropSettings 
              config={mobileDragConfig}
              onConfigChange={handleMobileDragConfigChange}
            />

            {/* Double-Booking Prevention */}
            <BookingLockGuide />
            <BookingLockSettings 
              config={bookingLockConfig}
              onConfigChange={handleBookingLockConfigChange}
            />
          </div>
        </TabsContent>

        <TabsContent value="notificaciones" className="space-y-6">
          <div className="space-y-6">
            {/* SMS Reminders */}
            <SmsRemindersGuide />
            <SmsReminderSettings 
              config={smsConfig}
              onConfigChange={updateSmsConfig}
            />
            
            {/* Future notification settings */}
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Más notificaciones próximamente</p>
              <p className="text-sm">Email, WhatsApp, Push notifications, etc.</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="usuarios" className="space-y-6">
          <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center text-gray-500">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Gestión de Usuarios y Permisos</p>
            <p className="text-sm">Roles, permisos, horarios de doctores - Próximamente</p>
          </div>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center text-gray-500">
            <Settings className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Configuración General</p>
            <p className="text-sm">Idioma, zona horaria, personalización - Próximamente</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
