from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr

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
    pass

class TreatmentUpdate(TreatmentBase):
    pass

class TreatmentRead(TreatmentBase):
    id: int
    created_at: datetime
    updated_at: datetime

# Record schemas
class RecordBase(BaseModel):
    patient_id: int
    treatment_id: int
    fecha: datetime
    monto_pagado: float
    monto_neto: float
    notas: Optional[str] = None

class RecordCreate(RecordBase):
    pass

class RecordUpdate(RecordBase):
    pass

class RecordRead(RecordBase):
    id: int
    created_at: datetime

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None
