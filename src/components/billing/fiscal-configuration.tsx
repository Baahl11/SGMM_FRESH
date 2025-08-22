"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Save, TestTube, Settings, Mail, Send } from "lucide-react";
import ApiService from "@/lib/api-service";

interface BillingSettings {
  id?: number;
  rfc_emisor: string;
  razon_social: string;
  regimen_fiscal: string;
  codigo_postal: string;
  lugar_expedicion: string;
  pac_provider: string;
  pac_username: string;
  pac_password: string;
  pac_mode: string;
  serie_facturas: string;
  siguiente_folio: number;
  
  // Configuración de Email
  email_enabled: boolean;
  smtp_server: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  email_from: string;
  email_from_name: string;
  email_subject_template: string;
  email_body_template: string;
}

const REGIMENES_FISCALES = [
  { value: "601", label: "601 - General de Ley Personas Morales" },
  { value: "603", label: "603 - Personas Morales con Fines no Lucrativos" },
  { value: "605", label: "605 - Sueldos y Salarios e Ingresos Asimilados a Salarios" },
  { value: "606", label: "606 - Arrendamiento" },
  { value: "608", label: "608 - Demás ingresos" },
  { value: "612", label: "612 - Personas Físicas con Actividades Empresariales y Profesionales" },
  { value: "614", label: "614 - Ingresos por intereses" },
  { value: "616", label: "616 - Sin obligaciones fiscales" },
  { value: "621", label: "621 - Incorporación Fiscal" },
  { value: "622", label: "622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras" },
  { value: "625", label: "625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas" },
  { value: "626", label: "626 - Régimen Simplificado de Confianza" }
];

const PAC_PROVIDERS = [
  { value: "facturama", label: "Facturama" },
  { value: "finkok", label: "Finkok" },
  { value: "ecodex", label: "Ecodex" },
  { value: "cfditech", label: "CFDITech" }
];

interface FiscalConfigurationProps {
  onSettingsUpdate?: () => void;
}

export default function FiscalConfiguration({ onSettingsUpdate }: FiscalConfigurationProps) {
  const [settings, setSettings] = useState<BillingSettings>({
    rfc_emisor: '',
    razon_social: '',
    regimen_fiscal: '612',
    codigo_postal: '',
    lugar_expedicion: '',
    pac_provider: 'facturama',
    pac_username: '',
    pac_password: '',
    pac_mode: 'sandbox',
    serie_facturas: 'FAC',
    siguiente_folio: 1,
    
    // Configuración de Email
    email_enabled: false,
    smtp_server: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    email_from: '',
    email_from_name: '',
    email_subject_template: 'Factura Electrónica - Folio {folio}',
    email_body_template: `Estimado/a {nombre_paciente},

Adjunto encontrará su factura electrónica correspondiente a los servicios médicos proporcionados.

Detalles de la factura:
- Folio: {folio}
- Serie: {serie}
- Fecha: {fecha_factura}
- Total: $\{total}
- UUID: {uuid_sat}

Gracias por confiar en nuestros servicios.

Atentamente,
{razon_social}`
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getBillingSettings();
      if (response.data) {
        setSettings({
          id: response.data.id,
          rfc_emisor: response.data.rfc_emisor || '',
          razon_social: response.data.razon_social || '',
          regimen_fiscal: response.data.regimen_fiscal || '612',
          codigo_postal: response.data.codigo_postal || '',
          lugar_expedicion: response.data.lugar_expedicion || '',
          pac_provider: response.data.pac_provider || 'facturama',
          pac_username: response.data.pac_username || '',
          pac_password: response.data.pac_password || '',
          pac_mode: response.data.pac_mode || 'sandbox',
          serie_facturas: response.data.serie_facturas || 'FAC',
          siguiente_folio: response.data.siguiente_folio || 1,
          // Email configuration
          email_enabled: response.data.email_enabled || false,
          smtp_server: response.data.smtp_server || '',
          smtp_port: response.data.smtp_port || 587,
          smtp_username: response.data.smtp_username || '',
          smtp_password: response.data.smtp_password || '',
          email_from: response.data.email_from || '',
          email_from_name: response.data.email_from_name || '',
          email_subject_template: response.data.email_subject_template || 'Factura Electrónica - Folio {folio}',
          email_body_template: response.data.email_body_template || `Estimado/a {nombre_paciente},

Adjunto encontrará su factura electrónica correspondiente a los servicios médicos proporcionados.

Detalles de la factura:
- Folio: {folio}
- Serie: {serie}
- Fecha: {fecha_factura}
- Total: $\{total}
- UUID: {uuid_sat}

Gracias por confiar en nuestros servicios.

Atentamente,
{razon_social}`
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // No mostrar error si no hay configuración (primera vez)
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      
      // Si tenemos un ID, actualizamos; si no, creamos nuevo
      const response = settings.id 
        ? await ApiService.updateBillingSettings(settings.id, settings)
        : await ApiService.createBillingSettings(settings);
        
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Si se creó un nuevo registro, actualizamos el ID local
      if (!settings.id && response.data?.id) {
        setSettings(prev => ({ ...prev, id: response.data.id }));
      }
      
      setMessage({ type: 'success', text: 'Configuración guardada exitosamente' });
      if (onSettingsUpdate) {
        onSettingsUpdate();
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: error.message || 'Error al guardar la configuración' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      setMessage(null);
      
      // Crear un objeto de prueba simple
      const testData = {
        provider: settings.pac_provider,
        username: settings.pac_username,
        password: settings.pac_password,
        mode: settings.pac_mode
      };
      
      // Por ahora solo validamos que los campos estén llenos
      if (!testData.username || !testData.password) {
        throw new Error('Usuario y contraseña son requeridos');
      }
      
      setMessage({ type: 'success', text: 'Configuración válida. Prueba de conexión pendiente de implementar.' });
    } catch (error: any) {
      console.error('Error testing PAC:', error);
      setMessage({ type: 'error', text: error.message || 'Error al probar la configuración' });
    } finally {
      setTesting(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      setTesting(true);
      setMessage(null);
      
      // Validar campos requeridos
      if (!settings.smtp_server || !settings.smtp_username || !settings.smtp_password || !settings.email_from) {
        throw new Error('Todos los campos marcados con * son requeridos para probar el email');
      }
      
      // Llamar al endpoint de prueba
      const response = await ApiService.testEmailConfiguration();
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setMessage({ type: 'success', text: 'Configuración de email válida. Conexión SMTP exitosa.' });
    } catch (error: any) {
      console.error('Error testing email:', error);
      setMessage({ type: 'error', text: error.message || 'Error al probar la configuración de email' });
    } finally {
      setTesting(false);
    }
  };

  const handleInputChange = (field: keyof BillingSettings, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando configuración...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert className={message.type === 'error' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}>
          <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Datos Fiscales de la Empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Datos Fiscales de la Empresa
          </CardTitle>
          <CardDescription>
            Información fiscal que aparecerá en las facturas electrónicas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rfc">RFC *</Label>
              <Input
                id="rfc"
                value={settings.rfc_emisor}
                onChange={(e) => handleInputChange('rfc_emisor', e.target.value.toUpperCase())}
                placeholder="ABC123456789"
                maxLength={13}
                className="uppercase"
              />
            </div>
            <div>
              <Label htmlFor="codigo_postal">Código Postal *</Label>
              <Input
                id="codigo_postal"
                value={settings.codigo_postal}
                onChange={(e) => handleInputChange('codigo_postal', e.target.value)}
                placeholder="12345"
                maxLength={5}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="razon_social">Razón Social *</Label>
            <Input
              id="razon_social"
              value={settings.razon_social}
              onChange={(e) => handleInputChange('razon_social', e.target.value)}
              placeholder="Mi Empresa S.A. de C.V."
            />
          </div>
          
          <div>
            <Label htmlFor="regimen_fiscal">Régimen Fiscal *</Label>
            <Select 
              value={settings.regimen_fiscal} 
              onValueChange={(value) => handleInputChange('regimen_fiscal', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tu régimen fiscal" />
              </SelectTrigger>
              <SelectContent>
                {REGIMENES_FISCALES.map((regimen) => (
                  <SelectItem key={regimen.value} value={regimen.value}>
                    {regimen.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="lugar_expedicion">Lugar de Expedición *</Label>
            <Input
              id="lugar_expedicion"
              value={settings.lugar_expedicion}
              onChange={(e) => handleInputChange('lugar_expedicion', e.target.value)}
              placeholder="Ciudad, Estado"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="serie_facturas">Serie de Facturas</Label>
              <Input
                id="serie_facturas"
                value={settings.serie_facturas}
                onChange={(e) => handleInputChange('serie_facturas', e.target.value.toUpperCase())}
                placeholder="FAC"
                maxLength={10}
                className="uppercase"
              />
            </div>
            <div>
              <Label htmlFor="siguiente_folio">Siguiente Folio</Label>
              <Input
                id="siguiente_folio"
                type="number"
                value={settings.siguiente_folio}
                onChange={(e) => handleInputChange('siguiente_folio', parseInt(e.target.value) || 1)}
                min={1}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración del PAC */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración del PAC</CardTitle>
          <CardDescription>
            Proveedor Autorizado de Certificación para timbrado de facturas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="pac_provider">Proveedor de PAC *</Label>
            <Select 
              value={settings.pac_provider} 
              onValueChange={(value) => handleInputChange('pac_provider', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAC_PROVIDERS.map((provider) => (
                  <SelectItem key={provider.value} value={provider.value}>
                    {provider.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pac_username">Usuario PAC *</Label>
              <Input
                id="pac_username"
                value={settings.pac_username}
                onChange={(e) => handleInputChange('pac_username', e.target.value)}
                placeholder="usuario@pac.com"
              />
            </div>
            <div>
              <Label htmlFor="pac_password">Contraseña PAC *</Label>
              <Input
                id="pac_password"
                type="password"
                value={settings.pac_password}
                onChange={(e) => handleInputChange('pac_password', e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="pac_mode">Modo de Operación</Label>
            <Select 
              value={settings.pac_mode} 
              onValueChange={(value) => handleInputChange('pac_mode', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox (Pruebas)</SelectItem>
                <SelectItem value="production">Producción</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleTest} 
              variant="outline" 
              disabled={testing || !settings.pac_username || !settings.pac_password}
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Probando...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4 mr-2" />
                  Validar Configuración
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuración de Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Configuración de Email
          </CardTitle>
          <CardDescription>
            Configuración para envío automático de facturas por correo electrónico
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="email_enabled"
              checked={settings.email_enabled}
              onCheckedChange={(checked) => handleInputChange('email_enabled', checked)}
            />
            <Label htmlFor="email_enabled">Habilitar envío automático por email</Label>
          </div>

          {settings.email_enabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtp_server">Servidor SMTP *</Label>
                  <Input
                    id="smtp_server"
                    value={settings.smtp_server}
                    onChange={(e) => handleInputChange('smtp_server', e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_port">Puerto SMTP *</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    value={settings.smtp_port}
                    onChange={(e) => handleInputChange('smtp_port', parseInt(e.target.value) || 587)}
                    placeholder="587"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtp_username">Usuario/Email SMTP *</Label>
                  <Input
                    id="smtp_username"
                    type="email"
                    value={settings.smtp_username}
                    onChange={(e) => handleInputChange('smtp_username', e.target.value)}
                    placeholder="tu-email@gmail.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_password">Contraseña SMTP *</Label>
                  <Input
                    id="smtp_password"
                    type="password"
                    value={settings.smtp_password}
                    onChange={(e) => handleInputChange('smtp_password', e.target.value)}
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Para Gmail, usa una "Contraseña de aplicación"
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email_from">Email remitente *</Label>
                  <Input
                    id="email_from"
                    type="email"
                    value={settings.email_from}
                    onChange={(e) => handleInputChange('email_from', e.target.value)}
                    placeholder="facturas@tuconsultorio.com"
                  />
                </div>
                <div>
                  <Label htmlFor="email_from_name">Nombre remitente</Label>
                  <Input
                    id="email_from_name"
                    value={settings.email_from_name}
                    onChange={(e) => handleInputChange('email_from_name', e.target.value)}
                    placeholder="Consultorio Médico"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email_subject_template">Asunto del email</Label>
                <Input
                  id="email_subject_template"
                  value={settings.email_subject_template}
                  onChange={(e) => handleInputChange('email_subject_template', e.target.value)}
                  placeholder="Factura Electrónica - Folio {folio}"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Variables disponibles: {'{folio}'}, {'{serie}'}, {'{nombre_paciente}'}
                </p>
              </div>

              <div>
                <Label htmlFor="email_body_template">Cuerpo del email</Label>
                <Textarea
                  id="email_body_template"
                  value={settings.email_body_template}
                  onChange={(e) => handleInputChange('email_body_template', e.target.value)}
                  rows={8}
                  placeholder="Mensaje personalizado..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Variables: {'{nombre_paciente}'}, {'{folio}'}, {'{serie}'}, {'{fecha_factura}'}, {'{total}'}, {'{uuid_sat}'}, {'{razon_social}'}
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleTestEmail} 
                  variant="outline" 
                  disabled={testing || !settings.smtp_server || !settings.smtp_username}
                >
                  {testing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Probando Email...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Probar Configuración Email
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Botones de Acción */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Guardar Configuración
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
