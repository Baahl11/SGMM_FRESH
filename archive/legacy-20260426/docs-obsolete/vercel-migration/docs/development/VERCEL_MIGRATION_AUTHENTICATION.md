# 🔐 VERCEL MIGRATION - AUTHENTICATION SYSTEM

**Fecha:** 2025-10-14  
**Objetivo:** Implementar sistema de autenticación completo con Supabase Auth  
**Prioridad:** 🚨 **CRÍTICA - BLOQUEADOR** para agenda multi-doctor

---

## ⚠️ **POR QUÉ ES BLOQUEADOR**

La migración de agenda implementó **Row Level Security (RLS)** en todas las tablas:

```sql
CREATE POLICY "Users can view their own doctors"
    ON doctors FOR SELECT
    USING (auth.uid() = user_id);
```

**Implicaciones:**
- ❌ Sin `auth.uid()`, no se puede leer ni insertar datos
- ❌ Seed data requiere user_id válido
- ❌ Todas las APIs de agenda requieren autenticación
- ❌ Frontend no puede funcionar sin login

**Sin autenticación = 0% de funcionalidad de agenda**

---

## 📊 **ESTADO ACTUAL**

### ✅ **Ya Configurado:**

1. **Supabase Project**
   - URL: `https://sbwpqtrxhiuucwlbozet.supabase.co`
   - Anon Key: ✅ Configurado en [`.env.local`](.env.local )
   - Service Role Key: ✅ Configurado

2. **NextAuth Setup** (parcial)
   - Package instalado: `next-auth@4.24.11`
   - Configuración básica existe
   - Providers: Credentials (email/password)

3. **Archivo [`.env.local`](.env.local )**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://sbwpqtrxhiuucwlbozet.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   DATABASE_URL=postgresql://postgres:Barcus1983$$$@db...
   ```

### ❌ **Faltante:**

1. UI de Login/Signup
2. Integración NextAuth + Supabase Auth
3. Middleware de protección de rutas
4. Session management
5. User profile
6. Testing de flujo completo

---

## 🎯 **ARQUITECTURA PROPUESTA**

### **Opción A: Supabase Auth Directo (RECOMENDADO)**

**Ventajas:**
- ✅ Integración nativa con RLS
- ✅ Menos configuración
- ✅ auth.uid() funciona automáticamente
- ✅ Tokens manejados por Supabase

**Flujo:**
```
Usuario → Supabase Auth → JWT → RLS Policies
```

**Archivos a crear:**
```
lib/
  supabase/
    client.ts          # Cliente browser
    server.ts          # Cliente server-side
    middleware.ts      # Session refresh
app/
  auth/
    login/
      page.tsx         # Login UI
    signup/
      page.tsx         # Signup UI
    callback/
      route.ts         # OAuth callback
components/
  auth/
    LoginForm.tsx
    SignupForm.tsx
    UserMenu.tsx
middleware.ts          # Route protection
```

### **Opción B: NextAuth + Supabase Adapter**

**Ventajas:**
- ✅ Más flexible (multi-provider)
- ✅ Session management built-in

**Desventajas:**
- ❌ Configuración más compleja
- ❌ Adapter puede tener issues con RLS
- ❌ Requiere sincronización manual de user_id

**No recomendado para este proyecto.**

---

## 📋 **PLAN DE IMPLEMENTACIÓN**

### **FASE 1: Setup Básico (1h)**

#### **1.1 Instalar Dependencias**

```bash
cd vercel-migration
npm install @supabase/ssr
npm install @supabase/auth-helpers-nextjs (si no está)
```

#### **1.2 Crear Supabase Clients**

**Archivo:** `lib/supabase/client.ts`
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Archivo:** `lib/supabase/server.ts`
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

#### **1.3 Crear Middleware**

**Archivo:** `middleware.ts`
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Refresh session if needed
  await supabase.auth.getSession()

  const { data: { session } } = await supabase.auth.getSession()

  // Protect routes
  const protectedRoutes = ['/dashboard', '/agenda', '/pacientes', '/tratamientos', '/inventario']
  const isProtected = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (request.nextUrl.pathname.startsWith('/auth') && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

### **FASE 2: UI de Login/Signup (1.5h)**

#### **2.1 LoginForm Component**

**Archivo:** `components/auth/LoginForm.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Login exitoso')
      router.push('/dashboard')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Cargando...' : 'Iniciar Sesión'}
      </Button>
    </form>
  )
}
```

#### **2.2 SignupForm Component**

**Archivo:** `components/auth/SignupForm.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function SignupForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Cuenta creada! Revisa tu email para confirmar.')
      router.push('/auth/login')
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
      </Button>
    </form>
  )
}
```

#### **2.3 Login Page**

**Archivo:** `app/auth/login/page.tsx`

```typescript
import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            SGMM Pro - Sistema de Gestión Médica
          </p>
        </div>
        <LoginForm />
        <div className="text-center">
          <Link href="/auth/signup" className="text-sm text-blue-600 hover:underline">
            ¿No tienes cuenta? Regístrate
          </Link>
        </div>
      </div>
    </div>
  )
}
```

#### **2.4 Signup Page**

**Archivo:** `app/auth/signup/page.tsx`

```typescript
import Link from 'next/link'
import { SignupForm } from '@/components/auth/SignupForm'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold">
            Crear Cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            SGMM Pro - Sistema de Gestión Médica
          </p>
        </div>
        <SignupForm />
        <div className="text-center">
          <Link href="/auth/login" className="text-sm text-blue-600 hover:underline">
            ¿Ya tienes cuenta? Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
```

#### **2.5 Auth Callback**

**Archivo:** `app/auth/callback/route.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

---

### **FASE 3: User Menu & Profile (1h)**

#### **3.1 UserMenu Component**

**Archivo:** `components/auth/UserMenu.tsx`

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { User } from 'lucide-react'
import { toast } from 'sonner'

export function UserMenu({ user }: { user: any }) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Sesión cerrada')
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {user?.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

#### **3.2 Integrar en Layout**

Modificar `app/layout.tsx` para incluir UserMenu en navbar.

---

### **FASE 4: Testing & Seed Data (0.5h)**

#### **4.1 Flujo de Prueba**

```bash
# 1. Levantar dev server
npm run dev

# 2. Ir a http://localhost:3000/auth/signup
# 3. Crear cuenta con email de prueba
# 4. Confirmar email (Supabase Dashboard → Authentication → Users)
# 5. Login en http://localhost:3000/auth/login
# 6. Verificar redirect a /dashboard
```

#### **4.2 Obtener user_id**

**Desde la app (DevTools Console):**
```javascript
const { data } = await fetch('/api/auth/user').then(r => r.json())
console.log('User ID:', data.user.id)
```

**O desde Supabase SQL Editor:**
```sql
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 1;
```

#### **4.3 Ejecutar Seed con user_id**

Copiar el UUID y ejecutar en Supabase SQL Editor:

```sql
DO $$
DECLARE
    default_user_id UUID := 'TU_UUID_AQUI'; -- REEMPLAZAR
    doctor_id UUID;
    consultorio_id UUID;
BEGIN
    -- [Resto del seed script...]
END $$;
```

---

## ✅ **CHECKLIST DE IMPLEMENTACIÓN**

### **Setup Básico**
- [ ] Instalar `@supabase/ssr`
- [ ] Crear `lib/supabase/client.ts`
- [ ] Crear `lib/supabase/server.ts`
- [ ] Crear `middleware.ts`

### **UI Components**
- [ ] Crear `components/auth/LoginForm.tsx`
- [ ] Crear `components/auth/SignupForm.tsx`
- [ ] Crear `components/auth/UserMenu.tsx`

### **Pages**
- [ ] Crear `app/auth/login/page.tsx`
- [ ] Crear `app/auth/signup/page.tsx`
- [ ] Crear `app/auth/callback/route.ts`

### **Testing**
- [ ] Signup funciona
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Middleware protege rutas
- [ ] Session persiste en refresh
- [ ] Obtener user_id exitosamente

### **Seed Data**
- [ ] Ejecutar seed con user_id real
- [ ] Verificar doctor creado
- [ ] Verificar consultorio creado
- [ ] Verificar tipos de cita creados
- [ ] Verificar horarios creados

---

## 🚨 **ERRORES COMUNES**

### **Error: "Failed to fetch session"**
**Causa:** Cookies no configuradas correctamente  
**Solución:** Verificar [`.env.local`](.env.local ) tiene `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### **Error: "Invalid JWT"**
**Causa:** Token expirado o inválido  
**Solución:** Hacer logout y login nuevamente

### **Error: "User not found" en RLS**
**Causa:** `auth.uid()` devuelve NULL  
**Solución:** Verificar que la sesión esté activa y el JWT sea válido

### **Error: "Row level security policy violation"**
**Causa:** Intentar acceder a datos de otro usuario  
**Solución:** Verificar que `user_id` coincida con `auth.uid()`

---

## 📚 **RECURSOS**

- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth
- **Supabase Auth Helpers Next.js:** https://supabase.com/docs/guides/auth/auth-helpers/nextjs
- **Next.js Middleware:** https://nextjs.org/docs/app/building-your-application/routing/middleware
- **shadcn/ui Forms:** https://ui.shadcn.com/docs/components/form

---

## 🎯 **CRITERIOS DE ÉXITO**

✅ **Autenticación Completa cuando:**
1. Usuario puede registrarse (signup)
2. Usuario puede iniciar sesión (login)
3. Usuario puede cerrar sesión (logout)
4. Session persiste entre refreshes
5. Rutas protegidas requieren login
6. Se puede obtener `user_id` del usuario autenticado
7. Seed data ejecutado exitosamente con user_id real
8. Queries a doctores/consultorios devuelven datos

---

**Última actualización:** 2025-10-14  
**Estado:** ⏳ PENDIENTE  
**Prioridad:** 🚨 CRÍTICA - BLOQUEADOR  
**Tiempo estimado:** 4 horas  
**Siguiente paso:** Implementar FASE 1 - Setup Básico
