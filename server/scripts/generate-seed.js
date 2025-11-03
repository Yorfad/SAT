#!/usr/bin/env node

/**
 * Script para generar datos de seed con contraseñas bcrypt reales
 *
 * Este script genera un archivo SQL con usuarios de prueba
 * usando hashes bcrypt reales para las contraseñas
 */

const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function generateSeed() {
  log('\n🔐 Generando hashes de contraseñas...', 'blue');

  const password = 'password123';
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);

  log(`✓ Hash generado para contraseña: "${password}"`, 'green');
  log(`Hash: ${hash}\n`, 'cyan');

  // Generar el SQL de seed
  const seedSQL = `
-- ============================================================================
-- DATOS DE SEED GENERADOS AUTOMÁTICAMENTE
-- ============================================================================
-- Generado: ${new Date().toISOString()}
-- Contraseña para todos los usuarios: "password123"
-- ============================================================================

-- Insertar usuarios de ejemplo
INSERT INTO users (email, password_hash, full_name, role, is_active) VALUES
  ('admin@sat.com', '${hash}', 'Administrador Principal', 'admin', 1),
  ('employee1@sat.com', '${hash}', 'Empleado 1', 'employee', 1),
  ('employee2@sat.com', '${hash}', 'Empleado 2', 'employee', 1),
  ('cliente1@example.com', '${hash}', 'Cliente de Prueba 1', 'client', 1),
  ('cliente2@example.com', '${hash}', 'Cliente de Prueba 2', 'client', 1);

-- Asignar clientes a employee1 (id: 2)
UPDATE users SET assigned_to_user_id = 2 WHERE email IN ('cliente1@example.com', 'cliente2@example.com');

-- Insertar servicios base
INSERT INTO services (service_name, description, default_price) VALUES
  ('Libros al Día', 'Mantenimiento de libros contables al día', 150.00),
  ('Declaración de SAT', 'Declaración mensual a 0 de la SAT', 50.00),
  ('Factura', 'Emisión de factura mensual', 75.00),
  ('Rectificador', 'Rectificación de documentos SAT', 100.00);

-- Insertar perfiles de cliente (sin contraseña SAT cifrada por ahora)
INSERT INTO clients_profiles (user_id, contract_number, overall_rating, notes) VALUES
  (4, 'CONT-001', 5.00, 'Cliente de prueba 1'),
  (5, 'CONT-002', 5.00, 'Cliente de prueba 2');

-- Insertar factura del mes actual para testing
INSERT INTO monthly_invoices (client_user_id, invoice_year, invoice_month, total_due, balance, payment_status) VALUES
  (4, YEAR(CURDATE()), MONTH(CURDATE()), 275.00, 275.00, 'pending'),
  (5, YEAR(CURDATE()), MONTH(CURDATE()), 275.00, 275.00, 'pending');

-- Insertar tareas de ejemplo para el mes actual
INSERT INTO monthly_service_checklist (invoice_id, task_name, status) VALUES
  (1, 'Libros al Día', 'pending'),
  (1, 'Declaración de SAT', 'pending'),
  (1, 'Factura', 'pending'),
  (1, 'Rectificador', 'pending'),
  (2, 'Libros al Día', 'pending'),
  (2, 'Declaración de SAT', 'pending'),
  (2, 'Factura', 'pending'),
  (2, 'Rectificador', 'pending');

SELECT '✓ Datos de seed cargados exitosamente' AS Status;
`;

  const outputPath = path.join(__dirname, 'seed-generated.sql');
  fs.writeFileSync(outputPath, seedSQL);

  log(`✓ Archivo de seed generado: ${outputPath}`, 'green');
  log(`\n📋 Usuarios creados:`, 'cyan');
  log(`   • admin@sat.com (admin)`, 'cyan');
  log(`   • employee1@sat.com (employee)`, 'cyan');
  log(`   • employee2@sat.com (employee)`, 'cyan');
  log(`   • cliente1@example.com (client)`, 'cyan');
  log(`   • cliente2@example.com (client)`, 'cyan');
  log(`   Contraseña para todos: "password123"\n`, 'cyan');
}

generateSeed().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
