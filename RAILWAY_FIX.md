# 🚨 SOLUCIÓN: "No start command was found" en Railway

Este error ocurre porque Railway está viendo la raíz del proyecto (que tiene `server/` y `front/`) y no sabe cuál usar.

---

## ✅ SOLUCIÓN RÁPIDA (Método 1 - En la UI de Railway)

### Paso 1: Configurar Root Directory en Railway

1. Ve a tu proyecto en Railway
2. Click en el **servicio backend** (el que falló)
3. Click en **"Settings"** (pestaña de configuración)
4. Busca la sección **"Build & Deploy"**
5. Encuentra **"Root Directory"**
6. Escribe: `server`
7. En **"Start Command"**, escribe: `npm start`
8. Click en **"Redeploy"** (botón arriba a la derecha)

**Eso es todo**. Railway buscará en `server/` y encontrará el `package.json` correcto.

---

## ✅ SOLUCIÓN ALTERNATIVA (Método 2 - Con archivo de configuración)

Ya creé un archivo `railway.toml` en la raíz del proyecto que le dice a Railway dónde está el código del servidor.

### Pasos:

1. **Commitear el nuevo archivo**:
   ```bash
   git add railway.toml server/railway.json
   git commit -m "Fix: Configure Railway root directory"
   git push origin main
   ```

2. **Redeploy en Railway**:
   - Railway detectará automáticamente el nuevo archivo `railway.toml`
   - Click en "Redeploy" en Railway
   - Debería funcionar ahora

---

## 🔍 Verificación

Después del deploy exitoso, verifica:

1. **Logs del Build** (Railway → Deployments → View Logs):
   ```
   ✓ npm install
   ✓ npm run build
   ✓ Build succeeded
   ```

2. **Logs del Deploy**:
   ```
   ✓ npm start
   ✓ Server listening on port 3000
   ```

3. **Health Check** (debería estar verde):
   - Railway hace GET a `/health`
   - Debería responder `200 OK`

---

## 📝 Lo que Hice

Creé estos archivos:

1. **`railway.toml`** (en la raíz) - Le dice a Railway que use `server/`
2. **Actualicé `server/railway.json`** - Con build command explícito

---

## 🆘 Si Sigue Fallando

### Error: "Cannot find module"
**Causa**: Las dependencias no se instalaron
**Solución**: 
- Verifica que `server/package.json` exista
- Verifica que esté en el repositorio (no en `.gitignore`)

### Error: "Health check failed"
**Causa**: El servidor no arrancó o no tiene endpoint `/health`
**Solución**: 
- Verifica que `server/src/app.ts` tenga:
  ```typescript
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });
  ```

### Error: "Build failed: tsc not found"
**Causa**: TypeScript no está instalado
**Solución**: Ya está en `devDependencies`, pero asegúrate que Railway lo instale:
- Settings → Include Dev Dependencies: **ON**

---

## 🎯 Recomendación

**Usa el Método 1** (configurar Root Directory en la UI). Es más simple y directo.

Si no funciona, usa el Método 2 (archivos ya creados, solo commit y push).

---

## 📞 Siguiente Paso

Después de que el build funcione:

1. ✅ El servicio estará **Running** (verde)
2. 📋 Copia la URL de Railway (ej: `https://sat-api.up.railway.app`)
3. ➡️ Continúa con el **Paso 2**: Agregar MySQL
4. ➡️ Luego **Paso 3**: Configurar variables de entorno

---

¿El build funcionó? Dime qué sale en los logs y te ayudo con el siguiente paso! 🚀
