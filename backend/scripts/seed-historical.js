require('dotenv').config();
const path = require('path');
const { testConnection, getPool } = require('../src/config/database');
const { importHistorical } = require('../src/services/historical-import');

// El archivo real se llama Procesos.xlsx; también acepta procesos_historicos.xlsx por convención
const DEFAULT_FILE = path.resolve(__dirname, '../../data/Procesos.xlsx');
const filePath = process.argv[2] || DEFAULT_FILE;

async function main() {
  await testConnection();
  console.log(`\nImportando históricos desde: ${filePath}\n`);

  const result = await importHistorical(filePath);

  console.log('\nResumen:');
  console.log(`  Total filas Excel : ${result.total}`);
  console.log(`  Insertados/actuals: ${result.inserted}`);
  console.log(`  Errores           : ${result.errors}`);

  await getPool().end();
}

main().catch((err) => {
  console.error('✗ Error en seed:', err.message);
  process.exit(1);
});
