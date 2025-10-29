import mysql from "mysql2/promise";
import { env } from "./env";


type TenantCfg = { database: string };
const TENANTS: Record<string, TenantCfg> = JSON.parse(env.tenants);


const pools: Record<string, mysql.Pool> = {};


function makePool(database: string) {
return mysql.createPool({
host: env.dbHost,
user: env.dbUser,
password: env.dbPassword,
database,
waitForConnections: true,
connectionLimit: 10,
queueLimit: 0
});
}


export function getPoolForTenantSlug(slug: string) {
const cfg = TENANTS[slug];
if (!cfg) {
const e: any = new Error("Tenant desconocido");
e.statusCode = 404;
throw e;
}
if (!pools[cfg.database]) pools[cfg.database] = makePool(cfg.database);
return pools[cfg.database];
}