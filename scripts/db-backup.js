/**
 * Script de backup automático de la base de datos Docker
 * Uso: npm run db:backup
 *
 * - Crea un backup en /backups/sat_backup.sql
 * - Elimina el backup anterior automáticamente
 * - Incluye todas las bases de datos de tenants
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const BACKUP_FILE = path.join(BACKUP_DIR, 'sat_backup.sql');
const CONTAINER_NAME = 'sat_mysql';
const DB_PASSWORD = process.env.DB_ROOT_PASSWORD || 'admin123';

// Bases de datos a respaldar
const DATABASES = ['sat_acme', 'sat_solis'];

async function backup() {
  console.log('🔄 Iniciando backup de base de datos...\n');

  // Verificar que el contenedor está corriendo
  try {
    execSync(`docker inspect ${CONTAINER_NAME}`, { stdio: 'ignore' });
  } catch {
    console.error('❌ Error: El contenedor sat_mysql no está corriendo.');
    console.log('   Ejecuta: docker-compose up -d');
    process.exit(1);
  }

  // Crear directorio de backups si no existe
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log('📁 Directorio de backups creado');
  }

  // Eliminar backup anterior si existe
  if (fs.existsSync(BACKUP_FILE)) {
    fs.unlinkSync(BACKUP_FILE);
    console.log('🗑️  Backup anterior eliminado');
  }

  // Crear nuevo backup
  try {
    const dbList = DATABASES.join(' ');
    const cmd = `docker exec ${CONTAINER_NAME} mysqldump -u root -p${DB_PASSWORD} --databases ${dbList} --single-transaction --routines --triggers`;

    console.log(`📦 Respaldando bases de datos: ${DATABASES.join(', ')}`);

    const output = execSync(cmd, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
    fs.writeFileSync(BACKUP_FILE, output);

    const stats = fs.statSync(BACKUP_FILE);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`\n✅ Backup completado exitosamente!`);
    console.log(`   📄 Archivo: backups/sat_backup.sql`);
    console.log(`   📊 Tamaño: ${sizeMB} MB`);
    console.log(`   🕐 Fecha: ${new Date().toLocaleString()}`);
  } catch (error) {
    console.error('❌ Error al crear backup:', error.message);
    process.exit(1);
  }
}

backup();
