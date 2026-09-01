import { describe, expect, it } from 'vitest'
import {
  STEP_ORDER,
  visibleSteps,
  clampStepIndex,
  validateStep,
  isStepValid,
  buildPayload,
  emptyFormState,
  formStateFromRecord,
  type FormState,
} from '@/components/patients/medical-record/consultation-wizard/model'

// Helper: base form with the minimum to be a valid consultation.
function validForm(overrides: Partial<FormState> = {}): FormState {
  return {
    ...emptyFormState(),
    tipoConsulta: 'evolucion',
    padecimientoActual: 'Dolor de cabeza de 3 días',
    diagnosticoDescripcion: 'Cefalea tensional',
    medicoNombre: 'Dra. Ana López',
    ...overrides,
  }
}

describe('visibleSteps', () => {
  it('incluye "antecedentes" solo cuando es primera vez (6 pasos)', () => {
    const steps = visibleSteps(emptyFormState({ tipoConsulta: 'primera_vez' }))
    expect(steps).toEqual([
      'tipo',
      'signos',
      'antecedentes',
      'diagnostico',
      'tratamiento',
      'revision',
    ])
  })

  it('omite "antecedentes" en evolución (5 pasos)', () => {
    const steps = visibleSteps(emptyFormState({ tipoConsulta: 'evolucion' }))
    expect(steps).toEqual(['tipo', 'signos', 'diagnostico', 'tratamiento', 'revision'])
    expect(steps).not.toContain('antecedentes')
  })

  it('omite "antecedentes" en interconsulta (5 pasos)', () => {
    expect(visibleSteps(emptyFormState({ tipoConsulta: 'interconsulta' }))).not.toContain(
      'antecedentes',
    )
  })

  it('siempre es un subconjunto ordenado de STEP_ORDER', () => {
    const steps = visibleSteps(emptyFormState({ tipoConsulta: 'primera_vez' }))
    expect(steps).toEqual(STEP_ORDER.filter((s) => steps.includes(s)))
  })
})

describe('clampStepIndex', () => {
  it('recorta un índice mayor al último paso visible', () => {
    // evolución = 5 pasos → índices válidos 0..4
    expect(clampStepIndex(5, emptyFormState({ tipoConsulta: 'evolucion' }))).toBe(4)
    expect(clampStepIndex(99, emptyFormState({ tipoConsulta: 'evolucion' }))).toBe(4)
  })

  it('recorta índices negativos a 0', () => {
    expect(clampStepIndex(-3, emptyFormState())).toBe(0)
  })

  it('deja pasar un índice dentro de rango', () => {
    expect(clampStepIndex(3, emptyFormState({ tipoConsulta: 'primera_vez' }))).toBe(3)
  })
})

describe('validateStep', () => {
  it('"tipo" siempre es válido', () => {
    expect(validateStep('tipo', emptyFormState())).toEqual({})
  })

  it('"antecedentes" siempre es válido (opcional)', () => {
    expect(validateStep('antecedentes', emptyFormState())).toEqual({})
  })

  describe('signos', () => {
    it('es válido cuando está vacío', () => {
      expect(validateStep('signos', emptyFormState())).toEqual({})
    })

    it('acepta valores fisiológicos normales', () => {
      const f = emptyFormState()
      f.signosVitales.frecuencia_cardiaca = '78'
      f.signosVitales.temperatura = '36.7'
      f.signosVitales.saturacion_oxigeno = '98'
      expect(validateStep('signos', f)).toEqual({})
    })

    it('marca una frecuencia cardíaca imposible', () => {
      const f = emptyFormState()
      f.signosVitales.frecuencia_cardiaca = '400'
      expect(validateStep('signos', f)).toHaveProperty('frecuencia_cardiaca')
    })

    it('marca una temperatura imposible', () => {
      const f = emptyFormState()
      f.signosVitales.temperatura = '52'
      expect(validateStep('signos', f)).toHaveProperty('temperatura')
    })

    it('marca una saturación fuera de 40–100', () => {
      const f = emptyFormState()
      f.signosVitales.saturacion_oxigeno = '35'
      expect(validateStep('signos', f)).toHaveProperty('saturacion_oxigeno')
    })
  })

  describe('diagnostico', () => {
    it('exige el padecimiento actual', () => {
      const f = validForm({ padecimientoActual: '   ' })
      expect(validateStep('diagnostico', f)).toHaveProperty('padecimiento_actual')
    })

    it('exige CIE-10 o descripción', () => {
      const f = validForm({ diagnosticoCIE10: '', diagnosticoDescripcion: '' })
      expect(validateStep('diagnostico', f)).toHaveProperty('diagnostico')
    })

    it('es válido con padecimiento + solo CIE-10', () => {
      const f = validForm({ diagnosticoCIE10: 'R51', diagnosticoDescripcion: '' })
      expect(validateStep('diagnostico', f)).toEqual({})
    })

    it('es válido con padecimiento + solo descripción', () => {
      expect(validateStep('diagnostico', validForm())).toEqual({})
    })
  })

  describe('tratamiento', () => {
    it('es válido sin medicamentos', () => {
      expect(validateStep('tratamiento', validForm())).toEqual({})
    })

    it('marca la fila del medicamento sin nombre', () => {
      const f = validForm({
        medicamentos: [
          { nombre: 'Paracetamol', dosis: '500mg', via: 'oral', frecuencia: 'c/8h', duracion: '5d' },
          { nombre: '  ', dosis: '', via: 'oral', frecuencia: '', duracion: '' },
        ],
      })
      const errors = validateStep('tratamiento', f)
      expect(errors).toHaveProperty('med_nombre_1')
      expect(errors).not.toHaveProperty('med_nombre_0')
    })
  })

  describe('revision', () => {
    it('exige el nombre del médico', () => {
      expect(validateStep('revision', validForm({ medicoNombre: '' }))).toHaveProperty(
        'medico_nombre',
      )
    })

    it('es válido con nombre del médico', () => {
      expect(validateStep('revision', validForm())).toEqual({})
    })
  })
})

describe('isStepValid', () => {
  it('es true cuando validateStep no devuelve errores', () => {
    expect(isStepValid('revision', validForm())).toBe(true)
  })

  it('es false cuando hay errores', () => {
    expect(isStepValid('revision', validForm({ medicoNombre: '' }))).toBe(false)
  })
})

describe('buildPayload', () => {
  it('incluye antecedentes solo en primera vez', () => {
    const primera = buildPayload(validForm({ tipoConsulta: 'primera_vez' }), 'pat-1')
    expect(primera.antecedentes).toBeDefined()

    const evolucion = buildPayload(validForm({ tipoConsulta: 'evolucion' }), 'pat-1')
    expect(evolucion.antecedentes).toBeUndefined()
  })

  it('convierte los signos vitales de string a number|null', () => {
    const f = validForm()
    f.signosVitales.frecuencia_cardiaca = '72'
    f.signosVitales.peso = '70.5'
    const payload = buildPayload(f, 'pat-1')
    expect(payload.signos_vitales.frecuencia_cardiaca).toBe(72)
    expect(payload.signos_vitales.peso).toBe(70.5)
    expect(payload.signos_vitales.temperatura).toBeNull()
  })

  it('propaga patient_id, tipo y campos de texto', () => {
    const payload = buildPayload(validForm(), 'pat-42')
    expect(payload.patient_id).toBe('pat-42')
    expect(payload.tipo_consulta).toBe('evolucion')
    expect(payload.padecimiento_actual).toBe('Dolor de cabeza de 3 días')
    expect(payload.medico_nombre).toBe('Dra. Ana López')
  })
})

describe('formStateFromRecord', () => {
  it('rehidrata un record existente a FormState (números a string)', () => {
    const state = formStateFromRecord({
      tipo_consulta: 'primera_vez',
      signos_vitales: { frecuencia_cardiaca: 80, temperatura: 37 },
      antecedentes: { alergias: ['Penicilina'], heredo_familiares: 'DM2' },
      padecimiento_actual: 'Tos',
      diagnostico_cie10: 'J00',
      tratamiento: [
        { nombre: 'Loratadina', dosis: '10mg', via: 'oral', frecuencia: 'c/24h', duracion: '7d' },
      ],
      medico_nombre: 'Dr. Ruiz',
    })
    expect(state.tipoConsulta).toBe('primera_vez')
    expect(state.signosVitales.frecuencia_cardiaca).toBe('80')
    expect(state.signosVitales.peso).toBe('')
    expect(state.antecedentes.alergias).toEqual(['Penicilina'])
    expect(state.medicamentos).toHaveLength(1)
    expect(state.medicoNombre).toBe('Dr. Ruiz')
  })

  it('emptyFormState aplica overrides', () => {
    expect(emptyFormState({ tipoConsulta: 'interconsulta' }).tipoConsulta).toBe('interconsulta')
    expect(emptyFormState().tipoConsulta).toBe('evolucion')
  })
})
