'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function SignupForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()

    // Validaciones
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            name: email.split('@')[0], // Usar parte del email como nombre por defecto
          }
        },
      })
      
      console.log('Signup response:', { data, error })

      if (error) {
        toast.error('Error al crear cuenta', {
          description: error.message
        })
        return
      }

      if (data.user) {
        // Verificar si necesita confirmar email
        if (data.user.identities && data.user.identities.length === 0) {
          toast.error('Este email ya está registrado', {
            description: 'Por favor inicia sesión'
          })
          return
        }

        toast.success('¡Cuenta creada exitosamente!', {
          description: 'Ahora selecciona tu plan para comenzar'
        })
        
        // Redirigir a selección de plan para iniciar trial
        setTimeout(() => {
          router.push('/select-trial-plan')
        }, 1500)
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('Error inesperado', {
        description: 'Por favor intenta nuevamente'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          autoComplete="email"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          autoComplete="new-password"
          minLength={6}
        />
        <p className="text-xs text-muted-foreground">
          Mínimo 6 caracteres
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
          autoComplete="new-password"
        />
      </div>

      <Button 
        type="submit" 
        disabled={loading} 
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creando cuenta...
          </>
        ) : (
          'Crear Cuenta'
        )}
      </Button>
    </form>
  )
}
