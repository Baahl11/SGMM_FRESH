'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ProfilePictureUploader } from '@/components/ui/profile-picture-uploader';
import { User, Mail, Calendar, Shield, Globe, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  google_id?: string;
  oauth_provider?: string;
  profile_picture_url?: string;
  created_via_oauth?: boolean;
  created_at?: string;
  last_login?: string;
}

export default function ProfilePage() {
  const { user, userEmail, isAuthenticated } = useAuthContext();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Estados para edición
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  useEffect(() => {
    if (!isAuthenticated && process.env.NEXT_PUBLIC_BYPASS_AUTH !== "1") {
      router.push('/login');
      return;
    }
    loadProfile();
  }, [isAuthenticated, router]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      // Primero intentar obtener del contexto de autenticación
      if (user || userEmail) {
        // Intentar cargar foto de perfil del servidor
        let profilePictureUrl = user?.picture;
        
        try {
          const response = await fetch(`/api/user/profile-picture?user_id=1`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.profile_picture_url) {
              profilePictureUrl = data.profile_picture_url;
            }
          }
        } catch (error) {
          console.log('No se pudo cargar foto de perfil del servidor, usando OAuth');
        }

        const profileData: UserProfile = {
          id: 1, // Temporal hasta que tengamos endpoint
          name: user?.name || user?.given_name || 'Usuario',
          email: userEmail || user?.email || '',
          google_id: user?.sub || user?.id,
          oauth_provider: user ? 'google' : 'manual',
          profile_picture_url: profilePictureUrl,
          created_via_oauth: !!user,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        };
        
        setProfile(profileData);
        setEditName(profileData.name);
        setEditEmail(profileData.email);
      }

      // TODO: Implementar endpoint backend para obtener perfil completo
      // const response = await fetch('/api/user/profile');
      // if (response.ok) {
      //   const data = await response.json();
      //   setProfile(data);
      //   setEditName(data.name);
      //   setEditEmail(data.email);
      // }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      
      // TODO: Implementar endpoint backend para actualizar perfil
      // const response = await fetch('/api/user/profile', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     name: editName,
      //     email: editEmail
      //   })
      // });

      // if (response.ok) {
      //   const updatedProfile = await response.json();
      //   setProfile(updatedProfile);
      //   setEditMode(false);
      //   toast.success('Perfil actualizado exitosamente');
      // } else {
      //   toast.error('Error al actualizar el perfil');
      // }

      // Temporal - actualizar estado local
      setProfile(prev => prev ? {
        ...prev,
        name: editName,
        email: editEmail
      } : null);
      setEditMode(false);
      toast.success('Perfil actualizado exitosamente');
      
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (profile) {
      setEditName(profile.name);
      setEditEmail(profile.email);
    }
    setEditMode(false);
  };

  const handlePictureUpdate = (newPictureUrl: string) => {
    setProfile(prev => prev ? {
      ...prev,
      profile_picture_url: newPictureUrl
    } : null);
  };

  const handlePictureDelete = () => {
    setProfile(prev => prev ? {
      ...prev,
      profile_picture_url: user?.picture || undefined
    } : null);
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProviderBadge = (provider?: string, isOAuth?: boolean) => {
    if (provider === 'google' || isOAuth) {
      return (
        <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
          <Globe className="h-3 w-3 mr-1" />
          Google OAuth
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-gray-700 border-gray-200 bg-gray-50">
        <Shield className="h-3 w-3 mr-1" />
        Manual
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <p className="text-gray-500">Error al cargar el perfil de usuario</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/dashboard')}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Mi Perfil</h1>
                <p className="text-indigo-100 mt-1">
                  Gestiona tu información personal y configuraciones
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Información Principal del Perfil */}
        <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Información Personal
                </CardTitle>
                <CardDescription>
                  Tu información de perfil y método de autenticación
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {editMode ? (
                  <>
                    <Button variant="outline" size="sm" onClick={cancelEdit}>
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={saveProfile} disabled={saving}>
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Guardar
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => setEditMode(true)}>
                    Editar
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              {/* Avatar con ProfilePictureUploader */}
              <ProfilePictureUploader
                currentPictureUrl={profile.profile_picture_url}
                userName={profile.name}
                userId={profile.id}
                onPictureUpdate={handlePictureUpdate}
                onPictureDelete={handlePictureDelete}
                size="lg"
                allowDelete={true}
              />

              {/* Información de usuario */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nombre completo</Label>
                    {editMode ? (
                      <Input
                        id="name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Ingresa tu nombre completo"
                      />
                    ) : (
                      <p className="text-lg font-medium mt-1">{profile.name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Correo electrónico</Label>
                    {editMode ? (
                      <Input
                        id="email"
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="tu@email.com"
                      />
                    ) : (
                      <p className="text-lg font-medium mt-1">{profile.email}</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Método de autenticación</Label>
                    <div className="mt-2">
                      {getProviderBadge(profile.oauth_provider, profile.created_via_oauth)}
                    </div>
                  </div>

                  {profile.google_id && (
                    <div>
                      <Label>ID de Google</Label>
                      <p className="text-sm text-gray-600 mt-1 font-mono">
                        {profile.google_id.slice(0, 20)}...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información de la Cuenta */}
        <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Información de la Cuenta
            </CardTitle>
            <CardDescription>
              Detalles sobre tu cuenta y actividad
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Fecha de registro</Label>
                <p className="text-sm text-gray-600 mt-1">
                  {formatDate(profile.created_at)}
                </p>
              </div>

              <div>
                <Label>Último acceso</Label>
                <p className="text-sm text-gray-600 mt-1">
                  {formatDate(profile.last_login)}
                </p>
              </div>

              <div>
                <Label>ID de usuario</Label>
                <p className="text-sm text-gray-600 mt-1 font-mono">
                  #{profile.id}
                </p>
              </div>

              <div>
                <Label>Estado de la cuenta</Label>
                <div className="mt-2">
                  <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                    Activa
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Notificaciones */}
        <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-purple-600" />
              Configuración para Mensajería
            </CardTitle>
            <CardDescription>
              Este correo se utilizará para enviar facturas, recordatorios y promociones
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-blue-800">Email para sistema de mensajería</h4>
                  <p className="text-sm text-blue-600 mt-1">
                    <Mail className="h-4 w-4 inline mr-1" />
                    {profile.email}
                  </p>
                  <p className="text-xs text-blue-500 mt-1">
                    Este email se usará para:
                  </p>
                  <ul className="text-xs text-blue-500 mt-1 list-disc list-inside">
                    <li>Envío automático de facturas</li>
                    <li>Recordatorios de citas</li>
                    <li>Promociones y campañas</li>
                    <li>Notificaciones del sistema</li>
                  </ul>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/settings/messaging')}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  Configurar mensajería
                </Button>
              </div>

              <div className="text-xs text-gray-500">
                💡 Para cambiar el email de mensajería, actualiza tu email de perfil arriba y luego ve a la configuración de mensajería.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
