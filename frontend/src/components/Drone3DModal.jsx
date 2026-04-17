import React, { Suspense, useState } from 'react';
import { X, Loader2, Scale, Shield, Activity, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Drone3DViewer = React.lazy(() => import('./Drone3DViewer'));

export default function Drone3DModal({ drone, onClose }) {
  const navigate = useNavigate();
  const [dataMode, setDataMode] = useState(false);

  if (!drone) return null;

  // Derive role heuristically
  const role = drone.specs?.payload_kg > 100 || ["MALE", "HALE"].includes(drone.type) 
    ? "Surveillance & Strike" 
    : "Tactical Reconnaissance";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-[90vw] h-[90vh] rounded-xl border border-neon/30 bg-[#030712] relative overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,243,255,0.1)]">
        
        {/* TOP LEFT: Info Header */}
        <div className="absolute top-0 left-0 p-6 z-10 pointer-events-none flex items-start gap-5">
          {drone.photo_url && (
            <div className="h-20 w-20 md:h-24 md:w-24 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-black/50 backdrop-blur-md shadow-lg">
              <img src={drone.photo_url} alt={drone.name} loading="lazy" onError={(e) => { e.target.onerror = null; e.target.src = "/drones/default.jpg"; }} className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <h2 className="font-heading text-3xl text-white drop-shadow-lg">{drone.name}</h2>
            <div className="flex items-center gap-3 mt-2 font-data text-sm text-neon drop-shadow-md">
              <span className="bg-neon/10 border border-neon/30 px-2 py-0.5 rounded">{drone.country}</span>
              <span>•</span>
              <span className="uppercase tracking-widest">{drone.type}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-white/80">
                <Target size={14} className="text-warning" /> {role}
              </span>
            </div>
          </div>
        </div>

        {/* TOP CENTER: Mode Switch */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex bg-black/50 border border-white/10 rounded-full p-1 backdrop-blur-md">
          <button 
            onClick={() => setDataMode(false)}
            className={`px-4 py-1.5 rounded-full font-data text-[11px] uppercase tracking-widest transition-all ${!dataMode ? 'bg-neon/20 text-neon border border-neon/50' : 'text-textMuted hover:text-white'}`}
          >
            Hologram
          </button>
          <button 
            onClick={() => setDataMode(true)}
            className={`px-4 py-1.5 rounded-full font-data text-[11px] uppercase tracking-widest transition-all ${dataMode ? 'bg-neon/20 text-neon border border-neon/50' : 'text-textMuted hover:text-white'}`}
          >
            Intelligence
          </button>
        </div>

        {/* TOP RIGHT: Close Button */}
        <div className="absolute top-6 right-6 z-20 pointer-events-auto">
          <button 
            onClick={onClose}
            className="rounded bg-black/50 border border-white/10 p-2 text-white hover:text-danger hover:border-danger transition-colors backdrop-blur-sm"
            aria-label="Close Viewer"
          >
            <X size={24} />
          </button>
        </div>

        {/* 3D CANVAS */}
        <div className="flex-1 w-full bg-[#030712] relative z-0">
          <Suspense fallback={
            <div className="w-full h-full flex flex-col items-center justify-center text-neon font-data">
              <Loader2 className="animate-spin mb-4" size={40} />
              INITIALIZING TACTICAL 3D ENGINE...
            </div>
          }>
            <Drone3DViewer drone={drone} dataMode={dataMode} />
          </Suspense>
        </div>

        {/* BOTTOM LEFT: Data Block (Only in Data Mode) */}
        {dataMode && (
          <div className="absolute bottom-6 left-6 z-10 pointer-events-none animate-in slide-in-from-left-4 fade-in duration-500">
            <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-5 w-64 shadow-2xl">
              <h3 className="font-heading text-sm text-neon mb-4 uppercase tracking-widest flex items-center gap-2">
                <Activity size={16} /> Operational Specs
              </h3>
              <div className="space-y-4 font-data">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-textMuted text-[10px] uppercase">Range</span>
                  <span className="text-white text-sm">{drone.specs?.range_km} <span className="text-white/50 text-xs">km</span></span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-textMuted text-[10px] uppercase">Payload</span>
                  <span className="text-warning text-sm">{drone.specs?.payload_kg} <span className="text-white/50 text-xs">kg</span></span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-textMuted text-[10px] uppercase">Speed</span>
                  <span className="text-white text-sm">{drone.specs?.speed_kmh} <span className="text-white/50 text-xs">km/h</span></span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-textMuted text-[10px] uppercase">Endurance</span>
                  <span className="text-white text-sm">{drone.specs?.endurance_hr} <span className="text-white/50 text-xs">hrs</span></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM RIGHT: Integration Action Buttons (Only in Data Mode) */}
        {dataMode && (
          <div className="absolute bottom-6 right-6 z-20 pointer-events-auto flex flex-col gap-3 animate-in slide-in-from-right-4 fade-in duration-500">
            <button 
              onClick={() => { onClose(); navigate('/compare'); }}
              className="flex items-center justify-between gap-4 w-52 bg-panel/80 hover:bg-neon/10 backdrop-blur-md border border-white/10 hover:border-neon/50 px-4 py-3 rounded transition-all text-left group"
            >
              <div className="flex items-center gap-3 text-sm font-heading group-hover:text-neon transition-colors">
                <Scale size={16} className="text-textMuted group-hover:text-neon" /> Compare Platform
              </div>
            </button>
            
            <button 
              onClick={() => { onClose(); navigate('/counters'); }}
              className="flex items-center justify-between gap-4 w-52 bg-panel/80 hover:bg-success/10 backdrop-blur-md border border-white/10 hover:border-success/50 px-4 py-3 rounded transition-all text-left group"
            >
              <div className="flex items-center gap-3 text-sm font-heading group-hover:text-success transition-colors">
                <Shield size={16} className="text-textMuted group-hover:text-success" /> Counter Systems
              </div>
            </button>
            
            <button 
              onClick={() => { onClose(); navigate('/simulation'); }}
              className="flex items-center justify-between gap-4 w-52 bg-danger/10 hover:bg-danger/20 backdrop-blur-md border border-danger/30 hover:border-danger px-4 py-3 rounded transition-all text-left group"
            >
              <div className="flex items-center gap-3 text-sm font-heading text-danger">
                <Activity size={16} /> Run Threat Sim
              </div>
            </button>
          </div>
        )}

        {/* BOTTOM CENTER: Helper Info (Only in Hologram mode) */}
        {!dataMode && (
          <div className="absolute bottom-6 w-full text-center pointer-events-none z-10 animate-in fade-in duration-500">
            <span className="font-data text-xs tracking-widest uppercase text-textMuted bg-black/40 px-4 py-2 rounded-full border border-white/5 backdrop-blur-sm">
              Left Click: Rotate • Scroll: Zoom • Right Click: Pan
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
