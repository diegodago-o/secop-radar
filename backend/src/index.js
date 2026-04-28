require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');

const env = require('./config/environment');
const { testConnection } = require('./config/database');
const { ingest } = require('./services/secop-ingestion');
const { classifyPending } = require('./services/ai-classifier');

const processesRouter = require('./routes/processes');
const dashboardRouter = require('./routes/dashboard');

env.validate();

const app = express();
app.use(helmet());
app.use(cors());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json());

// Rutas
app.use('/api/processes', processesRouter);
app.use('/api/dashboard', dashboardRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Ingesta cada 30 minutos
cron.schedule('*/30 * * * *', async () => {
  console.log('[cron] Iniciando ingesta programada...');
  try {
    await ingest({ classify: true });
  } catch (err) {
    console.error('[cron] Error en ingesta:', err.message);
  }
});

// Clasificar pendientes diariamente a las 7am (por si hubo errores en ingesta)
cron.schedule('0 7 * * *', async () => {
  console.log('[cron] Clasificando pendientes...');
  try {
    await classifyPending({ limit: 200, verbose: false });
  } catch (err) {
    console.error('[cron] Error en clasificación:', err.message);
  }
});

async function start() {
  await testConnection();
  app.listen(env.port, () => {
    console.log(`✓ SECOP Radar API corriendo en puerto ${env.port} [${env.nodeEnv}]`);
    console.log(`  Ingesta SECOP: cada 30 minutos`);
  });
}

start().catch((err) => {
  console.error('Error al iniciar:', err.message);
  process.exit(1);
});
