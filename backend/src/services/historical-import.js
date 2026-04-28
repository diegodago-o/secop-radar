const XLSX = require('xlsx');
const path = require('path');
const { query } = require('../config/database');

// Mapeo de columnas del Excel de C&M al schema de historical_processes
const COLUMN_MAP = {
  'Enlace': 'secop_url',
  'Titulo del proceso': 'title',
  'Objeto': 'description',
  'Entidad': 'entity',
  'Valor estimado': 'estimated_value',
  'Tipo moneda': null, // ignorado, todo es COP
  'Presupuesto ofertado': 'offered_budget',
  'Estado inicial del proceso': 'initial_status',
  'Estado Asignación': 'assignment_status',
  'Estado proceso': 'process_status',
  'Razón descarte': 'discard_reason',
  'Origen': 'origin',
  'Fecha registro': 'register_date',
  'Fecha cierre': 'close_date',
  'Tipo plazo ejecución': 'duration_type',
  'Tiempo plazo ejecución': 'duration_time',
  'Sectores': 'sectors',
  'Forma participación': 'participation_form',
  'Integrantes': 'members',
  'Grupo Empresarial': 'business_group',
  'Responsable comercial': 'commercial_responsible',
  'Co-responsable comercial': 'commercial_co_responsible',
  'Responsable técnico': 'technical_responsible',
  'Co-responsable técnico': 'technical_co_responsible',
  'Viabilidad técnica': 'technical_viability',
  'Viabilidad': 'viability',
};

function parseDate(val) {
  if (!val) return null;
  // Excel serial number
  if (typeof val === 'number') {
    const date = XLSX.SSF.parse_date_code(val);
    return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
  }
  // String DD/MM/YYYY or YYYY-MM-DD
  if (typeof val === 'string') {
    const dmY = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dmY) return `${dmY[3]}-${dmY[2].padStart(2, '0')}-${dmY[1].padStart(2, '0')}`;
    const Ymd = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (Ymd) return val.slice(0, 10);
  }
  return null;
}

function parseNumber(val) {
  if (val === null || val === undefined || val === '') return null;
  const n = parseFloat(String(val).replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

function normalizeRow(raw) {
  const row = {};
  for (const [excelCol, dbCol] of Object.entries(COLUMN_MAP)) {
    if (!dbCol) continue;
    const val = raw[excelCol];
    if (dbCol === 'estimated_value' || dbCol === 'offered_budget') {
      row[dbCol] = parseNumber(val);
    } else if (dbCol === 'register_date' || dbCol === 'close_date') {
      row[dbCol] = parseDate(val);
    } else if (dbCol === 'duration_time') {
      row[dbCol] = val ? parseInt(val, 10) || null : null;
    } else {
      row[dbCol] = val !== undefined && val !== null ? String(val).trim() : null;
    }
  }
  return row;
}

async function importHistorical(filePath, { batchSize = 100, onProgress } = {}) {
  const absPath = path.resolve(filePath);
  console.log(`Leyendo archivo: ${absPath}`);

  const workbook = XLSX.readFile(absPath, { cellDates: false, raw: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

  console.log(`Total de filas en Excel: ${rows.length}`);

  const sql = `
    INSERT INTO historical_processes (
      secop_url, title, description, entity, estimated_value, offered_budget,
      initial_status, assignment_status, process_status, discard_reason, origin,
      register_date, close_date, duration_type, duration_time, sectors,
      participation_form, members, business_group,
      commercial_responsible, commercial_co_responsible,
      technical_responsible, technical_co_responsible,
      technical_viability, viability
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE title = VALUES(title)
  `;

  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    for (const raw of batch) {
      try {
        const r = normalizeRow(raw);
        await query(sql, [
          r.secop_url, r.title, r.description, r.entity,
          r.estimated_value, r.offered_budget,
          r.initial_status, r.assignment_status, r.process_status,
          r.discard_reason, r.origin,
          r.register_date, r.close_date,
          r.duration_type, r.duration_time,
          r.sectors, r.participation_form, r.members, r.business_group,
          r.commercial_responsible, r.commercial_co_responsible,
          r.technical_responsible, r.technical_co_responsible,
          r.technical_viability, r.viability,
        ]);
        inserted++;
      } catch (err) {
        errors++;
        if (errors <= 5) console.warn(`  Fila ${i + inserted + errors} error: ${err.message}`);
      }
    }
    if (onProgress) onProgress(Math.min(i + batchSize, rows.length), rows.length);
    else process.stdout.write(`\r  Procesados: ${Math.min(i + batchSize, rows.length)}/${rows.length}`);
  }

  console.log(`\n✓ Importación completa: ${inserted} registros insertados, ${errors} errores`);
  return { inserted, errors, total: rows.length };
}

module.exports = { importHistorical };
