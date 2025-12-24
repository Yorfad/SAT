import mysql from "mysql2/promise";
import { env } from "./env";

const pools: Record<string, mysql.Pool> = {};

function makePool(database: string) {
  return mysql.createPool({
    host: env.dbHost,
    port: env.dbPort,              // <-- IMPORTANTE
    user: env.dbUser,
    password: env.dbPassword,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

export function getPoolForTenantSlug(slug: string) {
  const cfg = env.tenants[slug];
  if (!cfg) {
    const e: any = new Error(`Tenant desconocido: ${slug}`);
    e.statusCode = 404;
    throw e;
  }
  if (!pools[cfg.database]) {
    console.log(`[DB] creando pool → ${env.dbHost}:${env.dbPort} db=${cfg.database}`);
    pools[cfg.database] = makePool(cfg.database);
  }
  return pools[cfg.database];
}

/**
 * Retorna todos los tenants configurados con sus pools de conexión
 * Usado para búsqueda de clientes en login móvil sin especificar tenant
 */
export function getAllTenantPools(): Array<{ slug: string; pool: mysql.Pool }> {
  return Object.entries(env.tenants).map(([slug, cfg]) => {
    if (!pools[cfg.database]) {
      pools[cfg.database] = makePool(cfg.database);
    }
    return { slug, pool: pools[cfg.database] };
  });
}
