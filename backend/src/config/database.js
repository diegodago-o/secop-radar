const mysql = require('mysql2/promise');
const env = require('./environment');

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: env.db.host,
      port: env.db.port,
      database: env.db.name,
      user: env.db.user,
      password: env.db.password,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      timezone: '+00:00',
    });
  }
  return pool;
}

async function query(sql, params) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

async function testConnection() {
  const conn = await getPool().getConnection();
  conn.release();
  console.log('✓ Conexión a MySQL establecida');
}

module.exports = { getPool, query, testConnection };
