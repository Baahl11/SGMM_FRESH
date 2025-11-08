'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Copy, Check, FileText, Clock, Mail, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'

interface IntakeForm {
  id: string
  name: string
  description: string | null
  category: string | null
  require_signature: boolean
  allow_file_upload: boolean
  active: boolean
}

interface SendFormModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  patientName: string
}

export function SendFormModal({ isOpen, onClose, patientId, patientName }: SendFormModalProps) {
  const [forms, setForms] = useState<IntakeForm[]>([])
  const [selectedFormId, setSelectedFormId] = useState<string>('')
  const [expirationHours, setExpirationHours] = useState<number>(72)
  const [sendVia, setSendVia] = useState<'whatsapp' | 'email' | 'manual'>('manual')
  const [loading, setLoading] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadForms()
      setGeneratedUrl('')
      setCopied(false)
    }
  }, [isOpen])

  async function loadForms() {
    try {
      const response = await fetch('/api/forms')
      if (!response.ok) throw new Error('Error al cargar formularios')
      const data = await response.json()
      setForms(data.forms.filter((f: IntakeForm) => f.active !== false) || [])
    } catch (error) {
      console.error('Error loading forms:', error)
      toast.error('Error al cargar formularios')
    }
  }

  async function handleSend() {
    if (!selectedFormId) {
      toast.error('Selecciona un formulario')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/forms/${selectedFormId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          expiration_hours: expirationHours,
          send_via: sendVia
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al generar enlace')
      }

      const data = await response.json()
      setGeneratedUrl(data.public_url)
      toast.success('Enlace generado exitosamente')
    } catch (error: any) {
      console.error('Error sending form:', error)
      toast.error(error.message || 'Error al generar enlace')
    } finally {
      setLoading(false)
    }
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(generatedUrl)
      setCopied(true)
      toast.success('Enlace copiado al portapapeles')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Error al copiar enlace')
    }
  }

  function openWhatsApp() {
    if (!generatedUrl) return
    const message = encodeURIComponent(
      `Hola ${patientName}, por favor completa este formulario antes de tu próxima cita: ${generatedUrl}`
    )
    window.open(`https://wa.me/?text=${message}`, '_blank')
    toast.success('WhatsApp abierto')
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Enviar Formulario
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Para: {patientName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {!generatedUrl ? (
              <>
                {/* Selector de Formulario */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Selecciona un Formulario *
                  </label>
                  <select
                    value={selectedFormId}
                    onChange={(e) => setSelectedFormId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Selecciona un formulario --</option>
                    {forms.map(form => (
                      <option key={form.id} value={form.id}>
                        {form.name} {form.require_signature && '🖊️'} {form.allow_file_upload && '📎'}
                      </option>
                    ))}
                  </select>
                  {forms.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      No hay formularios activos. <a href="/dashboard/settings/forms" className="text-blue-600 hover:underline">Crear uno</a>
                    </p>
                  )}
                </div>

                {/* Expiración */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Expira en (horas)
                  </label>
                  <input
                    type="number"
                    value={expirationHours}
                    onChange={(e) => setExpirationHours(parseInt(e.target.value) || 72)}
                    min="1"
                    max="720"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    El enlace estará disponible por {expirationHours} horas ({(expirationHours / 24).toFixed(1)} días)
                  </p>
                </div>

                {/* Método de envío */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Método de Envío
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setSendVia('manual')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        sendVia === 'manual'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Copy className="w-5 h-5 mx-auto mb-2 text-gray-700 dark:text-gray-300" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Manual</p>
                      <p className="text-xs text-gray-500">Copiar enlace</p>
                    </button>
                    <button
                      onClick={() => setSendVia('whatsapp')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        sendVia === 'whatsapp'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <MessageSquare className="w-5 h-5 mx-auto mb-2 text-gray-700 dark:text-gray-300" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">WhatsApp</p>
                      <p className="text-xs text-gray-500">Abrir WA</p>
                    </button>
                    <button
                      onClick={() => setSendVia('email')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        sendVia === 'email'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Mail className="w-5 h-5 mx-auto mb-2 text-gray-700 dark:text-gray-300" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Email</p>
                      <p className="text-xs text-gray-500">Próximamente</p>
                    </button>
                  </div>
                </div>

                {/* Botón Generar */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSend}
                  disabled={loading || !selectedFormId}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Generar Enlace
                    </>
                  )}
                </motion.button>
              </>
            ) : (
              <>
                {/* Enlace Generado */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border-2 border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-900 dark:text-green-100">
                        ¡Enlace Generado!
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Comparte este enlace con {patientName}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 break-all font-mono">
                      {generatedUrl}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={copyToClipboard}
                      className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copiar
                        </>
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={openWhatsApp}
                      className="px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      WhatsApp
                    </motion.button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setGeneratedUrl('')
                    setSelectedFormId('')
                  }}
                  className="w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Enviar Otro Formulario
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
