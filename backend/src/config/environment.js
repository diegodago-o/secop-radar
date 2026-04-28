require('dotenv').config();

const required = [
  'SECOP_RADAR_DB_HOST',
  'SECOP_RADAR_DB_NAME',
  'SECOP_RADAR_DB_USER',
  'SECOP_RADAR_DB_PASSWORD',
];

function validate() {
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Variables de entorno faltantes: ${missing.join(', ')}`);
  }
}

module.exports = {
  validate,
  port: parseInt(process.env.SECOP_RADAR_PORT || '3100', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.SECOP_RADAR_DB_HOST,
    port: parseInt(process.env.SECOP_RADAR_DB_PORT || '3306', 10),
    name: process.env.SECOP_RADAR_DB_NAME,
    user: process.env.SECOP_RADAR_DB_USER,
    password: process.env.SECOP_RADAR_DB_PASSWORD,
  },
  anthropic: {
    apiKey: process.env.SECOP_RADAR_ANTHROPIC_API_KEY,
  },
  soda: {
    appToken: process.env.SECOP_RADAR_SODA_APP_TOKEN || '',
    baseUrl: 'https://www.datos.gov.co/resource',
    datasets: {
      procesosSecop2: 'p6dx-8zbt',
      contratosSecop2: 'jbjy-vk9h',
      secopIntegrado: 'rpmr-utcd',
    },
  },
  notifications: {
    smtp: {
      host: process.env.SECOP_RADAR_SMTP_HOST,
      port: parseInt(process.env.SECOP_RADAR_SMTP_PORT || '587', 10),
      user: process.env.SECOP_RADAR_SMTP_USER,
      pass: process.env.SECOP_RADAR_SMTP_PASS,
    },
    twilio: {
      sid: process.env.SECOP_RADAR_TWILIO_SID,
      token: process.env.SECOP_RADAR_TWILIO_TOKEN,
      whatsapp: process.env.SECOP_RADAR_TWILIO_WHATSAPP,
    },
    teams: {
      webhookUrl: process.env.SECOP_RADAR_TEAMS_WEBHOOK_URL,
    },
  },
};
