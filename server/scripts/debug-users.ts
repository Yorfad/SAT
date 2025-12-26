
import * as path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv'; // server/node_modules/dotenv

dotenv.config({ path: path.join(__dirname, '../.env') });

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT || '3306'),
};

async function main() {
    const tenantsEnv = process.env.TENANTS;
    if (!tenantsEnv) return;
    const tenantsConfig = JSON.parse(tenantsEnv);
    const tenantKey = Object.keys(tenantsConfig)[0];
    const dbName = tenantsConfig[tenantKey].database;

    const pool = mysql.createPool({ ...DB_CONFIG, database: dbName });

    try {
        console.log('--- ADMIN USERS ---');
        const [admins] = await pool.query<mysql.RowDataPacket[]>('SELECT id, email, role, full_name FROM users WHERE role="admin"');
        console.table(admins);

        const [ws] = await pool.query<mysql.RowDataPacket[]>('SELECT id, name FROM workspaces WHERE slug="provial"');
        if (ws.length === 0) { console.log('No provial workspace'); return; }
        const wsId = ws[0].id;
        console.log(`PROVIAL WS ID: ${wsId}`);

        console.log('--- ASSIGNMENTS IN PROVIAL ---');
        const [assigns] = await pool.query<mysql.RowDataPacket[]>('SELECT * FROM user_workspaces WHERE workspace_id = ?', [wsId]);
        console.table(assigns);

        // FORCE ASSIGN ADMIN IF EMPTY
        if (admins.length > 0) {
            const adminId = admins[0].id;
            console.log(`Forcing assignment for admin ${adminId}...`);
            await pool.query('INSERT IGNORE INTO user_workspaces (user_id, workspace_id, role_in_workspace, is_primary) VALUES (?, ?, ?, ?)', [adminId, wsId, 'owner', 0]);
            console.log('Done.');
        }

    } catch (e) { console.error(e); }
    finally { await pool.end(); }
}
main();
