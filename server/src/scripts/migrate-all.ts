import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import { env } from "../config/env";


type TenantCfg = { database: string };
const TENANTS: Record<string, TenantCfg> = JSON.parse(env.tenants);


(async () => {
const migDir = path.resolve(__dirname, "../migrations");
const files = fs.readdirSync(migDir).filter(f => f.endsWith(".sql")).sort();
for (const [slug, cfg] of Object.entries(TENANTS)) {
const conn = await mysql.createConnection({ host: env.dbHost, user: env.dbUser, password: env.dbPassword, database: cfg.database, multipleStatements: true });
for (const f of files) {
const sql = fs.readFileSync(path.join(migDir, f), "utf8");
console.log(`[migrate ${slug}]`, f);
await conn.query(sql);
}
await conn.end();
console.log(`[OK] Migrado: ${slug}`);
}
})();