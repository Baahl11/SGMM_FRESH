"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  User, 
  Send, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  MessageSquare,
  Lightbulb,
  ChevronDown
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ApiService from '@/lib/api-service';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: string;
  contextUsed?: boolean;
}

interface AIStatus {
  ollama_available: boolean;
  model: string;
  status: string;
  error?: string;
}

const AIAssistantChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiStatus, setAIStatus] = useState<AIStatus | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Ejemplos de consultas completas del sistema
  const exampleQueries = [
    "¿Cuáles son las citas de hoy?",
    "¿Cuántos pacientes tenemos registrados?",
    "Estado del inventario y alertas",
    "Resumen financiero del mes",
    "¿Qué tratamientos son más populares?",
    "Buscar paciente Juan", 
    "¿Cuáles son los gastos fijos mensuales?",
    "¿Tenemos stock bajo de algún producto?",
    "Estadísticas del consultorio",
    "¿Cuáles son los próximos pacientes?",
    "Margen de ganancia actual",
    "¿Cómo agregar un nuevo paciente?"
  ];

  useEffect(() => {
    // Verificar estado del AI al cargar
    checkAIStatus();
  }, []);

  useEffect(() => {
    // Scroll automático al final cuando cambien los mensajes
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const checkAIStatus = async () => {
    try {
      // Usar ApiService para conectar directamente al backend Rust
      const response = await ApiService.getAIStatus();
      
      if (response.data) {
        setAIStatus(response.data);
      } else {
        setAIStatus({
          ollama_available: false,
          model: 'unknown',
          status: 'error',
          error: response.error || 'No se pudo conectar con el servicio'
        });
      }
    } catch (error) {
      console.error('Error checking AI status:', error);
      setAIStatus({
        ollama_available: false,
        model: 'unknown',
        status: 'error',
        error: 'No se pudo conectar con el servicio'
      });
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Usar ApiService para conectar directamente al backend Rust
      const response = await ApiService.queryAI(userMessage.content, true);

      if (response.data && response.data.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: response.data.response,
          timestamp: new Date().toISOString(),
          contextUsed: true // Siempre tenemos contexto del sistema
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'system',
          content: `Error: ${response.data?.message || response.error || 'No se pudo procesar la consulta'}`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: `Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const useExampleQuery = (query: string) => {
    setInputValue(query);
  };

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  const handleScroll = (e: React.UIEvent) => {
    const target = e.target as HTMLDivElement;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 50;
    setShowScrollButton(!isNearBottom && messages.length > 0);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
          size="icon"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-96 h-[600px] shadow-2xl border-0 bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-sm">Asistente Médico AI</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              {aiStatus && (
                <Badge 
                  variant={aiStatus.ollama_available ? "default" : "destructive"}
                  className="text-xs"
                >
                  {aiStatus.status}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </div>
          
          {aiStatus && !aiStatus.ollama_available && (
            <Alert className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Servicio AI no disponible. Verifique que Ollama esté ejecutándose.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent className="flex flex-col h-[520px] p-3 relative">
          {/* Área de mensajes */}
          <ScrollArea 
            ref={scrollAreaRef} 
            className="flex-1 mb-3 max-h-[440px]"
            onScrollCapture={handleScroll}
          >
            <div className="space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-4">
                  <Bot className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 mb-3">
                    ¡Hola! Soy tu asistente médico AI. ¿En qué puedo ayudarte?
                  </p>
                  
                  <div className="text-left">
                    <div className="flex items-center text-xs text-gray-600 mb-2">
                      <Lightbulb className="h-3 w-3 mr-1" />
                      Ejemplos de consultas:
                    </div>
                    <div className="space-y-1">
                      {exampleQueries.slice(0, 3).map((query, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1 text-xs text-left justify-start w-full"
                          onClick={() => useExampleQuery(query)}
                        >
                          • {query}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-2 ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.type === 'ai'
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.type === 'ai' && <Bot className="h-4 w-4 mt-0.5 text-blue-600" />}
                      {message.type === 'user' && <User className="h-4 w-4 mt-0.5" />}
                      {message.type === 'system' && <AlertCircle className="h-4 w-4 mt-0.5" />}
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs opacity-70">
                            {new Date(message.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          
                          {message.type === 'ai' && message.contextUsed && (
                            <Badge variant="secondary" className="text-xs ml-1">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Datos
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-2 flex items-center space-x-2">
                    <Bot className="h-4 w-4 text-blue-600" />
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-gray-600">Pensando...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Botón para bajar al final */}
          {showScrollButton && (
            <Button
              onClick={scrollToBottom}
              size="sm"
              variant="secondary"
              className="absolute right-6 bottom-20 z-10 h-8 w-8 rounded-full p-0 shadow-md"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          )}

          <Separator className="mb-3" />

          {/* Input area */}
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu consulta..."
              disabled={isLoading || (aiStatus?.ollama_available === false)}
              className="flex-1 text-sm"
            />
            <Button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading || (aiStatus?.ollama_available === false)}
              size="sm"
              className="px-3"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAssistantChat;
