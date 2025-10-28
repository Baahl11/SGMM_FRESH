/**
 * Branding Settings Page
 * Path: /settings/branding
 * Purpose: Customize PDF appearance (logos, colors, templates)
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Upload, X, Loader2, Save, Eye, Palette, FileText, Settings } from 'lucide-react';
import { ColorPicker } from '@/components/settings/color-picker';
import { InvoicePreview } from '@/components/settings/invoice-preview';
import type { ClinicSettings } from '@/lib/types/clinic-settings';
import { 
  PDF_TEMPLATES, 
  FONT_OPTIONS, 
  LOGO_POSITION_OPTIONS,
  COLOR_PRESETS,
  MAX_LOGO_SIZE_MB,
  ALLOWED_LOGO_TYPES 
} from '@/lib/types/clinic-settings';

export default function BrandingSettingsPage() {
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/branding');
      
      if (!response.ok) {
        throw new Error('Error al cargar configuración');
      }

      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Error al cargar configuración de marca');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const response = await fetch('/api/settings/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary_color: settings.primary_color,
          secondary_color: settings.secondary_color,
          accent_color: settings.accent_color,
          text_color: settings.text_color,
          template: settings.template,
          font_family: settings.font_family,
          show_logo: settings.show_logo,
          show_clinic_name: settings.show_clinic_name,
          footer_text: settings.footer_text,
          logo_position: settings.logo_position,
          logo_width: settings.logo_width,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar');
      }

      const updatedSettings = await response.json();
      setSettings(updatedSettings);
      setHasChanges(false);
      toast.success('Configuración guardada correctamente');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > MAX_LOGO_SIZE_MB) {
      toast.error(`El archivo es demasiado grande. Máximo ${MAX_LOGO_SIZE_MB}MB`);
      return;
    }

    // Validate file type
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      toast.error('Tipo de archivo no permitido. Solo PNG, JPEG o SVG.');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch('/api/settings/upload-logo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al subir logo');
      }

      const data = await response.json();
      setSettings(data.settings);
      toast.success('Logo subido correctamente');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error(error.message || 'Error al subir logo');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!window.confirm('¿Eliminar el logo actual?')) return;

    try {
      setUploading(true);
      const response = await fetch('/api/settings/upload-logo', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar logo');
      }

      const data = await response.json();
      setSettings(data.settings);
      toast.success('Logo eliminado correctamente');
    } catch (error: any) {
      console.error('Error deleting logo:', error);
      toast.error(error.message || 'Error al eliminar logo');
    } finally {
      setUploading(false);
    }
  };

  const updateSettings = (updates: Partial<ClinicSettings>) => {
    setSettings((prev) => prev ? { ...prev, ...updates } : null);
    setHasChanges(true);
  };

  const applyColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    updateSettings({
      primary_color: preset.colors.primary,
      secondary_color: preset.colors.secondary,
      accent_color: preset.colors.accent,
    });
    toast.success(`Paleta "${preset.name}" aplicada`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Error al cargar configuración
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-5xl">
      {/* Header con gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-600 p-8 text-white shadow-xl mb-6">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
              <Palette className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Personalización de Facturas</h1>
              <p className="text-purple-50 mt-1">
                Configura el aspecto de tus facturas PDF con tu marca
              </p>
            </div>
          </div>
          <Button
            onClick={saveSettings}
            disabled={!hasChanges || saving}
            size="lg"
            className="bg-white text-purple-600 hover:bg-purple-50"
          >
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

      <Tabs defaultValue="logo" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="logo">
            <Upload className="mr-2 h-4 w-4" />
            Logo
          </TabsTrigger>
          <TabsTrigger value="colors">
            <Palette className="mr-2 h-4 w-4" />
            Colores
          </TabsTrigger>
          <TabsTrigger value="template">
            <FileText className="mr-2 h-4 w-4" />
            Plantilla
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Settings className="mr-2 h-4 w-4" />
            Avanzado
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="mr-2 h-4 w-4" />
            Vista Previa
          </TabsTrigger>
        </TabsList>

        {/* Logo Tab */}
        <TabsContent value="logo">
          <Card className="border-2 border-purple-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-purple-600" />
                Logo de la Clínica
              </CardTitle>
              <CardDescription>
                Sube tu logo para que aparezca en todas las facturas PDF
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings.logo_url ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center p-6 border-2 border-dashed rounded-lg bg-gray-50">
                    <img
                      src={settings.logo_url}
                      alt="Logo de la clínica"
                      className="max-h-32 object-contain"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteLogo}
                    disabled={uploading}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Eliminar Logo
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center p-12 border-2 border-dashed rounded-lg">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <Label htmlFor="logo-upload" className="cursor-pointer">
                        <span className="text-primary hover:underline">
                          Sube un archivo
                        </span>
                      </Label>
                      <Input
                        id="logo-upload"
                        type="file"
                        accept={ALLOWED_LOGO_TYPES.join(',')}
                        onChange={handleLogoUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        PNG, JPEG o SVG hasta {MAX_LOGO_SIZE_MB}MB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Posición del Logo</Label>
                  <Select
                    value={settings.logo_position}
                    onValueChange={(value) =>
                      updateSettings({ logo_position: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOGO_POSITION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.icon} {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ancho del Logo (px)</Label>
                  <Input
                    type="number"
                    min="50"
                    max="500"
                    value={settings.logo_width}
                    onChange={(e) =>
                      updateSettings({ logo_width: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mostrar Logo</Label>
                  <p className="text-sm text-muted-foreground">
                    Activar/desactivar sin eliminar el archivo
                  </p>
                </div>
                <Switch
                  checked={settings.show_logo}
                  onCheckedChange={(checked) =>
                    updateSettings({ show_logo: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Colors Tab */}
        <TabsContent value="colors">
          <Card className="border-2 border-pink-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-pink-600" />
                Colores de Marca
              </CardTitle>
              <CardDescription>
                Define los colores que se usarán en tus facturas PDF
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-3">Paletas Predefinidas</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {COLOR_PRESETS.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      onClick={() => applyColorPreset(preset)}
                      className="h-auto flex-col items-start p-3"
                    >
                      <span className="font-medium text-sm">{preset.name}</span>
                      <div className="flex gap-1 mt-2">
                        <div
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: preset.colors.primary }}
                        />
                        <div
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: preset.colors.secondary }}
                        />
                        <div
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: preset.colors.accent }}
                        />
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <ColorPicker
                  label="Color Primario"
                  value={settings.primary_color}
                  onChange={(color) => updateSettings({ primary_color: color })}
                  description="Se usa en encabezados y botones"
                />

                <ColorPicker
                  label="Color Secundario"
                  value={settings.secondary_color}
                  onChange={(color) => updateSettings({ secondary_color: color })}
                  description="Se usa en fondos y secciones"
                />

                <ColorPicker
                  label="Color de Acento"
                  value={settings.accent_color}
                  onChange={(color) => updateSettings({ accent_color: color })}
                  description="Se usa en detalles y énfasis"
                />

                <ColorPicker
                  label="Color de Texto"
                  value={settings.text_color}
                  onChange={(color) => updateSettings({ text_color: color })}
                  description="Se usa para el texto principal"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Template Tab */}
        <TabsContent value="template">
          <Card className="border-2 border-indigo-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Plantilla de Diseño
              </CardTitle>
              <CardDescription>
                Elige el estilo de tus facturas PDF
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {PDF_TEMPLATES.map((template) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all overflow-hidden ${
                      settings.template === template.id
                        ? 'border-primary border-2 shadow-lg'
                        : 'hover:border-gray-400 hover:shadow-md'
                    }`}
                    onClick={() => updateSettings({ template: template.id })}
                  >
                    {/* Preview Mockup */}
                    <div className="relative h-48 bg-white p-4 border-b">
                      {template.id === 'modern' && (
                        <div className="h-full">
                          <div className="h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg mb-3 flex items-center px-3">
                            <div className="w-8 h-8 bg-white/30 rounded"></div>
                            <div className="ml-2 h-4 w-24 bg-white/50 rounded"></div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                            <div className="mt-4 h-16 bg-indigo-50 rounded border border-indigo-200"></div>
                          </div>
                        </div>
                      )}
                      {template.id === 'classic' && (
                        <div className="h-full">
                          <div className="h-12 border-2 border-blue-900 rounded mb-3 flex items-center justify-between px-3 bg-blue-900">
                            <div className="h-4 w-20 bg-white/90 rounded"></div>
                            <div className="w-6 h-6 bg-white/30 rounded-sm"></div>
                          </div>
                          <div className="space-y-2 border-l-4 border-blue-900 pl-2">
                            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                            <div className="mt-4 h-16 bg-gray-100 rounded border-2 border-gray-300"></div>
                          </div>
                        </div>
                      )}
                      {template.id === 'minimalist' && (
                        <div className="h-full">
                          <div className="h-10 border-b flex items-center justify-between px-2 mb-3">
                            <div className="h-3 w-16 bg-gray-400 rounded"></div>
                            <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
                          </div>
                          <div className="space-y-3">
                            <div className="h-2 bg-gray-200 rounded w-1/3"></div>
                            <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                            <div className="space-y-1 mt-4">
                              <div className="h-2 bg-gray-100 rounded w-full"></div>
                              <div className="h-2 bg-gray-100 rounded w-full"></div>
                              <div className="h-2 bg-gray-100 rounded w-3/4"></div>
                            </div>
                            <div className="mt-3 h-12 border-t pt-2">
                              <div className="h-2 bg-gray-900 rounded w-1/4 ml-auto"></div>
                            </div>
                          </div>
                        </div>
                      )}
                      {template.id === 'professional' && (
                        <div className="h-full">
                          <div className="h-14 bg-gradient-to-b from-slate-700 to-slate-800 rounded-t-lg mb-3 flex items-center px-4 justify-between shadow-md">
                            <div>
                              <div className="w-10 h-3 bg-white/80 rounded mb-1"></div>
                              <div className="w-16 h-2 bg-white/50 rounded"></div>
                            </div>
                            <div className="w-8 h-8 bg-white/20 rounded"></div>
                          </div>
                          <div className="space-y-2 px-2">
                            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                            <div className="h-3 bg-slate-100 rounded w-3/4"></div>
                            <div className="mt-3 grid grid-cols-3 gap-2">
                              <div className="h-8 bg-slate-100 rounded border border-slate-300"></div>
                              <div className="h-8 bg-slate-100 rounded border border-slate-300"></div>
                              <div className="h-8 bg-slate-700 rounded text-white"></div>
                            </div>
                          </div>
                        </div>
                      )}
                      {settings.template === template.id && (
                        <div className="absolute top-2 right-2 bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                          ✓ Seleccionado
                        </div>
                      )}
                    </div>

                    <CardHeader>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-1">
                        {template.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="text-primary">✓</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced">
          <Card className="border-2 border-blue-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                Configuración Avanzada
              </CardTitle>
              <CardDescription>
                Opciones adicionales para personalizar tus facturas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Fuente Tipográfica</Label>
                <Select
                  value={settings.font_family}
                  onValueChange={(value) => updateSettings({ font_family: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Texto del Footer</Label>
                <Textarea
                  value={settings.footer_text || ''}
                  onChange={(e) => updateSettings({ footer_text: e.target.value })}
                  placeholder="Ejemplo: Gracias por su confianza. Clínica XYZ - Tel: 555-1234"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Aparecerá al final de cada factura
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mostrar Nombre de la Clínica</Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar el nombre junto al logo
                  </p>
                </div>
                <Switch
                  checked={settings.show_clinic_name}
                  onCheckedChange={(checked) =>
                    updateSettings({ show_clinic_name: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview">
          <Card className="border-2 border-green-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-green-600" />
                Vista Previa de Factura
              </CardTitle>
              <CardDescription>
                Así se verá tu factura con la configuración actual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-8 rounded-lg">
                <InvoicePreview settings={settings} />
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                💡 Esta es una representación aproximada. Los PDFs generados por Facturama
                pueden tener ligeras variaciones en el formato final.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
