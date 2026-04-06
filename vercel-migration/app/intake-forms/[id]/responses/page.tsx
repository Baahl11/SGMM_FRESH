'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/app-layout'
import { GlassPanel } from '@/components/ui/glass-panel'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, ClipboardList } from 'lucide-react'

interface FormField {
  id: string
  label: string
  type: string
}

interface Response {
  id: string
  nombre: string | null
  email: string | null
  telefono: string | null
  answers: Record<string, unknown>
  submitted_at: string
}

export default function IntakeResponsesPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [responses, setResponses] = useState<Response[]>([])
  const [fields, setFields] = useState<FormField[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [formTitle, setFormTitle] = useState('')

  useEffect(() => {
    async function load() {
      const [formRes, respRes] = await Promise.all([
        fetch(`/api/intake-forms/${id}`),
        fetch(`/api/intake-forms/${id}/responses?limit=100`),
      ])
      if (formRes.ok) {
        const { form } = await formRes.json()
        setFormTitle(form.title)
      }
      if (respRes.ok) {
        const json = await respRes.json()
        setResponses(json.responses)
        setFields(json.fields)
        setTotal(json.total)
      }
      setLoading(false)
    }
    load()
  }, [id])

  function downloadCsv() {
    const headers = ['Nombre', 'Email', 'Teléfono', 'Fecha', ...fields.map(f => f.label)]
    const rows = responses.map(r => [
      r.nombre ?? '',
      r.email ?? '',
      r.telefono ?? '',
      new Date(r.submitted_at).toLocaleString('es-MX'),
      ...fields.map(f => {
        const v = r.answers[f.id]
        return Array.isArray(v) ? v.join(', ') : (v ?? '')
      }),
    ])
    const csv = [headers, ...rows].map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `respuestas-${id}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/intake-forms')} className="p-2 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{formTitle}</h1>
            <p className="text-sm text-slate-400">{total} respuesta{total !== 1 ? 's' : ''}</p>
          </div>
          {responses.length > 0 && (
            <Button onClick={downloadCsv} variant="outline" size="sm" className="gap-2 border-white/20 text-slate-300 hover:text-white hover:bg-white/10">
              <Download className="h-4 w-4" /> Exportar CSV
            </Button>
          )}
        </div>

        <GlassPanel className="overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">Cargando...</div>
          ) : responses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <ClipboardList className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">No hay respuestas aún</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 whitespace-nowrap">Paciente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 whitespace-nowrap">Fecha</th>
                    {fields.map(f => (
                      <th key={f.id} className="px-4 py-3 text-left text-xs font-medium text-slate-400 whitespace-nowrap max-w-[180px] truncate">
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {responses.map(r => (
                    <tr key={r.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-slate-200 whitespace-nowrap">
                        <p className="font-medium">{r.nombre ?? '—'}</p>
                        <p className="text-xs text-slate-400">{r.telefono ?? r.email ?? ''}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">
                        {new Date(r.submitted_at).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      {fields.map(f => {
                        const v = r.answers[f.id]
                        return (
                          <td key={f.id} className="px-4 py-3 text-slate-300 max-w-[200px]">
                            <span className="line-clamp-2">
                              {Array.isArray(v) ? v.join(', ') : (v as string) ?? '—'}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassPanel>
      </div>
    </AppLayout>
  )
}
