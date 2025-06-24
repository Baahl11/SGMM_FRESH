from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from .models import NotificationType, NotificationStatus, InventoryStatus

# User schemas
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: int
    is_active: bool
    is_superuser: bool

# Patient schemas
class PatientBase(BaseModel):
    nombre: str
    fecha_nacimiento: date
    telefono: str
    email: Optional[str] = None
    direccion: Optional[str] = None
    requiere_factura: bool = False

class PatientCreate(PatientBase):
    pass

class PatientUpdate(PatientBase):
    pass

class PatientRead(PatientBase):
    id: int
    fotos: List[str] = []
    created_at: datetime
    updated_at: datetime

# Treatment schemas
class TreatmentBase(BaseModel):
    nombre: str
    costo_unitario: float
    precio: float
    descripcion: Optional[str] = None

class TreatmentCreate(TreatmentBase):
    # Campos opcionales para crear automáticamente el item de inventario
    crear_inventario: bool = False
    stock_inicial: Optional[int] = None
    stock_minimo: Optional[int] = None
    stock_maximo: Optional[int] = None
    unidad_medida: Optional[str] = None
    proveedor: Optional[str] = None
    codigo_producto: Optional[str] = None
    ubicacion: Optional[str] = None

class TreatmentUpdate(TreatmentBase):
    pass

class TreatmentRead(TreatmentBase):
    id: int
    created_at: datetime
    updated_at: datetime

# Record Treatment schemas (para múltiples tratamientos)
class RecordTreatmentBase(BaseModel):
    treatment_id: Optional[int] = None
    nombre_tratamiento: str
    precio_normal: float
    precio_promocional: float
    costo_unitario: float
    ganancia_individual: float
    orden: int = 1

class RecordTreatmentCreate(RecordTreatmentBase):
    pass

class RecordTreatmentRead(RecordTreatmentBase):
    id: int
    record_id: int
    created_at: datetime

# Record schemas actualizados
class RecordBase(BaseModel):
    patient_id: int
    treatment_id: Optional[int] = None  # Ahora opcional para múltiples tratamientos
    fecha: datetime
    monto_pagado: float
    monto_neto: float
    costo_unitario: float
    ganancia: float
    
    # Campos para múltiples tratamientos
    nombre_promocion: Optional[str] = None
    precio_normal_total: Optional[float] = None
    ahorro_total: Optional[float] = None
    tiene_multiples_tratamientos: bool = False
    
    # Información de pago mejorada
    metodo_pago: str  # "efectivo", "tarjeta_credito", "tarjeta_debito", "transferencia"
    
    # Información específica de tarjetas de crédito
    tipo_tarjeta: Optional[str] = None  # "bbva", "openpay", "santander", "banamex"
    meses_sin_intereses: Optional[int] = None  # 0, 3, 6, 9, 12, 18, 24
    tasa_comision: Optional[float] = None  # Porcentaje de comisión
    comision_monto: Optional[float] = None  # Monto en pesos de la comisión
    numero_autorizacion: Optional[str] = None  # Número de autorización del banco
    ultimos_4_digitos: Optional[str] = None  # Últimos 4 dígitos de la tarjeta
    
    notas: Optional[str] = None

class RecordCreate(RecordBase):
    # Lista de tratamientos para registros múltiples
    tratamientos: Optional[List[RecordTreatmentCreate]] = None

class RecordUpdate(RecordBase):
    # Permitir actualización de tratamientos múltiples
    tratamientos: Optional[List[RecordTreatmentCreate]] = None

class RecordRead(RecordBase):
    id: int
    created_at: datetime
    # Incluir tratamientos múltiples en la respuesta
    record_treatments: Optional[List[RecordTreatmentRead]] = None

class RecordWithNames(RecordRead):
    """Record schema with patient and treatment names included"""
    patient_name: str
    treatment_name: Optional[str] = None  # Puede ser None para múltiples tratamientos

# Schema para crear registro con múltiples tratamientos
class MultipleRecordCreate(BaseModel):
    patient_id: int
    fecha: datetime
    metodo_pago: str
    
    # Información específica de tarjetas de crédito
    tipo_tarjeta: Optional[str] = None
    meses_sin_intereses: Optional[int] = None
    tasa_comision: Optional[float] = None
    numero_autorizacion: Optional[str] = None
    ultimos_4_digitos: Optional[str] = None
    
    # Información de la promoción
    nombre_promocion: str
    tratamientos: List[RecordTreatmentCreate]
    notas: Optional[str] = None

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None

# Gastos Fijos schemas
class GastoFijoBase(BaseModel):
    concepto: str
    monto: float
    frecuencia: str = "mensual"
    fecha_inicio: date
    activo: bool = True
    notas: Optional[str] = None

class GastoFijoCreate(GastoFijoBase):
    pass

class GastoFijoUpdate(BaseModel):
    concepto: Optional[str] = None
    monto: Optional[float] = None
    frecuencia: Optional[str] = None
    fecha_inicio: Optional[date] = None
    activo: Optional[bool] = None
    notas: Optional[str] = None

class GastoFijoRead(GastoFijoBase):
    id: int
    created_at: datetime
    updated_at: datetime

# Notification Configuration schemas
class NotificationConfigBase(BaseModel):
    email_enabled: bool = False
    whatsapp_enabled: bool = False
    email_advance_hours: int = 24
    whatsapp_advance_hours: int = 2
    email_template: str
    whatsapp_template: str
    sendgrid_api_key: Optional[str] = None
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_phone_number: Optional[str] = None

class NotificationConfigCreate(NotificationConfigBase):
    pass

class NotificationConfigUpdate(BaseModel):
    email_enabled: Optional[bool] = None
    whatsapp_enabled: Optional[bool] = None
    email_advance_hours: Optional[int] = None
    whatsapp_advance_hours: Optional[int] = None
    email_template: Optional[str] = None
    whatsapp_template: Optional[str] = None
    sendgrid_api_key: Optional[str] = None
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_phone_number: Optional[str] = None

class NotificationConfigRead(NotificationConfigBase):
    id: int
    updated_at: datetime

# Appointment schemas
class AppointmentBase(BaseModel):
    patient_id: int
    appointment_date: datetime
    appointment_time: str
    duration_minutes: int = 60
    treatment_name: Optional[str] = None
    notes: Optional[str] = None
    status: str = "scheduled"

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    patient_id: Optional[int] = None
    appointment_date: Optional[datetime] = None
    appointment_time: Optional[str] = None
    duration_minutes: Optional[int] = None
    treatment_name: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class AppointmentRead(AppointmentBase):
    id: int
    created_at: datetime
    updated_at: datetime

# Notification Log schemas
class NotificationLogBase(BaseModel):
    appointment_id: int
    notification_type: NotificationType
    status: NotificationStatus = NotificationStatus.PENDING
    scheduled_for: datetime
    sent_at: Optional[datetime] = None
    error_message: Optional[str] = None
    message_content: Optional[str] = None
    external_id: Optional[str] = None

class NotificationLogCreate(NotificationLogBase):
    pass

class NotificationLogUpdate(BaseModel):
    status: Optional[NotificationStatus] = None
    sent_at: Optional[datetime] = None
    error_message: Optional[str] = None
    external_id: Optional[str] = None

class NotificationLogRead(NotificationLogBase):
    id: int
    created_at: datetime
    patient_name: Optional[str] = None  # Para incluir el nombre del paciente en las respuestas

# Test notification schemas
class TestEmailRequest(BaseModel):
    template: str
    api_key: str

class TestWhatsAppRequest(BaseModel):
    template: str
    account_sid: str
    auth_token: str
    from_number: str

# Inventory schemas
class InventoryItemBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    unidad_medida: str = "piezas"
    stock_actual: int = 0
    stock_minimo: int = 10
    stock_maximo: int = 100
    costo_unitario: float = 0.0
    proveedor: Optional[str] = None
    codigo_producto: Optional[str] = None
    fecha_vencimiento: Optional[date] = None
    ubicacion: Optional[str] = None
    activo: bool = True

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    unidad_medida: Optional[str] = None
    stock_actual: Optional[int] = None
    stock_minimo: Optional[int] = None
    stock_maximo: Optional[int] = None
    costo_unitario: Optional[float] = None
    proveedor: Optional[str] = None
    codigo_producto: Optional[str] = None
    fecha_vencimiento: Optional[date] = None
    ubicacion: Optional[str] = None
    activo: Optional[bool] = None

class InventoryItemRead(InventoryItemBase):
    id: int
    status: str  # Calculado: "high", "medium", "low", "out"
    percentage: float  # Porcentaje de stock actual vs máximo
    created_at: datetime
    updated_at: datetime

class InventoryMovementBase(BaseModel):
    tipo: str  # "entrada", "salida", "ajuste", "uso_tratamiento"
    cantidad: int
    motivo: Optional[str] = None
    referencia_id: Optional[int] = None

class InventoryMovementCreate(InventoryMovementBase):
    item_id: int

class InventoryMovementRead(InventoryMovementBase):
    id: int
    item_id: int
    cantidad_anterior: int
    cantidad_nueva: int
    item_name: Optional[str] = None
    created_at: datetime

class TreatmentInventoryItemBase(BaseModel):
    treatment_id: int
    inventory_item_id: int
    cantidad_requerida: int = 1

class TreatmentInventoryItemCreate(TreatmentInventoryItemBase):
    pass

class TreatmentInventoryItemRead(TreatmentInventoryItemBase):
    id: int
    treatment_name: Optional[str] = None
    inventory_item_name: Optional[str] = None

class InventoryStockAdjustment(BaseModel):
    item_id: int
    new_stock: int
    motivo: str

class InventoryHealthStatus(BaseModel):
    """Status general del inventario"""
    total_items: int
    high_stock: int
    medium_stock: int
    low_stock: int
    out_of_stock: int
    overall_status: str  # "good", "warning", "critical"
    critical_items: List[InventoryItemRead]
    low_items: List[InventoryItemRead]
