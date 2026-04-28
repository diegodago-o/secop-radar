const BASE = '/api';

// urlproceso del SODA puede llegar como {"url":"https://..."} o string plano
export function extractUrl(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw.url || null;
  try {
    const p = JSON.parse(raw);
    return p.url || raw;
  } catch {
    return raw;
  }
}

async function http(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  // Dashboard
  getStats: () => http('/dashboard/stats'),
  getTopEntities: () => http('/dashboard/top-entities'),

  // Procesos
  getProcesses: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    ).toString();
    return http(`/processes${qs ? '?' + qs : ''}`);
  },
  getProcess: (id) => http(`/processes/${id}`),
  updatePipeline: (id, body) =>
    http(`/processes/${id}/pipeline`, { method: 'PATCH', body: JSON.stringify(body) }),
};

export function formatCOP(value) {
  if (!value) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export const STAGE_LABELS = {
  new: 'Nuevo',
  evaluating: 'Evaluando',
  preparing: 'Preparando',
  submitted: 'Presentado',
  awarded: 'Adjudicado',
  lost: 'Perdido',
  discarded: 'Descartado',
};

export const STAGE_COLORS = {
  new: 'bg-blue-100 text-blue-800',
  evaluating: 'bg-yellow-100 text-yellow-800',
  preparing: 'bg-orange-100 text-orange-800',
  submitted: 'bg-purple-100 text-purple-800',
  awarded: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',
  discarded: 'bg-gray-100 text-gray-600',
};
