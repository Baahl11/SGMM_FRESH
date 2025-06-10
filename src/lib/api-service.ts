import AuthService from './auth-service';

const API_URL = "http://localhost:8000";

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiService {
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
  static async getPatients(): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.fetchWithAuth("/patients/");
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

  // Treatments
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

  static async createTreatment(treatmentData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithAuth("/treatments/", {
        method: "POST",
        body: JSON.stringify(treatmentData),
      });
      if (!response.ok) throw new Error("Failed to create treatment");
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  // Records
  static async getRecords(patientId?: number): Promise<ApiResponse<any[]>> {
    try {
      const endpoint = patientId ? `/records/?patient_id=${patientId}` : "/records/";
      const response = await this.fetchWithAuth(endpoint);
      if (!response.ok) throw new Error("Failed to fetch records");
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  static async createRecord(recordData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithAuth("/records/", {
        method: "POST",
        body: JSON.stringify(recordData),
      });
      if (!response.ok) throw new Error("Failed to create record");
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  static async updateRecord(id: number, recordData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithAuth(`/records/${id}`, {
        method: "PUT",
        body: JSON.stringify(recordData),
      });
      if (!response.ok) throw new Error("Failed to update record");
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }
}

export default ApiService;
