'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MessagingStats {
  totalSent: number;
  emailsSent: number;
  whatsappSent: number;
  pendingReminders: number;
}

export default function MessagingDashboard() {
  const [stats, setStats] = useState<MessagingStats>({
    totalSent: 0,
    emailsSent: 0,
    whatsappSent: 0,
    pendingReminders: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);

  useEffect(() => {
    loadMessagingData();
  }, []);

  const loadMessagingData = async () => {
    try {
      const upcomingResponse = await fetch('/api/messaging/appointments/upcoming');
      if (upcomingResponse.ok) {
        const upcomingData = await upcomingResponse.json();
        const appointments = upcomingData.appointments || [];
        
        setStats({
          totalSent: appointments.filter((apt: any) => apt.reminder_sent).length,
          emailsSent: appointments.filter((apt: any) => apt.email_sent).length,
          whatsappSent: appointments.filter((apt: any) => apt.whatsapp_sent).length,
          pendingReminders: appointments.filter((apt: any) => !apt.reminder_sent).length
        });
      }
    } catch (error) {
      console.error('Error loading messaging data:', error);
    } finally {
      setLoading(false);
    }
  };

  const testEmailService = async () => {
    setTestingEmail(true);
    try {
      const response = await fetch('/api/messaging/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'test@example.com',
          subject: 'SGMM Pro - Test Email',
          message: 'Test email from SGMM Pro.'
        })
      });
      
      const result = await response.json();
      alert(response.ok ? '✅ Email test successful!' : `❌ Email test failed: ${result.error}`);
    } catch (error) {
      alert(`❌ Email test error: ${error}`);
    } finally {
      setTestingEmail(false);
    }
  };

  const testWhatsAppService = async () => {
    setTestingWhatsApp(true);
    try {
      const response = await fetch('/api/messaging/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: '+1234567890',
          message: 'Test message from SGMM Pro.'
        })
      });
      
      const result = await response.json();
      alert(response.ok ? '✅ WhatsApp test successful!' : `❌ WhatsApp test failed: ${result.error}`);
    } catch (error) {
      alert(`❌ WhatsApp test error: ${error}`);
    } finally {
      setTestingWhatsApp(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Sistema de Mensajería Automática</h1>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enviados</CardTitle>
            <span className="text-2xl">📧</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSent}</div>
            <p className="text-xs text-muted-foreground">Mensajes totales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails</CardTitle>
            <span className="text-2xl">✉️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emailsSent}</div>
            <p className="text-xs text-muted-foreground">Via SendGrid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WhatsApp</CardTitle>
            <span className="text-2xl">💬</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.whatsappSent}</div>
            <p className="text-xs text-muted-foreground">Via Business API</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <span className="text-2xl">⏰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReminders}</div>
            <p className="text-xs text-muted-foreground">Por enviar</p>
          </CardContent>
        </Card>
      </div>

      {/* Service Testing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📧</span>
              <span>Servicio de Email</span>
              <Badge className="bg-green-100 text-green-800">SendGrid</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Sistema de recordatorios por email para citas de 24 horas antes.
            </p>
            <Button 
              onClick={testEmailService}
              disabled={testingEmail}
              className="w-full"
            >
              {testingEmail ? '⏳ Enviando...' : '🧪 Probar Email'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>💬</span>
              <span>Servicio de WhatsApp</span>
              <Badge className="bg-green-100 text-green-800">Business API</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Sistema de recordatorios por WhatsApp para citas de 2 horas antes.
            </p>
            <Button 
              onClick={testWhatsAppService}
              disabled={testingWhatsApp}
              className="w-full"
            >
              {testingWhatsApp ? '⏳ Enviando...' : '🧪 Probar WhatsApp'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>Estado del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">✅</div>
              <div className="font-medium">Sistema Activo</div>
              <div className="text-sm text-gray-600">Mensajería funcionando</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-2">🔄</div>
              <div className="font-medium">Auto-Recordatorios</div>
              <div className="text-sm text-gray-600">Cada 15 minutos</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl mb-2">🚀</div>
              <div className="font-medium">APIs Integradas</div>
              <div className="text-sm text-gray-600">SendGrid + WhatsApp</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
