from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException, UploadFile
from sqlmodel import Session, select
from . import models, schemas
from .auth import get_password_hash

# User operations
def create_user(session: Session, user: schemas.UserCreate) -> models.User:
    """Create a new user."""
    db_user = models.User(
        email=user.email,
        hashed_password=get_password_hash(user.password)
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

# Patient operations
def create_patient(session: Session, patient: schemas.PatientCreate) -> models.Patient:
    """Create a new patient."""
    db_patient = models.Patient(**patient.dict())
    session.add(db_patient)
    session.commit()
    session.refresh(db_patient)
    return db_patient

def get_patient(session: Session, patient_id: int) -> Optional[models.Patient]:
    """Get a patient by ID."""
    patient = session.get(models.Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

def get_patients(
    session: Session, 
    skip: int = 0, 
    limit: int = 100
) -> List[models.Patient]:
    """Get all patients with pagination."""
    return session.exec(
        select(models.Patient).offset(skip).limit(limit)
    ).all()

def update_patient(
    session: Session, 
    patient_id: int, 
    patient_update: schemas.PatientUpdate
) -> models.Patient:
    """Update a patient."""
    db_patient = get_patient(session, patient_id)
    
    update_data = patient_update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    for key, value in update_data.items():
        setattr(db_patient, key, value)
    
    session.add(db_patient)
    session.commit()
    session.refresh(db_patient)
    return db_patient

def delete_patient(session: Session, patient_id: int) -> None:
    """Delete a patient."""
    patient = get_patient(session, patient_id)
    session.delete(patient)
    session.commit()

# Treatment operations
def create_treatment(
    session: Session, 
    treatment: schemas.TreatmentCreate
) -> models.Treatment:
    """Create a new treatment."""
    db_treatment = models.Treatment(**treatment.dict())
    session.add(db_treatment)
    session.commit()
    session.refresh(db_treatment)
    return db_treatment

def get_treatment(session: Session, treatment_id: int) -> models.Treatment:
    """Get a treatment by ID."""
    treatment = session.get(models.Treatment, treatment_id)
    if not treatment:
        raise HTTPException(status_code=404, detail="Treatment not found")
    return treatment

def get_treatments(
    session: Session, 
    skip: int = 0, 
    limit: int = 100
) -> List[models.Treatment]:
    """Get all treatments with pagination."""
    return session.exec(
        select(models.Treatment).offset(skip).limit(limit)
    ).all()

def update_treatment(
    session: Session,
    treatment_id: int,
    treatment_update: schemas.TreatmentUpdate
) -> models.Treatment:
    """Update a treatment."""
    db_treatment = get_treatment(session, treatment_id)
    
    update_data = treatment_update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    for key, value in update_data.items():
        setattr(db_treatment, key, value)
    
    session.add(db_treatment)
    session.commit()
    session.refresh(db_treatment)
    return db_treatment

def delete_treatment(session: Session, treatment_id: int) -> None:
    """Delete a treatment."""
    treatment = get_treatment(session, treatment_id)
    session.delete(treatment)
    session.commit()

# Record operations
def create_record(session: Session, record: schemas.RecordCreate) -> models.Record:
    """Create a new record."""
    # Verify that patient and treatment exist
    get_patient(session, record.patient_id)
    get_treatment(session, record.treatment_id)
    
    db_record = models.Record(**record.dict())
    session.add(db_record)
    session.commit()
    session.refresh(db_record)
    return db_record

def get_record(session: Session, record_id: int) -> models.Record:
    """Get a record by ID."""
    record = session.get(models.Record, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record

def get_records(
    session: Session,
    skip: int = 0,
    limit: int = 100,
    patient_id: Optional[int] = None
) -> List[models.Record]:
    """Get all records with optional patient filter and pagination."""
    query = select(models.Record)
    if patient_id:
        query = query.where(models.Record.patient_id == patient_id)
    return session.exec(query.offset(skip).limit(limit)).all()

def update_record(
    session: Session,
    record_id: int,
    record_update: schemas.RecordUpdate
) -> models.Record:
    """Update a record."""
    db_record = get_record(session, record_id)
    
    # Verify that patient and treatment exist if they're being updated
    if "patient_id" in record_update.dict(exclude_unset=True):
        get_patient(session, record_update.patient_id)
    if "treatment_id" in record_update.dict(exclude_unset=True):
        get_treatment(session, record_update.treatment_id)
    
    update_data = record_update.dict(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_record, key, value)
    
    session.add(db_record)
    session.commit()
    session.refresh(db_record)
    return db_record

def delete_record(session: Session, record_id: int) -> None:
    """Delete a record."""
    record = get_record(session, record_id)
    session.delete(record)
    session.commit()
