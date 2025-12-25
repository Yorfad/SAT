const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: 'root',
    password: process.env.DB_PASSWORD || 'admin123',
    database: 'sat_acme',
    multipleStatements: true
  });

  console.log('Aplicando migración 020_password_reset_system.sql...\n');

  try {
    const migrationPath = path.join(__dirname, '..', 'server', 'src', 'migrations', '020_password_reset_system.sql');
    let sql = fs.readFileSync(migrationPath, 'utf8');

    // Dividir por statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let success = 0;
    let skipped = 0;
    let errors = 0;

    for (const stmt of statements) {
      if (!stmt || stmt.startsWith('--')) continue;

      try {
        await conn.query(stmt);
        success++;
        const preview = stmt.substring(0, 60).replace(/\s+/g, ' ');
        console.log(`✓ ${preview}...`);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME' ||
            err.code === 'ER_TABLE_EXISTS_ERROR' ||
            err.code === 'ER_DUP_ENTRY' ||
            err.code === 'ER_DUP_KEYNAME' ||
            err.message.includes('Duplicate column') ||
            err.message.includes('already exists') ||
            err.message.includes('Duplicate entry') ||
            err.message.includes('Duplicate key name')) {
          skipped++;
          console.log(`- Saltado (ya existe): ${stmt.substring(0, 40)}...`);
        } else {
          errors++;
          console.error(`✗ Error: ${err.message.substring(0, 80)}`);
          console.error(`  Statement: ${stmt.substring(0, 100)}...`);
        }
      }
    }

    console.log(`\n=== RESULTADO ===`);
    console.log(`Exitosos: ${success}`);
    console.log(`Saltados: ${skipped}`);
    console.log(`Errores: ${errors}`);

  } catch (error) {
    console.error('Error general:', error.message);
  }

  await conn.end();
  console.log('\n¡Migración 020 completada!');
}

applyMigration().catch(console.error);
