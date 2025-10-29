## 1) Instalar
npm i


## 2) Configurar `.env`
Copia `.env.sample` → `.env` y ajusta DBs y TENANTS.


## 3) Crear BD por cliente
TENANT_DB=SAT_acme npm run create:tenant
TENANT_DB=SAT_solis npm run create:tenant


## 4) Levantar API
npm run dev


## 5) Probar
# branding (sin token) usando header X-Tenant
curl -s http://localhost:3000/api/public/branding -H "X-Tenant: acme"


# registrar admin
curl -s -X POST http://localhost:3000/api/auth/register -H "X-Tenant: acme" -H "Content-Type: application/json" \
-d '{"email":"admin@acme.com","password":"Secret123","full_name":"Admin Acme","nit":"ACME-001","role":"admin"}'


# login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login -H "X-Tenant: acme" -H "Content-Type: application/json" \
-d '{"email":"admin@acme.com","password":"Secret123"}' | jq -r .token)


# crear servicio
curl -s -X POST http://localhost:3000/api/services -H "X-Tenant: acme" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
-d '{"service_name":"IVA","default_price":500}'