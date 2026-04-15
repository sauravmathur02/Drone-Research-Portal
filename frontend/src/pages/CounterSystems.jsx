import React, { useEffect, useState } from 'react';
import { getCounterSystems } from '../services/api';

export default function CounterSystems() {
  const [systems, setSystems] = useState([]);

  useEffect(() => {
    getCounterSystems().then(setSystems).catch(console.error);
  }, []);

  const getTypeColor = (type) => {
    switch (type) {
      case 'Laser':
        return 'text-neon border-neon';
      case 'Jamming':
        return 'text-warning border-warning';
      case 'Interceptor':
        return 'text-[#b366ff] border-[#b366ff]';
      case 'Missile':
        return 'text-danger border-danger';
      default:
        return 'text-white border-white';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pr-2 custom-scrollbar">
      <h2 className="font-heading text-xl mb-6 flex items-center gap-2"><span className="text-warning">!</span> Counter-Measures Grid</h2>
      <div className="grid grid-cols-2 gap-6">
        {systems.map((system) => (
          <div key={system._id} className="glass-card flex flex-col">
            <div className="border-b border-white/5 pb-4 mb-4 flex justify-between items-start">
              <div>
                <h3 className="font-heading text-lg font-bold">{system.name}</h3>
                <span className={`inline-block border rounded px-2 py-0.5 mt-2 text-xs font-data bg-black/50 ${getTypeColor(system.type)}`}>
                  {system.type.toUpperCase()} Defense
                </span>
              </div>
              <div className="text-right">
                <div className="text-success font-data text-xl drop-shadow-[0_0_5px_rgba(0,255,102,0.5)]">{system.effectiveness}</div>
                <div className="text-[10px] uppercase text-textMuted font-heading tracking-wider mt-1">Effectiveness</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 font-data text-sm mb-4">
              <div>
                <div className="text-textMuted text-[10px] mb-1">Max Effective Range</div>
                <div className="text-white">{system.range_km} km</div>
              </div>
              <div>
                <div className="text-textMuted text-[10px] mb-1">Coverage Type</div>
                <div className="text-warning">{system.type}</div>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-white/5">
              <div className="text-[10px] text-textMuted uppercase mb-2 font-heading tracking-widest">Effective Against:</div>
              <div className="flex gap-2 flex-wrap mb-4">
                {system.effective_against.map((tag) => (
                  <span key={tag} className="bg-white/5 text-xs px-2 py-1 rounded text-textMain border border-white/10 font-data">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="bg-black/30 p-4 border-l-2 rounded-r">
                <div className="text-[10px] text-textMuted uppercase mb-1 font-heading tracking-widest flex items-center gap-1">
                  <span className={getTypeColor(system.type).split(' ')[0]}>+</span> Why it works
                </div>
                <p className="text-xs text-white/80 leading-relaxed font-body">
                  {system.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
