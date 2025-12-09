const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3310,
    user: 'root',
    password: '123456',
    database: 'sat_acme',
    multipleStatements: true
  });

  const migrationPath = path.join(__dirname, '../src/migrations/010_service_bundles.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  try {
    await conn.query(migrationSQL);
    console.log('✅ Migración de bundles aplicada exitosamente');
  } catch (error) {
    if (error.message.includes('Duplicate column name')) {
      console.log('ℹ️  Las tablas ya existen, migración omitida');
    } else {
      throw error;
    }
  } finally {
    await conn.end();
  }
}

applyMigration().catch(console.error);
