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
            <CardTitle className="text-blue-900">Guía Rápida: Activar Facturación Electrónica</CardTitle>
          </div>
          <CardDescription className="text-blue-700 space-y-4">
            <p className="font-medium text-base">
              Sigue estos pasos para empezar a facturar automáticamente:
            </p>

            {/* Paso 1 */}
            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <h3 className="font-semibold text-blue-900 mb-2">📝 Paso 1: Crea tu cuenta en Facturama</h3>
              <p className="text-sm mb-2">Regístrate gratis en el sitio oficial de facturación:</p>
              <a 
                href="https://www.facturama.mx/registro" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Ir a Facturama.mx →
              </a>
              <p className="text-xs text-gray-600 mt-2">Usa el mismo email que usas en tu clínica</p>
            </div>

            {/* Paso 2 */}
            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <h3 className="font-semibold text-blue-900 mb-2">💳 Paso 2: Activa el servicio de facturación</h3>
              <p className="text-sm mb-2">Dentro de tu cuenta Facturama:</p>
              <ol className="text-sm space-y-1 ml-4">
                <li>1. Ve al <strong>carrito de compras</strong> (arriba a la derecha)</li>
                <li>2. Clic en la pestaña <strong>"API"</strong></li>
                <li>3. Compra la <strong>"Anualidad API"</strong> - cuesta $1,650 al año</li>
                <li>4. Paga con tarjeta (¡facturas ilimitadas todo el año!)</li>
              </ol>
              <div className="mt-2 bg-green-50 p-2 rounded border border-green-200">
                <p className="text-xs text-green-800">✅ Recibirás un email cuando tu servicio esté activo (toma unos minutos)</p>
              </div>
            </div>

            {/* Paso 3 */}
            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <h3 className="font-semibold text-blue-900 mb-2">🔑 Paso 3: Conecta AgendaMedPro con Facturama</h3>
              <p className="text-sm mb-2">Configura la conexión aquí mismo:</p>
              <ol className="text-sm space-y-1 ml-4">
                <li>1. <strong>Apaga</strong> el switch "Modo Sandbox" (debe estar en gris)</li>
                <li>2. Escribe tu <strong>email de Facturama</strong> en "Usuario API"</li>
                <li>3. Escribe tu <strong>contraseña de Facturama</strong> en "Contraseña API"</li>
                <li>4. Clic en <strong>"Probar Conexión"</strong> - debe salir ✅ verde</li>
              </ol>
            </div>

            {/* Paso 4 */}
            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <h3 className="font-semibold text-blue-900 mb-2">🏥 Paso 4: Completa los datos de tu clínica</h3>
              <p className="text-sm mb-2">Llena la información fiscal (la que aparece en tus facturas):</p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• RFC de tu clínica/consultorio</li>
                <li>• Nombre completo del negocio (razón social)</li>
                <li>• Código postal de tu dirección fiscal</li>
                <li>• Régimen fiscal (si no sabes cuál es, pregunta a tu contador)</li>
              </ul>
            </div>

            {/* Errores comunes */}
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-900 mb-2">
                ⚠️ <strong>¿Dice "Error 401" al probar?</strong>
              </p>
              <ul className="text-sm text-yellow-800 space-y-1 ml-4">
                <li>• Verifica que <strong>SÍ compraste</strong> la suscripción API en Facturama</li>
                <li>• Revisa que el email y contraseña sean correctos</li>
                <li>• Si es para producción, <strong>desactiva</strong> el modo Sandbox</li>
                <li>• Espera unos minutos si acabas de pagar (el servicio tarda en activarse)</li>
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
            <CardTitle>Certificados del SAT (Sello Digital)</CardTitle>
            <CardDescription>
              Necesarios para emitir facturas oficiales con validez fiscal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Information Banner */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900 space-y-3">
                  <p className="font-semibold text-base">¿Qué son los certificados CSD?</p>
                  <p>
                    Son archivos de seguridad del SAT que "firman" digitalmente tus facturas. 
                    Sin ellos, no puedes facturar oficialmente (solo en modo prueba).
                  </p>

                  <div className="bg-white p-3 rounded border border-blue-100">
                    <p className="font-medium mb-2">📋 Cómo conseguir tus certificados:</p>
                    <ol className="space-y-2 ml-4">
                      <li className="text-sm">
                        <strong>1. Entra al portal del SAT</strong>
                        <br />
                        <a href="https://www.sat.gob.mx" target="_blank" className="text-blue-600 underline">www.sat.gob.mx</a> 
                        {' '}(necesitas tu e.firma para entrar)
                      </li>
                      <li className="text-sm">
                        <strong>2. Ve a "Trámites y Servicios"</strong>
                        <br />
                        Busca la opción "Certificado de Sello Digital" (CSD)
                      </li>
                      <li className="text-sm">
                        <strong>3. Genera un nuevo certificado</strong>
                        <br />
                        Te va a pedir una contraseña (¡guárdala bien!)
                      </li>
                      <li className="text-sm">
                        <strong>4. Descarga 2 archivos:</strong>
                        <br />
                        • Un archivo <code className="bg-blue-100 px-1 rounded text-xs">.cer</code> (certificado público)
                        <br />
                        • Un archivo <code className="bg-blue-100 px-1 rounded text-xs">.key</code> (llave privada)
                      </li>
                    </ol>
                  </div>

                  <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                    <p className="text-xs text-yellow-900">
                      <strong>⏱️ Nota:</strong> El SAT tarda entre 24 y 48 horas en generar tus certificados. 
                      No te preocupes, puedes configurar todo lo demás mientras tanto.
                    </p>
                  </div>
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
