'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Loader2, CheckCircle, XCircle, AlertCircle, Upload, FileCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { SAT_REGIMEN_FISCAL } from '@/lib/types/facturama';
import type { FacturamaConfig, FacturamaConfigInput } from '@/lib/types/facturama';

const inputClass =
  'h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/60 focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400/30';

export default function FacturacionSettingsPage() {
  const [config, setConfig] = useState<Partial<FacturamaConfig> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
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
            api_password: '',
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

  const resetForm = (source?: Partial<FacturamaConfig> | null) => {
    if (source) {
      setFormData({
        api_user: source.api_user || '',
        api_password: '',
        is_sandbox: source.is_sandbox ?? true,
        emisor_rfc: source.emisor_rfc || '',
        emisor_razon_social: source.emisor_razon_social || '',
        emisor_regimen_fiscal: source.emisor_regimen_fiscal || '612',
        emisor_codigo_postal: source.emisor_codigo_postal || '',
        emisor_email: source.emisor_email || '',
        emisor_telefono: source.emisor_telefono || '',
        emisor_direccion: source.emisor_direccion || '',
        emisor_ciudad: source.emisor_ciudad || '',
        emisor_estado: source.emisor_estado || '',
        serie_default: source.serie_default || 'A',
        folio_inicial: source.folio_inicial || 1,
        auto_send_email: source.auto_send_email !== false,
      });
    } else {
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
  };

  const handleCancel = () => {
    resetForm(config);
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
      console.error('Error testing connection:', error);
      setTestResult('error');
      toast.error('Error al probar conexión');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    if (
      !formData.api_user ||
      !formData.api_password ||
      !formData.emisor_rfc ||
      !formData.emisor_razon_social ||
      !formData.emisor_codigo_postal
    ) {
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
        loadConfig();
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
      const payload = new FormData();
      payload.append('certificate_cer', cerFile);
      payload.append('certificate_key', keyFile);
      payload.append('key_password', keyPassword);

      const response = await fetch('/api/facturama/certificates', {
        method: 'POST',
        body: payload,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Certificados CSD subidos exitosamente');
        setHasCertificates(true);
        setCerFile(null);
        setKeyFile(null);
        setKeyPassword('');
        const cerInput = document.getElementById('cer_file') as HTMLInputElement | null;
        const keyInput = document.getElementById('key_file') as HTMLInputElement | null;
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

  const isConfigured = Boolean(config?.is_configured);
  const heroStats = [
    {
      label: 'Integración',
      value: isConfigured ? 'Activa' : 'Pendiente',
      helper: isConfigured ? 'Facturas listas para emitirse' : 'Completa las credenciales',
      accent: isConfigured ? 'text-emerald-200' : 'text-white',
    },
    {
      label: 'Ambiente',
      value: formData.is_sandbox ? 'Sandbox' : 'Producción',
      helper: formData.is_sandbox ? 'Solo pruebas' : 'Emitirá CFDI reales',
      accent: formData.is_sandbox ? 'text-sky-200' : 'text-amber-200',
    },
    {
      label: 'Certificados CSD',
      value: hasCertificates ? 'Cargados' : 'Pendientes',
      helper: hasCertificates ? 'Encriptados de forma segura' : 'Sube tus .cer / .key',
      accent: hasCertificates ? 'text-emerald-200' : 'text-white',
    },
  ];

  const onboardingSteps = [
    {
      title: 'Crea tu cuenta',
      description: 'Regístrate en facturama.mx usando el correo de la clínica.',
      action: {
        label: 'Abrir Facturama',
        href: 'https://www.facturama.mx/registro',
      },
    },
    {
      title: 'Activa la API',
      description: 'Compra la anualidad API (carrito → pestaña API) para emitir ilimitado.',
    },
    {
      title: 'Conecta Facturama',
      description: 'Desactiva sandbox, ingresa usuario/contraseña y prueba la conexión desde el panel.',
    },
    {
      title: 'Completa tu CFDI',
      description: 'RFC, razón social, CP fiscal y régimen deben coincidir con el SAT.',
    },
  ];

  const sandboxChip = formData.is_sandbox ? 'bg-white/10 text-white' : 'bg-amber-500/20 text-amber-100';
  const regimenEntries = Object.entries(SAT_REGIMEN_FISCAL);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <GlassPanel className="flex items-center gap-3 border-white/10 bg-white/5 px-6 py-4 text-white">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-300" />
          Cargando configuración de Facturama...
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 text-white">
      <GlassPanel className="relative overflow-hidden border-white/10 bg-gradient-to-br from-emerald-500/20 via-indigo-600/10 to-slate-950 p-6 md:p-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="mb-5 flex items-center gap-3 text-white/70">
              <div className="rounded-2xl bg-white/10 p-3">
                <FileCheck className="h-6 w-6" />
              </div>
              <span className="text-xs uppercase tracking-[0.45em] text-white/60">Facturación CFDI</span>
            </div>
            <h1 className="text-3xl font-semibold md:text-4xl">Conecta Facturama y emite CFDI desde el panel</h1>
            <p className="mt-4 text-base text-white/80">
              Tus credenciales y certificados se cifran para que puedas timbrar facturas en segundos, sin salir del panel.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="aura-cta">
                <a href="https://www.facturama.mx/registro" target="_blank" rel="noopener noreferrer">
                  Crear cuenta Facturama
                </a>
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="rounded-2xl border border-white/15 bg-white/5 text-white hover:bg-white/10"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.open('https://ayuda.facturama.mx', '_blank');
                  }
                }}
              >
                Centro de ayuda Facturama
              </Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {heroStats.map((stat) => (
              <div key={stat.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">{stat.label}</p>
                <p className={`mt-3 text-3xl font-semibold ${stat.accent}`}>{stat.value}</p>
                <p className="mt-2 text-sm text-white/70">{stat.helper}</p>
              </div>
            ))}
          </div>
        </div>
      </GlassPanel>

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassPanel className="space-y-5 p-6 lg:col-span-2">
          <div className="flex items-center gap-3 text-white">
            <AlertCircle className="h-5 w-5 text-amber-200" />
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">Checklist</p>
              <h2 className="text-2xl font-semibold">Pasos para activar la timbradora</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {onboardingSteps.map((step) => (
              <div key={step.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">{step.title}</p>
                <p className="mt-2 text-sm text-white/70">{step.description}</p>
                {step.action && (
                  <Button
                    asChild
                    variant="ghost"
                    className="mt-3 h-9 rounded-2xl border border-white/15 bg-white/5 text-xs uppercase tracking-[0.3em] text-white/70 hover:text-white"
                  >
                    <a href={step.action.href} target="_blank" rel="noopener noreferrer">
                      {step.action.label}
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </GlassPanel>
        <GlassPanel className="space-y-4 p-6">
          <p className="text-sm font-semibold text-white">Tips para evitar errores 401</p>
          <ul className="space-y-2 text-sm text-white/70">
            <li>• Confirma que compraste la anualidad API en Facturama.</li>
            <li>• Usa exactamente el mismo correo y contraseña.</li>
            <li>• Para producción, apaga el modo sandbox.</li>
            <li>• Espera unos minutos después de pagar la suscripción.</li>
          </ul>
          <div className={`rounded-2xl border ${sandboxChip} border-white/15 px-4 py-3 text-xs uppercase tracking-[0.4em]`}>
            Modo actual: {formData.is_sandbox ? 'Sandbox' : 'Producción'}
          </div>
        </GlassPanel>
      </div>

      {isConfigured && (
        <GlassPanel className="flex items-center justify-between border-emerald-400/40 bg-emerald-500/10 p-5 text-white">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-300" />
            <div>
              <p className="text-sm font-semibold">Configuración activa</p>
              <p className="text-xs text-white/70">El sistema puede timbrar CFDI usando tus datos actuales.</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="rounded-2xl border border-white/15 bg-white/5 text-white hover:bg-white/10"
            onClick={loadConfig}
          >
            Actualizar datos
          </Button>
        </GlassPanel>
      )}

      {testResult && (
        <GlassPanel
          className={`flex items-center gap-3 border ${
            testResult === 'success' ? 'border-emerald-400/50 bg-emerald-500/10' : 'border-rose-400/50 bg-rose-500/10'
          } p-4 text-sm`}
        >
          {testResult === 'success' ? (
            <CheckCircle className="h-4 w-4 text-emerald-200" />
          ) : (
            <XCircle className="h-4 w-4 text-rose-200" />
          )}
          <span>
            {testResult === 'success'
              ? 'Conexión validada con Facturama.'
              : 'No pudimos conectar con Facturama, revisa tus credenciales.'}
          </span>
        </GlassPanel>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <GlassPanel className="space-y-5 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">Credenciales</p>
            <h2 className="text-2xl font-semibold text-white">Conexión con Facturama</h2>
            <p className="mt-2 text-sm text-white/70">Las llaves se cifran en reposo con AES-256 y rotación automática.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="api_user" className="text-white">
                Usuario API (correo)
              </Label>
              <Input
                id="api_user"
                value={formData.api_user}
                onChange={(event) => setFormData({ ...formData, api_user: event.target.value })}
                className={inputClass}
                placeholder="correo@facturama.mx"
              />
            </div>
            <div>
              <Label htmlFor="api_password" className="text-white">
                Contraseña API
              </Label>
              <Input
                id="api_password"
                type="password"
                value={formData.api_password}
                onChange={(event) => setFormData({ ...formData, api_password: event.target.value })}
                className={inputClass}
                placeholder="••••••••"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div>
              <p className="text-sm font-semibold text-white">Modo Sandbox</p>
              <p className="text-xs text-white/70">Úsalo sólo para pruebas. Para timbrar real debe estar apagado.</p>
            </div>
            <Switch
              checked={formData.is_sandbox}
              onCheckedChange={(checked) => setFormData({ ...formData, is_sandbox: checked })}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="aura-cta aura-cta--ghost"
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Probando...
                </>
              ) : (
                <>Probar conexión</>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              className="rounded-2xl border border-white/15 text-white"
            >
              Descartar cambios
            </Button>
          </div>
        </GlassPanel>

        <GlassPanel className="space-y-5 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">Datos fiscales</p>
            <h2 className="text-2xl font-semibold">Emisor CFDI</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="emisor_rfc" className="text-white">
                RFC *
              </Label>
              <Input
                id="emisor_rfc"
                value={formData.emisor_rfc}
                onChange={(event) => setFormData({ ...formData, emisor_rfc: event.target.value.toUpperCase() })}
                className={inputClass}
                placeholder="XAXX010101000"
              />
            </div>
            <div>
              <Label htmlFor="emisor_razon_social" className="text-white">
                Razón social *
              </Label>
              <Input
                id="emisor_razon_social"
                value={formData.emisor_razon_social}
                onChange={(event) => setFormData({ ...formData, emisor_razon_social: event.target.value })}
                className={inputClass}
                placeholder="Clínica Ejemplo S.A. de C.V."
              />
            </div>
            <div>
              <Label htmlFor="emisor_codigo_postal" className="text-white">
                Código postal *
              </Label>
              <Input
                id="emisor_codigo_postal"
                value={formData.emisor_codigo_postal}
                onChange={(event) => setFormData({ ...formData, emisor_codigo_postal: event.target.value })}
                className={inputClass}
                placeholder="01234"
              />
            </div>
            <div>
              <Label className="text-white">Régimen fiscal *</Label>
              <Select
                value={formData.emisor_regimen_fiscal}
                onValueChange={(value) => setFormData({ ...formData, emisor_regimen_fiscal: value })}
              >
                <SelectTrigger className={`${inputClass} text-left`}>
                  <SelectValue placeholder="Selecciona régimen" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-slate-900 text-white">
                  {regimenEntries.map(([clave, descripcion]) => (
                    <SelectItem key={clave} value={clave}>
                      {clave} — {descripcion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="emisor_email" className="text-white">
                Correo de contacto
              </Label>
              <Input
                id="emisor_email"
                type="email"
                value={formData.emisor_email}
                onChange={(event) => setFormData({ ...formData, emisor_email: event.target.value })}
                className={inputClass}
                placeholder="facturacion@clinica.com"
              />
            </div>
            <div>
              <Label htmlFor="emisor_telefono" className="text-white">
                Teléfono
              </Label>
              <Input
                id="emisor_telefono"
                value={formData.emisor_telefono}
                onChange={(event) => setFormData({ ...formData, emisor_telefono: event.target.value })}
                className={inputClass}
                placeholder="55 1234 5678"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="emisor_direccion" className="text-white">
                Dirección
              </Label>
              <Input
                id="emisor_direccion"
                value={formData.emisor_direccion}
                onChange={(event) => setFormData({ ...formData, emisor_direccion: event.target.value })}
                className={inputClass}
                placeholder="Av. Reforma 123"
              />
            </div>
            <div>
              <Label htmlFor="emisor_ciudad" className="text-white">
                Ciudad
              </Label>
              <Input
                id="emisor_ciudad"
                value={formData.emisor_ciudad}
                onChange={(event) => setFormData({ ...formData, emisor_ciudad: event.target.value })}
                className={inputClass}
                placeholder="CDMX"
              />
            </div>
            <div>
              <Label htmlFor="emisor_estado" className="text-white">
                Estado
              </Label>
              <Input
                id="emisor_estado"
                value={formData.emisor_estado}
                onChange={(event) => setFormData({ ...formData, emisor_estado: event.target.value })}
                className={inputClass}
                placeholder="Ciudad de México"
              />
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="space-y-5 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">Series y envío</p>
            <h2 className="text-2xl font-semibold">Control de folios</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="serie_default" className="text-white">
                Serie predeterminada
              </Label>
              <Input
                id="serie_default"
                value={formData.serie_default}
                onChange={(event) => setFormData({ ...formData, serie_default: event.target.value.toUpperCase() })}
                className={inputClass}
                placeholder="A"
              />
            </div>
            <div>
              <Label htmlFor="folio_inicial" className="text-white">
                Folio inicial
              </Label>
              <Input
                id="folio_inicial"
                type="number"
                min={1}
                value={formData.folio_inicial}
                onChange={(event) => setFormData({ ...formData, folio_inicial: Number(event.target.value) })}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
              <div>
                <p className="text-sm font-semibold">Enviar CFDI al paciente</p>
                <p className="text-xs text-white/70">El sistema mandará el PDF/XML al correo del paciente automáticamente.</p>
              </div>
              <div className="mt-3 flex justify-end">
                <Switch
                  checked={formData.auto_send_email}
                  onCheckedChange={(checked) => setFormData({ ...formData, auto_send_email: checked })}
                />
              </div>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="flex flex-wrap gap-3 p-6">
          <Button type="submit" disabled={saving} className="aura-cta aura-cta--primary">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
              </>
            ) : (
              <>Guardar configuración</>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="rounded-2xl border border-white/15 text-white"
            onClick={handleCancel}
          >
            Cancelar
          </Button>
        </GlassPanel>
      </form>

      <GlassPanel className="space-y-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">Certificados CSD</p>
            <h2 className="text-2xl font-semibold text-white">Sube tu .cer y .key encriptados</h2>
          </div>
          {hasCertificates && (
            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100">
              Certificados cargados
            </span>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="cer_file" className="text-white">
              Archivo .cer
            </Label>
            <Input
              id="cer_file"
              type="file"
              accept=".cer"
              className="h-12 rounded-2xl border border-white/15 bg-white/5 text-sm text-white"
              onChange={(event) => setCerFile(event.target.files?.[0] || null)}
            />
          </div>
          <div>
            <Label htmlFor="key_file" className="text-white">
              Archivo .key
            </Label>
            <Input
              id="key_file"
              type="file"
              accept=".key"
              className="h-12 rounded-2xl border border-white/15 bg-white/5 text-sm text-white"
              onChange={(event) => setKeyFile(event.target.files?.[0] || null)}
            />
          </div>
          <div>
            <Label htmlFor="key_password" className="text-white">
              Contraseña del .key
            </Label>
            <Input
              id="key_password"
              type="password"
              value={keyPassword}
              onChange={(event) => setKeyPassword(event.target.value)}
              className={inputClass}
              placeholder="••••••"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={handleUploadCertificates}
            disabled={uploadingCerts}
            className="aura-cta aura-cta--ghost"
          >
            {uploadingCerts ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" /> Subir certificados
              </>
            )}
          </Button>
          {hasCertificates && (
            <Button
              type="button"
              variant="ghost"
              className="rounded-2xl border border-rose-400/40 text-rose-200 hover:bg-rose-500/10"
              onClick={handleDeleteCertificates}
              disabled={deletingCerts}
            >
              {deletingCerts ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" /> Borrar certificados
                </>
              )}
            </Button>
          )}
        </div>
        <p className="text-xs text-white/60">
          Los archivos se cifran con AES-256 y se almacenan en infraestructura redundante. Puedes eliminarlos cuando quieras.
        </p>
      </GlassPanel>
    </div>
  );
}
