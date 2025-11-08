# 🔐 Configuración de Google OAuth

Esta guía te ayudará a configurar Google OAuth para permitir que los usuarios se registren e inicien sesión con sus cuentas de Google.

---

## 📋 Prerrequisitos

- Cuenta de Google (Gmail)
- Acceso al proyecto en Vercel
- 10-15 minutos

---

## 🚀 PASO 1: Crear Proyecto en Google Cloud Console

### 1.1 Ir a Google Cloud Console

Abre en tu navegador:
```
https://console.cloud.google.com/
```

### 1.2 Crear Nuevo Proyecto

1. Click en el selector de proyectos (arriba a la izquierda)
2. Click en **"New Project"** (Nuevo Proyecto)
3. Nombre del proyecto: `AgendaMedPro OAuth`
4. Click en **"Create"** (Crear)
5. Espera 30 segundos a que se cree el proyecto

### 1.3 Seleccionar el Proyecto

- En el selector de proyectos, selecciona **"AgendaMedPro OAuth"**

---

## 🔑 PASO 2: Configurar OAuth Consent Screen

### 2.1 Ir a OAuth Consent Screen

```
https://console.cloud.google.com/apis/credentials/consent
```

O navega manualmente:
- **APIs & Services** → **OAuth consent screen**

### 2.2 Configurar la Pantalla de Consentimiento

1. **User Type**: Selecciona **"External"** → Click **"Create"**

2. **App Information**:
   - App name: `AgendaMedPro`
   - User support email: Tu email (ejemplo: `contacto@agendamedpro.com`)
   - App logo: (Opcional - puedes subir logo después)

3. **App Domain** (en producción):
   - Application home page: `https://agendamedpro.com`
   - Application privacy policy link: `https://agendamedpro.com/privacy`
   - Application terms of service link: `https://agendamedpro.com/terms`

4. **Developer contact information**:
   - Email: Tu email de contacto

5. Click **"Save and Continue"**

### 2.3 Scopes (Permisos)

1. Click **"Add or Remove Scopes"**
2. Busca y selecciona:
   - ✅ `email` - Ver tu dirección de correo electrónico
   - ✅ `profile` - Ver tu información de perfil básica
   - ✅ `openid` - OpenID Connect

3. Click **"Update"** → **"Save and Continue"**

### 2.4 Test Users (Opcional - Solo Desarrollo)

Si tu app está en modo "Testing", agrega test users:
1. Click **"Add Users"**
2. Agrega emails de prueba (tu email, colaboradores)
3. Click **"Save and Continue"**

### 2.5 Resumen

- Revisa la configuración
- Click **"Back to Dashboard"**

---

## 🔐 PASO 3: Crear Credenciales OAuth

### 3.1 Ir a Credentials

```
https://console.cloud.google.com/apis/credentials
```

O navega: **APIs & Services** → **Credentials**

### 3.2 Crear OAuth Client ID

1. Click en **"+ Create Credentials"**
2. Selecciona **"OAuth client ID"**

3. **Application Type**: `Web application`

4. **Name**: `AgendaMedPro Web`

5. **Authorized JavaScript origins** (Para desarrollo local):
   ```
   http://localhost:3000
   ```

6. **Authorized redirect URIs** (Para desarrollo local):
   ```
   http://localhost:3000/api/auth/callback/google
   ```

7. Click **"Create"**

### 3.3 Guardar las Credenciales

Se mostrará un modal con:
- ✅ **Client ID**: `xxxxx-xxxxxx.apps.googleusercontent.com`
- ✅ **Client Secret**: `GOCSPX-xxxxxxxxxxxxxxx`

**⚠️ IMPORTANTE**: Copia ambos valores, los necesitarás en el siguiente paso.

---

## 📝 PASO 4: Agregar Variables de Entorno en Vercel

### 4.1 Ir a Vercel Project Settings

1. Abre: `https://vercel.com/tu-usuario/agendamedpro`
2. Click en **"Settings"** (⚙️)
3. Click en **"Environment Variables"**

### 4.2 Agregar las Variables

Agrega estas **3 variables nuevas**:

#### Variable 1: GOOGLE_CLIENT_ID
- **Key**: `GOOGLE_CLIENT_ID`
- **Value**: Pega el Client ID que copiaste
- Ejemplo: `123456789-abc123xyz.apps.googleusercontent.com`
- Selecciona: ✅ Production, ✅ Preview, ✅ Development
- Click **"Save"**

#### Variable 2: GOOGLE_CLIENT_SECRET
- **Key**: `GOOGLE_CLIENT_SECRET`
- **Value**: Pega el Client Secret que copiaste
- Ejemplo: `GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz`
- Selecciona: ✅ Production, ✅ Preview, ✅ Development
- Click **"Save"**

#### Variable 3: NEXTAUTH_SECRET
- **Key**: `NEXTAUTH_SECRET`
- **Value**: Genera un secret aleatorio

**Para generar NEXTAUTH_SECRET**, usa uno de estos métodos:

**Opción A - PowerShell (Windows)**:
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Opción B - Bash/Terminal (Mac/Linux)**:
```bash
openssl rand -base64 32
```

**Opción C - Online**:
Ve a: https://generate-secret.vercel.app/32

- Selecciona: ✅ Production, ✅ Preview, ✅ Development
- Click **"Save"**

---

## 🌐 PASO 5: Agregar URLs de Producción

### 5.1 Actualizar Google OAuth con URL de Producción

1. Vuelve a Google Cloud Console → Credentials
2. Click en tu OAuth Client ID (`AgendaMedPro Web`)
3. En **"Authorized JavaScript origins"**, agrega:
   ```
   https://agendamedpro.com
   ```

4. En **"Authorized redirect URIs"**, agrega:
   ```
   https://agendamedpro.com/api/auth/callback/google
   ```

5. Click **"Save"**

### 5.2 Actualizar NEXTAUTH_URL en Vercel

1. En Vercel → Settings → Environment Variables
2. Busca `NEXTAUTH_URL` (si existe) o créala:
   - **Key**: `NEXTAUTH_URL`
   - **Value**: `https://agendamedpro.com`
   - Solo selecciona: ✅ Production
   - Click **"Save"**

---

## 🔄 PASO 6: Redesplegar la Aplicación

### Opción A: Redeploy desde Vercel Dashboard
1. Ve a tu proyecto en Vercel
2. Click en **"Deployments"**
3. Click en los **"..."** (tres puntos) del último deployment
4. Click **"Redeploy"**
5. Confirma el redeploy

### Opción B: Redeploy desde Terminal
```powershell
cd C:\Users\gm_me\SGMM_FRESH\vercel-migration
npx vercel --prod
```

**⏱️ Espera**: El deployment tarda 2-3 minutos.

---

## ✅ PASO 7: Probar el Login con Google

### 7.1 Probar en Producción

1. Abre: `https://agendamedpro.com/select-trial-plan`
2. Selecciona un plan
3. Click en **"🎉 Iniciar Prueba Gratis"**
4. Deberías ver el botón **"Continuar con Google"**
5. Click en **"Continuar con Google"**
6. Selecciona tu cuenta de Google
7. Acepta los permisos
8. Deberías ser redirigido al dashboard

### 7.2 Verificar en Base de Datos

1. Abre Supabase → Table Editor → `users`
2. Busca tu email
3. Deberías ver:
   - ✅ `email`: tu email de Google
   - ✅ `name`: tu nombre de Google
   - ✅ `trial_ends_at`: Fecha de hoy + 7 días
   - ✅ `role`: medico

---

## 🐛 Troubleshooting (Solución de Problemas)

### Error: "Error 400: redirect_uri_mismatch"

**Causa**: La URL de callback no coincide con la configurada en Google.

**Solución**:
1. Ve a Google Cloud Console → Credentials
2. Verifica que la redirect URI sea exactamente:
   ```
   https://agendamedpro.com/api/auth/callback/google
   ```
   (Sin "/" al final, con `/api/auth/callback/google`)

### Error: "Access blocked: This app's request is invalid"

**Causa**: OAuth Consent Screen no está configurado correctamente.

**Solución**:
1. Ve a Google Cloud Console → OAuth consent screen
2. Completa todos los campos requeridos
3. Asegúrate de tener al menos 1 scope (`email`, `profile`, `openid`)

### Error: "Error de Autenticación" en la app

**Causa**: Variables de entorno incorrectas o faltantes.

**Verificación**:
1. En Vercel → Settings → Environment Variables
2. Confirma que existan:
   - ✅ `GOOGLE_CLIENT_ID`
   - ✅ `GOOGLE_CLIENT_SECRET`
   - ✅ `NEXTAUTH_SECRET`
3. Si faltan, agrégalas y redespliega

### El usuario no se crea en la base de datos

**Causa**: Puede ser un problema con el callback de NextAuth.

**Verificación**:
1. Abre Vercel → Deployment → Functions
2. Click en el último deployment
3. Busca logs de `/api/auth/callback/google`
4. Busca errores en los logs

**Solución**:
- Verifica que `SUPABASE_SERVICE_ROLE_KEY` esté configurada
- Verifica que la tabla `users` exista en Supabase

---

## 📚 Recursos Adicionales

- **Google Cloud Console**: https://console.cloud.google.com/
- **NextAuth.js Docs**: https://next-auth.js.org/providers/google
- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth

---

## 🎉 ¡Listo!

Ahora tus usuarios pueden registrarse e iniciar sesión con Google OAuth en AgendaMedPro. El sistema automáticamente:

✅ Crea una cuenta cuando un usuario nuevo inicia sesión con Google
✅ Asigna 7 días de prueba gratis
✅ Permite al usuario usar todas las funciones durante el trial
✅ Envía emails de bienvenida y recordatorios

---

**¿Necesitas ayuda?** Contacta a soporte@agendamedpro.com
