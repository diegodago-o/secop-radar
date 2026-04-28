# SECOP Radar — Especificación Técnica Completa

## Resumen ejecutivo

SECOP Radar es un sistema de inteligencia competitiva que monitorea automáticamente el portal de contratación pública de Colombia (SECOP II) para identificar, clasificar y puntuar oportunidades de negocio relevantes para C&M Consultores S.A.S., una firma colombiana de consultoría gerencial con +25 años de experiencia en interventoría, gerencia de proyectos, BIM, asesoría jurídica y estructuración de APP.

El sistema ingesta datos vía la API pública SODA de datos.gov.co, los clasifica con Claude API contra un perfil entrenado con 3,554 procesos históricos de C&M, y entrega alertas multicanal (email, WhatsApp, Teams) más un dashboard web con pipeline visual.

---

## 1. Análisis de datos históricos

### 1.1 Dataset de entrenamiento

Archivo: `data/procesos_historicos.xlsx` — 3,554 registros (agosto 2014 – abril 2026)

**Distribución de estados:**
| Estado | Cantidad | % |
|--------|----------|---|
| Descartado | 977 | 27.5% |
| Sin estado (NaN) | 790 | 22.2% |
| Adjudicado a Otros | 733 | 20.6% |
| Adjudicado a C&M | 395 | 11.1% |
| Abierto | 390 | 11.0% |
| Revocado | 85 | 2.4% |
| Suspendido | 77 | 2.2% |
| Otros (Desierto, Viabilizado, etc.) | 107 | 3.0% |

**Win rate:** 395 / 1,128 procesos decididos = **35.0%**

### 1.2 Perfil de clasificación (qué le interesa a C&M)

#### Sectores con adjudicaciones
| Sector | Adjudicados |
|--------|-------------|
| TIC | 90 |
| Infraestructura (obras y transporte) | 82 |
| Educación | 44 |
| Nutrición o alimentación | 38 |
| Bienestar social + combinaciones | 48 |
| Financiero-fiscal | 10 |
| Servicios públicos | 5 |
| Salud | 5 |
| Hidrocarburos | 3 |
| Minas y energía | 2 |

#### Entidades top (adjudicaciones)
| Entidad | Adjudicados |
|---------|-------------|
| Ministerio de Educación Nacional | 46 |
| ICBF | 42 |
| FONADE / FDN | 24 |
| TransMilenio S.A. | 20 |
| Fondo TIC | 14 |
| Secretaría de Educación Distrital | 13 |
| Secretaría Distrital de Integración Social | 12 |
| Aeronáutica Civil | 10 |
| Fondo de Financiamiento Infraestructura Educativa | 8 |
| Fondo Adaptación | 6 |
| Agencia Nacional de Infraestructura | 6 |
| INVIAS | 5 |

#### Keywords dominantes en objetos adjudicados (frecuencia)
interventoría (272), técnica (190), información (163), realizar (147), administrativa (122), integral (121), servicios (112), financiera (110), sistema (101), desarrollo (94), mantenimiento (72), asistencia (69), jurídica (67), educación (66), diseño (61), programa (60), soporte (55), digitales (52), tecnologías (52), control (51), comunicaciones (51), consultoría (50), concesión (38), gestión (37), infraestructura (40), implementación (39)

#### Tipos de servicio que gana C&M
1. **Interventoría** (técnica, administrativa, financiera, jurídica, integral) — el core
2. **Consultoría/estructuración** (estudios, diseños, factibilidad, APP)
3. **Asistencia técnica en TIC** (soporte, mantenimiento, centros digitales, sistemas)
4. **Gerencia de proyectos** (supervisión, seguimiento, control de calidad)

### 1.3 Razones de descarte (filtro de viabilidad)
| Razón | Cantidad | % de descartados |
|-------|----------|------------------|
| Experiencia de la firma | 386 | 39.5% |
| Sin razón | 188 | 19.2% |
| Otros | 165 | 16.9% |
| Falta de garantías | 156 | 16.0% |
| Indicadores financieros | 32 | 3.3% |
| Perfiles profesionales | 30 | 3.1% |
| Requisitos jurídicos | 19 | 1.9% |

### 1.4 Forma de participación
- Individual: 164 ganados (41.5%) — procesos más pequeños
- Consorcio: 157 ganados (39.7%) — procesos grandes, típicamente infraestructura
- Unión Temporal: 7 ganados

### 1.5 Valor
- Mediana adjudicados C&M: $1,200M COP
- Mediana descartados: $1,552M COP (los más grandes tienden a requerir más experiencia)

---

## 2. Fuentes de datos SECOP

### 2.1 API SODA (Socrata Open Data API)

Base URL: `https://www.datos.gov.co/resource/{dataset_id}.json`

No requiere autenticación para lectura. Se recomienda obtener un App Token en datos.gov.co para evitar throttling.

#### Datasets principales

**SECOP II - Procesos de Contratación (p6dx-8zbt)**
- Es el dataset principal — contiene TODOS los procesos publicados en SECOP II
- URL: `https://www.datos.gov.co/resource/p6dx-8zbt.json`
- Campos relevantes:
  - `entidad` — nombre de la entidad contratante
  - `nit_entidad` — NIT
  - `departamento_entidad` — departamento
  - `ciudad_entidad` — ciudad
  - `id_del_proceso` — ID único del proceso
  - `referencia_del_proceso` — referencia
  - `nombre_del_procedimiento` — título corto
  - `descripcion_del_procedimiento` — objeto del contrato (texto largo, clave para clasificación)
  - `fase` — fase actual
  - `fecha_de_publicacion_del_proceso` — timestamp de publicación
  - `precio_base` — valor estimado
  - `modalidad_de_contratacion` — tipo (licitación, concurso de méritos, contratación directa, etc.)
  - `duracion` + `unidad_de_duracion` — plazo
  - `fecha_de_recepcion_de_respuestas` — deadline
  - `estado_del_proceso` — estado actual
  - `url_proceso` — enlace directo al proceso en SECOP

**SECOP II - Contratos Electrónicos (jbjy-vk9h)**
- Contratos ya formalizados — útil para análisis competitivo
- Contiene: contratista adjudicado, valor del contrato, fechas

**SECOP Integrado (rpmr-utcd)**
- Consolida datos de SECOP I y II

#### Consultas SoQL útiles
```
# Procesos publicados hoy
$where=fecha_de_publicacion_del_proceso > '2026-04-27T00:00:00'
&$limit=500
&$order=fecha_de_publicacion_del_proceso DESC

# Filtrar por modalidad (concurso de méritos = típico para consultoría)
$where=modalidad_de_contratacion='Concurso de méritos'
AND fecha_de_publicacion_del_proceso > '2026-04-20'

# Procesos con valor > 500M COP
$where=precio_base > 500000000
AND fase='Presentación de oferta'
```

---

## 3. Schema de base de datos

### 3.1 Tablas principales

```sql
-- Procesos ingestados del SECOP
CREATE TABLE secop_processes (
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
  INDEX idx_entity (entity_name),
  INDEX idx_modality (modality)
);

-- Clasificación y scoring por IA
CREATE TABLE process_classifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  process_id INT NOT NULL,
  relevance_score INT DEFAULT 0, -- 0-100
  relevance_justification TEXT,
  sector_match JSON, -- ["TIC", "Infraestructura"]
  service_type VARCHAR(100), -- interventoría, consultoría, gerencia, etc.
  viability_score INT DEFAULT 0, -- 0-100
  viability_notes TEXT,
  recommended_participation VARCHAR(50), -- Individual, Consorcio, UT
  competitive_notes TEXT,
  classified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  model_version VARCHAR(50),
  FOREIGN KEY (process_id) REFERENCES secop_processes(id),
  INDEX idx_relevance (relevance_score),
  INDEX idx_process (process_id)
);

-- Pipeline de seguimiento
CREATE TABLE process_pipeline (
  id INT AUTO_INCREMENT PRIMARY KEY,
  process_id INT NOT NULL,
  stage ENUM('new', 'evaluating', 'preparing', 'submitted', 'awarded', 'lost', 'discarded') DEFAULT 'new',
  assigned_to VARCHAR(200),
  notes TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (process_id) REFERENCES secop_processes(id)
);

-- Datos históricos importados del Excel de C&M
CREATE TABLE historical_processes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  secop_url VARCHAR(500),
  title VARCHAR(500),
  description TEXT,
  entity VARCHAR(300),
  estimated_value DECIMAL(20,2),
  offered_budget DECIMAL(20,2),
  initial_status VARCHAR(100),
  assignment_status VARCHAR(100),
  process_status VARCHAR(100), -- 'Adjudicado a C & M', 'Adjudicado a Otros', 'Descartado', etc.
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
  commercial_viability_date DATE,
  technical_responsible VARCHAR(200),
  technical_co_responsible VARCHAR(200),
  technical_viability VARCHAR(100),
  viability VARCHAR(100),
  INDEX idx_status (process_status),
  INDEX idx_entity (entity),
  INDEX idx_sectors (sectors)
);

-- Alertas enviadas
CREATE TABLE alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  process_id INT NOT NULL,
  channel ENUM('email', 'whatsapp', 'teams') NOT NULL,
  recipient VARCHAR(200),
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('sent', 'failed', 'pending') DEFAULT 'pending',
  FOREIGN KEY (process_id) REFERENCES secop_processes(id)
);

-- Configuración del sistema
CREATE TABLE system_config (
  config_key VARCHAR(100) PRIMARY KEY,
  config_value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 4. Clasificador de relevancia (Claude API)

### 4.1 Prompt de clasificación

El clasificador recibe el objeto del contrato y metadata del proceso, y devuelve un JSON estructurado con el score de relevancia y justificación.

```
SYSTEM PROMPT:

Eres un analista experto en contratación pública colombiana especializado en el perfil de C&M Consultores S.A.S.

C&M es una firma de consultoría gerencial que gana principalmente en estos tipos de contratos:
1. INTERVENTORÍA (técnica, administrativa, financiera, jurídica, integral) — su core business
2. CONSULTORÍA Y ESTRUCTURACIÓN (estudios, diseños, factibilidad, APP)
3. ASISTENCIA TÉCNICA EN TIC (soporte, mantenimiento, centros digitales, sistemas de información)
4. GERENCIA DE PROYECTOS (supervisión, seguimiento, control de calidad)

Sectores donde más gana: TIC, Infraestructura/transporte, Educación, Nutrición/alimentación, Bienestar social, Financiero-fiscal.

Entidades donde históricamente ha ganado: MinEducación, ICBF, FONADE/FDN, TransMilenio, Fondo TIC, Aeronáutica Civil, ANI, INVIAS, entre otras.

NO le interesan: contratos de obra civil directa (construcción), suministro de bienes, prestación de servicios personales (CPS individuales), contratos de arrendamiento, compraventa, seguros.

Analiza el siguiente proceso de contratación y clasifícalo.

USER PROMPT:

Proceso SECOP:
- Entidad: {entity}
- Objeto: {description}
- Valor estimado: {value} COP
- Modalidad: {modality}
- Departamento: {department}
- Duración: {duration} {duration_unit}

Responde ÚNICAMENTE con un JSON válido (sin markdown):
{
  "relevance_score": <0-100>,
  "justification": "<1-2 frases explicando por qué es o no relevante>",
  "sectors": ["<sector1>", "<sector2>"],
  "service_type": "<interventoría|consultoría|asistencia_tic|gerencia|estructuración|otro>",
  "recommended_participation": "<individual|consorcio|union_temporal|no_aplica>",
  "key_requirements_detected": ["<req1>", "<req2>"],
  "risk_flags": ["<flag1>"]
}
```

### 4.2 Umbrales de acción
- Score >= 80: Alerta inmediata (email + WhatsApp + Teams)
- Score 60-79: Incluir en resumen diario
- Score 40-59: Registrar pero no alertar
- Score < 40: Descartar automáticamente

---

## 5. Estructura del proyecto

```
secop-radar/
├── CLAUDE.md                    # Contexto para Claude Code
├── README.md
├── package.json
├── .env.example
├── data/
│   └── procesos_historicos.xlsx  # Dataset de entrenamiento
├── backend/
│   ├── package.json
│   ├── src/
│   │   ├── index.js             # Express app entry point
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── environment.js
│   │   ├── services/
│   │   │   ├── secop-ingestion.js    # Polling SODA API
│   │   │   ├── ai-classifier.js      # Claude API classification
│   │   │   ├── alert-service.js      # Email/WhatsApp/Teams
│   │   │   └── historical-import.js  # Excel import
│   │   ├── routes/
│   │   │   ├── processes.js
│   │   │   ├── pipeline.js
│   │   │   ├── alerts.js
│   │   │   └── dashboard.js
│   │   ├── models/
│   │   │   ├── process.js
│   │   │   ├── classification.js
│   │   │   └── pipeline.js
│   │   └── middleware/
│   │       └── auth.js
│   └── scripts/
│       ├── migrate.js
│       ├── seed-historical.js
│       └── test-classifier.js
├── frontend/
│   ├── package.json
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ProcessDetail.jsx
│   │   │   └── Settings.jsx
│   │   ├── components/
│   │   │   ├── Pipeline.jsx
│   │   │   ├── ProcessCard.jsx
│   │   │   ├── Filters.jsx
│   │   │   ├── ScoreIndicator.jsx
│   │   │   └── AlertBadge.jsx
│   │   └── services/
│   │       └── api.js
│   └── public/
└── n8n/
    └── workflows/
        └── secop-ingestion.json  # Workflow exportado de n8n
```

---

## 6. Despliegue

### Infraestructura recomendada
- Azure VM Ubuntu 24.04 (misma infra de Tecnofactory)
- Nginx como reverse proxy
- PM2 para gestión de procesos Node.js
- Let's Encrypt SSL
- UFW firewall
- MySQL 8 (puede reutilizar instancia existente con nueva BD)

### Flujo de deploy
Claude Code → GitHub push → SSH a VM → git pull → pm2 restart

### Variables de entorno (.env)
```
SECOP_RADAR_DB_HOST=localhost
SECOP_RADAR_DB_PORT=3306
SECOP_RADAR_DB_NAME=secop_radar
SECOP_RADAR_DB_USER=
SECOP_RADAR_DB_PASSWORD=
SECOP_RADAR_PORT=3100
SECOP_RADAR_ANTHROPIC_API_KEY=
SECOP_RADAR_SODA_APP_TOKEN=
SECOP_RADAR_SMTP_HOST=
SECOP_RADAR_SMTP_PORT=
SECOP_RADAR_SMTP_USER=
SECOP_RADAR_SMTP_PASS=
SECOP_RADAR_TWILIO_SID=
SECOP_RADAR_TWILIO_TOKEN=
SECOP_RADAR_TWILIO_WHATSAPP=
SECOP_RADAR_TEAMS_WEBHOOK_URL=
```
