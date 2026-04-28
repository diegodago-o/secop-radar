const Anthropic = require('@anthropic-ai/sdk');
const { query } = require('../config/database');
const env = require('../config/environment');
const { callMock } = require('./mock-classifier');

const MODEL = 'claude-sonnet-4-5';
const MODEL_VERSION = 'claude-sonnet-4-5@2025-05-14';

// Prompt del sistema basado en el perfil histórico de C&M Consultores (3,554 procesos)
const SYSTEM_PROMPT = `Eres un analista experto en contratación pública colombiana especializado en el perfil de C&M Consultores S.A.S.

C&M es una firma de consultoría gerencial que gana principalmente en estos tipos de contratos:
1. INTERVENTORÍA (técnica, administrativa, financiera, jurídica, integral) — su core business (272 adjudicados)
2. CONSULTORÍA Y ESTRUCTURACIÓN (estudios, diseños, factibilidad, APP)
3. ASISTENCIA TÉCNICA EN TIC (soporte, mantenimiento, centros digitales, sistemas de información)
4. GERENCIA DE PROYECTOS (supervisión, seguimiento, control de calidad)

Sectores donde más gana (por volumen): TIC (90), Infraestructura/transporte (82), Educación (44), Nutrición/alimentación (38), Bienestar social (27), Financiero-fiscal (10).

Entidades donde históricamente ha ganado: MinEducación (46), ICBF (42), FONADE/FDN (24), TransMilenio (20), Fondo TIC (14), Sec. Educación Distrital (13), Sec. Integración Social (12), Aeronáutica Civil (10), ANI (6), INVIAS (5).

Modalidades típicas: Concurso de méritos (consultoría/interventoría), Licitación pública (proyectos grandes), Selección abreviada, Contratación directa (para montos menores).

Razones principales por las que C&M NO participa: falta de experiencia específica de la firma (40%), garantías insuficientes (16%), indicadores financieros (3%).

NO le interesan: contratos de obra civil directa (construcción), suministro de bienes físicos, prestación de servicios personales individuales (CPS), arrendamientos, compraventas, seguros, concesiones de infraestructura (solo si C&M iría como estructurador, no concesionario).

Responde ÚNICAMENTE con JSON válido, sin markdown, sin texto adicional.`;

function buildUserPrompt(proc) {
  const value = proc.estimated_value
    ? new Intl.NumberFormat('es-CO').format(proc.estimated_value) + ' COP'
    : 'No especificado';
  const deadline = proc.response_deadline
    ? new Date(proc.response_deadline).toLocaleDateString('es-CO')
    : 'No especificado';

  return `Proceso SECOP:
- Entidad: ${proc.entity_name || 'No especificada'}
- Objeto: ${proc.description || proc.title || 'Sin descripción'}
- Valor estimado: ${value}
- Modalidad: ${proc.modality || 'No especificada'}
- Departamento: ${proc.department || 'No especificado'}
- Duración: ${proc.duration ? `${proc.duration} ${proc.duration_unit || ''}` : 'No especificada'}
- Fecha límite: ${deadline}

Responde con este JSON:
{
  "relevance_score": <entero 0-100>,
  "justification": "<1-2 frases explicando relevancia>",
  "sectors": ["<sector1>"],
  "service_type": "<interventoría|consultoría|asistencia_tic|gerencia|estructuración|otro>",
  "recommended_participation": "<individual|consorcio|union_temporal|no_aplica>",
  "key_requirements_detected": ["<req1>"],
  "risk_flags": ["<flag1>"]
}`;
}

let client;
function getClient() {
  if (!client) {
    if (!env.anthropic.apiKey) throw new Error('SECOP_RADAR_ANTHROPIC_API_KEY no configurado');
    client = new Anthropic({ apiKey: env.anthropic.apiKey });
  }
  return client;
}

async function callClaude(proc) {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserPrompt(proc) }],
  });

  const text = response.content[0].text.trim();
  // Extraer JSON aunque venga con backticks
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Respuesta IA inválida: ${text.slice(0, 200)}`);
  return JSON.parse(jsonMatch[0]);
}

async function saveClassification(processId, result) {
  const sql = `
    INSERT INTO process_classifications (
      process_id, relevance_score, relevance_justification,
      sector_match, service_type,
      recommended_participation, key_requirements, risk_flags,
      model_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      relevance_score = VALUES(relevance_score),
      relevance_justification = VALUES(relevance_justification),
      sector_match = VALUES(sector_match),
      service_type = VALUES(service_type),
      recommended_participation = VALUES(recommended_participation),
      key_requirements = VALUES(key_requirements),
      risk_flags = VALUES(risk_flags),
      model_version = VALUES(model_version),
      classified_at = CURRENT_TIMESTAMP
  `;
  await query(sql, [
    processId,
    result.relevance_score,
    result.justification,
    JSON.stringify(result.sectors || []),
    result.service_type,
    result.recommended_participation,
    JSON.stringify(result.key_requirements_detected || []),
    JSON.stringify(result.risk_flags || []),
    MODEL_VERSION,
  ]);

  // Crear entrada en pipeline para procesos nuevos relevantes
  if (result.relevance_score >= 40) {
    await query(
      `INSERT IGNORE INTO process_pipeline (process_id, stage) VALUES (?, 'new')`,
      [processId]
    );
  }
}

async function classifyProcess(processId, proc) {
  const caller = env.anthropic.apiKey ? callClaude : callMock;
  const result = await caller(proc);
  await saveClassification(processId, result);
  return result;
}

// Clasificar procesos no clasificados aún (útil para re-correr)
async function classifyPending({ limit = 50, verbose = false } = {}) {
  const pending = await query(
    `SELECT sp.id, sp.secop_id, sp.title, sp.description, sp.entity_name,
            sp.estimated_value, sp.modality, sp.department, sp.duration, sp.duration_unit,
            sp.response_deadline
     FROM secop_processes sp
     LEFT JOIN process_classifications pc ON pc.process_id = sp.id
     WHERE pc.id IS NULL
     ORDER BY sp.publication_date DESC
     LIMIT ?`,
    [limit]
  );

  console.log(`[clasificador] ${pending.length} procesos pendientes de clasificar`);
  let classified = 0;
  let errors = 0;

  for (const proc of pending) {
    try {
      const result = await classifyProcess(proc.id, proc);
      classified++;
      if (verbose) {
        console.log(`  [${result.relevance_score}/100] ${proc.secop_id} — ${proc.title?.slice(0, 60)}`);
      }
    } catch (err) {
      errors++;
      console.warn(`  Error en ${proc.secop_id}: ${err.message}`);
    }
  }

  console.log(`[clasificador] Clasificados: ${classified}, errores: ${errors}`);
  return { classified, errors };
}

module.exports = { classifyProcess, classifyPending, callClaude };
