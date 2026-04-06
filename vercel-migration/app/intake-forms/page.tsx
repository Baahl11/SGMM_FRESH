'use client'

import { useEffect, useState, useCallback } from 'react'
import AppLayout from '@/components/layout/app-layout'
import { GlassPanel } from '@/components/ui/glass-panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Plus, Trash2, GripVertical, Copy, Eye, ChevronRight,
  ToggleLeft, ToggleRight, ClipboardList, ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'

type FieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'phone' | 'email'

interface FormField {
  id: string
  type: FieldType
  label: string
  required: boolean
  options?: string[]  // for select/radio/checkbox
  placeholder?: string
}

interface IntakeForm {
  id: string
  title: string
  description: string | null
  fields: FormField[]
  is_active: boolean
  created_at: string
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Texto corto' },
  { value: 'textarea', label: 'Texto largo' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Teléfono' },
  { value: 'date', label: 'Fecha' },
  { value: 'select', label: 'Lista desplegable' },
  { value: 'radio', label: 'Opción única' },
  { value: 'checkbox', label: 'Opción múltiple' },
]

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

function defaultField(): FormField {
  return { id: uid(), type: 'text', label: '', required: false }
}

export default function IntakeFormsPage() {
  const [forms, setForms] = useState<IntakeForm[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<IntakeForm | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchForms = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/intake-forms')
    if (res.ok) setForms((await res.json()).forms)
    setLoading(false)
  }, [])

  useEffect(() => { fetchForms() }, [fetchForms])

  function openNew() {
    setEditing({ id: '', title: 'Nuevo formulario', description: '', fields: [defaultField()], is_active: true, created_at: '' })
    setIsNew(true)
  }

  function openEdit(form: IntakeForm) {
    setEditing(JSON.parse(JSON.stringify(form)))  // deep clone
    setIsNew(false)
  }

  async function save() {
    if (!editing) return
    if (!editing.title.trim()) { toast.error('El título es requerido'); return }
    setSaving(true)

    const payload = { title: editing.title, description: editing.description, fields: editing.fields }
    const res = isNew
      ? await fetch('/api/intake-forms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : await fetch(`/api/intake-forms/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })

    if (res.ok) {
      const json = await res.json()
      if (isNew) setForms(prev => [json.form, ...prev])
      else setForms(prev => prev.map(f => f.id === json.form.id ? json.form : f))
      setEditing(null)
      toast.success(isNew ? 'Formulario creado' : 'Cambios guardados')
    } else {
      toast.error('Error al guardar')
    }
    setSaving(false)
  }

  async function toggleActive(form: IntakeForm) {
    const res = await fetch(`/api/intake-forms/${form.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !form.is_active }),
    })
    if (res.ok) {
      const { form: updated } = await res.json()
      setForms(prev => prev.map(f => f.id === form.id ? { ...f, is_active: updated.is_active } : f))
    }
  }

  async function deleteForm(formId: string) {
    if (!confirm('¿Eliminar este formulario y todas sus respuestas?')) return
    const res = await fetch(`/api/intake-forms/${formId}`, { method: 'DELETE' })
    if (res.ok) {
      setForms(prev => prev.filter(f => f.id !== formId))
      toast.success('Formulario eliminado')
    }
  }

  function copyLink(formId: string) {
    const url = `${window.location.origin}/f/${formId}`
    navigator.clipboard.writeText(url)
    toast.success('Enlace copiado')
  }

  // --- Field editor helpers ---
  function addField() {
    if (!editing) return
    setEditing({ ...editing, fields: [...editing.fields, defaultField()] })
  }

  function updateField(index: number, patch: Partial<FormField>) {
    if (!editing) return
    const fields = [...editing.fields]
    fields[index] = { ...fields[index], ...patch }
    setEditing({ ...editing, fields })
  }

  function removeField(index: number) {
    if (!editing) return
    setEditing({ ...editing, fields: editing.fields.filter((_, i) => i !== index) })
  }

  function moveField(from: number, to: number) {
    if (!editing) return
    const fields = [...editing.fields]
    const [moved] = fields.splice(from, 1)
    fields.splice(to, 0, moved)
    setEditing({ ...editing, fields })
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Formularios de intake</h1>
            <p className="text-sm text-slate-400">Los pacientes los llenan antes de su consulta</p>
          </div>
          <Button onClick={openNew} className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white">
            <Plus className="h-4 w-4" /> Nuevo formulario
          </Button>
        </div>

        {/* List */}
        <GlassPanel className="overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">Cargando...</div>
          ) : forms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <ClipboardList className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">No hay formularios aún</p>
              <Button variant="ghost" onClick={openNew} className="mt-4 text-indigo-400">
                + Crear el primero
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {forms.map(form => (
                <li key={form.id} className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors">
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => openEdit(form)}>
                    <p className="font-medium text-white text-sm truncate">{form.title}</p>
                    <p className="text-xs text-slate-400">
                      {form.fields.length} campo{form.fields.length !== 1 ? 's' : ''}{' '}
                      · {form.description ?? 'Sin descripción'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={form.is_active
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-500/20 text-slate-400 border-slate-500/30'}>
                      {form.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <button onClick={() => copyLink(form.id)} title="Copiar enlace" className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white">
                      <Copy className="h-4 w-4" />
                    </button>
                    <a href={`/f/${form.id}`} target="_blank" rel="noopener noreferrer" title="Ver formulario" className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button onClick={() => toggleActive(form)} title="Activar/Desactivar" className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white">
                      {form.is_active ? <ToggleRight className="h-4 w-4 text-emerald-400" /> : <ToggleLeft className="h-4 w-4" />}
                    </button>
                    <a href={`/intake-forms/${form.id}/responses`} className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-indigo-300" title="Ver respuestas">
                      <Eye className="h-4 w-4" />
                    </a>
                    <button onClick={() => deleteForm(form.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => openEdit(form)} className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GlassPanel>
      </div>

      {/* Builder Sheet */}
      <Sheet open={!!editing} onOpenChange={open => { if (!open) setEditing(null) }}>
        <SheetContent side="right" className="w-full sm:max-w-lg bg-slate-900 border-white/10 text-white flex flex-col overflow-hidden">
          {editing && (
            <>
              <SheetHeader className="flex-shrink-0">
                <SheetTitle className="text-white">{isNew ? 'Nuevo formulario' : 'Editar formulario'}</SheetTitle>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto space-y-5 py-4 pr-1">
                {/* Title + description */}
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-400">Título *</label>
                    <Input
                      value={editing.title}
                      onChange={e => setEditing({ ...editing, title: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="Ej: Historial de salud general"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-400">Descripción (opcional)</label>
                    <Textarea
                      value={editing.description ?? ''}
                      onChange={e => setEditing({ ...editing, description: e.target.value })}
                      rows={2}
                      className="bg-white/5 border-white/10 text-white resize-none"
                      placeholder="Instrucciones para el paciente"
                    />
                  </div>
                </div>

                {/* Fields */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Campos ({editing.fields.length})</p>
                    <Button onClick={addField} size="sm" variant="ghost" className="gap-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 h-7 text-xs">
                      <Plus className="h-3 w-3" /> Agregar campo
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {editing.fields.map((field, idx) => (
                      <div key={field.id} className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col gap-0.5 cursor-ns-resize text-slate-600">
                            <button onClick={() => idx > 0 && moveField(idx, idx - 1)} disabled={idx === 0} className="disabled:opacity-20 hover:text-slate-300">▲</button>
                            <button onClick={() => idx < editing.fields.length - 1 && moveField(idx, idx + 1)} disabled={idx === editing.fields.length - 1} className="disabled:opacity-20 hover:text-slate-300">▼</button>
                          </div>
                          <GripVertical className="h-4 w-4 text-slate-600 flex-shrink-0" />
                          <Select value={field.type} onValueChange={v => updateField(idx, { type: v as FieldType, options: undefined })}>
                            <SelectTrigger className="flex-1 h-8 text-xs bg-white/5 border-white/10 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FIELD_TYPES.map(ft => (
                                <SelectItem key={ft.value} value={ft.value} className="text-xs">{ft.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={e => updateField(idx, { required: e.target.checked })}
                              className="rounded"
                            />
                            Obligatorio
                          </label>
                          <button onClick={() => removeField(idx)} className="p-1 text-slate-500 hover:text-red-400 flex-shrink-0">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <Input
                          value={field.label}
                          onChange={e => updateField(idx, { label: e.target.value })}
                          placeholder="Etiqueta del campo (ej: ¿Tienes alergias?)"
                          className="h-8 text-sm bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                        />

                        {['select', 'radio', 'checkbox'].includes(field.type) && (
                          <div>
                            <p className="text-[11px] text-slate-500 mb-1">Opciones — una por línea</p>
                            <Textarea
                              value={(field.options ?? []).join('\n')}
                              onChange={e => updateField(idx, { options: e.target.value.split('\n').filter(Boolean) })}
                              rows={3}
                              placeholder="Opción A&#10;Opción B&#10;Opción C"
                              className="text-xs bg-white/5 border-white/10 text-white resize-none placeholder:text-slate-500"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 pt-3 border-t border-white/10 flex gap-3">
                <Button variant="ghost" onClick={() => setEditing(null)} className="flex-1 text-slate-400 hover:text-white">
                  Cancelar
                </Button>
                <Button onClick={save} disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-500">
                  {saving ? 'Guardando...' : isNew ? 'Crear formulario' : 'Guardar cambios'}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AppLayout>
  )
}
