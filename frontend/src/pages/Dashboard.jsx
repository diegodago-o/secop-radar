import { useState, useEffect, useCallback } from 'react';
import { StatsBar } from '../components/StatsBar';
import { Filters } from '../components/Filters';
import { ProcessCard } from '../components/ProcessCard';
import { Pipeline } from '../components/Pipeline';
import { api } from '../services/api';

const VIEWS = { list: 'Lista', pipeline: 'Pipeline' };

export function Dashboard() {
  const [view, setView] = useState('list');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [processes, setProcesses] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ page: 1, limit: 24, min_score: 0, active_only: 'true' });

  const loadStats = useCallback(async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (e) {
      console.error('Error stats:', e.message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadProcesses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getProcesses(filters);
      setProcesses(data.data);
      setPagination(data.pagination);
    } catch (e) {
      console.error('Error procesos:', e.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadProcesses(); }, [loadProcesses]);

  function handleFilterChange(newFilters) {
    setFilters(newFilters);
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <StatsBar stats={stats} loading={statsLoading} />

      {/* Filtros */}
      <Filters filters={filters} onChange={handleFilterChange} />

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {pagination ? (
            <>
              <strong className="text-gray-900">{pagination.total.toLocaleString('es-CO')}</strong> procesos encontrados
            </>
          ) : '—'}
        </p>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
          {Object.entries(VIEWS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                view === key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-52 bg-white rounded-xl border border-gray-200 animate-pulse" />
          ))}
        </div>
      ) : processes.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">📡</p>
          <p className="font-medium">Sin procesos con estos filtros</p>
          <p className="text-sm mt-1">
            El servidor está ingiriendo datos del SECOP — vuelve en unos minutos.
          </p>
        </div>
      ) : view === 'pipeline' ? (
        <Pipeline processes={processes} onUpdate={loadProcesses} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {processes.map((p) => <ProcessCard key={p.id} process={p} />)}
          </div>

          {/* Paginación */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-2">
              <button
                disabled={filters.page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                ← Anterior
              </button>
              <span className="text-sm text-gray-600">
                Página {pagination.page} de {pagination.pages}
              </span>
              <button
                disabled={filters.page >= pagination.pages}
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
