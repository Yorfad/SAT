/**
 * Script de restauración de base de datos Docker
 * Uso: npm run db:restore
 *
 * - Restaura desde /backups/sat_backup.sql
 * - Sobrescribe los datos actuales en Docker
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const BACKUP_FILE = path.join(BACKUP_DIR, 'sat_backup.sql');
const CONTAINER_NAME = 'sat_mysql';
const DB_PASSWORD = process.env.DB_ROOT_PASSWORD || 'admin123';

async function restore() {
  console.log('🔄 Iniciando restauración de base de datos...\n');

  // Verificar que existe el archivo de backup
  if (!fs.existsSync(BACKUP_FILE)) {
    console.error('❌ Error: No se encontró archivo de backup.');
    console.log('   Archivo esperado: backups/sat_backup.sql');
    console.log('   Ejecuta primero: npm run db:backup');
    process.exit(1);
  }

  // Verificar que el contenedor está corriendo
  try {
    execSync(`docker inspect ${CONTAINER_NAME}`, { stdio: 'ignore' });
  } catch {
    console.error('❌ Error: El contenedor sat_mysql no está corriendo.');
    console.log('   Ejecuta: docker-compose up -d');
    process.exit(1);
  }

  // Mostrar info del backup
  const stats = fs.statSync(BACKUP_FILE);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`📄 Archivo de backup: backups/sat_backup.sql`);
  console.log(`📊 Tamaño: ${sizeMB} MB`);
  console.log(`🕐 Modificado: ${stats.mtime.toLocaleString()}\n`);

  // Restaurar backup
  try {
    console.log('⏳ Restaurando datos (esto puede tardar)...');

    // Usar cat para pasar el archivo al contenedor en Windows
    const cmd = `docker exec -i ${CONTAINER_NAME} mysql -u root -p${DB_PASSWORD}`;

    execSync(cmd, {
      input: fs.readFileSync(BACKUP_FILE),
      maxBuffer: 50 * 1024 * 1024
    });

    console.log(`\n✅ Restauración completada exitosamente!`);
    console.log(`   Los datos han sido importados a la BD de Docker.`);
  } catch (error) {
    console.error('❌ Error al restaurar:', error.message);
    process.exit(1);
  }
}

restore();
