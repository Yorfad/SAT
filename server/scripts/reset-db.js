#!/usr/bin/env node

/**
 * Script para resetear la base de datos completamente
 *
 * Este script elimina TODAS las tablas y datos, y recrea la base de datos desde cero.
 * ⚠️ ADVERTENCIA: Solo debe usarse en desarrollo o para limpiar datos corruptos
 *
 * Uso:
 *   node scripts/reset-db.js [nombre_db]
 *
 * Ejemplos:
 *   node scripts/reset-db.js sat_acme
 *   npm run reset-db sat_acme
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function resetDatabase() {
  const dbName = process.argv[2];

  log('\n═══════════════════════════════════════════════════════════', 'cyan');
  log('   RESET COMPLETO DE BASE DE DATOS', 'cyan');
  log('═══════════════════════════════════════════════════════════\n', 'cyan');

  if (!dbName) {
    log('❌ Error: Debes especificar el nombre de la base de datos', 'red');
    log('\nUso: node scripts/reset-db.js [nombre_db]', 'yellow');
    log('Ejemplo: node scripts/reset-db.js sat_acme\n', 'yellow');
    process.exit(1);
  }

  log(`⚠️  ADVERTENCIA: Este script ELIMINARÁ TODOS LOS DATOS de la base de datos: ${dbName}`, 'yellow');
  log('⚠️  Solo debe usarse en desarrollo\n', 'yellow');

  // Leer el archivo SQL
  const sqlPath = path.join(__dirname, 'reset-database.sql');

  if (!fs.existsSync(sqlPath)) {
    log(`❌ Error: No se encuentra el archivo ${sqlPath}`, 'red');
    process.exit(1);
  }

  const sqlScript = fs.readFileSync(sqlPath, 'utf8');

  log(`📄 Archivo SQL cargado: ${sqlPath}`, 'blue');

  // Configuración de conexión
  const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || '3310'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    multipleStatements: true, // Importante para ejecutar múltiples sentencias
  };

  log(`🔌 Conectando a ${config.host}:${config.port} como ${config.user}...`, 'blue');

  let connection;
  try {
    connection = await mysql.createConnection(config);
    log('✓ Conexión establecida\n', 'green');

    log('🗑️  Eliminando tablas existentes...', 'yellow');
    log('📦 Recreando estructura de base de datos...', 'yellow');
    log('🌱 Cargando datos de seed...\n', 'yellow');

    // Ejecutar el script SQL completo
    await connection.query(sqlScript);

    log('═══════════════════════════════════════════════════════════', 'green');
    log('✅ BASE DE DATOS RESETEADA EXITOSAMENTE', 'green');
    log('═══════════════════════════════════════════════════════════\n', 'green');

    // Mostrar resumen
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [services] = await connection.query('SELECT COUNT(*) as count FROM services');
    const [tasks] = await connection.query('SELECT COUNT(*) as count FROM monthly_service_checklist');

    log('📊 Resumen:', 'cyan');
    log(`   • Usuarios creados: ${users[0].count}`, 'cyan');
    log(`   • Servicios creados: ${services[0].count}`, 'cyan');
    log(`   • Tareas creadas: ${tasks[0].count}`, 'cyan');

    log('\n💡 Usuarios de prueba:', 'magenta');
    log('   • admin@sat.com (admin)', 'magenta');
    log('   • employee1@sat.com (employee)', 'magenta');
    log('   • employee2@sat.com (employee)', 'magenta');
    log('   • cliente1@example.com (client)', 'magenta');
    log('   • cliente2@example.com (client)', 'magenta');
    log('   Contraseña para todos: "password123"\n', 'magenta');

    log('⚠️  NOTA: Actualiza los password_hash en el script SQL con hashes reales de bcrypt\n', 'yellow');

  } catch (error) {
    log('\n❌ Error al resetear la base de datos:', 'red');
    log(error.message, 'red');
    if (error.sqlMessage) {
      log(`SQL Error: ${error.sqlMessage}`, 'red');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      log('🔌 Conexión cerrada', 'blue');
    }
  }
}

// Ejecutar
resetDatabase().catch((error) => {
  log('\n❌ Error fatal:', 'red');
  log(error.message, 'red');
  process.exit(1);
});
