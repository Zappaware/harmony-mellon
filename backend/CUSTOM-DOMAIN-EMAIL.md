# Configuración de Email con Dominio Personalizado (mellon.mx)

Esta guía te ayudará a configurar el sistema de email para usar tu dominio personalizado `mellon.mx`.

## Opciones Recomendadas

Para un dominio personalizado, recomendamos usar un servicio profesional de email transaccional. Las mejores opciones son:

### 1. SendGrid (Recomendado para empezar)

**Ventajas:**
- Plan gratuito: 100 emails/día
- Fácil configuración
- Excelente deliverability
- Dashboard intuitivo

**Pasos:**

1. **Crear cuenta en SendGrid**
   - Ve a https://sendgrid.com
   - Crea una cuenta gratuita
   - Verifica tu email

2. **Verificar tu dominio**
   - Ve a Settings → Sender Authentication → Domain Authentication
   - Agrega `mellon.mx`
   - SendGrid te dará registros DNS para agregar

3. **Agregar registros DNS en tu proveedor de dominio**
   
   Agrega estos registros en tu panel de DNS (donde compraste mellon.mx):
   
   ```
   Tipo: CNAME
   Nombre: em1234.mellon.mx (SendGrid te dará el nombre exacto)
   Valor: u1234567.wl123.sendgrid.net (SendGrid te dará el valor exacto)
   
   Tipo: CNAME
   Nombre: s1._domainkey.mellon.mx
   Valor: s1.domainkey.u1234567.wl123.sendgrid.net
   
   Tipo: CNAME
   Nombre: s2._domainkey.mellon.mx
   Valor: s2.domainkey.u1234567.wl123.sendgrid.net
   ```

4. **Crear API Key**
   - Ve a Settings → API Keys
   - Crea una nueva API Key
   - Copia la key (solo se muestra una vez)

5. **Configurar variables de entorno**
   
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASSWORD=SG.tu-api-key-aqui
   SMTP_FROM=noreply@mellon.mx
   SMTP_FROM_NAME=Mellon Harmony
   ```

### 2. Mailgun

**Ventajas:**
- Plan gratuito: 5,000 emails/mes
- Muy confiable
- API potente

**Pasos:**

1. **Crear cuenta en Mailgun**
   - Ve a https://mailgun.com
   - Crea una cuenta
   - Verifica tu email

2. **Agregar dominio**
   - Ve a Sending → Domains
   - Agrega `mellon.mx`
   - Mailgun te dará registros DNS

3. **Agregar registros DNS**
   
   Mailgun te dará registros específicos, generalmente:
   
   ```
   Tipo: TXT
   Nombre: mellon.mx
   Valor: v=spf1 include:mailgun.org ~all
   
   Tipo: TXT
   Nombre: _dmarc.mellon.mx
   Valor: v=DMARC1; p=none
   
   Tipo: CNAME
   Nombre: email.mellon.mx
   Valor: mailgun.org
   ```

4. **Configurar variables de entorno**
   
   ```env
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_USER=postmaster@mg.mellon.mx
   SMTP_PASSWORD=tu-contraseña-de-mailgun
   SMTP_FROM=noreply@mellon.mx
   SMTP_FROM_NAME=Mellon Harmony
   ```

### 3. Amazon SES

**Ventajas:**
- Muy económico ($0.10 por 1,000 emails)
- Escalable
- Integración con AWS

**Pasos:**

1. **Crear cuenta AWS**
   - Ve a https://aws.amazon.com/ses
   - Crea una cuenta AWS

2. **Verificar dominio**
   - Ve a SES → Verified identities
   - Agrega `mellon.mx`
   - Agrega los registros DNS que te proporciona

3. **Solicitar salida del sandbox** (si quieres enviar a cualquier email)
   - Por defecto, SES solo permite enviar a emails verificados
   - Solicita salir del sandbox en Account dashboard

4. **Crear credenciales SMTP**
   - Ve a SES → SMTP settings
   - Crea credenciales SMTP
   - Guarda el Access Key ID y Secret Access Key

5. **Configurar variables de entorno**
   
   ```env
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=tu-access-key-id
   SMTP_PASSWORD=tu-secret-access-key
   SMTP_FROM=noreply@mellon.mx
   SMTP_FROM_NAME=Mellon Harmony
   ```

### 4. Servidor SMTP Propio

Si tienes un servidor de correo propio (como cPanel, Plesk, o un servidor dedicado):

**Configuración típica:**

```env
SMTP_HOST=mail.mellon.mx
SMTP_PORT=587
SMTP_USER=noreply@mellon.mx
SMTP_PASSWORD=tu-contraseña-del-servidor
SMTP_FROM=noreply@mellon.mx
SMTP_FROM_NAME=Mellon Harmony
```

**Nota:** Asegúrate de que tu servidor permita conexiones SMTP desde tu aplicación.

## Configuración de DNS (Importante)

Para evitar que los emails vayan a spam, configura estos registros DNS:

### SPF (Sender Policy Framework)

```
Tipo: TXT
Nombre: mellon.mx
Valor: v=spf1 include:_spf.sendgrid.net ~all
```

(Reemplaza `_spf.sendgrid.net` con el proveedor que uses)

### DKIM (DomainKeys Identified Mail)

Tu proveedor de email te dará registros DKIM específicos. Generalmente son CNAME.

### DMARC (Domain-based Message Authentication)

```
Tipo: TXT
Nombre: _dmarc.mellon.mx
Valor: v=DMARC1; p=none; rua=mailto:admin@mellon.mx
```

## Verificación

### 1. Verificar configuración DNS

Usa estas herramientas online:
- **MXToolbox**: https://mxtoolbox.com/spf.aspx
- **DKIM Validator**: https://dkimvalidator.com
- **DMARC Analyzer**: https://dmarcian.com/dmarc-xml/

### 2. Probar envío de email

1. Inicia el servidor backend
2. Crea un nuevo usuario o actualiza una tarea
3. Verifica que el email llegue a la bandeja de entrada
4. Revisa la carpeta de spam si no aparece

### 3. Monitorear logs

Los errores de envío se registran en los logs del servidor. Revisa:
- Logs de la aplicación
- Dashboard del proveedor de email (SendGrid, Mailgun, etc.)

## Troubleshooting

### Los emails no se envían

1. **Verifica las variables de entorno**: Asegúrate de que todas estén configuradas
2. **Revisa los logs del servidor**: Busca errores de conexión SMTP
3. **Verifica credenciales**: Asegúrate de que las credenciales sean correctas
4. **Prueba la conexión SMTP**: Usa herramientas como `telnet` o `openssl`

### Los emails van a spam

1. **Configura SPF/DKIM/DMARC**: Esencial para deliverability
2. **Calienta tu dominio**: Empieza enviando pocos emails y aumenta gradualmente
3. **Evita contenido spam**: No uses palabras como "GRATIS", "CLICK AQUÍ", etc.
4. **Usa un servicio profesional**: SendGrid, Mailgun, etc. tienen mejor reputación

### Error de autenticación

1. **Verifica usuario y contraseña**: Asegúrate de que sean correctos
2. **Para Gmail**: Usa contraseñas de aplicación, no tu contraseña normal
3. **Para servicios profesionales**: Usa API keys o credenciales SMTP específicas

## Recomendación Final

Para `mellon.mx`, recomendamos **SendGrid** porque:
- ✅ Fácil de configurar
- ✅ Plan gratuito generoso (100 emails/día)
- ✅ Excelente documentación
- ✅ Dashboard para monitorear envíos
- ✅ Fácil escalar cuando crezcas

Una vez configurado, tu sistema enviará emails automáticamente desde `noreply@mellon.mx` o `user@mellon.mx` según configures.
