import { formatDate } from '../services/api';

function Stat({ label, value, color = 'text-gray-900' }) {
  return (
    <div className="flex flex-col items-center px-4 py-3">
      <span className={`text-2xl font-bold ${color}`}>{value ?? '—'}</span>
      <span className="text-xs text-gray-500 mt-0.5 text-center">{label}</span>
    </div>
  );
}

export function StatsBar({ stats, loading }) {
  if (loading) return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse h-20" />
  );
  if (!stats) return null;

  const { totals, pipeline, last_ingestion_at } = stats;

  return (
    <div className="bg-white border border-gray-200 rounded-xl divide-x divide-gray-100 flex flex-wrap">
      <Stat label="Procesos SECOP" value={totals?.total_processes?.toLocaleString('es-CO')} />
      <Stat label="Clasificados" value={totals?.classified?.toLocaleString('es-CO')} />
      <Stat label="Alta relevancia (≥80)" value={totals?.high_relevance} color="text-green-600" />
      <Stat label="Media (60–79)" value={totals?.medium_relevance} color="text-yellow-600" />
      <Stat label="En evaluación" value={pipeline?.evaluating ?? 0} color="text-blue-600" />
      <Stat label="Preparando oferta" value={pipeline?.preparing ?? 0} color="text-orange-600" />
      <Stat label="Presentados" value={pipeline?.submitted ?? 0} color="text-purple-600" />
      <div className="flex flex-col justify-center px-4 py-3 text-xs text-gray-400">
        <span>Última ingesta</span>
        <span className="font-medium text-gray-600">{formatDate(last_ingestion_at)}</span>
      </div>
    </div>
  );
}
