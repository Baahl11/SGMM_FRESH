'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import AppLayout from '@/components/layout/app-layout'
import { GlassPanel } from '@/components/ui/glass-panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  Plus, FileText, Copy, ExternalLink, ToggleLeft, ToggleRight,
  Trash2, ChevronRight, CheckCircle, Clock,
} from 'lucide-react'
import { toast } from 'sonner'

interface Template {
  id: string
  title: string
  content: string
  is_active: boolean
  signatures_count: number
  created_at: string
}

interface Signature {
  id: string
  signer_name: string
  signer_email: string | null
  ip_address: string | null
  signed_at: string
}

const DEFAULT_CONTENT = `<h2>Consentimiento Informado</h2>

<p>Yo, el firmante, declaro que he sido informado(a) sobre el procedimiento médico a realizarme, incluyendo:</p>
<ul>
  <li>Naturaleza del procedimiento</li>
  <li>Beneficios esperados</li>
  <li>Riesgos y posibles complicaciones</li>
  <li>Alternativas de tratamiento</li>
</ul>

<p>He tenido la oportunidad de realizar preguntas y han sido respondidas satisfactoriamente. Doy mi consentimiento libre y voluntario para proceder.</p>`

export default function DocumentsPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partial<Template> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [detail, setDetail] = useState<{ template: Template; signatures: Signature[] } | null>(null)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/documents')
    if (res.ok) setTemplates((await res.json()).templates)
    setLoading(false)
  }, [])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  async function openDetail(t: Template) {
    const res = await fetch(`/api/documents/${t.id}`)
    if (res.ok) setDetail(await res.json())
  }

  function openNew() {
    setEditing({ title: 'Consentimiento informado', content: DEFAULT_CONTENT })
    setIsNew(true)
  }

  async function save() {
    if (!editing?.title?.trim()) { toast.error('El título es requerido'); return }
    if (!editing?.content?.trim()) { toast.error('El contenido es requerido'); return }
    setSaving(true)

    const payload = { title: editing.title, content: editing.content }
    const res = isNew
      ? await fetch('/api/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : await fetch(`/api/documents/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })

    if (res.ok) {
      const json = await res.json()
      if (isNew) setTemplates(p => [{ ...json.template, signatures_count: 0 }, ...p])
      else setTemplates(p => p.map(t => t.id === json.template.id ? { ...t, ...json.template } : t))
      setEditing(null)
      toast.success(isNew ? 'Documento creado' : 'Cambios guardados')
    } else toast.error('Error al guardar')
    setSaving(false)
  }

  async function toggleActive(t: Template) {
    const res = await fetch(`/api/documents/${t.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !t.is_active }),
    })
    if (res.ok) setTemplates(p => p.map(x => x.id === t.id ? { ...x, is_active: !x.is_active } : x))
  }

  async function deleteTemplate(id: string) {
    if (!confirm('¿Eliminar este documento y todas sus firmas?')) return
    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
    if (res.ok) { setTemplates(p => p.filter(t => t.id !== id)); toast.success('Documento eliminado') }
  }

  function copyLink(id: string) {
    navigator.clipboard.writeText(`${window.location.origin}/sign/${id}`)
    toast.success('Enlace copiado')
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Documentos firmables</h1>
            <p className="text-sm text-slate-400">Consentimientos informados con firma digital</p>
          </div>
          <Button onClick={openNew} className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white">
            <Plus className="h-4 w-4" /> Nuevo documento
          </Button>
        </div>

        <GlassPanel className="overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">Cargando...</div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <FileText className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">No hay documentos aún</p>
              <Button variant="ghost" onClick={openNew} className="mt-4 text-indigo-400">+ Crear el primero</Button>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {templates.map(t => (
                <li key={t.id} className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors">
                  <FileText className="h-5 w-5 text-indigo-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => openDetail(t)}>
                    <p className="font-medium text-white text-sm truncate">{t.title}</p>
                    <p className="text-xs text-slate-400">{t.signatures_count} firma{t.signatures_count !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={t.is_active ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'}>
                      {t.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <button onClick={() => copyLink(t.id)} title="Copiar enlace" className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"><Copy className="h-4 w-4" /></button>
                    <a href={`/sign/${t.id}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"><ExternalLink className="h-4 w-4" /></a>
                    <button onClick={() => toggleActive(t)} className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10">
                      {t.is_active ? <ToggleRight className="h-4 w-4 text-emerald-400" /> : <ToggleLeft className="h-4 w-4" />}
                    </button>
                    <button onClick={() => { setEditing(t); setIsNew(false) }} className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"><ChevronRight className="h-4 w-4" /></button>
                    <button onClick={() => deleteTemplate(t.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GlassPanel>
      </div>

      {/* Editor Sheet */}
      <Sheet open={!!editing} onOpenChange={open => { if (!open) setEditing(null) }}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-slate-900 border-white/10 text-white flex flex-col overflow-hidden">
          {editing && (
            <>
              <SheetHeader className="flex-shrink-0">
                <SheetTitle className="text-white">{isNew ? 'Nuevo documento' : 'Editar documento'}</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto space-y-4 py-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Título *</label>
                  <Input value={editing.title ?? ''} onChange={e => setEditing({ ...editing, title: e.target.value })} className="bg-white/5 border-white/10 text-white" placeholder="Consentimiento informado de cirugía" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Contenido (HTML)</label>
                  <p className="text-[11px] text-slate-500 mb-2">Puedes usar etiquetas HTML básicas: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, etc.</p>
                  <textarea
                    value={editing.content ?? ''}
                    onChange={e => setEditing({ ...editing, content: e.target.value })}
                    rows={18}
                    className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Escribe el contenido del documento..."
                  />
                </div>
              </div>
              <div className="flex-shrink-0 pt-3 border-t border-white/10 flex gap-3">
                <Button variant="ghost" onClick={() => setEditing(null)} className="flex-1 text-slate-400">Cancelar</Button>
                <Button onClick={save} disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-500">
                  {saving ? 'Guardando...' : isNew ? 'Crear' : 'Guardar'}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Signatures Sheet */}
      <Sheet open={!!detail} onOpenChange={open => { if (!open) setDetail(null) }}>
        <SheetContent side="right" className="w-full sm:max-w-lg bg-slate-900 border-white/10 text-white flex flex-col overflow-hidden">
          {detail && (
            <>
              <SheetHeader className="flex-shrink-0">
                <SheetTitle className="text-white">{detail.template.title}</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto space-y-4 py-4">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                  <p className="text-sm text-white">{detail.signatures.length} firma{detail.signatures.length !== 1 ? 's' : ''} recibida{detail.signatures.length !== 1 ? 's' : ''}</p>
                  <button
                    onClick={() => copyLink(detail.template.id)}
                    className="ml-auto flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copiar enlace
                  </button>
                </div>

                {detail.signatures.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">Sin firmas aún</p>
                ) : (
                  <ul className="space-y-3">
                    {detail.signatures.map(sig => (
                      <li key={sig.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-white text-sm">{sig.signer_name}</p>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(sig.signed_at).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-xs text-slate-400">
                          {sig.signer_email && <span>{sig.signer_email}</span>}
                          {sig.ip_address && <span>IP: {sig.ip_address}</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AppLayout>
  )
}
