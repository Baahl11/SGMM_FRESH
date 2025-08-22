'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Send, 
  Phone, 
  Clock, 
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppTestPage() {
  const [phone, setPhone] = useState('+52 55 1234 5678');
  const [patientName, setPatientName] = useState('Juan Pérez');
  const [appointmentDate, setAppointmentDate] = useState('2025-08-15');
  const [appointmentTime, setAppointmentTime] = useState('10:00 AM');
  const [customMessage, setCustomMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('appointment_reminder');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const templates = [
    {
      id: 'appointment_reminder',
      name: 'Recordatorio de Cita',
      template: 'Hola {nombre_paciente}! 👋 Recordatorio: Tienes cita médica el {fecha_cita} a las {hora_cita}. Te esperamos en SGMM 🏥',
      icon: '📅'
    },
    {
      id: 'confirmation',
      name: 'Confirmación de Cita',
      template: '✅ Cita confirmada para {nombre_paciente} el {fecha_cita} a las {hora_cita}. ¡Nos vemos pronto!',
      icon: '✅'
    },
    {
      id: 'cancellation',
      name: 'Cancelación de Cita',
      template: '❌ Tu cita del {fecha_cita} a las {hora_cita} ha sido cancelada. Contacta para reagendar.',
      icon: '❌'
    },
    {
      id: 'custom',
      name: 'Mensaje Personalizado',
      template: '',
      icon: '✏️'
    }
  ];

  const sendWhatsAppDemo = async () => {
    setLoading(true);
    try {
      const selectedTemplateObj = templates.find(t => t.id === selectedTemplate);
      let message = selectedTemplate === 'custom' ? customMessage : selectedTemplateObj?.template || '';
      
      // Reemplazar variables en la plantilla
      message = message
        .replace('{nombre_paciente}', patientName)
        .replace('{fecha_cita}', appointmentDate)
        .replace('{hora_cita}', appointmentTime);

      const response = await fetch('/api/messaging/whatsapp/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          message,
          patient_name: patientName,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setLastResult(result);
        toast.success('Mensaje de WhatsApp enviado (modo demo)');
      } else {
        toast.error('Error al enviar mensaje de WhatsApp');
      }
    } catch (error) {
      console.error('Error sending WhatsApp demo:', error);
      toast.error('Error al enviar mensaje');
    } finally {
      setLoading(false);
    }
  };

  const getPreviewMessage = () => {
    const selectedTemplateObj = templates.find(t => t.id === selectedTemplate);
    let message = selectedTemplate === 'custom' ? customMessage : selectedTemplateObj?.template || '';
    
    return message
      .replace('{nombre_paciente}', patientName)
      .replace('{fecha_cita}', appointmentDate)
      .replace('{hora_cita}', appointmentTime);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-green-900 dark:to-blue-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 via-blue-600 to-indigo-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <MessageSquare className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Prueba de WhatsApp</h1>
              <p className="text-green-100 mt-1">
                Modo demo - Sin necesidad de configurar cuenta de WhatsApp Business
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel de Configuración */}
          <div className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-green-600" />
                  Configuración del Mensaje
                </CardTitle>
                <CardDescription>
                  Configura los datos del paciente y mensaje a enviar
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Teléfono
                    </Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+52 55 1234 5678"
                    />
                  </div>
                  <div>
                    <Label htmlFor="patient" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Nombre del Paciente
                    </Label>
                    <Input
                      id="patient"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="Juan Pérez"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fecha de Cita
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Hora de Cita
                    </Label>
                    <Input
                      id="time"
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      placeholder="10:00 AM"
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>Plantilla de Mensaje</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {templates.map((template) => (
                      <Button
                        key={template.id}
                        variant={selectedTemplate === template.id ? "default" : "outline"}
                        onClick={() => setSelectedTemplate(template.id)}
                        className="h-auto p-3 text-left justify-start"
                      >
                        <span className="mr-2">{template.icon}</span>
                        <span className="text-sm">{template.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {selectedTemplate === 'custom' && (
                  <div>
                    <Label htmlFor="custom-message">Mensaje Personalizado</Label>
                    <Textarea
                      id="custom-message"
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Escribe tu mensaje personalizado..."
                      className="min-h-[100px]"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Variables disponibles: {'{nombre_paciente}'}, {'{fecha_cita}'}, {'{hora_cita}'}
                    </p>
                  </div>
                )}

                <Button
                  onClick={sendWhatsAppDemo}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar WhatsApp (Demo)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Panel de Vista Previa y Resultados */}
          <div className="space-y-6">
            {/* Vista Previa */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Vista Previa del Mensaje
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      W
                    </div>
                    <div>
                      <p className="font-medium text-green-800">WhatsApp Business</p>
                      <p className="text-xs text-green-600">Para: {phone}</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 mt-3 shadow-sm">
                    <p className="text-gray-800 whitespace-pre-wrap">{getPreviewMessage()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resultado del Último Envío */}
            {lastResult && (
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Resultado del Envío
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Estado:</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {lastResult.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">ID del Mensaje:</span>
                    <span className="text-sm font-mono text-gray-600">{lastResult.message_id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Enviado a:</span>
                    <span className="text-sm">{lastResult.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Hora de envío:</span>
                    <span className="text-sm">{new Date(lastResult.sent_at).toLocaleString()}</span>
                  </div>
                  {lastResult.demo_mode && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Modo Demo</span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        Este mensaje fue enviado en modo de demostración. No se envió un WhatsApp real.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
