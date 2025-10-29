import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import { env } from "../config/env";


// Ejecuta: TENANT_DB=SAT_nuevo TENANT_NAME=nuevo npm run create:tenant
const dbName = process.env.TENANT_DB as string;
if (!dbName) throw new Error("TENANT_DB requerido");


(async () => {
const root = await mysql.createConnection({ host: env.dbHost, user: env.dbUser, password: env.dbPassword, multipleStatements: true });
await root.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
await root.end();


const conn = await mysql.createConnection({ host: env.dbHost, user: env.dbUser, password: env.dbPassword, database: dbName, multipleStatements: true });


const migDir = path.resolve(__dirname, "../migrations");
const files = fs.readdirSync(migDir).filter(f => f.endsWith(".sql")).sort();
for (const f of files) {
const sql = fs.readFileSync(path.join(migDir, f), "utf8");
console.log(`[migrate ${dbName}] applying`, f);
await conn.query(sql);
}
await conn.end();
console.log(`[OK] Tenant DB creada y migrada: ${dbName}`);
})();