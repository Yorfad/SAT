# Módulos Reutilizables - SAT System

Esta carpeta contiene documentación completa de módulos que pueden reutilizarse en otros proyectos. Cada módulo incluye:
- Explicación de arquitectura
- Migración SQL completa
- Código de controller (TypeScript/Express)
- Rutas
- Componentes frontend (React)
- Checklist de implementación

## Módulos Disponibles

### 1. Sistema de Columnas Dinámicas
**Archivo:** `01-DYNAMIC-COLUMNS-SYSTEM.md`

Permite a administradores crear, modificar y eliminar campos personalizados en tablas de base de datos **sin intervención del programador**. Los campos se convierten en columnas reales (no EAV).

**Características:**
- ALTER TABLE ADD/DROP/MODIFY COLUMN automático
- Protección de columnas del sistema
- Herencia por workspace (global → local)
- Sincronización de columnas existentes

**Uso típico:** CRMs, sistemas de clientes, inventarios con campos personalizables.

---

### 2. Sistema de Roles y Permisos (RBAC)
**Archivo:** `02-ROLES-PERMISSIONS-SYSTEM.md`

Control de acceso basado en roles con permisos granulares (página × acción).

**Características:**
- Roles personalizados creados por admin
- Matriz visual de permisos
- Permisos directos por usuario (sobrescriben roles)
- Auditoría de accesos
- Expiración de permisos

**Uso típico:** Paneles administrativos con múltiples niveles de acceso.

---

### 3. Sistema de Servicios Configurables
**Archivo:** `03-CONFIGURABLE-SERVICES-SYSTEM.md`

Gestión de servicios/productos con recurrencia configurable y generación automática de tareas.

**Características:**
- Recurrencia flexible (mensual, trimestral, anual, custom)
- Generación automática de facturas y tareas
- Precios personalizados por cliente
- Servicios globales y por workspace
- Scheduler con cron jobs

**Uso típico:** Empresas de servicios, sistemas de suscripciones, mantenimientos programados.

---

## Cómo Usar Esta Documentación

### Para Claude (IA):

```
Claude, necesito implementar el sistema de [columnas dinámicas/roles/servicios]
en mi proyecto. Consulta la documentación en:
C:\Users\chris\OneDrive\Escritorio\SAT\docs\reusable-modules\

Adapta el código para mi base de datos [MySQL/PostgreSQL] y framework [Express/NestJS/etc].
```

### Para Desarrolladores:

1. Abrir el archivo `.md` del módulo deseado
2. Copiar la migración SQL y adaptarla
3. Copiar el controller y ajustar nombres de tablas
4. Crear las rutas
5. Implementar frontend según ejemplos
6. Seguir el checklist de implementación

---

## Estructura de Cada Documento

```
# Título del Módulo

## Resumen
Breve descripción del módulo.

## Casos de Uso
Cuándo usar este módulo.

## Arquitectura
Diagrama ASCII del flujo de datos.

## Modelo de Datos
Diagrama de tablas y relaciones.

## Implementación
1. Migración SQL
2. Controller (TypeScript)
3. Rutas
4. Job/Scheduler (si aplica)

## Componente Frontend
Ejemplo básico en React.

## Checklist de Implementación
Lista de pasos para implementar.

## Notas para Claude
Instrucciones específicas para IA.
```

---

## Dependencias Comunes

**Backend:**
- Node.js + Express
- TypeScript
- MySQL/MariaDB
- node-cron (para schedulers)

**Frontend:**
- React
- React Query (@tanstack/react-query)
- Axios o fetch API

---

## Licencia

Código libre para uso en proyectos propios. Desarrollado como parte del sistema SAT.
