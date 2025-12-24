const mysql = require('mysql2/promise');

async function createTestTasks() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'mysql',
    user: 'root',
    password: process.env.DB_PASSWORD || 'admin123',
    database: 'sat_acme'
  });

  const clientUserId = 6; // Yair Alexander Morales Mejía
  const workspaceId = 2; // PROVIAL
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  console.log('Creando factura y tareas de prueba para cliente', clientUserId);

  // 1. Crear factura mensual para el cliente
  const [invoiceResult] = await conn.query(
    `INSERT INTO monthly_invoices (workspace_id, client_user_id, invoice_year, invoice_month, monthly_fee, total_due, balance, payment_status, services_status)
     VALUES (?, ?, ?, ?, 500.00, 500.00, 500.00, 'pending', 'pending')`,
    [workspaceId, clientUserId, currentYear, currentMonth]
  );

  const invoiceId = invoiceResult.insertId;
  console.log('Factura creada con ID:', invoiceId);

  // 2. Obtener servicios del cliente
  const [clientServices] = await conn.query(
    `SELECT cs.service_id, s.service_name
     FROM client_services cs
     JOIN services s ON s.id = cs.service_id
     WHERE cs.client_user_id = ? AND cs.status = 'active'`,
    [clientUserId]
  );

  console.log('Servicios del cliente:', clientServices.length);

  // 3. Crear tareas para cada servicio
  for (const service of clientServices) {
    // Tarea pendiente
    await conn.query(
      `INSERT INTO monthly_service_checklist (workspace_id, invoice_id, task_name, status, service_id)
       VALUES (?, ?, ?, 'pending', ?)`,
      [workspaceId, invoiceId, `${service.service_name} - Diciembre`, service.service_id]
    );
    console.log(`  - Tarea creada: ${service.service_name} - Diciembre (pendiente)`);
  }

  // 4. Crear algunas tareas "completadas" para probar la aprobación
  await conn.query(
    `INSERT INTO monthly_service_checklist (workspace_id, invoice_id, task_name, status, service_id, file_path, files_uploaded_at)
     VALUES (?, ?, 'Declaración IVA - Noviembre', 'completed', NULL, 'uploads/test-file.pdf', NOW())`,
    [workspaceId, invoiceId]
  );
  console.log('  - Tarea completada creada: Declaración IVA - Noviembre');

  await conn.query(
    `INSERT INTO monthly_service_checklist (workspace_id, invoice_id, task_name, status, service_id, file_path, files_uploaded_at)
     VALUES (?, ?, 'Balance General - Noviembre', 'completed', NULL, 'uploads/balance.pdf', NOW())`,
    [workspaceId, invoiceId]
  );
  console.log('  - Tarea completada creada: Balance General - Noviembre');

  // 5. Verificar tareas creadas
  const [tasks] = await conn.query(
    `SELECT msc.id, msc.task_name, msc.status, msc.client_approved
     FROM monthly_service_checklist msc
     JOIN monthly_invoices mi ON mi.id = msc.invoice_id
     WHERE mi.client_user_id = ?`,
    [clientUserId]
  );

  console.log('\n=== TAREAS DEL CLIENTE ===');
  tasks.forEach(t => {
    const approved = t.client_approved === null ? 'pendiente' : (t.client_approved ? 'aprobado' : 'rechazado');
    console.log(`  ${t.id}. ${t.task_name} [${t.status}] - ${approved}`);
  });

  await conn.end();
  console.log('\n¡Tareas de prueba creadas!');
}

createTestTasks().catch(console.error);
