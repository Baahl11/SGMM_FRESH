'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, XCircle, AlertCircle, Upload, FileCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { SAT_REGIMEN_FISCAL } from '@/lib/types/facturama';
import type { FacturamaConfig, FacturamaConfigInput } from '@/lib/types/facturama';

export default function FacturacionSettingsPage() {
  const [config, setConfig] = useState<Partial<FacturamaConfig> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  // Certificate upload states
  const [cerFile, setCerFile] = useState<File | null>(null);
  const [keyFile, setKeyFile] = useState<File | null>(null);
  const [keyPassword, setKeyPassword] = useState('');
  const [uploadingCerts, setUploadingCerts] = useState(false);
  const [hasCertificates, setHasCertificates] = useState(false);
  const [deletingCerts, setDeletingCerts] = useState(false);

  const [formData, setFormData] = useState<FacturamaConfigInput>({
    api_user: '',
    api_password: '',
    is_sandbox: true,
    emisor_rfc: '',
    emisor_razon_social: '',
    emisor_regimen_fiscal: '612',
    emisor_codigo_postal: '',
    emisor_email: '',
    emisor_telefono: '',
    emisor_direccion: '',
    emisor_ciudad: '',
    emisor_estado: '',
    serie_default: 'A',
    folio_inicial: 1,
    auto_send_email: true,
  });

  useEffect(() => {
    loadConfig();
    checkCertificates();
  }, []);

  const checkCertificates = async () => {
    try {
      const response = await fetch('/api/facturama/certificates');
      if (response.ok) {
        const data = await response.json();
        setHasCertificates(data.has_certificates);
      }
    } catch (error) {
      console.error('Error checking certificates:', error);
    }
  };

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/facturama/config');
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setConfig(data.config);
          setFormData({
            api_user: data.config.api_user || '',
            api_password: '', // Never pre-fill password
            is_sandbox: data.config.is_sandbox ?? true,
            emisor_rfc: data.config.emisor_rfc || '',
            emisor_razon_social: data.config.emisor_razon_social || '',
            emisor_regimen_fiscal: data.config.emisor_regimen_fiscal || '612',
            emisor_codigo_postal: data.config.emisor_codigo_postal || '',
            emisor_email: data.config.emisor_email || '',
            emisor_telefono: data.config.emisor_telefono || '',
            emisor_direccion: data.config.emisor_direccion || '',
            emisor_ciudad: data.config.emisor_ciudad || '',
            emisor_estado: data.config.emisor_estado || '',
            serie_default: data.config.serie_default || 'A',
            folio_inicial: data.config.folio_inicial || 1,
            auto_send_email: data.config.auto_send_email !== false,
          });
        }
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to loaded config state
    if (config) {
      setFormData({
        api_user: config.api_user || '',
        api_password: '', // Never pre-fill password
        is_sandbox: config.is_sandbox ?? true,
        emisor_rfc: config.emisor_rfc || '',
        emisor_razon_social: config.emisor_razon_social || '',
        emisor_regimen_fiscal: config.emisor_regimen_fiscal || '612',
        emisor_codigo_postal: config.emisor_codigo_postal || '',
        emisor_email: config.emisor_email || '',
        emisor_telefono: config.emisor_telefono || '',
        emisor_direccion: config.emisor_direccion || '',
        emisor_ciudad: config.emisor_ciudad || '',
        emisor_estado: config.emisor_estado || '',
        serie_default: config.serie_default || 'A',
        folio_inicial: config.folio_inicial || 1,
        auto_send_email: config.auto_send_email !== false,
      });
    } else {
      // If no config exists, reset to initial empty state
      setFormData({
        api_user: '',
        api_password: '',
        is_sandbox: true,
        emisor_rfc: '',
        emisor_razon_social: '',
        emisor_regimen_fiscal: '612',
        emisor_codigo_postal: '',
        emisor_email: '',
        emisor_telefono: '',
        emisor_direccion: '',
        emisor_ciudad: '',
        emisor_estado: '',
        serie_default: 'A',
        folio_inicial: 1,
        auto_send_email: true,
      });
    }
    setTestResult(null);
    toast.info('Cambios descartados');
  };

  const handleTestConnection = async () => {
    if (!formData.api_user || !formData.api_password) {
      toast.error('Ingrese usuario y contraseña de Facturama');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/facturama/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_user: formData.api_user,
          api_password: formData.api_password,
          is_sandbox: formData.is_sandbox,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTestResult('success');
        toast.success('Conexión exitosa con Facturama');
      } else {
        setTestResult('error');
        toast.error(data.error || 'Error al conectar con Facturama');
      }
    } catch (error) {
      setTestResult('error');
      toast.error('Error al probar conexión');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.api_user || !formData.api_password || !formData.emisor_rfc || 
        !formData.emisor_razon_social || !formData.emisor_codigo_postal) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/facturama/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setConfig(data.config);
        toast.success('Configuración guardada exitosamente');
        loadConfig(); // Reload
      } else {
        toast.error(data.error || 'Error al guardar configuración');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadCertificates = async () => {
    if (!cerFile || !keyFile || !keyPassword) {
      toast.error('Seleccione ambos archivos (.cer y .key) y proporcione la contraseña');
      return;
    }

    setUploadingCerts(true);

    try {
      const formData = new FormData();
      formData.append('certificate_cer', cerFile);
      formData.append('certificate_key', keyFile);
      formData.append('key_password', keyPassword);

      const response = await fetch('/api/facturama/certificates', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Certificados CSD subidos exitosamente');
        setHasCertificates(true);
        setCerFile(null);
        setKeyFile(null);
        setKeyPassword('');
        // Reset file inputs
        const cerInput = document.getElementById('cer_file') as HTMLInputElement;
        const keyInput = document.getElementById('key_file') as HTMLInputElement;
        if (cerInput) cerInput.value = '';
        if (keyInput) keyInput.value = '';
      } else {
        toast.error(data.error || 'Error al subir certificados');
      }
    } catch (error) {
      console.error('Error uploading certificates:', error);
      toast.error('Error al subir certificados');
    } finally {
      setUploadingCerts(false);
    }
  };

  const handleDeleteCertificates = async () => {
    if (!confirm('¿Está seguro de eliminar los certificados CSD? Esto desactivará la facturación en producción.')) {
      return;
    }

    setDeletingCerts(true);

    try {
      const response = await fetch('/api/facturama/certificates', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Certificados eliminados exitosamente');
        setHasCertificates(false);
      } else {
        toast.error(data.error || 'Error al eliminar certificados');
      }
    } catch (error) {
      console.error('Error deleting certificates:', error);
      toast.error('Error al eliminar certificados');
    } finally {
      setDeletingCerts(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configuración de Facturación</h1>
        <p className="text-muted-foreground mt-2">
          Configure su integración con Facturama para generar facturas electrónicas (CFDI)
        </p>
      </div>

      {/* Information Banner */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-900">¿Cómo obtener las credenciales API?</CardTitle>
          </div>
          <CardDescription className="text-blue-700 space-y-3">
            <p className="font-medium">Para generar facturas REALES con valor fiscal:</p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>
                <strong>Crear cuenta de PRODUCCIÓN:</strong> Ir a <a href="https://www.facturama.mx/registro" target="_blank" rel="noopener noreferrer" className="underline font-medium">www.facturama.mx/registro</a>
                <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                  <li>Registrarse con email y crear contraseña</li>
                  <li>Confirmar email de verificación</li>
                  <li>Completar datos fiscales de tu clínica/consultorio</li>
                </ul>
              </li>
              <li>
                <strong>Adquirir suscripción API de PRODUCCIÓN:</strong>
                <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                  <li>Login en <a href="https://www.facturama.mx/login" target="_blank" rel="noopener noreferrer" className="underline font-medium">www.facturama.mx/login</a></li>
                  <li>Ir al <strong>carrito de compra</strong> (esquina superior derecha)</li>
                  <li>Seleccionar pestaña <strong>"API"</strong></li>
                  <li>Dar clic en <strong>"Comprar"</strong> en "Anualidad API"</li>
                  <li><strong>Costo:</strong> ~$1,650 MXN/año (facturación ilimitada)</li>
                  <li>Realizar pago con tarjeta de crédito/débito</li>
                  <li>Esperar confirmación de activación por email</li>
                </ul>
              </li>
              <li>
                <strong>Usar tus credenciales de cuenta:</strong>
                <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                  <li><strong>Usuario API:</strong> Tu email de registro en Facturama</li>
                  <li><strong>Contraseña API:</strong> Tu contraseña de cuenta Facturama</li>
                </ul>
              </li>
              <li>
                <strong>Configurar aquí:</strong>
                <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                  <li><strong>DESACTIVAR</strong> modo "Sandbox" (debe estar apagado)</li>
                  <li>Pegar email y contraseña de tu cuenta Facturama</li>
                  <li>Click "Probar Conexión" para verificar</li>
                  <li>Completar datos fiscales del emisor (RFC, razón social, etc.)</li>
                </ul>
              </li>
            </ol>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm font-medium text-yellow-900">
                ⚠️ <strong>Causas más comunes de error 401:</strong>
              </p>
              <ul className="text-sm text-yellow-800 mt-1 space-y-1">
                <li>• <strong>No has adquirido y activado la suscripción API</strong> en tu cuenta Facturama</li>
                <li>• Debes ir al carrito → pestaña API → comprar "Anualidad API" y pagar</li>
                <li>• El modo Sandbox debe estar <strong>APAGADO</strong> para usar credenciales de producción</li>
                <li>• Sin la suscripción API activa, las credenciales no funcionarán</li>
              </ul>
            </div>
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm font-medium text-green-900">
                💡 <strong>¿Quieres hacer pruebas primero?</strong>
              </p>
              <ul className="text-sm text-green-800 mt-1 space-y-1">
                <li>• Crea una cuenta SANDBOX en <a href="https://dev.facturama.mx/api/registro" target="_blank" rel="noopener noreferrer" className="underline">dev.facturama.mx/api/registro</a> (GRATIS)</li>
                <li>• Activa la API desde el carrito (gratis en sandbox)</li>
                <li>• Activa el modo "Sandbox" aquí para probar sin costo</li>
                <li>• Las facturas sandbox NO tienen validez fiscal</li>
              </ul>
            </div>
          </CardDescription>
        </CardHeader>
      </Card>

      {config?.is_configured && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-900">Configuración Activa</CardTitle>
            </div>
            <CardDescription className="text-green-700">
              Su sistema de facturación está configurado y listo para usar
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Facturama API Credentials */}
        <Card>
          <CardHeader>
            <CardTitle>Credenciales de Facturama</CardTitle>
            <CardDescription>
              Obtenga sus credenciales en{' '}
              <a
                href="https://www.facturama.mx"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                facturama.mx
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_sandbox}
                onCheckedChange={(checked) => setFormData({ ...formData, is_sandbox: checked })}
              />
              <Label>Modo Sandbox (pruebas)</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="api_user">Usuario API *</Label>
                <Input
                  id="api_user"
                  value={formData.api_user}
                  onChange={(e) => setFormData({ ...formData, api_user: e.target.value })}
                  placeholder="usuario@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_password">Contraseña API *</Label>
                <Input
                  id="api_password"
                  type="password"
                  value={formData.api_password}
                  onChange={(e) => setFormData({ ...formData, api_password: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || !formData.api_user || !formData.api_password}
            >
              {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {testResult === 'success' && <CheckCircle className="mr-2 h-4 w-4 text-green-600" />}
              {testResult === 'error' && <XCircle className="mr-2 h-4 w-4 text-red-600" />}
              Probar Conexión
            </Button>
          </CardContent>
        </Card>

        {/* Emisor (Business) Information */}
        <Card>
          <CardHeader>
            <CardTitle>Datos del Emisor (Su Negocio)</CardTitle>
            <CardDescription>Información fiscal de su clínica/consultorio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emisor_rfc">RFC *</Label>
                <Input
                  id="emisor_rfc"
                  value={formData.emisor_rfc}
                  onChange={(e) => setFormData({ ...formData, emisor_rfc: e.target.value.toUpperCase() })}
                  placeholder="XAXX010101000"
                  maxLength={13}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emisor_codigo_postal">Código Postal *</Label>
                <Input
                  id="emisor_codigo_postal"
                  value={formData.emisor_codigo_postal}
                  onChange={(e) => setFormData({ ...formData, emisor_codigo_postal: e.target.value })}
                  placeholder="12345"
                  maxLength={5}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emisor_razon_social">Razón Social *</Label>
              <Input
                id="emisor_razon_social"
                value={formData.emisor_razon_social}
                onChange={(e) => setFormData({ ...formData, emisor_razon_social: e.target.value })}
                placeholder="Clínica Dental Example S.A. de C.V."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emisor_regimen_fiscal">Régimen Fiscal *</Label>
              <Select
                value={formData.emisor_regimen_fiscal}
                onValueChange={(value) => setFormData({ ...formData, emisor_regimen_fiscal: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SAT_REGIMEN_FISCAL).map(([code, description]) => (
                    <SelectItem key={code} value={code}>
                      {code} - {description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emisor_email">Email</Label>
                <Input
                  id="emisor_email"
                  type="email"
                  value={formData.emisor_email}
                  onChange={(e) => setFormData({ ...formData, emisor_email: e.target.value })}
                  placeholder="contacto@clinica.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emisor_telefono">Teléfono</Label>
                <Input
                  id="emisor_telefono"
                  value={formData.emisor_telefono}
                  onChange={(e) => setFormData({ ...formData, emisor_telefono: e.target.value })}
                  placeholder="5551234567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emisor_direccion">Dirección</Label>
              <Input
                id="emisor_direccion"
                value={formData.emisor_direccion}
                onChange={(e) => setFormData({ ...formData, emisor_direccion: e.target.value })}
                placeholder="Calle Principal #123, Colonia Centro"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emisor_ciudad">Ciudad</Label>
                <Input
                  id="emisor_ciudad"
                  value={formData.emisor_ciudad}
                  onChange={(e) => setFormData({ ...formData, emisor_ciudad: e.target.value })}
                  placeholder="Ciudad de México"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emisor_estado">Estado</Label>
                <Input
                  id="emisor_estado"
                  value={formData.emisor_estado}
                  onChange={(e) => setFormData({ ...formData, emisor_estado: e.target.value })}
                  placeholder="CDMX"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración de Facturas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serie_default">Serie por Defecto</Label>
                <Input
                  id="serie_default"
                  value={formData.serie_default}
                  onChange={(e) => setFormData({ ...formData, serie_default: e.target.value })}
                  placeholder="A"
                  maxLength={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="folio_inicial">Folio Inicial</Label>
                <Input
                  id="folio_inicial"
                  type="number"
                  value={formData.folio_inicial}
                  onChange={(e) => setFormData({ ...formData, folio_inicial: parseInt(e.target.value) || 1 })}
                  min={1}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.auto_send_email}
                onCheckedChange={(checked) => setFormData({ ...formData, auto_send_email: checked })}
              />
              <Label>Enviar facturas por email automáticamente</Label>
            </div>
          </CardContent>
        </Card>

        {/* CSD Certificates Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Certificados CSD del SAT</CardTitle>
            <CardDescription>
              Suba sus certificados de Sello Digital (.cer y .key) para generar facturas en producción
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Information Banner */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900 space-y-2">
                  <p className="font-medium">¿Cómo obtener los certificados CSD?</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Ingresar al portal del SAT con su e.firma</li>
                    <li>Ir a "Trámites" → "Certificados de Sello Digital"</li>
                    <li>Solicitar nuevo certificado CSD (proceso toma ~48 horas)</li>
                    <li>Descargar archivos <code className="bg-blue-100 px-1 rounded">.cer</code> y <code className="bg-blue-100 px-1 rounded">.key</code></li>
                    <li>Guardar la contraseña que proporcionó al generar el CSD</li>
                  </ol>
                  <p className="mt-2 text-xs text-blue-700">
                    ⚠️ Los certificados CSD son OBLIGATORIOS para facturación en producción. El modo Sandbox no los requiere.
                  </p>
                </div>
              </div>
            </div>

            {hasCertificates ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Certificados CSD configurados</p>
                      <p className="text-sm text-green-700">Sus certificados están cargados y listos para usar</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteCertificates}
                    disabled={deletingCerts}
                  >
                    {deletingCerts ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Eliminar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cer_file">Archivo .cer (Certificado)</Label>
                    <Input
                      id="cer_file"
                      type="file"
                      accept=".cer"
                      onChange={(e) => setCerFile(e.target.files?.[0] || null)}
                    />
                    {cerFile && (
                      <p className="text-xs text-muted-foreground">
                        ✓ {cerFile.name} ({(cerFile.size / 1024).toFixed(2)} KB)
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="key_file">Archivo .key (Llave Privada)</Label>
                    <Input
                      id="key_file"
                      type="file"
                      accept=".key"
                      onChange={(e) => setKeyFile(e.target.files?.[0] || null)}
                    />
                    {keyFile && (
                      <p className="text-xs text-muted-foreground">
                        ✓ {keyFile.name} ({(keyFile.size / 1024).toFixed(2)} KB)
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="key_password">Contraseña del archivo .key</Label>
                  <Input
                    id="key_password"
                    type="password"
                    value={keyPassword}
                    onChange={(e) => setKeyPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-muted-foreground">
                    Esta es la contraseña que proporcionó al SAT al generar el certificado CSD
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUploadCertificates}
                  disabled={uploadingCerts || !cerFile || !keyFile || !keyPassword}
                >
                  {uploadingCerts ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Subir Certificados CSD
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Configuración
          </Button>
        </div>
      </form>
    </div>
  );
}
