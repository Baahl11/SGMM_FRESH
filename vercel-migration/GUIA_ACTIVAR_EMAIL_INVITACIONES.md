# 🚀 Guía: Activar Envío de Invitaciones por Email

## 📊 Estado Actual (13 Nov 2025)

### ✅ Lo que SÍ funciona:
- ✅ API de invitaciones (`/api/team/members`) crea registros correctamente
- ✅ Tokens de invitación se generan y guardan en base de datos
- ✅ Templates HTML de email están listos y probados
- ✅ Servicio de email (`emailService`) está configurado
- ✅ UI para invitar miembros funciona perfectamente

### ❌ El único problema:
- ❌ **SendGrid rechaza emails: "Maximum credits exceeded"**
- La cuenta de SendGrid no tiene créditos disponibles para enviar

---

## 🎯 Soluciones

### **OPCIÓN 1: Recargar SendGrid** (5 minutos)

1. Ve a [app.sendgrid.com](https://app.sendgrid.com)
2. Login con tu cuenta
3. Settings → Billing
4. Compra créditos o actualiza el plan
5. **¡Listo!** Las invitaciones empezarán a enviarse automáticamente

**Costos aproximados:**
- Plan Free: 100 emails/día gratis (pero puede que ya lo agotaste)
- Plan Essentials: $19.95/mes - 50,000 emails/mes
- Plan Pro: $89.95/mes - 100,000 emails/mes

---

### **OPCIÓN 2: Usar Twilio/SendGrid desde tu cuenta Twilio** (Recomendado)

Ya tienes credenciales de Twilio configuradas. Twilio ahora es dueño de SendGrid y puedes enviar emails desde la misma cuenta:

#### Pasos:

1. **Obtén tu SendGrid API Key desde Twilio:**
   - Ve a [console.twilio.com](https://console.twilio.com)
   - Busca "SendGrid Email API" en el menú
   - Genera un nuevo API Key
   - Copia la key (empieza con `SG.`)

2. **Agrégala a Vercel:**
   ```bash
   vercel env add SENDGRID_API_KEY
   # Pega tu nueva API key cuando te lo pida
   # Selecciona: Production, Preview, Development
   ```

3. **Verifica el email remitente:**
   ```bash
   vercel env add SENDGRID_FROM_EMAIL
   # Ejemplo: noreply@agendamedpro.com
   ```

4. **Redeploy:**
   ```bash
   vercel --prod
   ```

5. **Prueba las invitaciones:**
   - Ve a Dashboard → Ajustes → Equipo
   - Invita un email de prueba
   - Revisa que llegue el correo

---

### **OPCIÓN 3: Usar SMTP con tu email personal** (Alternativa gratis)

Si no quieres pagar por SendGrid, puedes usar tu email de Gmail/Outlook:

#### Para Gmail:

1. **Activa verificación en 2 pasos:**
   - [myaccount.google.com/security](https://myaccount.google.com/security)

2. **Genera contraseña de aplicación:**
   - Busca "Contraseñas de aplicaciones"
   - Crea una para "Mail"
   - Copia la contraseña (16 caracteres)

3. **Configura en la app:**
   - Ve a Dashboard → Ajustes → Notificaciones
   - Selecciona "SMTP Tradicional"
   - Llena:
     - Email remitente: `tu-email@gmail.com`
     - Servidor SMTP: `smtp.gmail.com`
     - Puerto: `587`
     - Usuario: `tu-email@gmail.com`
     - Contraseña: (la de 16 caracteres que generaste)

4. **Guarda y prueba**

**Límites de Gmail:**
- 500 emails por día
- Puede marcar como spam si envías muchos
- No recomendado para producción a gran escala

---

## 🧪 Cómo Probar que Funciona

### Opción A: Desde el script de prueba

```bash
cd vercel-migration
npx ts-node --project tsconfig.scripts.json -r tsconfig-paths/register scripts/run_team_invite_test.ts
```

**Resultado esperado:**
```
✅ SendGrid configured
🚀 Creating temporary owner account...
✅ Owner account ready
✅ Invitation record created
📧 Dispatching invitation email...
✅ Email sent successfully
✅ Email service responded: { provider: 'sendgrid', messageId: '...' }
```

### Opción B: Desde la UI (más realista)

1. Ve a https://agendamedpro.com/dashboard/settings/team
2. Haz clic en "Invitar Miembro del Equipo"
3. Llena:
   - Email: `prueba@mailinator.com` (puedes verificarlo en [mailinator.com](https://mailinator.com))
   - Rol: Doctor
4. Envía la invitación
5. Ve a [mailinator.com/v4/public/inboxes.jsp?to=prueba](https://www.mailinator.com/v4/public/inboxes.jsp?to=prueba)
6. **Deberías ver el email con el asunto:** "Invitación para unirte al equipo en AgendaMedPro"

---

## 📧 El Email de Invitación Incluye:

✅ Nombre del dueño que invita  
✅ Rol asignado (Doctor, Admin, etc.)  
✅ Permisos del rol  
✅ Link único con token seguro  
✅ Instrucciones claras  
✅ Diseño profesional con gradientes y branding  

---

## 🔒 Seguridad

- ✅ Token único de 64 caracteres hex (imposible de adivinar)
- ✅ Token asociado al email específico
- ✅ Token de un solo uso
- ✅ Link expira después de aceptar
- ✅ Validación en backend antes de aceptar

---

## 🎬 Flujo Completo de Invitación

1. **Owner invita desde UI** → `/api/team/members` (POST)
2. **Backend crea registro** → tabla `team_members` (status: 'pending')
3. **Genera token seguro** → `crypto.randomBytes(32).toString('hex')`
4. **Envía email** → `emailService.sendCustomEmail(...)`
5. **Miembro recibe email** → con link `https://agendamedpro.com/team/accept?token=...`
6. **Miembro hace clic** → valida token, crea/vincula cuenta
7. **Status cambia** → `pending` → `active`
8. **Miembro tiene acceso** → según permisos de su rol

---

## 📞 ¿Necesitas Ayuda?

Si después de seguir estos pasos sigues sin poder enviar invitaciones:

1. Revisa los logs de Vercel:
   ```bash
   vercel logs --prod
   ```

2. Busca errores relacionados con `sendCustomEmail`

3. Verifica que las variables de entorno estén configuradas:
   ```bash
   vercel env ls
   ```

4. Si todo falla, podemos implementar un sistema de "copiar link" donde el owner copia manualmente el link de invitación y lo envía por WhatsApp/Email personal.

---

## ✨ Próximos Pasos

Una vez que elijas y completes una de las opciones arriba:

1. Haz una invitación de prueba
2. Verifica que el email llegue
3. Acepta la invitación desde otro navegador/incógnito
4. Confirma que el nuevo miembro puede hacer login
5. **¡Listo para usar en producción!** 🎉
