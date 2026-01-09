'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, FileText, Eye, Trash2, Edit2, Copy } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'
import { GlassPanel } from '@/components/ui/glass-panel'

interface IntakeForm {
  id: string
  name: string
  description: string | null
  category: string | null
  fields: any[]
  require_signature: boolean
  allow_file_upload: boolean
  active: boolean
  is_template: boolean
  created_at: string
  updated_at: string
}

export default function FormsPage() {
  const [forms, setForms] = useState<IntakeForm[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const inputClass = 'h-12 w-full rounded-2xl border border-white/15 bg-white/5 px-12 text-sm text-white placeholder:text-white/50 focus-visible:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/30'

  useEffect(() => {
    loadForms()
  }, [])

  async function loadForms() {
    try {
      const response = await fetch('/api/forms')
      if (!response.ok) throw new Error('Error al cargar formularios')
      const data = await response.json()
      setForms(data.forms || [])
    } catch (error) {
      toast.error('Error al cargar formularios')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDuplicate(form: IntakeForm) {
    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${form.name} (Copia)`,
          description: form.description,
          category: form.category,
          fields: form.fields,
          require_signature: form.require_signature,
          allow_file_upload: form.allow_file_upload
        })
      })
      
      if (!response.ok) throw new Error('Error al duplicar')
      
      const newForm = await response.json()
      setForms([newForm.form, ...forms])
      toast.success('Formulario duplicado exitosamente')
    } catch (error) {
      toast.error('Error al duplicar formulario')
      console.error(error)
    }
  }

  async function handleDelete(formId: string) {
    if (!confirm('¿Estás seguro de eliminar este formulario? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Error al eliminar')
      
      setForms(forms.filter(f => f.id !== formId))
      toast.success('Formulario eliminado exitosamente')
    } catch (error) {
      toast.error('Error al eliminar formulario')
      console.error(error)
    }
  }

  const filteredForms = forms.filter(form =>
    form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    form.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const categoryColors: Record<string, string> = {
    medical_history: 'bg-sky-500/15 text-sky-200 border border-sky-500/30',
    consent: 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30',
    questionnaire: 'bg-purple-500/15 text-purple-200 border border-purple-500/30',
    admision: 'bg-amber-500/15 text-amber-200 border border-amber-500/30',
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <GlassPanel className="flex h-40 w-40 items-center justify-center border-white/15 bg-white/5">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            className="h-12 w-12 rounded-full border-2 border-white/30 border-t-transparent"
          />
        </GlassPanel>
      </div>
    )
  }

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'backdrop-blur-2xl border border-white/10 bg-slate-900/80 text-white',
        }}
      />

      <div className="space-y-8 pb-16 text-white">
        <GlassPanel className="relative overflow-hidden border-white/10 bg-gradient-to-br from-emerald-500/20 via-indigo-600/10 to-slate-950 p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <div className="mb-5 flex items-center gap-3 text-white/70">
                <div className="rounded-2xl bg-white/10 p-3">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="text-xs uppercase tracking-[0.45em] text-white/60">Formularios</span>
              </div>
              <h1 className="text-3xl font-semibold md:text-4xl">Centraliza tus formularios de admisión</h1>
              <p className="mt-4 text-base text-white/80">
                Diseña flujos BYOD con firmas digitales, archivos y variables dinámicas para enviarlos antes de la cita.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/dashboard/settings/forms/new" className="aura-cta">
                  <Plus className="h-4 w-4" /> Crear formulario
                </Link>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[{
                label: 'Total', value: forms.length, accent: 'text-emerald-200'
              }, {
                label: 'Activos', value: forms.filter(f => f.active).length, accent: 'text-sky-200'
              }, {
                label: 'Templates', value: forms.filter(f => f.is_template).length, accent: 'text-amber-200'
              }].map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/60">{stat.label}</p>
                  <p className={`mt-3 text-3xl font-semibold ${stat.accent}`}>{stat.value}</p>
                  <p className="mt-2 text-sm text-white/70">{stat.label === 'Total' ? 'Formularios registrados' : stat.label === 'Activos' ? 'Enviables ahora' : 'Plantillas reutilizables'}</p>
                </div>
              ))}
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="border-white/10 bg-white/5 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Buscar por nombre, categoría o descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={inputClass}
            />
          </div>
        </GlassPanel>

        {filteredForms.length === 0 ? (
          <GlassPanel className="flex flex-col items-center gap-4 border-white/10 bg-white/5 px-6 py-16 text-center text-white/70">
            <FileText className="h-12 w-12 text-white/50" />
            <div>
              <p className="text-xl font-semibold text-white">{searchQuery ? 'Sin resultados' : 'Aún no hay formularios'}</p>
              <p className="text-sm text-white/60">
                {searchQuery ? 'Intenta con otros términos o limpia el filtro.' : 'Crea tu primer formulario y automatiza la admisión digital.'}
              </p>
            </div>
            {searchQuery ? (
              <button onClick={() => setSearchQuery('')} className="aura-cta aura-cta--ghost">
                Limpiar búsqueda
              </button>
            ) : (
              <Link href="/dashboard/settings/forms/new" className="aura-cta">
                <Plus className="h-4 w-4" /> Crear primer formulario
              </Link>
            )}
          </GlassPanel>
        ) : (
          <motion.div layout className="grid gap-4 md:grid-cols-2">
            <AnimatePresence>
              {filteredForms.map((form, index) => (
                <motion.div
                  key={form.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <GlassPanel className="space-y-4 p-5">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">{form.name}</h3>
                        {!form.active && (
                          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/70">
                            Inactivo
                          </span>
                        )}
                        {form.is_template && (
                          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100">
                            Template
                          </span>
                        )}
                      </div>
                      {form.description && (
                        <p className="text-sm text-white/70 line-clamp-2">{form.description}</p>
                      )}
                      {form.category && (
                        <span
                          className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs uppercase tracking-wide ${
                            categoryColors[form.category] || 'border border-white/15 bg-white/5 text-white/70'
                          }`}
                        >
                          {form.category.replace('_', ' ').toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/40 to-slate-950 p-4 text-center">
                      {[{
                        label: 'Campos', value: form.fields.length
                      }, {
                        label: 'Firma', value: form.require_signature ? 'Sí' : 'No'
                      }, {
                        label: 'Archivos', value: form.allow_file_upload ? 'Sí' : 'No'
                      }].map((stat) => (
                        <div key={`${form.id}-${stat.label}`}>
                          <p className="text-2xl font-semibold text-white">{stat.value}</p>
                          <p className="text-xs uppercase tracking-[0.35em] text-white/50">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
                      <Link href={`/dashboard/settings/forms/${form.id}`} className="aura-cta aura-cta--ghost flex-1 justify-center">
                        <Edit2 className="h-4 w-4" /> Editar
                      </Link>
                      <Link href={`/dashboard/settings/forms/${form.id}/submissions`} className="aura-cta aura-cta--ghost">
                        <Eye className="h-4 w-4" /> Ver
                      </Link>
                      <button
                        onClick={() => handleDuplicate(form)}
                        className="aura-cta aura-cta--ghost"
                        title="Duplicar"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(form.id)}
                        className="aura-cta aura-cta--ghost text-rose-200 hover:text-rose-100"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </GlassPanel>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </>
  )
}
