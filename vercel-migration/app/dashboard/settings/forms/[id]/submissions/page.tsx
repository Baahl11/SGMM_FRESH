'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Eye, CheckCircle, XCircle, Clock, Calendar, User, FileText } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Submission {
  id: string
  patient: {
    id: string
    nombre: string
    apellido_paterno?: string
    apellido_materno?: string
    email?: string
    telefono?: string
  }
  responses: Record<string, any>
  signature_data?: string
  uploaded_files?: any[]
  status: string
  submitted_at: string
  reviewed_at?: string
  ip_address?: string
}

interface FormInfo {
  id: string
  name: string
  description?: string
  fields: any[]
}

export default function FormSubmissionsPage() {
  const params = useParams()
  const formId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<FormInfo | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (formId) {
      loadSubmissions()
    }
  }, [formId])

  async function loadSubmissions() {
    try {
      const [formResponse, submissionsResponse] = await Promise.all([
        fetch(`/api/forms/${formId}`),
        fetch(`/api/forms/${formId}/submissions`)
      ])

      if (!formResponse.ok || !submissionsResponse.ok) {
        throw new Error('Error al cargar datos')
      }

      const formData = await formResponse.json()
      const submissionsData = await submissionsResponse.json()

      setForm(formData.form)
      setSubmissions(submissionsData.submissions || [])
    } catch (error) {
      toast.error('Error al cargar respuestas')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function updateSubmissionStatus(submissionId: string, status: string) {
    try {
      const response = await fetch(`/api/submissions/${submissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (!response.ok) throw new Error('Error al actualizar')

      const data = await response.json()
      setSubmissions(submissions.map(s => 
        s.id === submissionId ? data.submission : s
      ))
      
      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission(data.submission)
      }

      toast.success('Estado actualizado')
    } catch (error) {
      toast.error('Error al actualizar estado')
      console.error(error)
    }
  }

  const filteredSubmissions = submissions.filter(sub => {
    const patientName = `${sub.patient.nombre} ${sub.patient.apellido_paterno || ''}`.toLowerCase()
    return patientName.includes(searchQuery.toLowerCase())
  })

  const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
    submitted: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-400',
      icon: Clock
    },
    reviewed: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-700 dark:text-purple-400',
      icon: Eye
    },
    approved: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-400',
      icon: CheckCircle
    },
    rejected: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-400',
      icon: XCircle
    }
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

  if (!form) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Formulario no encontrado</p>
      </div>
    )
  }

  return (
    <>
      <Toaster position="top-right" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/settings/forms">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </motion.button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Respuestas: {form.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {submissions.length} respuesta{submissions.length !== 1 ? 's' : ''} recibida{submissions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {submissions.length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-blue-600 dark:text-blue-400">Nuevas</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
              {submissions.filter(s => s.status === 'submitted').length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-purple-600 dark:text-purple-400">Revisadas</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
              {submissions.filter(s => s.status === 'reviewed').length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-green-600 dark:text-green-400">Aprobadas</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
              {submissions.filter(s => s.status === 'approved').length}
            </p>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Buscar por nombre de paciente..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Submissions List */}
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery ? 'No se encontraron respuestas' : 'No hay respuestas aún'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredSubmissions.map((submission) => {
              const statusConfig = statusColors[submission.status] || statusColors.submitted
              const StatusIcon = statusConfig.icon

              return (
                <motion.div
                  key={submission.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 cursor-pointer"
                  onClick={() => setSelectedSubmission(submission)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {submission.patient.nombre} {submission.patient.apellido_paterno || ''}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {submission.patient.email || submission.patient.telefono}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.bg} ${statusConfig.text}`}>
                      <StatusIcon className="w-3 h-3" />
                      {submission.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      {new Date(submission.submitted_at).toLocaleString('es-MX')}
                    </div>
                    {submission.signature_data && (
                      <div className="text-green-600 dark:text-green-400">
                        ✓ Con firma digital
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          updateSubmissionStatus(submission.id, 'reviewed')
                        }}
                        className="flex-1 px-3 py-2 text-sm bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                      >
                        Revisar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          updateSubmissionStatus(submission.id, 'approved')
                        }}
                        className="flex-1 px-3 py-2 text-sm bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                      >
                        Aprobar
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedSubmission(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  Respuestas de {selectedSubmission.patient.nombre}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enviado el {new Date(selectedSubmission.submitted_at).toLocaleString('es-MX')}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {/* Responses */}
            <div className="space-y-4 mb-6">
              {form.fields.map(field => (
                <div key={field.id} className="border-b border-gray-100 dark:border-gray-700 pb-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {field.label}
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {Array.isArray(selectedSubmission.responses[field.id])
                      ? selectedSubmission.responses[field.id].join(', ')
                      : selectedSubmission.responses[field.id] || '—'}
                  </p>
                </div>
              ))}
            </div>

            {/* Signature */}
            {selectedSubmission.signature_data && (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Firma Digital
                </p>
                <img
                  src={selectedSubmission.signature_data}
                  alt="Firma"
                  className="border border-gray-300 dark:border-gray-600 rounded-lg max-w-xs"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => updateSubmissionStatus(selectedSubmission.id, 'reviewed')}
                className="flex-1 px-4 py-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors font-medium"
              >
                Marcar como Revisado
              </button>
              <button
                onClick={() => updateSubmissionStatus(selectedSubmission.id, 'approved')}
                className="flex-1 px-4 py-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors font-medium"
              >
                Aprobar
              </button>
              <button
                onClick={() => updateSubmissionStatus(selectedSubmission.id, 'rejected')}
                className="flex-1 px-4 py-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors font-medium"
              >
                Rechazar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}
