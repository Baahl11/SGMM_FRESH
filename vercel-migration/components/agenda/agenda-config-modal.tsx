"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BufferTimeSettings from '@/components/settings/buffer-time-settings';
import { WaitlistSettingsComponent } from '@/components/settings/waitlist-settings';
import { MobileDragDropSettings } from '@/components/settings/mobile-drag-drop-settings';
import { BookingLockSettings } from '@/components/settings/booking-lock-settings';
import GoogleCalendarSettings from '@/components/settings/google-calendar-settings';
import { SmsReminderSettings } from '@/components/settings/sms-reminder-settings';
import { useState, useEffect } from 'react';
import { 
  loadMobileDragConfig, 
  saveMobileDragConfig, 
  type MobileDragConfig 
} from '@/lib/utils/mobile-drag-drop';
import { 
  loadBookingLockConfig, 
  saveBookingLockConfig, 
  type BookingLockConfig 
} from '@/lib/utils/booking-lock';
import {
  loadSmsConfig,
  saveSmsConfig,
  type SmsReminderConfig
} from '@/lib/utils/sms-reminders';

interface AgendaConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AgendaConfigModal({ isOpen, onClose }: AgendaConfigModalProps) {
  const [mobileDragConfig, setMobileDragConfig] = useState<MobileDragConfig | null>(null);
  const [bookingLockConfig, setBookingLockConfig] = useState<BookingLockConfig | null>(null);
  const [smsConfig, setSmsConfig] = useState<SmsReminderConfig | null>(null);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    // Load all configs on mount (client-side only)
    setMobileDragConfig(loadMobileDragConfig());
    setBookingLockConfig(loadBookingLockConfig());
    setSmsConfig(loadSmsConfig());
    
    const saved = localStorage.getItem('agenda-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const updateSettings = (newSettings: any) => {
    setSettings(newSettings);
    localStorage.setItem('agenda-settings', JSON.stringify(newSettings));
  };

  const handleMobileDragConfigChange = (updates: Partial<MobileDragConfig>) => {
    if (!mobileDragConfig) return;
    const newConfig = { ...mobileDragConfig, ...updates };
    setMobileDragConfig(newConfig);
    saveMobileDragConfig(newConfig);
  };

  const handleBookingLockConfigChange = (updates: Partial<BookingLockConfig>) => {
    if (!bookingLockConfig) return;
    const newConfig = { ...bookingLockConfig, ...updates };
    setBookingLockConfig(newConfig);
    saveBookingLockConfig(newConfig);
  };

  const updateSmsConfig = (updates: Partial<SmsReminderConfig>) => {
    if (!smsConfig) return;
    const newConfig = { ...smsConfig, ...updates };
    setSmsConfig(newConfig);
    saveSmsConfig(newConfig);
  };

  // Don't render until configs are loaded
  if (!mobileDragConfig || !bookingLockConfig || !smsConfig) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Configuración de Agenda</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="integraciones">Integraciones</TabsTrigger>
            <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <BufferTimeSettings />
            <WaitlistSettingsComponent 
              settings={settings} 
              onSettingsChange={updateSettings}
            />
            <MobileDragDropSettings 
              config={mobileDragConfig}
              onConfigChange={handleMobileDragConfigChange}
            />
            <BookingLockSettings 
              config={bookingLockConfig}
              onConfigChange={handleBookingLockConfigChange}
            />
          </TabsContent>

          <TabsContent value="integraciones" className="space-y-4 mt-4">
            <GoogleCalendarSettings />
          </TabsContent>

          <TabsContent value="notificaciones" className="space-y-4 mt-4">
            <SmsReminderSettings 
              config={smsConfig}
              onConfigChange={updateSmsConfig}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
