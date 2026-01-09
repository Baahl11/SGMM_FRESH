"use client"

import { useState, useEffect } from "react"
import { GlassPanel } from "@/components/ui/glass-panel"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileText, Check, Loader2, DollarSign, CreditCard, Receipt } from 'lucide-react'
import { formatPaymentMethod } from '@/app/lib/payment'
import GenerateInvoiceModal from './generate-invoice-modal'
import { Checkbox } from "@/components/ui/checkbox"

interface Record {
  id: string  // Changed to UUID string
  patient_id: string  // Changed from number to string (UUID)
  treatment_id: string
  fecha: string
  monto_pagado: number
  monto_neto: number
  metodo_pago: string
  tipo_tarjeta?: string
  meses_sin_intereses?: number
  pendiente_facturar: boolean
  treatment_name?: string
  patient_name?: string
  patients?: {
    id: string
    nombre: string
    apellido?: string
    email?: string
  }
  treatments?: {
    nombre: string
  }
}

interface PendingBillingProps {
  patientId: string  // Changed from number to string (UUID)
  onUpdate: () => void
}

export default function PendingBilling({ patientId, onUpdate }: PendingBillingProps) {
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set())
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)

  useEffect(() => {
    fetchPendingRecords()
  }, [patientId])

  const fetchPendingRecords = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/records/patient/${patientId}`)
      
      if (!response.ok) {
        throw new Error('Error loading records')
      }

      const data = await response.json()
      
      // Filter records that need billing: paid with card/transfer and not yet billed
      const pendingBilling = data.filter((record: Record) => 
        (record.metodo_pago === 'tarjeta' || record.metodo_pago === 'transferencia') &&
        record.pendiente_facturar !== false &&
        record.monto_pagado > 0
      )

      setRecords(pendingBilling)
    } catch (error) {
      console.error('Error fetching pending billing records:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSelectRecord = (recordId: string) => {
    const newSelected = new Set(selectedRecords)
    if (newSelected.has(recordId)) {
      newSelected.delete(recordId)
    } else {
      newSelected.add(recordId)
    }
    setSelectedRecords(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedRecords.size === records.length) {
      setSelectedRecords(new Set())
    } else {
      setSelectedRecords(new Set(records.map(r => r.id)))
    }
  }

  const handleGenerateInvoice = () => {
    if (selectedRecords.size === 0) {
      alert('Seleccione al menos un tratamiento')
      return
    }
    setShowInvoiceModal(true)
  }

  const handleInvoiceSuccess = () => {
    setSelectedRecords(new Set())
    fetchPendingRecords()
    onUpdate()
  }

  const getSelectedRecordsData = () => {
    return records
      .filter(r => selectedRecords.has(r.id))
      .map(r => ({
        id: r.id,
        treatment_name: r.treatments?.nombre || r.treatment_name || 'N/A',
        price: r.monto_pagado,
        fecha: r.fecha,
      }))
  }

  const getPatientInfo = () => {
    if (records.length === 0) return { id: patientId, name: '', email: undefined }
    
    const firstRecord = records[0]
    const name = firstRecord.patients 
      ? `${firstRecord.patients.nombre} ${firstRecord.patients.apellido || ''}`.trim()
      : firstRecord.patient_name || 'N/A'
    
    return {
      id: patientId,
      name,
      email: firstRecord.patients?.email,
    }
  }

  const totalPendiente = records.reduce((sum, record) => sum + record.monto_pagado, 0)
  const totalSelected = records
    .filter(r => selectedRecords.has(r.id))
    .reduce((sum, record) => sum + record.monto_pagado, 0)

  if (loading) {
    return (
      <GlassPanel className="border-white/10 bg-white/5 p-8 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-white" />
      </GlassPanel>
    )
  }

  const checkboxClasses = "border-white/30 text-white data-[state=checked]:bg-emerald-400 data-[state=checked]:border-emerald-300"

  return (
    <GlassPanel className="border-white/10 bg-white/5 p-0">
      <div className="flex flex-col gap-4 border-b border-white/10 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-lg font-semibold text-white">
            <FileText className="h-5 w-5 text-emerald-200" />
            Tratamientos Pendientes de Facturación
          </p>
          <p className="text-sm text-white/70">
            Pagos con tarjeta o transferencia que requieren CFDI.
          </p>
        </div>
        {records.length > 0 && (
          <div className="flex flex-col gap-3 text-right text-white">
            <div>
              <div className="text-xs uppercase tracking-widest text-white/60">Total pendiente</div>
              <div className="text-2xl font-semibold text-emerald-200">
                ${totalPendiente.toLocaleString()}
              </div>
            </div>
            {selectedRecords.size > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-left">
                <div className="text-xs uppercase tracking-widest text-white/60">
                  Seleccionados ({selectedRecords.size})
                </div>
                <div className="text-xl font-semibold text-cyan-200">
                  ${totalSelected.toLocaleString()}
                </div>
                <Button
                  onClick={handleGenerateInvoice}
                  className="mt-3 w-full border-0 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 text-black hover:from-emerald-300 hover:via-cyan-300 hover:to-blue-400"
                  size="sm"
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Generar Factura
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-6">
        {records.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/5">
              <Check className="h-8 w-8 text-emerald-200" />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-white">¡Todo facturado!</h3>
            <p className="mx-auto max-w-md text-white/70">
              No hay tratamientos pendientes de facturación para este paciente.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10">
                  <TableHead className="w-12 text-white/70">
                    <Checkbox
                      checked={selectedRecords.size === records.length && records.length > 0}
                      onCheckedChange={toggleSelectAll}
                      className={checkboxClasses}
                    />
                  </TableHead>
                  <TableHead className="text-white/70">Fecha</TableHead>
                  <TableHead className="text-white/70">Tratamiento</TableHead>
                  <TableHead className="text-white/70">Método de Pago</TableHead>
                  <TableHead className="text-right text-white/70">Monto</TableHead>
                  <TableHead className="text-right text-white/70">Monto Neto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => {
                  const patientName = record.patients 
                    ? `${record.patients.nombre} ${record.patients.apellido || ''}`.trim()
                    : record.patient_name || 'N/A'

                  const treatmentName = record.treatments?.nombre || record.treatment_name || 'N/A'
                  const isSelected = selectedRecords.has(record.id)

                  return (
                    <TableRow
                      key={record.id}
                      className={`border-white/10 ${isSelected ? 'bg-white/5' : ''}`}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectRecord(record.id)}
                          className={checkboxClasses}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-white">
                        {new Date(record.fecha).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold text-white">{treatmentName}</div>
                          <div className="text-sm text-white/60">{patientName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-white">
                          <CreditCard className="h-4 w-4 text-cyan-200" />
                          <span>
                            {formatPaymentMethod(
                              record.metodo_pago,
                              record.tipo_tarjeta,
                              record.meses_sin_intereses
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-white">
                        <div className="flex items-center justify-end gap-1">
                          <DollarSign className="h-4 w-4 text-emerald-200" />
                          <span className="font-semibold">
                            ${record.monto_pagado.toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-white/80">
                        ${record.monto_neto.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <GenerateInvoiceModal
        open={showInvoiceModal}
        onOpenChange={setShowInvoiceModal}
        patientId={getPatientInfo().id}
        patientName={getPatientInfo().name}
        patientEmail={getPatientInfo().email}
        records={getSelectedRecordsData()}
        onSuccess={handleInvoiceSuccess}
      />
    </GlassPanel>
  )
}
