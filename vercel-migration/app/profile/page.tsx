'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, Building2, Phone, Mail, Globe, Briefcase, GraduationCap, Award, Link as LinkIcon, Camera, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import md5 from 'md5';

interface UserProfile {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  phone: string | null;
  specialty: string | null;
  license_number: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  clinic_phone: string | null;
  clinic_email: string | null;
  clinic_website: string | null;
  bio: string | null;
  years_experience: number | null;
  education: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/signin');
        return;
      }

      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        toast.error('Error al cargar perfil');
        return;
      }

      if (profileData) {
        setProfile(profileData);
        // Set Gravatar if no custom avatar
        if (!profileData.avatar_url && profileData.email) {
          const gravatarUrl = getGravatarUrl(profileData.email);
          setAvatarPreview(gravatarUrl);
        } else if (profileData.avatar_url) {
          setAvatarPreview(profileData.avatar_url);
        }
      } else {
        // Create default profile
        const defaultProfile: Partial<UserProfile> = {
          user_id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        };

        const { data: newProfile, error: insertError } = await supabase
          .from('user_profiles')
          .insert([defaultProfile])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
        } else {
          setProfile(newProfile);
          if (user.email) {
            setAvatarPreview(getGravatarUrl(user.email));
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  };

  const getGravatarUrl = (email: string, size: number = 200): string => {
    const hash = md5(email.trim().toLowerCase());
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('user_profiles')
        .update({
          name: profile.name,
          phone: profile.phone,
          specialty: profile.specialty,
          license_number: profile.license_number,
          clinic_name: profile.clinic_name,
          clinic_address: profile.clinic_address,
          clinic_phone: profile.clinic_phone,
          clinic_email: profile.clinic_email,
          clinic_website: profile.clinic_website,
          bio: profile.bio,
          years_experience: profile.years_experience,
          education: profile.education,
          linkedin_url: profile.linkedin_url,
          twitter_url: profile.twitter_url,
          facebook_url: profile.facebook_url,
          instagram_url: profile.instagram_url,
          avatar_url: profile.avatar_url,
        })
        .eq('user_id', profile.user_id);

      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Error al guardar perfil');
        return;
      }

      toast.success('Perfil actualizado correctamente');
      router.refresh();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarPreview(result);
        setProfile(prev => prev ? { ...prev, avatar_url: result } : null);
      };
      reader.readAsDataURL(file);
    }
  };

  const useGravatar = () => {
    if (profile?.email) {
      const gravatarUrl = getGravatarUrl(profile.email);
      setAvatarPreview(gravatarUrl);
      setProfile(prev => prev ? { ...prev, avatar_url: gravatarUrl } : null);
      toast.success('Avatar de Gravatar cargado');
    }
  };

  const updateField = (field: keyof UserProfile, value: any) => {
    setProfile(prev => prev ? { ...prev, [field]: value } : null);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600">Error al cargar perfil</p>
      </div>
    );
  }

  const initials = profile.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile.email?.substring(0, 2).toUpperCase() || 'US';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
            <p className="text-gray-600 mt-1">Administra tu información personal y de tu clínica</p>
          </div>
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>

        {/* Avatar Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Foto de Perfil
            </CardTitle>
            <CardDescription>
              Tu foto aparecerá en el menú y en todas tus interacciones
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarPreview} alt={profile.name || 'Avatar'} />
              <AvatarFallback className="bg-blue-600 text-white text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => document.getElementById('avatar-upload')?.click()}>
                  Subir Foto
                </Button>
                <Button variant="outline" onClick={useGravatar}>
                  Usar Gravatar
                </Button>
              </div>
              <p className="text-xs text-gray-600">
                JPG, PNG o GIF. Máximo 2MB. También puedes usar tu{' '}
                <a
                  href="https://gravatar.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  avatar de Gravatar
                </a>
              </p>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input
                  id="name"
                  value={profile.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Dr. Juan Pérez"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile.email || ''}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-600">El email no se puede cambiar</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono Personal</Label>
                <Input
                  id="phone"
                  value={profile.phone || ''}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+52 55 1234 5678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialty">Especialidad</Label>
                <Input
                  id="specialty"
                  value={profile.specialty || ''}
                  onChange={(e) => updateField('specialty', e.target.value)}
                  placeholder="Ej: Odontología, Dermatología"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="license">Cédula Profesional</Label>
                <Input
                  id="license"
                  value={profile.license_number || ''}
                  onChange={(e) => updateField('license_number', e.target.value)}
                  placeholder="1234567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Años de Experiencia</Label>
                <Input
                  id="experience"
                  type="number"
                  value={profile.years_experience || ''}
                  onChange={(e) => updateField('years_experience', parseInt(e.target.value) || null)}
                  placeholder="10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="education">Formación Académica</Label>
              <Textarea
                id="education"
                value={profile.education || ''}
                onChange={(e) => updateField('education', e.target.value)}
                placeholder="Universidad Nacional Autónoma de México - Licenciatura en Medicina&#10;Instituto Politécnico Nacional - Especialidad en Dermatología"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Biografía Profesional</Label>
              <Textarea
                id="bio"
                value={profile.bio || ''}
                onChange={(e) => updateField('bio', e.target.value)}
                placeholder="Cuéntales a tus pacientes sobre tu experiencia y enfoque profesional..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Clinic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Información de la Clínica
            </CardTitle>
            <CardDescription>
              Esta información aparecerá en tus mensajes automáticos y página de reservas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clinic_name">Nombre de la Clínica</Label>
              <Input
                id="clinic_name"
                value={profile.clinic_name || ''}
                onChange={(e) => updateField('clinic_name', e.target.value)}
                placeholder="Clínica Dental Sonrisas"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinic_address">Dirección</Label>
              <Input
                id="clinic_address"
                value={profile.clinic_address || ''}
                onChange={(e) => updateField('clinic_address', e.target.value)}
                placeholder="Av. Reforma 123, Col. Centro, Ciudad de México"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="clinic_phone">Teléfono de la Clínica</Label>
                <Input
                  id="clinic_phone"
                  value={profile.clinic_phone || ''}
                  onChange={(e) => updateField('clinic_phone', e.target.value)}
                  placeholder="+52 55 1234 5678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinic_email">Email de la Clínica</Label>
                <Input
                  id="clinic_email"
                  type="email"
                  value={profile.clinic_email || ''}
                  onChange={(e) => updateField('clinic_email', e.target.value)}
                  placeholder="contacto@clinica.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinic_website">Sitio Web</Label>
              <Input
                id="clinic_website"
                value={profile.clinic_website || ''}
                onChange={(e) => updateField('clinic_website', e.target.value)}
                placeholder="https://www.miclinica.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Redes Sociales y Profesionales
            </CardTitle>
            <CardDescription>
              Opcional: Comparte tus perfiles profesionales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={profile.linkedin_url || ''}
                  onChange={(e) => updateField('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={profile.facebook_url || ''}
                  onChange={(e) => updateField('facebook_url', e.target.value)}
                  placeholder="https://facebook.com/..."
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={profile.instagram_url || ''}
                  onChange={(e) => updateField('instagram_url', e.target.value)}
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter/X</Label>
                <Input
                  id="twitter"
                  value={profile.twitter_url || ''}
                  onChange={(e) => updateField('twitter_url', e.target.value)}
                  placeholder="https://twitter.com/..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button (Bottom) */}
        <div className="flex justify-end pb-8">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
