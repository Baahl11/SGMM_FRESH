"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Tratamientos Pendientes de Facturación
            </CardTitle>
            <CardDescription>
              Tratamientos pagados con tarjeta o transferencia que requieren factura
            </CardDescription>
          </div>
          {records.length > 0 && (
            <div className="text-right space-y-2">
              <div>
                <div className="text-sm text-gray-600">Total Pendiente</div>
                <div className="text-2xl font-bold text-green-600">
                  ${totalPendiente.toLocaleString()}
                </div>
              </div>
              {selectedRecords.size > 0 && (
                <div className="pt-2 border-t">
                  <div className="text-sm text-gray-600">Seleccionados ({selectedRecords.size})</div>
                  <div className="text-xl font-bold text-blue-600">
                    ${totalSelected.toLocaleString()}
                  </div>
                  <Button
                    onClick={handleGenerateInvoice}
                    className="mt-2 bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Generar Factura
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {records.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-16 w-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              ¡Todo facturado!
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              No hay tratamientos pendientes de facturación para este paciente.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedRecords.size === records.length && records.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tratamiento</TableHead>
                  <TableHead>Método de Pago</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Monto Neto</TableHead>
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
                      className={isSelected ? 'bg-blue-50' : ''}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectRecord(record.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {new Date(record.fecha).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{treatmentName}</div>
                          <div className="text-sm text-gray-500">{patientName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-blue-600" />
                          <span>
                            {formatPaymentMethod(
                              record.metodo_pago,
                              record.tipo_tarjeta,
                              record.meses_sin_intereses
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-semibold">
                            ${record.monto_pagado.toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-sm text-gray-600">
                          ${record.monto_neto.toLocaleString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Invoice Generation Modal */}
      <GenerateInvoiceModal
        open={showInvoiceModal}
        onOpenChange={setShowInvoiceModal}
        patientId={getPatientInfo().id}
        patientName={getPatientInfo().name}
        patientEmail={getPatientInfo().email}
        records={getSelectedRecordsData()}
        onSuccess={handleInvoiceSuccess}
      />
    </Card>
  )
}
