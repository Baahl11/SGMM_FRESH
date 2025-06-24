from datetime import date, datetime
from typing import List, Optional
from sqlmodel import Field, SQLModel, Relationship, JSON, Column
from enum import Enum

class NotificationType(str, Enum):
    EMAIL = "email"
    WHATSAPP = "whatsapp"

class NotificationStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    is_active: bool = Field(default=True)
    is_superuser: bool = Field(default=False)

class Patient(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str
    fecha_nacimiento: date
    telefono: str
    email: Optional[str] = None
    direccion: Optional[str] = None
    requiere_factura: bool = Field(default=False)
    fotos: List[str] = Field(default=[], sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    records: List["Record"] = Relationship(back_populates="patient")

class Treatment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str
    costo_unitario: float
    precio: float
    descripcion: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    records: List["Record"] = Relationship(back_populates="treatment")

class Record(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)    
    patient_id: int = Field(foreign_key="patient.id")
    treatment_id: Optional[int] = Field(default=None, foreign_key="treatment.id")  # Ahora opcional para múltiples tratamientos
    fecha: datetime = Field(default_factory=datetime.utcnow)
    
    # Información del tratamiento único (legacy) o múltiple
    monto_pagado: float
    monto_neto: float
    costo_unitario: float
    ganancia: float
    
    # Campos para múltiples tratamientos
    nombre_promocion: Optional[str] = None  # Nombre de la promoción/paquete
    precio_normal_total: Optional[float] = None  # Precio normal total sin promoción
    ahorro_total: Optional[float] = None  # Ahorro obtenido con la promoción
    tiene_multiples_tratamientos: bool = Field(default=False)  # Flag para identificar
    
    # Información de pago
    metodo_pago: str  # "efectivo", "tarjeta_credito", "tarjeta_debito", "transferencia"
    
    # Información específica de tarjetas de crédito
    tipo_tarjeta: Optional[str] = None  # "bbva", "openpay", "santander", "banamex"
    meses_sin_intereses: Optional[int] = None  # 0, 3, 6, 9, 12, 18, 24
    tasa_comision: Optional[float] = None  # Porcentaje de comisión (ej: 3.5)
    comision_monto: Optional[float] = None  # Monto en pesos de la comisión
    numero_autorizacion: Optional[str] = None  # Número de autorización del banco
    ultimos_4_digitos: Optional[str] = None  # Últimos 4 dígitos de la tarjeta
    
    notas: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    patient: Patient = Relationship(back_populates="records")
    treatment: Optional[Treatment] = Relationship(back_populates="records")
    record_treatments: List["RecordTreatment"] = Relationship(back_populates="record")

class RecordTreatment(SQLModel, table=True):
    """Tabla para manejar múltiples tratamientos por registro"""
    id: Optional[int] = Field(default=None, primary_key=True)
    record_id: int = Field(foreign_key="record.id")
    treatment_id: Optional[int] = Field(default=None, foreign_key="treatment.id")  # Puede ser None para tratamientos personalizados
    
    # Información del tratamiento
    nombre_tratamiento: str  # Nombre del tratamiento (puede ser diferente al catálogo)
    precio_normal: float  # Precio normal individual
    precio_promocional: float  # Precio con promoción individual
    costo_unitario: float  # Costo individual
    ganancia_individual: float  # Ganancia de este tratamiento específico
    orden: int = Field(default=1)  # Orden de aplicación
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    record: Record = Relationship(back_populates="record_treatments")
    treatment: Optional[Treatment] = Relationship()

class GastoFijo(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    concepto: str  # Descripción del gasto (ej: "Renta", "Luz", "Internet")
    monto: float
    frecuencia: str = Field(default="mensual")  # "mensual", "anual", "trimestral"
    fecha_inicio: date
    activo: bool = Field(default=True)
    notas: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class NotificationConfig(SQLModel, table=True):
    """Configuración de notificaciones del sistema"""
    id: Optional[int] = Field(default=None, primary_key=True)
    email_enabled: bool = Field(default=False)
    whatsapp_enabled: bool = Field(default=False)
    email_advance_hours: int = Field(default=24)
    whatsapp_advance_hours: int = Field(default=2)
    email_template: str = Field(default="Estimado/a {nombre_paciente}, le recordamos que tiene una cita médica programada para el {fecha_cita} a las {hora_cita}. Consultorio UME López & López.")
    whatsapp_template: str = Field(default="Hola {nombre_paciente}! 👋 Recordatorio: Tienes cita médica el {fecha_cita} a las {hora_cita}. Te esperamos en UME López & López 🏥")
    sendgrid_api_key: Optional[str] = None
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_phone_number: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Appointment(SQLModel, table=True):
    """Tabla para almacenar citas médicas"""
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(foreign_key="patient.id")
    appointment_date: datetime
    appointment_time: str  # Hora en formato HH:MM
    duration_minutes: int = Field(default=60)
    treatment_name: Optional[str] = None
    notes: Optional[str] = None
    status: str = Field(default="scheduled")  # "scheduled", "completed", "cancelled", "no_show"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    patient: Patient = Relationship()
    notifications: List["NotificationLog"] = Relationship(back_populates="appointment")

class NotificationLog(SQLModel, table=True):
    """Log de notificaciones enviadas"""
    id: Optional[int] = Field(default=None, primary_key=True)
    appointment_id: int = Field(foreign_key="appointment.id")
    notification_type: NotificationType
    status: NotificationStatus = Field(default=NotificationStatus.PENDING)
    scheduled_for: datetime
    sent_at: Optional[datetime] = None
    error_message: Optional[str] = None
    message_content: Optional[str] = None  # El mensaje final enviado
    external_id: Optional[str] = None  # ID del proveedor externo (SendGrid, Twilio)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    appointment: Appointment = Relationship(back_populates="notifications")

class InventoryStatus(str, Enum):
    """Estados del inventario basados en niveles de stock"""
    HIGH = "high"      # Verde: Stock alto (>75% del máximo)
    MEDIUM = "medium"  # Amarillo: Stock medio (25-75% del máximo)
    LOW = "low"        # Rojo: Stock bajo (<25% del máximo)
    OUT = "out"        # Stock agotado (0)

class InventoryItem(SQLModel, table=True):
    """Items de inventario/consumibles"""
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(index=True)
    descripcion: Optional[str] = None
    unidad_medida: str = Field(default="piezas")  # piezas, ml, gramos, etc.
    stock_actual: int = Field(default=0)
    stock_minimo: int = Field(default=10)  # Alerta cuando esté por debajo
    stock_maximo: int = Field(default=100)
    costo_unitario: float = Field(default=0.0)
    proveedor: Optional[str] = None
    codigo_producto: Optional[str] = None
    fecha_vencimiento: Optional[date] = None
    ubicacion: Optional[str] = None  # Dónde está almacenado
    activo: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    movements: List["InventoryMovement"] = Relationship(back_populates="item")
    treatment_items: List["TreatmentInventoryItem"] = Relationship(back_populates="inventory_item")

class InventoryMovement(SQLModel, table=True):
    """Movimientos de inventario (entradas y salidas)"""
    id: Optional[int] = Field(default=None, primary_key=True)
    item_id: int = Field(foreign_key="inventoryitem.id")
    tipo: str = Field(index=True)  # "entrada", "salida", "ajuste", "uso_tratamiento"
    cantidad: int
    cantidad_anterior: int
    cantidad_nueva: int
    motivo: Optional[str] = None
    referencia_id: Optional[int] = None  # ID del record si es por tratamiento
    usuario_id: Optional[int] = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    item: InventoryItem = Relationship(back_populates="movements")

class TreatmentInventoryItem(SQLModel, table=True):
    """Relación entre tratamientos e items de inventario"""
    id: Optional[int] = Field(default=None, primary_key=True)
    treatment_id: int = Field(foreign_key="treatment.id")
    inventory_item_id: int = Field(foreign_key="inventoryitem.id")
    cantidad_requerida: int = Field(default=1)  # Cantidad que consume el tratamiento
    
    # Relationships
    treatment: Treatment = Relationship()
    inventory_item: InventoryItem = Relationship(back_populates="treatment_items")
