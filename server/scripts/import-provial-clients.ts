
import * as fs from 'fs';
import * as path from 'path';
import * as xlsx from 'xlsx';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

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

// Map Excel header VALUES to DB fields (case-insensitive)
const HEADER_TO_FIELD: Record<string, string> = {
    'nombre': 'full_name',
    'nombre completo': 'full_name',
    'correo': 'email',
    'email': 'email',
    'telefono': 'phone_number',
    'teléfono': 'phone_number',
    'tel.': 'phone_number',
    'tel': 'phone_number',
    'nit': 'nit',
    'dpi': 'nit'
};

// Build column mapping from first data row (which contains header names as values)
function buildColumnMapping(headerRow: any): Record<string, string> {
    const mapping: Record<string, string> = {};
    for (const [excelCol, headerValue] of Object.entries(headerRow)) {
        if (typeof headerValue === 'string') {
            const normalized = headerValue.trim().toLowerCase();
            if (HEADER_TO_FIELD[normalized]) {
                mapping[excelCol] = HEADER_TO_FIELD[normalized];
            }
        }
    }
    return mapping;
}

async function main() {
    console.log('🚀 Starting PROVIAL Client Import...');

    // 1. Connect to Database (using default tenant to find/create PROVIAL)
    // We need to know which DB the 'provial' tenant uses. 
    // For simplicity, we assume we are using the 'sat_acme' DB or whatever is in .env 
    // But wait, the system is multi-tenant. We need to find the correct DB.

    // Let's parse TENANTS from env
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

    // We are looking for a tenant that might host PROVIAL workspace.
    // The user said "in the PROVIAL schema". This usually means a Workspace named PROVIAL.
    // We'll use the first available tenant database for this operation, assuming it's the main one.
    const tenantKey = Object.keys(tenantsConfig)[0];
    const dbName = tenantsConfig[tenantKey].database;

    console.log(`Using database: ${dbName}`);

    const pool = mysql.createPool({
        ...DB_CONFIG,
        database: dbName,
        waitForConnections: true,
        connectionLimit: 10
    });

    try {
        // 2. Get or Create PROVIAL Workspace
        const [dbs] = await pool.query<mysql.RowDataPacket[]>('SELECT id FROM workspaces WHERE slug = "provial"');
        let workspaceId: number;

        if (dbs.length === 0) {
            console.log('Creating PROVIAL workspace...');
            const [res] = await pool.query<mysql.ResultSetHeader>(
                'INSERT INTO workspaces (name, slug, description, is_active) VALUES (?, ?, ?, ?)',
                ['PROVIAL', 'provial', 'Imported from Excel', true]
            );
            workspaceId = res.insertId;
        } else {
            workspaceId = dbs[0].id;
            console.log(`Found PROVIAL workspace ID: ${workspaceId}`);
        }

        // 3. Process each Excel file
        const clientsToImport: Array<{
            full_name: string;
            email: string | null;
            nit: string | null;
            phone_number: string | null;
        }> = [];

        for (const fileName of EXCEL_FILES) {
            const filePath = path.join(__dirname, '../../', fileName);
            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️ File not found: ${filePath}`);
                continue;
            }

            console.log(`Reading ${fileName}...`);
            const workbook = xlsx.readFile(filePath);

            for (const sheetName of workbook.SheetNames) {
                const sheet = workbook.Sheets[sheetName];
                const sheetData = xlsx.utils.sheet_to_json<any>(sheet);

                if (sheetData.length < 2) {
                    console.log(`  -> Sheet "${sheetName}": Skipped (no data)`);
                    continue;
                }

                // First row contains header names as VALUES
                const headerRow = sheetData[0];
                const colMapping = buildColumnMapping(headerRow);

                // Skip sheets with no useful mapping
                if (!Object.values(colMapping).includes('full_name')) {
                    console.log(`  -> Sheet "${sheetName}": Skipped (no NOMBRE column found)`);
                    continue;
                }

                // Process remaining rows (skip header row)
                let sheetClients = 0;
                for (let i = 1; i < sheetData.length; i++) {
                    const row = sheetData[i];

                    // Extract mapped fields
                    let full_name: string | null = null;
                    let email: string | null = null;
                    let nit: string | null = null;
                    let phone_number: string | null = null;

                    for (const [excelCol, dbField] of Object.entries(colMapping)) {
                        const value = row[excelCol];
                        if (value !== undefined && value !== null && value !== '') {
                            const strValue = String(value).trim();
                            if (dbField === 'full_name') full_name = strValue;
                            if (dbField === 'email') email = strValue;
                            if (dbField === 'nit') nit = strValue;
                            if (dbField === 'phone_number') phone_number = strValue;
                        }
                    }

                    // Skip rows without a name
                    if (!full_name || full_name === 'NOMBRE' || full_name.length < 3) continue;

                    clientsToImport.push({ full_name, email, nit, phone_number });
                    sheetClients++;
                }
                console.log(`  -> Sheet "${sheetName}": Found ${sheetClients} clients`);
            }
        }

        // Remove duplicates by NIT (keep first occurrence)
        const seenNits = new Set<string>();
        const uniqueClients = clientsToImport.filter(c => {
            if (!c.nit) return true; // Keep clients without NIT
            if (seenNits.has(c.nit)) return false;
            seenNits.add(c.nit);
            return true;
        });
        console.log(`Total unique clients to import: ${uniqueClients.length} (from ${clientsToImport.length} rows)`);

        // 4. Import Users
        console.log(`Processing ${uniqueClients.length} records...`);
        let processed = 0;
        let created = 0;
        let skipped = 0;

        for (const client of uniqueClients) {
            let { full_name, email, nit, phone_number } = client;

            if (!email) {
                // Generate placeholder email if missing
                const cleanName = full_name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                email = `${cleanName}_${Math.floor(Math.random() * 1000)}@provial.import`;
            }

            if (!nit) {
                // Generate temporary NIT
                nit = `TEMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            }

            // Check if user exists (by NIT or Email)
            const [existingUsers] = await pool.query<mysql.RowDataPacket[]>(
                'SELECT id FROM users WHERE email = ? OR nit = ?',
                [email, nit]
            );

            let userId: number;

            if (existingUsers.length > 0) {
                userId = existingUsers[0].id;
                skipped++;
            } else {
                // Create new user with must_change_password = true
                const passwordHash = await bcrypt.hash('temporal123', 10);
                const [res] = await pool.query<mysql.ResultSetHeader>(
                    'INSERT INTO users (email, password_hash, full_name, role, nit, phone_number, is_active, must_change_password) VALUES (?, ?, ?, ?, ?, ?, 1, 1)',
                    [email, passwordHash, full_name, 'client', nit, phone_number]
                );
                userId = res.insertId;

                // Create profile
                await pool.query(
                    'INSERT INTO clients_profiles (user_id, workspace_id) VALUES (?, ?)',
                    [userId, workspaceId]
                );
                created++;
            }

            // Assign to Workspace if not already
            await pool.query(
                'INSERT IGNORE INTO user_workspaces (user_id, workspace_id, role_in_workspace) VALUES (?, ?, ?)',
                [userId, workspaceId, 'viewer']
            );

            processed++;
            if (processed % 50 === 0) console.log(`  Processed ${processed}/${uniqueClients.length} (${created} created, ${skipped} skipped)...`);
        }

        console.log(`\n✅ Import Completed!`);
        console.log(`   - Total processed: ${processed}`);
        console.log(`   - Created: ${created}`);
        console.log(`   - Skipped (already exist): ${skipped}`);

    } catch (error) {
        console.error('❌ Import Failed:', error);
    } finally {
        await pool.end();
    }
}

main();
