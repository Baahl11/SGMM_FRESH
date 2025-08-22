"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Plus, Trash2, CreditCard, Calculator, DollarSign, Percent, Package } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ApiService from "@/lib/api-service";

interface Treatment {
  id?: number;
  nombre_tratamiento: string;
  precio_normal: number;
  precio_promocional: number;
  costo_unitario: number;
  ganancia_individual: number;
  treatment_id?: number;
  orden: number;
}

interface CreditCardInfo {
  tipo_tarjeta?: 'bbva' | 'banamex' | 'amex' | 'openpay' | 'otros';
  meses_sin_intereses?: number;
  tasa_comision?: number;
}

interface MultiTreatmentFormProps {
  patientId: number;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
  initialData?: any;
}

export default function MultiTreatmentForm({
  patientId,
  onSubmit,
  onCancel,
  loading = false,
  initialData
}: MultiTreatmentFormProps) {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [availableTreatments, setAvailableTreatments] = useState<any[]>([]);
  const [creditCardOptions, setCreditCardOptions] = useState<any[]>([
    // Initialize with default options immediately
    {
      id: "bbva",
      name: "BBVA",
      commission_rate: 3.5,
      rates: { "0": 3.5, "3": 3.95, "6": 6.5, "9": 9.0, "12": 12.0 }
    },
    {
      id: "banamex",
      name: "Banamex",
      commission_rate: 1.5,
      rates: { "0": 1.5, "3": 7.25, "6": 11.99, "9": 15.53, "12": 18.13 }
    },
    {
      id: "amex",
      name: "American Express",
      commission_rate: 2.65,
      rates: { "0": 2.65, "3": 6.30, "6": 8.30, "9": 11.30, "12": 14.30 }
    },
    {
      id: "openpay",
      name: "OpenPay",
      commission_rate: 3.364,
      rates: { "0": 3.364, "3": 8.932, "6": 12.412, "9": 15.892, "12": 19.372 }
    },
    {
      id: "otros",
      name: "Otros",
      commission_rate: 3.0,
      rates: { "0": 3.0, "3": 6.5, "6": 8.5, "9": 11.5, "12": 14.5 }
    }
  ]);
  
  // Form data
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [nombrePromocion, setNombrePromocion] = useState("");
  const [notas, setNotas] = useState("");
  
  // Credit card specific fields
  const [creditCardInfo, setCreditCardInfo] = useState<CreditCardInfo>({});
  const [showCommissionCalculator, setShowCommissionCalculator] = useState(false);

  // Debug: Log state changes
  useEffect(() => {
    console.log("🔧 creditCardOptions updated:", creditCardOptions);
  }, [creditCardOptions]);

  useEffect(() => {
    console.log("🔧 metodoPago updated:", metodoPago);
  }, [metodoPago]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (metodoPago === "tarjeta_credito") {
      setShowCommissionCalculator(true);
    } else {
      setShowCommissionCalculator(false);
      setCreditCardInfo({});
    }
  }, [metodoPago]);

  const loadInitialData = async () => {
    console.log("🔄 Iniciando carga de datos iniciales...");
    
    try {
      // Set default options immediately as fallback
      const defaultCards = [
        { id: "bbva", name: "BBVA", commission_rate: 3.5 },
        { id: "banamex", name: "Banamex", commission_rate: 1.5 },
        { id: "amex", name: "American Express", commission_rate: 2.65 },
        { id: "openpay", name: "OpenPay", commission_rate: 3.364 },
        { id: "otros", name: "Otros", commission_rate: 3.0 }
      ];
      
      console.log("💳 Estableciendo opciones por defecto:", defaultCards);
      setCreditCardOptions(defaultCards);

      const [treatmentsResponse, creditCardsResponse] = await Promise.all([
        ApiService.getTreatments(),
        ApiService.getCreditCardOptions()
      ]);

      if (treatmentsResponse.data) {
        console.log("✅ Tratamientos cargados:", treatmentsResponse.data.length);
        setAvailableTreatments(treatmentsResponse.data);
      }

      if (creditCardsResponse.data) {
        console.log("✅ Opciones de tarjetas del backend:", creditCardsResponse.data);
        setCreditCardOptions(creditCardsResponse.data);
      } else {
        console.warn("⚠️ No se pudieron cargar tarjetas del backend, usando opciones por defecto");
        console.log("Error details:", creditCardsResponse.error);
      }

      // Initialize with one empty treatment
      if (treatments.length === 0) {
        addTreatment();
      }
      
      console.log("✅ Carga de datos completada");
    } catch (error) {
      console.error("❌ Error loading initial data:", error);
      // Ensure we always have default options
      setCreditCardOptions([
        { id: "bbva", name: "BBVA", commission_rate: 3.5 },
        { id: "banamex", name: "Banamex", commission_rate: 1.5 },
        { id: "amex", name: "American Express", commission_rate: 2.65 },
        { id: "openpay", name: "OpenPay", commission_rate: 3.364 },
        { id: "otros", name: "Otros", commission_rate: 3.0 }
      ]);
    }
  };

  const addTreatment = () => {
    const newTreatment: Treatment = {
      treatment_id: undefined, // ✅ Inicializar explícitamente
      nombre_tratamiento: "",
      precio_normal: 0,
      precio_promocional: 0,
      costo_unitario: 0,
      ganancia_individual: 0,
      orden: treatments.length + 1
    };
    console.log('➕ [ADD] Adding new treatment with keys:', Object.keys(newTreatment));
    setTreatments([...treatments, newTreatment]);
  };

  const removeTreatment = (index: number) => {
    if (treatments.length > 1) {
      const newTreatments = treatments.filter((_, i) => i !== index);
      setTreatments(newTreatments);
    }
  };

  const updateTreatment = (index: number, field: keyof Treatment, value: any) => {
    console.log(`🔧 [UPDATE] Updating treatment ${index}, field: ${field}, value:`, value);
    
    setTreatments(prevTreatments => {
      const newTreatments = [...prevTreatments];
      const oldTreatment = newTreatments[index];
      newTreatments[index] = { ...oldTreatment, [field]: value };
      
      console.log(`🔧 [UPDATE] Before update:`, Object.keys(oldTreatment));
      console.log(`🔧 [UPDATE] After update:`, Object.keys(newTreatments[index]));
      console.log(`🔧 [UPDATE] treatment_id after update:`, newTreatments[index].treatment_id);
      
      // Auto-calculate ganancia when relevant fields change
      if (field === 'precio_promocional' || field === 'costo_unitario') {
        const treatment = newTreatments[index];
        const comisionIndividual = metodoPago === "tarjeta_credito" && creditCardInfo.tasa_comision 
          ? treatment.precio_promocional * (creditCardInfo.tasa_comision / 100) 
          : 0;
        treatment.ganancia_individual = treatment.precio_promocional - treatment.costo_unitario - comisionIndividual;
      }
      
      return newTreatments;
    });
  };

  const selectTreatmentFromCatalog = (index: number, treatmentId: string) => {
    console.log(`🎯 [FORM] Selecting treatment for index ${index}, treatmentId: "${treatmentId}"`);
    
    const selectedTreatment = availableTreatments.find(t => t.id.toString() === treatmentId);
    console.log(`🔍 [FORM] Found treatment:`, selectedTreatment);
    
    if (selectedTreatment) {
      console.log(`✅ [FORM] Updating treatment ${index} with id: ${selectedTreatment.id}`);
      updateTreatment(index, 'treatment_id', selectedTreatment.id);
      updateTreatment(index, 'nombre_tratamiento', selectedTreatment.nombre);
      updateTreatment(index, 'precio_normal', selectedTreatment.precio);
      updateTreatment(index, 'precio_promocional', selectedTreatment.precio);
      updateTreatment(index, 'costo_unitario', selectedTreatment.costo_unitario);
    } else {
      console.error(`❌ [FORM] No treatment found for id: ${treatmentId}`);
    }
  };

  const calculateTotals = () => {
    const totalPrecioNormal = treatments.reduce((sum, t) => sum + t.precio_normal, 0);
    const totalPrecioPromocional = treatments.reduce((sum, t) => sum + t.precio_promocional, 0);
    const totalCosto = treatments.reduce((sum, t) => sum + t.costo_unitario, 0);
    const totalAhorro = totalPrecioNormal - totalPrecioPromocional;
    
    const comisionMonto = metodoPago === "tarjeta_credito" && creditCardInfo.tasa_comision
      ? totalPrecioPromocional * (creditCardInfo.tasa_comision / 100)
      : 0;
    
    const montoNeto = totalPrecioPromocional - comisionMonto;
    const gananciaTotal = montoNeto - totalCosto;
    
    return {
      totalPrecioNormal,
      totalPrecioPromocional,
      totalCosto,
      totalAhorro,
      comisionMonto,
      montoNeto,
      gananciaTotal
    };
  };

  const updateCreditCardCommission = (cardType: string, months?: number) => {
    console.log("💳 Actualizando comisión para tarjeta:", cardType, "meses:", months);
    
    // Definir las tasas directamente para evitar problemas de estado
    const cardRates: { [key: string]: { [key: string]: number } } = {
      'bbva': { "0": 3.5, "3": 3.95, "6": 6.5, "9": 9.0, "12": 12.0 },
      'banamex': { "0": 1.5, "3": 7.25, "6": 11.99, "9": 15.53, "12": 18.13 },
      'amex': { "0": 2.65, "3": 6.30, "6": 8.30, "9": 11.30, "12": 14.30 },
      'openpay': { "0": 3.364, "3": 8.932, "6": 12.412, "9": 15.892, "12": 19.372 },
      'otros': { "0": 3.0, "3": 6.5, "6": 8.5, "9": 11.5, "12": 14.5 }
    };
    
    const mesesSeleccionados = months !== undefined ? months : (creditCardInfo.meses_sin_intereses || 0);
    const rates = cardRates[cardType];
    const commissionRate = rates ? rates[mesesSeleccionados.toString()] || rates["0"] : 3.0;
    
    console.log("💰 Tasa de comisión aplicada:", commissionRate + "%", "para", mesesSeleccionados, "meses");
    
    setCreditCardInfo({
      ...creditCardInfo,
      tipo_tarjeta: cardType as 'bbva' | 'banamex' | 'amex' | 'openpay' | 'otros',
      tasa_comision: commissionRate,
      meses_sin_intereses: mesesSeleccionados
    });
  };

  const updateMesesSinIntereses = (meses: number) => {
    console.log("📅 Actualizando meses sin intereses:", meses);
    
    if (creditCardInfo.tipo_tarjeta) {
      // Re-calculate commission with new months
      updateCreditCardCommission(creditCardInfo.tipo_tarjeta, meses);
    } else {
      // Just update months if no card selected yet
      setCreditCardInfo({
        ...creditCardInfo,
        meses_sin_intereses: meses
      });
    }
  };

  const handleSubmit = () => {
    const totals = calculateTotals();
    
    // Validate required fields
    if (!nombrePromocion.trim()) {
      alert("Por favor ingresa el nombre de la promoción");
      return;
    }
    
    if (treatments.some(t => !t.nombre_tratamiento.trim() || t.precio_promocional <= 0)) {
      alert("Por favor completa todos los tratamientos");
      return;
    }
    
    // DEBUG: Check treatment_id values before validation
    console.log('🔍 [VALIDATION] Checking treatment_ids:', treatments.map(t => ({
      index: treatments.indexOf(t),
      nombre: t.nombre_tratamiento,
      treatment_id: t.treatment_id,
      hasId: !!t.treatment_id,
      type: typeof t.treatment_id
    })));
    
    // TEMPORARY: Comment out treatment_id validation to test
    // if (treatments.some(t => !t.treatment_id)) {
    //   alert("Por favor selecciona todos los tratamientos del catálogo usando los dropdowns");
    //   return;
    // }
    
    if (metodoPago === "tarjeta_credito" && !creditCardInfo.tipo_tarjeta) {
      alert("Por favor selecciona el tipo de tarjeta de crédito");
      return;
    }

    // DEBUG: Log treatments before sending to API service
    console.log('🎯 [FORM] Treatments before createMultipleRecordData:', treatments.map((t, index) => {
      console.log(`Treatment ${index} full object:`, t);
      console.log(`Treatment ${index} keys:`, Object.keys(t));
      console.log(`Treatment ${index} treatment_id:`, t.treatment_id, typeof t.treatment_id);
      return {
        treatment_id: t.treatment_id,
        nombre_tratamiento: t.nombre_tratamiento,
        precio_promocional: t.precio_promocional,
        costo_unitario: t.costo_unitario,
        hasRequiredFields: !!(t.treatment_id && t.precio_promocional && t.costo_unitario)
      };
    }));

    const mappedTreatments = treatments.map((t, index) => {
      const mapped = {
        treatment_id: t.treatment_id,
        nombre_tratamiento: t.nombre_tratamiento,
        precio_normal: t.precio_normal,
        precio_promocional: t.precio_promocional,
        costo_unitario: t.costo_unitario,
        ganancia_individual: t.ganancia_individual,
        orden: t.orden
      };
      console.log(`🔄 [FORM] Mapped treatment ${index}:`, mapped);
      return mapped;
    });

    const recordData = ApiService.createMultipleRecordData(
      patientId,
      fecha + "T00:00:00",
      metodoPago,
      nombrePromocion,
      mappedTreatments,
      metodoPago === "tarjeta_credito" ? {
        tipoTarjeta: creditCardInfo?.tipo_tarjeta,
        mesesSinIntereses: creditCardInfo?.meses_sin_intereses,
        tasaComision: creditCardInfo?.tasa_comision
      } : undefined,
      notas
    );

    console.log('FormData before transformation:', {
      treatments: treatments.map(t => ({
        treatment_id: t.treatment_id,
        nombre_tratamiento: t.nombre_tratamiento,
        precio_promocional: t.precio_promocional,
        costo_unitario: t.costo_unitario
      }))
    });
    
    console.log('RecordData after transformation:', recordData);
    
    // Additional validation log
    console.log('🔍 [FORM] Final validation check:', {
      hasNombrePromocion: !!nombrePromocion.trim(),
      allTreatmentsComplete: treatments.every(t => t.nombre_tratamiento.trim() && t.precio_promocional > 0),
      allTreatmentsHaveId: treatments.every(t => !!t.treatment_id),
      creditCardValidation: metodoPago !== "tarjeta_credito" || !!creditCardInfo.tipo_tarjeta
    });

    onSubmit(recordData);
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Registro de Múltiples Tratamientos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fecha">Fecha del Tratamiento</Label>
              <Input
                id="fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="nombrePromocion">Nombre de la Promoción</Label>
              <Input
                id="nombrePromocion"
                placeholder="ej: Promo Junio: Alma + Duraform"
                value={nombrePromocion}
                onChange={(e) => setNombrePromocion(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Payment Method */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Método de Pago</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="metodoPago">Método de Pago</Label>
                <Select value={metodoPago} onValueChange={setMetodoPago}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar método de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="tarjeta_credito">Tarjeta de Crédito</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Credit Card Information - Only show when payment method is credit card */}
            {metodoPago === "tarjeta_credito" && (
              <Card className="border-blue-200 bg-blue-50 mt-4">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <CreditCard className="w-5 h-5" />
                    Información de Tarjeta de Crédito
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Tipo de Tarjeta</Label>
                      <Select 
                        value={creditCardInfo.tipo_tarjeta || ""} 
                        onValueChange={(value) => {
                          console.log("🔄 Seleccionando tarjeta:", value);
                          updateCreditCardCommission(value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo de tarjeta..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bbva">BBVA - 3.5%</SelectItem>
                          <SelectItem value="banamex">Banamex - 1.5%</SelectItem>
                          <SelectItem value="amex">American Express - 2.65%</SelectItem>
                          <SelectItem value="openpay">OpenPay - 3.364%</SelectItem>
                          <SelectItem value="otros">Otros - 3.0%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Meses Sin Intereses</Label>
                      <Select 
                        value={creditCardInfo.meses_sin_intereses?.toString() || "0"} 
                        onValueChange={(value) => {
                          const meses = parseInt(value);
                          console.log("📅 Cambiando meses sin intereses a:", meses);
                          updateMesesSinIntereses(meses);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="0 meses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0 meses (pago único)</SelectItem>
                          <SelectItem value="3">3 meses</SelectItem>
                          <SelectItem value="6">6 meses</SelectItem>
                          <SelectItem value="9">9 meses</SelectItem>
                          <SelectItem value="12">12 meses</SelectItem>
                          <SelectItem value="24">24 meses</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Tasa de Comisión (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={creditCardInfo.tasa_comision || ''}
                        readOnly
                        className="bg-gray-100"
                        placeholder="Se calcula automáticamente"
                      />
                      {creditCardInfo.tipo_tarjeta && creditCardInfo.meses_sin_intereses !== undefined && (
                        <div className="text-xs text-blue-600 mt-1">
                          {creditCardInfo.tipo_tarjeta.toUpperCase()} - {creditCardInfo.meses_sin_intereses} meses: {creditCardInfo.tasa_comision}%
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Commission Calculator */}
                  {creditCardInfo.tasa_comision && (
                    <Alert>
                      <Calculator className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <div>Comisión: {ApiService.formatCurrency(totals.comisionMonto)} ({creditCardInfo.tasa_comision}%)</div>
                          <div>Monto neto: {ApiService.formatCurrency(totals.montoNeto)}</div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <Separator />

          {/* Treatments */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Tratamientos</h3>
              <Button onClick={addTreatment} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Tratamiento
              </Button>
            </div>

            {treatments.map((treatment, index) => (
              <Card key={index} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Tratamiento {index + 1}</h4>
                    {treatments.length > 1 && (
                      <Button
                        onClick={() => removeTreatment(index)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="md:col-span-2">
                      <Label>Del Catálogo</Label>
                      <Select onValueChange={(value) => selectTreatmentFromCatalog(index, value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>                        <SelectContent className="max-h-60 overflow-y-auto">
                          {availableTreatments.map((t) => (
                            <SelectItem key={t.id} value={t.id.toString()}>
                              {t.nombre} - {ApiService.formatCurrency(t.precio)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="md:col-span-3 lg:col-span-3">
                      <Label>Nombre Personalizado</Label>
                      <Input
                        placeholder="Nombre del tratamiento"
                        value={treatment.nombre_tratamiento}
                        onChange={(e) => updateTreatment(index, 'nombre_tratamiento', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <Label>Precio Normal</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={treatment.precio_normal}
                        onChange={(e) => updateTreatment(index, 'precio_normal', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>Precio Promocional</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={treatment.precio_promocional}
                        onChange={(e) => updateTreatment(index, 'precio_promocional', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>Costo Unitario</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={treatment.costo_unitario}
                        onChange={(e) => updateTreatment(index, 'costo_unitario', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>Ganancia</Label>
                      <div className="flex items-center h-10 px-3 border rounded-md bg-gray-50">
                        <span className={`font-medium ${treatment.ganancia_individual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {ApiService.formatCurrency(treatment.ganancia_individual)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator />

          {/* Summary */}
          <Card className={nombrePromocion.trim() ? "border-purple-200 bg-purple-50" : "border-green-200 bg-green-50"}>
            <CardHeader className="pb-3">
              <CardTitle className={`flex items-center gap-2 ${nombrePromocion.trim() ? "text-purple-700" : "text-green-700"}`}>
                {nombrePromocion.trim() ? (
                  <>
                    <Package className="w-5 h-5" />
                    📦 Paquete Promocional: {nombrePromocion}
                  </>
                ) : (
                  <>
                    <DollarSign className="w-5 h-5" />
                    Resumen Financiero
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Precio Normal</div>
                  <div className="text-lg font-bold text-gray-900">
                    {ApiService.formatCurrency(totals.totalPrecioNormal)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Precio Promocional</div>
                  <div className="text-lg font-bold text-blue-600">
                    {ApiService.formatCurrency(totals.totalPrecioPromocional)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Ahorro Cliente</div>
                  <div className="text-lg font-bold text-orange-600">
                    {ApiService.formatCurrency(totals.totalAhorro)}
                  </div>
                  <div className="text-xs text-gray-500">
                    ({((totals.totalAhorro / totals.totalPrecioNormal) * 100).toFixed(1)}%)
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Ganancia Total</div>
                  <div className={`text-lg font-bold ${totals.gananciaTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {ApiService.formatCurrency(totals.gananciaTotal)}
                  </div>
                </div>
              </div>

              {totals.comisionMonto > 0 && (
                <div className="mt-4 pt-4 border-t border-green-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span>Comisión Tarjeta:</span>
                      <span className="text-red-600">-{ApiService.formatCurrency(totals.comisionMonto)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monto Neto:</span>
                      <span className="font-medium">{ApiService.formatCurrency(totals.montoNeto)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <div>
            <Label htmlFor="notas">Notas Adicionales</Label>
            <Input
              id="notas"
              placeholder="Observaciones sobre el tratamiento o promoción..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading ? "Guardando..." : "Guardar Registro"}
            </Button>
            <Button onClick={onCancel} variant="outline">
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}