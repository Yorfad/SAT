/**
 * Script para migrar datos de BD local a BD Docker
 * Uso: npm run db:migrate-to-docker
 *
 * - Exporta datos de tu MySQL local (puerto 3306)
 * - Los importa al MySQL de Docker (puerto 3310)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const TEMP_FILE = path.join(BACKUP_DIR, 'local_to_docker.sql');
const CONTAINER_NAME = 'sat_mysql';

// Configuración de BD local (MariaDB local en puerto 3310)
const LOCAL_HOST = '127.0.0.1';
const LOCAL_PORT = '3310';
const LOCAL_USER = 'root';

// Configuración de BD Docker
const DOCKER_PASSWORD = process.env.DB_ROOT_PASSWORD || 'admin123';

// Bases de datos a migrar
const DATABASES = ['sat_acme'];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function migrate() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  MIGRACIÓN: BD Local → BD Docker');
  console.log('═══════════════════════════════════════════════════\n');

  console.log('Este script:');
  console.log('  1. Exportará datos de tu MySQL local (puerto 3306)');
  console.log('  2. Los importará al MySQL de Docker (puerto 3310)');
  console.log(`  3. Bases de datos: ${DATABASES.join(', ')}\n`);

  // Verificar que el contenedor Docker está corriendo
  try {
    execSync(`docker inspect ${CONTAINER_NAME}`, { stdio: 'ignore' });
    console.log('✅ Contenedor Docker MySQL detectado\n');
  } catch {
    console.error('❌ Error: El contenedor sat_mysql no está corriendo.');
    console.log('   Ejecuta primero: docker-compose up -d\n');
    rl.close();
    process.exit(1);
  }

  // Pedir contraseña de MySQL local
  const localPassword = await question('🔑 Contraseña de MySQL local (root): ');

  // Crear directorio de backups
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  console.log('\n⏳ Paso 1/2: Exportando desde BD local...');

  try {
    const dbList = DATABASES.join(' ');
    const exportCmd = `mysqldump -h ${LOCAL_HOST} -P ${LOCAL_PORT} -u ${LOCAL_USER} -p${localPassword} --databases ${dbList} --single-transaction --routines --triggers 2>nul`;

    const output = execSync(exportCmd, {
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024,
      windowsHide: true
    });

    fs.writeFileSync(TEMP_FILE, output);
    const stats = fs.statSync(TEMP_FILE);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`   ✅ Exportado: ${sizeMB} MB`);
  } catch (error) {
    console.error('\n❌ Error al exportar BD local.');
    console.log('   Verifica que:');
    console.log('   - MySQL local está corriendo');
    console.log('   - La contraseña es correcta');
    console.log('   - Las bases de datos existen\n');
    rl.close();
    process.exit(1);
  }

  console.log('\n⏳ Paso 2/2: Importando a BD Docker...');

  try {
    const importCmd = `docker exec -i ${CONTAINER_NAME} mysql -u root -p${DOCKER_PASSWORD}`;

    execSync(importCmd, {
      input: fs.readFileSync(TEMP_FILE),
      maxBuffer: 50 * 1024 * 1024
    });

    console.log('   ✅ Importado exitosamente');
  } catch (error) {
    console.error('\n❌ Error al importar a Docker:', error.message);
    rl.close();
    process.exit(1);
  }

  // Limpiar archivo temporal
  fs.unlinkSync(TEMP_FILE);

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  ✅ MIGRACIÓN COMPLETADA');
  console.log('═══════════════════════════════════════════════════');
  console.log('\nTus datos locales ahora están en la BD de Docker.');
  console.log('Accede a la app en: http://localhost:8080');
  console.log('API en: http://localhost:3001/api\n');

  rl.close();
}

migrate();
