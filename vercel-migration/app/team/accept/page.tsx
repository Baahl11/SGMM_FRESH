/**
 * Team Invitation Accept Page
 * URL: /team/accept?token=xxx
 */

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, Users } from 'lucide-react';

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading');
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    acceptInvitation();
  }, [token]);

  const acceptInvitation = async () => {
    try {
      const supabase = createClient();

      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // User needs to sign in or sign up
        // Store the token and show instructions
        setStatus('error');
        setError('Por favor inicia sesión o crea una cuenta para aceptar la invitación');
        setTimeout(() => {
          router.push(`/auth/signin?message=Inicia sesión para aceptar la invitación&redirect=${encodeURIComponent(`/team/accept?token=${token}`)}`);
        }, 2000);
        return;
      }

      // Find invitation by token
      const { data: invite, error: fetchError } = await supabase
        .from('team_members')
        .select('*')
        .eq('invitation_token', token)
        .single();

      if (fetchError || !invite) {
        setStatus('invalid');
        setError('Invitación no encontrada o token inválido');
        return;
      }

      // Check if invitation is already accepted
      if (invite.status === 'active') {
        setStatus('error');
        setError('Esta invitación ya fue aceptada anteriormente');
        setInvitation(invite);
        return;
      }

      // Check if email matches
      if (invite.member_email !== user.email) {
        setStatus('error');
        setError(`Esta invitación fue enviada a ${invite.member_email}. Por favor inicia sesión con ese correo.`);
        return;
      }

      // Accept invitation
      const { error: updateError } = await supabase
        .from('team_members')
        .update({
          member_user_id: user.id,
          status: 'active',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invite.id);

      if (updateError) {
        setStatus('error');
        setError('Error al aceptar la invitación: ' + updateError.message);
        return;
      }

      setInvitation(invite);
      setStatus('success');

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);

    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Error inesperado');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <p className="text-lg font-medium">Procesando invitación...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <XCircle className="h-8 w-8 text-red-500" />
              <CardTitle>Token Inválido</CardTitle>
            </div>
            <CardDescription>
              El link de invitación es inválido o ha expirado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full">
              Volver al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md border-amber-200">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <XCircle className="h-8 w-8 text-amber-500" />
              <CardTitle>Error</CardTitle>
            </div>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Ir al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md border-green-200">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <CardTitle>¡Invitación Aceptada!</CardTitle>
          </div>
          <CardDescription>
            Te has unido exitosamente al equipo como <strong className="text-gray-900">{invitation?.role}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Users className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Bienvenido al equipo</p>
                <p className="text-sm text-green-700 mt-1">
                  Ahora tienes acceso a los datos compartidos del equipo según tu rol.
                </p>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 text-center">
            Redirigiendo al dashboard en 3 segundos...
          </p>
          
          <Button onClick={() => router.push('/dashboard')} className="w-full">
            Ir al Dashboard Ahora
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <p className="text-lg font-medium">Cargando...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  );
}
