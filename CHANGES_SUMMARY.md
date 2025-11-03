# Resumen de Cambios Implementados

## 🚀 Sistema de Recurrencia de Servicios (2025-01-02)

### **Vista Previa de Archivos Mejorada**
- ✅ Imágenes se muestran en tamaño completo (antes tenían restricción de 300x300px)
- ✅ PDFs se muestran en un iframe embebido (600px de altura)
- ✅ Vista previa real en lugar de solo iconos

### **Sistema Dinámico de Recurrencia de Servicios**

#### **Nueva Configuración de Servicios**
Se agregaron los siguientes campos configurables a la tabla `services`:

- `recurrence_type`: Tipo de recurrencia
  - `monthly`: Mensual (cada mes)
  - `bimonthly`: Bimensual (cada 2 meses)
  - `quarterly`: Trimestral (cada 3 meses)
  - `annual`: Anual (cada año)
  - `custom`: Personalizado (días específicos)
  - `one_time`: Una sola vez

- `recurrence_days`: Número de días para recurrencia personalizada

- `activation_day`: Día del mes en que se activa la tarea (1-31)
  - Por defecto: día 25

- `activation_window_days`: Ventana de activación (días antes del activation_day)
  - Por defecto: 7 días
  - Ejemplo: Si activation_day=25 y window=7, la tarea se activa entre los días 18-25

- `completion_determines_next`: Si la próxima ejecución se determina al completar
  - `true`: Como "Libros al Día" - la fecha se especifica al completar
  - `false`: Usa activation_day y recurrence_type

- `requires_file`: Si requiere subir archivo al completar

- `is_active`: Si el servicio está activo

#### **Migración de Base de Datos**
Creada migración `005_services_recurrence.sql`:
- Agrega campos de recurrencia a tabla `services`
- Agrega `service_id` a `monthly_service_checklist`
- Actualiza servicios existentes con configuración por defecto
- Crea índices para optimizar consultas

#### **Sistema de Generación Automática de Tareas**
**Archivo: `server/src/jobs/generate-monthly-tasks.ts`**
- Se ejecuta el día 1 de cada mes a la 1 AM
- Genera automáticamente:
  - Facturas mensuales para todos los clientes con servicios activos
  - Tareas para cada servicio asignado al cliente
- Completamente dinámico basado en relaciones `client_services`
- Evita duplicados verificando si ya existen facturas/tareas

#### **Sistema de Activación Automática de Tareas**
**Archivo: `server/src/jobs/tasks-scheduler.ts`** (completamente refactorizado)
- Se ejecuta diariamente a las 2 AM
- Activa tareas según configuración del servicio:
  - **Mensuales**: Ventana de activación configurable (ej: días 18-25 si activation_day=25)
  - **Bimensuales**: Solo en meses impares (1, 3, 5, 7, 9, 11)
  - **Trimestrales**: Solo en meses 1, 4, 7, 10
  - **Anuales**: Solo en enero
  - **Personalizados**: Cada X días según `recurrence_days`
  - **Determinados al completar**: Activa según `next_payment_date` cuando está dentro de la ventana

- Maneja ventanas que cruzan meses (ej: activation_day=5, window=7 comienza día 28 del mes anterior)
- Envía recordatorios para servicios con fechas determinadas al completar

#### **API de Administración de Servicios**
**Archivo: `server/src/controllers/service.controller.ts`** (completamente reescrito)

Nuevos endpoints:
- `GET /api/services` - Listar todos los servicios
- `GET /api/services/:id` - Obtener servicio específico
- `POST /api/services` - Crear nuevo servicio
- `PUT /api/services/:id` - Actualizar servicio completo
- `PATCH /api/services/:id/status` - Activar/desactivar servicio
- `DELETE /api/services/:id` - Eliminar servicio (solo si no tiene tareas/clientes)

Validaciones implementadas:
- `completion_determines_next=true` requiere `activation_day=null`
- `recurrence_type='custom'` requiere `recurrence_days`
- No se puede eliminar servicio con tareas o clientes asociados
- Validación de rangos (activation_day: 1-31, activation_window_days: 1-30)

#### **Interfaz de Administración de Servicios**
**Archivo: `front/src/pages/admin/ServicesPage.tsx`** (nuevo)

Características:
- Tabla con todos los servicios y su configuración
- Columnas: Nombre, Descripción, Precio, Recurrencia, Día Activación, Ventana, Estado
- Botones: Crear, Editar, Activar/Desactivar, Eliminar
- Modal de creación/edición con formulario completo:
  - Campos básicos: nombre, descripción, precio
  - Configuración de recurrencia: tipo, días personalizados
  - Configuración de activación: día, ventana
  - Checkbox: requiere archivo, determina próxima al completar, activo
  - Validaciones en frontend
- Estados visuales con badges (Activo/Inactivo)
- Confirmaciones para operaciones destructivas

Ruta agregada:
- `/admin/services` - Solo accesible para rol `admin`
- Link agregado en navegación del sidebar

#### **Script de Reset Actualizado**
**Archivo: `server/scripts/reset-database.sql`**
- Actualizado con nuevos campos en tabla `services`
- Servicios de ejemplo con configuraciones realistas:
  - Declaración de SAT: mensual, día 25, ventana 7 días
  - Factura: mensual, día 25, ventana 7 días
  - Rectificador: mensual, día 25, ventana 7 días
  - Libros al Día: mensual, determina próxima al completar, ventana 60 días
  - Omisos: una vez, día 1, ventana 30 días

### **Archivos Creados/Modificados**

#### Backend:
- ✅ `server/src/migrations/005_services_recurrence.sql` - Nueva migración
- ✅ `server/src/jobs/generate-monthly-tasks.ts` - Nuevo job de generación
- ✅ `server/src/jobs/tasks-scheduler.ts` - Completamente refactorizado
- ✅ `server/src/controllers/service.controller.ts` - Completamente reescrito
- ✅ `server/src/routes/services.routes.ts` - Actualizado con nuevos endpoints
- ✅ `server/scripts/reset-database.sql` - Actualizado con nuevos campos

#### Frontend:
- ✅ `front/src/pages/admin/ServicesPage.tsx` - Nueva página de administración
- ✅ `front/src/pages/admin/TaskDetailPage.tsx` - Mejorada vista previa de archivos
- ✅ `front/src/main.tsx` - Agregada ruta `/admin/services`
- ✅ `front/src/ui/AppLayout.tsx` - Agregado link "Servicios" en navegación

### **Cómo Usar el Nuevo Sistema**

#### 1. Ejecutar Migración
```bash
# Opción 1: Script de reset completo (CUIDADO: elimina todos los datos)
cd server
npm run reset-db sat_acme

# Opción 2: Solo migración 005
mysql -u root -p sat_acme < server/src/migrations/005_services_recurrence.sql
```

#### 2. Configurar Servicios
1. Iniciar sesión como admin
2. Ir a "Servicios" en el menú de navegación
3. Crear o editar servicios con la configuración deseada:
   - Tipo de recurrencia (mensual, trimestral, etc.)
   - Día de activación (ej: 25 para última semana del mes)
   - Ventana de activación (ej: 7 días antes)
   - Si determina próxima ejecución al completar (como Libros)

#### 3. Asignar Servicios a Clientes
Los servicios se asignan a clientes a través de la tabla `client_services` (como antes).

#### 4. Generación y Activación Automática
El sistema funciona automáticamente:
- **Día 1 del mes a la 1 AM**: Genera facturas y tareas para el mes actual
- **Diariamente a las 2 AM**: Activa tareas que entran en su ventana de activación

#### 5. Ejecución Manual (Testing)
```bash
# Ejecutar jobs inmediatamente (para testing)
cd server
RUN_SCHEDULER_ON_START=true npm run dev
```

### **Ejemplos de Configuración**

#### Servicio Mensual Normal (Declaración, Factura, Rectificador):
- `recurrence_type`: `monthly`
- `activation_day`: `25` (última semana del mes)
- `activation_window_days`: `7` (se activa entre días 18-25)
- `completion_determines_next`: `false`
- `requires_file`: `true`

#### Servicio con Fecha Determinada al Completar (Libros):
- `recurrence_type`: `monthly`
- `activation_day`: `null`
- `activation_window_days`: `60` (recordatorio 2 meses antes)
- `completion_determines_next`: `true`
- `requires_file`: `true`

#### Servicio Trimestral:
- `recurrence_type`: `quarterly`
- `activation_day`: `15`
- `activation_window_days`: `7`
- `completion_determines_next`: `false`
- `requires_file`: `true`

#### Servicio Personalizado (cada 63 días):
- `recurrence_type`: `custom`
- `recurrence_days`: `63`
- `activation_day`: `null`
- `activation_window_days`: `7`
- `completion_determines_next`: `false`
- `requires_file`: `true`

### **Ventajas del Nuevo Sistema**

1. **Totalmente Dinámico**: No hay código hardcodeado con nombres de tareas
2. **Configurable**: Admin puede cambiar recurrencias sin tocar código
3. **Flexible**: Soporta múltiples tipos de recurrencia
4. **Automático**: Genera y activa tareas sin intervención manual
5. **Escalable**: Fácil agregar nuevos servicios o tipos de recurrencia
6. **Seguro**: Validaciones en backend y frontend
7. **Auditable**: Todos los cambios quedan registrados con timestamps

### **Notas Técnicas**

- La lógica de activación maneja correctamente ventanas que cruzan meses
- El sistema de recordatorios está preparado pero el envío de emails debe implementarse
- Los servicios inactivos no generan tareas nuevas pero las existentes se mantienen
- Al desactivar un servicio, las tareas ya creadas no se eliminan
- La eliminación de servicios solo funciona si no hay tareas o clientes asociados (seguridad)

---

## 🔧 Correcciones Anteriores (2025-01-02)

### **Corrección del Sistema de Omisos**
- ✅ Corregido campo de archivo faltante en TaskDetailPage para omisos
- ✅ Agregada validación obligatoria de archivo de resolución para omisos
- ✅ Actualizado texto de labels e instrucciones para clarificar archivo de resolución

### **Script de Reset de Base de Datos**
- ✅ Creado `server/scripts/reset-database.sql` - Script SQL completo para reset
- ✅ Creado `server/scripts/reset-db.js` - Script Node.js automatizado
- ✅ Creado `server/scripts/generate-seed.js` - Generador de datos de seed con bcrypt
- ✅ Agregado comando `npm run reset-db [nombre_db]` en package.json

### **Uso del Script de Reset:**
```bash
# Desde la carpeta server
cd server

# Resetear la base de datos
npm run reset-db sat_acme

# O manualmente con MySQL
mysql -u root -p sat_acme < scripts/reset-database.sql
```

**⚠️ IMPORTANTE:** El script de reset elimina TODOS los datos y recrea la base de datos desde cero. Solo usar en desarrollo o para limpiar datos corruptos.

**Usuarios de prueba creados:**
- admin@sat.com (admin) - password123
- employee1@sat.com (employee) - password123
- employee2@sat.com (employee) - password123
- cliente1@example.com (client) - password123
- cliente2@example.com (client) - password123

---

## ✅ Cambios Completados

### 1. **Restricción de Acceso para Empleados**
- ✅ Los empleados solo ven la página "Tareas" en el menú de navegación
- ✅ Eliminado acceso a "Clientes" y "Facturación" para empleados
- ✅ Las rutas están protegidas solo para `admin`

### 2. **Vista Detallada de Tareas para Empleados**
- ✅ Creada `TaskDetailPage.tsx` con:
  - Información del cliente (Nombre, NIT, Correo, Contraseña SAT)
  - Contraseña SAT oculta con botón mostrar/ocultar
  - Formularios específicos según tipo de tarea

### 3. **Sistema de Tareas por Tipo**

#### **LIBROS AL DÍA**
- ✅ Campo para subir archivo de comprobante de pago
- ✅ Campo obligatorio para establecer próxima fecha de pago
- ✅ El backend calcula automáticamente cuándo marcarlo como pendiente
- ✅ Sistema de recordatorios 2 meses antes del vencimiento

#### **DECLARACIÓN DE SAT**
- ✅ Campo para subir captura de pantalla (solo imágenes)
- ✅ Descripción: "Declaración a 0 de la SAT"
- ✅ Instrucciones: Entre última semana del mes y primera del siguiente

#### **FACTURA**
- ✅ Campo para subir archivo (PDF o imagen)
- ✅ Instrucciones: Entre última semana del mes y primera del siguiente
- ✅ Muestra mes/año de la factura

#### **RECTIFICADOR**
- ✅ Campo para subir archivo (PDF o imagen)
- ✅ Mismo procedimiento que factura
- ✅ Instrucciones: Entre última semana del mes y primera del siguiente

#### **OMISOS**
- ✅ Toggle simple (Activo/Inactivo)
- ✅ Estado persistente en base de datos
- ✅ No requiere archivo, solo activar/desactivar

### 4. **Backend - Endpoints Creados**

#### `GET /api/services/checklist/:taskId`
- Obtiene detalles completos de una tarea
- Incluye información del cliente
- Descifra contraseña SAT automáticamente

#### `POST /api/services/checklist/:taskId/complete`
- Completa una tarea con archivo opcional
- Guarda próxima fecha de pago para libros
- Marca tarea como completada

#### `PATCH /api/services/checklist/:taskId/omisos`
- Activa/desactiva omisos para una tarea
- Crea tabla `task_omisos` si no existe

### 5. **Backend - Sistema Automático (Scheduler)**

#### **Archivo: `server/src/jobs/tasks-scheduler.ts`**
- ✅ Marca tareas mensuales como pendientes automáticamente:
  - Última semana del mes (días 25-31): Activa tareas del mes actual
  - Primera semana del mes siguiente (días 1-7): Activa tareas del mes siguiente
  - Tipos: Declaración, Factura, Rectificador

- ✅ Sistema de recordatorios para libros:
  - Verifica tareas de libros con `next_payment_date` en los próximos 60 días
  - Marca como "pendiente a largo plazo" cuando faltan 2 meses (50-65 días)
  - Prepara envío de correos (estructura lista, falta implementar envío real)

#### **Archivo: `server/src/jobs/start-scheduler.ts`**
- ✅ Se ejecuta diariamente a las 2 AM
- ✅ Procesa tareas para todos los tenants configurados

### 6. **Base de Datos**
- ✅ Migración creada: `002_add_task_fields.sql`
  - Agrega columna `next_payment_date` a `monthly_service_checklist`
  - Crea tabla `task_omisos` para gestionar estado de omisos

## 📋 Instalación y Configuración

### 1. Instalar Dependencias
```bash
cd server
npm install
```

Esto instalará `node-cron` y sus tipos.

### 2. Ejecutar Migraciones
Ejecuta la migración para agregar los campos necesarios:
```bash
mysql -u root -p sat_acme < server/src/migrations/002_add_task_fields.sql
```

### 3. Configurar Variables de Entorno
Asegúrate de tener en tu `.env`:
- `SAT_ENC_KEY`: Clave de 64 caracteres hexadecimales para cifrar/descifrar contraseñas SAT
- Si no la tienes, genera una con: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 4. Iniciar el Servidor
El scheduler se iniciará automáticamente cuando arranques el servidor.

## 🎯 Flujo de Trabajo

### Para Empleados:
1. **Iniciar sesión** → Redirige a `/admin/tasks`
2. **Ver tareas pendientes** → Lista de todas las tareas asignadas
3. **Clic en tarea** → Abre vista detallada con:
   - Información del cliente
   - Contraseña SAT (oculta por defecto)
   - Formulario según tipo de tarea
4. **Completar tarea**:
   - Subir archivo (si aplica)
   - Establecer próxima fecha (solo libros)
   - Marcar como completada

### Para Administradores:
- Acceso completo a todas las funcionalidades
- Pueden ver clientes, facturas, y gestionar todo

## 📧 Sistema de Recordatorios (Pendiente de Implementar)

El scheduler detecta recordatorios pero **NO envía correos aún**. Para implementar:

1. Instalar `nodemailer`: `npm install nodemailer @types/nodemailer`
2. Configurar credenciales SMTP en `.env`
3. Actualizar `sendBookReminderEmail` en `tasks-scheduler.ts` para enviar correos reales

## 🔄 Comportamiento Automático

### Tareas Mensuales (Declaración, Factura, Rectificador):
- Se activan automáticamente en la última semana del mes (días 25-31)
- O en la primera semana del mes siguiente (días 1-7)
- Solo se activan si no están completadas

### Libros al Día:
- Al completar una tarea de libros, se establece `next_payment_date`
- El sistema marca automáticamente como "pendiente a largo plazo" 2 meses antes
- Se preparan recordatorios 60 días antes del vencimiento

## 🐛 Notas Importantes

1. **Contraseña SAT**: Se descifra automáticamente si `SAT_ENC_KEY` está configurada
2. **Archivos**: Se guardan en `./uploads` (configurable con `UPLOAD_DIR`)
3. **Scheduler**: Ejecuta diariamente a las 2 AM (configurable en `start-scheduler.ts`)
4. **Omisos**: Crea la tabla automáticamente si no existe

## 📝 Próximos Pasos (Opcionales)

- [ ] Implementar envío real de correos electrónicos
- [ ] Agregar notificaciones en tiempo real
- [ ] Crear dashboard de estadísticas de tareas
- [ ] Agregar filtros y búsqueda en lista de tareas
- [ ] Implementar historial de tareas completadas

