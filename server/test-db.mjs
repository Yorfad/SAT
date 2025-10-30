import mysql from 'mysql2/promise';

const conn = await mysql.createConnection({
  host: '127.0.0.1',
  port: 3310,
  user: 'root',     // o root si lo usas
  password: 'admin123',
  database: 'sat_acme' // BD del tenant
});
const [rows] = await conn.query('SELECT 1 AS ok');
console.log(rows);
await conn.end();
