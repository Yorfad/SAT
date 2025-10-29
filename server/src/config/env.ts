import { config } from "dotenv";
config();


export const env = {
    corsOrigin: (process.env.CORS_ORIGIN || "*").split(","),
    dbHost: process.env.DB_HOST!,
    dbUser: process.env.DB_USER!,
    dbPassword: process.env.DB_PASSWORD!,
    tenants: process.env.TENANTS || "{}",
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
    uploadDir: process.env.UPLOAD_DIR || "./uploads",
    satEncKey: process.env.SAT_ENC_KEY || ""
};