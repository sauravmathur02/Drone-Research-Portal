import React, { useEffect, useState } from 'react';
import { getDrones } from '../services/api';

export default function DroneDatabase() {
  const [drones, setDrones] = useState([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const params = filter !== 'All' ? { type: filter } : {};
    getDrones(params).then(setDrones).catch(console.error);
  }, [filter]);

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex gap-4 border-b border-border pb-4">
        {['All', 'Nano', 'Tactical', 'MALE', 'HALE', 'Loitering', 'Swarm'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded font-heading text-sm transition-all ${
              filter === type
                ? 'bg-neon/20 text-neon border border-neon shadow-[0_0_10px_rgba(0,243,255,0.3)]'
                : 'bg-panel border border-transparent text-textMuted hover:border-border hover:text-white'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-6 overflow-y-auto pb-6 custom-scrollbar pr-2">
        {drones.map((drone) => (
          <div key={drone._id} className="glass-card flex flex-col p-0 overflow-hidden group">
            <div className="h-32 bg-black/50 relative border-b border-border flex items-center justify-center">
              <span className="text-4xl text-white/10 group-hover:text-neon/30 transition-colors">^</span>
              <span className="absolute top-2 right-2 bg-dark/80 border border-neon text-neon text-[10px] px-2 py-1 rounded font-data tracking-wider">
                {drone.type.toUpperCase()}
              </span>
            </div>
            <div className="p-5 flex flex-col flex-grow">
              <h4 className="font-heading text-lg font-bold truncate">{drone.name}</h4>
              <div className="text-xs font-data text-textMuted mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-warning"></span> {drone.country}
              </div>

              <div className="grid grid-cols-2 gap-y-3 font-data text-sm mt-auto">
                <div>
                  <div className="text-[10px] text-textMuted uppercase mb-0.5">Est. Price</div>
                  <div className="text-neon">${(drone.specs?.price_usd || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] text-textMuted uppercase mb-0.5">Range</div>
                  <div>{drone.specs?.range_km || 0} km</div>
                </div>
                <div>
                  <div className="text-[10px] text-textMuted uppercase mb-0.5">Endurance</div>
                  <div>{drone.specs?.endurance_hr || 0}h</div>
                </div>
                <div>
                  <div className="text-[10px] text-textMuted uppercase mb-0.5">Payload</div>
                  <div className="text-warning">{drone.specs?.payload_kg || 0} kg</div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {drones.length === 0 && <div className="col-span-4 text-center py-20 text-textMuted font-data">No systems found for this classification.</div>}
      </div>
    </div>
  );
}
