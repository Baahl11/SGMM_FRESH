"""
Utilidades para cálculo de comisiones de tarjetas de crédito
"""

def calcular_comision_bbva(monto: float, meses_sin_intereses: int = 0) -> tuple[float, float]:
    """
    Calcula la comisión de BBVA según los MSI
    
    Args:
        monto: Monto base
        meses_sin_intereses: 0, 3, 6, 9, 12
        
    Returns:
        tuple: (tasa_porcentaje, monto_comision)
    """
    tasa_base = 3.5
    
    if meses_sin_intereses == 0:
        tasa = tasa_base
    elif meses_sin_intereses == 3:
        tasa = 3.95
    elif meses_sin_intereses == 6:
        tasa = 6.5
    elif meses_sin_intereses == 9:
        tasa = 9.0
    elif meses_sin_intereses == 12:
        tasa = 12.0
    else:
        raise ValueError(f"MSI no válidos para BBVA: {meses_sin_intereses}")
    
    comision = monto * (tasa / 100)
    return tasa, comision

def calcular_comision_openpay(monto: float, meses_sin_intereses: int = 0) -> tuple[float, float]:
    """
    Calcula la comisión de OpenPay (todas las tarjetas que no son BBVA)
    
    Args:
        monto: Monto base
        meses_sin_intereses: 0, 3, 6, 9, 12
        
    Returns:
        tuple: (tasa_porcentaje, monto_comision_sin_iva)
    """
    if meses_sin_intereses == 0:
        # 1 exhibición: 2.9% + IVA
        tasa = 2.9
    elif meses_sin_intereses == 3:
        # 3 MSI: 4.8% + 2.9% = 7.7% + IVA
        tasa = 7.7
    elif meses_sin_intereses == 6:
        # 6 MSI: 7.8% + 2.9% = 10.7% + IVA
        tasa = 10.7
    elif meses_sin_intereses == 9:
        # 9 MSI: 10.8% + 2.9% = 13.7% + IVA
        tasa = 13.7
    elif meses_sin_intereses == 12:
        # 12 MSI: 13.8% + 2.9% = 16.7% + IVA
        tasa = 16.7
    else:
        raise ValueError(f"MSI no válidos para OpenPay: {meses_sin_intereses}")
    
    # Comisión sin IVA
    comision_sin_iva = monto * (tasa / 100)
    # Agregar IVA (16%)
    comision_con_iva = comision_sin_iva * 1.16
    
    return tasa, comision_con_iva

def calcular_comision_tarjeta(monto: float, tipo_tarjeta: str, meses_sin_intereses: int = 0) -> tuple[float, float]:
    """
    Calcula la comisión según el tipo de tarjeta
    
    Args:
        monto: Monto base
        tipo_tarjeta: "bbva" o "openpay"
        meses_sin_intereses: 0, 3, 6, 9, 12
        
    Returns:
        tuple: (tasa_porcentaje, monto_comision)
    """
    if tipo_tarjeta.lower() == "bbva":
        return calcular_comision_bbva(monto, meses_sin_intereses)
    elif tipo_tarjeta.lower() == "openpay":
        return calcular_comision_openpay(monto, meses_sin_intereses)
    else:
        raise ValueError(f"Tipo de tarjeta no válido: {tipo_tarjeta}")

def calcular_ganancia_neta(monto_pagado: float, costo_unitario: float, 
                          metodo_pago: str, tipo_tarjeta: str = None, 
                          meses_sin_intereses: int = 0) -> tuple[float, float, float]:
    """
    Calcula la ganancia neta después de descontar comisiones
    
    Args:
        monto_pagado: Monto total pagado por el cliente
        costo_unitario: Costo del tratamiento
        metodo_pago: "efectivo", "tarjeta", "transferencia"
        tipo_tarjeta: "bbva", "openpay" (solo si metodo_pago es "tarjeta")
        meses_sin_intereses: MSI (solo si metodo_pago es "tarjeta")
        
    Returns:
        tuple: (ganancia_bruta, comision_monto, ganancia_neta)
    """
    ganancia_bruta = monto_pagado - costo_unitario
    
    if metodo_pago == "efectivo" or metodo_pago == "transferencia":
        comision_monto = 0.0
        ganancia_neta = ganancia_bruta
    elif metodo_pago == "tarjeta":
        if not tipo_tarjeta:
            raise ValueError("tipo_tarjeta es requerido para pagos con tarjeta")
        
        _, comision_monto = calcular_comision_tarjeta(monto_pagado, tipo_tarjeta, meses_sin_intereses)
        ganancia_neta = ganancia_bruta - comision_monto
    else:
        raise ValueError(f"Método de pago no válido: {metodo_pago}")
    
    return ganancia_bruta, comision_monto, ganancia_neta
