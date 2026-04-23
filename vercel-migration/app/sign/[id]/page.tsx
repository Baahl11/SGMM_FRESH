'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, RotateCcw } from 'lucide-react'

interface DocTemplate {
  id: string
  title: string
  content: string
}

const LogoMark = () => (
  <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
    <defs>
      <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="50%" stopColor="#22d3ee" />
        <stop offset="100%" stopColor="#a855f7" />
      </linearGradient>
    </defs>
    <rect x="5" y="5" width="54" height="54" rx="18" fill="url(#g1)" />
    <rect x="16" y="18" width="32" height="28" rx="10" fill="rgba(15,23,42,0.2)" />
    <path d="M20 26h24" stroke="rgba(248,250,252,0.35)" strokeWidth="2" strokeLinecap="round" />
    <path d="M22 36c4 0 4-8 8-8s4 8 8 8 4-8 8-8" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function SignatureCanvas({ onSign }: { onSign: (data: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const hasStroke = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      const t = e.touches[0]
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY }
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  function start(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    drawing.current = true
    const pos = getPos(e)
    lastPos.current = pos
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, 1.5, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
    hasStroke.current = true
  }

  function move(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current) return
    e.preventDefault()
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e)
    if (lastPos.current) {
      ctx.beginPath()
      ctx.moveTo(lastPos.current.x, lastPos.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
    }
    lastPos.current = pos
  }

  function end() {
    drawing.current = false
    lastPos.current = null
    if (hasStroke.current) {
      onSign(canvasRef.current!.toDataURL('image/png'))
    }
  }

  function clear() {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    hasStroke.current = false
    onSign('')
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        className="w-full rounded-xl border border-dashed border-white/20 bg-white/5 cursor-crosshair touch-none"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <button
        onClick={clear}
        type="button"
        className="absolute top-2 right-2 flex items-center gap-1 text-xs text-slate-400 hover:text-white rounded-lg bg-black/20 px-2 py-1"
      >
        <RotateCcw className="h-3 w-3" /> Limpiar
      </button>
      <p className="mt-2 text-center text-xs text-slate-500">Dibuja tu firma con el mouse o con el dedo</p>
    </div>
  )
}

export default function SignDocumentPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const patientId = searchParams.get('pid') ?? undefined
  const appointmentId = searchParams.get('apt') ?? undefined

  const [doc, setDoc] = useState<DocTemplate | null>(null)
  const [sanitizedContent, setSanitizedContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [signerName, setSignerName] = useState('')
  const [signerEmail, setSignerEmail] = useState('')
  const [signatureData, setSignatureData] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch(`/api/documents/${id}/public`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(json => setDoc(json.template))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!doc?.content) return
    import('dompurify').then(({ default: DOMPurify }) => {
      setSanitizedContent(DOMPurify.sanitize(doc.content))
    })
  }, [doc])

  async function handleSign() {
    const errs: Record<string, string> = {}
    if (!signerName.trim()) errs.name = 'Tu nombre es requerido'
    if (!agreed) errs.agree = 'Debes aceptar haber leído el documento'
    if (!signatureData) errs.sig = 'Se requiere tu firma'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/documents/${id}/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signer_name: signerName,
          signer_email: signerEmail.trim() || null,
          signature_data: signatureData,
          patient_id: patientId ?? null,
          appointment_id: appointmentId ?? null,
        }),
      })
      if (res.ok) setSubmitted(true)
      else setErrors({ _global: 'Error al enviar. Intenta de nuevo.' })
    } catch {
      setErrors({ _global: 'Error de conexión.' })
    }
    setSubmitting(false)
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-indigo-500" />
    </div>
  )

  if (notFound) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-950 to-slate-900 text-white">
      <AlertCircle className="h-12 w-12 text-slate-500" />
      <p className="text-lg font-medium">Documento no disponible</p>
      <p className="text-sm text-slate-400">El enlace puede haber expirado.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        {/* Brand */}
        <div className="mb-8 flex items-center gap-3">
          <LogoMark />
          <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-lg font-bold text-transparent">
            AgendaMedPro
          </span>
        </div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-10 text-center"
            >
              <CheckCircle className="mx-auto mb-4 h-14 w-14 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">Documento firmado correctamente</h2>
              <p className="mt-2 text-slate-300">Tu firma ha quedado registrada. Puedes cerrar esta página.</p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Document content */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 max-h-96 overflow-y-auto">
                <h1 className="text-xl font-bold text-white mb-4">{doc!.title}</h1>
                <div
                  className="prose prose-invert prose-sm max-w-none text-slate-300"
                  dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                />
              </div>

              {/* Agree checkbox */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => { setAgreed(e.target.checked); if (errors.agree) setErrors(p => { const e = { ...p }; delete e.agree; return e }) }}
                  className="mt-0.5 rounded accent-indigo-500"
                />
                <span className="text-sm text-slate-200">He leído y entendido el contenido de este documento y doy mi consentimiento informado.</span>
              </label>
              {errors.agree && <p className="text-xs text-red-400 -mt-4">{errors.agree}</p>}

              {/* Signer info */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Datos del firmante</p>
                <div>
                  <label className="mb-1 block text-sm text-white">Nombre completo *</label>
                  <input
                    value={signerName}
                    onChange={e => { setSignerName(e.target.value); if (errors.name) setErrors(p => { const e = { ...p }; delete e.name; return e }) }}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? 'border-red-400' : 'border-white/10'}`}
                    placeholder="Nombre y apellidos"
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm text-white">Email (opcional)</label>
                  <input
                    value={signerEmail}
                    onChange={e => setSignerEmail(e.target.value)}
                    type="email"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>

              {/* Signature canvas */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Firma *</p>
                <SignatureCanvas onSign={data => { setSignatureData(data); if (errors.sig) setErrors(p => { const e = { ...p }; delete e.sig; return e }) }} />
                {errors.sig && <p className="mt-1 text-xs text-red-400">{errors.sig}</p>}
              </div>

              {errors._global && <p className="text-sm text-red-400 text-center">{errors._global}</p>}

              <button
                onClick={handleSign}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? 'Firmando...' : 'Firmar documento'}
              </button>

              <p className="text-center text-xs text-slate-500">
                Tu firma quedará registrada con fecha, hora e IP como parte del registro médico.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
