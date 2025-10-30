import { config } from "dotenv";
config();

// Parseo seguro de TENANTS una sola vez
function parseTenants(str?: string) {
  try {
    return (str ? JSON.parse(str) : {}) as Record<string, { database: string }>;
  } catch (e) {
    throw new Error(`TENANTS inválido en .env: ${(e as Error).message}`);
  }
}

export const env = {
  corsOrigin: (process.env.CORS_ORIGIN ?? "http://localhost:5173").split(","),
  dbHost: process.env.DB_HOST ?? "127.0.0.1",       // evita 'localhost'
  dbPort: Number(process.env.DB_PORT ?? "3310"),   // <-- PUERTO DE MARIADB
  dbUser: process.env.DB_USER ?? "root",
  dbPassword: process.env.DB_PASSWORD ?? "",
  tenants: parseTenants(process.env.TENANTS),       // objeto ya parseado
  jwtSecret: process.env.JWT_SECRET ?? "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  uploadDir: process.env.UPLOAD_DIR ?? "./uploads",
  satEncKey: process.env.SAT_ENC_KEY ?? "",
};

// Log de arranque útil
console.log(`[ENV] DB ${env.dbHost}:${env.dbPort} user=${env.dbUser} tenants=${Object.keys(env.tenants).join(",")}`);
