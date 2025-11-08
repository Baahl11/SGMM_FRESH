'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, FileText, Users, Calendar, Eye, Trash2, Edit2, Send, Copy } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'

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
    medical_history: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    consent: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    questionnaire: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    admision: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700',
        }}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Formularios de Admisión
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Crea formularios personalizados para enviar a tus pacientes
            </p>
          </div>
          
          <Link href="/dashboard/settings/forms/new">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Crear Formulario
            </motion.button>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar formularios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 transition-all"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  Total Formularios
                </p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                  {forms.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border border-green-200 dark:border-green-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  Activos
                </p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-1">
                  {forms.filter(f => f.active).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 border border-purple-200 dark:border-purple-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                  Templates
                </p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                  {forms.filter(f => f.is_template).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Forms Grid */}
        {filteredForms.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
          >
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'No se encontraron formularios' : 'No hay formularios aún'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery 
                ? 'Intenta con otros términos de búsqueda' 
                : 'Crea tu primer formulario para empezar a recopilar información de pacientes'
              }
            </p>
            {!searchQuery && (
              <Link href="/dashboard/settings/forms/new">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-shadow inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Crear Primer Formulario
                </motion.button>
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {filteredForms.map((form, index) => (
                <motion.div
                  key={form.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all"
                >
                  {/* Card Header */}
                  <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {form.name}
                          </h3>
                          {!form.active && (
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                              Inactivo
                            </span>
                          )}
                          {form.is_template && (
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                              Template
                            </span>
                          )}
                        </div>
                        {form.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {form.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Category Badge */}
                    {form.category && (
                      <div className="mt-3">
                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                          categoryColors[form.category] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {form.category.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-4">
                    {/* Form Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {form.fields.length}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Campos
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {form.require_signature ? '✓' : '—'}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Firma
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {form.allow_file_upload ? '✓' : '—'}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Archivos
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <Link href={`/dashboard/settings/forms/${form.id}`} className="flex-1">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center justify-center gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          Editar
                        </motion.button>
                      </Link>
                      
                      <Link href={`/dashboard/settings/forms/${form.id}/submissions`}>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-4 py-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg font-medium hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </motion.button>
                      </Link>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleDuplicate(form)}
                        className="px-4 py-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg font-medium hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleDelete(form.id)}
                        className="px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </>
  )
}
