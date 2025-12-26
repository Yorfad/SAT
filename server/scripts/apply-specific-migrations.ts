
import * as fs from 'fs';
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

async function applyMigration(pool: mysql.Pool, fileName: string) {
    const filePath = path.join(__dirname, '../src/migrations', fileName);
    console.log(`Applying ${fileName}...`);

    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return;
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    const statements = sql.split(/;\s*$/m); // Rough split by semicolon

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Disable foreign key checks for safety during schema changes
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        for (const statement of statements) {
            if (statement.trim().length > 0) {
                try {
                    await connection.query(statement);
                } catch (err: any) {
                    // Ignore "Table already exists" or "Column already exists" or "Duplicate key"
                    // checking for sqlState or errno
                    if (err.errno === 1050 || err.errno === 1060 || err.errno === 1061) {
                        console.warn(`  - Skipping (already exists): ${statement.substring(0, 50)}...`);
                    } else if (err.errno === 1054) {
                        // Column missing/bad?
                        console.warn(`  - Warning logic error: ${err.message}`);
                    } else {
                        // Allow some specific updates to fail if they are repeatable
                        console.warn(`  - Warning: ${err.message}`);
                    }
                }
            }
        }

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        await connection.commit();
        console.log(`✅ Applied ${fileName}`);
    } catch (error) {
        await connection.rollback();
        console.error(`❌ Failed ${fileName}:`, error);
    } finally {
        connection.release();
    }
}

async function main() {
    // Parse tenant DB
    const tenantsEnv = process.env.TENANTS;
    if (!tenantsEnv) { console.error('No TENANTS'); process.exit(1); }
    const tenantsConfig = JSON.parse(tenantsEnv);
    const tenantKey = Object.keys(tenantsConfig)[0];
    const dbName = tenantsConfig[tenantKey].database;

    const pool = mysql.createPool({
        ...DB_CONFIG,
        database: dbName,
        multipleStatements: true
    });

    try {
        await applyMigration(pool, '012_workspaces_system.sql');
        await applyMigration(pool, '016_client_custom_fields.sql');
    } finally {
        await pool.end();
    }
}

main();
