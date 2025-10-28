'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Only show prompt if not installed and not dismissed recently
    const dismissedAt = localStorage.getItem('pwa-prompt-dismissed');
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    if (dismissedAt && parseInt(dismissedAt) > oneDayAgo) {
      return;
    }

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after 5 seconds to avoid annoying users immediately
      setTimeout(() => {
        if (!standalone) {
          setShowPrompt(true);
        }
      }, 5000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS, show instructions after 5 seconds
    if (iOS && !standalone) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  // Don't show if already installed or dismissed
  if (!showPrompt || isStandalone) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-2xl shadow-2xl p-6 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-lg transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Instalar AgendaMedPro</h3>
              <p className="text-sm text-white/90">Acceso rápido desde tu inicio</p>
            </div>
          </div>

          <p className="text-sm text-white/90 mb-4">
            {isIOS 
              ? '📱 Toca el botón de compartir y selecciona "Agregar a pantalla de inicio"'
              : 'Instala la app para acceso rápido, notificaciones y modo offline.'
            }
          </p>

          {!isIOS && deferredPrompt && (
            <Button
              onClick={handleInstallClick}
              className="w-full bg-white text-emerald-600 hover:bg-white/90 font-semibold shadow-lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Instalar Aplicación
            </Button>
          )}

          {isIOS && (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-sm">
              <p className="font-medium mb-2">Instrucciones iOS:</p>
              <ol className="list-decimal list-inside space-y-1 text-white/90">
                <li>Toca el botón de compartir (⬆️)</li>
                <li>Selecciona "Agregar a pantalla de inicio"</li>
                <li>Toca "Agregar"</li>
              </ol>
            </div>
          )}

          <button
            onClick={handleDismiss}
            className="w-full mt-3 text-sm text-white/70 hover:text-white transition-colors"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}
