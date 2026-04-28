require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { callClaude } = require('../src/services/ai-classifier');

// Casos de prueba: deberían tener scores altos (C&M gana este tipo)
const TEST_CASES = [
  {
    label: 'Interventoría MinEducación (DEBE ser ~90)',
    entity_name: 'Ministerio de Educación Nacional',
    description: 'Interventoría técnica, administrativa, financiera y jurídica al contrato de prestación de servicios para la implementación del programa de calidad educativa en municipios PDET',
    estimated_value: 1500000000,
    modality: 'Concurso de méritos',
    department: 'Bogotá D.C.',
    duration: 12,
    duration_unit: 'meses',
    response_deadline: '2026-06-15',
  },
  {
    label: 'Asistencia TIC Fondo TIC (DEBE ser ~80)',
    entity_name: 'Ministerio TIC - Fondo TIC',
    description: 'Soporte, mantenimiento y asistencia técnica a los centros digitales comunitarios en 120 municipios rurales del país',
    estimated_value: 3200000000,
    modality: 'Licitación pública',
    department: 'Bogotá D.C.',
    duration: 24,
    duration_unit: 'meses',
    response_deadline: '2026-05-30',
  },
  {
    label: 'Suministro de uniformes ICBF (DEBE ser <20)',
    entity_name: 'ICBF',
    description: 'Suministro de uniformes y dotación escolar para niños beneficiarios del programa de nutrición en Cundinamarca',
    estimated_value: 800000000,
    modality: 'Selección abreviada',
    department: 'Cundinamarca',
    duration: 6,
    duration_unit: 'meses',
    response_deadline: '2026-05-10',
  },
  {
    label: 'Gerencia proyecto TransMilenio (DEBE ser ~75)',
    entity_name: 'TransMilenio S.A.',
    description: 'Gerencia integral y supervisión técnica para la ampliación de la Fase III del sistema de transporte masivo BRT',
    estimated_value: 5000000000,
    modality: 'Concurso de méritos',
    department: 'Bogotá D.C.',
    duration: 36,
    duration_unit: 'meses',
    response_deadline: '2026-07-01',
  },
];

async function runTests() {
  console.log('=== TEST CLASIFICADOR IA — SECOP Radar ===\n');

  for (const tc of TEST_CASES) {
    try {
      process.stdout.write(`► ${tc.label}... `);
      const result = await callClaude(tc);
      console.log(`Score: ${result.relevance_score}/100`);
      console.log(`  Tipo: ${result.service_type} | Participación: ${result.recommended_participation}`);
      console.log(`  Sectores: ${(result.sectors || []).join(', ')}`);
      console.log(`  Justificación: ${result.justification}`);
      if (result.risk_flags?.length) console.log(`  Riesgos: ${result.risk_flags.join(', ')}`);
      console.log();
    } catch (err) {
      console.error(`ERROR: ${err.message}\n`);
    }
  }
}

runTests().catch(console.error);
