import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ScoreIndicator } from '../components/ScoreIndicator';
import { api, formatCOP, formatDate, STAGE_LABELS, STAGE_COLORS, extractUrl } from '../services/api';

const STAGES = ['new', 'evaluating', 'preparing', 'submitted', 'awarded', 'lost', 'discarded'];

export function ProcessDetail() {
  const { id } = useParams();
  const [process, setProcess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stage, setStage] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    api.getProcess(id)
      .then((data) => {
        setProcess(data);
        setStage(data.stage || 'new');
        setNotes(data.pipeline_notes || '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      await api.updatePipeline(id, { stage, notes });
      setProcess((p) => ({ ...p, stage, pipeline_notes: notes }));
    } catch (e) {
      alert('Error al guardar: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-32" />
      <div className="h-64 bg-white rounded-xl border border-gray-200" />
    </div>
  );

  if (!process) return (
    <div className="text-center py-20 text-gray-400">
      <p>Proceso no encontrado.</p>
      <Link to="/" className="text-blue-600 hover:underline mt-2 inline-block">← Volver</Link>
    </div>
  );

  const sectors = Array.isArray(process.sector_match) ? process.sector_match : [];
  const requirements = Array.isArray(process.key_requirements) ? process.key_requirements : [];
  const risks = Array.isArray(process.risk_flags) ? process.risk_flags : [];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <Link to="/" className="text-sm text-blue-600 hover:underline">← Volver al dashboard</Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <ScoreIndicator score={process.relevance_score} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
              {process.entity_name}
            </p>
            <h1 className="text-xl font-bold text-gray-900 mt-1">{process.title || 'Sin título'}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              {process.stage && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[process.stage]}`}>
                  {STAGE_LABELS[process.stage]}
                </span>
              )}
              {process.service_type && process.service_type !== 'otro' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium capitalize">
                  {process.service_type.replace('_', ' ')}
                </span>
              )}
              {sectors.map((s) => (
                <span key={s} className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{s}</span>
              ))}
            </div>
          </div>
          {process.secop_url && (
            <a href={extractUrl(process.secop_url)} target="_blank" rel="noopener noreferrer"
              className="flex-shrink-0 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition">
              Ver en SECOP ↗
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Datos del proceso */}
        <div className="md:col-span-2 space-y-5">
          {/* Objeto */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Objeto del contrato</h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {process.description || '—'}
            </p>
          </div>

          {/* Ficha técnica */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Ficha técnica</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {[
                ['Valor estimado', formatCOP(process.estimated_value)],
                ['Modalidad', process.modality],
                ['Fase', process.phase],
                ['Estado', process.status],
                ['Departamento', process.department],
                ['Ciudad', process.city],
                ['Duración', process.duration ? `${process.duration} ${process.duration_unit || ''}` : '—'],
                ['Publicación', formatDate(process.publication_date)],
                ['Cierre recepción', formatDate(process.response_deadline)],
                ['Referencia SECOP', process.secop_reference],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-gray-500">{label}</dt>
                  <dd className="font-medium text-gray-900">{value || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Análisis IA */}
          {process.relevance_justification && (
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
              <h2 className="text-sm font-semibold text-blue-800 mb-3">Análisis IA</h2>
              <p className="text-sm text-blue-900 leading-relaxed">{process.relevance_justification}</p>
              {requirements.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-blue-700 mb-1">Requisitos detectados:</p>
                  <ul className="list-disc list-inside text-xs text-blue-800 space-y-0.5">
                    {requirements.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
              {risks.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-orange-700 mb-1">Riesgos / alertas:</p>
                  <ul className="list-disc list-inside text-xs text-orange-800 space-y-0.5">
                    {risks.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel pipeline */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Pipeline</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Etapa</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Notas internas</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Observaciones, contactos, compromisos..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-lg bg-blue-600 text-white py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>

          {/* Participación recomendada */}
          {process.recommended_participation && process.recommended_participation !== 'no_aplica' && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Participación sugerida</h2>
              <p className="text-sm font-medium text-blue-700 capitalize">
                {process.recommended_participation.replace('_', ' ')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
