from datetime import timedelta
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi import Form
from sqlmodel import Session, select

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
    "http://localhost:3001",  # Next.js development server (alternate port)
    "http://localhost:8000",  # FastAPI development server
    "https://l3q53h-8000.csb.app" # Frontend origin
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Mount static files for uploaded images
import os
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Create tables on startup
@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# Authentication endpoints
@app.post("/auth/login", response_model=schemas.Token)
async def login_for_access_token_auth(
    username: str = Form(...),
    password: str = Form(...),
    session: Session = Depends(get_session)
):
    user = authenticate_user(username, password, session)
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

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    username: str = Form(...),
    password: str = Form(...),
    session: Session = Depends(get_session)
):
    user = authenticate_user(username, password, session)
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

@app.post("/register", response_model=schemas.UserRead)
def register_user(
    user: schemas.UserCreate,
    session: Session = Depends(get_session)
):
    # Check if user already exists
    existing_user = session.exec(
        select(models.User).where(models.User.email == user.email)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    return crud.create_user(session=session, user=user)

# Patient endpoints
@app.post("/patients/", response_model=schemas.PatientRead)
def create_patient(
    patient: schemas.PatientCreate,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.create_patient(session=session, patient=patient)

@app.post("/patients/with-treatment")
def create_patient_with_treatment(
    data: dict,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new patient along with their first treatment record."""
    try:
        # Extract patient data
        patient_data = {
            'nombre': data.get('nombre'),
            'fecha_nacimiento': data.get('fecha_nacimiento'),
            'telefono': data.get('telefono'),
            'email': data.get('email', ''),
            'direccion': data.get('direccion', ''),
            'requiere_factura': data.get('requiere_factura', False)
        }
        
        # Create patient
        patient_create = schemas.PatientCreate(**patient_data)
        patient = crud.create_patient(session=session, patient=patient_create)
        
        # If there's treatment data, create the record
        if data.get('tratamiento_realizado_id') and data.get('monto_pagado', 0) > 0:
            record_data = {
                'patient_id': patient.id,
                'treatment_id': int(data.get('tratamiento_realizado_id')),
                'fecha': data.get('fecha_tratamiento'),
                'monto_pagado': float(data.get('monto_pagado')),
                'monto_neto': float(data.get('monto_pagado')) - float(data.get('comision_monto', 0)),
                'costo_unitario': float(data.get('costo_unitario', 0)),
                'ganancia': float(data.get('monto_pagado')) - float(data.get('costo_unitario', 0)) - float(data.get('comision_monto', 0)),
                'metodo_pago': data.get('metodo_pago', 'efectivo'),
                'tipo_tarjeta': data.get('tipo_tarjeta'),
                'meses_sin_intereses': int(data.get('meses_sin_intereses', 0)),
                'tasa_comision': float(data.get('tasa_comision', 0)),
                'comision_monto': float(data.get('comision_monto', 0)),
                'notas': data.get('notas', '')
            }
            
            record_create = schemas.RecordCreate(**record_data)
            crud.create_record(session=session, record=record_create)
        
        return {"message": "Patient and treatment created successfully", "patient_id": patient.id}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/patients/", response_model=List[schemas.PatientRead])
def read_patients(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.get_patients(session=session, skip=skip, limit=limit, search=search)

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

@app.post("/patients/{patient_id}/upload-image")
async def upload_patient_image(
    patient_id: int,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    """Upload an image for a patient"""
    import os
    import uuid
    from pathlib import Path
    
    try:
        # Verify patient exists
        patient = crud.get_patient(session=session, patient_id=patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Validate file size (5MB max)
        content = await file.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum 5MB allowed")
        
        # Reset file pointer
        await file.seek(0)
        
        # Create uploads directory if it doesn't exist
        upload_dir = Path("uploads/patients")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        file_extension = file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg"
        unique_filename = f"{patient_id}_{uuid.uuid4()}.{file_extension}"
        file_path = upload_dir / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Update patient's fotos list
        current_fotos = patient.fotos or []
        if isinstance(current_fotos, str):
            try:
                import json
                current_fotos = json.loads(current_fotos)
            except:
                current_fotos = []
        
        current_fotos.append(str(file_path))
        
        # Update patient fotos directly
        patient.fotos = current_fotos
        session.add(patient)
        session.commit()
        session.refresh(patient)
        
        return {
            "message": "Image uploaded successfully",
            "filename": unique_filename,
            "path": str(file_path)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error uploading image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

@app.get("/patients/{patient_id}/images")
def get_patient_images(
    patient_id: int,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all images for a patient"""
    patient = crud.get_patient(session=session, patient_id=patient_id)
    return {"images": patient.fotos or []}

@app.delete("/patients/{patient_id}/images/{image_name}")
def delete_patient_image(
    patient_id: int,
    image_name: str,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    """Delete a specific patient image"""
    import os
    from pathlib import Path
    
    patient = crud.get_patient(session=session, patient_id=patient_id)
      # Find and remove the image from the list
    current_fotos = patient.fotos or []
    image_path = None
    
    for foto in current_fotos:
        # Check if the image_name matches the filename at the end of the path
        if foto.endswith(image_name) or image_name in foto:
            image_path = foto
            current_fotos.remove(foto)
            break
    
    if not image_path:
        # Debug information
        print(f"Looking for image: {image_name}")
        print(f"Available images: {current_fotos}")
        raise HTTPException(status_code=404, detail=f"Image not found: {image_name}")
    
    # Delete physical file
    try:
        os.remove(image_path)
    except OSError:
        pass  # File might not exist
    
    # Update patient in database
    patient_update = schemas.PatientUpdate(
        nombre=patient.nombre,
        fecha_nacimiento=patient.fecha_nacimiento,
        telefono=patient.telefono,
        email=patient.email,
        direccion=patient.direccion,
        requiere_factura=patient.requiere_factura
    )
    
    updated_patient = crud.update_patient(
        session=session,
        patient_id=patient_id,
        patient_update=patient_update
    )
    
    # Manually update fotos
    updated_patient.fotos = current_fotos
    session.add(updated_patient)
    session.commit()
    
    return {"message": "Image deleted successfully"}

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

@app.get("/records/with-names/")
def read_records_with_names(
    skip: int = 0,
    limit: int = 100,
    patient_id: int = None,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get records with patient and treatment names included for dashboard display."""
    return crud.get_records_with_names(
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

# 🎉 NUEVOS ENDPOINTS PARA MÚLTIPLES TRATAMIENTOS Y TARJETAS DE CRÉDITO

@app.post("/records/multiple/", response_model=schemas.RecordRead)
def create_multiple_record(
    record: schemas.MultipleRecordCreate,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new record with multiple treatments and full credit card support."""
    return crud.create_multiple_record(session=session, record_data=record)

@app.get("/records/{record_id}/with-treatments/")
def read_record_with_treatments(
    record_id: int,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get a record with all its associated treatments and patient info."""
    return crud.get_record_with_treatments(session=session, record_id=record_id)

@app.put("/records/{record_id}/with-treatments/", response_model=schemas.RecordRead)
def update_record_with_treatments(
    record_id: int,
    record: schemas.RecordUpdate,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update a record and its associated treatments."""
    return crud.update_record_with_treatments(
        session=session,
        record_id=record_id,
        record_update=record
    )

@app.get("/records/enhanced/with-names/")
def read_records_with_names_enhanced(
    skip: int = 0,
    limit: int = 100,
    patient_id: int = None,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get records with patient and treatment names, including multiple treatments support."""
    return crud.get_records_with_names_enhanced(
        session=session,
        skip=skip,
        limit=limit,
        patient_id=patient_id
    )

# Endpoints específicos para información de tarjetas de crédito
@app.get("/payment-methods/credit-cards/")
def get_credit_card_options(
    current_user: models.User = Depends(get_current_active_user)
):
    """Get available credit card options with commission rates."""
    return {
        "cards": [
            {
                "id": "bbva",
                "name": "BBVA",
                "commission_rate": 3.5,
                "months_available": [0, 3, 6, 9, 12],
                "rates": {
                    "0": 3.5,
                    "3": 3.95,
                    "6": 6.5,
                    "9": 9.0,
                    "12": 12.0
                }
            },
            {
                "id": "banamex",
                "name": "Banamex",
                "commission_rate": 1.5,
                "months_available": [0, 3, 6, 9, 12],
                "rates": {
                    "0": 1.5,
                    "3": 7.25,   # 1.5% + 5.75%
                    "6": 11.99,  # 1.5% + 10.49%
                    "9": 15.53,  # 1.5% + 14.03%
                    "12": 18.13  # 1.5% + 16.63%
                }
            },            {
                "id": "amex",
                "name": "American Express",
                "commission_rate": 2.65,
                "months_available": [0, 3, 6, 9, 12],
                "rates": {
                    "0": 2.65,
                    "3": 6.30,   # 2.80% + 3.5%
                    "6": 8.30,   # 2.80% + 5.5%
                    "9": 11.30,  # 2.80% + 8.5%
                    "12": 14.30  # 2.80% + 11.5%
                }
            },{
                "id": "openpay",
                "name": "OpenPay",
                "commission_rate": 3.364,  # 2.9% + IVA (16%)
                "months_available": [0, 3, 6, 9, 12],
                "rates": {
                    "0": 3.364,  # 2.9% + IVA (16%)
                    "3": 8.932,  # 7.7% + IVA (16%)
                    "6": 12.412, # 10.7% + IVA (16%)
                    "9": 15.892, # 13.7% + IVA (16%)
                    "12": 19.372 # 16.7% + IVA (16%)
                }
            },            {
                "id": "otros",
                "name": "Otras Tarjetas de Crédito",
                "commission_rate": 2.80,
                "months_available": [0, 3, 6, 9, 12],
                "rates": {
                    "0": 2.80,
                    "3": 6.30,   # 2.80% + 3.5%
                    "6": 8.30,   # 2.80% + 5.5%
                    "9": 11.30,  # 2.80% + 8.5%
                    "12": 14.30  # 2.80% + 11.5%
                }
            }
        ]
    }

@app.post("/payment-methods/calculate-commission/")
def calculate_commission(
    data: dict,
    current_user: models.User = Depends(get_current_active_user)
):
    """Calculate commission for credit card payment."""
    amount = data.get("amount", 0)
    commission_rate = data.get("commission_rate", 0)
    
    commission_amount = amount * (commission_rate / 100)
    net_amount = amount - commission_amount
    
    return {
        "amount": amount,
        "commission_rate": commission_rate,
        "commission_amount": commission_amount,
        "net_amount": net_amount
    }

# Gastos Fijos endpoints
@app.post("/gastos-fijos/", response_model=schemas.GastoFijoRead)
def create_gasto_fijo(
    gasto_fijo: schemas.GastoFijoCreate,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new gasto fijo."""
    return crud.create_gasto_fijo(session=session, gasto_fijo=gasto_fijo)

@app.get("/gastos-fijos/", response_model=List[schemas.GastoFijoRead])
def read_gastos_fijos(
    only_active: bool = False,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all gastos fijos."""
    return crud.get_gastos_fijos(session=session, activo_only=only_active)

@app.get("/gastos-fijos/{gasto_fijo_id}", response_model=schemas.GastoFijoRead)
def read_gasto_fijo(
    gasto_fijo_id: int,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get a specific gasto fijo."""
    gasto_fijo = crud.get_gasto_fijo(session=session, gasto_fijo_id=gasto_fijo_id)
    if not gasto_fijo:
        raise HTTPException(status_code=404, detail="Gasto fijo not found")
    return gasto_fijo

@app.put("/gastos-fijos/{gasto_fijo_id}", response_model=schemas.GastoFijoRead)
def update_gasto_fijo(
    gasto_fijo_id: int,
    gasto_fijo_update: schemas.GastoFijoUpdate,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update a gasto fijo."""
    return crud.update_gasto_fijo(
        session=session, 
        gasto_fijo_id=gasto_fijo_id, 
        gasto_fijo_update=gasto_fijo_update
    )

@app.delete("/gastos-fijos/{gasto_fijo_id}")
def delete_gasto_fijo(
    gasto_fijo_id: int,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    """Delete a gasto fijo."""
    gasto_fijo = crud.get_gasto_fijo(session=session, gasto_fijo_id=gasto_fijo_id)
    if not gasto_fijo:
        raise HTTPException(status_code=404, detail="Gasto fijo not found")
    
    session.delete(gasto_fijo)
    session.commit()
    return {"message": "Gasto fijo deleted successfully"}

# Test endpoint (no auth required)
@app.get("/test/gastos-fijos")
def test_gastos_fijos():
    """Test endpoint to check gastos fijos without auth."""
    try:
        from .database import engine
        with Session(engine) as session:
            gastos = session.exec(select(models.GastoFijo)).all()
            return {
                "count": len(gastos),
                "gastos": [{"id": g.id, "nombre": g.nombre, "monto": g.monto, "activo": g.activo} for g in gastos]
            }
    except Exception as e:
        return {"error": str(e)}

# Endpoint específico para estadísticas del dashboard con gastos fijos
@app.get("/dashboard/stats/")
def get_dashboard_stats(
    current_user: models.User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Get comprehensive dashboard statistics including fixed costs."""
    from datetime import datetime
    
    # Obtener todos los registros con pagos reales
    records = session.exec(
        select(models.Record)
        .where(models.Record.monto_pagado > 0)
    ).all()
    
    # Obtener gastos fijos activos
    gastos_fijos = session.exec(
        select(models.GastoFijo)
        .where(models.GastoFijo.activo == True)
    ).all()
    
    # Calcular estadísticas del mes actual
    current_month = datetime.now().month
    current_year = datetime.now().year
    
    monthly_revenue = 0
    monthly_costs = 0
    monthly_profit = 0
    total_revenue = 0
    total_costs = 0
    total_profit = 0
    
    for record in records:
        record_date = record.fecha
        revenue = record.monto_pagado or 0
        cost = record.costo_unitario or 0
        commission = getattr(record, 'comision_monto', 0) or 0
        net_profit = revenue - cost - commission
        
        total_revenue += revenue
        total_costs += cost
        total_profit += net_profit
        
        if record_date.month == current_month and record_date.year == current_year:
            monthly_revenue += revenue
            monthly_costs += cost
            monthly_profit += net_profit
    
    # Calcular gastos fijos mensuales
    monthly_fixed_costs = 0
    for gasto in gastos_fijos:
        if gasto.frecuencia == 'mensual':
            monthly_fixed_costs += gasto.monto
        elif gasto.frecuencia == 'anual':
            monthly_fixed_costs += gasto.monto / 12
        elif gasto.frecuencia == 'trimestral':
            monthly_fixed_costs += gasto.monto / 3
    
    # Calcular ganancia neta (bruta - gastos fijos)
    monthly_net_profit = monthly_profit - monthly_fixed_costs
    
    # Calcular margen de ganancia
    monthly_margin = (monthly_net_profit / monthly_revenue * 100) if monthly_revenue > 0 else 0
    
    return {
        "total_revenue": total_revenue,
        "total_costs": total_costs,
        "total_profit": total_profit,
        "monthly_revenue": monthly_revenue,
        "monthly_costs": monthly_costs,
        "monthly_gross_profit": monthly_profit,
        "monthly_fixed_costs": monthly_fixed_costs,
        "monthly_net_profit": monthly_net_profit,
        "monthly_margin_percentage": monthly_margin,
        "fixed_costs_breakdown": [
            {
                "concepto": gasto.concepto,
                "monto": gasto.monto,
                "frecuencia": gasto.frecuencia,
                "monto_mensual": (
                    gasto.monto if gasto.frecuencia == 'mensual'
                    else gasto.monto / 12 if gasto.frecuencia == 'anual'
                    else gasto.monto / 3 if gasto.frecuencia == 'trimestral'
                    else gasto.monto
                )
            }
            for gasto in gastos_fijos
        ]
    }

# Inventory endpoints
@app.get("/inventory/", response_model=List[schemas.InventoryItemRead])
def get_inventory_items(
    skip: int = 0, 
    limit: int = 100,
    search: str = "",
    activo: bool = True,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all inventory items"""
    items = crud.get_inventory_items(session, skip=skip, limit=limit, search=search, activo=activo)
    return items

@app.post("/inventory/", response_model=schemas.InventoryItemRead)
def create_inventory_item(
    item: schemas.InventoryItemCreate,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new inventory item"""
    db_item = crud.create_inventory_item(session, item)
    # Calculate status and percentage
    status = crud.calculate_inventory_status(db_item.stock_actual, db_item.stock_minimo, db_item.stock_maximo)
    percentage = (db_item.stock_actual / db_item.stock_maximo * 100) if db_item.stock_maximo > 0 else 0
    
    result = db_item.dict()
    result["status"] = status
    result["percentage"] = round(percentage, 1)
    return result

@app.get("/inventory/{item_id}", response_model=schemas.InventoryItemRead)
def get_inventory_item(
    item_id: int,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get a specific inventory item"""
    db_item = crud.get_inventory_item(session, item_id)
    # Calculate status and percentage
    status = crud.calculate_inventory_status(db_item.stock_actual, db_item.stock_minimo, db_item.stock_maximo)
    percentage = (db_item.stock_actual / db_item.stock_maximo * 100) if db_item.stock_maximo > 0 else 0
    
    result = db_item.dict()
    result["status"] = status
    result["percentage"] = round(percentage, 1)
    return result

@app.put("/inventory/{item_id}", response_model=schemas.InventoryItemRead)
def update_inventory_item(
    item_id: int,
    item_update: schemas.InventoryItemUpdate,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update an inventory item"""
    db_item = crud.update_inventory_item(session, item_id, item_update)
    # Calculate status and percentage
    status = crud.calculate_inventory_status(db_item.stock_actual, db_item.stock_minimo, db_item.stock_maximo)
    percentage = (db_item.stock_actual / db_item.stock_maximo * 100) if db_item.stock_maximo > 0 else 0
    
    result = db_item.dict()
    result["status"] = status
    result["percentage"] = round(percentage, 1)
    return result

@app.delete("/inventory/{item_id}", response_model=schemas.InventoryItemRead)
def delete_inventory_item(
    item_id: int,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    """Soft delete an inventory item"""
    db_item = crud.delete_inventory_item(session, item_id)
    # Calculate status and percentage
    status = crud.calculate_inventory_status(db_item.stock_actual, db_item.stock_minimo, db_item.stock_maximo)
    percentage = (db_item.stock_actual / db_item.stock_maximo * 100) if db_item.stock_maximo > 0 else 0
    
    result = db_item.dict()
    result["status"] = status
    result["percentage"] = round(percentage, 1)
    return result

@app.post("/inventory/adjust", response_model=schemas.InventoryItemRead)
def adjust_inventory_stock(
    adjustment: schemas.InventoryStockAdjustment,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    """Adjust inventory stock"""
    db_item = crud.adjust_inventory_stock(session, adjustment, current_user.id)
    # Calculate status and percentage
    status = crud.calculate_inventory_status(db_item.stock_actual, db_item.stock_minimo, db_item.stock_maximo)
    percentage = (db_item.stock_actual / db_item.stock_maximo * 100) if db_item.stock_maximo > 0 else 0
    
    result = db_item.dict()
    result["status"] = status
    result["percentage"] = round(percentage, 1)
    return result

@app.get("/inventory/movements/", response_model=List[schemas.InventoryMovementRead])
def get_inventory_movements(
    item_id: int = None,
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get inventory movements"""
    movements = crud.get_inventory_movements(session, item_id=item_id, skip=skip, limit=limit)
    return movements

@app.post("/inventory/movements/", response_model=schemas.InventoryMovementRead)
def create_inventory_movement(
    movement: schemas.InventoryMovementCreate,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create an inventory movement (entrada/salida)"""
    db_movement = crud.create_inventory_movement(session, movement, current_user.id)
    result = db_movement.dict()
    
    # Get item name
    item = crud.get_inventory_item(session, movement.item_id)
    result["item_name"] = item.nombre
    return result

@app.get("/inventory/health", response_model=schemas.InventoryHealthStatus)
def get_inventory_health(
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get overall inventory health status"""
    health_status = crud.get_inventory_health_status(session)
    return health_status

# Treatment-Inventory relationship endpoints
@app.get("/treatments/{treatment_id}/inventory", response_model=List[schemas.TreatmentInventoryItemRead])
def get_treatment_inventory_items(
    treatment_id: int,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get inventory items required by a treatment"""
    items = session.exec(
        select(models.TreatmentInventoryItem, models.InventoryItem.nombre, models.Treatment.nombre)
        .join(models.InventoryItem, models.TreatmentInventoryItem.inventory_item_id == models.InventoryItem.id)
        .join(models.Treatment, models.TreatmentInventoryItem.treatment_id == models.Treatment.id)
        .where(models.TreatmentInventoryItem.treatment_id == treatment_id)
    ).all()
    
    results = []
    for item, inventory_name, treatment_name in items:
        result = item.dict()
        result["inventory_item_name"] = inventory_name
        result["treatment_name"] = treatment_name
        results.append(result)
    
    return results

@app.post("/treatments/{treatment_id}/inventory", response_model=schemas.TreatmentInventoryItemRead)
def add_treatment_inventory_item(
    treatment_id: int,
    item_data: dict,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    """Add an inventory item requirement to a treatment"""
    # Verify treatment and inventory item exist
    treatment = crud.get_treatment(session, treatment_id)
    inventory_item = crud.get_inventory_item(session, item_data["inventory_item_id"])
    
    # Check if relationship already exists
    existing = session.exec(
        select(models.TreatmentInventoryItem)
        .where(models.TreatmentInventoryItem.treatment_id == treatment_id)
        .where(models.TreatmentInventoryItem.inventory_item_id == item_data["inventory_item_id"])
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Esta relación ya existe")
    
    # Create relationship
    treatment_inventory = models.TreatmentInventoryItem(
        treatment_id=treatment_id,
        inventory_item_id=item_data["inventory_item_id"],
        cantidad_requerida=item_data.get("cantidad_requerida", 1)
    )
    
    session.add(treatment_inventory)
    session.commit()
    session.refresh(treatment_inventory)
    
    result = treatment_inventory.dict()
    result["inventory_item_name"] = inventory_item.nombre
    result["treatment_name"] = treatment.nombre
    return result

@app.delete("/treatments/{treatment_id}/inventory/{item_id}")
def remove_treatment_inventory_item(
    treatment_id: int,
    item_id: int,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_active_user)
):
    """Remove an inventory item requirement from a treatment"""
    treatment_inventory = session.exec(
        select(models.TreatmentInventoryItem)
        .where(models.TreatmentInventoryItem.treatment_id == treatment_id)
        .where(models.TreatmentInventoryItem.id == item_id)
    ).first()
    
    if not treatment_inventory:
        raise HTTPException(status_code=404, detail="Relación no encontrada")
    
    session.delete(treatment_inventory)
    session.commit()
    return {"message": "Relación eliminada exitosamente"}