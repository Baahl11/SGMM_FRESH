'use client';

/**
 * Invitation Signup Page
 * Accept invitation and create account
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface PageProps {
  params: {
    token: string;
  };
}

export default function InvitationSignupPage({ params }: PageProps) {
  const router = useRouter();
  const { token } = params;

  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState('');
  const [invitation, setInvitation] = useState<any>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      setIsValidating(true);
      const response = await fetch(`/api/invitations/validate/${token}`);
      const data = await response.json();

      if (data.valid) {
        setIsValid(true);
        setInvitation(data.invitation);
      } else {
        setIsValid(false);
        setError(data.error || 'Invitación inválida');
      }
    } catch (error) {
      console.error('Error validating token:', error);
      setIsValid(false);
      setError('Error al validar invitación');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords
    if (password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    try {
      setIsCreating(true);
      console.log('🚀 Enviando solicitud de activación:', { token });
      
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      console.log('📥 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Response data:', data);

      if (response.ok) {
        toast.success('¡Cuenta creada exitosamente!');
        
        // Redirect to login
        setTimeout(() => {
          router.push('/auth/signin?message=account_created');
        }, 1000);
      } else {
        console.error('❌ Error response:', data);
        toast.error(data.error || 'Error al crear cuenta');
      }
    } catch (error) {
      console.error('❌ Error accepting invitation:', error);
      toast.error('Error al crear cuenta');
    } finally {
      setIsCreating(false);
    }
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
              <p className="text-muted-foreground">Validando invitación...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid invitation
  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-6 w-6" />
              <CardTitle>Invitación Inválida</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push('/auth/signin')}
            >
              Ir a Inicio de Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid invitation - show signup form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">¡Bienvenido a AgendaMedPro!</CardTitle>
          <CardDescription>
            Crea tu cuenta para acceder a todas las funciones premium
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Invitation Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nombre:</span>
                <span className="font-medium">{invitation.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{invitation.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan:</span>
                <span className="font-medium text-blue-600">Premium (Completo)</span>
              </div>
            </div>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Crea tu Contraseña *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Usa al menos 8 caracteres con letras y números
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirma tu Contraseña *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="mt-2"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                'Activar mi Cuenta'
              )}
            </Button>
          </form>

          {/* Features */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm font-medium mb-3">Tu plan incluye:</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Facturación electrónica CFDI 4.0 ilimitada</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Agenda médica con recordatorios automáticos</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Reportes financieros y análisis de ingresos</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Personalización de PDFs y branding</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Soporte prioritario</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
