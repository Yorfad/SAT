# Scripts de Datos de Ejemplo

Este directorio contiene scripts para insertar datos de ejemplo en la base de datos.

## Requisitos Previos

1. La base de datos debe estar creada y migrada
2. El tenant `default` debe existir en la tabla `tenants`
3. Los servicios básicos deben estar creados (ya existen en el dump)

## Opción 1: Script SQL

Ejecuta el script SQL directamente en MySQL:

```bash
mysql -u tu_usuario -p tu_base_de_datos < server/scripts/seed-example-data.sql
```

O desde la línea de comandos de MySQL:

```sql
SOURCE server/scripts/seed-example-data.sql;
```

## Opción 2: Script TypeScript (Recomendado)

Ejecuta el script TypeScript que maneja mejor los errores:

```bash
cd server
npx ts-node scripts/seed-data.ts
```

O si tienes un script en package.json:

```bash
npm run seed
```

## Datos Incluidos

El script crea:

1. **5 Usuarios:**
   - 1 Administrador (admin@acme.com)
   - 1 Empleado (empleado@acme.com)
   - 3 Clientes (cliente1, cliente2, cliente3@example.com)
   - **Contraseña para todos:** `password123`

2. **Facturas Mensuales:**
   - Facturas del mes actual y anterior para cada cliente
   - Estados variados: pending, partial, paid
   - Incluye observaciones y diferentes montos

3. **Tareas de Checklist:**
   - Tareas pendientes para cada factura
   - Al menos una tarea completada para ejemplo
   - Tipos: "Factura del mes", "Declaración de IVA", "Apertura de Libros"

4. **Servicios para Clientes:**
   - Cada cliente tiene servicios activos asignados
   - Variedad de combinaciones de servicios

## Verificación

Después de ejecutar el script, verifica que los datos se insertaron:

```sql
-- Ver usuarios
SELECT id, email, role, full_name FROM users WHERE tenant_id = 1;

-- Ver facturas
SELECT id, client_user_id, invoice_year, invoice_month, total_due, payment_status 
FROM monthly_invoices WHERE tenant_id = 1;

-- Ver tareas pendientes
SELECT msc.id, msc.task_name, msc.status, mi.invoice_month, mi.invoice_year, u.full_name AS client_name
FROM monthly_service_checklist msc
JOIN monthly_invoices mi ON mi.id = msc.invoice_id
JOIN users u ON u.id = mi.client_user_id
WHERE msc.tenant_id = 1 AND msc.status = 'pending';
```

## Notas

- Todas las contraseñas son `password123`
- Los datos están asociados a `tenant_id = 1` (ajusta si es necesario)
- Los meses se calculan automáticamente (mes actual y anterior)
- Si ya existen usuarios con esos emails, el script SQL fallará (el TypeScript maneja esto mejor)

