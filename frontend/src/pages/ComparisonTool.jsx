import React, { useEffect, useState } from 'react';
import { getDrones } from '../services/api';
import { Scale, X } from 'lucide-react';
import DroneCard from '../components/DroneCard';

const specAccessors = {
  price_usd: (drone) => drone.specs?.price_usd || 0,
  range_km: (drone) => drone.specs?.range_km || 0,
  endurance_hr: (drone) => drone.specs?.endurance_hr || 0,
  payload_kg: (drone) => drone.specs?.payload_kg || 0,
  speed_kmh: (drone) => drone.specs?.speed_kmh || 0,
  maintenance_cost_per_hr: (drone) => drone.specs?.maintenance_cost_per_hr || 0,
};

function SpecRowDynamic({ drones, label, propName, unit = '', reverseLogic = false }) {
  if (!drones || drones.length === 0) return null;

  const values = drones.map(d => specAccessors[propName](d));
  
  let bestValue = Math.max(...values);
  let worstValue = Math.min(...values);

  if (reverseLogic) {
    bestValue = Math.min(...values);
    worstValue = Math.max(...values);
  }
  
  // Handle edge cases where all values are the same or zero
  const isAllSame = values.every(v => v === values[0]) || (bestValue === 0 && worstValue === 0);

  return (
    <div className={`grid border-b border-white/5 py-5 items-center hover:bg-white/[0.02] transition-colors`} style={{ gridTemplateColumns: `200px repeat(${drones.length}, minmax(0, 1fr))` }}>
      <div className="text-left font-heading text-[11px] text-white/50 uppercase tracking-widest pl-4">{label}</div>
      {values.map((val, idx) => {
        const isBest = !isAllSame && val === bestValue;
        const isWorst = !isAllSame && val === worstValue;
        return (
          <div key={idx} className="flex flex-col items-center justify-center relative min-h-[40px]">
            {isBest && <span className="absolute -top-4 text-[7px] bg-success/20 text-success border border-success/30 px-1.5 py-0.5 rounded uppercase tracking-widest shadow-[0_0_10px_rgba(0,255,102,0.2)] animate-in zoom-in">Winner</span>}
            <div className={`text-center font-data text-xl transition-all duration-300 ${isBest ? 'text-success font-bold drop-shadow-[0_0_8px_rgba(0,255,102,0.5)] scale-110' : isWorst ? 'text-danger font-bold drop-shadow-[0_0_5px_rgba(255,51,51,0.5)]' : 'text-white/70'}`}>
              {val.toLocaleString()} <span className="text-xs opacity-50">{unit}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ComparisonTool() {
  const [drones, setDrones] = useState([]);
  const [compareIds, setCompareIds] = useState([]);

  useEffect(() => {
    getDrones()
      .then((response) => {
        setDrones(response);
        const saved = JSON.parse(localStorage.getItem('compareDrones') || '[]');
        setCompareIds(saved);
      })
      .catch(console.error);
      
    const handleUpdate = () => {
      const saved = JSON.parse(localStorage.getItem('compareDrones') || '[]');
      setCompareIds(saved);
    };
    window.addEventListener('compareUpdated', handleUpdate);
    return () => window.removeEventListener('compareUpdated', handleUpdate);
  }, []);

  const handleRemove = (id) => {
    const updated = compareIds.filter(cId => cId !== id);
    setCompareIds(updated);
    localStorage.setItem('compareDrones', JSON.stringify(updated));
    window.dispatchEvent(new Event('compareUpdated'));
  };

  const handleAdd = (id) => {
    if (!id) return;
    if (compareIds.length >= 3) {
      alert("Maximum 3 drones can be compared at once.");
      return;
    }
    if (!compareIds.includes(id)) {
      const updated = [...compareIds, id];
      setCompareIds(updated);
      localStorage.setItem('compareDrones', JSON.stringify(updated));
      window.dispatchEvent(new Event('compareUpdated'));
    }
  };

  const selectedDrones = compareIds.map(id => drones.find(d => d._id === id)).filter(Boolean);

  const getSummaryVerdict = () => {
    if (selectedDrones.length < 2) return null;
    
    let bestRange = { val: -1, drone: null };
    let bestSpeed = { val: -1, drone: null };
    let bestPayload = { val: -1, drone: null };

    selectedDrones.forEach(d => {
      const r = d.specs?.range_km || 0;
      const s = d.specs?.speed_kmh || 0;
      const p = d.specs?.payload_kg || 0;
      if (r > bestRange.val) bestRange = { val: r, drone: d.name };
      if (s > bestSpeed.val) bestSpeed = { val: s, drone: d.name };
      if (p > bestPayload.val) bestPayload = { val: p, drone: d.name };
    });

    if (bestRange.drone === bestSpeed.drone && bestRange.drone === bestPayload.drone) {
      return `${bestRange.drone} comprehensively outperforms competitors across all major strategic metrics.`;
    }
    
    const counts = {};
    [bestRange.drone, bestSpeed.drone, bestPayload.drone].forEach(n => {
      if(n) counts[n] = (counts[n] || 0) + 1;
    });
    
    const topWinner = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    
    return `${topWinner} demonstrates significant tactical advantages in this comparison group.`;
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto custom-scrollbar pb-6 pr-4">
      <div className="w-full max-w-7xl mx-auto">
        
        {/* Top Controls */}
        <div className="flex items-center gap-4 mb-8 bg-panel/30 p-4 rounded-xl border border-white/5">
           <Scale size={20} className="text-neon" />
           <h2 className="font-heading text-lg text-white">Compare Platforms</h2>
           
           <div className="ml-auto flex items-center gap-3">
             <span className="font-data text-xs text-white/50 hidden md:inline">{compareIds.length} / 3 Selected</span>
             <select 
               className="bg-black/50 border border-white/10 text-white/80 p-2 rounded text-sm outline-none focus:border-neon max-w-[200px] truncate"
               value=""
               onChange={(e) => handleAdd(e.target.value)}
               disabled={compareIds.length >= 3}
             >
               <option value="" disabled>+ Add Drone to Compare</option>
               {drones.filter(d => !compareIds.includes(d._id)).map(d => (
                 <option key={d._id} value={d._id}>{d.name}</option>
               ))}
             </select>
           </div>
        </div>

        {selectedDrones.length === 0 ? (
          <div className="text-center py-20 bg-panel/20 rounded-2xl border border-white/5 border-dashed">
            <Scale size={48} className="mx-auto text-white/20 mb-4" />
            <h3 className="font-heading text-white/50 uppercase tracking-widest">No Drones Selected</h3>
            <p className="font-data text-xs text-white/30 mt-2">Add platforms using the dropdown above or from the database.</p>
          </div>
        ) : (
          <>
            <div className={`grid gap-6 items-start mb-8 ${selectedDrones.length === 1 ? 'grid-cols-1 md:w-1/3' : selectedDrones.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
              {selectedDrones.map(drone => (
                <div key={drone._id} className="relative w-full flex flex-col gap-4 group">
                  <button 
                    onClick={() => handleRemove(drone._id)}
                    title="Remove from comparison"
                    className="absolute top-2 right-2 z-10 bg-black/60 border border-white/10 hover:bg-danger/20 hover:border-danger hover:text-danger text-white p-1.5 rounded-full transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                  <DroneCard drone={drone} index={0} />
                </div>
              ))}
            </div>

            {/* Detailed Spec Comparison */}
            {selectedDrones.length > 1 && (
              <div className="glass-card bg-gradient-to-b from-panel/80 to-black/60 w-full overflow-x-auto custom-scrollbar rounded-xl border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between gap-3 mb-2 border-b border-white/5 p-5 bg-black/40">
                  <div className="flex items-center gap-3">
                    <Scale size={20} className="text-neon" />
                    <h2 className="font-heading text-sm uppercase tracking-widest text-white">Full Technical Analysis</h2>
                  </div>
                  <div className="px-4 py-1.5 bg-neon/10 border border-neon/30 text-neon rounded font-data text-xs shadow-[0_0_15px_rgba(0,255,255,0.1)]">
                    Verdict: {getSummaryVerdict()}
                  </div>
                </div>
                <div className="min-w-[700px] p-2">
                  <SpecRowDynamic drones={selectedDrones} label="Price Point" propName="price_usd" unit="$" reverseLogic={true} />
                  <SpecRowDynamic drones={selectedDrones} label="Effective Range" propName="range_km" unit="km" />
                  <SpecRowDynamic drones={selectedDrones} label="Flight Endurance" propName="endurance_hr" unit="h" />
                  <SpecRowDynamic drones={selectedDrones} label="Payload Capacity" propName="payload_kg" unit="kg" />
                  <SpecRowDynamic drones={selectedDrones} label="Top Speed" propName="speed_kmh" unit="km/h" />
                  <SpecRowDynamic drones={selectedDrones} label="Field Maintenance/Hr" propName="maintenance_cost_per_hr" unit="$" reverseLogic={true} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
