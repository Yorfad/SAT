import * as fs from 'fs';
import * as path from 'path';
import * as xlsx from 'xlsx';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

// ============================================
// CONFIGURACIÓN
// ============================================

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '3306'),
};

const EXCEL_FILES = [
  'Base_general_clientes.xlsx',
  'segunda_base_clientes.xlsx',
  'varios_clientes.xlsx'
];

// ============================================
// TIPOS
// ============================================

interface ClientData {
  nombre: string | null;
  telefono: string | null;
  fecha_nacimiento: string | null;
  correo: string | null;
  nit: string;  // Requerido
  contrasena_sat: string | null;
  firma_electronica: string | null;
  sede: string | null;
  grupo: string | null;
  monto: string | null;
  numero_contrato: string | null;
}

// ============================================
// MAPEO DE HEADERS
// ============================================

// Headers del Excel -> campo interno (case-insensitive, trim)
const HEADER_MAPPING: Record<string, keyof ClientData> = {
  // Nombre
  'nombre': 'nombre',
  'nombre completo': 'nombre',
  'cliente': 'nombre',

  // Teléfono
  'telefono': 'telefono',
  'teléfono': 'telefono',
  'tel': 'telefono',
  'tel.': 'telefono',
  'celular': 'telefono',

  // Fecha nacimiento
  'fecha de nacimiento': 'fecha_nacimiento',
  'fecha nacimiento': 'fecha_nacimiento',
  'nacimiento': 'fecha_nacimiento',
  'f. nacimiento': 'fecha_nacimiento',

  // Correo
  'correo': 'correo',
  'email': 'correo',
  'e-mail': 'correo',
  'correo electronico': 'correo',
  'correo electrónico': 'correo',

  // NIT
  'nit': 'nit',
  'dpi': 'nit',
  'nit/dpi': 'nit',

  // Contraseña SAT
  'contraseña sat': 'contrasena_sat',
  'contrasena sat': 'contrasena_sat',
  'contraseña': 'contrasena_sat',
  'contrasena': 'contrasena_sat',
  'clave sat': 'contrasena_sat',
  'password sat': 'contrasena_sat',
  'pass sat': 'contrasena_sat',

  // Firma electrónica
  'firma electronica': 'firma_electronica',
  'firma electrónica': 'firma_electronica',
  'firma': 'firma_electronica',

  // Sede (vendrá como "CENTRAL #1", etc.)
  'sede': 'sede',
  'sucursal': 'sede',
  'oficina': 'sede',

  // Monto
  'monto': 'monto',
  'cuota': 'monto',
  'mensualidad base': 'monto',

  // Número de contrato
  'numero contrato': 'numero_contrato',
  'número contrato': 'numero_contrato',
  'numero de contrato': 'numero_contrato',
  'número de contrato': 'numero_contrato',
  'no. contrato': 'numero_contrato',
  'no contrato': 'numero_contrato',
  'contrato': 'numero_contrato',
  'num contrato': 'numero_contrato',
};

// Columnas a IGNORAR completamente (servicios, estados, etc.)
const IGNORED_COLUMNS = new Set([
  'libros al dia', 'libros al día', 'libros',
  'declaracion', 'declaración',
  'factura', 'rectificador', 'omisos',
  'observaciones', 'observacion', 'obs',
  'deuda', 'deuda retrasada',
  'mensualidad', 'extras', 'descripcion extra', 'descripción extra',
  'total', 'abono', 'saldo', 'estado',
  'cobro', '2do. cobro', '2do cobro', 'segundo cobro',
  'llamada telefonica', 'llamada telefónica', 'llamada',
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]);

// ============================================
// NORMALIZACIÓN DE SEDES
// ============================================

const SEDE_ALIASES: Record<string, string> = {
  // Central
  'central': 'Central',
  'central 1': 'Central',
  'central 2': 'Central',
  'central por el momento': 'Central',

  // San Cristobal
  'san cris': 'San cristobal',
  'san cris.': 'San cristobal',
  'san cristobal': 'San cristobal',
  'san cristóbal': 'San cristobal',

  // Rio Dulce
  'rio dulce': 'Rio Dulce',
  'río dulce': 'Rio Dulce',
  'rio dulce 1': 'Rio Dulce',
  'rio': 'Rio Dulce',

  // Peten
  'peten': 'Peten/potun',
  'petén': 'Peten/potun',
  'potun': 'Peten/potun',
  'potún': 'Peten/potun',

  // Puerto Barrios / Morales
  'puerto b': 'Morales/Puerto barrios',
  'puerto b.': 'Morales/Puerto barrios',
  'puerto barrios': 'Morales/Puerto barrios',
  'pto barrios': 'Morales/Puerto barrios',
  'pto. barrios': 'Morales/Puerto barrios',
  'pto barrios 1': 'Morales/Puerto barrios',
  'pto barrios 2': 'Morales/Puerto barrios',
  'morales': 'Morales/Puerto barrios',

  // Quetzaltenango
  'quetz': 'Quetzaltenango/salcaja',
  'quetzaltenango': 'Quetzaltenango/salcaja',
  'salcaja': 'Quetzaltenango/salcaja',
  'salcajá': 'Quetzaltenango/salcaja',

  // Mazatenango / Suchitepequez
  'mazate': 'Mazatenango/ san bernandino suchitepequez',
  'mazatenango': 'Mazatenango/ san bernandino suchitepequez',
  'suchi': 'Mazatenango/ san bernandino suchitepequez',
  'suchitepequez': 'Mazatenango/ san bernandino suchitepequez',

  // Coatepeque
  'coatepeque': 'Coatepeque',
  'coate': 'Coatepeque',

  // Norte -> San cristobal (clientes de Norte pertenecen a San Cristobal)
  'norte': 'San cristobal',
  'norte 1': 'San cristobal',
  'norte 2': 'San cristobal',

  // Palin (nueva sede - agregar a VALID_SEDES)
  'palin': 'Palin',
  'palín': 'Palin',

  // Rebajo - mapear a Central (es un estado de pago, no sede real)
  'rebajo': 'Central',
};

// Sedes/valores a IGNORAR (no son sedes reales)
const SEDE_IGNORE = new Set([
  '***',
  'diario',
  '-',
  'n/a',
  'na',
]);

const VALID_SEDES = new Set([
  'Central',
  'San cristobal',
  'Rio Dulce',
  'Peten/potun',
  'Morales/Puerto barrios',
  'Quetzaltenango/salcaja',
  'Mazatenango/ san bernandino suchitepequez',
  'Coatepeque',
  'Palin',
]);

// ============================================
// LOGS
// ============================================

const logs = {
  sedesNoMapeadas: new Map<string, number>(),
  nitsSinValor: 0,
  clientesSinNit: [] as string[],
  merges: 0,
};

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

/**
 * Limpia un string: trim + remover caracteres invisibles (NBSP, etc.)
 */
function cleanString(value: any): string | null {
  if (value === undefined || value === null) return null;
  const str = String(value)
    .replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, ' ') // Caracteres invisibles a espacio
    .trim();
  return str.length > 0 ? str : null;
}

/**
 * Parsea sede + grupo del formato "CENTRAL #1"
 * Retorna { sedeRaw, grupo }
 */
function parseSedeGrupo(value: string | null): { sedeRaw: string | null; grupo: string | null } {
  if (!value) return { sedeRaw: null, grupo: null };

  // Regex: captura texto antes de # y número después
  const match = value.match(/^(.*?)(?:\s*#\s*(\d+))?$/);
  if (!match) return { sedeRaw: value.trim(), grupo: null };

  const sedeRaw = match[1]?.trim() || null;
  const grupo = match[2] || null;

  return { sedeRaw, grupo };
}

/**
 * Normaliza sede_raw a sede válida
 */
function normalizeSede(sedeRaw: string | null): string | null {
  if (!sedeRaw) return null;

  const normalized = sedeRaw.toLowerCase().trim();

  // Primero verificar si es un valor a ignorar
  if (SEDE_IGNORE.has(normalized)) {
    return null;
  }

  // Buscar en aliases
  if (SEDE_ALIASES[normalized]) {
    return SEDE_ALIASES[normalized];
  }

  // Verificar si ya es una sede válida (case-insensitive)
  for (const sede of VALID_SEDES) {
    if (sede.toLowerCase() === normalized) {
      return sede;
    }
  }

  // No mapeada - registrar y retornar null
  logs.sedesNoMapeadas.set(sedeRaw, (logs.sedesNoMapeadas.get(sedeRaw) || 0) + 1);
  return null;
}

/**
 * Valida que un NIT sea válido (mínimo 6 caracteres, sin caracteres especiales raros)
 * Es un type guard: si retorna true, nit es definitivamente string
 */
function isValidNit(nit: string | null): nit is string {
  if (!nit) return false;

  // NITs inválidos conocidos
  const invalidNits = new Set(['factura', '0', 'nit', 'dpi', 'n/a', 'na', '-', '']);
  if (invalidNits.has(nit.toLowerCase())) return false;

  // Debe tener al menos 6 caracteres
  if (nit.length < 6) return false;

  // No debe contener caracteres especiales raros (excepto guiones)
  if (/[%$#@!&*()+=\[\]{}<>?\/\\|`~]/.test(nit)) return false;

  return true;
}

/**
 * Parsea fecha en varios formatos y retorna YYYY-MM-DD o null
 */
function parseDate(value: string | null): string | null {
  if (!value) return null;

  const str = String(value).trim();

  // Si ya está en formato YYYY-MM-DD, validar y retornar
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Formato DD/MM/YYYY o DD-MM-YYYY
  const match = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    return `${year}-${month}-${day}`;
  }

  // Formato MM/DD/YYYY (menos común pero posible)
  // No lo implementamos para evitar ambigüedad - asumimos DD/MM/YYYY

  // Excel date serial (número)
  const serial = parseFloat(str);
  if (!isNaN(serial) && serial > 1 && serial < 100000) {
    // Convertir Excel serial a fecha
    const date = new Date((serial - 25569) * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  return null;
}

/**
 * Construye mapeo de columnas Excel -> campos
 */
function buildColumnMapping(headerRow: any): Map<string, keyof ClientData> {
  const mapping = new Map<string, keyof ClientData>();

  for (const [excelCol, headerValue] of Object.entries(headerRow)) {
    if (typeof headerValue !== 'string') continue;

    const normalized = headerValue.toLowerCase().trim()
      .replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, ' ')
      .replace(/\s+/g, ' ');

    // Verificar si es columna ignorada
    const isIgnored = Array.from(IGNORED_COLUMNS).some(ignored =>
      normalized.includes(ignored) || ignored.includes(normalized)
    );
    if (isIgnored) continue;

    // Buscar mapeo exacto o parcial
    for (const [pattern, field] of Object.entries(HEADER_MAPPING)) {
      if (normalized === pattern || normalized.includes(pattern)) {
        mapping.set(excelCol, field);
        break;
      }
    }
  }

  return mapping;
}

/**
 * Extrae datos de una fila según el mapeo
 */
function extractRowData(row: any, mapping: Map<string, keyof ClientData>): Partial<ClientData> {
  const data: Partial<ClientData> = {};

  for (const [excelCol, field] of mapping) {
    const rawValue = row[excelCol];
    const value = cleanString(rawValue);

    if (value !== null) {
      if (field === 'sede') {
        // Parsear sede + grupo
        const { sedeRaw, grupo } = parseSedeGrupo(value);
        const sedeNormalizada = normalizeSede(sedeRaw);
        if (sedeNormalizada) data.sede = sedeNormalizada;
        if (grupo && !data.grupo) data.grupo = grupo;
      } else {
        (data as any)[field] = value;
      }
    }
  }

  return data;
}

/**
 * Merge: aplica datos nuevos sobre existentes (último no-vacío gana)
 */
function mergeClientData(existing: ClientData, updates: Partial<ClientData>): ClientData {
  const merged = { ...existing };

  for (const [key, value] of Object.entries(updates)) {
    if (value !== null && value !== undefined && value !== '') {
      (merged as any)[key] = value;
    }
  }

  return merged;
}

/**
 * Crea un ClientData vacío
 */
function createEmptyClient(nit: string): ClientData {
  return {
    nombre: null,
    telefono: null,
    fecha_nacimiento: null,
    correo: null,
    nit,
    contrasena_sat: null,
    firma_electronica: null,
    sede: null,
    grupo: null,
    monto: null,
    numero_contrato: null,
  };
}

// ============================================
// PROCESAMIENTO DE EXCEL
// ============================================

function processExcelFile(filePath: string): Map<string, ClientData> {
  const clients = new Map<string, ClientData>();

  console.log(`\n📂 Processing: ${path.basename(filePath)}`);

  const workbook = xlsx.readFile(filePath, {
    raw: true,  // Evitar conversión de tipos (mantener NITs como string)
    cellText: true,
  });

  const sheetNames = workbook.SheetNames;
  console.log(`   Sheets found: ${sheetNames.length}`);

  // Primero encontrar el índice de la primera hoja que tiene columna NIT
  let baseSheetIndex = -1;
  const sheetsData: Array<{ name: string; rows: any[]; mapping: Map<string, keyof ClientData> }> = [];

  for (let i = 0; i < sheetNames.length; i++) {
    const sheetName = sheetNames[i];
    const sheet = workbook.Sheets[sheetName];

    const rows = xlsx.utils.sheet_to_json<any>(sheet, {
      raw: true,
      defval: null,
    });

    if (rows.length < 2) {
      console.log(`   -> Sheet "${sheetName}": Skipped (empty)`);
      continue;
    }

    const headerRow = rows[0];
    const mapping = buildColumnMapping(headerRow);

    const hasNitMapping = Array.from(mapping.values()).includes('nit');
    if (!hasNitMapping) {
      console.log(`   -> Sheet "${sheetName}": Skipped (no NIT column)`);
      continue;
    }

    // Guardar para procesar después
    sheetsData.push({ name: sheetName, rows, mapping });

    // Marcar la primera hoja válida como base
    if (baseSheetIndex === -1) {
      baseSheetIndex = sheetsData.length - 1;
    }
  }

  if (baseSheetIndex === -1) {
    console.log(`   ⚠️ No valid sheets with NIT column found`);
    return clients;
  }

  // Procesar todas las hojas
  for (let i = 0; i < sheetsData.length; i++) {
    const { name: sheetName, rows, mapping } = sheetsData[i];
    const isBaseSheet = i === baseSheetIndex;

    let processed = 0;
    let skippedNoNit = 0;
    let newFromUpdate = 0;

    // Procesar filas de datos (skip header)
    for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      const data = extractRowData(row, mapping);

      // Regla crítica: NIT es obligatorio y válido
      const nit = cleanString(data.nit);
      if (!isValidNit(nit)) {
        skippedNoNit++;
        if (data.nombre) {
          logs.clientesSinNit.push(String(data.nombre));
        }
        continue;
      }

      if (isBaseSheet) {
        // Hoja base: crear nuevo cliente
        const client = createEmptyClient(nit);
        Object.assign(client, data);
        clients.set(nit, client);
      } else {
        // Hoja de actualización
        if (clients.has(nit)) {
          // Merge con existente
          const existing = clients.get(nit)!;
          const merged = mergeClientData(existing, data);
          clients.set(nit, merged);
          logs.merges++;
        } else {
          // Cliente nuevo encontrado en hoja de actualización - crearlo
          const client = createEmptyClient(nit);
          Object.assign(client, data);
          clients.set(nit, client);
          newFromUpdate++;
        }
      }

      processed++;
    }

    const action = isBaseSheet ? 'BASE' : 'UPDATE';
    let logMsg = `   -> Sheet "${sheetName}" [${action}]: ${processed} processed, ${skippedNoNit} skipped (no NIT)`;
    if (newFromUpdate > 0) {
      logMsg += `, ${newFromUpdate} new`;
    }
    console.log(logMsg);
  }

  return clients;
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('🚀 Starting PROVIAL Client Import (v2 - Multi-sheet merge)');
  console.log('=' .repeat(60));

  // 1. Cargar configuración de tenants
  const tenantsEnv = process.env.TENANTS;
  if (!tenantsEnv) {
    console.error('❌ TENANTS env var not found');
    process.exit(1);
  }

  let tenantsConfig;
  try {
    tenantsConfig = JSON.parse(tenantsEnv);
  } catch (e) {
    console.error('❌ Failed to parse TENANTS env var');
    process.exit(1);
  }

  const tenantKey = Object.keys(tenantsConfig)[0];
  const dbName = tenantsConfig[tenantKey].database;
  console.log(`\n📊 Database: ${dbName}`);

  // 2. Procesar todos los archivos Excel
  const allClients = new Map<string, ClientData>();

  for (const fileName of EXCEL_FILES) {
    const filePath = path.join(__dirname, '../../', fileName);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ File not found: ${filePath}`);
      continue;
    }

    const fileClients = processExcelFile(filePath);

    // Merge con clientes globales (archivo posterior actualiza)
    for (const [nit, client] of fileClients) {
      if (allClients.has(nit)) {
        const existing = allClients.get(nit)!;
        allClients.set(nit, mergeClientData(existing, client));
        logs.merges++;
      } else {
        allClients.set(nit, client);
      }
    }
  }

  console.log(`\n📈 Total unique clients (by NIT): ${allClients.size}`);
  console.log(`   Total merges applied: ${logs.merges}`);

  // 3. Mostrar logs de problemas
  if (logs.sedesNoMapeadas.size > 0) {
    console.log(`\n⚠️ Sedes no mapeadas:`);
    for (const [sede, count] of logs.sedesNoMapeadas) {
      console.log(`   - "${sede}": ${count} ocurrencias`);
    }
  }

  if (logs.clientesSinNit.length > 0) {
    console.log(`\n⚠️ Clientes sin NIT (ignorados): ${logs.clientesSinNit.length}`);
    if (logs.clientesSinNit.length <= 10) {
      logs.clientesSinNit.forEach(n => console.log(`   - ${n}`));
    } else {
      logs.clientesSinNit.slice(0, 10).forEach(n => console.log(`   - ${n}`));
      console.log(`   ... y ${logs.clientesSinNit.length - 10} más`);
    }
  }

  // 4. Conectar a BD e importar
  console.log('\n💾 Connecting to database...');

  const pool = mysql.createPool({
    ...DB_CONFIG,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10
  });

  try {
    // Obtener o crear workspace PROVIAL
    const [workspaces] = await pool.query<mysql.RowDataPacket[]>(
      'SELECT id FROM workspaces WHERE slug = "provial"'
    );

    let workspaceId: number;
    if (workspaces.length === 0) {
      console.log('   Creating PROVIAL workspace...');
      const [res] = await pool.query<mysql.ResultSetHeader>(
        'INSERT INTO workspaces (name, slug, description, is_active) VALUES (?, ?, ?, ?)',
        ['PROVIAL', 'provial', 'Imported from Excel', true]
      );
      workspaceId = res.insertId;
    } else {
      workspaceId = workspaces[0].id;
    }
    console.log(`   Workspace ID: ${workspaceId}`);

    // Importar clientes
    console.log('\n📥 Importing clients...');
    let created = 0;
    let updated = 0;
    let errors = 0;
    let processed = 0;

    for (const [nit, client] of allClients) {
      try {
        // Skip si no tiene nombre (para nuevos usuarios)
        if (!client.nombre || client.nombre.trim() === '') {
          console.log(`   Skipping NIT ${nit}: no name`);
          errors++;
          continue;
        }

        // Verificar si usuario existe
        const [existing] = await pool.query<mysql.RowDataPacket[]>(
          'SELECT id FROM users WHERE nit = ?',
          [nit]
        );

        // Generar email placeholder si no tiene
        let email = client.correo;
        if (!email) {
          const cleanName = (client.nombre || 'cliente').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          email = `${cleanName}_${Date.now() % 10000}@provial.import`;
        }

        let userId: number;

        if (existing.length > 0) {
          // Actualizar usuario existente
          userId = existing[0].id;
          await pool.query(
            `UPDATE users SET
              full_name = COALESCE(?, full_name),
              phone_number = COALESCE(?, phone_number),
              email = COALESCE(?, email)
            WHERE id = ?`,
            [client.nombre, client.telefono, client.correo, userId]
          );

          // Actualizar perfil
          await pool.query(
            `UPDATE clients_profiles SET
              sede = COALESCE(?, sede),
              grupo = COALESCE(?, grupo),
              contract_number = COALESCE(?, contract_number),
              sat_password_encrypted = COALESCE(?, sat_password_encrypted)
            WHERE user_id = ?`,
            [client.sede, client.grupo, client.numero_contrato, client.contrasena_sat, userId]
          );

          updated++;
        } else {
          // Crear nuevo usuario
          const passwordHash = await bcrypt.hash('temporal123', 10);

          // Parsear fecha de nacimiento
          const birthDate = parseDate(client.fecha_nacimiento);

          const [userRes] = await pool.query<mysql.ResultSetHeader>(
            `INSERT INTO users (email, password_hash, full_name, role, nit, phone_number, birth_date, is_active, must_change_password)
             VALUES (?, ?, ?, 'client', ?, ?, ?, 1, 1)`,
            [email, passwordHash, client.nombre, nit, client.telefono, birthDate]
          );
          userId = userRes.insertId;

          // Crear perfil con todos los campos
          await pool.query(
            `INSERT INTO clients_profiles (user_id, workspace_id, sede, grupo, contract_number, sat_password_encrypted)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, workspaceId, client.sede, client.grupo, client.numero_contrato, client.contrasena_sat]
          );

          created++;
        }

        // Asignar a workspace
        await pool.query(
          'INSERT IGNORE INTO user_workspaces (user_id, workspace_id, role_in_workspace) VALUES (?, ?, ?)',
          [userId, workspaceId, 'viewer']
        );

        processed++;
        if (processed % 100 === 0) {
          console.log(`   Processed: ${processed}/${allClients.size}`);
        }

      } catch (err: any) {
        errors++;
        console.error(`   Error with NIT ${nit}: ${err.message}`);
      }
    }

    // Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('✅ IMPORT COMPLETED');
    console.log('='.repeat(60));
    console.log(`   Total processed: ${processed}`);
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Errors: ${errors}`);

  } catch (error) {
    console.error('❌ Import Failed:', error);
  } finally {
    await pool.end();
  }
}

main();
