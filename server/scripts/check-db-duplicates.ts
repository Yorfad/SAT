
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
        console.log('--- DUPLICATE CHECK ---');

        // Check by Name
        const [byName] = await pool.query<mysql.RowDataPacket[]>(`
            SELECT full_name, COUNT(*) as c 
            FROM users 
            GROUP BY full_name 
            HAVING c > 1
            ORDER BY c DESC 
            LIMIT 10
        `);
        console.log(`Duplicates by Name: ${byName.length} found`);
        if (byName.length > 0) console.table(byName);

        // Check by NIT (excluding generated temps)
        const [byNit] = await pool.query<mysql.RowDataPacket[]>(`
            SELECT nit, COUNT(*) as c 
            FROM users 
            WHERE nit NOT LIKE 'TEMP-%' 
            GROUP BY nit 
            HAVING c > 1
            ORDER BY c DESC 
            LIMIT 10
        `);
        console.log(`Duplicates by NIT: ${byNit.length} found`);
        if (byNit.length > 0) console.table(byNit);

        // Check by sanitized email (excluding placeholders)
        const [byEmail] = await pool.query<mysql.RowDataPacket[]>(`
            SELECT email, COUNT(*) as c 
            FROM users 
            WHERE email NOT LIKE '%@provial.import'
            GROUP BY email 
            HAVING c > 1
            ORDER BY c DESC 
            LIMIT 10
        `);
        console.log(`Duplicates by Email: ${byEmail.length} found`);
        if (byEmail.length > 0) console.table(byEmail);

    } catch (e) { console.error(e); }
    finally { await pool.end(); }
}
main();
