const express = require('express');
const { query } = require('../config/database');

const router = express.Router();

// GET /api/processes — listado con filtros y paginación
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      min_score,
      max_score,
      entity,
      modality,
      department,
      stage,
      since,
      search,
      active_only = 'true',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const params = [];

    // Por defecto ocultar procesos con fecha de cierre vencida
    if (active_only === 'true') {
      conditions.push('(sp.response_deadline IS NULL OR sp.response_deadline >= NOW())');
    }

    if (min_score !== undefined) { conditions.push('pc.relevance_score >= ?'); params.push(parseInt(min_score)); }
    if (max_score !== undefined) { conditions.push('pc.relevance_score <= ?'); params.push(parseInt(max_score)); }
    if (entity) { conditions.push('sp.entity_name LIKE ?'); params.push(`%${entity}%`); }
    if (modality) { conditions.push('sp.modality = ?'); params.push(modality); }
    if (department) { conditions.push('sp.department = ?'); params.push(department); }
    if (stage) { conditions.push('pp.stage = ?'); params.push(stage); }
    if (since) { conditions.push('sp.publication_date >= ?'); params.push(since); }
    if (search) {
      conditions.push('(sp.title LIKE ? OR sp.description LIKE ? OR sp.entity_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total
      FROM secop_processes sp
      LEFT JOIN process_classifications pc ON pc.process_id = sp.id
      LEFT JOIN process_pipeline pp ON pp.process_id = sp.id
      ${where}
    `;
    const [{ total }] = await query(countSql, params);

    const dataSql = `
      SELECT
        sp.id, sp.secop_id, sp.secop_reference, sp.title,
        sp.entity_name, sp.department, sp.city,
        sp.estimated_value, sp.modality, sp.phase, sp.status,
        sp.publication_date, sp.response_deadline, sp.secop_url,
        pc.relevance_score, pc.relevance_justification,
        pc.sector_match, pc.service_type, pc.recommended_participation,
        pc.risk_flags, pc.classified_at,
        pp.stage
      FROM secop_processes sp
      LEFT JOIN process_classifications pc ON pc.process_id = sp.id
      LEFT JOIN process_pipeline pp ON pp.process_id = sp.id
      ${where}
      ORDER BY COALESCE(pc.relevance_score, 0) DESC, sp.publication_date DESC
      LIMIT ${parseInt(limit, 10)} OFFSET ${parseInt(offset, 10)}
    `;
    const rows = await query(dataSql, params);

    res.json({
      data: rows.map((r) => ({
        ...r,
        sector_match: r.sector_match || [],
        risk_flags: r.risk_flags || [],
      })),
      pagination: {
        total: parseInt(total),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/processes/:id — detalle completo
router.get('/:id', async (req, res) => {
  try {
    const rows = await query(
      `SELECT sp.*, pc.relevance_score, pc.relevance_justification,
              pc.sector_match, pc.service_type, pc.viability_score, pc.viability_notes,
              pc.recommended_participation, pc.competitive_notes,
              pc.key_requirements, pc.risk_flags, pc.classified_at, pc.model_version,
              pp.stage, pp.assigned_to, pp.notes as pipeline_notes
       FROM secop_processes sp
       LEFT JOIN process_classifications pc ON pc.process_id = sp.id
       LEFT JOIN process_pipeline pp ON pp.process_id = sp.id
       WHERE sp.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Proceso no encontrado' });

    const r = rows[0];
    res.json({
      ...r,
      raw_data: r.raw_data || null,
      sector_match: r.sector_match || [],
      key_requirements: r.key_requirements || [],
      risk_flags: r.risk_flags || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/processes/:id/pipeline — actualizar etapa
router.patch('/:id/pipeline', async (req, res) => {
  try {
    const { stage, assigned_to, notes } = req.body;
    const validStages = ['new', 'evaluating', 'preparing', 'submitted', 'awarded', 'lost', 'discarded'];
    if (stage && !validStages.includes(stage)) {
      return res.status(400).json({ error: 'Etapa inválida' });
    }
    await query(
      `INSERT INTO process_pipeline (process_id, stage, assigned_to, notes)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         stage = COALESCE(?, stage),
         assigned_to = COALESCE(?, assigned_to),
         notes = COALESCE(?, notes)`,
      [req.params.id, stage || 'new', assigned_to || null, notes || null,
       stage || null, assigned_to || null, notes || null]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
