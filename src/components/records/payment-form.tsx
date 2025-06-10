"use client"

import React, { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  PaymentMethod,
  Terminal,
  InstallmentPeriod,
  calculateTotal,
  formatCurrency,
} from "@/lib/payment"

interface PaymentFormProps {
  amount: number;
  onTotalChange: (total: number) => void;
  onPaymentMethodChange: (
    method: PaymentMethod,
    terminal?: Terminal,
    installments?: InstallmentPeriod
  ) => void;
}

export function PaymentForm({ amount, onTotalChange, onPaymentMethodChange }: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
  const [terminal, setTerminal] = useState<Terminal | undefined>()
  const [installments, setInstallments] = useState<InstallmentPeriod | undefined>()
  const handlePaymentMethodChange = (value: PaymentMethod) => {
    const newMethod = value;
    setPaymentMethod(newMethod);
    // Limpiar terminal y plazos si no es tarjeta
    if (newMethod !== 'credit' && newMethod !== 'debit') {
      setTerminal(undefined);
      setInstallments(undefined);
    }
    onPaymentMethodChange(newMethod, undefined, undefined);
  };

  const handleTerminalChange = (value: Terminal) => {
    setTerminal(value);
    setInstallments(undefined);
    onPaymentMethodChange(paymentMethod, value, undefined);
  };

  const handleInstallmentsChange = (value: string) => {
    const months = parseInt(value);
    const newInstallments = months === 1 ? undefined : (months as InstallmentPeriod);
    setInstallments(newInstallments);
    onPaymentMethodChange(paymentMethod, terminal, newInstallments);
  };

  // Calcular totales cuando cambian los valores relevantes
  const totals = calculateTotal(amount, paymentMethod, terminal, installments);
  const prevTotalRef = React.useRef(totals.total);

  useEffect(() => {
    if (prevTotalRef.current !== totals.total) {
      prevTotalRef.current = totals.total;
      onTotalChange(totals.total);
    }
  }, [totals.total, onTotalChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalles de Pago</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Método de Pago</Label>
            <Select
              value={paymentMethod}
              onValueChange={handlePaymentMethodChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar método de pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Efectivo</SelectItem>
              <SelectItem value="transfer">Transferencia</SelectItem>
              <SelectItem value="debit">Tarjeta de Débito</SelectItem>
              <SelectItem value="credit">Tarjeta de Crédito</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(paymentMethod === "credit" || paymentMethod === "debit") && (
          <div className="space-y-2">
            <Label>Terminal</Label>
            <Select
              value={terminal}
              onValueChange={handleTerminalChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar terminal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bbva">BBVA</SelectItem>
                <SelectItem value="openpay">OpenPay</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {paymentMethod === "credit" && terminal && (
          <div className="space-y-2">
            <Label>Meses sin intereses</Label>
            <Select
              value={installments?.toString() || "1"}
              onValueChange={handleInstallmentsChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar plazo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Pago único</SelectItem>
                <SelectItem value="3">3 meses sin intereses</SelectItem>
                <SelectItem value="6">6 meses sin intereses</SelectItem>
                <SelectItem value="9">9 meses sin intereses</SelectItem>
                <SelectItem value="12">12 meses sin intereses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          {totals.commission > 0 && (
            <div className="flex justify-between text-sm">
              <span>Comisión:</span>
              <span>{formatCurrency(totals.commission)}</span>
            </div>
          )}
          {totals.iva > 0 && (
            <div className="flex justify-between text-sm">
              <span>IVA sobre comisión:</span>
              <span>{formatCurrency(totals.iva)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold pt-2 border-t">
            <span>Total:</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
