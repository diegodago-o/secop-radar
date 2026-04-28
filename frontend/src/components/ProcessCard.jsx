import { Link } from 'react-router-dom';
import { ScoreIndicator } from './ScoreIndicator';
import { formatCOP, formatDate, STAGE_LABELS, STAGE_COLORS, extractUrl } from '../services/api';

export function ProcessCard({ process }) {
  const {
    id, title, entity_name, estimated_value, modality, department,
    response_deadline, secop_url, relevance_score, service_type,
    sector_match, stage, publication_date,
  } = process;

  const sectors = Array.isArray(sector_match) ? sector_match : [];
  const deadline = response_deadline ? new Date(response_deadline) : null;
  const now = Date.now();
  const isExpired = deadline && deadline < now;
  const isUrgent = deadline && !isExpired && (deadline - now) < 7 * 24 * 60 * 60 * 1000;

  return (
    <div className={`bg-white rounded-xl border hover:shadow-md transition-all duration-150 p-4 flex flex-col gap-3 ${isExpired ? 'border-gray-200 opacity-60' : 'border-gray-200 hover:border-blue-300'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <ScoreIndicator score={relevance_score} size="md" />
        <div className="flex flex-wrap gap-1 justify-end">
          {isExpired && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-200 text-gray-500">
              Vencido
            </span>
          )}
          {stage && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[stage]}`}>
              {STAGE_LABELS[stage]}
            </span>
          )}
          {service_type && service_type !== 'otro' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium capitalize">
              {service_type.replace('_', ' ')}
            </span>
          )}
        </div>
      </div>

      {/* Entidad y título */}
      <div>
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide truncate">
          {entity_name || '—'}
        </p>
        <Link to={`/procesos/${id}`} className="block mt-0.5">
          <p className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-blue-700 transition-colors">
            {title || 'Sin título'}
          </p>
        </Link>
      </div>

      {/* Datos clave */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-500">
        <div>
          <span className="font-medium text-gray-700">{formatCOP(estimated_value)}</span>
        </div>
        <div className="truncate">{department || '—'}</div>
        <div className="truncate">{modality || '—'}</div>
        <div className={isExpired ? 'text-gray-400 line-through' : isUrgent ? 'text-red-600 font-semibold' : ''}>
          {deadline ? `Cierre: ${formatDate(response_deadline)}` : `Pub: ${formatDate(publication_date)}`}
          {isUrgent && ' ⚠'}
        </div>
      </div>

      {/* Sectores */}
      {sectors.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {sectors.map((s) => (
            <span key={s} className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{s}</span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        <Link to={`/procesos/${id}`} className="text-xs text-blue-600 hover:underline font-medium">
          Ver detalle →
        </Link>
        {secop_url && (
          <a href={extractUrl(secop_url)} target="_blank" rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-600 hover:underline">
            SECOP ↗
          </a>
        )}
      </div>
    </div>
  );
}
