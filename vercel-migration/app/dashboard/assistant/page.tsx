'use client';

import { AIChat } from '@/components/ai-chat';
import { Sparkles } from 'lucide-react';

export default function AssistantPage() {
  return (
    <div className="h-screen flex flex-col p-6 bg-gradient-to-br from-slate-900 via-purple-900/10 to-slate-900">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-2">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">
            Asistente IA
          </h1>
        </div>
        <p className="text-white/60">
          Tu asistente inteligente para gestionar tu consultorio
        </p>
      </div>

      <div className="flex-1 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
        <AIChat />
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="rounded-lg bg-white/5 border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <h3 className="font-semibold text-white text-sm">Conectado</h3>
          </div>
          <p className="text-xs text-white/60">
            Claude 3.5 Sonnet activo
          </p>
        </div>

        <div className="rounded-lg bg-white/5 border border-white/10 p-4">
          <h3 className="font-semibold text-white text-sm mb-2">
            Capacidades
          </h3>
          <p className="text-xs text-white/60">
            Consultar citas, buscar pacientes, estadísticas
          </p>
        </div>

        <div className="rounded-lg bg-white/5 border border-white/10 p-4">
          <h3 className="font-semibold text-white text-sm mb-2">
            Próximamente
          </h3>
          <p className="text-xs text-white/60">
            Crear citas, enviar mensajes, generar reportes
          </p>
        </div>
      </div>
    </div>
  );
}
