import AuthService from './auth-service';

const API_URL = "/api";

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiService {
  private static getAuthHeaders() {
    const token = AuthService.getToken();
    return {
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` })
    };
  }

  private static async fetchWithAuth(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = AuthService.getToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    const headers = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      AuthService.logout();
      throw new Error("Session expired");
    }

    return response;
  }
  // Patients
  static async getPatients(search?: string): Promise<ApiResponse<any[]>> {
    try {
      const url = search ? `/patients/?search=${encodeURIComponent(search)}` : "/patients/";
      const response = await this.fetchWithAuth(url);
      if (!response.ok) throw new Error("Failed to fetch patients");
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  static async getPatient(id: number): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithAuth(`/patients/${id}`);
      if (!response.ok) throw new Error("Failed to fetch patient");
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  static async createPatient(patientData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithAuth("/patients/", {
        method: "POST",
        body: JSON.stringify(patientData),
      });
      if (!response.ok) throw new Error("Failed to create patient");
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  static async updatePatient(id: number, patientData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithAuth(`/patients/${id}`, {
        method: "PUT",
        body: JSON.stringify(patientData),
      });
      if (!response.ok) throw new Error("Failed to update patient");
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  static async deletePatient(id: number): Promise<ApiResponse<void>> {
    try {
      const response = await this.fetchWithAuth(`/patients/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete patient");
      return {};
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }
  // Patient Images
  static async uploadPatientImage(patientId: number, file: File): Promise<ApiResponse<any>> {
    try {
      const token = AuthService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const formData = new FormData();
      formData.append('file', file);

      console.log(`Uploading image for patient ${patientId}:`, file.name, file.size, file.type);

      const response = await fetch(`${API_URL}/patients/${patientId}/upload-image`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.detail) {
            errorMessage = errorData.detail;
          }
        } catch {
          // If can't parse as JSON, use the text as is
          if (errorText) {
            errorMessage = errorText;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Upload successful:', data);
      return { data };
    } catch (error) {
      console.error('Upload error:', error);
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  static async getPatientImages(patientId: number): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithAuth(`/patients/${patientId}/images`);
      if (!response.ok) throw new Error("Failed to fetch patient images");
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }  static async deletePatientImage(patientId: number, imageName: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.fetchWithAuth(`/patients/${patientId}/images/${encodeURIComponent(imageName)}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete image");
      return {};
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  // Helper method to convert file paths to URLs
  static getImageUrl(filePath: string): string {
    // Convert file path to URL by replacing backslashes and prepending API URL
    const normalizedPath = filePath.replace(/\\/g, '/');
    return `${API_URL}/${normalizedPath}`;
  }  // Treatments
  static async getTreatments(): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.fetchWithAuth("/treatments/");
      if (!response.ok) throw new Error("Failed to fetch treatments");
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  static async getTreatment(id: number): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithAuth(`/treatments/${id}`);
      if (!response.ok) throw new Error("Failed to fetch treatment");
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }  static async createTreatment(treatmentData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithAuth("/treatments/", {
        method: "POST",
        body: JSON.stringify(treatmentData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to create treatment" }));
        throw new Error(errorData.error || "Failed to create treatment");
      }
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }  static async updateTreatment(id: number, treatmentData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithAuth(`/treatments/${id}`, {
        method: "PUT",
        body: JSON.stringify(treatmentData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to update treatment" }));
        throw new Error(errorData.error || "Failed to update treatment");
      }
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }  static async deleteTreatment(id: number): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithAuth(`/treatments/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to delete treatment" }));
        return { error: errorData.detail || errorData.error || "Failed to delete treatment" };
      }
      return { data: { success: true } };
    } catch (error) {
      console.error("Error deleting treatment:", error);
      return { error: error instanceof Error ? error.message : "Failed to delete treatment" };
    }
  }

  // Records
  static async getRecords(patientId?: number): Promise<ApiResponse<any[]>> {
    try {
      const queryParams = patientId ? `?patient_id=${patientId}` : '';
      const token = AuthService.getToken();
      const headers: any = {};
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/records${queryParams}`, {
        headers
      });
      if (!response.ok) throw new Error("Failed to fetch records");
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }static async getRecordsWithNames(patientId?: number): Promise<ApiResponse<any[]>> {
    try {
      const endpoint = patientId ? `/records/with-names/?patient_id=${patientId}` : "/records/with-names/";
      const response = await this.fetchWithAuth(endpoint);
      if (!response.ok) throw new Error("Failed to fetch records with names");
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }
  static async getRecord(id: number): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`/api/records/${id}`);
      if (!response.ok) throw new Error("Failed to fetch record");
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }  static async createRecord(recordData: any): Promise<ApiResponse<any>> {
    try {
      // Convertir datos del frontend al formato esperado por el backend
      const backendData = {
        patient_id: parseInt(recordData.patient_id.toString()),
        treatment_id: parseInt(recordData.treatment_id.toString()),
        fecha: recordData.fecha.includes('T') ? recordData.fecha : `${recordData.fecha}T00:00:00`,
        monto_pagado: parseFloat(recordData.monto_pagado.toString()),
        monto_neto: parseFloat(recordData.monto_neto.toString()),
        costo_unitario: parseFloat(recordData.costo_unitario.toString()),
        ganancia: parseFloat(recordData.ganancia.toString()),
        metodo_pago: recordData.metodo_pago,
        tipo_tarjeta: recordData.tipo_tarjeta || null,
        meses_sin_intereses: recordData.meses_sin_intereses ? parseInt(recordData.meses_sin_intereses.toString()) : null,
        tasa_comision: recordData.tasa_comision ? parseFloat(recordData.tasa_comision.toString()) : null,
        comision_monto: recordData.comision_monto ? parseFloat(recordData.comision_monto.toString()) : null,
        notas: recordData.notas || null
      };      console.log('Sending record data to API:', backendData);

      // Obtener token para enviarlo en headers
      const token = AuthService.getToken();
      console.log('Token available:', !!token);
      console.log('Token preview:', token ? `${token.substring(0, 20)}...` : 'No token');
      
      const headers: any = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      console.log('Request headers:', headers);

      // Usar la ruta API de Next.js con token en headers
      const response = await fetch("/api/records", {
        method: "POST",
        headers,
        body: JSON.stringify(backendData),
      });      if (!response.ok) {
        console.error('Response not OK:', response.status, response.statusText);
        
        let errorData;
        try {
          const text = await response.text();
          console.log('Raw response text:', text);
          
          if (text) {
            try {
              errorData = JSON.parse(text);
            } catch {
              errorData = { error: text };
            }
          } else {
            errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
          }
        } catch (readError) {
          console.error('Error reading response:', readError);
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        console.error('API error details:', errorData);
        
        if (response.status === 422 && errorData.detail) {
          // Error de validación - formatear los detalles
          const validationErrors = Array.isArray(errorData.detail) 
            ? errorData.detail.map((err: any) => `${err.loc?.[1] || err.loc?.[0]}: ${err.msg}`).join(', ')
            : errorData.detail;
          throw new Error(validationErrors);
        }
        
        throw new Error(errorData.error || errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }
  static async updateRecord(id: number, recordData: any): Promise<ApiResponse<any>> {
    try {
      // Convertir datos del frontend al formato esperado por el backend
      const backendData = {
        patient_id: parseInt(recordData.patient_id.toString()),
        treatment_id: parseInt(recordData.treatment_id.toString()),
        fecha: recordData.fecha.includes('T') ? recordData.fecha : `${recordData.fecha}T00:00:00`,
        monto_pagado: parseFloat(recordData.monto_pagado.toString()),
        monto_neto: parseFloat(recordData.monto_neto.toString()),
        costo_unitario: parseFloat(recordData.costo_unitario.toString()),
        ganancia: parseFloat(recordData.ganancia.toString()),
        metodo_pago: recordData.metodo_pago,
        tipo_tarjeta: recordData.tipo_tarjeta || null,
        meses_sin_intereses: recordData.meses_sin_intereses ? parseInt(recordData.meses_sin_intereses.toString()) : null,
        tasa_comision: recordData.tasa_comision ? parseFloat(recordData.tasa_comision.toString()) : null,
        comision_monto: recordData.comision_monto ? parseFloat(recordData.comision_monto.toString()) : null,
        notas: recordData.notas || null
      };      const response = await fetch(`/api/records/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(backendData),
      });
      if (!response.ok) throw new Error("Failed to update record");
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  static async deleteRecord(id: number): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`/api/records/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete record");
      return { data: undefined };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  // Gastos Fijos
  static async getGastosFijos(): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.fetchWithAuth("/gastos-fijos/");
      if (!response.ok) throw new Error("Failed to fetch gastos fijos");
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  static async getGastoFijo(id: number): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithAuth(`/gastos-fijos/${id}`);
      if (!response.ok) throw new Error("Failed to fetch gasto fijo");
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  static async createGastoFijo(gastoFijoData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithAuth("/gastos-fijos/", {
        method: "POST",
        body: JSON.stringify(gastoFijoData),
      });
      if (!response.ok) throw new Error("Failed to create gasto fijo");
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  static async updateGastoFijo(id: number, gastoFijoData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithAuth(`/gastos-fijos/${id}`, {
        method: "PUT",
        body: JSON.stringify(gastoFijoData),
      });
      if (!response.ok) throw new Error("Failed to update gasto fijo");
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  static async deleteGastoFijo(id: number): Promise<ApiResponse<void>> {
    try {
      const response = await this.fetchWithAuth(`/gastos-fijos/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete gasto fijo");
      return { data: undefined };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  // 🎉 NUEVAS FUNCIONES PARA MÚLTIPLES TRATAMIENTOS Y TARJETAS DE CRÉDITO

  // Crear registro con múltiples tratamientos
  static async createMultipleRecord(recordData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithAuth("/records/multiple/", {
        method: "POST",
        body: JSON.stringify(recordData),
      });
      if (!response.ok) throw new Error("Failed to create multiple record");
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  // Obtener registro con tratamientos múltiples
  static async getRecordWithTreatments(recordId: number): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithAuth(`/records/${recordId}/with-treatments/`);
      if (!response.ok) throw new Error("Failed to fetch record with treatments");
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  // Actualizar registro con múltiples tratamientos
  static async updateRecordWithTreatments(recordId: number, recordData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithAuth(`/records/${recordId}/with-treatments/`, {
        method: "PUT",
        body: JSON.stringify(recordData),
      });
      if (!response.ok) throw new Error("Failed to update record with treatments");
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  // Obtener registros mejorados con nombres y múltiples tratamientos
  static async getRecordsEnhanced(skip: number = 0, limit: number = 100, patientId?: number): Promise<ApiResponse<any[]>> {
    try {
      let endpoint = `/records/enhanced/with-names/?skip=${skip}&limit=${limit}`;
      if (patientId) {
        endpoint += `&patient_id=${patientId}`;
      }
      
      const response = await this.fetchWithAuth(endpoint);
      if (!response.ok) throw new Error("Failed to fetch enhanced records");
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  // Obtener opciones de tarjetas de crédito
  static async getCreditCardOptions(): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithAuth("/payment-methods/credit-cards/");
      if (!response.ok) throw new Error("Failed to fetch credit card options");
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  // Calcular comisión de tarjeta de crédito
  static async calculateCommission(amount: number, commissionRate: number): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithAuth("/payment-methods/calculate-commission/", {
        method: "POST",
        body: JSON.stringify({
          amount,
          commission_rate: commissionRate
        }),
      });
      if (!response.ok) throw new Error("Failed to calculate commission");
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  // Payment Helper Functions
  static getPaymentMethodDisplayName(method: string): string {
    const methods: { [key: string]: string } = {
      'efectivo': 'Efectivo',
      'tarjeta_credito': 'Tarjeta de Crédito',
      'tarjeta_debito': 'Tarjeta de Débito',
      'transferencia': 'Transferencia'
    };
    return methods[method] || method;
  }

  static getCreditCardDisplayName(cardType: string): string {
    const cards: { [key: string]: string } = {
      'bbva': 'BBVA',
      'openpay': 'OpenPay',
      'santander': 'Santander',
      'banamex': 'Banamex'
    };
    return cards[cardType] || cardType;
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  }

  static formatCardNumber(cardNumber: string): string {
    // Format as ****-****-****-1234
    return `****-****-****-${cardNumber}`;
  }

  // Helper para crear datos de múltiples tratamientos
  static createMultipleRecordData(
    patientId: number,
    fecha: string,
    metodoPago: string,
    nombrePromocion: string,
    tratamientos: any[],
    creditCardInfo?: {
      tipoTarjeta?: string;
      mesesSinIntereses?: number;
      tasaComision?: number;
      numeroAutorizacion?: string;
      ultimos4Digitos?: string;
    },
    notas?: string  ) {
    return {
      patient_id: patientId,
      fecha,
      metodo_pago: metodoPago,
      nombre_promocion: nombrePromocion,
      tratamientos,
      tipo_tarjeta: creditCardInfo?.tipoTarjeta,
      meses_sin_intereses: creditCardInfo?.mesesSinIntereses,
      tasa_comision: creditCardInfo?.tasaComision,
      numero_autorizacion: creditCardInfo?.numeroAutorizacion,
      ultimos_4_digitos: creditCardInfo?.ultimos4Digitos,
      notas
    };
  }
  // Combined methods for specific workflows
  static async createPatientWithTreatment(data: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithAuth("/patients/with-treatment", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create patient with treatment");
      }
      const responseData = await response.json();
      return { data: responseData };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }
  static async createMultipleTreatmentRecord(patientId: number, data: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithAuth(`/records/multiple`, {
        method: "POST",
        body: JSON.stringify({ 
          patient_id: patientId,
          ...data 
        }),      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create multiple treatment record");
      }
      const responseData = await response.json();
      return { data: responseData };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  // Dashboard estadísticas completas
  static async getDashboardStats(): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithAuth("/dashboard/stats/");
      if (!response.ok) throw new Error("Failed to fetch dashboard stats");
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }
}

export default ApiService;
