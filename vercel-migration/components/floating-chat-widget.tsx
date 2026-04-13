'use client';

import { useState } from 'react';
import { MessageCircle, X, Sparkles } from 'lucide-react';
import { AIChat } from './ai-chat';
import { GlassPanel } from './ui/glass-panel';

export function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botón flotante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500 shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-500/70 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center group"
          aria-label="Abrir asistente IA"
        >
          <Sparkles className="h-6 w-6 text-white group-hover:rotate-12 transition-transform" />
          
          {/* Pulso de notificación */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500 border-2 border-white"></span>
          </span>
        </button>
      )}

      {/* Modal del chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] animate-in slide-in-from-bottom-4 duration-300">
          <GlassPanel className="h-full flex flex-col overflow-hidden shadow-2xl">
            {/* Header del modal */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-emerald-400/20 via-teal-400/20 to-cyan-500/20 p-2 backdrop-blur-xl border border-white/10">
                  <Sparkles className="h-5 w-5 text-cyan-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Asistente IA</h3>
                  <p className="text-xs text-white/60">Estoy aquí para ayudarte</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 hover:bg-white/10 transition-colors"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5 text-white/70" />
              </button>
            </div>

            {/* Contenedor del chat */}
            <div className="flex-1 overflow-hidden">
              <AIChat compact />
            </div>
          </GlassPanel>
        </div>
      )}
    </>
  );
}
