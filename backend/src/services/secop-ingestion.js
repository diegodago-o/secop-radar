const axios = require('axios');
const { query } = require('../config/database');
const env = require('../config/environment');
const { classifyProcess } = require('./ai-classifier');

const SODA_BASE = env.soda.baseUrl;
const DATASET_ID = env.soda.datasets.procesosSecop2;
const PAGE_SIZE = 500;

function buildHeaders() {
  const headers = { Accept: 'application/json' };
  if (env.soda.appToken) headers['X-App-Token'] = env.soda.appToken;
  return headers;
}

function normalizeProcess(raw) {
  return {
    secop_id: raw.id_del_proceso || raw.referencia_del_proceso,
    secop_reference: raw.referencia_del_proceso || null,
    title: raw.nombre_del_procedimiento || null,
    description: raw.descripcion_del_procedimiento || null,
    entity_name: raw.entidad || null,
    entity_nit: raw.nit_entidad || null,
    department: raw.departamento_entidad || null,
    city: raw.ciudad_entidad || raw.ciudad_de_la_unidad_de_contratacion || null,
    estimated_value: raw.precio_base ? parseFloat(raw.precio_base) : null,
    currency: 'COP',
    modality: raw.modalidad_de_contratacion || null,
    phase: raw.fase || null,
    status: raw.estado_del_proceso || null,
    duration: raw.duracion ? parseInt(raw.duracion, 10) : null,
    duration_unit: raw.unidad_de_duracion || null,
    publication_date: raw.fecha_de_publicacion_del_proceso || null,
    last_update_date: raw.fecha_de_ultima_publicacion || null,
    response_deadline: raw.fecha_de_recepcion_de_respuestas || null,
    secop_url: raw.url_proceso || null,
    raw_data: JSON.stringify(raw),
  };
}

async function upsertProcess(proc) {
  const sql = `
    INSERT INTO secop_processes (
      secop_id, secop_reference, title, description,
      entity_name, entity_nit, department, city,
      estimated_value, currency, modality, phase, status,
      duration, duration_unit,
      publication_date, last_update_date, response_deadline,
      secop_url, raw_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      phase = VALUES(phase),
      status = VALUES(status),
      last_update_date = VALUES(last_update_date),
      response_deadline = VALUES(response_deadline),
      raw_data = VALUES(raw_data)
  `;
  const [result] = await query(sql, [
    proc.secop_id, proc.secop_reference, proc.title, proc.description,
    proc.entity_name, proc.entity_nit, proc.department, proc.city,
    proc.estimated_value, proc.currency, proc.modality, proc.phase, proc.status,
    proc.duration, proc.duration_unit,
    proc.publication_date, proc.last_update_date, proc.response_deadline,
    proc.secop_url, proc.raw_data,
  ]);
  // insertId > 0 = nuevo registro; affectedRows = 2 = actualizado
  return { id: result.insertId || null, isNew: result.insertId > 0 };
}

async function fetchPage(sinceDate, offset) {
  const whereClause = sinceDate
    ? `fecha_de_publicacion_del_proceso > '${sinceDate}'`
    : `fecha_de_publicacion_del_proceso IS NOT NULL`;

  const url = `${SODA_BASE}/${DATASET_ID}.json`;
  const params = {
    $where: whereClause,
    $order: 'fecha_de_publicacion_del_proceso DESC',
    $limit: PAGE_SIZE,
    $offset: offset,
  };

  const resp = await axios.get(url, { headers: buildHeaders(), params, timeout: 30000 });
  return resp.data;
}

async function getLastIngestionDate() {
  const rows = await query(
    "SELECT config_value FROM system_config WHERE config_key = 'last_ingestion_at'",
    []
  );
  return rows[0]?.config_value || null;
}

async function setLastIngestionDate(date) {
  await query(
    "UPDATE system_config SET config_value = ? WHERE config_key = 'last_ingestion_at'",
    [date]
  );
}

async function ingest({ classify = true, verbose = false } = {}) {
  const startedAt = new Date();
  const sinceDate = await getLastIngestionDate();

  console.log(`[ingesta] Iniciando — desde: ${sinceDate || 'inicio'}`);

  let offset = 0;
  let totalFetched = 0;
  let totalNew = 0;
  let totalClassified = 0;

  while (true) {
    let page;
    try {
      page = await fetchPage(sinceDate, offset);
    } catch (err) {
      console.error(`[ingesta] Error al consultar SODA (offset ${offset}): ${err.message}`);
      break;
    }

    if (!page || page.length === 0) break;

    for (const raw of page) {
      const proc = normalizeProcess(raw);
      if (!proc.secop_id) continue;

      const { id, isNew } = await upsertProcess(proc);
      if (isNew && id) {
        totalNew++;
        if (classify) {
          try {
            await classifyProcess(id, proc);
            totalClassified++;
            if (verbose) console.log(`  [IA] Clasificado proceso ${proc.secop_id}`);
          } catch (err) {
            console.warn(`  [IA] Error clasificando ${proc.secop_id}: ${err.message}`);
          }
        }
      }
    }

    totalFetched += page.length;
    if (verbose) console.log(`[ingesta] Página offset=${offset}: ${page.length} procesos`);

    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  await setLastIngestionDate(startedAt.toISOString().slice(0, 19));

  console.log(
    `[ingesta] Completo — fetched: ${totalFetched}, nuevos: ${totalNew}, clasificados: ${totalClassified}`
  );
  return { totalFetched, totalNew, totalClassified };
}

module.exports = { ingest };
