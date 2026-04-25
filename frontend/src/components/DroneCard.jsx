import React, { useState, Suspense } from 'react';
import { Box, Zap, Shield, Crosshair, Gauge } from 'lucide-react';
import DroneHoverPreview from './DroneHoverPreview';

const TYPE_COLORS = {
  'Nano': 'from-purple-500/20 to-purple-900/5',
  'Tactical': 'from-blue-500/20 to-blue-900/5',
  'MALE': 'from-cyan-500/20 to-cyan-900/5',
  'HALE': 'from-emerald-500/20 to-emerald-900/5',
  'UCAV': 'from-red-500/20 to-red-900/5',
  'Loitering': 'from-orange-500/20 to-orange-900/5',
  'Swarm': 'from-pink-500/20 to-pink-900/5',
};

export default function DroneCard({ drone, onClick, index }) {
  const [hovered, setHovered] = useState(false);

  const fallbackImage = "/images/default-drone.jpg";
  const droneImage = drone.image || drone.photo_url || fallbackImage;
  const hasImage = !!(drone.image || drone.photo_url);

  // Special Theoretical Handling
  const isQuantum = drone.type === 'QUANTUM';
  const displayType = isQuantum ? 'GRAV-LE' : drone.type;
  // Force HMR Trigger 2
  
  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-300 hover:-translate-y-1 ${
        isQuantum 
          ? 'bg-[#0a0e14] border-[#00ffff]/20 shadow-[0_0_15px_rgba(0,255,255,0.05)] hover:border-[#00ffff]/60 hover:shadow-[0_10px_40px_rgba(0,255,255,0.25)]' 
          : 'bg-panel/50 border-white/5 hover:border-[#00ffff]/40 hover:shadow-[0_10px_30px_rgba(0,255,255,0.15)] hover:bg-black/60'
      } cursor-pointer w-full min-h-[420px]`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ animationDelay: `${(index || 0) * 40}ms` }}
    >
      {/* Cover Image Section — Fixed height 220px */}
      <div className="h-[220px] w-full overflow-hidden relative shrink-0 bg-gradient-to-b from-[#0a0e14] to-black flex items-center justify-center p-4">
        {hasImage ? (
          <img
            src={droneImage}
            alt={drone.name}
            loading="lazy"
            onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage; }}
            className={`max-w-full max-h-full object-contain rounded-lg transition-all duration-700 ${hovered ? 'scale-[1.03] saturate-110' : 'scale-100 opacity-90'} ${isQuantum ? 'opacity-90 saturate-150' : ''}`}
          />
        ) : (
          <div className="w-full h-full bg-[#05080f] flex flex-col items-center justify-center relative overflow-hidden group/fallback">
            {/* Tech Grid Background */}
            <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(circle, #00ffff 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
            
            {/* Vignette */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#05080f]/60 to-[#05080f] z-0"></div>

            {/* Central HUD Element */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="relative w-16 h-16 flex items-center justify-center">
                {/* Rotating outer ring */}
                <div className="absolute inset-0 rounded-full border border-dashed border-[#00ffff]/20 group-hover/fallback:border-[#00ffff]/60 animate-[spin_10s_linear_infinite] transition-colors duration-700"></div>
                {/* Inner target */}
                <div className="absolute inset-2 rounded-full border border-[#00ffff]/10 flex items-center justify-center bg-black/60 shadow-[inset_0_0_20px_rgba(0,255,255,0.1)]">
                  <Crosshair size={24} strokeWidth={1} className="text-[#00ffff]/40 group-hover/fallback:text-[#00ffff] transition-colors duration-500 animate-[pulse_3s_ease-in-out_infinite]" />
                </div>
              </div>
              
              {/* Text Badge */}
              <div className="mt-4 flex flex-col items-center gap-1.5">
                <span className="text-[11px] font-heading font-bold text-white/50 tracking-widest uppercase shadow-black drop-shadow-md">Classified</span>
                <span className="text-[7px] font-data text-[#00ffff]/60 tracking-[0.3em] uppercase bg-[#00ffff]/5 px-2.5 py-1 rounded border border-[#00ffff]/20 backdrop-blur-sm">No Visual Intel</span>
              </div>
            </div>
            
            {/* Corner Bracket Decorations */}
            <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-[#00ffff]/30"></div>
            <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-[#00ffff]/30"></div>
            <div className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-[#00ffff]/30"></div>
            <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-[#00ffff]/30"></div>
          </div>
        )}
        
        {/* Gradient Overlay for Readability */}
        <div className={`absolute inset-0 bg-gradient-to-t ${TYPE_COLORS[drone.type] || 'from-black/80 via-black/20 to-transparent'} opacity-80 group-hover:opacity-90 transition-opacity duration-300 z-10 pointer-events-none`}></div>
        {/* Inner Glow Border */}
        <div className="absolute inset-0 border-[3px] border-transparent group-hover:border-[#00ffff]/20 rounded-t-xl z-20 pointer-events-none transition-all duration-500 scale-100 group-hover:scale-[0.98]"></div>

        {/* Type Badge */}
        <span className={`absolute top-3 right-3 text-[9px] px-2.5 py-1 uppercase font-heading tracking-wider border rounded-full z-30 shadow-[0_0_8px_rgba(0,255,255,0.1)] transition-all duration-300 ${
          isQuantum ? 'text-[#00ffff] bg-black/80 border-[#00ffff]/50' : 'text-[#00ffff]/90 bg-black/60 backdrop-blur-md border-[#00ffff]/30 group-hover:bg-black/80 group-hover:text-[#00ffff] group-hover:border-[#00ffff]/70'
        }`}>
          {displayType}
        </span>

        {/* 3D Preview Overlay - Show only on Hover if Model Exists */}
        {drone.model_url && (
          <div className={`absolute inset-0 z-20 transition-opacity duration-500 overflow-hidden rounded-t-xl pointer-events-none ${hovered ? 'opacity-100' : 'opacity-0'}`}>
            <div className={`w-full h-full backdrop-blur-md flex items-center justify-center ${isQuantum ? 'bg-[#05070d]/90' : 'bg-[#05070d]/85'}`}>
              <Suspense fallback={<div className="text-[#00ffff]/40 animate-pulse text-[10px] uppercase font-data">Uplinking 3D...</div>}>
                <DroneHoverPreview drone={drone} />
              </Suspense>
              
              <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
                  <div className={`bg-[#00ffff]/10 border px-3 py-1 rounded-full backdrop-blur-sm shadow-[0_0_15px_rgba(0,255,255,0.2)] ${isQuantum ? 'border-[#00ffff]/60' : 'border-[#00ffff]/40'}`}>
                    <span className="text-[9px] font-heading text-[#00ffff] uppercase tracking-wider animate-pulse">
                      {isQuantum ? 'Analyzing Spacetime Curvature' : '3D Intel Acquired'}
                    </span>
                  </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Section - Name and Stats */}
      <div className={`p-5 flex flex-col flex-grow relative z-30 bg-gradient-to-b ${isQuantum ? 'from-[#0a0e14] to-[#0d121c]' : 'from-[#0a0f18] to-panel'} gap-4`}>
        
        <div className="flex flex-col gap-1 w-full">
          {/* Name explicitly below image */}
          <h4 
            className="text-lg font-heading font-semibold text-white drop-shadow-lg line-clamp-2 group-hover:text-[#00ffff] transition-colors duration-300 leading-snug w-full block"
            title={drone.name}
          >
            {drone.name}
          </h4>

          {/* Country Badge */}
          <div className="text-[10px] font-data text-white/80 flex items-center gap-2 uppercase tracking-[0.2em] shrink-0 mt-1">
            <span className={`w-1.5 h-1.5 shrink-0 rounded-full shadow-[0_0_8px_rgba(255,153,51,0.9)] ${isQuantum ? 'bg-[#00ffff] shadow-[#00ffff]' : 'bg-warning'}`}></span>
            <span className="truncate">{drone.country} • {displayType}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mt-auto">
          <StatItem 
            icon={<Crosshair size={10} />} 
            label={isQuantum ? "Lift Capacity" : "Range"} 
            value={isQuantum ? `${drone.specs?.range_km || 0} G` : `${drone.specs?.range_km || 0} km`} 
            mono={isQuantum}
          />
          <StatItem 
            icon={<Zap size={10} />} 
            label={isQuantum ? "Energy Flux" : "Speed"} 
            value={isQuantum ? `${drone.specs?.speed_kmh || 0} TW` : `${drone.specs?.speed_kmh || 0} km/h`} 
            mono={isQuantum}
          />
          <StatItem 
            icon={<Gauge size={10} />} 
            label={isQuantum ? "Field Radius" : "Endurance"} 
            value={isQuantum ? `${drone.specs?.endurance_hr || 0} m` : `${drone.specs?.endurance_hr || 0}h`} 
            mono={isQuantum}
          />
          <StatItem 
            icon={<Shield size={10} />} 
            label={isQuantum ? "Stability" : "Payload"} 
            value={isQuantum ? `${drone.specs?.payload_kg || 0}%` : `${drone.specs?.payload_kg || 0} kg`} 
            accent={!isQuantum}
            mono={isQuantum}
            theoretical={isQuantum}
          />
        </div>
      </div>
    </div>
  );
}

function StatItem({ icon, label, value, accent, mono, theoretical }) {
  return (
    <div className={`bg-black/40 rounded border px-3 py-2 group/stat transition-all duration-300 relative overflow-hidden ${theoretical ? 'border-[#00ffff]/10 hover:border-[#00ffff]/30' : 'border-white/5 hover:border-[#00ffff]/30 hover:bg-[#00ffff]/5'}`}>
      {/* Top highlight line on hover */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00ffff]/0 group-hover/stat:via-[#00ffff]/60 to-transparent transition-all duration-500"></div>
      
      <div className="flex items-center gap-1.5 text-[8px] text-white/40 uppercase mb-1 font-heading tracking-widest">
        {React.cloneElement(icon, { className: theoretical ? 'text-[#00ffff]/60' : 'text-[#00ffff]/50' })} 
        <span>{label}</span>
      </div>
      <div className={`text-[12px] ${mono ? 'font-mono tracking-wider' : 'font-data tracking-wide'} font-bold ${accent ? 'text-warning drop-shadow-[0_0_5px_rgba(255,204,0,0.4)]' : (theoretical ? 'text-[#00ffff] drop-shadow-[0_0_8px_rgba(0,255,255,0.4)]' : 'text-white/90 group-hover/stat:text-white')}`}>
        {value}
      </div>
    </div>
  );
}
