"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  calcularGananciaNeta, 
  METODOS_PAGO_OPTIONS, 
  TIPOS_TARJETA_OPTIONS, 
  MESES_SIN_INTERESES_OPTIONS,
  type PaymentCalculation 
} from "@/app/lib/payment";
import { createClient } from "@/lib/supabase";

interface Patient {
  id: string;
  nombre: string;
  apellido: string;
}

interface Treatment {
  id: string;
  nombre: string;
  precio_base: number;
  costo_unitario: number;
}

interface Promotion {
  id: string;
  nombre: string;
  precio_total: number;
  descuento_porcentaje: number;
  activo: boolean;
  promotion_treatments: {
    id: string;
    cantidad: number;
    treatment: {
      id: string;
      nombre: string;
      precio_base: number;
      costo_unitario: number;
    };
  }[];
}

interface RecordFormData {
  patient_id: string;
  treatment_id: string;
  fecha: string;
  monto_pagado: number;
  monto_neto: number;
  costo_unitario: number;
  ganancia: number;
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia';
  tipo_tarjeta?: string;
  meses_sin_intereses?: number;
  tasa_comision?: number;
  comision_monto?: number;
  notas: string;
  nombre_promocion?: string;
}

export default function NewRecordPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div>Cargando...</div>}>
        <NewRecordForm />
      </Suspense>
    </AppLayout>
  );
}

function NewRecordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = searchParams?.get("patientId");
  
  const [isLoading, setIsLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [calculation, setCalculation] = useState<PaymentCalculation | null>(null);
  
  const [formData, setFormData] = useState<RecordFormData>({
    patient_id: patientId || "",
    treatment_id: "",
    fecha: new Date().toISOString().split("T")[0],
    monto_pagado: 0,
    monto_neto: 0,
    costo_unitario: 0,
    ganancia: 0,
    metodo_pago: "efectivo",
    tipo_tarjeta: undefined,
    meses_sin_intereses: 0,
    tasa_comision: 0,
    comision_monto: 0,
    notas: "",
    nombre_promocion: undefined,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Recalcular cuando cambien los valores relevantes
    if (formData.monto_pagado > 0 && formData.costo_unitario > 0) {
      try {
        const calc = calcularGananciaNeta(
          formData.monto_pagado,
          formData.costo_unitario,
          formData.metodo_pago,
          formData.tipo_tarjeta,
          formData.meses_sin_intereses || 0
        );
        setCalculation(calc);
        setFormData(prev => ({
          ...prev,
          monto_neto: formData.monto_pagado - calc.comision,
          ganancia: calc.ganancia,
          tasa_comision: calc.tasa,
          comision_monto: calc.comision
        }));
      } catch (error) {
        console.error("Error calculando comisión:", error);
        setCalculation(null);
      }
    }
  }, [
    formData.monto_pagado,
    formData.costo_unitario,
    formData.metodo_pago,
    formData.tipo_tarjeta,
    formData.meses_sin_intereses
  ]);

  const loadData = async () => {
    const supabase = createClient();
    
    try {
      // Load patients
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('id, nombre, apellido')
        .order('nombre');
      
      if (patientsError) throw patientsError;
      if (patientsData) setPatients(patientsData);
      
      // Load treatments via API endpoint (has auth + RLS)
      console.log('🔄 Loading treatments...');
      const treatmentsResponse = await fetch(`/api/treatments?t=${Date.now()}`);
      if (!treatmentsResponse.ok) {
        console.error('❌ Error loading treatments:', treatmentsResponse.status);
        throw new Error('Error loading treatments');
      }
      const treatmentsData = await treatmentsResponse.json();
      console.log('✅ Treatments loaded:', treatmentsData.length, 'treatments', treatmentsData);
      setTreatments(treatmentsData || []);

      // Load promotions
      const response = await fetch('/api/promotions');
      if (response.ok) {
        const promotionsData = await response.json();
        setPromotions(promotionsData.filter((p: Promotion) => p.activo !== false));
      }
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Error al cargar datos");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('records')
        .insert([{
          patient_id: formData.patient_id,
          treatment_id: formData.treatment_id,
          fecha: formData.fecha,
          monto_pagado: formData.monto_pagado,
          monto_neto: formData.monto_neto,
          costo_unitario: formData.costo_unitario,
          ganancia: formData.ganancia,
          metodo_pago: formData.metodo_pago,
          tipo_tarjeta: formData.tipo_tarjeta,
          meses_sin_intereses: formData.meses_sin_intereses,
          tasa_comision: formData.tasa_comision,
          comision_monto: formData.comision_monto,
          notas: formData.notas,
          nombre_promocion: formData.nombre_promocion
        }])
        .select();
      
      if (error) throw error;
      
      console.log("✅ Record created:", data);
      alert("Tratamiento registrado exitosamente");
      
      // Redirect back to patient or records page
      if (patientId) {
        router.push(`/patients/${patientId}`);
      } else {
        router.push("/records");
      }
    } catch (error) {
      console.error("❌ Error creating record:", error);
      alert("Error al registrar tratamiento: " + (error instanceof Error ? error.message : "Error desconocido"));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromotionChange = (promotionId: string) => {
    if (!promotionId || promotionId === "0") {
      setSelectedPromotion(null);
      setFormData(prev => ({
        ...prev,
        nombre_promocion: undefined,
        treatment_id: "",
        monto_pagado: 0,
        costo_unitario: 0
      }));
      return;
    }

    const promotion = promotions.find(p => p.id === promotionId);
    if (!promotion) {
      console.log('❌ Promotion not found:', promotionId);
      console.log('Available promotions:', promotions.map(p => p.id));
      return;
    }

    console.log('✅ Promotion selected:', promotion);
    setSelectedPromotion(promotion);

    // Calculate total cost from all treatments in promotion
    const totalCost = promotion.promotion_treatments.reduce(
      (sum, pt) => sum + (pt.treatment.costo_unitario * pt.cantidad),
      0
    );

    // Get first treatment ID (or could create a combined record)
    const firstTreatmentId = promotion.promotion_treatments[0]?.treatment.id || "";

    setFormData(prev => ({
      ...prev,
      nombre_promocion: promotion.nombre,
      treatment_id: firstTreatmentId,
      monto_pagado: promotion.precio_total,
      monto_neto: promotion.precio_total,
      costo_unitario: totalCost
    }));
  };

  const handleTreatmentChange = (treatmentId: string) => {
    const treatment = treatments.find(t => t.id === treatmentId);
    if (treatment) {
      setFormData(prev => ({
        ...prev,
        treatment_id: treatmentId,
        monto_pagado: treatment.precio_base,
        monto_neto: treatment.precio_base,
        costo_unitario: treatment.costo_unitario || 0,
        nombre_promocion: undefined // Clear promotion when selecting individual treatment
      }));
      setSelectedPromotion(null);
    }
  };

  const handleChange = (name: keyof RecordFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Nuevo Tratamiento</h1>
        <p className="text-muted-foreground mt-2">
          Registre un nuevo tratamiento para un paciente
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información del Tratamiento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!patientId && (
              <div className="space-y-2">
                <Label htmlFor="patient_id">Paciente *</Label>
                <Select
                  value={formData.patient_id}
                  onValueChange={(value) => handleChange('patient_id', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.nombre} {patient.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Promotion Selector */}
            <div className="space-y-2">
              <Label htmlFor="promotion" className="flex items-center gap-2">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-semibold">
                  Promoción
                </span>
                <span className="text-muted-foreground font-normal">(Opcional)</span>
              </Label>
              <Select
                value={selectedPromotion?.id || "0"}
                onValueChange={handlePromotionChange}
              >
                <SelectTrigger className="border-purple-300 focus:ring-purple-500">
                  <SelectValue placeholder="Seleccionar promoción..." />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  <SelectItem value="0">Sin promoción</SelectItem>
                  {promotions.map((promotion) => (
                    <SelectItem key={promotion.id} value={promotion.id}>
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{promotion.nombre}</span>
                        <span className="ml-4 text-sm text-green-600 font-semibold">
                          ${promotion.precio_total.toLocaleString()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPromotion && (
                <div className="mt-2 p-4 bg-white border-2 border-purple-300 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      ✨ {selectedPromotion.nombre}
                    </p>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                      -{selectedPromotion.descuento_porcentaje.toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    Tratamientos incluidos:
                  </p>
                  <ul className="text-sm space-y-1.5">
                    {selectedPromotion.promotion_treatments.map((pt, idx) => (
                      <li key={idx} className="flex items-center justify-between text-gray-700">
                        <span>• {pt.treatment.nombre} <span className="text-purple-600 font-semibold">x{pt.cantidad}</span></span>
                        <span className="text-gray-500 text-xs">${(pt.treatment.precio_base * pt.cantidad).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 pt-3 border-t border-purple-200 flex items-center justify-between">
                    <span className="text-xs text-gray-600">Precio promocional:</span>
                    <span className="text-lg font-bold text-green-600">${selectedPromotion.precio_total.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatment_id">Tratamiento {selectedPromotion ? '(Auto-cargado)' : '*'}</Label>
              <Select
                value={formData.treatment_id}
                onValueChange={handleTreatmentChange}
                required={!selectedPromotion}
                disabled={!!selectedPromotion}
              >
                <SelectTrigger className={selectedPromotion ? 'bg-gray-100' : ''}>
                  <SelectValue placeholder="Seleccionar tratamiento" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {treatments.length === 0 ? (
                    <SelectItem value="0" disabled>
                      No hay tratamientos disponibles
                    </SelectItem>
                  ) : (
                    treatments.map((treatment) => (
                      <SelectItem key={treatment.id} value={treatment.id}>
                        {treatment.nombre} - ${treatment.precio_base.toLocaleString()}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) => handleChange('fecha', e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información de Pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monto_pagado">Monto Pagado *</Label>
                <Input
                  id="monto_pagado"
                  type="number"
                  step="0.01"
                  value={formData.monto_pagado}
                  onChange={(e) => handleChange('monto_pagado', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="costo_unitario">Costo Unitario *</Label>
                <Input
                  id="costo_unitario"
                  type="number"
                  step="0.01"
                  value={formData.costo_unitario}
                  onChange={(e) => handleChange('costo_unitario', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metodo_pago">Método de Pago *</Label>
              <Select
                value={formData.metodo_pago}
                onValueChange={(value) => handleChange('metodo_pago', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar método de pago" />
                </SelectTrigger>
                <SelectContent>
                  {METODOS_PAGO_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.metodo_pago === 'tarjeta' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="tipo_tarjeta">Tipo de Tarjeta *</Label>
                  <Select
                    value={formData.tipo_tarjeta || ''}
                    onValueChange={(value) => handleChange('tipo_tarjeta', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo de tarjeta" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_TARJETA_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meses_sin_intereses">Meses Sin Intereses</Label>
                  <Select
                    value={formData.meses_sin_intereses?.toString() || '0'}
                    onValueChange={(value) => handleChange('meses_sin_intereses', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar MSI" />
                    </SelectTrigger>
                    <SelectContent>
                      {MESES_SIN_INTERESES_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {calculation && (
              <Card className="bg-gray-50">
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2">Resumen de Cálculos</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Monto Pagado:</div>
                    <div className="font-medium">${formData.monto_pagado.toLocaleString()}</div>
                    
                    {calculation.tasa > 0 && (
                      <>
                        <div>Tasa de Comisión:</div>
                        <div className="font-medium">{calculation.tasa.toFixed(2)}%</div>
                        
                        <div>Comisión:</div>
                        <div className="font-medium text-red-600">-${calculation.comision.toFixed(2)}</div>
                        
                        <div>Monto Neto:</div>
                        <div className="font-medium">${calculation.montoNeto.toFixed(2)}</div>
                      </>
                    )}
                    
                    <div>Costo:</div>
                    <div className="font-medium text-red-600">-${formData.costo_unitario.toLocaleString()}</div>
                    
                    <div>Ganancia:</div>
                    <div className={`font-bold ${calculation.ganancia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${calculation.ganancia.toFixed(2)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                value={formData.notas}
                onChange={(e) => handleChange('notas', e.target.value)}
                placeholder="Notas adicionales..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar Tratamiento"}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
