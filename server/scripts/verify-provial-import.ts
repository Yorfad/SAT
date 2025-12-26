
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
        const [ws] = await pool.query<mysql.RowDataPacket[]>('SELECT id FROM workspaces WHERE slug = "provial"');
        if (ws.length === 0) return;
        const wsId = ws[0].id;

        const [count] = await pool.query<mysql.RowDataPacket[]>(
            'SELECT count(*) as total FROM user_workspaces WHERE workspace_id = ?',
            [wsId]
        );
        console.log(`FINAL_COUNT:${count[0].total}`);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
main();
