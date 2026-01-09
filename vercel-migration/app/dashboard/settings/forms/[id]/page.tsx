'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Settings2 } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GlassPanel } from '@/components/ui/glass-panel'

interface FormField {
  id: string
  type: string
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  order: number
}

interface FormData {
  name: string
  description: string
  category: string
  fields: FormField[]
  require_signature: boolean
  allow_file_upload: boolean
  active: boolean
}

const FIELD_TYPES = [
  { value: 'text', label: 'Texto Corto', icon: '📝' },
  { value: 'textarea', label: 'Texto Largo', icon: '📄' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'phone', label: 'Teléfono', icon: '📱' },
  { value: 'number', label: 'Número', icon: '🔢' },
  { value: 'date', label: 'Fecha', icon: '📅' },
  { value: 'select', label: 'Selector', icon: '📋' },
  { value: 'checkbox', label: 'Checkbox', icon: '☑️' },
  { value: 'radio', label: 'Radio', icon: '🔘' },
  { value: 'file', label: 'Archivos', icon: '📎' },
]

const CATEGORIES = [
  { value: 'medical_history', label: 'Historia Clínica' },
  { value: 'consent', label: 'Consentimiento' },
  { value: 'questionnaire', label: 'Cuestionario' },
  { value: 'admision', label: 'Admisión' },
]

const inputClass = 'h-12 w-full rounded-2xl border border-white/15 bg-white/5 px-4 text-sm text-white placeholder:text-white/40 focus-visible:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/30'
const textareaClass = 'w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus-visible:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/30 min-h-[110px]'
const labelClass = 'text-xs font-semibold uppercase tracking-[0.35em] text-white/60'
const checkboxClass = 'h-4 w-4 rounded border-white/40 bg-white/5 text-emerald-300 focus:ring-emerald-300/40'

function SortableField({ field, onUpdate, onDelete }: {
  field: FormField
  onUpdate: (id: string, updates: Partial<FormField>) => void
  onDelete: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-3xl border border-white/10 bg-white/5 p-5 text-white shadow-[0_25px_80px_rgba(15,23,42,0.35)]"
    >
      <div className="flex items-start gap-4">
        <div
          {...attributes}
          {...listeners}
          className="mt-2 cursor-grab text-white/40 transition-colors hover:text-white/70 active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5" />
        </div>

        <div className="flex-1 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={`${labelClass} mb-2 block`}>Etiqueta</label>
              <input
                type="text"
                value={field.label}
                onChange={(e) => onUpdate(field.id, { label: e.target.value })}
                className={inputClass}
                placeholder="Nombre completo"
              />
            </div>

            <div>
              <label className={`${labelClass} mb-2 block`}>Tipo de Campo</label>
              <select
                value={field.type}
                onChange={(e) => onUpdate(field.id, { type: e.target.value })}
                className={`${inputClass} pr-8`}
              >
                {FIELD_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={`${labelClass} mb-2 block`}>
              Placeholder (opcional)
            </label>
            <input
              type="text"
              value={field.placeholder || ''}
              onChange={(e) => onUpdate(field.id, { placeholder: e.target.value })}
              className={inputClass}
              placeholder="Ej: Juan Pérez"
            />
          </div>

          {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
            <div>
              <label className={`${labelClass} mb-2 block`}>
                Opciones (una por línea)
              </label>
              <textarea
                value={(field.options || []).join('\n')}
                onChange={(e) => onUpdate(field.id, { options: e.target.value.split('\n').filter(o => o.trim()) })}
                className={`${textareaClass} min-h-[120px]`}
                placeholder="Opción 1&#10;Opción 2&#10;Opción 3"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => onUpdate(field.id, { required: e.target.checked })}
                className={checkboxClass}
              />
              Campo obligatorio
            </label>

            <button
              onClick={() => onDelete(field.id)}
              className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-100 transition hover:bg-rose-500/20"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FormBuilderPage() {
  const router = useRouter()
  const params = useParams()
  const rawId = params?.id
  const formId = Array.isArray(rawId) ? rawId[0] : rawId
  const isEditing = Boolean(formId && formId !== 'new')

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    category: 'medical_history',
    fields: [],
    require_signature: false,
    allow_file_upload: false,
    active: true,
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    if (isEditing && formId) {
      loadForm(formId)
    }
  }, [formId, isEditing])

  async function loadForm(id: string) {
    try {
      const response = await fetch(`/api/forms/${id}`)
      if (!response.ok) throw new Error('Error al cargar formulario')
      const data = await response.json()
      setFormData({
        name: data.form.name,
        description: data.form.description || '',
        category: data.form.category || 'medical_history',
        fields: data.form.fields || [],
        require_signature: data.form.require_signature,
        allow_file_upload: data.form.allow_file_upload,
        active: data.form.active,
      })
    } catch (error) {
      toast.error('Error al cargar formulario')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  function addField(type: string = 'text') {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      label: '',
      required: false,
      order: formData.fields.length + 1,
    }
    setFormData({ ...formData, fields: [...formData.fields, newField] })
  }

  function updateField(id: string, updates: Partial<FormField>) {
    setFormData({
      ...formData,
      fields: formData.fields.map(f => (f.id === id ? { ...f, ...updates } : f)),
    })
  }

  function deleteField(id: string) {
    setFormData({
      ...formData,
      fields: formData.fields.filter(f => f.id !== id),
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = formData.fields.findIndex(f => f.id === active.id)
      const newIndex = formData.fields.findIndex(f => f.id === over.id)

      const reorderedFields = arrayMove(formData.fields, oldIndex, newIndex).map((f, idx) => ({
        ...f,
        order: idx + 1,
      }))

      setFormData({ ...formData, fields: reorderedFields })
    }
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      toast.error('El nombre del formulario es requerido')
      return
    }

    if (formData.fields.length === 0) {
      toast.error('Debes agregar al menos un campo')
      return
    }

    const invalidFields = formData.fields.filter(f => !f.label.trim())
    if (invalidFields.length > 0) {
      toast.error('Todos los campos deben tener una etiqueta')
      return
    }

    setSaving(true)
    try {
      const url = isEditing && formId ? `/api/forms/${formId}` : '/api/forms'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Error al guardar')

      toast.success(isEditing ? 'Formulario actualizado' : 'Formulario creado')
      router.push('/dashboard/settings/forms')
    } catch (error) {
      toast.error('Error al guardar formulario')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <GlassPanel className="flex h-32 w-32 items-center justify-center border-white/15 bg-white/5">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            className="h-10 w-10 rounded-full border-2 border-white/30 border-t-transparent"
          />
        </GlassPanel>
      </div>
    )
  }

  const builderStats = [
    { label: 'Campos', value: formData.fields.length || 0 },
    { label: 'Firma', value: formData.require_signature ? 'Activa' : 'Opcional' },
    { label: 'Archivos', value: formData.allow_file_upload ? 'On' : 'Off' },
  ]

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'backdrop-blur-2xl border border-white/10 bg-slate-900/80 text-white',
        }}
      />

      <div className="space-y-8 pb-20 text-white">
        <GlassPanel className="relative overflow-hidden border-white/10 bg-gradient-to-br from-emerald-500/20 via-sky-500/10 to-slate-950 p-6 md:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-emerald-400/40 blur-[140px]" />
            <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-sky-500/30 blur-[160px]" />
          </div>
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-5">
              <Link href="/dashboard/settings/forms" className="inline-flex">
                <motion.span whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="aura-cta aura-cta--ghost gap-2 px-4">
                  <ArrowLeft className="h-4 w-4" />
                  Formularios
                </motion.span>
              </Link>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.35em] text-white/70">
                  {isEditing ? 'Editar formulario' : 'Nuevo formulario'}
                </p>
                <h1 className="text-3xl font-semibold md:text-4xl">
                  {isEditing ? 'Actualiza tu flujo digital' : 'Construye un formulario clínico'}
                </h1>
                <p className="text-sm text-white/80">
                  Ordena campos, activa firmas y archivos en un lienzo con drag & drop y estilos de cristal.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-4 lg:w-80">
              <div className="grid grid-cols-3 gap-3">
                {builderStats.map(stat => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/15 bg-white/10 p-3 text-center text-white"
                  >
                    <p className="text-xl font-semibold leading-tight break-words">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.35em] text-white/60">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={saving}
                className="aura-cta aura-cta--primary justify-center px-6 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Guardando...' : 'Guardar formulario'}
              </motion.button>
            </div>
          </div>
        </GlassPanel>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <GlassPanel className="space-y-5 border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold">Información básica</h3>
              <div className="space-y-4">
                <div>
                  <label className={`${labelClass} mb-2 block`}>Nombre del formulario *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={inputClass}
                    placeholder="Historia Clínica General"
                  />
                </div>
                <div>
                  <label className={`${labelClass} mb-2 block`}>Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={textareaClass}
                    placeholder="Describe para qué sirve este formulario..."
                  />
                </div>
                <div>
                  <label className={`${labelClass} mb-2 block`}>Categoría</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={`${inputClass} pr-8`}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </GlassPanel>

            <GlassPanel className="space-y-5 border-white/10 bg-white/5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/60">Campos del formulario</p>
                  <p className="text-sm text-white/80">Arrastra para reordenar</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => addField()}
                  className="aura-cta aura-cta--ghost gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Agregar campo
                </motion.button>
              </div>

              {formData.fields.length === 0 ? (
                <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-white/20 bg-white/5 px-6 py-12 text-center text-white/70">
                  <Settings2 className="h-10 w-10 text-white/40" />
                  <div>
                    <p className="text-lg font-semibold text-white">Sin campos todavía</p>
                    <p className="text-sm text-white/70">Agrega tu primer componente para comenzar.</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => addField()}
                    className="aura-cta aura-cta--primary gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar primer campo
                  </motion.button>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={formData.fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-4">
                      {formData.fields.map(field => (
                        <SortableField key={field.id} field={field} onUpdate={updateField} onDelete={deleteField} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </GlassPanel>
          </div>

          <div className="space-y-6">
            <GlassPanel className="space-y-4 border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold">Configuración</h3>
              {[{
                key: 'require_signature',
                title: 'Requiere firma',
                description: 'Solicita firma digital antes de finalizar',
              }, {
                key: 'allow_file_upload',
                title: 'Permitir archivos',
                description: 'Pacientes pueden adjuntar documentos',
              }, {
                key: 'active',
                title: 'Formulario activo',
                description: 'Disponible para enviar inmediatamente',
              }].map(setting => (
                <label key={setting.key} className="flex items-start gap-3 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={(formData as any)[setting.key]}
                    onChange={(e) => setFormData({ ...formData, [setting.key]: e.target.checked })}
                    className={checkboxClass}
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">{setting.title}</p>
                    <p className="text-xs text-white/60">{setting.description}</p>
                  </div>
                </label>
              ))}
            </GlassPanel>

            <GlassPanel className="space-y-3 border-white/10 bg-gradient-to-br from-indigo-500/10 via-sky-500/5 to-transparent p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">Agregar rápido</p>
              <div className="grid grid-cols-2 gap-2">
                {FIELD_TYPES.slice(0, 6).map(type => (
                  <button
                    key={type.value}
                    onClick={() => addField(type.value)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-white/80 transition hover:border-emerald-400/40 hover:text-white"
                  >
                    {type.icon} {type.label}
                  </button>
                ))}
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>
    </>
  )
}
