import React, { useState, Suspense, useEffect } from 'react';
import { Shield, Zap, Crosshair, Gauge, Activity, Brain, Server, ShieldAlert, ChevronRight, Binary, Scale, Bookmark, Box, Target, Check } from 'lucide-react';
import Drone3DModal from './Drone3DModal';

export default function DroneIntelligencePanel({ drone }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [show3DModal, setShow3DModal] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (drone) {
      const saved = JSON.parse(localStorage.getItem('bookmarkedDrones') || '[]');
      setIsBookmarked(saved.includes(drone._id));
      
      const comparing = JSON.parse(localStorage.getItem('compareDrones') || '[]');
      setIsComparing(comparing.includes(drone._id));
    }
  }, [drone]);
  
  if (!drone) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 text-white/30 border border-white/5 border-dashed rounded-2xl bg-black/20 animate-in fade-in duration-500">
        <Server size={48} className="mb-4 opacity-30" strokeWidth={1} />
        <h3 className="font-heading text-lg tracking-widest uppercase">Select a drone to view intelligence</h3>
        <p className="font-data text-xs mt-2 max-w-xs leading-relaxed opacity-50">Choose a platform from the registry to view its capabilities and tactical analysis.</p>
      </div>
    );
  }

  const toggleBookmark = () => {
    let saved = JSON.parse(localStorage.getItem('bookmarkedDrones') || '[]');
    if (isBookmarked) {
      saved = saved.filter(id => id !== drone._id);
    } else {
      saved.push(drone._id);
    }
    localStorage.setItem('bookmarkedDrones', JSON.stringify(saved));
    setIsBookmarked(!isBookmarked);
    showToast(!isBookmarked ? 'Drone saved ✔' : 'Removed from saved');
    window.dispatchEvent(new Event('bookmarkUpdated'));
  };

  const toggleCompare = () => {
    let comparing = JSON.parse(localStorage.getItem('compareDrones') || '[]');
    if (isComparing) {
      comparing = comparing.filter(id => id !== drone._id);
    } else {
      if (comparing.length >= 3) {
        alert('Maximum of 3 drones can be compared at once.');
        return;
      }
      if (!comparing.includes(drone._id)) {
        comparing.push(drone._id);
      }
    }
    localStorage.setItem('compareDrones', JSON.stringify(comparing));
    setIsComparing(!isComparing);
    showToast(!isComparing ? 'Added to compare' : 'Removed from compare');
    window.dispatchEvent(new Event('compareUpdated'));
  };

  const isQuantum = drone.type === 'QUANTUM';
  const fallbackImage = "/images/default-drone.jpg";
  const droneImage = drone.image || drone.photo_url || fallbackImage;

  // Simple heuristic for analysis
  const speed = drone.specs?.speed_kmh || 0;
  const range = drone.specs?.range_km || 0;
  const payload = drone.specs?.payload_kg || 0;

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'capabilities', label: 'Capabilities' },
    { id: 'analysis', label: 'AI Analysis' },
    { id: 'matchup', label: 'Matchup' }
  ];

  return (
    <div key={drone._id} className="h-full flex flex-col bg-panel/40 border border-white/5 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md animate-in fade-in duration-300">
      {/* Header Profile */}
      <div className="relative h-64 shrink-0 bg-gradient-to-br from-black/80 to-black overflow-hidden border-b border-white/10 group flex items-center p-6 gap-6">
        
        {/* Left Side: Text Info */}
        <div className="flex flex-col z-20 w-[55%] h-full justify-center space-y-4 pr-4">
          {/* Action Buttons */}
          <div className="flex gap-2 mb-2">
             <button 
               onClick={toggleCompare}
               className={`px-3 py-2 rounded transition-all shadow-sm flex items-center gap-2 font-heading text-[10px] uppercase tracking-widest active:scale-95 ${isComparing ? 'bg-neon/20 border border-neon text-neon' : 'bg-white/5 hover:bg-neon/10 border border-white/10 hover:border-neon text-white/70 hover:text-neon'}`} 
               title={isComparing ? "Remove from comparison" : "Add to comparison tool"}
             >
               {isComparing ? <Check size={14} className="animate-in zoom-in duration-200" /> : <Scale size={14} />} {isComparing ? 'Added' : 'Compare'}
             </button>
             <button 
               onClick={toggleBookmark}
               className={`px-3 py-2 rounded transition-all shadow-sm flex items-center gap-2 font-heading text-[10px] uppercase tracking-widest active:scale-95 ${isBookmarked ? 'bg-warning/20 border border-warning text-warning' : 'bg-white/5 hover:bg-warning/10 border border-white/10 hover:border-warning text-white/70 hover:text-warning'}`} 
               title={isBookmarked ? "Remove bookmark" : "Save this drone for later"}
             >
               <Bookmark size={14} className={isBookmarked ? "fill-warning animate-in zoom-in duration-200" : ""} /> {isBookmarked ? 'Saved' : 'Save'}
             </button>
             <button 
               onClick={() => setShow3DModal(true)}
               disabled={!drone.model_url}
               className={`px-3 py-2 rounded transition-all flex items-center gap-2 font-heading text-[10px] uppercase tracking-widest shadow-sm active:scale-95 ${drone.model_url ? 'bg-neon/10 hover:bg-neon/30 border border-neon/30 hover:border-neon text-neon cursor-pointer' : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed opacity-50'}`}
               title={drone.model_url ? "Launch 3D Hologram Viewer" : "No 3D Model available for this platform"}
             >
               <Box size={14} /> View 3D
             </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-white/10 backdrop-blur-sm border border-white/20 px-2 py-0.5 rounded font-data text-[10px] uppercase tracking-widest text-white">
              {drone.country}
            </span>
            <span className="bg-neon/10 backdrop-blur-sm border border-neon/20 px-2 py-0.5 rounded font-data text-[10px] uppercase tracking-widest text-neon">
              {isQuantum ? 'GRAV-LE' : drone.type}
            </span>
            <span className={`px-2 py-0.5 rounded font-heading font-bold text-[10px] uppercase tracking-widest shadow-sm ${speed > 400 || payload > 1000 ? 'bg-success/20 text-success border border-success/30' : range < 300 ? 'bg-danger/20 text-danger border border-danger/30' : 'bg-warning/20 text-warning border border-warning/30'}`}>
              {speed > 400 || payload > 1000 ? 'SUCCESS' : range < 300 ? 'FAIL' : 'CONTESTED'}
            </span>
          </div>
          <h2 className="font-heading text-5xl lg:text-6xl font-extrabold tracking-tight text-white drop-shadow-xl leading-tight">
            {drone.name}
          </h2>
          <p className="font-body text-sm text-white/60 line-clamp-2 max-w-md">
            {drone.description || `Tactical ${drone.type} class autonomous platform deployed by ${drone.country}.`}
          </p>
        </div>

        {/* Right Side: Large Image */}
        <div className="flex-1 h-full relative rounded-xl border border-white/5 overflow-hidden flex items-center justify-center bg-black/50 group/image">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
          <img 
            src={droneImage} 
            alt={drone.name}
            className="w-full h-full object-cover aspect-video opacity-80 transition-all duration-700 group-hover/image:scale-[1.03] z-10"
            onError={(e) => { e.target.src = fallbackImage; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f18]/80 via-transparent to-transparent z-20 pointer-events-none transition-opacity duration-300"></div>
          <div className="absolute inset-0 border-2 border-transparent group-hover/image:border-[#00ffff]/20 rounded-xl transition-colors duration-500 z-30 pointer-events-none"></div>
          {/* Subtle Glow Behind Image */}
          <div className="absolute inset-0 bg-[#00ffff]/5 blur-3xl rounded-full scale-75 z-0 pointer-events-none group-hover/image:bg-[#00ffff]/10 transition-colors duration-500"></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 border-b border-white/5 shrink-0 bg-black/20 overflow-x-auto custom-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-heading text-xs uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${
              activeTab === tab.id 
                ? 'border-neon text-neon bg-neon/5' 
                : 'border-transparent text-white/40 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-gradient-to-b from-transparent to-black/20">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
            
            {/* KEY INTELLIGENCE SECTION */}
            <div className="space-y-4">
              <h4 className="font-heading text-xs text-white/50 uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2">
                <Brain size={14} className="text-neon" /> Key Intelligence
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/30 p-5 rounded-xl border border-white/5 flex flex-col justify-center transition-all hover:bg-black/40 hover:border-white/10">
                  <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Target size={12}/> Recommended Use Case</div>
                  <div className="text-base font-heading text-white tracking-wide">{range > 1000 ? 'Strategic Long-Range Operations' : 'Tactical Frontline Support'}</div>
                </div>
                
                <div className="bg-black/30 p-5 rounded-xl border border-white/5 flex flex-col justify-center transition-all hover:bg-black/40 hover:border-white/10">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest">Strength Score</div>
                    <div className={`text-sm font-data font-bold ${payload > 500 || speed > 400 ? 'text-success' : 'text-warning'}`}>
                      {payload > 500 ? 92 : speed > 400 ? 88 : 74} <span className="text-[10px] text-white/30 font-normal">/ 100</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${payload > 500 || speed > 400 ? 'bg-success' : 'bg-warning'}`} style={{ width: `${payload > 500 ? 92 : speed > 400 ? 88 : 74}%` }}></div>
                  </div>
                </div>

                <div className="bg-black/30 p-5 rounded-xl border border-white/5 flex flex-col justify-center transition-all hover:bg-black/40 hover:border-white/10">
                  <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1.5 flex items-center gap-1"><ChevronRight size={12} className="text-danger" /> Weakness Highlight</div>
                  <div className="text-sm font-data text-white/80">{speed < 200 ? 'Vulnerable to Kinetic Intercept' : range < 300 ? 'Requires Forward Basing' : 'Significant Radar Cross-Section'}</div>
                </div>

                <div className="bg-black/30 p-5 rounded-xl border border-white/5 flex flex-col justify-center transition-all hover:bg-black/40 hover:border-white/10">
                  <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1.5 flex items-center gap-1"><ShieldAlert size={12} className={speed < 200 ? 'text-danger' : range < 300 ? 'text-warning' : 'text-success'} /> Operational Risk</div>
                  <div className={`text-base font-heading tracking-wide ${speed < 200 ? 'text-danger' : range < 300 ? 'text-warning' : 'text-success'}`}>
                    {speed < 200 ? 'HIGH' : range < 300 ? 'MEDIUM' : 'LOW'}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="space-y-4">
              <h4 className="font-heading text-xs text-white/50 uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2">
                <Server size={14} className="text-white/30" /> Primary Telemetry
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 grid grid-cols-2 gap-4">
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col gap-1 transition-all hover:border-neon/30 group/stat">
                     <div className="flex items-center gap-1.5 text-white/40 font-heading text-[9px] uppercase tracking-widest group-hover/stat:text-neon/70 transition-colors">
                       <Crosshair size={14} /> {isQuantum ? "Lift Capacity" : "Range"}
                     </div>
                     <div className="font-data text-2xl font-bold text-white">
                       {range.toLocaleString()} <span className="text-sm text-white/30">km</span>
                     </div>
                  </div>
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col gap-1 transition-all hover:border-neon/30 group/stat">
                     <div className="flex items-center gap-1.5 text-white/40 font-heading text-[9px] uppercase tracking-widest group-hover/stat:text-neon/70 transition-colors">
                       <Gauge size={14} /> {isQuantum ? "Field Radius" : "Endurance"}
                     </div>
                     <div className="font-data text-2xl font-bold text-white">
                       {drone.specs?.endurance_hr || 0} <span className="text-sm text-white/30">hrs</span>
                     </div>
                  </div>
                </div>
                <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col gap-1 transition-all hover:border-white/10 group/stat">
                   <div className="flex items-center gap-1.5 text-white/40 font-heading text-[9px] uppercase tracking-widest">
                     <Zap size={14} /> {isQuantum ? "Energy Flux" : "Speed"}
                   </div>
                   <div className="font-data text-xl font-bold text-white/90">
                     {speed.toLocaleString()} <span className="text-xs text-white/30">km/h</span>
                   </div>
                </div>
                <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col gap-1 transition-all hover:border-white/10 group/stat">
                   <div className="flex items-center gap-1.5 text-white/40 font-heading text-[9px] uppercase tracking-widest">
                     <Shield size={14} /> {isQuantum ? "Stability" : "Payload"}
                   </div>
                   <div className="font-data text-xl font-bold text-warning/90">
                     {payload.toLocaleString()} <span className="text-xs text-white/30">kg</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CAPABILITIES */}
        {activeTab === 'capabilities' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-3">
              <h4 className="font-heading text-xs text-white/50 uppercase tracking-widest flex items-center gap-2">
                <Activity size={14} /> Mission Profiles
              </h4>
              <div className="flex flex-wrap gap-2">
                <RoleBadge role={drone.type === 'UCAV' ? 'Strike/Attack' : 'ISR (Recon)'} />
                <RoleBadge role={payload > 500 ? 'Heavy Lift' : payload > 50 ? 'Medium Payload' : 'Tactical Sensor'} />
                <RoleBadge role={range > 2000 ? 'Strategic Endurance' : range > 500 ? 'Theater Range' : 'Close Support'} />
                {drone.specs?.stealth_level === 'High' && <RoleBadge role="Low Observable" alert={true} />}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-heading text-xs text-white/50 uppercase tracking-widest flex items-center gap-2">
                <Server size={14} /> Technical Specifications
              </h4>
              <ul className="space-y-2 bg-black/30 p-4 rounded-xl border border-white/5 font-data text-xs">
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-white/40">Unit Cost (Est.)</span>
                  <span className="text-white font-bold">${(drone.specs?.price_usd || 0).toLocaleString()}</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-2 pt-2">
                  <span className="text-white/40">Maintenance/Hr</span>
                  <span className="text-white font-bold">${(drone.specs?.maintenance_cost_per_hr || 0).toLocaleString()}</span>
                </li>
                <li className="flex justify-between pb-1 pt-2">
                  <span className="text-white/40">Stealth Signature</span>
                  <span className="text-neon font-bold uppercase">{drone.specs?.stealth_level || 'Low'}</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 3: AI ANALYSIS */}
        {activeTab === 'analysis' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-start gap-3 bg-neon/5 border border-neon/20 p-4 rounded-xl">
              <Brain size={24} className="text-neon shrink-0 mt-1" />
              <div>
                <h4 className="font-heading text-xs text-neon uppercase tracking-widest mb-2">Automated Intelligence Assessment</h4>
                <p className="font-body text-sm text-white/80 leading-relaxed">
                  Based on parametric modeling, the {drone.name} excels in {range > 1000 ? 'long-range strategic' : 'tactical frontline'} operations. 
                  Its {speed > 400 ? 'high-speed' : 'cruising'} profile combined with a {payload}kg payload capacity indicates a primary use case in 
                  {payload > 200 ? ' kinetic strike missions.' : ' surveillance and electronic warfare.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                <h5 className="font-heading text-[10px] text-success uppercase tracking-widest mb-3">Strengths</h5>
                <ul className="space-y-2 font-data text-xs text-white/70">
                  {range > 1000 && <li className="flex gap-2"><ChevronRight size={12} className="text-success mt-0.5" /> High standoff capability</li>}
                  {payload > 500 && <li className="flex gap-2"><ChevronRight size={12} className="text-success mt-0.5" /> Massive ordnance carriage</li>}
                  {speed > 400 && <li className="flex gap-2"><ChevronRight size={12} className="text-success mt-0.5" /> Rapid target prosecution</li>}
                  {(range <= 1000 && payload <= 500 && speed <= 400) && <li className="flex gap-2"><ChevronRight size={12} className="text-success mt-0.5" /> Balanced capability profile</li>}
                </ul>
              </div>
              
              <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                <h5 className="font-heading text-[10px] text-danger uppercase tracking-widest mb-3">Vulnerabilities</h5>
                <ul className="space-y-2 font-data text-xs text-white/70">
                  {speed < 200 && <li className="flex gap-2"><ChevronRight size={12} className="text-danger mt-0.5" /> Vulnerable to kinetic intercept</li>}
                  {range < 300 && <li className="flex gap-2"><ChevronRight size={12} className="text-danger mt-0.5" /> Requires forward basing</li>}
                  {payload > 1000 && <li className="flex gap-2"><ChevronRight size={12} className="text-danger mt-0.5" /> Large radar cross-section</li>}
                  {(speed >= 200 && range >= 300 && payload <= 1000) && <li className="flex gap-2"><ChevronRight size={12} className="text-danger mt-0.5" /> Limited survivability in dense AD</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MATCHUP */}
        {activeTab === 'matchup' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <div className="bg-black/30 p-5 rounded-xl border border-white/5 text-center">
                <ShieldAlert size={32} className="mx-auto text-warning mb-3 opacity-50" />
                <h4 className="font-heading text-sm text-white uppercase tracking-widest mb-2">Counter-Measure Profile</h4>
                <p className="font-data text-xs text-white/50 mb-4 max-w-sm mx-auto">
                  Based on flight characteristics, the following systems possess the highest probability of kill (Pk) against {drone.name}.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded font-data text-xs text-white">{speed > 400 ? 'Advanced SAM' : 'SHORAD'}</span>
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded font-data text-xs text-white">{drone.specs?.jamming_resistance !== 'High' ? 'EW/Jamming' : 'Directed Energy'}</span>
                </div>
             </div>
          </div>
        )}
      </div>
      
      {/* 3D Viewer Modal */}
      {show3DModal && drone.model_url && (
        <Drone3DModal drone={drone} onClose={() => setShow3DModal(false)} />
      )}
      
      {/* Toast Notification */}
      {toast && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-neon/10 backdrop-blur-md border border-neon/30 text-neon px-4 py-2 rounded-full font-data text-xs shadow-[0_0_20px_rgba(0,255,255,0.2)] z-50 animate-in slide-in-from-bottom-4 fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, accent }) {
  return (
    <div className="bg-black/30 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-white/40 font-heading text-[9px] uppercase tracking-widest">
        {React.cloneElement(icon, { className: 'text-white/30' })} {label}
      </div>
      <div className={`font-data text-sm font-bold ${accent ? 'text-warning' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}

function RoleBadge({ role, alert }) {
  return (
    <span className={`px-2.5 py-1 text-[10px] font-heading uppercase tracking-widest rounded-md border ${
      alert ? 'bg-danger/10 border-danger/30 text-danger' : 'bg-white/5 border-white/10 text-white/70'
    }`}>
      {role}
    </span>
  );
}
