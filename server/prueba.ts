/// <reference types="node" />
// prueba.ts
import axios from "axios";

const API = process.env.API || "http://localhost:4000";
const tenantId = Number(process.env.TENANT_ID || 1);

// Datos de prueba
const admin = {
  email: "admin@acme.com",
  password: "123456",
  full_name: "Admin Acme",
  nit: "9000001"
};

const nuevoCliente = {
  full_name: "Cliente Demo",
  email: "cliente.demo@acme.com",
  nit: "C-001-DEMO",
  phone_number: "555-0100"
};

async function main() {
  try {
    console.log("1) Register (si ya existe, seguirá con login)...");
    try {
      await axios.post(`${API}/api/auth/register`, {
        tenantId,
        email: admin.email,
        password: admin.password,
        full_name: admin.full_name,
        nit: admin.nit
      });
      console.log("   ✔ Admin registrado");
    } catch (e:any) {
      console.log("   (posible ya registrado) ⇒", e.response?.data || e.message);
    }

    console.log("2) Login...");
    const login = await axios.post(`${API}/api/auth/login`, {
      tenantId,
      email: admin.email,
      password: admin.password
    });
    const token = login.data.token as string;
    console.log("   ✔ Token obtenido");

    const auth = { headers: { Authorization: `Bearer ${token}` } };

    console.log("3) Crear cliente...");
    // Requiere el endpoint POST /api/admin/clients (lo dejo más abajo)
    const crear = await axios.post(`${API}/api/admin/clients`, {
      full_name: nuevoCliente.full_name,
      email: nuevoCliente.email,
      nit: nuevoCliente.nit,
      phone_number: nuevoCliente.phone_number
    }, auth);
    const clientId = crear.data.id as number;
    console.log("   ✔ Cliente creado con id:", clientId);

    console.log("4) Crear factura del mes...");
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-12

    const factura = await axios.post(`${API}/api/admin/invoices/${clientId}`, {
      year,
      month,
      monthly_fee: 75,
      extras_fee: 10,
      extras_description: "Trámite RTU"
    }, auth);

    console.log("   ✔ Factura creada:", factura.data);

    console.log("5) Listar clientes (sanity check)...");
    const lista = await axios.get(`${API}/api/admin/clients`, auth);
    console.log("   ✔ Clientes:", lista.data);

    console.log("\nTodo OK ✅");
  } catch (err:any) {
    console.error("Fallo en la prueba:", err.response?.data || err.message);
    process.exit(1);
  }
}

main();
