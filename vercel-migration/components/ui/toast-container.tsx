'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Toast, ToastProps } from './toast'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  warning: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

interface ToastData extends Omit<ToastProps, 'onClose'> {}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((
    message: string,
    type: ToastType = 'info',
    title?: string,
    duration: number = 3000
  ) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: ToastData = {
      id,
      message,
      type,
      title,
      duration
    }
    setToasts((prev) => [...prev, newToast])
  }, [])

  const success = useCallback((message: string, title?: string) => {
    showToast(message, 'success', title)
  }, [showToast])

  const error = useCallback((message: string, title?: string) => {
    showToast(message, 'error', title)
  }, [showToast])

  const warning = useCallback((message: string, title?: string) => {
    showToast(message, 'warning', title)
  }, [showToast])

  const info = useCallback((message: string, title?: string) => {
    showToast(message, 'info', title)
  }, [showToast])

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
