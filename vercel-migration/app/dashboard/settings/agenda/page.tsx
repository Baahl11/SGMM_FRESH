'use client';

import { useState, useEffect } from 'react';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Calendar, Clock, Users, Smartphone, Shield, Loader2 } from 'lucide-react';
import BufferTimeSettings from '@/components/settings/buffer-time-settings';
import { WaitlistSettingsComponent } from '@/components/settings/waitlist-settings';
import { MobileDragDropSettings } from '@/components/settings/mobile-drag-drop-settings';
import { BookingLockSettings } from '@/components/settings/booking-lock-settings';
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

export default function AgendaSettingsPage() {
  const [mobileDragConfig, setMobileDragConfig] = useState<MobileDragConfig | null>(null);
  const [bookingLockConfig, setBookingLockConfig] = useState<BookingLockConfig | null>(null);
  const [settings, setSettings] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load all configs on mount (client-side only)
    setMobileDragConfig(loadMobileDragConfig());
    setBookingLockConfig(loadBookingLockConfig());
    
    const saved = localStorage.getItem('agenda-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
    setIsLoading(false);
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

  if (isLoading || !mobileDragConfig || !bookingLockConfig) {
    return (
      <GlassPanel className="border-white/10 bg-white/5 p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-white/50" />
        </div>
      </GlassPanel>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassPanel className="border-white/10 bg-white/5 p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Configuración de Agenda</h1>
            <p className="text-white/60">Ajustes de comportamiento, tiempos y experiencia de usuario</p>
          </div>
        </div>
      </GlassPanel>

      {/* Buffer Time */}
      <BufferTimeSettings />

      {/* Waitlist */}
      <WaitlistSettingsComponent 
        settings={settings} 
        onSettingsChange={updateSettings}
      />

      {/* Mobile Drag & Drop */}
      <MobileDragDropSettings 
        config={mobileDragConfig}
        onConfigChange={handleMobileDragConfigChange}
      />

      {/* Booking Lock */}
      <BookingLockSettings 
        config={bookingLockConfig}
        onConfigChange={handleBookingLockConfigChange}
      />
    </div>
  );
}
