'use client';

/**
 * WhatsApp Templates Management Page
 * Manage Meta-approved message templates for WhatsApp Business
 */

import { useState, useEffect } from 'react';
import { Plus, Send, Check, X, AlertCircle, MessageSquare, Trash2, Edit, ExternalLink, Copy, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
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
import { GlassPanel } from '@/components/ui/glass-panel';

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
  const [whatsappConfigured, setWhatsappConfigured] = useState(false);
  const inputClass = 'h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/60 focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400/40';
  const textareaClass = `${inputClass} min-h-[160px] py-3`;

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

  const totalTemplates = templates.length;
  const approvedTemplates = templates.filter((template) => template.status === 'approved').length;
  const pendingTemplates = templates.filter((template) => template.status === 'pending').length;
  const draftTemplates = templates.filter((template) => template.status === 'draft').length;
  const heroStats = [
    {
      label: 'Templates aprobados',
      value: approvedTemplates,
      helper: approvedTemplates ? 'Listos para enviar en WhatsApp' : 'Solicita aprobación en Meta',
      accent: 'text-emerald-200',
    },
    {
      label: 'Pendientes con Meta',
      value: pendingTemplates,
      helper: pendingTemplates ? 'Revisa el estado en Business Manager' : 'Sin solicitudes activas',
      accent: 'text-amber-200',
    },
    {
      label: 'Borradores',
      value: draftTemplates,
      helper: draftTemplates ? 'Completa y envíalos a Meta' : 'Todo publicado',
      accent: 'text-white',
    },
  ];
  const processSteps = [
    {
      step: '01',
      title: 'Crea tu template',
      description: 'Define texto, idioma y variables desde AgendaMedPro.',
    },
    {
      step: '02',
      title: 'Envíalo a Meta',
      description: 'Registra el mismo template en Business Manager.',
    },
    {
      step: '03',
      title: 'Espera aprobación',
      description: 'Meta tarda entre 1-3 días hábiles en revisar.',
    },
    {
      step: '04',
      title: 'Marca como aprobado',
      description: 'Ingresa el Template ID oficial y úsalo.',
    },
  ];

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { bg: 'bg-white/10', text: 'text-white', icon: Edit, label: 'Borrador' },
      pending: { bg: 'bg-amber-500/20', text: 'text-amber-100', icon: AlertCircle, label: 'Pendiente' },
      approved: { bg: 'bg-emerald-500/20', text: 'text-emerald-100', icon: Check, label: 'Aprobado' },
      rejected: { bg: 'bg-rose-500/20', text: 'text-rose-100', icon: X, label: 'Rechazado' },
    };

    const badge = badges[status as keyof typeof badges] || badges.draft;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${badge.bg} ${badge.text}`}>
        <Icon className="h-3 w-3" />
        {badge.label}
      </span>
    );
  };

  if (!whatsappConfigured) {
    return (
      <div className="pb-16">
        <GlassPanel className="flex flex-col gap-6 border border-white/10 bg-gradient-to-br from-rose-500/15 via-slate-900 to-slate-950 p-8 text-white">
          <div className="flex items-center gap-3 text-rose-100">
            <AlertCircle className="h-5 w-5" />
            <span className="text-xs uppercase tracking-[0.4em] text-white/60">Configuración pendiente</span>
          </div>
          <div>
            <h1 className="text-3xl font-semibold">Activa WhatsApp Business antes de crear templates</h1>
            <p className="mt-3 text-base text-white/70">
              Vincula tu cuenta en Ajustes → WhatsApp para que podamos sincronizar los mensajes con Meta y enviarlos a tus pacientes.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="aura-cta">
              <a href="/dashboard/settings/whatsapp">Ir a configuración</a>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="rounded-2xl border border-white/15 bg-white/5 text-white hover:bg-white/10"
            >
              <a
                href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver guía paso a paso
              </a>
            </Button>
          </div>
        </GlassPanel>
      </div>
    );
  }

  return (
    <Dialog open={showNewTemplateDialog} onOpenChange={setShowNewTemplateDialog}>
      <div className="space-y-8 pb-16">
        <GlassPanel className="relative overflow-hidden border border-white/10 bg-gradient-to-br from-emerald-500/20 via-indigo-600/10 to-slate-950 p-6 md:p-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <div className="mb-5 flex items-center gap-3 text-white/70">
                <div className="rounded-2xl bg-white/10 p-3">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="text-xs uppercase tracking-[0.45em] text-white/60">Plantillas Meta</span>
              </div>
              <h1 className="text-3xl font-semibold text-white md:text-4xl">Gestiona templates aprobados por Meta</h1>
              <p className="mt-4 text-base text-white/80">
                Centraliza tus mensajes utility, marketing y autenticación. AgendaMedPro guarda los borradores y sincroniza el estado con tu equipo.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <DialogTrigger asChild>
                  <Button onClick={resetForm} className="aura-cta">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo template
                  </Button>
                </DialogTrigger>
                <Button
                  asChild
                  variant="ghost"
                  className="rounded-2xl border border-white/15 bg-white/5 text-white hover:bg-white/10"
                >
                  <a
                    href="https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Políticas de Meta <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
              {heroStats.map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-white/10 bg-white/5 p-5 text-white">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/60">{stat.label}</p>
                  <p className={`mt-3 text-3xl font-semibold ${stat.accent}`}>{stat.value}</p>
                  <p className="mt-2 text-sm text-white/70">{stat.helper}</p>
                </div>
              ))}
            </div>
          </div>
        </GlassPanel>

        <div className="grid gap-6 lg:grid-cols-3">
          <GlassPanel className="space-y-6 p-6 lg:col-span-2">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">Checklist oficial</p>
              <h2 className="text-2xl font-semibold text-white">4 pasos para publicar un template</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {processSteps.map((step) => (
                <div key={step.step} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">Paso {step.step}</p>
                  <p className="mt-3 text-lg font-semibold">{step.title}</p>
                  <p className="mt-2 text-sm text-white/70">{step.description}</p>
                </div>
              ))}
            </div>
          </GlassPanel>
          <GlassPanel className="space-y-4 p-6">
            <div className="flex items-center gap-3 text-white">
              <AlertCircle className="h-5 w-5 text-amber-200" />
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-white/60">Buenas prácticas</p>
                <h3 className="text-xl font-semibold">Para evitar rechazos</h3>
              </div>
            </div>
            <ul className="list-disc space-y-2 pl-5 text-sm text-white/70">
              <li>Usa variables {`{{1}}`} en vez de datos sensibles.</li>
              <li>Evita palabras prohibidas o spam.
              </li>
              <li>Incluye instrucciones de salida en marketing (ej: "Responde STOP").</li>
              <li>Meta solo aprueba mayúsculas si el texto completo es necesario.</li>
            </ul>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
              <p className="font-semibold text-white">Tip rápido</p>
              <p className="mt-1 text-white/70">
                Copia el código del template desde AgendaMedPro y pégalo en Business Manager para reducir errores.
              </p>
            </div>
          </GlassPanel>
        </div>

        {isLoading ? (
          <GlassPanel className="flex flex-col items-center justify-center gap-3 p-10 text-white/70">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-emerald-300"></div>
            Cargando templates...
          </GlassPanel>
        ) : totalTemplates === 0 ? (
          <GlassPanel className="flex flex-col items-center gap-3 border-dashed border-white/10 bg-white/0 px-6 py-12 text-center text-white/70">
            <MessageSquare className="h-10 w-10 text-white/40" />
            <p className="text-xl font-semibold text-white">Sin templates todavía</p>
            <p className="text-sm">Crea tu primer template para automatizar recordatorios.</p>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="aura-cta">
                <Plus className="mr-2 h-4 w-4" /> Crear template
              </Button>
            </DialogTrigger>
          </GlassPanel>
        ) : (
          <div className="grid gap-4">
            {templates.map((template) => (
              <GlassPanel key={template.id} className="space-y-4 p-5 text-white">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-lg font-semibold text-white">{template.name}</p>
                      {getStatusBadge(template.status)}
                    </div>
                    <p className="text-sm text-white/60">
                      {template.category} • {template.language} • Usado {template.total_sent} veces
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => copyTemplateCode(template)}
                      className="rounded-2xl border border-white/15 bg-white/5 text-white hover:border-white/40"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {(template.status === 'draft' || template.status === 'rejected') && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleSubmitToMeta(template.id)}
                          className="rounded-2xl border border-white/15 bg-white/5 text-white hover:border-white/40"
                        >
                          <Send className="mr-2 h-4 w-4" /> Enviar a Meta
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                          className="rounded-2xl border border-white/15 bg-white/5 text-white hover:border-rose-300/60 hover:text-rose-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {template.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(template.id)}
                          className="rounded-2xl border border-white/15 bg-white/5 text-white hover:border-emerald-300/60 hover:text-emerald-100"
                        >
                          <Check className="mr-2 h-4 w-4" /> Marcar aprobado
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleReject(template.id)}
                          className="rounded-2xl border border-white/15 bg-white/5 text-white hover:border-rose-300/60 hover:text-rose-100"
                        >
                          <X className="mr-2 h-4 w-4" /> Marcar rechazado
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {template.header_text && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/50">Encabezado</p>
                    <p className="mt-1 text-sm text-white">{template.header_text}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/50">Cuerpo</p>
                  <p className="mt-2 whitespace-pre-wrap rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-white">
                    {template.body_text}
                  </p>
                </div>

                {template.footer_text && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/50">Pie de página</p>
                    <p className="mt-1 text-sm text-white/70">{template.footer_text}</p>
                  </div>
                )}

                {template.buttons && template.buttons.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/50">Botones</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {template.buttons.map((button, index) => (
                        <span
                          key={`${template.id}-button-${index}`}
                          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80"
                        >
                          {button.text}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {template.rejection_reason && (
                  <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">
                    <div className="flex items-center gap-2 font-semibold">
                      <X className="h-4 w-4" /> Rechazado por Meta
                    </div>
                    <p className="mt-1 text-white/80">{template.rejection_reason}</p>
                  </div>
                )}

                {template.meta_template_id && (
                  <p className="text-sm text-white/70">
                    Meta Template ID:{' '}
                    <code className="rounded-2xl border border-white/10 bg-white/5 px-2 py-1 text-xs">
                      {template.meta_template_id}
                    </code>
                  </p>
                )}
              </GlassPanel>
            ))}
          </div>
        )}
      </div>

      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#04060d] text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">Crear nuevo template</DialogTitle>
          <DialogDescription className="text-sm text-white/60">
            Los templates deben seguir las políticas de Meta y ser aprobados antes de usarse.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-5">
          <div>
            <Label htmlFor="name" className="text-white">
              Nombre del template *
            </Label>
            <Input
              id="name"
              placeholder="recordatorio_cita_24h"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s/g, '_') })
              }
              className={inputClass}
            />
            <p className="mt-2 text-xs text-white/60">Solo minúsculas, números y guiones bajos.</p>
          </div>

          <div>
            <Label htmlFor="category" className="text-white">
              Categoría *
            </Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger className="mt-2 rounded-2xl border border-white/10 bg-white/5 text-white">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-slate-900 text-white">
                <SelectItem value="UTILITY">UTILITY (Recordatorios, confirmaciones)</SelectItem>
                <SelectItem value="MARKETING">MARKETING (Promociones)</SelectItem>
                <SelectItem value="AUTHENTICATION">AUTHENTICATION (Códigos OTP)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="language" className="text-white">
              Idioma *
            </Label>
            <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
              <SelectTrigger className="mt-2 rounded-2xl border border-white/10 bg-white/5 text-white">
                <SelectValue placeholder="Selecciona un idioma" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-slate-900 text-white">
                <SelectItem value="es_MX">Español (México)</SelectItem>
                <SelectItem value="es_ES">Español (España)</SelectItem>
                <SelectItem value="en_US">Inglés (EE.UU.)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="header_text" className="text-white">
              Encabezado (opcional)
            </Label>
            <Input
              id="header_text"
              placeholder="¡Recordatorio de cita!"
              value={formData.header_text}
              onChange={(e) => setFormData({ ...formData, header_text: e.target.value })}
              maxLength={60}
              className={inputClass}
            />
            <p className="mt-2 text-xs text-white/60">Máximo 60 caracteres.</p>
          </div>

          <div>
            <Label htmlFor="body_text" className="text-white">
              Cuerpo del mensaje *
            </Label>
            <Textarea
              id="body_text"
              placeholder="Hola {{1}} 👋\n\nTe recordamos tu cita médica:\n📅 Fecha: {{2}}\n🕐 Hora: {{3}}\n👨‍⚕️ Doctor: {{4}}"
              value={formData.body_text}
              onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
              maxLength={1024}
              className={textareaClass}
            />
            <p className="mt-2 text-xs text-white/60">Usa variables {`{{1}}`} para datos dinámicos. Máximo 1024 caracteres.</p>
          </div>

          <div>
            <Label htmlFor="footer_text" className="text-white">
              Pie de página (opcional)
            </Label>
            <Input
              id="footer_text"
              placeholder="Responde STOP para cancelar"
              value={formData.footer_text}
              onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
              maxLength={60}
              className={inputClass}
            />
            <p className="mt-2 text-xs text-white/60">Añade instrucciones legales o de salida.</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-white">Botones (opcional)</Label>
              <span className="text-xs text-white/60">Máximo 3 quick replies</span>
            </div>
            {formData.buttons.map((button, index) => (
              <div key={`button-${index}`} className="flex gap-2">
                <Input
                  placeholder="Texto del botón"
                  value={button.text}
                  onChange={(e) => updateButton(index, e.target.value)}
                  maxLength={20}
                  className={inputClass}
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={() => removeButton(index)}
                  className="rounded-2xl border border-white/15 bg-white/5 text-white hover:border-rose-300/60"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {formData.buttons.length < 3 && (
              <Button
                type="button"
                onClick={addButton}
                className="aura-cta aura-cta--ghost w-full justify-center"
              >
                <Plus className="mr-2 h-4 w-4" /> Agregar botón
              </Button>
            )}
          </div>

          <Button
            onClick={handleCreateTemplate}
            disabled={!formData.name || !formData.body_text}
            className="aura-cta w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
          >
            Crear template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
