from datetime import timedelta
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session

from . import crud, models, schemas
from .auth import (
    authenticate_user,
    create_access_token,
    get_current_active_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from .database import get_session, create_db_and_tables

app = FastAPI(title="Consultorio Médico API")

# CORS configuration
origins = [
    "http://localhost:3000",  # Next.js development server
    "http://localhost:8000",  # FastAPI development server
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables on startup
@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# Authentication endpoints
@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session)
):
    user = authenticate_user(form_data.username, form_data.password, session)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Patient endpoints
@app.post("/patients/", response_model=schemas.PatientRead)
def create_patient(
    patient: schemas.PatientCreate,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.create_patient(session=session, patient=patient)

@app.get("/patients/", response_model=List[schemas.PatientRead])
def read_patients(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.get_patients(session=session, skip=skip, limit=limit)

@app.get("/patients/{patient_id}", response_model=schemas.PatientRead)
def read_patient(
    patient_id: int,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.get_patient(session=session, patient_id=patient_id)

@app.put("/patients/{patient_id}", response_model=schemas.PatientRead)
def update_patient(
    patient_id: int,
    patient: schemas.PatientUpdate,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.update_patient(
        session=session,
        patient_id=patient_id,
        patient_update=patient
    )

@app.delete("/patients/{patient_id}")
def delete_patient(
    patient_id: int,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    crud.delete_patient(session=session, patient_id=patient_id)
    return {"message": "Patient deleted successfully"}

# Treatment endpoints
@app.post("/treatments/", response_model=schemas.TreatmentRead)
def create_treatment(
    treatment: schemas.TreatmentCreate,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.create_treatment(session=session, treatment=treatment)

@app.get("/treatments/", response_model=List[schemas.TreatmentRead])
def read_treatments(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.get_treatments(session=session, skip=skip, limit=limit)

@app.get("/treatments/{treatment_id}", response_model=schemas.TreatmentRead)
def read_treatment(
    treatment_id: int,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.get_treatment(session=session, treatment_id=treatment_id)

@app.put("/treatments/{treatment_id}", response_model=schemas.TreatmentRead)
def update_treatment(
    treatment_id: int,
    treatment: schemas.TreatmentUpdate,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.update_treatment(
        session=session,
        treatment_id=treatment_id,
        treatment_update=treatment
    )

@app.delete("/treatments/{treatment_id}")
def delete_treatment(
    treatment_id: int,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    crud.delete_treatment(session=session, treatment_id=treatment_id)
    return {"message": "Treatment deleted successfully"}

# Record endpoints
@app.post("/records/", response_model=schemas.RecordRead)
def create_record(
    record: schemas.RecordCreate,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.create_record(session=session, record=record)

@app.get("/records/", response_model=List[schemas.RecordRead])
def read_records(
    skip: int = 0,
    limit: int = 100,
    patient_id: int = None,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.get_records(
        session=session,
        skip=skip,
        limit=limit,
        patient_id=patient_id
    )

@app.get("/records/{record_id}", response_model=schemas.RecordRead)
def read_record(
    record_id: int,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.get_record(session=session, record_id=record_id)

@app.put("/records/{record_id}", response_model=schemas.RecordRead)
def update_record(
    record_id: int,
    record: schemas.RecordUpdate,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.update_record(
        session=session,
        record_id=record_id,
        record_update=record
    )

@app.delete("/records/{record_id}")
def delete_record(
    record_id: int,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    crud.delete_record(session=session, record_id=record_id)
    return {"message": "Record deleted successfully"}
