# 🚀 Guía Completa de Deployment - Proyecto SAT

Esta guía te muestra cómo publicar tu proyecto completo en producción.

## 📋 Índice

1. [Arquitectura del Deployment](#arquitectura-del-deployment)
2. [Backend en Railway](#backend-en-railway)
3. [Frontend en Vercel](#frontend-en-vercel)
4. [Almacenamiento de Archivos](#almacenamiento-de-archivos)
5. [App Móvil (iOS/Android)](#app-móvil-iosandroid)
6. [Variables de Entorno](#variables-de-entorno)
7. [Checklist de Deployment](#checklist-de-deployment)

---

## 🏗️ Arquitectura del Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                         USUARIOS                            │
└─────────────────────────────────────────────────────────────┘
           │                    │                    │
           │                    │                    │
      ┌────▼────┐         ┌────▼────┐         ┌────▼────┐
      │   Web   │         │   iOS   │         │ Android │
      │ Browser │         │   App   │         │   App   │
      └────┬────┘         └────┬────┘         └────┬────┘
           │                    │                    │
           └──────────────┬─────┴────────────────────┘
                          │
                    ┌─────▼─────┐
                    │  VERCEL   │ Frontend (React)
                    │  (CDN)    │ sat-frontend.vercel.app
                    └─────┬─────┘
                          │ API Calls
                    ┌─────▼─────┐
                    │  RAILWAY  │ Backend (Node.js + MySQL)
                    │           │ sat-api.up.railway.app
                    └─────┬─────┘
                          │
            ┌─────────────┴─────────────┐
            │                           │
      ┌─────▼─────┐            ┌────▼────┐
      │CLOUDINARY │            │ RAILWAY │
      │  (Fotos)  │            │  MySQL  │
      └───────────┘            └─────────┘
```

---

## 🚂 Backend en Railway

Railway es perfecto para tu backend porque incluye **MySQL integrado** y es muy fácil de configurar.

### Paso 1: Preparar el Backend

#### 1.1 Crear archivo `railway.json`

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### 1.2 Actualizar `package.json` del servidor

Asegúrate de tener estos scripts:

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "migrate": "node dist/scripts/migrate-all.js"
  }
}
```

#### 1.3 Crear endpoint de health check

Crea o actualiza `server/src/app.ts`:

```typescript
// Health check para Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

### Paso 2: Deploy en Railway

1. **Crear cuenta en Railway**: https://railway.app
2. **Nuevo Proyecto**:
   - Click en "New Project"
   - Selecciona "Deploy from GitHub repo"
   - Conecta tu repositorio
3. **Agregar MySQL**:
   - En tu proyecto, click en "+ New Service"
   - Selecciona "Database" → "MySQL"
   - Railway creará una base de datos automáticamente
4. **Configurar Variables de Entorno**:
   - Click en tu servicio backend
   - Ve a "Variables"
   - Railway auto-genera `DATABASE_URL`, pero necesitas configurar las individuales:

```bash
# Railway auto-genera estas (puedes copiarlas de DATABASE_URL)
MYSQL_HOST=${{MySQL.MYSQL_HOST}}
MYSQL_PORT=${{MySQL.MYSQL_PORT}}
MYSQL_USER=${{MySQL.MYSQL_USER}}
MYSQL_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
MYSQL_DATABASE=${{MySQL.MYSQL_DATABASE}}

# Variables que debes agregar manualmente
JWT_SECRET=tu_jwt_secret_super_secreto_aqui
SAT_ENC_KEY=tu_clave_de_64_caracteres_hex_aqui
NODE_ENV=production
PORT=3000

# Cloudinary (ver sección más adelante)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

5. **Ejecutar Migraciones**:
   - Después del primer deploy exitoso
   - Ve a "Deployments" → Click en el último deployment
   - Click en "View Logs"
   - Ve a la pestaña "Terminal"
   - Ejecuta: `npm run migrate`

### Paso 3: Configurar Railway.toml (Opcional)

Crea `server/railway.toml`:

```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm install && npm run build"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

---

## ⚡ Frontend en Vercel

Vercel es perfecto para React/Vite con deploy automático desde GitHub.

### Paso 1: Preparar el Frontend

#### 1.1 Crear `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

#### 1.2 Crear archivo `.env.production`

```bash
# URL de tu backend en Railway
VITE_API_URL=https://sat-api.up.railway.app
```

#### 1.3 Actualizar configuración de API

Asegúrate de que tu frontend use la variable de entorno:

```typescript
// src/config/api.ts (o donde tengas la configuración)
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
```

### Paso 2: Deploy en Vercel

1. **Crear cuenta en Vercel**: https://vercel.com
2. **Importar Proyecto**:
   - Click en "Add New..." → "Project"
   - Conecta tu repositorio de GitHub
   - Selecciona tu repo
3. **Configurar Proyecto**:
   - **Framework Preset**: Vite
   - **Root Directory**: `front`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. **Variables de Entorno**:
   ```bash
   VITE_API_URL=https://sat-api.up.railway.app
   ```
5. **Deploy**:
   - Click en "Deploy"
   - Vercel construirá y desplegará automáticamente

### Paso 3: Configurar CORS en Backend

Actualiza tu backend para permitir requests desde Vercel:

```typescript
// server/src/app.ts
import cors from 'cors';

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://sat-frontend.vercel.app', // Tu dominio de Vercel
  'https://tu-dominio-personalizado.com' // Si tienes uno
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

---

## 📦 Almacenamiento de Archivos

**Problema**: Railway y Vercel tienen almacenamiento **efímero** (los archivos se borran en cada deploy).

**Solución**: Usar un servicio de almacenamiento externo.

### Opción 1: Cloudinary (Recomendado) ⭐

**Ventajas**:
- ✅ Gratis hasta 25GB
- ✅ CDN global incluido
- ✅ Optimización automática de imágenes
- ✅ Fácil integración
- ✅ Perfecto para PDFs e imágenes

#### Configuración:

1. **Crear cuenta**: https://cloudinary.com (gratis)

2. **Instalar dependencia**:
```bash
cd server
npm install cloudinary
```

3. **Crear servicio de upload**:

Crea `server/src/services/cloudinary.service.ts`:

```typescript
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function uploadToCloudinary(
  file: Express.Multer.File,
  folder: string = 'sat-uploads'
): Promise<{ url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto', // Auto-detecta tipo (imagen, pdf, etc)
        use_filename: true,
        unique_filename: true
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result!.secure_url,
          public_id: result!.public_id
        });
      }
    );

    // Convertir buffer a stream
    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
```

4. **Actualizar controller de upload**:

```typescript
// server/src/controllers/upload.controller.ts
import { uploadToCloudinary } from '../services/cloudinary.service';

export const uploadFile: RequestHandler = async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Subir a Cloudinary en lugar de disco local
    const { url, public_id } = await uploadToCloudinary(req.file, 'sat-tasks');

    res.json({
      message: 'File uploaded successfully',
      file_url: url,
      file_id: public_id
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed' });
  }
};
```

5. **Actualizar Multer para usar memoria**:

```typescript
// server/src/middleware/upload.middleware.ts
import multer from 'multer';

// Usar memoria en lugar de disco (necesario para Cloudinary)
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|gif/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  }
});
```

6. **Variables de entorno en Railway**:
```bash
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

### Opción 2: AWS S3

Si prefieres S3, te doy las instrucciones (requiere tarjeta de crédito):

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**Variables de entorno**:
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_S3_BUCKET=sat-uploads
```

### Migrar Archivos Existentes

Si ya tienes archivos en `./uploads`, crea este script:

```typescript
// server/scripts/migrate-to-cloudinary.ts
import fs from 'fs';
import path from 'path';
import { uploadToCloudinary } from '../src/services/cloudinary.service';

async function migrateFiles() {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  const files = fs.readdirSync(uploadsDir);

  for (const filename of files) {
    const filePath = path.join(uploadsDir, filename);
    const fileBuffer = fs.readFileSync(filePath);
    
    const file = {
      buffer: fileBuffer,
      originalname: filename
    } as Express.Multer.File;

    try {
      const result = await uploadToCloudinary(file);
      console.log(`✅ Migrated: ${filename} -> ${result.url}`);
      
      // Actualizar BD con nueva URL
      // await db.query('UPDATE tasks SET file_url = ? WHERE file_path = ?', [result.url, filename]);
    } catch (error) {
      console.error(`❌ Failed: ${filename}`, error);
    }
  }
}

migrateFiles();
```

---

## 📱 App Móvil (iOS/Android)

Tu proyecto usa **Capacitor**, que genera apps nativas desde tu código React.

### Deploy para Android

#### 1. Preparar la App

```bash
cd front

# 1. Build del frontend con producción
npm run build

# 2. Sincronizar con Capacitor
npx cap sync android

# 3. Abrir en Android Studio
npx cap open android
```

#### 2. Configurar API de Producción

Actualiza `front/capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tuempresa.sat',
  appName: 'SAT Admin',
  webDir: 'dist',
  server: {
    // Solo para desarrollo, comenta en producción
    // url: 'http://192.168.1.100:5173',
    // cleartext: true
  }
};

export default config;
```

Asegúrate de que `front/src/config/api.ts` use la URL de producción:

```typescript
export const API_URL = import.meta.env.VITE_API_URL || 'https://sat-api.up.railway.app';
```

#### 3. Generar APK/AAB para Google Play

En Android Studio:

1. **Build** → **Generate Signed Bundle / APK**
2. Selecciona **Android App Bundle** (AAB) para Play Store
3. Crea un keystore (guárdalo en lugar seguro)
4. Completa los datos de firma
5. Build → Release
6. El archivo se genera en `android/app/release/`

#### 4. Subir a Google Play Console

1. Crea cuenta en https://play.google.com/console
2. Crea nueva aplicación
3. Completa información de la app
4. Sube el archivo `.aab`
5. Configura privacidad, contenido, precio
6. Envía a revisión

**Costo**: $25 USD pago único para registro de desarrollador

### Deploy para iOS

#### 1. Requisitos

- ✅ Mac con Xcode instalado
- ✅ Cuenta de Apple Developer ($99 USD/año)
- ✅ Certificados y perfiles de provisioning

#### 2. Preparar la App

```bash
cd front

# 1. Build y sync
npm run build
npx cap sync ios

# 2. Abrir en Xcode
npx cap open ios
```

#### 3. Configurar en Xcode

1. Selecciona el proyecto "App" en el navegador
2. En "Signing & Capabilities":
   - Marca "Automatically manage signing"
   - Selecciona tu equipo de developer
3. Cambia el Bundle Identifier: `com.tuempresa.sat`
4. Selecciona dispositivo: "Any iOS Device (arm64)"

#### 4. Generar Archivo para App Store

1. **Product** → **Archive**
2. Espera a que compile
3. En el Organizer, click en **Distribute App**
4. Selecciona **App Store Connect**
5. Sigue el asistente
6. Se subirá automáticamente a App Store Connect

#### 5. Subir a App Store

1. Ve a https://appstoreconnect.apple.com
2. Crea nueva app
3. Completa metadatos (descripción, capturas, etc.)
4. Selecciona el build subido
5. Envía a revisión

**Tiempo de revisión**: 1-3 días típicamente

### Alternativa: Expo Application Services (EAS)

Si prefieres **no** usar Android Studio/Xcode, puedes usar **EAS Build** de Expo:

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Configurar proyecto
eas build:configure

# Build para Android
eas build --platform android

# Build para iOS (si tienes cuenta de Apple Developer)
eas build --platform ios
```

**Ventaja**: Compila en la nube sin necesidad de Android Studio o Mac.

---

## 🔐 Variables de Entorno

### Backend (Railway)

```bash
# Base de datos (auto-generadas por Railway)
MYSQL_HOST=${{MySQL.MYSQL_HOST}}
MYSQL_PORT=${{MySQL.MYSQL_PORT}}
MYSQL_USER=${{MySQL.MYSQL_USER}}
MYSQL_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
MYSQL_DATABASE=${{MySQL.MYSQL_DATABASE}}

# Aplicación
NODE_ENV=production
PORT=3000
JWT_SECRET=tu_jwt_secret_minimo_32_caracteres_aleatorios
SAT_ENC_KEY=clave_hex_de_64_caracteres_para_cifrar_contraseñas

# Cloudinary (para archivos)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Email (si configuras nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_app_password

# CORS
ALLOWED_ORIGINS=https://sat-frontend.vercel.app,https://tu-dominio.com
```

### Frontend (Vercel)

```bash
VITE_API_URL=https://sat-api.up.railway.app
```

### ¿Cómo generar SAT_ENC_KEY?

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### ¿Cómo generar JWT_SECRET?

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## ✅ Checklist de Deployment

### Antes de Deployar

- [ ] Actualizar `.gitignore` (no subir `.env`, `node_modules`, `dist`)
- [ ] Crear repositorio en GitHub y hacer push
- [ ] Probar build local: `npm run build` en server y front
- [ ] Verificar que no haya credenciales hardcodeadas
- [ ] Crear cuenta en Railway
- [ ] Crear cuenta en Vercel
- [ ] Crear cuenta en Cloudinary

### Backend (Railway)

- [ ] Conectar repositorio en Railway
- [ ] Agregar servicio MySQL
- [ ] Configurar todas las variables de entorno
- [ ] Primer deploy exitoso
- [ ] Ejecutar migraciones desde terminal de Railway
- [ ] Verificar endpoint /health funciona
- [ ] Probar endpoints con Postman/Thunder Client

### Frontend (Vercel)

- [ ] Crear `vercel.json`
- [ ] Configurar VITE_API_URL en variables de entorno
- [ ] Conectar repositorio en Vercel
- [ ] Configurar Root Directory: `front`
- [ ] Primer deploy exitoso
- [ ] Verificar que la app carga correctamente
- [ ] Probar login y funcionalidades principales

### Archivos (Cloudinary)

- [ ] Crear cuenta en Cloudinary
- [ ] Instalar dependencia `cloudinary`
- [ ] Crear servicio de upload
- [ ] Actualizar controllers para usar Cloudinary
- [ ] Cambiar Multer a memoria (memoryStorage)
- [ ] Agregar variables de entorno en Railway
- [ ] Probar subida de archivos
- [ ] Migrar archivos existentes (si los hay)

### App Móvil (Opcional)

#### Android
- [ ] Actualizar API_URL a producción
- [ ] Build: `npm run build:mobile`
- [ ] Abrir Android Studio: `npx cap open android`
- [ ] Generar Signed Bundle (AAB)
- [ ] Crear cuenta en Google Play Console ($25 USD)
- [ ] Subir AAB y completar información
- [ ] Enviar a revisión

#### iOS
- [ ] Cuenta Apple Developer ($99 USD/año)
- [ ] Build y sincronizar: `npm run build:mobile`
- [ ] Abrir Xcode: `npx cap open ios`
- [ ] Configurar signing automático
- [ ] Archivar app
- [ ] Subir a App Store Connect
- [ ] Completar metadatos
- [ ] Enviar a revisión

### Después del Deploy

- [ ] Configurar dominio personalizado (opcional)
- [ ] Configurar SSL (automático en Railway/Vercel)
- [ ] Probar todas las funcionalidades en producción
- [ ] Configurar monitoreo (Railway tiene métricas incluidas)
- [ ] Configurar backups de base de datos
- [ ] Documentar URLs de producción para el equipo

---

## 🎯 Resumen de Costos

| Servicio | Costo | Límites Free Tier |
|----------|-------|-------------------|
| **Railway** | $5/mes por servicio (después de créditos) | $5 en créditos gratis |
| **Vercel** | Gratis | 100GB bandwidth |
| **Cloudinary** | Gratis | 25GB almacenamiento + 25GB bandwidth |
| **Google Play** | $25 USD | Pago único |
| **Apple Developer** | $99 USD/año | Requerido para iOS |

**Total inicial mínimo**: Gratis (con límites) o ~$10-15/mes para producción real.

---

## 🆘 Troubleshooting

### Error: "Cannot find module" en Railway

**Solución**: Asegúrate de que `package.json` tenga el script `start` correcto:
```json
"start": "node dist/app.js"
```

### Error: CORS en producción

**Solución**: Actualiza `allowedOrigins` en tu backend con la URL de Vercel.

### Error: "Database connection failed" en Railway

**Solución**: Verifica que las variables de entorno de MySQL estén configuradas correctamente. Railway las auto-genera.

### Archivos se borran después de deploy

**Solución**: Implementa Cloudinary. Railway/Vercel no persisten archivos.

### App móvil no conecta al backend

**Solución**: Verifica que `API_URL` apunte a `https://sat-api.up.railway.app` y no a localhost.

---

## 📚 Recursos Adicionales

- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **Cloudinary Docs**: https://cloudinary.com/documentation
- **Capacitor Docs**: https://capacitorjs.com/docs
- **Google Play Console**: https://play.google.com/console
- **App Store Connect**: https://appstoreconnect.apple.com

---

¿Necesitas ayuda con algún paso específico? ¡Estoy aquí para ayudarte! 🚀
