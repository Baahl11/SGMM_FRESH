'use client';

/**
 * WhatsApp Templates Management Page
 * Manage Meta-approved message templates for WhatsApp Business
 */

import { useState, useEffect } from 'react';
import { Plus, Send, Check, X, AlertCircle, MessageSquare, Trash2, Edit, ExternalLink, Copy, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: string;
  language: string;
  header_type?: string;
  header_text?: string;
  body_text: string;
  footer_text?: string;
  buttons?: any[];
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  meta_template_id?: string;
  rejection_reason?: string;
  submitted_at?: string;
  approved_at?: string;
  total_sent: number;
  created_at: string;
}

export default function WhatsAppTemplatesPage() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [whatsappConfigured, setWhatsappConfigured] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'UTILITY',
    language: 'es_MX',
    header_type: '',
    header_text: '',
    body_text: '',
    footer_text: '',
    buttons: [] as any[],
  });

  useEffect(() => {
    fetchTemplates();
    checkWhatsAppConfig();
  }, []);

  const checkWhatsAppConfig = async () => {
    try {
      const response = await fetch('/api/messaging/config');
      const data = await response.json();
      setWhatsappConfigured(data.config?.whatsapp_enabled && data.config?.whatsapp_business_id);
    } catch (error) {
      console.error('Error checking WhatsApp config:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/whatsapp/templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Error al cargar templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const response = await fetch('/api/whatsapp/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Error al crear template');
        return;
      }

      toast.success('Template creado correctamente');
      setShowNewTemplateDialog(false);
      resetForm();
      fetchTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Error al crear template');
    }
  };

  const handleSubmitToMeta = async (templateId: string) => {
    try {
      const response = await fetch(`/api/whatsapp/templates/${templateId}/submit`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Error al enviar template');
        return;
      }

      toast.success('Template marcado como pending. Ahora sigue los pasos en Meta Business Manager.');
      
      // Show instructions modal
      const metaUrl = data.instructions?.meta_url;
      if (metaUrl) {
        toast.info(
          <div className="space-y-2">
            <p className="font-semibold">Próximos pasos:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Abre Meta Business Manager</li>
              <li>Crea el template con los mismos datos</li>
              <li>Envía para aprobación</li>
              <li>Vuelve aquí para marcarlo como approved</li>
            </ol>
            <Button
              size="sm"
              onClick={() => window.open(metaUrl, '_blank')}
              className="mt-2"
            >
              Abrir Meta Business Manager
            </Button>
          </div>,
          { duration: 10000 }
        );
      }

      fetchTemplates();
    } catch (error) {
      console.error('Error submitting template:', error);
      toast.error('Error al enviar template');
    }
  };

  const handleApprove = async (templateId: string) => {
    const metaTemplateId = prompt('Ingresa el Template ID asignado por Meta:');
    if (!metaTemplateId) return;

    try {
      const response = await fetch(`/api/whatsapp/templates/${templateId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meta_template_id: metaTemplateId }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Error al aprobar template');
        return;
      }

      toast.success('¡Template aprobado! Ya puedes usarlo.');
      fetchTemplates();
    } catch (error) {
      console.error('Error approving template:', error);
      toast.error('Error al aprobar template');
    }
  };

  const handleReject = async (templateId: string) => {
    const reason = prompt('¿Por qué fue rechazado por Meta?');
    if (!reason) return;

    try {
      const response = await fetch(`/api/whatsapp/templates/${templateId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejection_reason: reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Error al marcar como rechazado');
        return;
      }

      toast.success('Template marcado como rechazado');
      fetchTemplates();
    } catch (error) {
      console.error('Error rejecting template:', error);
      toast.error('Error al marcar como rechazado');
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('¿Estás seguro de eliminar este template?')) return;

    try {
      const response = await fetch(`/api/whatsapp/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Error al eliminar template');
        return;
      }

      toast.success('Template eliminado');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Error al eliminar template');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'UTILITY',
      language: 'es_MX',
      header_type: '',
      header_text: '',
      body_text: '',
      footer_text: '',
      buttons: [],
    });
    setEditingTemplate(null);
  };

  const addButton = () => {
    if (formData.buttons.length >= 3) {
      toast.error('Máximo 3 botones permitidos');
      return;
    }

    setFormData({
      ...formData,
      buttons: [
        ...formData.buttons,
        { type: 'QUICK_REPLY', text: '' },
      ],
    });
  };

  const removeButton = (index: number) => {
    const newButtons = formData.buttons.filter((_, i) => i !== index);
    setFormData({ ...formData, buttons: newButtons });
  };

  const updateButton = (index: number, text: string) => {
    const newButtons = [...formData.buttons];
    newButtons[index] = { ...newButtons[index], text };
    setFormData({ ...formData, buttons: newButtons });
  };

  const copyTemplateCode = (template: WhatsAppTemplate) => {
    const code = `Nombre: ${template.name}
Categoría: ${template.category}
Idioma: ${template.language}

${template.header_text ? `Encabezado:\n${template.header_text}\n\n` : ''}Cuerpo:
${template.body_text}

${template.footer_text ? `Pie de página:\n${template.footer_text}\n\n` : ''}${template.buttons && template.buttons.length > 0 ? `Botones:\n${template.buttons.map(b => `- ${b.text}`).join('\n')}` : ''}`;

    navigator.clipboard.writeText(code);
    toast.success('Código copiado al portapapeles');
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { color: 'bg-gray-100 text-gray-700', icon: Edit, label: 'Borrador' },
      pending: { color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle, label: 'Pendiente' },
      approved: { color: 'bg-green-100 text-green-700', icon: Check, label: 'Aprobado' },
      rejected: { color: 'bg-red-100 text-red-700', icon: X, label: 'Rechazado' },
    };

    const badge = badges[status as keyof typeof badges] || badges.draft;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  if (!whatsappConfigured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Templates de WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>WhatsApp Business no configurado</AlertTitle>
            <AlertDescription>
              Primero debes configurar WhatsApp Business en{' '}
              <a href="/dashboard/settings/whatsapp" className="text-blue-600 underline">
                Ajustes → WhatsApp
              </a>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Templates de WhatsApp
              </CardTitle>
              <CardDescription className="mt-2">
                Crea y gestiona plantillas de mensajes que deben ser aprobadas por Meta
              </CardDescription>
            </div>
            <Dialog open={showNewTemplateDialog} onOpenChange={setShowNewTemplateDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Template</DialogTitle>
                  <DialogDescription>
                    Los templates deben seguir las políticas de Meta y ser aprobados antes de usarse
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre del Template *</Label>
                    <Input
                      id="name"
                      placeholder="recordatorio_cita_24h"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Solo minúsculas, números y guiones bajos (sin espacios)
                    </p>
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTILITY">UTILITY (Recordatorios, confirmaciones)</SelectItem>
                        <SelectItem value="MARKETING">MARKETING (Promociones)</SelectItem>
                        <SelectItem value="AUTHENTICATION">AUTHENTICATION (Códigos OTP)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Header (optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="header_text">Encabezado (opcional)</Label>
                    <Input
                      id="header_text"
                      placeholder="¡Recordatorio de Cita!"
                      value={formData.header_text}
                      onChange={(e) => setFormData({ ...formData, header_text: e.target.value })}
                      maxLength={60}
                    />
                    <p className="text-xs text-muted-foreground">
                      Máximo 60 caracteres
                    </p>
                  </div>

                  {/* Body */}
                  <div className="space-y-2">
                    <Label htmlFor="body_text">Cuerpo del Mensaje *</Label>
                    <Textarea
                      id="body_text"
                      placeholder="Hola {{1}} 👋&#10;&#10;Te recordamos tu cita médica:&#10;📅 Fecha: {{2}}&#10;🕐 Hora: {{3}}&#10;👨‍⚕️ Doctor: {{4}}"
                      value={formData.body_text}
                      onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
                      rows={8}
                      maxLength={1024}
                    />
                    <p className="text-xs text-muted-foreground">
                      Usa {`{{1}}, {{2}}, {{3}}`} para variables. Máximo 1024 caracteres.
                    </p>
                  </div>

                  {/* Footer (optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="footer_text">Pie de Página (opcional)</Label>
                    <Input
                      id="footer_text"
                      placeholder="Responde STOP para cancelar"
                      value={formData.footer_text}
                      onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                      maxLength={60}
                    />
                    <p className="text-xs text-muted-foreground">
                      Máximo 60 caracteres
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="space-y-2">
                    <Label>Botones (opcional)</Label>
                    {formData.buttons.map((button, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="Texto del botón"
                          value={button.text}
                          onChange={(e) => updateButton(index, e.target.value)}
                          maxLength={20}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeButton(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {formData.buttons.length < 3 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addButton}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Botón (máx. 3)
                      </Button>
                    )}
                  </div>

                  <Button
                    onClick={handleCreateTemplate}
                    disabled={!formData.name || !formData.body_text}
                    className="w-full"
                  >
                    Crear Template
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>📋 Proceso de Aprobación</AlertTitle>
        <AlertDescription>
          <ol className="list-decimal list-inside space-y-1 mt-2 text-sm">
            <li>Crea un template aquí (estado: Borrador)</li>
            <li>Márcalo como "Enviar a Meta" (estado: Pendiente)</li>
            <li>Ve a Meta Business Manager y crea el mismo template manualmente</li>
            <li>Espera la aprobación de Meta (1-3 días hábiles)</li>
            <li>Una vez aprobado, márcalo como "Aprobado" aquí con el Template ID de Meta</li>
          </ol>
        </AlertDescription>
      </Alert>

      {/* Templates List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Cargando templates...
          </CardContent>
        </Card>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No tienes templates creados</p>
            <p className="text-sm mt-1">Crea tu primer template para empezar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {getStatusBadge(template.status)}
                    </div>
                    <CardDescription>
                      {template.category} • {template.language} • Usado {template.total_sent} veces
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyTemplateCode(template)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    {template.status === 'draft' || template.status === 'rejected' ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSubmitToMeta(template.id)}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Enviar a Meta
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    ) : template.status === 'pending' ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(template.id)}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Marcar como Aprobado
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(template.id)}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Marcar como Rechazado
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {template.header_text && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Encabezado:</p>
                    <p className="text-sm font-semibold">{template.header_text}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Cuerpo:</p>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-lg">
                    {template.body_text}
                  </p>
                </div>

                {template.footer_text && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Pie de página:</p>
                    <p className="text-sm text-muted-foreground">{template.footer_text}</p>
                  </div>
                )}

                {template.buttons && template.buttons.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Botones:</p>
                    <div className="flex gap-2">
                      {template.buttons.map((button, index) => (
                        <Button key={index} variant="outline" size="sm" disabled>
                          {button.text}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {template.rejection_reason && (
                  <Alert variant="destructive">
                    <X className="h-4 w-4" />
                    <AlertTitle>Rechazado por Meta</AlertTitle>
                    <AlertDescription>{template.rejection_reason}</AlertDescription>
                  </Alert>
                )}

                {template.meta_template_id && (
                  <div className="text-sm text-muted-foreground">
                    Meta Template ID: <code className="bg-muted px-1 py-0.5 rounded">{template.meta_template_id}</code>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
