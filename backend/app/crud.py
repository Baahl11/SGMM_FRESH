from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException, UploadFile
from sqlmodel import Session, select, or_
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
    limit: int = 100,
    search: str = None
) -> List[models.Patient]:
    """Get all patients with pagination and optional search."""
    query = select(models.Patient)
    
    if search:
        # Search in nombre and telefono fields
        search_filter = or_(
            models.Patient.nombre.ilike(f"%{search}%"),
            models.Patient.telefono.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
    
    return session.exec(
        query.offset(skip).limit(limit)
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
    """Delete a patient and all associated records."""
    patient = get_patient(session, patient_id)
    
    # First, delete all records associated with this patient
    records = session.exec(
        select(models.Record).where(models.Record.patient_id == patient_id)
    ).all()
    
    for record in records:
        session.delete(record)
    
    # Commit the deletion of records first
    session.commit()
    
    # Then delete the patient
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
    treatment = get_treatment(session, record.treatment_id)
    
    db_record = models.Record(**record.dict())
    session.add(db_record)
    session.commit()
    session.refresh(db_record)
    
    # Consumir inventario automáticamente si el tratamiento tiene costo unitario > 0
    if treatment.costo_unitario > 0:
        try:
            movements = consume_inventory_for_treatment(
                session=session,
                treatment_id=record.treatment_id,
                record_id=db_record.id,
                user_id=None  # Podríamos pasar el user_id si está disponible
            )
            if movements:
                print(f"Inventario consumido para tratamiento {treatment.nombre}: {len(movements)} movimientos")
        except Exception as e:
            print(f"Error al consumir inventario para tratamiento {treatment.nombre}: {e}")
            # No fallar la creación del record si hay error en inventario
    
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

def get_records_with_names(
    session: Session,
    skip: int = 0,
    limit: int = 100,
    patient_id: Optional[int] = None
) -> List[dict]:
    """Get all records with patient and treatment names included."""
    query = select(
        models.Record,
        models.Patient.nombre.label("patient_name"),
        models.Treatment.nombre.label("treatment_name")
    ).join(
        models.Patient, models.Record.patient_id == models.Patient.id
    ).join(
        models.Treatment, models.Record.treatment_id == models.Treatment.id
    )
    
    if patient_id:
        query = query.where(models.Record.patient_id == patient_id)
    
    results = session.exec(query.offset(skip).limit(limit)).all()
    
    # Convert results to dict format including names
    records_with_names = []
    for record, patient_name, treatment_name in results:
        record_dict = record.dict()
        record_dict["patient_name"] = patient_name
        record_dict["treatment_name"] = treatment_name
        records_with_names.append(record_dict)
    
    return records_with_names

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

# Gastos Fijos operations
def create_gasto_fijo(session: Session, gasto_fijo: schemas.GastoFijoCreate) -> models.GastoFijo:
    """Create a new gasto fijo."""
    db_gasto_fijo = models.GastoFijo(**gasto_fijo.dict())
    session.add(db_gasto_fijo)
    session.commit()
    session.refresh(db_gasto_fijo)
    return db_gasto_fijo

def get_gasto_fijo(session: Session, gasto_fijo_id: int) -> Optional[models.GastoFijo]:
    """Get a gasto fijo by ID."""
    gasto_fijo = session.get(models.GastoFijo, gasto_fijo_id)
    if not gasto_fijo:
        raise HTTPException(status_code=404, detail="Gasto fijo not found")
    return gasto_fijo

def get_gastos_fijos(
    session: Session, 
    skip: int = 0, 
    limit: int = 100,
    activo_only: bool = True
) -> List[models.GastoFijo]:
    """Get all gastos fijos with pagination."""
    query = select(models.GastoFijo)
    if activo_only:
        query = query.where(models.GastoFijo.activo == True)
    return session.exec(query.offset(skip).limit(limit)).all()

def update_gasto_fijo(
    session: Session, 
    gasto_fijo_id: int, 
    gasto_fijo_update: schemas.GastoFijoUpdate
) -> models.GastoFijo:
    """Update a gasto fijo."""
    db_gasto_fijo = get_gasto_fijo(session, gasto_fijo_id)
    
    update_data = gasto_fijo_update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    for key, value in update_data.items():
        setattr(db_gasto_fijo, key, value)
    
    session.add(db_gasto_fijo)
    session.commit()
    session.refresh(db_gasto_fijo)
    return db_gasto_fijo

def delete_gasto_fijo(session: Session, gasto_fijo_id: int) -> None:
    """Delete a gasto fijo (soft delete by setting activo=False)."""
    gasto_fijo = get_gasto_fijo(session, gasto_fijo_id)
    gasto_fijo.activo = False
    gasto_fijo.updated_at = datetime.utcnow()
    session.add(gasto_fijo)
    session.commit()

# Record operations actualizadas para múltiples tratamientos
def create_multiple_record(session: Session, record_data: schemas.MultipleRecordCreate) -> models.Record:
    """Create a new record with multiple treatments."""
    # Verificar que el paciente existe
    get_patient(session, record_data.patient_id)
    
    # Calcular totales
    total_precio_normal = sum(t.precio_normal for t in record_data.tratamientos)
    total_precio_promocional = sum(t.precio_promocional for t in record_data.tratamientos)
    total_costo = sum(t.costo_unitario for t in record_data.tratamientos)
    total_ahorro = total_precio_normal - total_precio_promocional
    
    # Calcular comisión si es pago con tarjeta
    comision_monto = 0.0
    tasa_comision = 0.0
    if record_data.metodo_pago == "tarjeta_credito" and record_data.tasa_comision:
        tasa_comision = record_data.tasa_comision
        comision_monto = total_precio_promocional * (tasa_comision / 100)
    
    monto_neto = total_precio_promocional - comision_monto
    ganancia = monto_neto - total_costo
    
    # Crear el registro principal
    db_record = models.Record(
        patient_id=record_data.patient_id,
        treatment_id=None,  # NULL para múltiples tratamientos
        fecha=record_data.fecha,
        monto_pagado=total_precio_promocional,
        monto_neto=monto_neto,
        costo_unitario=total_costo,
        ganancia=ganancia,
        
        # Campos de múltiples tratamientos
        nombre_promocion=record_data.nombre_promocion,
        precio_normal_total=total_precio_normal,
        ahorro_total=total_ahorro,
        tiene_multiples_tratamientos=True,
        
        # Información de pago
        metodo_pago=record_data.metodo_pago,
        tipo_tarjeta=record_data.tipo_tarjeta,
        meses_sin_intereses=record_data.meses_sin_intereses,
        tasa_comision=tasa_comision,
        comision_monto=comision_monto,
        numero_autorizacion=record_data.numero_autorizacion,
        ultimos_4_digitos=record_data.ultimos_4_digitos,
        
        notas=record_data.notas
    )
    
    session.add(db_record)
    session.commit()
    session.refresh(db_record)
    
    # Crear los tratamientos individuales
    for i, treatment_data in enumerate(record_data.tratamientos):
        # Calcular ganancia individual
        ganancia_individual = treatment_data.precio_promocional - treatment_data.costo_unitario
        if record_data.metodo_pago == "tarjeta_credito" and tasa_comision > 0:
            comision_individual = treatment_data.precio_promocional * (tasa_comision / 100)
            ganancia_individual -= comision_individual
        
        db_record_treatment = models.RecordTreatment(
            record_id=db_record.id,
            treatment_id=treatment_data.treatment_id,
            nombre_tratamiento=treatment_data.nombre_tratamiento,
            precio_normal=treatment_data.precio_normal,
            precio_promocional=treatment_data.precio_promocional,
            costo_unitario=treatment_data.costo_unitario,
            ganancia_individual=ganancia_individual,
            orden=i + 1
        )
        session.add(db_record_treatment)
    
    session.commit()
    return db_record

def get_record_with_treatments(session: Session, record_id: int) -> dict:
    """Get a record with all its associated treatments."""
    record = get_record(session, record_id)
    
    # Obtener tratamientos asociados
    treatments = session.exec(
        select(models.RecordTreatment).where(
            models.RecordTreatment.record_id == record_id
        ).order_by(models.RecordTreatment.orden)
    ).all()
    
    # Obtener información del paciente
    patient = get_patient(session, record.patient_id)
    
    # Preparar respuesta
    result = record.dict()
    result["patient_name"] = patient.nombre
    result["record_treatments"] = [t.dict() for t in treatments]
    
    # Si es un tratamiento único (legacy), obtener nombre del tratamiento
    if not record.tiene_multiples_tratamientos and record.treatment_id:
        treatment = get_treatment(session, record.treatment_id)
        result["treatment_name"] = treatment.nombre
    else:
        result["treatment_name"] = record.nombre_promocion
    
    return result

def update_record_with_treatments(
    session: Session,
    record_id: int,
    record_update: schemas.RecordUpdate
) -> models.Record:
    """Update a record and its associated treatments."""
    db_record = get_record(session, record_id)
    
    # Si se están actualizando tratamientos múltiples
    if record_update.tratamientos is not None:
        # Eliminar tratamientos existentes
        existing_treatments = session.exec(
            select(models.RecordTreatment).where(
                models.RecordTreatment.record_id == record_id
            )
        ).all()
        
        for treatment in existing_treatments:
            session.delete(treatment)
        
        # Recalcular totales
        total_precio_normal = sum(t.precio_normal for t in record_update.tratamientos)
        total_precio_promocional = sum(t.precio_promocional for t in record_update.tratamientos)
        total_costo = sum(t.costo_unitario for t in record_update.tratamientos)
        total_ahorro = total_precio_normal - total_precio_promocional
        
        # Calcular comisión si es pago con tarjeta
        comision_monto = 0.0
        tasa_comision = record_update.tasa_comision or 0.0
        if record_update.metodo_pago == "tarjeta_credito" and tasa_comision > 0:
            comision_monto = total_precio_promocional * (tasa_comision / 100)
        
        monto_neto = total_precio_promocional - comision_monto
        ganancia = monto_neto - total_costo
        
        # Actualizar campos calculados
        record_update.monto_pagado = total_precio_promocional
        record_update.monto_neto = monto_neto
        record_update.costo_unitario = total_costo
        record_update.ganancia = ganancia
        record_update.precio_normal_total = total_precio_normal
        record_update.ahorro_total = total_ahorro
        record_update.comision_monto = comision_monto
        record_update.tiene_multiples_tratamientos = True
        
        # Crear nuevos tratamientos
        for i, treatment_data in enumerate(record_update.tratamientos):
            ganancia_individual = treatment_data.precio_promocional - treatment_data.costo_unitario
            if record_update.metodo_pago == "tarjeta_credito" and tasa_comision > 0:
                comision_individual = treatment_data.precio_promocional * (tasa_comision / 100)
                ganancia_individual -= comision_individual
            
            db_record_treatment = models.RecordTreatment(
                record_id=record_id,
                treatment_id=treatment_data.treatment_id,
                nombre_tratamiento=treatment_data.nombre_tratamiento,
                precio_normal=treatment_data.precio_normal,
                precio_promocional=treatment_data.precio_promocional,
                costo_unitario=treatment_data.costo_unitario,
                ganancia_individual=ganancia_individual,
                orden=i + 1
            )
            session.add(db_record_treatment)
    
    # Actualizar campos del record
    update_data = record_update.dict(exclude_unset=True, exclude={'tratamientos'})
    
    for key, value in update_data.items():
        setattr(db_record, key, value)
    
    session.add(db_record)
    session.commit()
    session.refresh(db_record)
    return db_record

def get_records_with_names_enhanced(
    session: Session,
    skip: int = 0,
    limit: int = 100,
    patient_id: Optional[int] = None
) -> List[dict]:
    """Get all records with patient and treatment names, including multiple treatments."""
    query = select(models.Record).join(
        models.Patient, models.Record.patient_id == models.Patient.id
    )
    
    if patient_id:
        query = query.where(models.Record.patient_id == patient_id)
    
    query = query.order_by(models.Record.fecha.desc())
    records = session.exec(query.offset(skip).limit(limit)).all()
    
    results = []
    for record in records:
        # Obtener información del paciente
        patient = session.get(models.Patient, record.patient_id)
        
        result = record.dict()
        result["patient_name"] = patient.nombre
        
        if record.tiene_multiples_tratamientos:
            # Obtener tratamientos múltiples
            treatments = session.exec(
                select(models.RecordTreatment).where(
                    models.RecordTreatment.record_id == record.id
                ).order_by(models.RecordTreatment.orden)
            ).all()
            
            result["treatment_name"] = record.nombre_promocion
            result["record_treatments"] = [t.dict() for t in treatments]
        else:
            # Tratamiento único (legacy)
            if record.treatment_id:
                treatment = session.get(models.Treatment, record.treatment_id)
                result["treatment_name"] = treatment.nombre if treatment else "Tratamiento eliminado"
            else:
                result["treatment_name"] = "Sin tratamiento"
            result["record_treatments"] = []
        
        results.append(result)
    
    return results

# Inventory operations
def create_inventory_item(session: Session, item: schemas.InventoryItemCreate) -> models.InventoryItem:
    """Create a new inventory item."""
    db_item = models.InventoryItem(**item.dict())
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item

def get_inventory_item(session: Session, item_id: int) -> Optional[models.InventoryItem]:
    """Get an inventory item by ID."""
    item = session.get(models.InventoryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return item

def get_inventory_items(
    session: Session, 
    skip: int = 0, 
    limit: int = 100,
    search: str = None,
    activo: bool = True
) -> List[dict]:
    """Get all inventory items with calculated status."""
    query = select(models.InventoryItem).where(models.InventoryItem.activo == activo)
    
    if search:
        search_filter = or_(
            models.InventoryItem.nombre.ilike(f"%{search}%"),
            models.InventoryItem.descripcion.ilike(f"%{search}%"),
            models.InventoryItem.codigo_producto.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
    
    query = query.offset(skip).limit(limit).order_by(models.InventoryItem.nombre)
    items = session.exec(query).all()
    
    # Calcular status y porcentaje para cada item
    results = []
    for item in items:
        status = calculate_inventory_status(item.stock_actual, item.stock_minimo, item.stock_maximo)
        percentage = (item.stock_actual / item.stock_maximo * 100) if item.stock_maximo > 0 else 0
        
        result = item.dict()
        result["status"] = status
        result["percentage"] = round(percentage, 1)
        results.append(result)
    
    return results

def update_inventory_item(
    session: Session, 
    item_id: int, 
    item_update: schemas.InventoryItemUpdate
) -> models.InventoryItem:
    """Update an inventory item."""
    db_item = get_inventory_item(session, item_id)
    
    update_data = item_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_item, field, value)
    
    db_item.updated_at = datetime.utcnow()
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item

def delete_inventory_item(session: Session, item_id: int) -> models.InventoryItem:
    """Soft delete an inventory item."""
    db_item = get_inventory_item(session, item_id)
    db_item.activo = False
    db_item.updated_at = datetime.utcnow()
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item

def adjust_inventory_stock(
    session: Session, 
    adjustment: schemas.InventoryStockAdjustment,
    user_id: Optional[int] = None
) -> models.InventoryItem:
    """Adjust inventory stock and create movement record."""
    db_item = get_inventory_item(session, adjustment.item_id)
    
    # Create movement record
    movement = models.InventoryMovement(
        item_id=adjustment.item_id,
        tipo="ajuste",
        cantidad=adjustment.new_stock - db_item.stock_actual,
        cantidad_anterior=db_item.stock_actual,
        cantidad_nueva=adjustment.new_stock,
        motivo=adjustment.motivo,
        usuario_id=user_id
    )
    
    # Update stock
    db_item.stock_actual = adjustment.new_stock
    db_item.updated_at = datetime.utcnow()
    
    session.add(movement)
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item

def create_inventory_movement(
    session: Session, 
    movement: schemas.InventoryMovementCreate,
    user_id: Optional[int] = None
) -> models.InventoryMovement:
    """Create an inventory movement (entrada/salida)."""
    db_item = get_inventory_item(session, movement.item_id)
    
    # Calculate new stock
    if movement.tipo == "entrada":
        new_stock = db_item.stock_actual + movement.cantidad
    elif movement.tipo == "salida":
        new_stock = max(0, db_item.stock_actual - movement.cantidad)
    else:
        new_stock = db_item.stock_actual
    
    # Create movement record
    db_movement = models.InventoryMovement(
        item_id=movement.item_id,
        tipo=movement.tipo,
        cantidad=movement.cantidad,
        cantidad_anterior=db_item.stock_actual,
        cantidad_nueva=new_stock,
        motivo=movement.motivo,
        referencia_id=movement.referencia_id,
        usuario_id=user_id
    )
    
    # Update item stock
    db_item.stock_actual = new_stock
    db_item.updated_at = datetime.utcnow()
    
    session.add(db_movement)
    session.add(db_item)
    session.commit()
    session.refresh(db_movement)
    return db_movement

def get_inventory_movements(
    session: Session, 
    item_id: Optional[int] = None,
    skip: int = 0, 
    limit: int = 100
) -> List[dict]:
    """Get inventory movements with item names."""
    query = select(models.InventoryMovement, models.InventoryItem.nombre).join(
        models.InventoryItem, models.InventoryMovement.item_id == models.InventoryItem.id
    )
    
    if item_id:
        query = query.where(models.InventoryMovement.item_id == item_id)
    
    query = query.offset(skip).limit(limit).order_by(models.InventoryMovement.created_at.desc())
    results = session.exec(query).all()
    
    movements = []
    for movement, item_name in results:
        result = movement.dict()
        result["item_name"] = item_name
        movements.append(result)
    
    return movements

def get_inventory_health_status(session: Session) -> dict:
    """Get overall inventory health status."""
    items = session.exec(select(models.InventoryItem).where(models.InventoryItem.activo == True)).all()
    
    total_items = len(items)
    high_stock = 0
    medium_stock = 0
    low_stock = 0
    out_of_stock = 0
    
    critical_items = []
    low_items = []
    
    for item in items:
        status = calculate_inventory_status(item.stock_actual, item.stock_minimo, item.stock_maximo)
        percentage = (item.stock_actual / item.stock_maximo * 100) if item.stock_maximo > 0 else 0
        
        if status == "high":
            high_stock += 1
        elif status == "medium":
            medium_stock += 1
        elif status == "low":
            low_stock += 1
            item_dict = {
                "id": item.id,
                "nombre": item.nombre,
                "stock_actual": item.stock_actual,
                "stock_minimo": item.stock_minimo,
                "stock_maximo": item.stock_maximo,
                "status": status,
                "percentage": round(percentage, 1)
            }
            low_items.append(item_dict)
        else:  # out
            out_of_stock += 1
            item_dict = {
                "id": item.id,
                "nombre": item.nombre,
                "stock_actual": item.stock_actual,
                "stock_minimo": item.stock_minimo,
                "stock_maximo": item.stock_maximo,
                "status": status,
                "percentage": 0
            }
            critical_items.append(item_dict)
    
    # Determine overall status
    if out_of_stock > 0 or low_stock > total_items * 0.3:
        overall_status = "critical"
    elif low_stock > 0 or medium_stock > total_items * 0.5:
        overall_status = "warning"
    else:
        overall_status = "good"
    
    return {
        "total_items": total_items,
        "high_stock": high_stock,
        "medium_stock": medium_stock,
        "low_stock": low_stock,
        "out_of_stock": out_of_stock,
        "overall_status": overall_status,
        "critical_items": critical_items,
        "low_items": low_items
    }

def calculate_inventory_status(stock_actual: int, stock_minimo: int, stock_maximo: int) -> str:
    """Calculate inventory status based on stock levels."""
    if stock_actual == 0:
        return "out"
    elif stock_actual < stock_minimo:
        return "low"
    elif stock_actual < (stock_maximo * 0.5):
        return "medium"
    else:
        return "high"

def consume_inventory_for_treatment(
    session: Session, 
    treatment_id: int, 
    record_id: int,
    user_id: Optional[int] = None
) -> List[models.InventoryMovement]:
    """Consume inventory items when a treatment is applied."""
    # Get treatment inventory requirements
    treatment_items = session.exec(
        select(models.TreatmentInventoryItem).where(
            models.TreatmentInventoryItem.treatment_id == treatment_id
        )
    ).all()
    
    movements = []
    for treatment_item in treatment_items:
        # Create consumption movement
        movement = models.InventoryMovement(
            item_id=treatment_item.inventory_item_id,
            tipo="uso_tratamiento",
            cantidad=treatment_item.cantidad_requerida,
            motivo=f"Aplicación de tratamiento (Record #{record_id})",
            referencia_id=record_id,
            usuario_id=user_id
        )
        
        # Update item stock
        db_item = session.get(models.InventoryItem, treatment_item.inventory_item_id)
        if db_item:
            movement.cantidad_anterior = db_item.stock_actual
            movement.cantidad_nueva = max(0, db_item.stock_actual - treatment_item.cantidad_requerida)
            
            db_item.stock_actual = movement.cantidad_nueva
            db_item.updated_at = datetime.utcnow()
            
            session.add(movement)
            session.add(db_item)
            movements.append(movement)
    
    session.commit()
    return movements
