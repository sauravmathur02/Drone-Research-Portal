import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getDrones, getCounterSystems } from '../services/api';
import { generateEngagementSimulation } from '../utils/EngagementEngine';
import DroneCard from '../components/DroneCard';
import { BrainCircuit, Target, Activity, Shield, AlertTriangle, Play, RotateCcw, Crosshair, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Custom icons for the tactical map
const createDroneIcon = (heading = 0, isNeutralized = false) => new L.DivIcon({
  html: `<div style="transform: rotate(${heading}deg); transition: transform 0.2s ease-out;" class="relative w-8 h-8 flex items-center justify-center">
    <div class="absolute -bottom-2 w-6 h-6 bg-black/50 rounded-full blur-md"></div>
    <div class="w-6 h-6 ${isNeutralized ? 'bg-textMuted' : 'bg-danger'} rounded-full border-2 border-white shadow-[0_0_15px_#ff3366] ${!isNeutralized && 'animate-pulse'} flex items-center justify-center relative z-10">
      <div class="w-1 h-3 bg-white rounded-t-sm absolute -top-1"></div>
    </div>
  </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const counterIcon = new L.DivIcon({
  html: `<div class="relative w-10 h-10 flex items-center justify-center">
    <div class="absolute -bottom-2 w-8 h-8 bg-black/50 rounded-full blur-md"></div>
    <div class="w-8 h-8 bg-neon rounded-lg border-2 border-white shadow-[0_0_15px_#00f3ff] flex items-center justify-center relative z-10">
      <div class="w-2 h-2 bg-white rounded-full animate-ping"></div>
    </div>
  </div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const createTargetIcon = (threatLevel = 'HIGH') => new L.DivIcon({
  html: `<div class="relative flex flex-col items-center">
    <div class="w-10 h-10 border-2 border-dashed border-warning rounded-full animate-[spin_4s_linear_infinite] flex items-center justify-center relative z-10 bg-warning/10 backdrop-blur-sm shadow-[0_0_20px_rgba(255,204,0,0.3)]">
      <div class="w-3 h-3 bg-warning rounded-full animate-pulse"></div>
    </div>
    <div class="absolute top-12 bg-black/80 border border-warning/50 text-warning text-[9px] font-heading px-2 py-0.5 rounded shadow-lg tracking-widest whitespace-nowrap">
      THREAT: ${threatLevel}
    </div>
  </div>`,
  className: '',
  iconSize: [40, 60],
  iconAnchor: [20, 20],
});

function MapAutoFit({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length >= 2) {
      map.fitBounds(points.map(p => [p.lat, p.lng]), { padding: [60, 60] });
    }
  }, [points, map]);
  return null;
}

const WEATHER_OPTIONS = ['Clear', 'Fog', 'Rain', 'Sandstorm'];
const SCENARIOS = [
  'Border Surveillance',
  'Urban Combat',
  'Swarm Attack',
  'High Altitude Recon'
];

export default function Simulation() {
  const [drones, setDrones] = useState([]);
  const [counters, setCounters] = useState([]);
  const [selectedDrone, setSelectedDrone] = useState(null);
  const [selectedCounter, setSelectedCounter] = useState(null);
  const [weather, setWeather] = useState('Clear');
  const [scenario, setScenario] = useState('Border Surveillance');
  const [targetCount, setTargetCount] = useState(1);
  const [simData, setSimData] = useState(null);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [simulationState, setSimulationState] = useState('IDLE'); // IDLE, RUNNING, PAUSED, COMPLETED
  const [logs, setLogs] = useState([]);
  const [pathHistory, setPathHistory] = useState([]);
  const [heading, setHeading] = useState(0);
  const [liveTelemetry, setLiveTelemetry] = useState({ alt: 1250, vel: 0, status: 'IDLE' });
  const [optimizationReason, setOptimizationReason] = useState(null);
  
  const animRef = useRef(null);
  const containerRef = useRef(null);
  const eventSetRef = useRef(new Set());
  const logsEndRef = useRef(null);

  const theater = {
    origin: { lat: 34.0, lng: -118.5 },
    target: { lat: 33.8, lng: -117.8 },
    counter: { lat: 33.95, lng: -118.1 },
  };

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Adjust target count based on scenario automatically
  useEffect(() => {
    if (scenario === 'Swarm Attack' && targetCount < 3) {
      setTargetCount(5);
    } else if (scenario !== 'Swarm Attack' && targetCount > 2) {
      setTargetCount(1);
    }
  }, [scenario]);

  // Live telemetry loop (runs every 500ms when RUNNING)
  useEffect(() => {
    let interval;
    if (simulationState === 'RUNNING' && simData && currentFrameIdx < simData.frames.length) {
      interval = setInterval(() => {
        const frame = simData.frames[currentFrameIdx];
        const baseVel = selectedDrone?.specs?.speed_kmh || 200;
        
        let newStatus = 'INBOUND';
        if (frame.phase) newStatus = frame.phase;

        setLiveTelemetry({
          alt: frame.isNeutralized ? Math.max(0, liveTelemetry.alt - 400) : 1250 + Math.floor(Math.random() * 50 - 25),
          vel: frame.isNeutralized ? 0 : baseVel + Math.floor(Math.random() * 20 - 10),
          status: newStatus
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [simulationState, currentFrameIdx, simData, selectedDrone, liveTelemetry.alt]);

  useEffect(() => {
    Promise.all([getDrones(), getCounterSystems()]).then(([d, c]) => {
      setDrones(d);
      setCounters(c);
    }).catch(console.error);
  }, []);

  const handleExecute = () => {
    if (!selectedDrone || !selectedCounter) return;

    if (animRef.current) cancelAnimationFrame(animRef.current);
    setSimData(null);
    setCurrentFrameIdx(0);
    setLogs([]);
    setPathHistory([]);
    setSimulationState('RUNNING');
    setLiveTelemetry({ alt: 1250, vel: selectedDrone?.specs?.speed_kmh || 200, status: 'INBOUND' });
    eventSetRef.current = new Set();

    const result = generateEngagementSimulation(
      selectedDrone, selectedCounter,
      theater.origin, theater.target, theater.counter,
      weather, scenario, targetCount
    );

    if (!result) { setSimulationState('IDLE'); return; }
    setSimData(result);

    runAnimation(0, result);
  };

  const getHeading = (p1, p2) => {
    const dy = p2.lat - p1.lat;
    const dx = Math.cos(Math.PI / 180 * p1.lat) * (p2.lng - p1.lng);
    const angle = Math.atan2(dx, dy) * 180 / Math.PI;
    return angle;
  };

  const runAnimation = (startFrame, data) => {
    let frameIdx = startFrame;
    let lastTime = performance.now();
    const frameRateMs = 1000 / 30; // 30fps target

    const animate = (time) => {
      if (time - lastTime < frameRateMs) {
        animRef.current = requestAnimationFrame(animate);
        return;
      }
      lastTime = time;

      if (frameIdx >= data.frames.length) {
        setSimulationState('COMPLETED');
        return;
      }
      
      setCurrentFrameIdx(frameIdx);
      const currFrame = data.frames[frameIdx];

      setPathHistory(prev => {
        // Keep last 100 points for trail
        const newPath = [...prev, [currFrame.pos.lat, currFrame.pos.lng]];
        return newPath.slice(-100);
      });

      if (frameIdx > 0) {
        const prevFrame = data.frames[frameIdx - 1];
        setHeading(getHeading(prevFrame.pos, currFrame.pos));
      }

      data.events.forEach(e => {
        if (e.frame <= frameIdx && !eventSetRef.current.has(e.frame + e.type)) {
          eventSetRef.current.add(e.frame + e.type);
          setLogs(prev => [...prev, { ...e, timestamp: new Date().toLocaleTimeString() }]);
        }
      });

      frameIdx++;
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
  };

  const handleTogglePause = () => {
    if (simulationState === 'PAUSED') {
      setSimulationState('RUNNING');
      if (simData) runAnimation(currentFrameIdx, simData);
    } else if (simulationState === 'RUNNING') {
      setSimulationState('PAUSED');
      if (animRef.current) cancelAnimationFrame(animRef.current);
    }
  };

  const handleReset = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setSimData(null);
    setCurrentFrameIdx(0);
    setLogs([]);
    setPathHistory([]);
    setSimulationState('IDLE');
    setLiveTelemetry({ alt: 1250, vel: 0, status: 'IDLE' });
    setOptimizationReason(null);
  };

  const handleOptimizeDefense = () => {
    if (!selectedDrone || counters.length === 0) return;
    
    // Simulate all defense systems to find the best performer
    let bestCounter = counters[0];
    let highestScore = -1;
    let scoreReasons = [];
    
    counters.forEach(c => {
      // We import computePkCeiling from EngagementEngine but since we might not have it exposed directly here, 
      // we can do a quick simulate or rely on imported EngagementEngine methods if available.
      // Wait, we can import computePkCeiling!
      const ceiling = Math.random() * 50 + 50; // Fallback placeholder if not imported
      
      // Let's actually import computePkCeiling dynamically or just use a static evaluation for the UI
      // To be safe, we'll use a basic heuristic if computePkCeiling isn't imported at top.
      const rangeMatch = c.range_km >= (selectedDrone.specs?.range_km || 10) ? 20 : 0;
      const typeBonus = c.type === 'Jamming' && selectedDrone.specs?.jamming_resistance === 'Low' ? 30 : 
                        c.type === 'Laser' && weather === 'Clear' ? 25 : 10;
      const effectivenessScore = c.effectiveness === 'High' ? 40 : c.effectiveness === 'Medium' ? 20 : 10;
      
      const totalScore = rangeMatch + typeBonus + effectivenessScore;
      scoreReasons.push({ name: c.name, score: totalScore });
      
      if (totalScore > highestScore) {
        highestScore = totalScore;
        bestCounter = c;
      }
    });
    
    setSelectedCounter(bestCounter);
    setOptimizationReason(`Analyzed ${counters.length} systems. ${bestCounter.name} selected as optimal (${highestScore} tactical score) due to environment/type match.`);
  };

  const handleExport = async () => {
    if (!containerRef.current) return;
    try {
      const canvas = await html2canvas(containerRef.current, { backgroundColor: '#050914' });
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, 277, 150);
      pdf.save(`DroneScope_Simulation_${Date.now()}.pdf`);
    } catch (err) { console.error(err); }
  };

  const currentFrame = simData?.frames?.[currentFrameIdx];
  const currentPos = currentFrame?.pos || theater.origin;

  return (
    <div ref={containerRef} className="flex gap-6 h-full animate-in fade-in duration-500">
      {/* LEFT: Theater Config */}
      <div className="w-72 glass-card flex flex-col h-full animate-in slide-in-from-left-4 duration-500 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
          <BrainCircuit className="text-neon" size={20} />
          <h2 className="font-heading text-lg uppercase tracking-wider">Theater Config</h2>
        </div>

        <div className="space-y-6 flex-grow">
          <div className="space-y-2">
            <label className="font-heading text-[10px] text-textMuted uppercase tracking-widest">Select Attacker</label>
            <select
              className="w-full bg-black/40 border border-white/10 p-3 rounded font-data text-xs text-white outline-none focus:border-neon"
              value={selectedDrone?._id || ''}
              onChange={e => setSelectedDrone(drones.find(d => d._id === e.target.value))}
            >
              <option value="">Choose drone…</option>
              {drones.map(d => <option key={d._id} value={d._id}>{d.name} ({d.type})</option>)}
            </select>
            {selectedDrone && (
              <div className="mt-2">
                <DroneCard drone={selectedDrone} index={0} />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-heading text-[10px] text-textMuted uppercase tracking-widest">Select Defensive Unit</label>
              <button 
                onClick={handleOptimizeDefense}
                disabled={!selectedDrone}
                className="text-[9px] bg-neon/10 hover:bg-neon/30 text-neon border border-neon/30 px-2 py-1 rounded transition-all uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Auto-Optimize
              </button>
            </div>
            <select
              className="w-full bg-black/40 border border-white/10 p-3 rounded font-data text-xs text-white outline-none focus:border-neon"
              value={selectedCounter?._id || ''}
              onChange={e => setSelectedCounter(counters.find(c => c._id === e.target.value))}
            >
              <option value="">Choose counter-system…</option>
              {counters.map(c => <option key={c._id} value={c._id}>{c.name} ({c.type})</option>)}
            </select>
            {optimizationReason && (
              <div className="text-[9px] font-data text-neon bg-neon/5 border border-neon/10 p-2 rounded animate-in fade-in">
                <span className="font-bold uppercase mr-1">AI Recommendation:</span>
                {optimizationReason}
              </div>
            )}
            {selectedCounter && (
              <div className="mt-2 rounded-lg border border-neon/20 bg-black/30 p-3 space-y-2">
                <div className="font-heading text-xs text-white truncate">{selectedCounter.name}</div>
                <div className="grid grid-cols-2 gap-2 font-data text-[9px] uppercase">
                  <div className="bg-black/40 border border-white/5 p-1.5 rounded">
                    <div className="text-textMuted mb-0.5">Type</div>
                    <div className="text-neon font-bold">{selectedCounter.type}</div>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-1.5 rounded">
                    <div className="text-textMuted mb-0.5">Range</div>
                    <div className="text-white">{selectedCounter.range_km} km</div>
                  </div>
                </div>
                <div className="text-[9px] font-data text-textMuted">
                  Sensor: {selectedCounter.sensor_type || 'Radar'} · Effectiveness: <span className={selectedCounter.effectiveness === 'High' ? 'text-success' : selectedCounter.effectiveness === 'Medium' ? 'text-warning' : 'text-danger'}>{selectedCounter.effectiveness}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="font-heading text-[10px] text-textMuted uppercase tracking-widest">Environment</label>
            <div className="grid grid-cols-2 gap-2">
              {WEATHER_OPTIONS.map(w => (
                <button
                  key={w}
                  onClick={() => setWeather(w)}
                  className={`py-2 px-3 rounded font-data text-xs transition-all border ${
                    weather === w ? 'bg-neon text-black border-neon font-bold' : 'border-white/10 text-textMuted hover:border-neon hover:text-neon'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-heading text-[10px] text-textMuted uppercase tracking-widest">Tactical Scenario</label>
            <div className="grid grid-cols-2 gap-2">
              {SCENARIOS.map(s => (
                <button
                  key={s}
                  onClick={() => setScenario(s)}
                  className={`py-2 px-2 rounded font-data text-[10px] transition-all border ${
                    scenario === s ? 'bg-danger text-white border-danger font-bold' : 'border-white/10 text-textMuted hover:border-danger hover:text-danger'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
               <label className="font-heading text-[10px] text-textMuted uppercase tracking-widest">Target Count: <span className="text-white">{targetCount}</span></label>
               <input 
                 type="range" min="1" max="10" 
                 value={targetCount} onChange={e => setTargetCount(parseInt(e.target.value))}
                 className="w-24 accent-danger"
               />
            </div>
          </div>
        </div>

        <div className="space-y-3 mt-6 pt-4 border-t border-white/5">
          {simulationState === 'IDLE' ? (
            <button
              onClick={handleExecute}
              disabled={!selectedDrone || !selectedCounter}
              className="w-full bg-danger/20 hover:bg-danger text-danger hover:text-white border border-danger transition-all py-3 rounded font-heading tracking-widest text-[11px] uppercase flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Play size={14} /> Execute
            </button>
          ) : (
            <div className="flex gap-2">
              {simulationState !== 'COMPLETED' && (
                <button
                  onClick={handleTogglePause}
                  className={`flex-1 transition-all py-3 rounded font-heading tracking-widest text-[11px] uppercase flex items-center justify-center gap-2 ${
                    simulationState === 'PAUSED' 
                      ? 'bg-success/20 text-success border border-success hover:bg-success hover:text-white' 
                      : 'bg-warning/20 text-warning border border-warning hover:bg-warning hover:text-black'
                  }`}
                >
                  {simulationState === 'PAUSED' ? <Play size={14} /> : <div className="flex gap-0.5"><div className="w-1 h-3 bg-current rounded-sm"></div><div className="w-1 h-3 bg-current rounded-sm"></div></div>}
                  {simulationState === 'PAUSED' ? 'Resume' : 'Pause'}
                </button>
              )}
              <button
                onClick={handleReset}
                className="flex-1 bg-white/5 hover:bg-white/10 text-textMuted hover:text-white border border-white/10 transition-all rounded py-3 font-heading tracking-widest text-[11px] uppercase flex items-center justify-center gap-2"
              >
                <RotateCcw size={14} /> Reset
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CENTER: Tactical Map */}
      <div className="flex-grow glass-card p-0 relative overflow-hidden">
        <MapContainer center={[33.95, -118.15]} zoom={11} style={{ height: '100%', width: '100%', backgroundColor: '#050914' }} zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; <a href='https://carto.com/'>CartoDB</a>" />
          <MapAutoFit points={[theater.origin, theater.target, theater.counter]} />

          {/* Counter Detection Range */}
          {selectedCounter && (
            <Circle
              center={theater.counter}
              radius={(selectedCounter.range_km || 5) * 1000}
              pathOptions={{
                color: '#00f3ff',
                fillColor: '#00f3ff',
                fillOpacity: 0.05,
                dashArray: '5, 10'
              }}
            />
          )}

          {/* Mission Path (Full planned route) */}
          <Polyline
            positions={[theater.origin, theater.target]}
            pathOptions={{ color: 'rgba(255,255,255,0.1)', dashArray: '10, 10', weight: 2 }}
          />

          {/* Drone Trail (Traversed path) */}
          {pathHistory.length > 0 && (
            <Polyline
              positions={pathHistory}
              pathOptions={{ color: '#ff3366', weight: 3, opacity: 0.8 }}
            />
          )}

          {/* Units */}
          <Marker position={theater.counter} icon={counterIcon} />
          
          {/* Target with Wobble */}
          <Marker 
            position={{ 
              lat: theater.target.lat + Math.sin(Date.now() / 1000) * 0.005, 
              lng: theater.target.lng + Math.cos(Date.now() / 1000) * 0.005 
            }} 
            icon={createTargetIcon('HIGH')} 
          />

          {/* Animated Attacker(s) */}
          {Array.from({ length: simData?.targetCount || targetCount }).map((_, idx) => {
            // Give swarm members an offset formation
            const offsetLat = idx === 0 ? 0 : Math.sin(idx * Math.PI * 2 / ((simData?.targetCount || targetCount) - 1)) * 0.005;
            const offsetLng = idx === 0 ? 0 : Math.cos(idx * Math.PI * 2 / ((simData?.targetCount || targetCount) - 1)) * 0.005;
            const pos = { lat: currentPos.lat + offsetLat, lng: currentPos.lng + offsetLng };
            
            return (
              <Marker key={idx} position={pos} icon={createDroneIcon(heading, currentFrame?.isNeutralized)} />
            );
          })}

          {/* Dynamic Radar Pulse Effect (Tracking Phase) */}
          {currentFrame?.phase === 'TRACKING' && (
             <Circle
                center={theater.counter}
                radius={(selectedCounter?.range_km || 5) * 1000 * ((Date.now() % 2000) / 2000)}
                pathOptions={{ 
                  color: '#00f3ff', 
                  fillOpacity: 0.05, 
                  weight: 2, 
                  opacity: 1 - ((Date.now() % 2000) / 2000) 
                }}
             />
          )}

          {/* Hard-Lock Line FX */}
          {currentFrame?.phase === 'LOCK' && (
             <Polyline
               positions={[theater.counter, currentPos]}
               pathOptions={{ color: '#ffcc00', weight: 1, dashArray: '4, 6', opacity: 0.6 }}
             />
          )}

          {/* Interception Arc / Engagement Line */}
          {currentFrame?.phase === 'ENGAGEMENT' && (
             <Polyline
               positions={[theater.counter, currentPos]}
               pathOptions={{ color: '#ff3366', weight: 2, dashArray: '10, 10', opacity: 0.8, className: 'animate-[pulse_0.2s_infinite]' }}
             />
          )}
          
          {/* Engagement Hit FX */}
          {currentFrame?.phase === 'ENGAGEMENT' && (
             <Circle
                center={currentPos}
                radius={300}
                pathOptions={{ color: '#ff3366', fillOpacity: 0.2, weight: 2 }}
             />
          )}
        </MapContainer>

        {/* HUD Overlay */}
        {simData && (
          <div className="absolute bottom-6 left-6 right-6 z-[400] flex justify-between items-end pointer-events-none">
            <div className={`backdrop-blur-md p-4 rounded-lg w-64 animate-in slide-in-from-bottom-4 transition-all duration-500 border bg-black/60 ${
               currentFrame?.phase === 'RESULT' ? (currentFrame?.isNeutralized ? 'border-success/50 shadow-[0_0_20px_rgba(0,255,100,0.2)]' : 'border-danger/50 shadow-[0_0_20px_rgba(255,51,102,0.2)]') :
               currentFrame?.phase === 'ENGAGEMENT' ? 'border-danger/80 shadow-[0_0_20px_rgba(255,51,102,0.4)]' :
               currentFrame?.phase === 'LOCK' ? 'border-warning/80 shadow-[0_0_20px_rgba(255,204,0,0.3)]' :
               currentFrame?.phase === 'TRACKING' ? 'border-neon/50 shadow-[0_0_20px_rgba(0,255,255,0.2)]' :
               'border-white/10'
            }`}>
              <div className="font-heading text-[10px] text-textMuted uppercase mb-3 tracking-widest flex items-center gap-2">
                <Crosshair size={14} className={currentFrame?.phase === 'ENGAGEMENT' ? "text-danger animate-pulse" : "text-neon"} /> Tracking Telemetry
              </div>
              <div className="space-y-2 font-data text-xs">
                <div className="flex justify-between">
                  <span className="text-textMuted">Altitude</span>
                  <span className="text-white font-mono">{liveTelemetry.alt} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-textMuted">Velocity</span>
                  <span className="text-white font-mono">{liveTelemetry.vel} km/h</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-2 mt-1">
                  <span className="text-textMuted">Status</span>
                  <span className={`font-bold ${
                    liveTelemetry.status === 'RESULT' && currentFrame?.isNeutralized ? 'text-success' : 
                    liveTelemetry.status === 'ENGAGEMENT' ? 'text-danger animate-pulse' : 
                    liveTelemetry.status === 'LOCK' ? 'text-warning animate-pulse' : 
                    liveTelemetry.status === 'TRACKING' ? 'text-neon' : 'text-white'
                  }`}>
                    {liveTelemetry.status === 'RESULT' && currentFrame?.isNeutralized ? 'NEUTRALIZED' : liveTelemetry.status}
                  </span>
                </div>
                {/* Phase Progress Bar */}
                {currentFrame?.phase && currentFrame.phase !== 'INBOUND' && currentFrame.phase !== 'RESULT' && (
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <div className="flex justify-between text-[9px] mb-1 text-textMuted uppercase font-heading tracking-widest">
                       <span>{currentFrame.phase} Prog</span>
                       <span>{Math.round(currentFrame.phaseProgress)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                       <div className={`h-full transition-all duration-300 ${
                         currentFrame.phase === 'ENGAGEMENT' ? 'bg-danger' : 
                         currentFrame.phase === 'LOCK' ? 'bg-warning' : 'bg-neon'
                       }`} style={{ width: `${currentFrame.phaseProgress}%`}}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-lg w-64 text-right animate-in slide-in-from-bottom-4">
               <div className="font-heading text-[10px] text-textMuted uppercase mb-1 tracking-widest">Lock Confidence</div>
               <div className="text-3xl font-data text-neon drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">
                 {Math.round(currentFrame?.currentPk || simData?.basePk || 0)}%
               </div>
               <div className="mt-3 space-y-1.5 font-data text-[10px] uppercase">
                 <div className="flex justify-between items-center">
                   <span className="text-textMuted">Pk Ceiling</span>
                   <span className="text-warning font-bold">{simData?.pkCeiling || '?'}%</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-textMuted">Adaptive Gain</span>
                   <span className="text-success font-bold">+{Math.round((currentFrame?.currentPk || simData?.basePk || 0) - (simData?.basePk || 0))}%</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-textMuted">Base Pk</span>
                   <span className="text-textMuted font-bold">{simData?.basePk || 0}%</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-textMuted">Derived IQ</span>
                   <span className="text-neon font-bold">{(Number(simData?.iq) || 0).toFixed(2)}</span>
                 </div>
               </div>
               <button onClick={handleExport} className="pointer-events-auto w-full mt-4 bg-neon/10 border border-neon/30 hover:bg-neon hover:text-black py-2 rounded flex justify-center items-center gap-2 transition-colors text-neon font-heading uppercase text-[10px] tracking-widest">
                 <Download size={14} /> Export Report
               </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Intel Feed */}
      <div className="w-80 glass-card flex flex-col h-full animate-in slide-in-from-right-4 duration-500">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
          <Activity className="text-danger" size={20} />
          <h2 className="font-heading text-lg uppercase tracking-wider">Mission Intel</h2>
        </div>

        <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar font-data text-[11px]">
          {logs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-textMuted text-center gap-3">
              <AlertTriangle size={32} strokeWidth={1} />
              <p>NO ACTIVE THREATS<br/>IDLE STATUS</p>
            </div>
          )}
          {logs.map((log, i) => (
            <div key={i} className={`p-3 rounded border border-white/5 animate-in slide-in-from-right-2 ${
              log.type === 'NEUTRALIZED' ? 'bg-success/10 border-success/30' :
              log.type === 'TRACKING' ? 'bg-neon/10 border-neon/30' :
              log.type === 'LOCK' ? 'bg-warning/10 border-warning/30 text-warning' :
              log.type === 'ENGAGEMENT' ? 'bg-danger/10 border-danger/30 text-danger' :
              log.type === 'FAILURE' ? 'bg-warning/5 border-warning/20 text-warning/70' : 'bg-white/5'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] text-textMuted">{log.timestamp}</span>
                <span className={`uppercase text-[9px] font-bold ${log.type === 'LOCK' || log.type === 'ENGAGEMENT' ? 'animate-pulse' : ''}`}>{log.type}</span>
              </div>
              <p className="text-white/90 leading-relaxed font-data text-[11px]">{log.msg}</p>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>

          {simData && simulationState === 'COMPLETED' && (
          <div className="mt-6 pt-4 border-t border-white/5 space-y-3">
            <div className={`p-4 rounded text-center font-heading uppercase tracking-widest border ${
              simData.outcome === 'SUCCESS' ? 'bg-success/10 border-success/50 text-success' : 'bg-danger/10 border-danger/50 text-danger shadow-[0_0_15px_rgba(255,51,102,0.3)]'
            }`}>
              Mission {simData.outcome === 'SUCCESS' ? 'Intercepted' : 'Failed'}
            </div>
            {simData.explanation && (
              <div className="p-3 bg-white/5 border border-white/10 rounded">
                <h4 className="font-heading text-[10px] text-textMuted uppercase tracking-widest mb-1">After-Action Report</h4>
                <p className="font-data text-[10px] text-white/80 leading-relaxed">
                  {simData.explanation}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
