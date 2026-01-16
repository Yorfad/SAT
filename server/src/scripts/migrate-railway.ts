import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

// Script simple de migraciones para Railway
(async () => {
    try {
        // Conectar directamente con variables de entorno de Railway
        const conn = await mysql.createConnection({
            host: process.env.MYSQL_HOST || "localhost",
            port: parseInt(process.env.MYSQL_PORT || "3306"),
            user: process.env.MYSQL_USER || "root",
            password: process.env.MYSQL_PASSWORD || "",
            database: process.env.MYSQL_DATABASE || "railway",
            multipleStatements: true
        });

        console.log(`✓ Conectado a MySQL: ${process.env.MYSQL_DATABASE}`);

        // Leer archivos de migración
        const migDir = path.resolve(__dirname, "../migrations");
        const files = fs.readdirSync(migDir)
            .filter(f => f.endsWith(".sql"))
            .sort();

        console.log(`📁 Encontradas ${files.length} migraciones`);

        // Ejecutar cada migración
        for (const f of files) {
            const sql = fs.readFileSync(path.join(migDir, f), "utf8");
            console.log(`⏳ Ejecutando: ${f}`);
            try {
                await conn.query(sql);
                console.log(`  ✓ ${f} completado`);
            } catch (err: any) {
                console.error(`  ✗ Error en ${f}:`, err.message);
                // Continuar con las siguientes migraciones
            }
        }

        await conn.end();
        console.log(`\n✨ Migraciones completadas exitosamente!`);
        process.exit(0);
    } catch (error: any) {
        console.error("❌ Error fatal:", error.message);
        process.exit(1);
    }
})();
