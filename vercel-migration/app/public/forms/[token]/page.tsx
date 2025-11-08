'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Clock, CheckCircle2, AlertCircle, Send } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { useParams } from 'next/navigation'
import { FileUploadField } from '@/components/forms/file-upload-field'

interface FormField {
  id: string
  type: string
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
}

interface FormData {
  id: string
  name: string
  description: string
  fields: FormField[]
  require_signature: boolean
  allow_file_upload: boolean
}

interface FormStatus {
  status: 'loading' | 'active' | 'completed' | 'expired' | 'error'
  form?: FormData
  patient?: {
    nombre: string
    apellido_paterno?: string
    apellido_materno?: string
  }
  expires_at?: string
  completed_at?: string
  message?: string
}

export default function PublicFormPage() {
  const params = useParams()
  const token = params?.token as string

  const [formStatus, setFormStatus] = useState<FormStatus>({ status: 'loading' })
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (token) {
      loadForm()
    }
  }, [token])

  async function loadForm() {
    try {
      const response = await fetch(`/api/public/forms/${token}`)
      const data = await response.json()

      if (!response.ok) {
        setFormStatus({
          status: 'error',
          message: data.error || 'Formulario no encontrado'
        })
        return
      }

      if (data.status === 'completed') {
        setFormStatus({
          status: 'completed',
          completed_at: data.completed_at,
          message: data.message
        })
        return
      }

      setFormStatus({
        status: 'active',
        form: data.form,
        patient: data.patient,
        expires_at: data.expires_at
      })
    } catch (error) {
      console.error('Error loading form:', error)
      setFormStatus({
        status: 'error',
        message: 'Error al cargar el formulario'
      })
    }
  }

  function handleFieldChange(fieldId: string, value: any) {
    setResponses({ ...responses, [fieldId]: value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formStatus.form) return

    // Validate required fields
    const missingFields = formStatus.form.fields
      .filter(field => field.required && !responses[field.id])
      .map(field => field.label)

    if (missingFields.length > 0) {
      toast.error(`Por favor completa los campos requeridos: ${missingFields.join(', ')}`)
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/public/forms/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses })
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Error al enviar formulario')
        return
      }

      toast.success('Formulario enviado exitosamente')
      setFormStatus({
        status: 'completed',
        completed_at: data.submitted_at,
        message: 'Gracias por completar el formulario'
      })
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error('Error al enviar el formulario')
    } finally {
      setSubmitting(false)
    }
  }

  function renderField(field: FormField) {
    const value = responses[field.id] || ''

    const baseInputClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <input
            type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className={baseInputClass}
          />
        )

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className={baseInputClass}
          />
        )

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            className={baseInputClass}
          />
        )

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
            className={baseInputClass}
          />
        )

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            className={baseInputClass}
          >
            <option value="">Selecciona una opción</option>
            {field.options?.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map(option => (
              <label key={option} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  required={field.required}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                  {option}
                </span>
              </label>
            ))}
          </div>
        )

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map(option => (
              <label key={option} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : []
                    const newValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter(v => v !== option)
                    handleFieldChange(field.id, newValues)
                  }}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                  {option}
                </span>
              </label>
            ))}
          </div>
        )

      case 'file':
        return (
          <FileUploadField
            fieldId={field.id}
            label=""
            required={field.required}
            maxFiles={5}
            maxSizeMB={10}
            acceptedTypes={['image/*', 'application/pdf', '.doc', '.docx']}
            value={Array.isArray(value) ? value : []}
            onChange={(urls) => handleFieldChange(field.id, urls)}
            disabled={submitting}
          />
        )

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className={baseInputClass}
          />
        )
    }
  }

  if (formStatus.status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (formStatus.status === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center"
        >
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            ¡Formulario Completado!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {formStatus.message || 'Gracias por completar el formulario. Tu información ha sido enviada correctamente.'}
          </p>
          {formStatus.completed_at && (
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Enviado el {new Date(formStatus.completed_at).toLocaleString('es-MX')}
            </p>
          )}
        </motion.div>
      </div>
    )
  }

  if (formStatus.status === 'error' || formStatus.status === 'expired') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center"
        >
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Formulario No Disponible
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {formStatus.message || 'Este formulario no está disponible o ha expirado.'}
          </p>
        </motion.div>
      </div>
    )
  }

  const { form, patient, expires_at } = formStatus
  if (!form) return null

  const patientName = patient 
    ? `${patient.nombre} ${patient.apellido_paterno || ''} ${patient.apellido_materno || ''}`.trim()
    : ''

  return (
    <>
      <Toaster position="top-right" />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-3xl mx-auto"
        >
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {form.name}
                </h1>
                {form.description && (
                  <p className="text-gray-600 dark:text-gray-400">
                    {form.description}
                  </p>
                )}
              </div>
            </div>

            {patientName && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  <strong>Paciente:</strong> {patientName}
                </p>
              </div>
            )}

            {expires_at && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>
                  Este formulario expira el {new Date(expires_at).toLocaleString('es-MX')}
                </span>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
              <div className="space-y-6">
                {form.fields.map((field, index) => (
                  <motion.div
                    key={field.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="space-y-2"
                  >
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">
                      {field.label}
                      {field.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                    {renderField(field)}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={submitting}
              className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
            >
              {submitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Enviar Formulario
                </>
              )}
            </motion.button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Todos los campos marcados con <span className="text-red-500">*</span> son obligatorios
            </p>
          </form>
        </motion.div>
      </div>
    </>
  )
}
