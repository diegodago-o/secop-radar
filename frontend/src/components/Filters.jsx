import { useState } from 'react';
import { STAGE_LABELS } from '../services/api';

const MODALITIES = [
  'Concurso de méritos',
  'Licitación pública',
  'Selección abreviada',
  'Contratación directa',
  'Mínima cuantía',
];

export function Filters({ filters, onChange }) {
  const [open, setOpen] = useState(true);

  function set(key, value) {
    onChange({ ...filters, [key]: value, page: 1 });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        <span>Filtros</span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 border-t border-gray-100 pt-3">
          {/* Búsqueda */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Entidad, objeto, palabras clave..."
              value={filters.search || ''}
              onChange={(e) => set('search', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Score mínimo */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Score mínimo: <strong>{filters.min_score ?? 0}</strong>
            </label>
            <input
              type="range" min="0" max="100" step="5"
              value={filters.min_score ?? 0}
              onChange={(e) => set('min_score', e.target.value)}
              className="w-full accent-blue-600"
            />
          </div>

          {/* Modalidad */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Modalidad</label>
            <select
              value={filters.modality || ''}
              onChange={(e) => set('modality', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              {MODALITIES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Etapa pipeline */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Etapa</label>
            <select
              value={filters.stage || ''}
              onChange={(e) => set('stage', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              {Object.entries(STAGE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Departamento */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Departamento</label>
            <input
              type="text"
              placeholder="Ej: Bogotá D.C."
              value={filters.department || ''}
              onChange={(e) => set('department', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Solo activos */}
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filters.active_only !== 'false'}
                onChange={(e) => set('active_only', e.target.checked ? 'true' : 'false')}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-sm text-gray-700 font-medium">Solo procesos vigentes</span>
            </label>
          </div>

          {/* Reset */}
          <div className="flex items-end">
            <button
              onClick={() => onChange({ page: 1, limit: 24, min_score: 0, active_only: 'true' })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
