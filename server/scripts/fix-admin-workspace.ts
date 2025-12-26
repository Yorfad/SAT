
import * as path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT || '3306'),
};

async function main() {
    const tenantsEnv = process.env.TENANTS;
    if (!tenantsEnv) process.exit(1);
    const tenantsConfig = JSON.parse(tenantsEnv);
    const tenantKey = Object.keys(tenantsConfig)[0];
    const dbName = tenantsConfig[tenantKey].database;

    const pool = mysql.createPool({ ...DB_CONFIG, database: dbName });

    try {
        // 1. Get PROVIAL Workspace ID
        const [ws] = await pool.query<mysql.RowDataPacket[]>('SELECT id FROM workspaces WHERE slug = "provial"');
        if (ws.length === 0) { console.error('Workspace PROVIAL not found'); return; }
        const wsId = ws[0].id;

        // 2. Get Admin User
        // Assuming email 'admin@sat.com' or role 'admin'
        const [admins] = await pool.query<mysql.RowDataPacket[]>('SELECT id, email FROM users WHERE role = "admin"');

        for (const admin of admins) {
            console.log(`Checking admin: ${admin.email}...`);

            // Check assignment
            const [assignment] = await pool.query<mysql.RowDataPacket[]>(
                'SELECT * FROM user_workspaces WHERE user_id = ? AND workspace_id = ?',
                [admin.id, wsId]
            );

            if (assignment.length === 0) {
                console.log(`  -> Not assigned. Assigning now...`);
                await pool.query(
                    'INSERT INTO user_workspaces (user_id, workspace_id, role_in_workspace) VALUES (?, ?, ?)',
                    [admin.id, wsId, 'owner']
                );
                console.log('  -> Assigned as owner.');
            } else {
                console.log('  -> Already assigned.');
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
