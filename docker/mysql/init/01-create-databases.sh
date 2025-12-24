#!/bin/bash
# ============================================
# Script de inicialización de bases de datos
# Se ejecuta solo la primera vez que inicia MySQL
# ============================================

set -e

echo "==========================================="
echo "Creando bases de datos para multi-tenant..."
echo "==========================================="

# Crear base de datos adicional para tenant solis (acme se crea automáticamente)
mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<-EOSQL
    -- Crear base de datos para tenant solis
    CREATE DATABASE IF NOT EXISTS sat_solis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

    -- Dar permisos al usuario en ambas bases de datos
    GRANT ALL PRIVILEGES ON sat_acme.* TO '$MYSQL_USER'@'%';
    GRANT ALL PRIVILEGES ON sat_solis.* TO '$MYSQL_USER'@'%';
    FLUSH PRIVILEGES;

    SELECT 'Bases de datos creadas exitosamente' AS status;
EOSQL

echo "Bases de datos listas!"
