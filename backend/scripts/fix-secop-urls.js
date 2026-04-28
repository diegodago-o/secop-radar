require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { query, getPool } = require('../src/config/database');

async function fix() {
  const result = await query(
    `UPDATE secop_processes
     SET secop_url = JSON_UNQUOTE(JSON_EXTRACT(secop_url, '$.url'))
     WHERE secop_url LIKE '{%'`,
    []
  );
  console.log(`✓ URLs corregidas: ${result.affectedRows} registros`);
  await getPool().end();
}

fix().catch((e) => { console.error(e.message); process.exit(1); });
