'use client'

import { useEffect, useState, useCallback } from 'react'
import AppLayout from '@/components/layout/app-layout'
import { GlassPanel } from '@/components/ui/glass-panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus, Search, User, Phone, Mail, MessageSquare,
  ChevronRight, Trash2, Send,
} from 'lucide-react'
import { toast } from 'sonner'

type LeadStatus = 'nuevo' | 'contactado' | 'calificado' | 'convertido' | 'perdido'

interface Lead {
  id: string
  nombre: string
  email: string | null
  telefono: string | null
  source: string
  status: LeadStatus
  notas: string | null
  utm_source: string | null
  utm_campaign: string | null
  created_at: string
}

interface LeadNote {
  id: string
  body: string
  created_at: string
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  calificado: 'Calificado',
  convertido: 'Convertido',
  perdido: 'Perdido',
}

const STATUS_COLORS: Record<LeadStatus, string> = {
  nuevo: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  contactado: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  calificado: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  convertido: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  perdido: 'bg-red-500/20 text-red-300 border-red-500/30',
}

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual',
  landing_contact: 'Landing',
  whatsapp_click: 'WhatsApp',
  calculator: 'Calculadora',
  referral: 'Referido',
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selected, setSelected] = useState<Lead | null>(null)
  const [notes, setNotes] = useState<LeadNote[]>([])
  const [newNote, setNewNote] = useState('')
  const [sendingNote, setSendingNote] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newLead, setNewLead] = useState({ nombre: '', email: '', telefono: '', notas: '' })

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (search.trim()) params.set('q', search.trim())

    const res = await fetch(`/api/leads?${params}`)
    if (res.ok) {
      const json = await res.json()
      setLeads(json.leads)
    }
    setLoading(false)
  }, [statusFilter, search])

  useEffect(() => {
    const debounce = setTimeout(fetchLeads, 300)
    return () => clearTimeout(debounce)
  }, [fetchLeads])

  async function openLead(lead: Lead) {
    setSelected(lead)
    const res = await fetch(`/api/leads/${lead.id}/notes`)
    if (res.ok) setNotes((await res.json()).notes)
    else setNotes([])
  }

  async function updateStatus(leadId: string, status: LeadStatus) {
    const res = await fetch(`/api/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const { lead: updated } = await res.json()
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: updated.status } : l))
      if (selected?.id === leadId) setSelected(prev => prev ? { ...prev, status: updated.status } : null)
    }
  }

  async function addNote() {
    if (!selected || !newNote.trim()) return
    setSendingNote(true)
    const res = await fetch(`/api/leads/${selected.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: newNote.trim() }),
    })
    if (res.ok) {
      const { note } = await res.json()
      setNotes(prev => [note, ...prev])
      setNewNote('')
    }
    setSendingNote(false)
  }

  async function deleteLead(leadId: string) {
    if (!confirm('¿Eliminar este lead?')) return
    const res = await fetch(`/api/leads/${leadId}`, { method: 'DELETE' })
    if (res.ok) {
      setLeads(prev => prev.filter(l => l.id !== leadId))
      if (selected?.id === leadId) setSelected(null)
      toast.success('Lead eliminado')
    }
  }

  async function createLead() {
    if (!newLead.nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newLead, source: 'manual' }),
    })
    if (res.ok) {
      const { lead } = await res.json()
      setLeads(prev => [lead, ...prev])
      setNewLead({ nombre: '', email: '', telefono: '', notas: '' })
      setShowNewForm(false)
      toast.success('Lead creado')
    }
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Leads</h1>
            <p className="text-sm text-slate-400">Seguimiento de prospectos y contactos</p>
          </div>
          <Button
            onClick={() => setShowNewForm(true)}
            className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            <Plus className="h-4 w-4" />
            Nuevo lead
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, email o teléfono..."
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {(Object.keys(STATUS_LABELS) as LeadStatus[]).map(s => (
                <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status summary */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(STATUS_LABELS) as LeadStatus[]).map(s => {
            const count = leads.filter(l => l.status === s).length
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${STATUS_COLORS[s]} ${statusFilter === s ? 'ring-2 ring-white/30' : 'opacity-70 hover:opacity-100'}`}
              >
                {STATUS_LABELS[s]} {count > 0 && <span className="ml-1 font-bold">{count}</span>}
              </button>
            )
          })}
        </div>

        {/* Lead list */}
        <GlassPanel className="overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">Cargando...</div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <User className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">No hay leads {statusFilter !== 'all' ? `con estado "${STATUS_LABELS[statusFilter as LeadStatus]}"` : 'aún'}</p>
              <Button variant="ghost" onClick={() => setShowNewForm(true)} className="mt-4 text-indigo-400">
                + Agregar el primero
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {leads.map(lead => (
                <li
                  key={lead.id}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => openLead(lead)}
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 font-semibold text-sm uppercase">
                    {lead.nombre.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white text-sm">{lead.nombre}</p>
                    <p className="truncate text-xs text-slate-400">
                      {lead.telefono ?? lead.email ?? '—'}
                      {lead.utm_source && <span className="ml-2 text-slate-500">· {lead.utm_source}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`hidden sm:inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[lead.status]}`}>
                      {STATUS_LABELS[lead.status]}
                    </span>
                    <span className="text-xs text-slate-500">
                      {SOURCE_LABELS[lead.source] ?? lead.source}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-600" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GlassPanel>
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={open => { if (!open) setSelected(null) }}>
        <SheetContent className="w-full sm:max-w-md bg-slate-900 border-white/10 text-white overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="mb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <SheetTitle className="text-white text-xl">{selected.nombre}</SheetTitle>
                    <p className="text-sm text-slate-400 mt-0.5">
                      {new Date(selected.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {' · '}{SOURCE_LABELS[selected.source] ?? selected.source}
                    </p>
                  </div>
                  <button onClick={() => deleteLead(selected.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </SheetHeader>

              {/* Contact info */}
              <div className="space-y-2 mb-5">
                {selected.telefono && (
                  <a href={`tel:${selected.telefono}`} className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10">
                    <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    {selected.telefono}
                  </a>
                )}
                {selected.email && (
                  <a href={`mailto:${selected.email}`} className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10">
                    <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    {selected.email}
                  </a>
                )}
                {selected.telefono && (
                  <a
                    href={`https://wa.me/${selected.telefono.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5 text-sm text-emerald-300 hover:bg-emerald-500/20"
                  >
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    Escribir por WhatsApp
                  </a>
                )}
              </div>

              {/* Status selector */}
              <div className="mb-5">
                <p className="mb-2 text-xs font-medium text-slate-400 uppercase tracking-wider">Estado</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(STATUS_LABELS) as LeadStatus[]).map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selected.id, s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${STATUS_COLORS[s]} ${selected.status === s ? 'ring-2 ring-white/30' : 'opacity-50 hover:opacity-80'}`}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notas */}
              {selected.notas && (
                <div className="mb-5 rounded-lg bg-white/5 p-3">
                  <p className="text-xs text-slate-400 mb-1">Nota inicial</p>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{selected.notas}</p>
                </div>
              )}

              {/* UTM */}
              {selected.utm_source && (
                <div className="mb-5 text-xs text-slate-500">
                  Fuente: {selected.utm_source}
                  {selected.utm_campaign && ` · Campaña: ${selected.utm_campaign}`}
                </div>
              )}

              {/* Add note */}
              <div className="mb-4">
                <p className="mb-2 text-xs font-medium text-slate-400 uppercase tracking-wider">Agregar nota</p>
                <div className="flex gap-2">
                  <Textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Escribe una nota de seguimiento..."
                    rows={2}
                    className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-slate-500 resize-none text-sm"
                    onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) addNote() }}
                  />
                  <Button onClick={addNote} disabled={sendingNote || !newNote.trim()} size="icon" className="bg-indigo-600 hover:bg-indigo-500 self-end">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Note list */}
              {notes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Historial</p>
                  {notes.map(n => (
                    <div key={n.id} className="rounded-lg bg-white/5 px-3 py-2.5">
                      <p className="text-sm text-slate-200 whitespace-pre-wrap">{n.body}</p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {new Date(n.created_at).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* New Lead Sheet */}
      <Sheet open={showNewForm} onOpenChange={setShowNewForm}>
        <SheetContent className="w-full sm:max-w-sm bg-slate-900 border-white/10 text-white">
          <SheetHeader>
            <SheetTitle className="text-white">Nuevo lead</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Nombre *</label>
              <Input value={newLead.nombre} onChange={e => setNewLead(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Nombre del contacto" className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Teléfono</label>
              <Input value={newLead.telefono} onChange={e => setNewLead(p => ({ ...p, telefono: e.target.value }))}
                placeholder="+52 555 000 0000" type="tel" className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Email</label>
              <Input value={newLead.email} onChange={e => setNewLead(p => ({ ...p, email: e.target.value }))}
                placeholder="correo@ejemplo.com" type="email" className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Nota inicial</label>
              <Textarea value={newLead.notas} onChange={e => setNewLead(p => ({ ...p, notas: e.target.value }))}
                placeholder="¿Qué necesita? ¿Cómo llegó?" rows={3}
                className="bg-white/5 border-white/10 text-white resize-none" />
            </div>
            <Button onClick={createLead} className="w-full bg-indigo-600 hover:bg-indigo-500">
              Crear lead
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </AppLayout>
  )
}
