'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function EmailPreviewPage() {
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('Dr. Juan Pérez');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);

  const sendTestWelcomeEmail = async () => {
    setSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/test/send-welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          userName,
          planName: 'Profesional',
          trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setSending(false);
    }
  };

  const sendTestReminderEmail = async () => {
    setSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/test/send-reminder-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          userName,
          planName: 'Profesional',
          daysRemaining: 2,
          trialEndDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setSending(false);
    }
  };

  const triggerCronManually = async () => {
    setSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/cron/trial-reminders', {
        method: 'POST',
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">📧 Email System - Trial Emails</h1>
      <p className="text-gray-600 mb-8">Preview and test trial activation emails</p>

      <Tabs defaultValue="test" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="test">🧪 Test Emails</TabsTrigger>
          <TabsTrigger value="preview">👁️ Preview</TabsTrigger>
          <TabsTrigger value="cron">⏰ Cron Job</TabsTrigger>
        </TabsList>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Send Test Emails</CardTitle>
              <CardDescription>
                Send test trial emails to any email address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="test@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userName">User Name</Label>
                <Input
                  id="userName"
                  type="text"
                  placeholder="Dr. Juan Pérez"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={sendTestWelcomeEmail}
                  disabled={!email || sending}
                  className="flex-1"
                >
                  {sending ? 'Sending...' : '🎉 Send Welcome Email'}
                </Button>

                <Button
                  onClick={sendTestReminderEmail}
                  disabled={!email || sending}
                  variant="secondary"
                  className="flex-1"
                >
                  {sending ? 'Sending...' : '⏰ Send Reminder Email'}
                </Button>
              </div>

              {result && (
                <div className={`p-4 rounded-lg ${result.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>🎉 Welcome Email</CardTitle>
                <CardDescription>Sent immediately after trial activation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-bold mb-2">Subject:</h3>
                  <p className="mb-4">🎉 ¡Bienvenido a SGMM Pro! - Tu prueba gratis de 7 días comienza ahora</p>
                  
                  <h3 className="font-bold mb-2">Content Includes:</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Welcome message with user's name</li>
                    <li>Trial end date countdown</li>
                    <li>4-step onboarding checklist</li>
                    <li>Link to dashboard</li>
                    <li>List of included features</li>
                    <li>Support contact information</li>
                    <li>No commitment reminder</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>⏰ Expiration Reminder</CardTitle>
                <CardDescription>Sent 2 days before trial expires</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-bold mb-2">Subject:</h3>
                  <p className="mb-4">⏰ Tu prueba gratis termina en 2 días - Continúa con SGMM Pro</p>
                  
                  <h3 className="font-bold mb-2">Content Includes:</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Days remaining countdown (2 days)</li>
                    <li>Exact expiration date and time</li>
                    <li>What happens if they don't add payment</li>
                    <li>Benefits of continuing</li>
                    <li>CTA button to add payment method</li>
                    <li>Special offer (20% discount)</li>
                    <li>Usage summary</li>
                    <li>Support contact options</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cron">
          <Card>
            <CardHeader>
              <CardTitle>⏰ Cron Job Status</CardTitle>
              <CardDescription>
                Automatic trial reminder system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-bold mb-2">📅 Schedule:</h3>
                <p className="text-sm mb-2">Runs daily at <strong>10:00 AM (UTC)</strong></p>
                <p className="text-sm text-gray-600">
                  Checks for trials expiring in exactly 2 days and sends reminder emails
                </p>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-bold mb-2">🔧 Configuration:</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Endpoint: <code>/api/cron/trial-reminders</code></li>
                  <li>Frequency: Daily (every 24 hours)</li>
                  <li>Target: Trials with 2 days remaining</li>
                  <li>Security: Protected with CRON_SECRET</li>
                </ul>
              </div>

              <Button
                onClick={triggerCronManually}
                disabled={sending}
                className="w-full"
                variant="outline"
              >
                {sending ? 'Running...' : '▶️ Trigger Cron Job Manually'}
              </Button>

              {result && (
                <div className={`p-4 rounded-lg ${result.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                  <h3 className="font-bold mb-2">Result:</h3>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}

              <div className="border rounded-lg p-4 bg-yellow-50">
                <h3 className="font-bold mb-2">⚠️ Production Notes:</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Requires <code>SENDGRID_API_KEY</code> environment variable</li>
                  <li>Requires <code>CRON_SECRET</code> for security</li>
                  <li>Requires <code>SUPABASE_SERVICE_ROLE_KEY</code> for admin access</li>
                  <li>Vercel Cron must be enabled in project settings</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
