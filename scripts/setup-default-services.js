const mysql = require('mysql2/promise');

async function setupDefaultServices() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'mysql',
    user: 'root',
    password: process.env.DB_PASSWORD || 'admin123',
    database: 'sat_acme'
  });

  // Los 4 servicios que TODOS los clientes deben tener
  const defaultServices = [
    {
      service_name: 'Facturación',
      description: 'Servicio mensual de facturación electrónica',
      default_price: 0, // Incluido en paquete base
      recurrence_type: 'monthly',
      activation_day: 1,
      is_global: 1,
      assignment_type: 'all_clients',
      is_active: 1
    },
    {
      service_name: 'Verificador Integrado',
      description: 'Verificación integrada de documentos fiscales',
      default_price: 0,
      recurrence_type: 'monthly',
      activation_day: 1,
      is_global: 1,
      assignment_type: 'all_clients',
      is_active: 1
    },
    {
      service_name: 'Apertura de Libros',
      description: 'Apertura y configuración de libros contables',
      default_price: 0,
      recurrence_type: 'annual', // Una vez al año
      activation_day: 1,
      is_global: 1,
      assignment_type: 'all_clients',
      is_active: 1
    },
    {
      service_name: 'Pago de Libros',
      description: 'Gestión de pago de libros contables',
      default_price: 0,
      recurrence_type: 'annual',
      activation_day: 1,
      is_global: 1,
      assignment_type: 'all_clients',
      is_active: 1
    }
  ];

  console.log('Configurando servicios por defecto...\n');

  for (const service of defaultServices) {
    // Verificar si ya existe
    const [existing] = await conn.query(
      'SELECT id FROM services WHERE service_name = ?',
      [service.service_name]
    );

    if (existing.length > 0) {
      // Actualizar para que sea all_clients
      await conn.query(
        `UPDATE services SET
          assignment_type = 'all_clients',
          is_global = 1,
          is_active = 1
        WHERE id = ?`,
        [existing[0].id]
      );
      console.log(`✓ Actualizado: ${service.service_name} (ID: ${existing[0].id})`);
    } else {
      // Crear nuevo
      const [result] = await conn.query(
        `INSERT INTO services (service_name, description, default_price, recurrence_type, activation_day, is_global, assignment_type, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [service.service_name, service.description, service.default_price, service.recurrence_type, service.activation_day, service.is_global, service.assignment_type, service.is_active]
      );
      console.log(`✓ Creado: ${service.service_name} (ID: ${result.insertId})`);
    }
  }

  // Mostrar servicios con assignment_type = 'all_clients'
  console.log('\n=== SERVICIOS POR DEFECTO (all_clients) ===');
  const [allDefaults] = await conn.query(
    "SELECT id, service_name, default_price, recurrence_type FROM services WHERE assignment_type = 'all_clients' AND is_active = 1"
  );
  allDefaults.forEach(s => {
    console.log(`  ${s.id}. ${s.service_name} - Q${s.default_price} (${s.recurrence_type})`);
  });

  await conn.end();
  console.log('\n¡Servicios por defecto configurados!');
}

setupDefaultServices().catch(console.error);
