const mysql = require('mysql2/promise');

async function assignDefaults() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'mysql',
    user: 'root',
    password: process.env.DB_PASSWORD || 'admin123',
    database: 'sat_acme'
  });

  const clientUserId = 6; // Yair Alexander Morales Mejía
  const today = new Date().toISOString().split('T')[0];

  // Obtener servicios con assignment_type = 'all_clients'
  const [services] = await conn.query(
    `SELECT id, service_name, default_price
     FROM services
     WHERE assignment_type = 'all_clients' AND is_active = 1`
  );

  console.log(`Asignando ${services.length} servicios por defecto al cliente ${clientUserId}...\n`);

  let assigned = 0;
  for (const service of services) {
    // Verificar si ya tiene el servicio
    const [existing] = await conn.query(
      'SELECT id FROM client_services WHERE client_user_id = ? AND service_id = ?',
      [clientUserId, service.id]
    );

    if (existing.length === 0) {
      await conn.query(
        `INSERT INTO client_services (client_user_id, service_id, custom_price, status, start_date)
         VALUES (?, ?, ?, 'active', ?)`,
        [clientUserId, service.id, service.default_price, today]
      );
      console.log(`✓ Asignado: ${service.service_name}`);
      assigned++;
    } else {
      console.log(`- Ya existe: ${service.service_name}`);
    }
  }

  // Mostrar servicios del cliente
  const [clientServices] = await conn.query(
    `SELECT s.service_name, cs.status, cs.start_date
     FROM client_services cs
     JOIN services s ON s.id = cs.service_id
     WHERE cs.client_user_id = ?
     ORDER BY s.service_name`,
    [clientUserId]
  );

  console.log(`\n=== SERVICIOS DEL CLIENTE (ID: ${clientUserId}) ===`);
  clientServices.forEach(s => {
    console.log(`  - ${s.service_name} [${s.status}] desde ${s.start_date}`);
  });

  await conn.end();
  console.log(`\n¡${assigned} nuevos servicios asignados!`);
}

assignDefaults().catch(console.error);
