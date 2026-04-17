import React, { useEffect, useState, Suspense } from 'react';
import { X, Box, Loader2 } from 'lucide-react';
import { getDrones } from '../services/api';

import Drone3DModal from '../components/Drone3DModal';



export default function DroneDatabase() {
  const [drones, setDrones] = useState([]);
  const [filter, setFilter] = useState('All');
  const [selectedDrone, setSelectedDrone] = useState(null);

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
          <div 
            key={drone._id} 
            className="glass-card flex flex-col p-0 overflow-hidden group cursor-pointer transition-all hover:border-neon/50 hover:shadow-[0_0_20px_rgba(0,243,255,0.15)]"
            onClick={() => setSelectedDrone(drone)}
          >
            <div className="h-40 w-full overflow-hidden rounded-t-lg relative">
              <img
                src={drone.photo_url}
                alt={drone.name}
                loading="lazy"
                onError={(e) => { e.target.onerror = null; e.target.src = "/drones/default.jpg"; }}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute top-2 right-2 text-[10px] uppercase font-data tracking-widest text-neon bg-black/80 border border-neon/50 px-2 py-1 rounded z-10">
                {drone.type}
              </span>
            </div>
            
            <div className="p-5 flex flex-col flex-grow relative z-10 bg-panel/90">
              <h4 className="font-heading text-lg font-bold truncate group-hover:text-neon transition-colors">{drone.name}</h4>
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

      {selectedDrone && (
        <Drone3DModal drone={selectedDrone} onClose={() => setSelectedDrone(null)} />
      )}
    </div>
  );
}
