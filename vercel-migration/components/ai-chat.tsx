'use client';

import { Send, Bot, Sparkles, User } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { GlassPanel } from '@/components/ui/glass-panel';
import { createClient } from '@/lib/supabase/client';

interface AIChatProps {
  compact?: boolean; // Para modo widget flotante
}

export function AIChat({ compact = false }: AIChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input, id: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Obtener el token de sesión de Supabase
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: HeadersInit = { 
        'Content-Type': 'application/json'
      };
      
      // Agregar token de autorización si existe
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          userId: session?.user?.id ?? null,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `API error (${response.status})`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      if (reader) {
        const assistantId = Date.now() + 1;
        setMessages(prev => [...prev, { role: 'assistant', content: '', id: assistantId }]);

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });

            // Stream de texto plano directo
            assistantMessage += chunk;
            
            // Actualizar el mensaje en tiempo real
            setMessages(prev => 
              prev.map(m => m.id === assistantId ? { ...m, content: assistantMessage } : m)
            );
          }

          if (!assistantMessage.trim()) {
            setMessages(prev => 
              prev.map(m => m.id === assistantId ? {
                ...m,
                content: 'No pude generar una respuesta en este momento. Intenta nuevamente en unos segundos.',
                error: true,
              } : m)
            );
          }
        } catch (streamError) {
          console.error('Stream error:', streamError);
          throw streamError;
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Lo siento, ocurrió un error al procesar tu mensaje. Por favor intenta de nuevo.', 
        id: Date.now() + 1,
        error: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header con estilo glass/aura - solo en modo normal */}
      {!compact && (
      <GlassPanel className="border-b border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-emerald-400/20 via-teal-400/20 to-cyan-500/20 p-3 backdrop-blur-xl border border-white/10 shadow-lg">
            <Sparkles className="h-5 w-5 text-cyan-300" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Asistente IA</h2>
            <p className="text-sm text-white/60">
              Pregúntame sobre citas, pacientes o tu agenda
            </p>
          </div>
        </div>
      </GlassPanel>
      )}

      {/* Messages con estilo glass/aura */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-6 max-w-2xl">
              <div className="inline-block">
                <GlassPanel className="p-8 rounded-3xl">
                  <Bot className="h-16 w-16 text-cyan-300 mx-auto" />
                </GlassPanel>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-white">
                  ¡Hola! Soy tu Asistente IA
                </h3>
                <p className="text-white/70 text-lg">
                  Puedo ayudarte a gestionar tu consultorio
                </p>
              </div>
              <div className="grid gap-3 mt-8">
                <GlassPanel
                  onClick={() => {
                    setInput('¿Cómo funciona el sistema de citas?');
                    setTimeout(() => document.querySelector('form')?.requestSubmit(), 100);
                  }}
                  className="p-4 cursor-pointer hover:bg-white/10 transition-all group"
                >
                  <p className="text-white/90 group-hover:text-white transition-colors">
                    ¿Cómo funciona el sistema de citas?
                  </p>
                </GlassPanel>
                <GlassPanel
                  onClick={() => {
                    setInput('Dame consejos para mejorar la gestión de pacientes');
                    setTimeout(() => document.querySelector('form')?.requestSubmit(), 100);
                  }}
                  className="p-4 cursor-pointer hover:bg-white/10 transition-all group"
                >
                  <p className="text-white/90 group-hover:text-white transition-colors">
                    Dame consejos para mejorar la gestión de pacientes
                  </p>
                </GlassPanel>
                <GlassPanel
                  onClick={() => {
                    setInput('¿Qué funcionalidades tiene AgendaMedPro?');
                    setTimeout(() => document.querySelector('form')?.requestSubmit(), 100);
                  }}
                  className="p-4 cursor-pointer hover:bg-white/10 transition-all group"
                >
                  <p className="text-white/90 group-hover:text-white transition-colors">
                    ¿Qué funcionalidades tiene AgendaMedPro?
                  </p>
                </GlassPanel>
              </div>
            </div>
          </div>
        )}

        {messages.map((message: any) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="rounded-xl bg-gradient-to-br from-emerald-400/20 via-teal-400/20 to-cyan-500/20 p-2 h-10 w-10 flex-shrink-0 backdrop-blur-xl border border-white/10">
                <Bot className="h-6 w-6 text-cyan-300" />
              </div>
            )}

            <GlassPanel
              className={`max-w-[75%] p-4 ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-emerald-500/30'
                  : message.error
                  ? 'bg-red-500/10 border-red-500/30'
                  : ''
              }`}
            >
              <div className="prose prose-invert prose-sm max-w-none">
                {message.content.split('\n').map((line: string, i: number) => (
                  <p key={i} className="mb-2 last:mb-0 text-white/90">
                    {line || '\u00A0'}
                  </p>
                ))}
              </div>
            </GlassPanel>

            {message.role === 'user' && (
              <div className="rounded-xl bg-white/10 p-2 h-10 w-10 flex-shrink-0 backdrop-blur-xl border border-white/10">
                <User className="h-6 w-6 text-white/80" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="rounded-xl bg-gradient-to-br from-emerald-400/20 via-teal-400/20 to-cyan-500/20 p-2 h-10 w-10 flex-shrink-0 backdrop-blur-xl border border-white/10 animate-pulse">
              <Bot className="h-6 w-6 text-cyan-300" />
            </div>
            <GlassPanel className="p-4">
              <div className="flex gap-2">
                <div className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce" />
                <div className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </GlassPanel>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input con estilo glass/aura */}
      <GlassPanel className="border-t border-white/10 p-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta..."
            disabled={isLoading}
            className="flex-1 rounded-2xl bg-white/5 border border-white/20 px-6 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all backdrop-blur-xl"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-2xl bg-gradient-to-br from-emerald-400/90 via-teal-400/90 to-cyan-500/90 px-6 py-3 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-cyan-500/20"
          >
            <Send className="h-5 w-5 text-white" />
          </button>
        </form>
        <p className="text-xs text-white/40 mt-2 text-center">
          El asistente puede cometer errores. Verifica la información importante.
        </p>
      </GlassPanel>
    </div>
  );
}
