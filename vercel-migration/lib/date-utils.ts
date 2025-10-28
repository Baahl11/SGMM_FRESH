/**
 * Utilidades para manejo de fechas
 */

/**
 * Valida si una fecha es válida
 */
export function isValidDate(date: any): boolean {
  if (!date) return false;
  if (date === 'null' || date === null || date === undefined) return false;
  
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime());
}

/**
 * Formatea una fecha de forma segura
 */
export function formatDate(date: any, fallback: string = 'No especificado'): string {
  if (!isValidDate(date)) {
    return fallback;
  }
  
  try {
    return new Date(date).toLocaleDateString();
  } catch (error) {
    console.warn('Error formatting date:', date, error);
    return fallback;
  }
}

/**
 * Formatea una fecha para input HTML (YYYY-MM-DD)
 */
export function formatDateForInput(date: any, fallback: string = ''): string {
  if (!isValidDate(date)) {
    return fallback;
  }
  
  try {
    const dateObj = new Date(date);
    return dateObj.toISOString().split('T')[0];
  } catch (error) {
    console.warn('Error formatting date for input:', date, error);
    return fallback;
  }
}

/**
 * Convierte una fecha a formato ISO para el backend
 */
export function formatDateForBackend(date: any): string | null {
  if (!isValidDate(date)) {
    return null;
  }
  
  try {
    return new Date(date).toISOString();
  } catch (error) {
    console.warn('Error formatting date for backend:', date, error);
    return null;
  }
}
