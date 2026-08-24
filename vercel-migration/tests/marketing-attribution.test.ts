import { afterEach, describe, expect, it } from 'vitest'
import {
  captureMarketingAttribution,
  normalizeMarketingAttribution,
  readStoredMarketingAttribution,
} from '@/lib/marketing/attribution'

function createStorage(): Storage {
  const values = new Map<string, string>()

  return {
    get length() {
      return values.size
    },
    clear() {
      values.clear()
    },
    getItem(key) {
      return values.get(key) ?? null
    },
    key(index) {
      return [...values.keys()][index] ?? null
    },
    removeItem(key) {
      values.delete(key)
    },
    setItem(key, value) {
      values.set(key, value)
    },
  }
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'window')
  Reflect.deleteProperty(globalThis, 'document')
})

function validContext() {
  const now = Date.now()
  return {
    anonymousId: 'anon-123',
    firstTouch: {
      source: 'google',
      medium: 'cpc',
      campaign: 'trial',
      content: 'calculator',
      term: 'agenda medica',
      gclid: 'gclid-1',
      fbclid: null,
      landingPage: '/calculadora-inasistencias',
      referrer: 'https://google.com/search',
    },
    lastTouch: {
      source: 'google',
      medium: 'cpc',
      campaign: 'trial',
      content: 'calculator',
      term: 'agenda medica',
      gclid: 'gclid-1',
      fbclid: null,
      landingPage: 'prueba-gratis',
      referrer: 'https://agendamedpro.com/calculadora-inasistencias',
    },
    calculator: {
      monthlyLoss: 12800,
      averageTicket: 800,
      missedAppointments: 16,
      appointmentsToCover: 2,
      recoverableMonthly: 8960,
    },
    savedAt: now,
    expiresAt: now + 60_000,
  }
}

describe('marketing attribution normalization', () => {
  it('acepta y conserva un contexto válido', () => {
    expect(normalizeMarketingAttribution(validContext())).toMatchObject({
      anonymousId: 'anon-123',
      firstTouch: { source: 'google', campaign: 'trial' },
      calculator: { monthlyLoss: 12800, appointmentsToCover: 2 },
    })
  })

  it('descarta valores manipulados fuera de rango', () => {
    const context = validContext()
    context.calculator.monthlyLoss = 999_999_999_999
    context.calculator.appointmentsToCover = -1

    expect(normalizeMarketingAttribution(context)?.calculator).toMatchObject({
      monthlyLoss: null,
      appointmentsToCover: null,
    })
  })

  it('rechaza atribución vencida', () => {
    const context = validContext()
    context.expiresAt = Date.now() - 1
    expect(normalizeMarketingAttribution(context)).toBeNull()
  })

  it('conserva UTM y cálculo sin incluirlos en la URL de destino', () => {
    const localStorage = createStorage()
    const sessionStorage = createStorage()
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        localStorage,
        sessionStorage,
        location: {
          pathname: '/calculadora-inasistencias',
        },
        crypto: {
          randomUUID: () => 'anonymous-test',
        },
      },
    })
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: {
        referrer: 'https://facebook.com/',
      },
    })

    captureMarketingAttribution(new URLSearchParams({
      utm_source: 'meta',
      utm_medium: 'paid_social',
      utm_campaign: 'calculator_no_shows_mx',
      utm_content: 'static_loss_01',
      monthly_loss: '25600',
      monthly_no_shows: '32',
      average_ticket: '800',
      recoverable_monthly: '17920',
      appointments_to_cover_plan: '2',
    }))

    expect(readStoredMarketingAttribution()).toMatchObject({
      firstTouch: {
        source: 'meta',
        medium: 'paid_social',
        campaign: 'calculator_no_shows_mx',
        content: 'static_loss_01',
      },
      calculator: {
        monthlyLoss: 25600,
        missedAppointments: 32,
        averageTicket: 800,
        recoverableMonthly: 17920,
        appointmentsToCover: 2,
      },
    })
    expect('/prueba-gratis?source=calculator').not.toContain('monthly_loss')
    expect('/prueba-gratis?source=calculator').not.toContain('utm_')
  })
})
