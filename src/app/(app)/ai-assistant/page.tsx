"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  MessageSquare, 
  Settings, 
  HelpCircle,
  Send,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { AIStatusCard } from '@/components/ai';
import ApiService from '@/lib/api-service';
import { toast } from 'sonner';

interface HelpData {
  description: string;
  capabilities: string[];
  example_queries: string[];
  tips: string[];
}

const AIAssistantPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [helpData, setHelpData] = useState<HelpData | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const exampleQueries = [
    "¿Cuáles son las próximas citas?",
    "Buscar paciente Juan Pérez",
    "Estado del inventario",
    "¿Qué tratamientos tenemos disponibles?",
    "Historial de María García",
    "¿Qué items están en bajo stock?",
    "Mostrar citas de hoy",
    "¿Cuál es el tratamiento más caro?",
    "Pacientes con más de 5 tratamientos",
    "Teléfono de [nombre del paciente]"
  ];

  useEffect(() => {
    loadHelpData();
  }, []);

  const loadHelpData = async () => {
    try {
      // const response = await ApiService.getAIHelp();
      // if (response.data) {
      //   setHelpData(response.data);
      // }
      console.log('AI Help data loading temporarily disabled');
    } catch (error) {
      console.error('Error loading help data:', error);
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setResponse('');

    try {
      const result = await ApiService.queryAI(query.trim());
      
      if (result.data) {
        setResponse(result.data.response);
        toast.success('Consulta procesada correctamente');
      } else {
        setResponse(`Error: ${result.error}`);
        toast.error(result.error || 'Error procesando consulta');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setResponse(`Error: ${errorMessage}`);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const useExampleQuery = (exampleQuery: string) => {
    setQuery(exampleQuery);
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success('Copiado al portapapeles');
      
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      toast.error('Error copiando al portapapeles');
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Bot className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Asistente AI</h1>
          <p className="text-muted-foreground">
            Consulta inteligente de información médica
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel principal de consultas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Área de consulta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Realizar Consulta</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pregunta o consulta:</label>
                <Textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ejemplo: ¿Cuáles son las próximas citas?"
                  className="min-h-[100px]"
                />
              </div>
              
              <Button 
                onClick={handleQuery}
                disabled={!query.trim() || loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Bot className="h-4 w-4 mr-2 animate-pulse" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Consulta
                  </>
                )}
              </Button>

              {response && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Respuesta del AI:</label>
                  <div className="p-4 bg-gray-50 border rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {response}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ejemplos de consultas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <HelpCircle className="h-5 w-5" />
                <span>Ejemplos de Consultas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {exampleQueries.map((example, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => useExampleQuery(example)}
                      className="flex-1 justify-start text-left h-auto py-2 px-3"
                    >
                      <span className="truncate">{example}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(example, index)}
                      className="h-8 w-8 p-0"
                    >
                      {copiedIndex === index ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Estado del AI */}
          <AIStatusCard />

          {/* Información de ayuda */}
          {helpData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Capacidades</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">El asistente puede:</h4>
                  <ul className="text-sm space-y-1">
                    {helpData.capabilities.map((capability, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{capability}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Consejos de uso:</h4>
                  <ul className="text-sm space-y-1">
                    {helpData.tips.map((tip, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Información técnica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Técnica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Modelo:</span>
                <Badge variant="outline">llama3.2:3b</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Procesamiento:</span>
                <Badge variant="outline">Local</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Datos:</span>
                <Badge variant="outline">En tiempo real</Badge>
              </div>
              
              <Separator />
              
              <div className="text-xs text-muted-foreground">
                <p>• Los datos nunca salen de tu servidor</p>
                <p>• El AI solo consulta, nunca modifica</p>
                <p>• Todas las consultas se registran</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;
