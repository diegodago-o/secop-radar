import { useState } from 'react';
import { ProcessCard } from './ProcessCard';
import { api, STAGE_LABELS, STAGE_COLORS } from '../services/api';

const STAGES = ['new', 'evaluating', 'preparing', 'submitted', 'awarded', 'lost', 'discarded'];

export function Pipeline({ processes, onUpdate }) {
  const [dragging, setDragging] = useState(null);
  const [over, setOver] = useState(null);

  const byStage = STAGES.reduce((acc, s) => {
    acc[s] = processes.filter((p) => (p.stage || 'new') === s);
    return acc;
  }, {});

  async function handleDrop(stage) {
    if (!dragging || dragging.stage === stage) return;
    try {
      await api.updatePipeline(dragging.id, { stage });
      onUpdate();
    } catch (e) {
      console.error(e);
    }
    setDragging(null);
    setOver(null);
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin">
      {STAGES.map((stage) => (
        <div
          key={stage}
          onDragOver={(e) => { e.preventDefault(); setOver(stage); }}
          onDragLeave={() => setOver(null)}
          onDrop={() => handleDrop(stage)}
          className={`flex-shrink-0 w-64 rounded-xl border-2 transition-colors ${
            over === stage ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'
          }`}
        >
          {/* Columna header */}
          <div className="px-3 py-2 flex items-center justify-between border-b border-gray-200">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STAGE_COLORS[stage]}`}>
              {STAGE_LABELS[stage]}
            </span>
            <span className="text-xs text-gray-400 font-medium">{byStage[stage].length}</span>
          </div>

          {/* Tarjetas */}
          <div className="p-2 flex flex-col gap-2 min-h-[120px]">
            {byStage[stage].map((p) => (
              <div
                key={p.id}
                draggable
                onDragStart={() => setDragging(p)}
                onDragEnd={() => { setDragging(null); setOver(null); }}
                className="cursor-grab active:cursor-grabbing"
              >
                <ProcessCard process={p} />
              </div>
            ))}
            {byStage[stage].length === 0 && (
              <p className="text-xs text-gray-400 text-center mt-4">Sin procesos</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
