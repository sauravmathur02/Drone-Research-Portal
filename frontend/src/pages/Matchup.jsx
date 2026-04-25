import React, { useEffect, useState, Suspense, useMemo } from 'react';
import { getDrones, getCounterSystems } from '../services/api';
import { generateIntelligentReport } from '../utils/MatchupAnalyst';
import { Crosshair, Shield, Zap, Target, AlertTriangle, Loader2, Gauge, Brain, ChevronRight, Binary } from 'lucide-react';
import DroneCard from '../components/DroneCard';

const Drone3DViewer = React.lazy(() => import('../components/Drone3DViewer'));
const Counter3DViewer = React.lazy(() => import('../components/Counter3DViewer'));

export default function Matchup() {
  const [drones, setDrones] = useState([]);
  const [counters, setCounters] = useState([]);
  const [selectedDrone, setSelectedDrone] = useState(null);
  const [selectedCounter, setSelectedCounter] = useState(null);
  const [scenario, setScenario] = useState('Clear');

  useEffect(() => {
    getDrones().then(setDrones).catch(console.error);
    getCounterSystems().then(setCounters).catch(console.error);
  }, []);
  const report = useMemo(() => {
    if (selectedDrone && selectedCounter) {
      return generateIntelligentReport(selectedDrone, selectedCounter, scenario, counters);
    }
    return null;
  }, [selectedDrone, selectedCounter, scenario, counters]);

  const pk = report?.scenarioPk || 0;
  const verdictColor = pk >= 40 ? 'text-success' : pk >= 20 ? 'text-warning' : 'text-danger';

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar pb-6 pr-4">
      {/* Scenario Selector */}
      <div className="glass-card flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <Brain className="text-neon" size={20} />
          <h2 className="font-heading text-sm uppercase tracking-widest text-white">Analysis Scenario</h2>
        </div>
        <div className="flex gap-2 text-neon">
          {['Clear', 'Urban', 'Desert', 'Night', 'High-Jamming'].map(s => (
            <button 
              key={s} 
              onClick={() => setScenario(s)}
              className={`px-3 py-1.5 rounded font-data text-[10px] uppercase transition-all ${
                scenario === s ? 'bg-neon text-black font-bold' : 'bg-white/5 text-textMuted hover:bg-white/10 border border-white/5'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Attacker Panel */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-danger font-heading text-xs uppercase tracking-widest bg-danger/10 border border-danger/30 p-2 rounded">
            <Target size={16} /> Attacker Platform
          </div>
          <select
            className="bg-black/40 border border-danger/30 text-white p-3 rounded font-data text-xs outline-none focus:border-danger"
            value={selectedDrone?._id || ''}
            onChange={e => setSelectedDrone(drones.find(d => d._id === e.target.value))}
          >
            <option value="">Choose drone…</option>
            {drones.map(d => <option key={d._id} value={d._id}>{d.name} ({d.type})</option>)}
          </select>
          
          <div className="relative mt-2 h-full">
            {selectedDrone ? (
              <DroneCard drone={selectedDrone} index={0} />
            ) : (
              <div className="min-h-[420px] h-full border border-white/5 border-dashed rounded-xl flex flex-col items-center justify-center text-textMuted opacity-20">
                <div className="text-[10px] uppercase font-heading tracking-widest">Awaiting Selection</div>
              </div>
            )}
          </div>
        </div>

        {/* Defender Panel */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-neon font-heading text-xs uppercase tracking-widest bg-neon/10 border border-neon/30 p-2 rounded">
            <Shield size={16} /> Counter-Measure
          </div>
          <select
            className="bg-black/40 border border-neon/30 text-white p-3 rounded font-data text-xs outline-none focus:border-neon"
            value={selectedCounter?._id || ''}
            onChange={e => setSelectedCounter(counters.find(c => c._id === e.target.value))}
          >
            <option value="">Choose counter-system…</option>
            {counters.map(c => <option key={c._id} value={c._id}>{c.name} ({c.type})</option>)}
          </select>
          
          <div className="relative mt-2 h-full">
            {selectedCounter ? (
              <div className="flex flex-col overflow-hidden rounded-xl border border-white/5 bg-panel/50 w-full min-h-[420px] transition-all duration-300">
                {/* Fixed height 220px image/model container */}
                <div className="h-[220px] w-full overflow-hidden relative shrink-0 bg-gradient-to-b from-[#0a0e14] to-black flex items-center justify-center p-4">
                  <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-neon/30" size={24} /></div>}>
                    <Counter3DViewer system={selectedCounter} mini={true} />
                  </Suspense>
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 z-10 pointer-events-none"></div>
                  {/* Type Badge */}
                  <span className="absolute top-3 right-3 text-[9px] px-2.5 py-1 uppercase font-heading tracking-wider border rounded-full z-30 shadow-[0_0_8px_rgba(0,255,255,0.1)] text-[#00ffff]/90 bg-black/60 backdrop-blur-md border-[#00ffff]/30">
                    COUNTER-MEASURE
                  </span>
                </div>
                
                {/* Info Section */}
                <div className="p-5 flex flex-col flex-grow relative z-30 bg-gradient-to-b from-[#0a0f18] to-panel gap-4">
                  <div className="flex flex-col gap-1 w-full">
                    <h4 className="text-lg font-heading font-semibold text-white drop-shadow-lg line-clamp-2 leading-snug w-full block">
                      {selectedCounter.name}
                    </h4>
                    <div className="text-[10px] font-data text-white/80 flex items-center gap-2 uppercase tracking-[0.2em] shrink-0 mt-1">
                      <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-neon shadow-[0_0_8px_rgba(0,255,255,0.9)]"></span>
                      <span className="truncate">{selectedCounter.type}</span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mt-auto">
                    <div className="bg-black/40 rounded border border-white/5 px-3 py-2">
                      <div className="flex items-center gap-1.5 text-[8px] text-white/40 uppercase mb-1 font-heading tracking-widest">
                        <Crosshair size={10} className="text-[#00ffff]/50" /> 
                        <span>Range</span>
                      </div>
                      <div className="text-[12px] font-data tracking-wide font-bold text-white/90">
                        {selectedCounter.range_km} km
                      </div>
                    </div>
                    <div className="bg-black/40 rounded border border-white/5 px-3 py-2">
                      <div className="flex items-center gap-1.5 text-[8px] text-white/40 uppercase mb-1 font-heading tracking-widest">
                        <Shield size={10} className="text-[#00ffff]/50" /> 
                        <span>Effectiveness</span>
                      </div>
                      <div className={`text-[12px] font-data tracking-wide font-bold drop-shadow-md ${selectedCounter.effectiveness === 'High' ? 'text-success' : selectedCounter.effectiveness === 'Medium' ? 'text-warning' : 'text-danger'}`}>
                        {selectedCounter.effectiveness}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="min-h-[420px] h-full border border-white/5 border-dashed rounded-xl flex flex-col items-center justify-center text-textMuted opacity-20">
                <div className="text-[10px] uppercase font-heading tracking-widest">Awaiting Selection</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verdict Panel */}
      {report && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="glass-card bg-gradient-to-br from-panel/90 to-black/40">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
              {/* Pk Gauge */}
              <div className="flex-1 flex flex-col items-center gap-3">
                <div className="font-heading text-[10px] text-textMuted uppercase tracking-widest">Engagement Pk ({scenario})</div>
                <div className={`text-6xl font-data drop-shadow-[0_0_20px_rgba(0,243,255,0.5)] ${verdictColor}`}>{pk}%</div>
                <div className="w-full max-w-xs h-1.5 bg-black/50 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 rounded-full ${pk >= 55 ? 'bg-success' : pk >= 25 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${pk}%` }}></div>
                </div>
              </div>

              {/* Verdict */}
              <div className="flex-1 flex flex-col items-center gap-3 border-x border-white/5 px-8">
                <div className="font-heading text-[10px] text-textMuted uppercase tracking-widest">Strategic Verdict</div>
                <div className={`text-2xl font-heading tracking-[0.2em] text-center ${verdictColor}`}>
                  {report.verdict?.replace(/_/g, ' ')}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-data text-white/60 text-center italic">
                  "{report.scenarioDetails}"
                </div>
              </div>

              {/* Confidence */}
              <div className="flex-1 flex flex-col items-center gap-3">
                <div className="font-heading text-[10px] text-textMuted uppercase tracking-widest">Data Confidence</div>
                <div className="text-4xl font-data text-white flex items-center gap-2">
                  <Gauge size={24} className="text-neon" />
                  {report.confidenceScore}%
                </div>
                <div className="text-[9px] font-data text-textMuted uppercase tracking-widest">
                  {report.confidenceScore >= 75 ? 'High reliability' : report.confidenceScore >= 50 ? 'Moderate — missing fields' : 'Low — incomplete data'}
                </div>
              </div>
            </div>

            {/* Factor Decomposition */}
            {report.factors && (
              <div className="pt-6 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-neon font-heading text-[10px] uppercase tracking-widest">
                    <Binary size={14} /> Factor Decomposition
                  </div>
                  {report.sensitivity && (
                    <div className="text-[9px] font-data text-textMuted bg-white/5 px-2 py-1 rounded border border-white/5">
                      Key Factor: <span className="text-neon font-bold">{report.sensitivity.most_important?.replace(/_/g, ' ')}</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {Object.entries(report.factors).map(([key, f]) => (
                    <div key={key} className="bg-black/30 border border-white/5 p-3 rounded space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-heading uppercase text-textMuted tracking-wider">{key.replace(/_/g, ' ')}</span>
                        <span className={`text-xs font-data font-bold ${f.value >= 0 ? 'text-success' : 'text-danger'}`}>
                          {f.value >= 0 ? '+' : ''}{f.value}
                        </span>
                      </div>
                      <div className="w-full h-1 bg-black/50 rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 flex">
                          <div className="w-1/2"></div>
                          {f.value >= 0 ? (
                            <div className="bg-success/70 h-full rounded-r-full transition-all" style={{ width: `${Math.min(100, Math.abs(f.value) * 3.5)}%` }}></div>
                          ) : (
                            <div></div>
                          )}
                        </div>
                        {f.value < 0 && (
                          <div className="absolute inset-0 flex justify-end">
                            <div className="w-1/2 flex justify-end">
                              <div className="bg-danger/70 h-full rounded-l-full transition-all" style={{ width: `${Math.min(100, Math.abs(f.value) * 3.5)}%` }}></div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-[8px] font-data text-white/40">
                        Favors: <span className={f.favors === 'counter' ? 'text-neon' : 'text-danger'}>{f.favors}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tactical Reasoning + Vulnerabilities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 mt-6 border-t border-white/5">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-neon font-heading text-[10px] uppercase tracking-widest">
                  <Zap size={14} /> Reasoning Chain
                </div>
                <ul className="space-y-3 font-data text-xs text-white/80">
                  {report.reasoning.map((r, i) => (
                    <li key={i} className="flex gap-3 items-start bg-white/5 p-3 rounded border border-white/5">
                      <ChevronRight size={14} className="text-neon shrink-0 mt-0.5" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-warning font-heading text-[10px] uppercase tracking-widest">
                  <AlertTriangle size={14} /> Detected Vulnerabilities
                </div>
                <div className="space-y-3">
                  {report.vulnerabilities.drone.map((v, i) => (
                    <div key={`d${i}`} className="bg-danger/5 border border-danger/20 p-3 rounded flex gap-3 text-xs font-data">
                      <span className="text-danger font-bold uppercase shrink-0 mt-0.5">Drone</span>
                      <span className="text-white/70">{v}</span>
                    </div>
                  ))}
                  {report.vulnerabilities.counter.map((v, i) => (
                    <div key={`c${i}`} className="bg-neon/5 border border-neon/20 p-3 rounded flex gap-3 text-xs font-data">
                      <span className="text-neon font-bold uppercase shrink-0 mt-0.5">Counter</span>
                      <span className="text-white/70">{v}</span>
                    </div>
                  ))}
                  {report.vulnerabilities.drone.length === 0 && report.vulnerabilities.counter.length === 0 && (
                    <div className="text-textMuted text-xs font-data italic">No critical vulnerabilities detected at current data confidence.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Expert Recommendations */}
          {report.bestAlternative && report.scenarioPk < 55 && (
            <div className="glass-card border-neon/30 bg-neon/5 animate-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-neon font-heading text-xs uppercase tracking-widest">
                  <Brain size={18} /> Tactical Recommendation
                </div>
                <div className="bg-neon text-black px-2 py-1 rounded text-[9px] font-bold">OPTIMAL COUNTER</div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <div className="text-white font-heading text-lg tracking-wider">{report.bestAlternative.name}</div>
                  <div className="text-textMuted font-data text-[10px] uppercase tracking-[0.2em]">{report.bestAlternative.type} SYSTEM</div>
                </div>
                <div className="text-right">
                  <div className="text-neon font-data text-2xl font-bold">~{report.bestAlternative.pk_estimate || report.bestAlternative.totalScore || '?'}% Pk</div>
                  <div className="text-[9px] font-data text-textMuted uppercase">Predicted for this drone</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!selectedDrone && !selectedCounter && (
        <div className="glass-card flex-1 flex flex-col items-center justify-center gap-4 text-textMuted text-center">
          <Crosshair size={48} strokeWidth={1} className="text-neon/30" />
          <div className="font-heading text-lg uppercase tracking-widest">Drone vs Counter Matchup</div>
          <p className="font-data text-xs max-w-md">Select an attacking drone and a defensive counter-system above to generate a head-to-head tactical analysis with probability of kill calculations.</p>
        </div>
      )}
    </div>
  );
}
