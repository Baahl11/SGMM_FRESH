"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import ApiService from '@/lib/api-service';

interface AIStatusData {
  ollama_available: boolean;
  model: string;
  base_url: string;
  status: string;
  error?: string;
}

const AIStatusCard: React.FC = () => {
  const [status, setStatus] = useState<AIStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const response = await ApiService.getAIStatus();
      if (response.data) {
        setStatus(response.data);
        setLastChecked(new Date());
      } else {
        setStatus({
          ollama_available: false,
          model: 'unknown',
          base_url: 'unknown',
          status: 'error',
          error: response.error || 'Error desconocido'
        });
      }
    } catch (error) {
      setStatus({
        ollama_available: false,
        model: 'unknown',
        base_url: 'unknown',
        status: 'error',
        error: 'No se pudo verificar el estado'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    
    // Verificar estado cada 30 segundos
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    if (loading) return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    
    if (status?.ollama_available) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = () => {
    if (loading) {
      return <Badge variant="secondary">Verificando...</Badge>;
    }
    
    if (!status) {
      return <Badge variant="destructive">Error</Badge>;
    }
    
    switch (status.status) {
      case 'online':
        return <Badge variant="default" className="bg-green-500">En línea</Badge>;
      case 'offline':
        return <Badge variant="destructive">Desconectado</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">{status.status}</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Asistente AI</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
            <Button
              variant="ghost"
              size="sm"
              onClick={checkStatus}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Estado principal */}
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <p className="font-medium">
                {status?.ollama_available ? 'Servicio disponible' : 'Servicio no disponible'}
              </p>
              {lastChecked && (
                <p className="text-sm text-muted-foreground">
                  Última verificación: {lastChecked.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          {/* Información técnica */}
          {status && (
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Modelo:</span>
                <span className="font-mono">{status.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">URL:</span>
                <span className="font-mono text-xs">{status.base_url}</span>
              </div>
            </div>
          )}

          {/* Error o advertencias */}
          {status?.error && (
            <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-xs text-red-600">{status.error}</p>
              </div>
            </div>
          )}

          {/* Instrucciones si no está disponible */}
          {status && !status.ollama_available && !loading && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm font-medium text-blue-800 mb-1">Para activar el AI:</p>
              <ol className="text-xs text-blue-600 space-y-1">
                <li>1. Instala Ollama: <code>.\setup_ollama_simple.ps1</code></li>
                <li>2. Inicia el servicio: <code>ollama serve</code></li>
                <li>3. Reinicia el backend</li>
              </ol>
            </div>
          )}

          {/* Capacidades cuando está disponible */}
          {status?.ollama_available && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm font-medium text-green-800 mb-2">Capacidades disponibles:</p>
              <div className="grid grid-cols-2 gap-1 text-xs text-green-600">
                <span>• Buscar pacientes</span>
                <span>• Consultar citas</span>
                <span>• Estado inventario</span>
                <span>• Info tratamientos</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AIStatusCard;
