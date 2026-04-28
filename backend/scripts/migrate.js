require('dotenv').config();
const { getPool, testConnection } = require('../src/config/database');

const schema = `
CREATE TABLE IF NOT EXISTS secop_processes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  secop_id VARCHAR(50) UNIQUE NOT NULL,
  secop_reference VARCHAR(100),
  title VARCHAR(500),
  description TEXT,
  entity_name VARCHAR(300),
  entity_nit VARCHAR(20),
  department VARCHAR(100),
  city VARCHAR(100),
  estimated_value DECIMAL(20,2),
  currency VARCHAR(10) DEFAULT 'COP',
  modality VARCHAR(100),
  phase VARCHAR(100),
  status VARCHAR(100),
  duration INT,
  duration_unit VARCHAR(20),
  publication_date DATETIME,
  last_update_date DATETIME,
  response_deadline DATETIME,
  secop_url VARCHAR(500),
  raw_data JSON,
  ingested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_publication_date (publication_date),
  INDEX idx_status (status),
  INDEX idx_entity (entity_name(100)),
  INDEX idx_modality (modality)
);

CREATE TABLE IF NOT EXISTS process_classifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  process_id INT NOT NULL,
  relevance_score INT DEFAULT 0,
  relevance_justification TEXT,
  sector_match JSON,
  service_type VARCHAR(100),
  viability_score INT DEFAULT 0,
  viability_notes TEXT,
  recommended_participation VARCHAR(50),
  competitive_notes TEXT,
  key_requirements JSON,
  risk_flags JSON,
  classified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  model_version VARCHAR(50),
  FOREIGN KEY (process_id) REFERENCES secop_processes(id),
  INDEX idx_relevance (relevance_score),
  INDEX idx_process (process_id)
);

CREATE TABLE IF NOT EXISTS process_pipeline (
  id INT AUTO_INCREMENT PRIMARY KEY,
  process_id INT NOT NULL UNIQUE,
  stage ENUM('new','evaluating','preparing','submitted','awarded','lost','discarded') DEFAULT 'new',
  assigned_to VARCHAR(200),
  notes TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (process_id) REFERENCES secop_processes(id)
);

CREATE TABLE IF NOT EXISTS historical_processes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  secop_url VARCHAR(500),
  title VARCHAR(500),
  description TEXT,
  entity VARCHAR(300),
  estimated_value DECIMAL(20,2),
  offered_budget DECIMAL(20,2),
  initial_status VARCHAR(100),
  assignment_status VARCHAR(100),
  process_status VARCHAR(100),
  discard_reason VARCHAR(200),
  origin VARCHAR(50),
  register_date DATE,
  close_date DATE,
  duration_type VARCHAR(50),
  duration_time INT,
  sectors VARCHAR(500),
  participation_form VARCHAR(100),
  members TEXT,
  business_group VARCHAR(200),
  commercial_responsible VARCHAR(200),
  commercial_co_responsible VARCHAR(200),
  technical_responsible VARCHAR(200),
  technical_co_responsible VARCHAR(200),
  technical_viability VARCHAR(100),
  viability VARCHAR(100),
  INDEX idx_status (process_status),
  INDEX idx_entity (entity(100)),
  INDEX idx_sectors (sectors(100))
);

CREATE TABLE IF NOT EXISTS alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  process_id INT NOT NULL,
  channel ENUM('email','whatsapp','teams') NOT NULL,
  recipient VARCHAR(200),
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('sent','failed','pending') DEFAULT 'pending',
  error_message TEXT,
  FOREIGN KEY (process_id) REFERENCES secop_processes(id)
);

CREATE TABLE IF NOT EXISTS system_config (
  config_key VARCHAR(100) PRIMARY KEY,
  config_value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO system_config (config_key, config_value) VALUES
  ('last_ingestion_at', NULL),
  ('ingestion_enabled', 'true'),
  ('alert_score_threshold', '80'),
  ('daily_summary_hour', '8'),
  ('alert_recipients_email', ''),
  ('alert_recipients_whatsapp', '');
`;

async function migrate() {
  await testConnection();
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    const statements = schema
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      await conn.query(stmt);
    }
    console.log('✓ Schema de base de datos aplicado correctamente');
  } finally {
    conn.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('✗ Error en migración:', err.message);
  process.exit(1);
});
