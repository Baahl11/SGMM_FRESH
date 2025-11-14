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
    console.log('🔍 Team Accept - Token from URL:', token);
    
    if (!token) {
      console.error('❌ No token found in URL');
      setStatus('invalid');
      return;
    }

    acceptInvitation();
  }, [token]);

  const acceptInvitation = async () => {
    try {
      const supabase = createClient();

      console.log('🔍 Looking for invitation with token:', token?.substring(0, 10) + '...');

      // First, fetch the invitation to see who it's for
      const { data: invite, error: fetchError } = await supabase
        .from('team_members')
        .select('*')
        .eq('invitation_token', token)
        .single();

      console.log('📊 Invitation query result:', { invite, fetchError });

      if (fetchError || !invite) {
        console.error('❌ Invitation not found:', fetchError);
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

      // Store invitation for display
      setInvitation(invite);

      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // User needs to sign in or sign up with the invited email
        setStatus('error');
        setError(`Debes iniciar sesión o crear una cuenta con ${invite.member_email} para aceptar esta invitación`);
        setTimeout(() => {
          // Redirect to signup with prefilled email
          router.push(`/auth/signup?email=${encodeURIComponent(invite.member_email)}&redirect=${encodeURIComponent(`/team/accept?token=${token}`)}`);
        }, 3000);
        return;
      }

      // Check if email matches
      if (invite.member_email.toLowerCase() !== user.email?.toLowerCase()) {
        setStatus('error');
        setError(`Esta invitación fue enviada a ${invite.member_email}. Actualmente estás logueado como ${user.email}. Por favor cierra sesión e inicia con ${invite.member_email}.`);
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
    const showLogoutButton = error.includes('Actualmente estás logueado como');
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md border-amber-200">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <XCircle className="h-8 w-8 text-amber-500" />
              <CardTitle>Acción Requerida</CardTitle>
            </div>
            <CardDescription className="text-base">{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {invitation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Email invitado:</strong> {invitation.member_email}
                </p>
                <p className="text-sm text-blue-900 mt-1">
                  <strong>Rol:</strong> {invitation.role}
                </p>
              </div>
            )}
            
            {showLogoutButton ? (
              <Button 
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  router.push(`/auth/signup?email=${encodeURIComponent(invitation?.member_email || '')}&redirect=${encodeURIComponent(`/team/accept?token=${token}`)}`);
                }} 
                className="w-full"
                variant="destructive"
              >
                Cerrar Sesión e Ir a Registro
              </Button>
            ) : (
              <p className="text-sm text-gray-600 text-center">
                Redirigiendo al registro en 3 segundos...
              </p>
            )}
            
            <Button 
              onClick={() => router.push('/')} 
              className="w-full"
              variant="outline"
            >
              Volver al Inicio
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
