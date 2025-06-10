from datetime import date, datetime
from typing import List, Optional
from sqlmodel import Field, SQLModel, Relationship, JSON, Column

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
    treatment_id: int = Field(foreign_key="treatment.id")
    fecha: datetime = Field(default_factory=datetime.utcnow)
    monto_pagado: float
    monto_neto: float
    notas: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    patient: Patient = Relationship(back_populates="records")
    treatment: Treatment = Relationship(back_populates="records")
