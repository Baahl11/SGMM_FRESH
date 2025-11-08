'use client';

import { useState, useEffect } from 'react';
import { X, Share, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function IOSInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const hasSeenPrompt = localStorage.getItem('ios-install-prompt-dismissed');

    // Show prompt if iOS, not in standalone mode, and hasn't been dismissed
    if (isIOS && !isStandalone && !hasSeenPrompt) {
      // Wait 2 seconds before showing
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('ios-install-prompt-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xl animate-slide-up">
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-10 w-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <line x1="12" y1="14" x2="12" y2="18" />
                  <line x1="10" y1="16" x2="14" y2="16" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg">Instala AgendaMedPro</h3>
                <p className="text-sm text-white/90">Acceso rápido desde tu pantalla de inicio</p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="bg-white/20 rounded px-2 py-1 font-semibold">1</span>
                <span>Presiona el botón</span>
                <Share className="h-4 w-4" />
                <span className="font-semibold">Compartir</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="bg-white/20 rounded px-2 py-1 font-semibold">2</span>
                <span>Selecciona</span>
                <Plus className="h-4 w-4" />
                <span className="font-semibold">Agregar a Pantalla de Inicio</span>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-8 w-8 text-white hover:bg-white/20 flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
