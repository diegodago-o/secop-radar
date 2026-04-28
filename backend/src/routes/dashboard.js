const express = require('express');
const { query } = require('../config/database');

const router = express.Router();

// GET /api/dashboard/stats — KPIs generales
router.get('/stats', async (req, res) => {
  try {
    const [counts] = await query(
      `SELECT
        COUNT(*) as total_processes,
        COUNT(pc.id) as classified,
        SUM(pc.relevance_score >= 80) as high_relevance,
        SUM(pc.relevance_score BETWEEN 60 AND 79) as medium_relevance,
        SUM(pc.relevance_score < 60 AND pc.relevance_score >= 40) as low_relevance
       FROM secop_processes sp
       LEFT JOIN process_classifications pc ON pc.process_id = sp.id`,
      []
    );

    const pipelineRows = await query(
      `SELECT stage, COUNT(*) as count FROM process_pipeline GROUP BY stage`,
      []
    );
    const pipeline = Object.fromEntries(pipelineRows.map((r) => [r.stage, r.count]));

    const [lastIngestion] = await query(
      "SELECT config_value FROM system_config WHERE config_key = 'last_ingestion_at'",
      []
    );

    res.json({
      totals: counts,
      pipeline,
      last_ingestion_at: lastIngestion?.config_value || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/top-entities — entidades con más procesos relevantes
router.get('/top-entities', async (req, res) => {
  try {
    const rows = await query(
      `SELECT sp.entity_name, COUNT(*) as count, AVG(pc.relevance_score) as avg_score
       FROM secop_processes sp
       JOIN process_classifications pc ON pc.process_id = sp.id
       WHERE pc.relevance_score >= 60
       GROUP BY sp.entity_name
       ORDER BY count DESC
       LIMIT 15`,
      []
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
