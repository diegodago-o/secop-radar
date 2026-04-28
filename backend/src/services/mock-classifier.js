// Clasificador mock basado en reglas — replica la lógica de C&M sin llamar a la API.
// Usar solo para desarrollo/testing. En producción usar ai-classifier.js (Claude API).

const KEYWORDS_POSITIVE = [
  'interventoría', 'interventoria', 'supervisión', 'supervision',
  'consultoría', 'consultoria', 'estructuración', 'estructuracion',
  'gerencia', 'gerencial', 'asistencia técnica', 'asistencia tecnica',
  'soporte', 'mantenimiento', 'monitoreo', 'seguimiento',
  'tic', 'tecnologías de información', 'tecnologias de informacion',
  'sistema de información', 'sistema de informacion', 'centros digitales',
  'bim', 'app ', 'concesión', 'concesion', 'estructurar',
  'diseño', 'diseno', 'factibilidad', 'estudios previos',
];

const KEYWORDS_NEGATIVE = [
  'suministro', 'dotación', 'dotacion', 'uniformes', 'alimentos',
  'construcción', 'construccion', 'obra civil', 'pavimento', 'pavimentación',
  'compraventa', 'arrendamiento', 'seguros', 'póliza', 'poliza',
  'prestación de servicios personales', 'contrato de prestación personal',
  'outsourcing de personal', 'personal de vigilancia',
];

const TOP_ENTITIES = [
  'ministerio de educación', 'ministerio de educacion', 'mineducación', 'mineducacion',
  'icbf', 'fonade', 'fdn', 'transmilenio', 'fondo tic', 'mintic',
  'secretaría de educación', 'secretaria de educacion',
  'secretaría distrital de integración', 'secretaria distrital de integracion',
  'aeronáutica civil', 'aeronautica civil', 'ani ', 'invias',
];

const TOP_MODALITIES = ['concurso de méritos', 'concurso de meritos', 'licitación', 'licitacion'];

function score(proc) {
  const text = `${proc.description || ''} ${proc.title || ''}`.toLowerCase();
  const entity = (proc.entity_name || '').toLowerCase();
  const modality = (proc.modality || '').toLowerCase();

  // Negativos: si hay keywords negativos, score muy bajo
  const hasNegative = KEYWORDS_NEGATIVE.some((k) => text.includes(k));
  if (hasNegative) {
    return {
      relevance_score: Math.floor(Math.random() * 15) + 5,
      justification: 'El objeto del contrato corresponde a suministro de bienes u obra civil directa, fuera del perfil de C&M.',
      sectors: ['Otro'],
      service_type: 'otro',
      recommended_participation: 'no_aplica',
      key_requirements_detected: [],
      risk_flags: ['Fuera del perfil de servicios de C&M'],
    };
  }

  let base = 30;
  const sectors = [];
  let serviceType = 'otro';

  // Tipo de servicio
  if (/interventor[ií]a/.test(text)) { base += 35; serviceType = 'interventoría'; }
  else if (/gerencia|supervisi[oó]n integral/.test(text)) { base += 25; serviceType = 'gerencia'; }
  else if (/consultor[ií]a|estructuraci[oó]n|factibilidad|estudios/.test(text)) { base += 20; serviceType = 'consultoría'; }
  else if (/soporte|mantenimiento|asistencia t[eé]cnica|centros digitales|tic|sistema de informaci[oó]n/.test(text)) { base += 22; serviceType = 'asistencia_tic'; }

  // Sectores
  if (/educaci[oó]n|escolar|colegio|universidad/.test(text + entity)) sectors.push('Educación');
  if (/tic|tecnolog[ií]a|digital|sistema de informaci[oó]n|software/.test(text + entity)) sectors.push('TIC');
  if (/infraestructura|transporte|vial|carretera|transmilenio|metro/.test(text + entity)) sectors.push('Infraestructura');
  if (/nutrici[oó]n|alimenta|icbf|bienestar/.test(text + entity)) sectors.push('Bienestar Social');
  if (/salud|hospital|cl[ií]nica/.test(text + entity)) sectors.push('Salud');
  if (sectors.length === 0) sectors.push('General');

  // Entidad conocida
  if (TOP_ENTITIES.some((e) => entity.includes(e))) base += 15;

  // Modalidad favorable
  if (TOP_MODALITIES.some((m) => modality.includes(m))) base += 10;

  // Keywords positivos adicionales
  const matchedPositive = KEYWORDS_POSITIVE.filter((k) => text.includes(k));
  base += Math.min(matchedPositive.length * 3, 12);

  // Valor en rango típico de C&M (500M - 10,000M COP)
  const val = proc.estimated_value || 0;
  if (val >= 500_000_000 && val <= 10_000_000_000) base += 5;

  const finalScore = Math.min(base + Math.floor(Math.random() * 5), 100);

  const participation = finalScore >= 70 && val > 3_000_000_000 ? 'consorcio' : 'individual';

  const risks = [];
  if (val > 5_000_000_000) risks.push('Valor alto — posible requisito de experiencia elevado');
  if (/obra/.test(text)) risks.push('Verificar si incluye componente de obra civil directa');

  return {
    relevance_score: finalScore,
    justification: `[MOCK] Proceso de ${serviceType} en sector ${sectors[0]} — ${finalScore >= 70 ? 'alineado' : 'parcialmente alineado'} con el perfil de C&M.`,
    sectors,
    service_type: serviceType,
    recommended_participation: participation,
    key_requirements_detected: matchedPositive.slice(0, 3),
    risk_flags: risks,
  };
}

async function callMock(proc) {
  // Simular latencia de red (50-150ms)
  await new Promise((r) => setTimeout(r, 50 + Math.random() * 100));
  return score(proc);
}

module.exports = { callMock };
