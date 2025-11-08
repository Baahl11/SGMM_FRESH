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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Configuración de Horarios
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Define tus días y horarios de atención
        </p>
      </div>

      {/* Slot Configuration */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Clock className="w-4 h-4 inline mr-1" />
            Duración del slot (minutos)
          </label>
          <input
            type="number"
            value={slotDuration}
            onChange={(e) => onChange({ availableDays, timeRanges, slotDuration: parseInt(e.target.value) || 30, bufferTime })}
            min="5"
            step="5"
            className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Tiempo base para cada cita
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Clock className="w-4 h-4 inline mr-1" />
            Tiempo buffer (minutos)
          </label>
          <input
            type="number"
            value={bufferTime}
            onChange={(e) => onChange({ availableDays, timeRanges, slotDuration, bufferTime: parseInt(e.target.value) || 0 })}
            min="0"
            step="5"
            className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
              className={`
                border rounded-xl transition-all
                ${isActive
                  ? 'border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50'
                }
              `}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleDayToggle(day.key)}
                      className={`
                        relative w-12 h-6 rounded-full transition-colors
                        ${isActive ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
                      `}
                    >
                      <motion.div
                        layout
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                        animate={{ left: isActive ? '28px' : '4px' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>
                    <span className={`font-medium ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                      {day.label}
                    </span>
                  </div>

                  {isActive && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => handleAddTimeRange(day.key)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-all"
                    >
                      <Plus className="w-4 h-4" />
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
                      <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                        No hay horarios configurados. Agrega al menos uno.
                      </p>
                    ) : (
                      ranges.map((range, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="time"
                              value={range.start}
                              onChange={(e) => handleTimeRangeChange(day.key, index, 'start', e.target.value)}
                              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                            />
                            <span className="text-gray-500 dark:text-gray-400">a</span>
                            <input
                              type="time"
                              value={range.end}
                              onChange={(e) => handleTimeRangeChange(day.key, index, 'end', e.target.value)}
                              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                            />
                          </div>
                          <button
                            onClick={() => handleRemoveTimeRange(day.key, index)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
