/**
 * Script para insertar datos de ejemplo en la base de datos
 * Ejecutar con: npx ts-node scripts/seed-data.ts (desde el directorio server)
 */

import bcrypt from 'bcryptjs';
import { getPoolForTenantSlug } from '../src/config/database';
import { encrypt } from '../src/utils/encryption';
import '../src/config/env'; // Cargar variables de entorno

// Obtener el tenant desde argumentos de línea de comandos o usar 'acme' por defecto
const TENANT_SLUG = process.argv[2] || 'acme'; // Usa el primer argumento o 'acme' por defecto
const PASSWORD = 'password123';

async function seedData() {
  console.log(`🔧 Intentando conectar al tenant: "${TENANT_SLUG}"`);
  console.log('💡 Si falla, verifica que el tenant existe en tu archivo .env (variable TENANTS)');
  console.log('💡 Puedes especificar el tenant como argumento: npx ts-node scripts/seed-data.ts acme');

  // Obtener configuración del tenant
  const { env } = await import('../src/config/env');
  const tenantConfig = (env.tenants as any)[TENANT_SLUG];

  if (!tenantConfig) {
    throw new Error(`Tenant "${TENANT_SLUG}" no encontrado en la configuración`);
  }

  const dbName = tenantConfig.database;
  console.log(`📦 Base de datos objetivo: ${dbName}`);

  // Conectar a MySQL sin seleccionar base de datos específica
  const mysql = (await import('mysql2/promise')).default;
  const rootConnection = await mysql.createConnection({
    host: env.dbHost,
    port: env.dbPort,
    user: env.dbUser,
    password: env.dbPassword,
    multipleStatements: true
  });

  console.log('✅ Conexión a MySQL establecida');

  // Eliminar base de datos si existe
  console.log(`🗑️  Eliminando base de datos "${dbName}" si existe...`);
  await rootConnection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
  console.log('✅ Base de datos eliminada');

  // Crear base de datos nueva
  console.log(`🆕 Creando base de datos "${dbName}"...`);
  await rootConnection.query(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  console.log('✅ Base de datos creada');

  // Cerrar conexión root
  await rootConnection.end();

  // Conectar a la base de datos del tenant
  let db;
  try {
    db = getPoolForTenantSlug(TENANT_SLUG);
    console.log('✅ Conexión a la base de datos del tenant establecida');
  } catch (error: any) {
    console.error('❌ Error al conectar:', error.message);
    throw error;
  }

  // Ejecutar migraciones
  console.log('📋 Ejecutando migraciones...');
  const fs = (await import('fs')).default;
  const path = (await import('path')).default;

  const migDir = path.resolve(__dirname, '../src/migrations');
  const migFiles = fs.readdirSync(migDir).filter(f => f.endsWith('.sql')).sort();

  // Crear conexión con multipleStatements habilitado
  const migConnection = await mysql.createConnection({
    host: env.dbHost,
    port: env.dbPort,
    user: env.dbUser,
    password: env.dbPassword,
    database: dbName,
    multipleStatements: true
  });

  for (const file of migFiles) {
    const sql = fs.readFileSync(path.join(migDir, file), 'utf8');
    console.log(`   ⚙️  Aplicando: ${file}`);
    await migConnection.query(sql);
  }

  await migConnection.end();
  console.log('✅ Migraciones aplicadas correctamente');
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  try {
    // Las migraciones ya crearon todas las tablas y columnas necesarias
    console.log('🌱 Insertando datos de ejemplo...');

    // 2. Insertar usuarios (primero admin y employee, luego clientes para poder asignarlos)
    await db.query(`
      INSERT INTO users (email, password_hash, full_name, role, nit, is_active) VALUES
      ('admin@acme.com', ?, 'Administrador Principal', 'admin', 'ADMIN-001', 1),
      ('empleado@acme.com', ?, 'Empleado Ejemplo', 'employee', 'EMP-001', 1)
    `, [passwordHash, passwordHash]);

    // Obtener IDs de admin y employee
    const [adminRows]: any = await db.query(`SELECT id FROM users WHERE email = 'admin@acme.com'`);
    const [employeeRows]: any = await db.query(`SELECT id FROM users WHERE email = 'empleado@acme.com'`);

    const adminId = adminRows[0].id;
    const employeeId = employeeRows[0].id;

    // Insertar clientes asignados (2 al admin, 1 al employee)
    await db.query(`
      INSERT INTO users (email, password_hash, full_name, role, nit, is_active, assigned_to_user_id) VALUES
      ('cliente1@example.com', ?, 'Juan Pérez', 'client', '1234-567890-001-2', 1, ?),
      ('cliente2@example.com', ?, 'María García', 'client', '9876-543210-001-3', 1, ?),
      ('cliente3@example.com', ?, 'Carlos Rodríguez', 'client', '5555-123456-001-4', 1, ?)
    `, [passwordHash, adminId, passwordHash, adminId, passwordHash, employeeId]);

    // Obtener IDs de clientes
    const [client1Rows]: any = await db.query(`SELECT id FROM users WHERE email = 'cliente1@example.com'`);
    const [client2Rows]: any = await db.query(`SELECT id FROM users WHERE email = 'cliente2@example.com'`);
    const [client3Rows]: any = await db.query(`SELECT id FROM users WHERE email = 'cliente3@example.com'`);

    const client1Id = client1Rows[0].id;
    const client2Id = client2Rows[0].id;
    const client3Id = client3Rows[0].id;

    console.log('✅ Usuarios creados:', { adminId, employeeId, client1Id, client2Id, client3Id });
    console.log(`   - Cliente 1 y 2 asignados al Admin (ID: ${adminId})`);
    console.log(`   - Cliente 3 asignado al Empleado (ID: ${employeeId})`);

    // 2. Verificar/Crear servicios si no existen
    const [existingServices]: any = await db.query(`SELECT id, service_name FROM services ORDER BY id`);
    
    // Servicios necesarios
    const requiredServices = [
      { name: 'Contabilidad Mensual', description: 'Lleva contabilidad mensual', price: 75.00 },
      { name: 'Declaración IVA', description: 'Declaración mensual de IVA', price: 50.00 },
      { name: 'Apertura de Libros', description: 'Apertura y legalización de libros contables', price: 85.00 }
    ];

    // Verificar y crear servicios faltantes
    const existingServiceNames = existingServices.map((s: any) => s.service_name);
    
    for (const reqService of requiredServices) {
      if (!existingServiceNames.includes(reqService.name)) {
        console.log(`⚠️  Creando servicio faltante: ${reqService.name}`);
        await db.query(`
          INSERT INTO services (service_name, description, default_price) VALUES
          (?, ?, ?)
        `, [reqService.name, reqService.description, reqService.price]);
      }
    }

    // Obtener IDs de servicios (ahora deberían existir los 3)
    const [services]: any = await db.query(`
      SELECT id, service_name FROM services 
      WHERE service_name IN (?, ?, ?) 
      ORDER BY 
        CASE service_name 
          WHEN 'Contabilidad Mensual' THEN 1
          WHEN 'Declaración IVA' THEN 2
          WHEN 'Apertura de Libros' THEN 3
        END
    `, [requiredServices[0].name, requiredServices[1].name, requiredServices[2].name]);
    
    if (services.length < 3) {
      throw new Error(`Se necesitan al menos 3 servicios pero solo hay ${services.length}`);
    }
    
    const service1Id = services.find((s: any) => s.service_name === 'Contabilidad Mensual')?.id || services[0].id;
    const service2Id = services.find((s: any) => s.service_name === 'Declaración IVA')?.id || services[1].id;
    const service3Id = services.find((s: any) => s.service_name === 'Apertura de Libros')?.id || services[2].id;
    
    console.log(`✅ IDs de servicios: ${service1Id} (Contabilidad), ${service2Id} (IVA), ${service3Id} (Libros)`);

    // 3. Insertar servicios para clientes
    await db.query(`
      INSERT INTO client_services (client_user_id, service_id, status, start_date) VALUES
      (?, ?, 'active', CURDATE()),
      (?, ?, 'active', CURDATE()),
      (?, ?, 'active', CURDATE()),
      (?, ?, 'active', CURDATE()),
      (?, ?, 'active', CURDATE()),
      (?, ?, 'active', CURDATE()),
      (?, ?, 'active', CURDATE())
    `, [
      client1Id, service1Id,
      client1Id, service2Id,
      client2Id, service1Id,
      client2Id, service3Id,
      client3Id, service1Id,
      client3Id, service2Id,
      client3Id, service3Id
    ]);

    console.log('✅ Servicios de clientes creados');

    // 4. Insertar perfiles de clientes con contraseñas SAT encriptadas
    const satPassword1 = encrypt('SAT_PASSWORD_123');
    const satPassword2 = encrypt('SAT_PASS_456');
    const satPassword3 = encrypt('SAT_SECURE_789');

    await db.query(`
      INSERT INTO clients_profiles (user_id, contract_number, sat_password_encrypted, overall_rating, notes) VALUES
      (?, 'CONT-2024-001', ?, 5.00, 'Cliente muy puntual, requiere atención personalizada'),
      (?, 'CONT-2024-002', ?, 4.50, 'Factura mensualmente, sin observaciones'),
      (?, 'CONT-2024-003', ?, 4.75, 'Cliente nuevo, primer mes de servicio')
    `, [client1Id, satPassword1, client2Id, satPassword2, client3Id, satPassword3]);

    console.log('✅ Perfiles de clientes creados con contraseñas SAT encriptadas');

    // 5. Insertar facturas mensuales (observations ya existe por migración)
    await db.query(`
      INSERT INTO monthly_invoices (
        client_user_id, invoice_year, invoice_month,
        previous_debt, monthly_fee, extras_fee, extras_description,
        total_due, amount_paid, balance, payment_status, services_status, observations
      ) VALUES
      (?, ?, ?, 0.00, 125.00, 25.00, 'Costo adicional por consulta', 150.00, 0.00, 150.00, 'pending', 'pending', 'Cliente puntual, requiere seguimiento'),
      (?, ?, ?, 0.00, 125.00, 0.00, NULL, 125.00, 75.00, 50.00, 'partial', 'pending', NULL),
      (?, ?, ?, 0.00, 160.00, 0.00, NULL, 160.00, 0.00, 160.00, 'pending', 'pending', 'Cliente nuevo, primera factura'),
      (?, ?, ?, 0.00, 160.00, 0.00, NULL, 160.00, 160.00, 0.00, 'paid', 'completed', NULL),
      (?, ?, ?, 50.00, 210.00, 0.00, NULL, 260.00, 0.00, 260.00, 'pending', 'pending', 'Tiene deuda pendiente del mes anterior'),
      (?, ?, ?, 0.00, 210.00, 0.00, NULL, 210.00, 160.00, 50.00, 'partial', 'pending', NULL)
    `, [
      client1Id, currentYear, currentMonth,
      client1Id, prevYear, prevMonth,
      client2Id, currentYear, currentMonth,
      client2Id, prevYear, prevMonth,
      client3Id, currentYear, currentMonth,
      client3Id, prevYear, prevMonth,
    ]);

    // Obtener IDs de facturas
    const [inv1Curr]: any = await db.query(
      `SELECT id FROM monthly_invoices WHERE client_user_id = ? AND invoice_year = ? AND invoice_month = ?`,
      [client1Id, currentYear, currentMonth]
    );
    const [inv1Prev]: any = await db.query(
      `SELECT id FROM monthly_invoices WHERE client_user_id = ? AND invoice_year = ? AND invoice_month = ?`,
      [client1Id, prevYear, prevMonth]
    );
    const [inv2Curr]: any = await db.query(
      `SELECT id FROM monthly_invoices WHERE client_user_id = ? AND invoice_year = ? AND invoice_month = ?`,
      [client2Id, currentYear, currentMonth]
    );
    const [inv2Prev]: any = await db.query(
      `SELECT id FROM monthly_invoices WHERE client_user_id = ? AND invoice_year = ? AND invoice_month = ?`,
      [client2Id, prevYear, prevMonth]
    );
    const [inv3Curr]: any = await db.query(
      `SELECT id FROM monthly_invoices WHERE client_user_id = ? AND invoice_year = ? AND invoice_month = ?`,
      [client3Id, currentYear, currentMonth]
    );
    const [inv3Prev]: any = await db.query(
      `SELECT id FROM monthly_invoices WHERE client_user_id = ? AND invoice_year = ? AND invoice_month = ?`,
      [client3Id, prevYear, prevMonth]
    );

    const inv1CurrId = inv1Curr[0].id;
    const inv1PrevId = inv1Prev[0].id;
    const inv2CurrId = inv2Curr[0].id;
    const inv2PrevId = inv2Prev[0].id;
    const inv3CurrId = inv3Curr[0].id;
    const inv3PrevId = inv3Prev[0].id;

    console.log('✅ Facturas creadas');

    // 6. Insertar checklist de tareas (5 tipos principales de SAT)
    await db.query(`
      INSERT INTO monthly_service_checklist (invoice_id, task_name, status) VALUES
      (?, 'Declaración SAT', 'pending'),
      (?, 'Factura', 'pending'),
      (?, 'Rectificador', 'pending'),
      (?, 'Libros al Día', 'pending'),
      (?, 'Omisos', 'pending'),
      (?, 'Declaración SAT', 'completed'),
      (?, 'Factura', 'completed'),
      (?, 'Declaración SAT', 'pending'),
      (?, 'Factura', 'pending'),
      (?, 'Libros al Día', 'pending'),
      (?, 'Declaración SAT', 'pending'),
      (?, 'Factura', 'pending'),
      (?, 'Rectificador', 'pending'),
      (?, 'Libros al Día', 'pending'),
      (?, 'Omisos', 'pending')
    `, [
      // Cliente 1 - mes actual (5 tareas)
      inv1CurrId, inv1CurrId, inv1CurrId, inv1CurrId, inv1CurrId,
      // Cliente 1 - mes anterior (2 completadas)
      inv1PrevId, inv1PrevId,
      // Cliente 2 - mes actual (3 tareas)
      inv2CurrId, inv2CurrId, inv2CurrId,
      // Cliente 3 - mes actual (5 tareas)
      inv3CurrId, inv3CurrId, inv3CurrId, inv3CurrId, inv3CurrId
    ]);

    console.log('✅ Tareas de checklist creadas (Declaración SAT, Factura, Rectificador, Libros, Omisos)');

    // 7. Insertar items de servicios en facturas
    await db.query(`
      INSERT INTO invoice_service_items (invoice_id, service_id, description, quantity, unit_price) VALUES
      (?, ?, 'Contabilidad Mensual', 1.00, 75.00),
      (?, ?, 'Declaración IVA', 1.00, 50.00),
      (?, ?, 'Contabilidad Mensual', 1.00, 75.00),
      (?, ?, 'Declaración IVA', 1.00, 50.00),
      (?, ?, 'Contabilidad Mensual', 1.00, 75.00),
      (?, ?, 'Apertura de Libros', 1.00, 85.00),
      (?, ?, 'Contabilidad Mensual', 1.00, 75.00),
      (?, ?, 'Apertura de Libros', 1.00, 85.00),
      (?, ?, 'Contabilidad Mensual', 1.00, 75.00),
      (?, ?, 'Declaración IVA', 1.00, 50.00),
      (?, ?, 'Apertura de Libros', 1.00, 85.00),
      (?, ?, 'Contabilidad Mensual', 1.00, 75.00),
      (?, ?, 'Declaración IVA', 1.00, 50.00),
      (?, ?, 'Apertura de Libros', 1.00, 85.00)
    `, [
      inv1CurrId, service1Id, inv1CurrId, service2Id,
      inv1PrevId, service1Id, inv1PrevId, service2Id,
      inv2CurrId, service1Id, inv2CurrId, service3Id,
      inv2PrevId, service1Id, inv2PrevId, service3Id,
      inv3CurrId, service1Id, inv3CurrId, service2Id, inv3CurrId, service3Id,
      inv3PrevId, service1Id, inv3PrevId, service2Id, inv3PrevId, service3Id
    ]);

    console.log('✅ Items de servicios en facturas creados');

    // Verificar datos
    const [userCount]: any = await db.query(`SELECT COUNT(*) as total FROM users`);
    const [invoiceCount]: any = await db.query(`SELECT COUNT(*) as total FROM monthly_invoices`);
    const [pendingTasks]: any = await db.query(`SELECT COUNT(*) as total FROM monthly_service_checklist WHERE status = 'pending'`);
    const [completedTasks]: any = await db.query(`SELECT COUNT(*) as total FROM monthly_service_checklist WHERE status = 'completed'`);

    console.log('\n📊 Resumen:');
    console.log(`- Usuarios: ${userCount[0].total}`);
    console.log(`- Facturas: ${invoiceCount[0].total}`);
    console.log(`- Tareas pendientes: ${pendingTasks[0].total}`);
    console.log(`- Tareas completadas: ${completedTasks[0].total}`);
    console.log('\n✅ Datos de ejemplo insertados exitosamente!');
    console.log('\nCredenciales de prueba:');
    console.log('Admin: admin@acme.com / password123');
    console.log('Empleado: empleado@acme.com / password123');
    console.log('Cliente 1: cliente1@example.com / password123');

  } catch (error: any) {
    console.error('❌ Error insertando datos:', error.message);
    throw error;
  }
}

// Ejecutar
seedData().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});

