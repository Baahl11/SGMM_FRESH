/**
 * Common types for messaging adapters
 */

export interface SendMessageRequest {
  to: string;
  message: string;
  from?: string;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
  rawResponse?: any;
  /**
   * Codigo de estado HTTP devuelto por el proveedor. Su ausencia en un
   * resultado fallido significa que nunca se recibio una respuesta HTTP
   * (fallo de red/transporte), lo cual es reintentable y no debe traducirse
   * a un 4xx hacia el llamador. Opcional: los adaptadores que no lo publican
   * (Twilio/MessageBird/Plivo) simplemente lo dejan sin definir.
   */
  httpStatus?: number;
}

export interface MessagingAdapter {
  send(request: SendMessageRequest): Promise<SendMessageResult>;
  validateCredentials(credentials: any): boolean;
  getProviderName(): string;
}

export interface ProviderCredentials {
  [key: string]: string;
}
