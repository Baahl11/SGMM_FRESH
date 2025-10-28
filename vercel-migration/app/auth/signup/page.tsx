import Link from 'next/link'
import { SignupForm } from '@/components/auth/SignupForm'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Crear Cuenta
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              SGMM Pro - Sistema de Gestión Médica
            </p>
          </div>

          {/* Form */}
          <SignupForm />

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <Link 
              href="/auth/login" 
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              ¿Ya tienes cuenta? Inicia sesión aquí
            </Link>
          </div>
        </div>

        {/* Bottom text */}
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Al crear una cuenta, aceptas nuestros términos y condiciones
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            © 2025 SGMM Pro. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}
