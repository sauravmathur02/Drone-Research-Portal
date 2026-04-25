import React from 'react';
import { Crosshair, Zap, Shield, ChevronRight } from 'lucide-react';

export default function DroneListRow({ drone, isSelected, onClick }) {
  // Simple heuristic for threat level
  const speed = drone.specs?.speed_kmh || 0;
  const payload = drone.specs?.payload_kg || 0;
  
  let threatLevel = 'Low';
  let threatColor = 'text-success bg-success/10 border-success/20';
  
  if (speed > 500 || payload > 1000 || drone.type === 'UCAV') {
    threatLevel = 'High';
    threatColor = 'text-danger bg-danger/10 border-danger/20';
  } else if (speed > 200 || payload > 100) {
    threatLevel = 'Medium';
    threatColor = 'text-warning bg-warning/10 border-warning/20';
  }

  const isQuantum = drone.type === 'QUANTUM';

  return (
    <div 
      onClick={onClick}
      className={`group cursor-pointer flex items-center justify-between p-3 rounded-lg border transition-all duration-300 relative overflow-hidden ${
        isSelected 
          ? 'bg-neon/10 border-neon/50 shadow-[0_0_20px_rgba(0,255,255,0.15)]' 
          : 'bg-black/40 border-white/5 hover:bg-white/10 hover:border-white/20'
      }`}
    >
      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-neon shadow-[0_0_10px_rgba(0,255,255,0.8)]"></div>}
      <div className="flex items-center gap-4">
        {/* Thumbnail fallback */}
        <div className="h-10 w-10 shrink-0 rounded bg-black border border-white/10 overflow-hidden relative flex items-center justify-center p-1">
          {(drone.image || drone.photo_url) ? (
            <img 
              src={drone.image || drone.photo_url} 
              alt={drone.name} 
              className={`w-full h-full object-contain transition-all duration-500 ${isSelected ? 'opacity-100 scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:scale-105'}`} 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20">
              <Crosshair size={16} />
            </div>
          )}
        </div>
        
        <div className="flex flex-col">
          <h4 className={`font-heading text-sm font-semibold tracking-wide transition-colors truncate max-w-[120px] md:max-w-[160px] ${isSelected ? 'text-neon drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]' : 'text-white group-hover:text-neon'}`}>
            {drone.name}
          </h4>
          <div className="flex items-center gap-2 mt-0.5 text-[10px] font-data text-white/50 uppercase tracking-wider">
            <span>{drone.country}</span>
            <span className="w-1 h-1 rounded-full bg-white/20"></span>
            <span className={isQuantum ? 'text-[#00ffff]' : ''}>{isQuantum ? 'GRAV-LE' : drone.type}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className={`hidden md:flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${threatColor}`}>
          {threatLevel} Threat
        </div>
        <ChevronRight size={16} className={`transition-transform ${isSelected ? 'text-neon translate-x-1' : 'text-white/20 group-hover:text-white/50'}`} />
      </div>
    </div>
  );
}
