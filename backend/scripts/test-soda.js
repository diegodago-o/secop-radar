require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const axios = require('axios');

const BASE = 'https://www.datos.gov.co/resource/p6dx-8zbt.json';
const TOKEN = process.env.SECOP_RADAR_SODA_APP_TOKEN || '';
const headers = TOKEN ? { 'X-App-Token': TOKEN } : {};

async function run() {
  // 1. Fetch sin filtros — ver si el endpoint responde
  console.log('1. Fetch sin filtros (limit 2)...');
  try {
    const r1 = await axios.get(`${BASE}?$limit=2`, { headers, timeout: 15000 });
    console.log('   OK — Campos disponibles:', Object.keys(r1.data[0] || {}).join(', '));
    console.log('   Muestra:', JSON.stringify(r1.data[0], null, 2).slice(0, 600));
  } catch (e) {
    console.error('   ERROR:', e.response?.status, e.response?.data || e.message);
  }

  // 2. Fetch con $where de fecha
  console.log('\n2. Fetch con $where fecha últimos 30 días...');
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString().slice(0, 10);
  const where = `fecha_de_publicacion_del > '${sinceStr}'`;
  const url2 = `${BASE}?$where=${encodeURIComponent(where)}&$limit=2&$order=${encodeURIComponent('fecha_de_publicacion_del DESC')}`;
  console.log('   URL:', url2);
  try {
    const r2 = await axios.get(url2, { headers, timeout: 15000 });
    console.log('   OK — Registros:', r2.data.length);
    if (r2.data[0]) console.log('   Fecha:', r2.data[0].fecha_de_publicacion_del);
  } catch (e) {
    console.error('   ERROR:', e.response?.status, JSON.stringify(e.response?.data));
  }
}

run().catch(console.error);
