const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'mysql',
    user: 'root',
    password: process.env.DB_PASSWORD || 'admin123',
    database: 'sat_acme',
    multipleStatements: true
  });

  console.log('Aplicando migración 019_update_system_pages.sql...\n');

  try {
    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, '..', 'server', 'src', 'migrations', '019_update_system_pages.sql');
    let sql = fs.readFileSync(migrationPath, 'utf8');

    // Remover comentarios de línea y dividir por statements
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
        // Mostrar primeras palabras del statement
        const preview = stmt.substring(0, 60).replace(/\s+/g, ' ');
        console.log(`✓ ${preview}...`);
      } catch (err) {
        // Ignorar errores de "ya existe"
        if (err.code === 'ER_DUP_FIELDNAME' ||
            err.code === 'ER_TABLE_EXISTS_ERROR' ||
            err.code === 'ER_DUP_ENTRY' ||
            err.message.includes('Duplicate column') ||
            err.message.includes('already exists') ||
            err.message.includes('Duplicate entry')) {
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
  console.log('\n¡Migración 019 completada!');
}

applyMigration().catch(console.error);
