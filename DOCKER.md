# Guia de Docker para SAT

## ¿Qué es Docker?

**Docker** es una plataforma de contenedores que permite empaquetar una aplicación junto con todas sus dependencias (código, librerías, configuración, base de datos) en una "caja" portátil llamada **contenedor**.

### Beneficios principales:

1. **Portabilidad**: "Si funciona en mi máquina, funciona en cualquier máquina"
2. **Consistencia**: El mismo entorno en desarrollo, pruebas y producción
3. **Aislamiento**: Cada servicio corre en su propio contenedor sin conflictos
4. **Facilidad de despliegue**: Un solo comando para levantar todo el sistema

### Analogía simple:

Imagina que quieres enviar un pez a un amigo. En lugar de enviar solo el pez (que moriría), envías una **pecera completa** con agua, filtro, oxígeno y comida. El pez llega vivo y funcionando porque tiene todo su entorno.

Docker hace lo mismo con aplicaciones: empaqueta la app + sistema operativo + dependencias + configuración en un contenedor.

---

## Estructura de Docker en SAT

```
SAT/
├── docker-compose.yml          # Orquestador de contenedores
├── .env.example                # Variables de entorno (copiar como .env)
├── docker/
│   └── mysql/
│       └── init/               # Scripts que se ejecutan al crear la BD
│           ├── 01-create-databases.sh
│           ├── 02-apply-migrations.sh
│           └── 03-seed-data.sh
├── server/
│   └── Dockerfile              # Instrucciones para construir backend
└── front/
    ├── Dockerfile              # Instrucciones para construir frontend
    └── nginx.conf              # Configuración del servidor web
```

---

## Servicios (Contenedores)

El sistema crea 3 contenedores:

| Servicio | Imagen | Puerto | Descripción |
|----------|--------|--------|-------------|
| `mysql` | MySQL 8.0 | 3310 | Base de datos |
| `backend` | Node.js 20 | 3000 | API REST |
| `frontend` | Nginx | 80 | Interfaz web |

---

## Requisitos previos

1. **Instalar Docker Desktop**:
   - Windows: https://docs.docker.com/desktop/install/windows-install/
   - Mac: https://docs.docker.com/desktop/install/mac-install/
   - Linux: https://docs.docker.com/engine/install/

2. **Verificar instalación**:
   ```bash
   docker --version
   docker-compose --version
   ```

---

## Guía de uso

### 1. Preparar configuración

```bash
# Copiar archivo de variables de entorno
cp .env.example .env

# Editar .env si necesitas cambiar configuración (puertos, contraseñas, etc.)
```

### 2. Construir y levantar contenedores

```bash
# Primera vez o después de cambios en código:
docker-compose up --build -d

# Veces siguientes (sin reconstruir):
docker-compose up -d
```

El flag `-d` ejecuta en segundo plano (detached mode).

### 3. Ver logs

```bash
# Todos los servicios
docker-compose logs -f

# Solo un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### 4. Detener contenedores

```bash
# Detener sin eliminar datos
docker-compose stop

# Detener y eliminar contenedores (mantiene datos de BD)
docker-compose down

# Detener y eliminar TODO (incluyendo datos de BD)
docker-compose down -v
```

### 5. Comandos útiles

```bash
# Ver contenedores corriendo
docker ps

# Entrar al contenedor de backend (para debug)
docker exec -it sat_backend sh

# Entrar a MySQL
docker exec -it sat_mysql mysql -u root -padmin123

# Reiniciar un servicio específico
docker-compose restart backend
```

---

## Acceso a la aplicación

Una vez levantados los contenedores:

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| Frontend | http://localhost:80 | - |
| Backend API | http://localhost:3000/api | - |
| MySQL | localhost:3310 | root / admin123 |

**Usuario admin inicial:**
- Email: `admin@sat.com`
- Password: `password123`

---

## Desarrollo vs Producción

### Desarrollo (local)
```bash
docker-compose up -d
```

### Producción
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## Solución de problemas

### Error: Puerto en uso
```bash
# Ver qué usa el puerto 3000
netstat -ano | findstr :3000

# Cambiar puerto en .env
BACKEND_PORT=3001
```

### Error: No space left on device
```bash
# Limpiar imágenes y contenedores no usados
docker system prune -a
```

### Error: Base de datos no inicializada
```bash
# Eliminar volumen de MySQL y recrear
docker-compose down -v
docker-compose up -d
```

### Ver logs de errores específicos
```bash
docker-compose logs --tail=100 backend
```

---

## Multi-tenant (Múltiples empresas)

El sistema soporta múltiples bases de datos (tenants):

```env
# En .env
TENANTS={"acme":{"database":"sat_acme"},"solis":{"database":"sat_solis"}}
```

Cada tenant accede con su subdominio:
- `acme.tudominio.com` → usa `sat_acme`
- `solis.tudominio.com` → usa `sat_solis`

---

## Workspaces (Separación dentro de un tenant)

Dentro de cada base de datos, puedes crear workspaces para separar:
- Clientes por empresa
- Empleados asignados
- Servicios específicos
- Métricas independientes

Los servicios marcados como "globales" están disponibles en todos los workspaces.

---

## Backup y restauración

### Crear backup
```bash
docker exec sat_mysql mysqldump -u root -padmin123 sat_acme > backup_acme.sql
docker exec sat_mysql mysqldump -u root -padmin123 sat_solis > backup_solis.sql
```

### Restaurar backup
```bash
docker exec -i sat_mysql mysql -u root -padmin123 sat_acme < backup_acme.sql
```

---

## Resumen de comandos

| Acción | Comando |
|--------|---------|
| Iniciar todo | `docker-compose up -d` |
| Detener todo | `docker-compose down` |
| Ver logs | `docker-compose logs -f` |
| Reconstruir | `docker-compose up --build -d` |
| Estado | `docker-compose ps` |
| Entrar a MySQL | `docker exec -it sat_mysql mysql -u root -padmin123` |
| Backup | `docker exec sat_mysql mysqldump -u root -padmin123 DB > backup.sql` |

---

## Estructura de archivos Docker

### docker-compose.yml
Define los 3 servicios y cómo se conectan entre sí.

### server/Dockerfile
1. Usa Node.js 20 Alpine (imagen ligera)
2. Instala dependencias de producción
3. Compila TypeScript a JavaScript
4. Ejecuta el servidor compilado

### front/Dockerfile
1. Etapa 1: Compila React con Vite
2. Etapa 2: Sirve archivos estáticos con Nginx

### docker/mysql/init/
Scripts que se ejecutan **solo la primera vez** que se crea el contenedor de MySQL:
1. `01-create-databases.sh`: Crea las bases de datos
2. `02-apply-migrations.sh`: Aplica todas las migraciones
3. `03-seed-data.sh`: Inserta datos iniciales (admin, servicios, permisos)

---

## Sistema de Códigos de Registro

Cada workspace tiene un código único de 4 dígitos para que los clientes se registren automáticamente.

### ¿Cómo funciona?

1. **Código único por workspace**: Al crear un workspace, se genera automáticamente un código de 4 dígitos (ej: `0071`, `8053`)

2. **Flujo de registro**:
   - El admin dice al cliente: "Usa el código 0071 para registrarte"
   - El cliente abre la app móvil y va a "Registrarse"
   - Ingresa el código de 4 dígitos
   - El sistema detecta automáticamente:
     - A qué tenant (empresa) pertenece
     - A qué workspace se asignará
   - El cliente completa sus datos y queda registrado

3. **Auto-aprobación**: Si el workspace tiene `auto_approve_registration = TRUE`, el cliente puede usar la app inmediatamente. Si no, requiere aprobación del admin.

### Ver código de un workspace

En el panel de admin:
1. Ir a **Invitaciones** en el menú lateral
2. Se muestra el código grande del workspace actual
3. Click para copiar

### Endpoints públicos (sin autenticación)

```bash
# Validar un código
POST /api/public/validate-code
Content-Type: application/json
{"code": "0071"}

# Respuesta
{
  "valid": true,
  "tenant": "acme",
  "tenantName": "ACME",
  "workspaceId": 1,
  "workspaceName": "General",
  "autoApprove": true
}

# Registrar cliente con código
POST /api/public/register-with-code
Content-Type: application/json
{
  "code": "0071",
  "fullName": "Juan Pérez",
  "nit": "12345678",
  "password": "mipassword123",
  "email": "juan@email.com"  // opcional
}
```

### Base de datos

El código se almacena en la tabla `workspaces`:

```sql
SELECT id, name, registration_code, auto_approve_registration
FROM workspaces;

-- Resultado:
-- id | name    | registration_code | auto_approve_registration
-- 1  | General | 0071              | 1
-- 2  | PROVIAL | 8053              | 1
```

### Notas técnicas

- Los códigos son únicos a nivel global (no solo dentro del tenant)
- Se generan automáticamente al crear un workspace
- No hay límite de usos por código (a diferencia del sistema antiguo de invitation_codes)
- El código nunca expira
