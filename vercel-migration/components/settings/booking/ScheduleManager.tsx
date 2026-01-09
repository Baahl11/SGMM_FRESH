'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Plus, X } from 'lucide-react'

const DAYS = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
]

interface TimeRange {
  start: string
  end: string
}

interface ScheduleManagerProps {
  availableDays: string[]
  timeRanges: Record<string, TimeRange[]>
  slotDuration: number
  bufferTime: number
  onChange: (data: {
    availableDays: string[]
    timeRanges: Record<string, TimeRange[]>
    slotDuration: number
    bufferTime: number
  }) => void
}

export default function ScheduleManager({
  availableDays,
  timeRanges,
  slotDuration,
  bufferTime,
  onChange
}: ScheduleManagerProps) {
  const handleDayToggle = (dayKey: string) => {
    const newDays = availableDays.includes(dayKey)
      ? availableDays.filter(d => d !== dayKey)
      : [...availableDays, dayKey]
    
    onChange({ availableDays: newDays, timeRanges, slotDuration, bufferTime })
  }

  const handleAddTimeRange = (dayKey: string) => {
    const newRanges = {
      ...timeRanges,
      [dayKey]: [
        ...(timeRanges[dayKey] || []),
        { start: '09:00', end: '17:00' }
      ]
    }
    onChange({ availableDays, timeRanges: newRanges, slotDuration, bufferTime })
  }

  const handleRemoveTimeRange = (dayKey: string, index: number) => {
    const newRanges = {
      ...timeRanges,
      [dayKey]: (timeRanges[dayKey] || []).filter((_, i) => i !== index)
    }
    onChange({ availableDays, timeRanges: newRanges, slotDuration, bufferTime })
  }

  const handleTimeRangeChange = (
    dayKey: string,
    index: number,
    field: 'start' | 'end',
    value: string
  ) => {
    const newRanges = {
      ...timeRanges,
      [dayKey]: (timeRanges[dayKey] || []).map((range, i) =>
        i === index ? { ...range, [field]: value } : range
      )
    }
    onChange({ availableDays, timeRanges: newRanges, slotDuration, bufferTime })
  }

  return (
    <div className="space-y-6 text-white">
      <div>
        <h3 className="text-xl font-semibold">Configuración de horarios</h3>
        <p className="text-sm text-white/60">
          Define tus días y horarios de atención
        </p>
      </div>

      {/* Slot Configuration */}
      <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 md:grid-cols-2">
        <div>
          <label className="block text-xs uppercase tracking-[0.35em] text-white/60">
            <Clock className="mr-2 inline h-3.5 w-3.5" /> Duración del slot (minutos)
          </label>
          <input
            type="number"
            value={slotDuration}
            onChange={(e) => onChange({ availableDays, timeRanges, slotDuration: parseInt(e.target.value) || 30, bufferTime })}
            min="5"
            step="5"
            className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white focus:border-emerald-300/60 focus:outline-none focus:ring-emerald-300/20"
          />
          <p className="mt-1 text-xs text-white/60">
            Tiempo base para cada cita
          </p>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-[0.35em] text-white/60">
            <Clock className="mr-2 inline h-3.5 w-3.5" /> Tiempo buffer (minutos)
          </label>
          <input
            type="number"
            value={bufferTime}
            onChange={(e) => onChange({ availableDays, timeRanges, slotDuration, bufferTime: parseInt(e.target.value) || 0 })}
            min="0"
            step="5"
            className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white focus:border-emerald-300/60 focus:outline-none focus:ring-emerald-300/20"
          />
          <p className="mt-1 text-xs text-white/60">
            Descanso entre citas
          </p>
        </div>
      </div>

      {/* Days Configuration */}
      <div className="space-y-3">
        {DAYS.map((day) => {
          const isActive = availableDays.includes(day.key)
          const ranges = timeRanges[day.key] || []

          return (
            <motion.div
              key={day.key}
              layout
              className={`rounded-3xl border p-4 transition-all ${isActive ? 'border-emerald-300/50 bg-white/10' : 'border-white/10 bg-white/5'}`}
            >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleDayToggle(day.key)}
                      className={`relative h-6 w-12 rounded-full border border-white/20 transition ${isActive ? 'bg-emerald-400/60' : 'bg-white/10'}`}
                    >
                      <motion.div
                        layout
                        className="absolute top-1 h-4 w-4 rounded-full bg-white shadow"
                        animate={{ left: isActive ? '28px' : '4px' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>
                    <span className={`font-medium ${isActive ? 'text-white' : 'text-white/50'}`}>
                      {day.label}
                    </span>
                  </div>

                  {isActive && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => handleAddTimeRange(day.key)}
                      className="aura-cta aura-cta--ghost px-3 py-1.5 text-xs"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Agregar horario</span>
                    </motion.button>
                  )}
                </div>

                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    {ranges.length === 0 ? (
                      <p className="py-2 text-sm text-white/60">
                        No hay horarios configurados. Agrega al menos uno.
                      </p>
                    ) : (
                      ranges.map((range, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="time"
                              value={range.start}
                              onChange={(e) => handleTimeRangeChange(day.key, index, 'start', e.target.value)}
                              className="w-full rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-white focus:border-emerald-300/60 focus:outline-none focus:ring-emerald-300/20"
                            />
                            <span className="text-white/60">a</span>
                            <input
                              type="time"
                              value={range.end}
                              onChange={(e) => handleTimeRangeChange(day.key, index, 'end', e.target.value)}
                              className="w-full rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-white focus:border-emerald-300/60 focus:outline-none focus:ring-emerald-300/20"
                            />
                          </div>
                          <button
                            onClick={() => handleRemoveTimeRange(day.key, index)}
                            className="rounded-2xl border border-white/10 p-2 text-white/70 transition hover:border-rose-400/60 hover:text-rose-200"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
