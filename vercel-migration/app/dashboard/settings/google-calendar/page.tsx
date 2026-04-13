'use client';

import { Suspense } from 'react';
import GoogleCalendarSettings from '@/components/settings/google-calendar-settings';
import { Loader2 } from 'lucide-react';

function GoogleCalendarContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Google Calendar</h1>
        <p className="text-muted-foreground">
          Sincroniza tus citas con Google Calendar para verlas en tu teléfono
        </p>
      </div>
      
      <GoogleCalendarSettings />
    </div>
  );
}

export default function GoogleCalendarPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <GoogleCalendarContent />
    </Suspense>
  );
}
