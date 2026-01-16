# 🚀 Guía Rápida de Deployment

Sigue estos pasos en orden para publicar tu proyecto.

## Paso 1: Preparar el Repositorio

```bash
# Asegúrate de tener todo commiteado
git add .
git commit -m "Preparar para deployment"
git push origin main
```

## Paso 2: Backend en Railway (15 minutos)

1. **Ir a** https://railway.app y crear cuenta
2. **Nuevo Proyecto** → "Deploy from GitHub repo" → Selecciona tu repo
3. **Agregar MySQL**:
   - Click "+ New Service" → "Database" → "MySQL"
4. **Configurar Variables** (en tu servicio backend):
   ```bash
   NODE_ENV=production
   PORT=3000
   JWT_SECRET=genera_uno_con_el_comando_de_abajo
   SAT_ENC_KEY=genera_uno_con_el_comando_de_abajo
   ```
   
   **Generar secrets**:
   ```bash
   # JWT_SECRET
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   
   # SAT_ENC_KEY
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. **Ejecutar Migraciones**:
   - Espera que se complete el deploy
   - Click en "View Logs" → pestaña "Terminal"
   - Ejecuta: `npm run migrate`

6. **Copiar URL del backend**: `https://sat-api.up.railway.app` (o similar)

## Paso 3: Cloudinary para Archivos (5 minutos)

1. **Crear cuenta** en https://cloudinary.com (gratis)
2. **Copiar credenciales** del Dashboard:
   - Cloud Name
   - API Key
   - API Secret
3. **Agregar a Railway**:
   ```bash
   CLOUDINARY_CLOUD_NAME=tu_cloud_name
   CLOUDINARY_API_KEY=tu_api_key
   CLOUDINARY_API_SECRET=tu_api_secret
   ```
4. **Instalar dependencia**:
   ```bash
   cd server
   npm install cloudinary
   ```
5. **Commit y push** (Railway auto-redeploy)

## Paso 4: Frontend en Vercel (5 minutos)

1. **Actualizar** `front/.env.production`:
   ```bash
   VITE_API_URL=https://sat-api.up.railway.app
   ```

2. **Ir a** https://vercel.com y crear cuenta

3. **Importar Proyecto**:
   - "Add New..." → "Project"
   - Selecciona tu repo
   - **Root Directory**: `front`
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Variable de Entorno**:
   ```bash
   VITE_API_URL=https://sat-api.up.railway.app
   ```

5. **Deploy** → Espera 2-3 minutos

6. **Copiar URL**: `https://sat-frontend.vercel.app`

## Paso 5: Configurar CORS (2 minutos)

En Railway, agregar variable:
```bash
ALLOWED_ORIGINS=https://sat-frontend.vercel.app
```

## Paso 6: Probar Todo

1. ✅ Abrir URL de Vercel
2. ✅ Hacer login
3. ✅ Crear tarea
4. ✅ Subir archivo
5. ✅ Verificar que se guarda en Cloudinary

---

## 📱 App Móvil (Opcional)

### Android (30-45 minutos)

```bash
cd front

# 1. Build
npm run build:mobile

# 2. Abrir Android Studio
npx cap open android

# 3. En Android Studio:
#    - Build → Generate Signed Bundle / APK
#    - Selecciona AAB
#    - Crea keystore (¡guardarlo!)
#    - Build

# 4. Subir a Google Play Console (requiere $25 USD)
```

### iOS (30-45 minutos, requiere Mac)

```bash
cd front

# 1. Build
npm run build:mobile

# 2. Abrir Xcode
npx cap open ios

# 3. En Xcode:
#    - Configurar signing automático
#    - Product → Archive
#    - Distribute App

# 4. Subir a App Store (requiere $99 USD/año)
```

---

## 🆘 Problemas Comunes

### Railway: "Cannot find module"
**Solución**: Verifica que `server/package.json` tenga:
```json
"scripts": {
  "build": "tsc",
  "start": "node dist/app.js"
}
```

### Vercel: Página en blanco
**Solución**: Verifica que `front/vercel.json` exista con rewrites.

### Error CORS
**Solución**: Agrega la URL de Vercel a `ALLOWED_ORIGINS` en Railway.

### Archivos no se guardan
**Solución**: Implementa Cloudinary (ver Paso 3).

---

## 📝 Checklist Final

- [ ] Backend deployado en Railway
- [ ] MySQL funcionando en Railway
- [ ] Migraciones ejecutadas
- [ ] Cloudinary configurado
- [ ] Frontend deployado en Vercel
- [ ] CORS configurado
- [ ] Login funciona
- [ ] Upload de archivos funciona
- [ ] (Opcional) App Android en Play Store
- [ ] (Opcional) App iOS en App Store

---

## 💰 Costos Mensuales

- Railway: $5/mes (después de créditos gratis)
- Vercel: Gratis
- Cloudinary: Gratis (hasta 25GB)
- **Total**: ~$5/mes

---

¿Problemas? Revisa el archivo `DEPLOYMENT_GUIDE.md` completo.
