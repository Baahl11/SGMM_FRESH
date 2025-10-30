'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Calendar, Clock, User } from 'lucide-react';

interface SyncConflict {
  appointmentId: number;
  googleEventId: string;
  conflicts: string[];
  localData: {
    date: string;
    time: string;
    patientName: string;
    status: string;
  };
  googleData: {
    date: string;
    time: string;
    summary: string;
    status: string;
  };
}

interface SyncConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflict: SyncConflict;
  onResolve: (resolution: 'local' | 'google' | 'skip') => void;
}

export default function SyncConflictDialog({
  open,
  onOpenChange,
  conflict,
  onResolve
}: SyncConflictDialogProps) {
  const [resolution, setResolution] = useState<'local' | 'google' | 'skip'>('local');

  const handleResolve = () => {
    onResolve(resolution);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Conflicto de Sincronización
          </DialogTitle>
          <DialogDescription>
            Se detectaron diferencias entre AgendaMedPro y Google Calendar
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Conflict Details */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Diferencias encontradas:</p>
            <div className="flex flex-wrap gap-2">
              {conflict.conflicts.map((diff, index) => (
                <Badge key={index} variant="outline" className="bg-orange-50 text-orange-800 border-orange-300">
                  {diff}
                </Badge>
              ))}
            </div>
          </div>

          {/* Comparison */}
          <div className="grid grid-cols-2 gap-4">
            {/* Local Data */}
            <div className="rounded-lg border-2 border-blue-200 p-4 bg-blue-50">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-blue-600" />
                <p className="font-semibold text-blue-900">AgendaMedPro (Local)</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-blue-600" />
                  <span className="text-blue-800">
                    {new Date(conflict.localData.date).toLocaleDateString('es-ES', { 
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short' 
                    })} • {conflict.localData.time}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-blue-600" />
                  <span className="text-blue-800">{conflict.localData.patientName}</span>
                </div>
                <div>
                  <Badge variant="secondary" className="text-xs">
                    {conflict.localData.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Google Data */}
            <div className="rounded-lg border-2 border-green-200 p-4 bg-green-50">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-green-600" />
                <p className="font-semibold text-green-900">Google Calendar</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-green-600" />
                  <span className="text-green-800">
                    {new Date(conflict.googleData.date).toLocaleDateString('es-ES', { 
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short' 
                    })} • {conflict.googleData.time}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-green-600" />
                  <span className="text-green-800">{conflict.googleData.summary}</span>
                </div>
                <div>
                  <Badge variant="secondary" className="text-xs bg-green-200">
                    {conflict.googleData.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Resolution Options */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">¿Qué versión deseas mantener?</Label>
            <RadioGroup value={resolution} onValueChange={(v) => setResolution(v as any)}>
              <div className="flex items-start space-x-3 rounded-lg border-2 p-4 hover:bg-blue-50 transition-colors cursor-pointer"
                   onClick={() => setResolution('local')}>
                <RadioGroupItem value="local" id="local" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="local" className="cursor-pointer font-medium">
                    Mantener AgendaMedPro (Local)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Actualizar Google Calendar con los datos de AgendaMedPro
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 rounded-lg border-2 p-4 hover:bg-green-50 transition-colors cursor-pointer"
                   onClick={() => setResolution('google')}>
                <RadioGroupItem value="google" id="google" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="google" className="cursor-pointer font-medium">
                    Mantener Google Calendar
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Actualizar AgendaMedPro con los datos de Google Calendar
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 rounded-lg border-2 p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                   onClick={() => setResolution('skip')}>
                <RadioGroupItem value="skip" id="skip" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="skip" className="cursor-pointer font-medium">
                    Omitir este conflicto
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    No hacer cambios, mantener ambas versiones diferentes
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleResolve}>
            Resolver Conflicto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
