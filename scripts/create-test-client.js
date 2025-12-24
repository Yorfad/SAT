const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Función de encriptación (igual que en el servidor)
const ENC_KEY = process.env.SAT_ENC_KEY || 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
function encrypt(text) {
  const key = Buffer.from(ENC_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

async function createClient() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'mysql',
    user: 'root',
    password: process.env.DB_PASSWORD || 'admin123',
    database: 'sat_acme'
  });

  // Datos del cliente
  const clientData = {
    nit: '1000090655',
    email: 'alexmej267@gmail.com',
    full_name: 'Yair Alexander Morales Mejía',
    birth_date: '2005-05-04', // Asumo 2005, no 2025
    password: 'cliente123', // Password para login en la app
    sat_password: 'YAmorales_04',
    contract_number: '517',
    workspace_id: 2 // PROVIAL
  };

  // Verificar si el cliente ya existe
  const [existing] = await conn.query('SELECT id FROM users WHERE nit = ? OR email = ?', [clientData.nit, clientData.email]);
  if (existing.length > 0) {
    console.log('El cliente ya existe con ID:', existing[0].id);
    await conn.end();
    return;
  }

  // Hash del password
  const passwordHash = await bcrypt.hash(clientData.password, 10);

  // Insertar usuario
  const [userResult] = await conn.query(
    `INSERT INTO users (email, password_hash, full_name, role, nit, birth_date, is_active)
     VALUES (?, ?, ?, 'client', ?, ?, 1)`,
    [clientData.email, passwordHash, clientData.full_name, clientData.nit, clientData.birth_date]
  );

  const userId = userResult.insertId;
  console.log('Usuario creado con ID:', userId);

  // Encriptar password de SAT
  const satPasswordEncrypted = encrypt(clientData.sat_password);

  // Crear perfil de cliente
  await conn.query(
    `INSERT INTO clients_profiles (user_id, workspace_id, contract_number, sat_password_encrypted)
     VALUES (?, ?, ?, ?)`,
    [userId, clientData.workspace_id, clientData.contract_number, satPasswordEncrypted]
  );

  console.log('Perfil de cliente creado');
  console.log('');
  console.log('=== CREDENCIALES PARA LOGIN ===');
  console.log('NIT:', clientData.nit);
  console.log('Password:', clientData.password);
  console.log('================================');

  await conn.end();
}

createClient().catch(console.error);
