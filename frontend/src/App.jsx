import React, { useState, useEffect, useMemo } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ACADEMIC_MODULES = [
  {
    id: 'aero-101',
    title: 'Module 1: Fixed-Wing vs. Multirotor & Hybrid VTOL Aerodynamics',
    level: 'Aerospace Core',
    formula: 'L = ½·ρ·v²·S·C_L  |  C_Di = C_L² / (π·AR·e)  |  P_hover = T^(3/2) / √(2·ρ·A)',
    summary:
      'Analyzes how high-aspect-ratio wings (MQ-9, TAPAS) minimize induced drag for 20–36h endurance, while QuadPlane hybrids (ideaForge SWITCH) bridge vertical takeoff with winged cruise.',
    takeaways: [
      'Disk Loading (T/A): Lower disk loading increases hover efficiency (grams of thrust per Watt).',
      'Low Reynolds Number (Re < 50,000): Nano-UAVs (Black Hornet) contend with laminar separation bubbles.',
      'ISA Density Decay: At 5,500m altitude (NETRA V4 PRO), air density drops ~45%, requiring higher pitch/RPM.'
    ]
  },
  {
    id: 'control-201',
    title: 'Module 2: Cascaded PID Control, EKF Sensor Fusion & Gain Scheduling',
    level: 'Flight Control Systems',
    formula: 'u(t) = K_p·e(t) + K_i·∫e(τ)dτ + K_d·(de/dt)  |  x̂_k = f(x̂_{k-1}, u_k) + K_k(z_k - H·x̂_k)',
    summary:
      'Covers 24-state Extended Kalman Filters (EKF) fusing 1kHz MEMS gyros, accelerometers, magnetometers, barometers, and RTK/GAGAN GNSS.',
    takeaways: [
      'Variable-Mass Gain Scheduling: Agricultural drones (AgriBot) scale PID gains dynamically as 10L liquid payload dispenses.',
      'V-Tail Ruddervator Mixing: Coupled pitch/yaw actuator matrix used in Hermes 900 / Drishti-10 and TB2.',
      'TECS (Total Energy Control System): Coordinates elevator and throttle during fixed-wing climb and transition.'
    ]
  },
  {
    id: 'autonomy-301',
    title: 'Module 3: GPS-Denied Visual-Inertial Odometry (VIO), SLAM & Swarm Consensus',
    level: 'Autonomous Robotics',
    formula: 'ẋ_i = ∑ a_ij·(x_j - x_i) + ∑ φ(||x_j - x_i||)·n_ij   (Olfati-Saber Flocking)',
    summary:
      'Explores how UAVs navigate under electronic jamming using optical-flow VIO, 3D LiDAR SLAM, and Ultra-Wideband (UWB) decentralized mesh consensus.',
    takeaways: [
      'Visual-Inertial Odometry: Tracks optical feature keypoints fused with IMU pre-integration for indoor flight.',
      'Voronoi Area Partitioning: Enables Swarm-X drones to divide search-and-rescue grids without a central server.',
      'Spectrum Resilience: FHSS frequency hopping and directional null-steering antennas.'
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('encyclopedia');
  // Tabs: encyclopedia | counter_uas | academic_lab | geo_intel | history | automation | compare

  const [drones, setDrones] = useState([]);
  const [counterSystems, setCounterSystems] = useState([]);
  const [countries, setCountries] = useState([]);
  const [historyEvents, setHistoryEvents] = useState([]);
  const [stats, setStats] = useState({
    totalDrones: 0,
    autoDiscoveredCount: 0,
    countriesCount: 0,
    counterSystemsCount: 0,
    theoreticalCount: 0
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [theoreticalFilter, setTheoreticalFilter] = useState('All');
  const [selectedDrone, setSelectedDrone] = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [syncing, setSyncing] = useState(false);

  // Academic Flight Physics Simulator State
  const [simParams, setSimParams] = useState({
    frameWeightKg: 1.8,
    batteryWeightKg: 0.9,
    payloadWeightKg: 0.6,
    batteryCapacityMah: 12000,
    batteryVoltageV: 22.2,
    rotorCount: 4,
    propDiameterInch: 15,
    maxThrustPerMotorKg: 2.4,
    altitudeMeters: 500
  });
  const [simResult, setSimResult] = useState(null);

  // Counter-UAS Engagement Simulator State
  const [selectedTargetDroneId, setSelectedTargetDroneId] = useState('');
  const [selectedCounterId, setSelectedCounterId] = useState('');
  const [weatherCondition, setWeatherCondition] = useState('Clear Sky');
  const [engagementResult, setEngagementResult] = useState(null);

  // AI Research Analyst State
  const [tutorQuestion, setTutorQuestion] = useState('');
  const [tutorHistory, setTutorHistory] = useState([]);
  const [tutorLoading, setTutorLoading] = useState(false);

  // Load All Portal Datasets
  const fetchPortalData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedCategory !== 'All') params.set('category', selectedCategory);
      if (selectedCountry !== 'All') params.set('country', selectedCountry);
      if (theoreticalFilter !== 'All') params.set('isTheoretical', theoreticalFilter);

      const [dronesRes, counterRes, countriesRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/drones?${params.toString()}`),
        fetch(`${API_BASE}/counter-systems`),
        fetch(`${API_BASE}/countries`),
        fetch(`${API_BASE}/history`)
      ]);

      const dronesData = await dronesRes.json();
      const counterData = await counterRes.json().catch(() => ({ counterSystems: [] }));
      const countriesData = await countriesRes.json().catch(() => ({ countries: [] }));
      const historyData = await historyRes.json().catch(() => ({ history: [] }));

      const loadedDrones = dronesData.drones || [];
      const loadedCounters = counterData.counterSystems || [];

      setDrones(loadedDrones);
      setCounterSystems(loadedCounters);
      setCountries(countriesData.countries || []);
      setHistoryEvents(historyData.history || []);
      if (dronesData.stats) setStats(dronesData.stats);

      if (!selectedTargetDroneId && loadedDrones.length > 0) {
        setSelectedTargetDroneId(loadedDrones[0]._id);
      }
      if (!selectedCounterId && loadedCounters.length > 0) {
        setSelectedCounterId(loadedCounters[0]._id);
      }
    } catch (err) {
      console.error('Error loading portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, [search, selectedCategory, selectedCountry, theoreticalFilter]);

  // Real-Time SSE Stream for Automated Drone Discovery
  useEffect(() => {
    const es = new EventSource(`${API_BASE}/updates/stream`);
    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === 'NEW_DRONE_DISCOVERED') {
          setLiveEvents((prev) => [parsed, ...prev.slice(0, 24)]);
          setDrones((prev) =>
            prev.some((d) => d.name === parsed.payload.name) ? prev : [parsed.payload, ...prev]
          );
        } else if (parsed.type === 'NEWS_UPDATE') {
          setLiveEvents((prev) => [parsed, ...prev.slice(0, 24)]);
        }
      } catch (_) {}
    };
    return () => es.close();
  }, []);

  // Academic Flight Physics Simulation Effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/simulate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'flight_physics', ...simParams })
        });
        const data = await res.json();
        setSimResult(data);
      } catch (_) {}
    }, 150);
    return () => clearTimeout(timer);
  }, [simParams]);

  // Run Counter-UAS Engagement Simulation
  const handleRunEngagementSim = async () => {
    if (!selectedTargetDroneId || !selectedCounterId) return;
    try {
      const res = await fetch(`${API_BASE}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'engagement',
          droneId: selectedTargetDroneId,
          counterSystemId: selectedCounterId,
          weather: weatherCondition
        })
      });
      const data = await res.json();
      setEngagementResult(data);
    } catch (err) {
      console.error('Engagement simulation error:', err);
    }
  };

  // Trigger Automated Multi-Source Discovery Sync
  const handleTriggerSync = async (mode = 'all') => {
    setSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/automation/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      const data = await res.json();
      await fetchPortalData();
      setLiveEvents((prev) => [
        {
          type: 'PIPELINE_SYNC_COMPLETE',
          payload: data.results,
          timestamp: new Date().toISOString()
        },
        ...prev
      ]);
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setSyncing(false);
    }
  };

  // Ask Hybrid-AI Professor
  const handleAskTutor = async (e) => {
    e.preventDefault();
    if (!tutorQuestion.trim()) return;
    const q = tutorQuestion;
    setTutorQuestion('');
    setTutorLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q })
      });
      const data = await res.json();
      setTutorHistory((prev) => [
        { question: q, answer: data.answer, sources: data.sources || [] },
        ...prev
      ]);
    } catch (err) {
      console.error('AI error:', err);
    } finally {
      setTutorLoading(false);
    }
  };

  const categories = useMemo(
    () => [
      'All',
      'MALE / HALE Surveillance',
      'Academic & Research',
      'Commercial & Photography',
      'Agricultural',
      'Urban Air Mobility (eVTOL)',
      'Micro / Nano UAV',
      'Autonomous Swarm',
      'Tactical / Multi-Role',
      'Experimental'
    ],
    []
  );

  const uniqueCountries = useMemo(() => {
    const set = new Set(drones.map((d) => d.country).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [drones]);

  const toggleCompare = (drone) => {
    setCompareList((prev) =>
      prev.some((d) => d._id === drone._id)
        ? prev.filter((d) => d._id !== drone._id)
        : prev.length < 3
        ? [...prev, drone]
        : prev
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Pro Command Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-extrabold text-sm tracking-wider">
                DRP
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-white">
                    Drone Research & Intelligence Portal
                  </h1>
                  <span className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono uppercase px-2 py-0.5 rounded">
                    PRO v3.0
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Global UAV Encyclopedia • Counter-UAS Matrix • Academic Propulsion Lab • Zero-Touch Auto-Discovery
                </p>
              </div>
            </div>

            {/* Telemetry Bar */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
                <span className="text-slate-400">UAVs: </span>
                <span className="font-mono font-bold text-cyan-400">{stats.totalDrones}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
                <span className="text-slate-400">C-UAS Systems: </span>
                <span className="font-mono font-bold text-rose-400">{counterSystems.length}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
                <span className="text-slate-400">Auto-Harvested: </span>
                <span className="font-mono font-bold text-emerald-400">{stats.autoDiscoveredCount}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
                <span className="text-slate-400">Nations: </span>
                <span className="font-mono font-bold text-indigo-400">{stats.countriesCount}</span>
              </div>
            </div>
          </div>

          {/* 7-Module Pro Navigation Bar */}
          <nav className="flex flex-wrap gap-1.5 pt-1">
            {[
              { id: 'encyclopedia', label: '1. UAV Encyclopedia & TF-IDF Search' },
              { id: 'counter_uas', label: '2. Counter-UAS Defense Matrix' },
              { id: 'academic_lab', label: '3. Academic Lab & AI Professor' },
              { id: 'geo_intel', label: '4. Country & Base Intel' },
              { id: 'history', label: '5. UAV Evolution Timeline' },
              { id: 'automation', label: '6. Auto-Discovery Pipeline' },
              { id: 'compare', label: `7. Compare Matrix (${compareList.length}/3)` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-7">
        {/* MODULE 1: UAV ENCYCLOPEDIA */}
        {activeTab === 'encyclopedia' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="TF-IDF Smart Search: model, sensor (SAR, LiDAR), propulsion, or country..."
                className="md:col-span-5 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="md:col-span-3 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="md:col-span-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
              >
                {uniqueCountries.map((c) => (
                  <option key={c} value={c}>{c === 'All' ? 'All Countries' : c}</option>
                ))}
              </select>
              <button
                onClick={() => handleTriggerSync('all')}
                disabled={syncing}
                className="md:col-span-2 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 px-3 py-2 rounded-xl text-xs font-semibold transition"
              >
                {syncing ? 'Syncing...' : '⚡ Auto-Sync UAVs'}
              </button>
            </div>

            {loading ? (
              <div className="text-center py-16 text-slate-400">Loading Pro UAV Database...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {drones.map((drone) => (
                  <div
                    key={drone._id || drone.name}
                    className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-cyan-500/50 transition group"
                  >
                    <div>
                      <div className="relative h-48 bg-slate-950 overflow-hidden">
                        <img
                          src={drone.image || drone.imageUrl || '/drones/default.jpg'}
                          alt={drone.name}
                          onError={(e) => { e.currentTarget.src = '/drones/default.jpg'; }}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90"
                        />
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                          <span className="bg-slate-950/85 px-2.5 py-1 rounded-md text-[11px] font-semibold text-cyan-300 border border-slate-700">
                            {drone.category || drone.type}
                          </span>
                          {drone.isTheoretical && (
                            <span className="bg-purple-950/90 px-2 py-1 rounded-md text-[11px] font-semibold text-purple-300 border border-purple-700">
                              Theoretical / Concept
                            </span>
                          )}
                          {drone.automationMeta?.source &&
                            !['Manual', 'Seed-Core'].includes(drone.automationMeta.source) && (
                              <span className="bg-emerald-950/90 px-2 py-1 rounded-md text-[11px] font-semibold text-emerald-300 border border-emerald-700">
                                {drone.automationMeta.source}
                              </span>
                            )}
                        </div>
                        <span className="absolute bottom-3 right-3 bg-slate-950/85 px-2.5 py-1 rounded text-xs font-mono text-slate-300 border border-slate-800">
                          {drone.country} • {drone.introducedYear || drone.year || 'Active'}
                        </span>
                      </div>

                      <div className="p-5">
                        <h3 className="text-lg font-bold text-white">{drone.name}</h3>
                        <p className="text-xs text-slate-400 mb-2">{drone.manufacturer}</p>
                        <p className="text-xs text-slate-300 line-clamp-2 mb-4">{drone.description}</p>

                        <div className="grid grid-cols-4 gap-1.5 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-center text-[11px]">
                          <div>
                            <div className="text-slate-500">Speed</div>
                            <div className="font-mono font-semibold text-slate-200">
                              {drone.specifications?.maxSpeedKmh || drone.specs?.speed || '—'}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-500">Endurance</div>
                            <div className="font-mono font-semibold text-slate-200">
                              {drone.specifications?.enduranceHours
                                ? `${drone.specifications.enduranceHours}h`
                                : drone.specs?.endurance || '—'}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-500">Payload</div>
                            <div className="font-mono font-semibold text-slate-200">
                              {drone.specifications?.payloadCapacityKg
                                ? `${drone.specifications.payloadCapacityKg}kg`
                                : '—'}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-500">RCS</div>
                            <div className="font-mono font-semibold text-amber-300">
                              {drone.tacticalData?.rcs || '0.1m²'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-1 flex gap-2">
                      <button
                        onClick={() => setSelectedDrone(drone)}
                        className="flex-1 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 py-2 rounded-xl text-xs font-semibold transition"
                      >
                        Full Engineering & Tactical Dossier
                      </button>
                      <button
                        onClick={() => toggleCompare(drone)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                          compareList.some((d) => d._id === drone._id)
                            ? 'bg-indigo-500 text-white border-indigo-400'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        {compareList.some((d) => d._id === drone._id) ? '✓' : '+'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODULE 2: COUNTER-UAS DEFENSE MATRIX & ENGAGEMENT SIMULATOR */}
        {activeTab === 'counter_uas' && (
          <div className="space-y-8">
            {/* Interactive Engagement Simulator */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div>
                <span className="text-xs font-mono uppercase text-rose-400">
                  Counter-UAS Radar & Interception Lab
                </span>
                <h2 className="text-xl font-bold text-white">
                  UAV vs. Counter-System Engagement Simulator
                </h2>
                <p className="text-xs text-slate-400">
                  Simulates detection range and neutralization probability based on target Radar Cross Section (RCS), EW resilience, and weather attenuation.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Select Target UAV</label>
                  <select
                    value={selectedTargetDroneId}
                    onChange={(e) => setSelectedTargetDroneId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white"
                  >
                    {drones.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name} (RCS: {d.tacticalData?.rcs || '0.1m²'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Select Counter-UAS Effector</label>
                  <select
                    value={selectedCounterId}
                    onChange={(e) => setSelectedCounterId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white"
                  >
                    {counterSystems.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Atmospheric / Weather Condition</label>
                  <select
                    value={weatherCondition}
                    onChange={(e) => setWeatherCondition(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white"
                  >
                    <option>Clear Sky</option>
                    <option>Heavy Rain / Fog (Laser Attenuation)</option>
                    <option>High RF Urban Clutter</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleRunEngagementSim}
                    className="w-full bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold py-2.5 rounded-xl transition"
                  >
                    Run Interception Sim
                  </button>
                </div>
              </div>

              {engagementResult && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="text-slate-500">Interception Probability</div>
                    <div className="text-2xl font-mono font-bold text-rose-400">
                      {engagementResult.successProbability}%
                    </div>
                    <div className="text-emerald-300 font-semibold mt-1">
                      {engagementResult.outcomeRating}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Effective Radar Detection Range</div>
                    <div className="text-2xl font-mono font-bold text-cyan-400">
                      {engagementResult.detectionRangeKm} km
                    </div>
                    <div className="text-slate-400 mt-1">
                      {engagementResult.droneName} vs. {engagementResult.counterSystemName}
                    </div>
                  </div>
                  <div className="space-y-1 text-slate-300">
                    {engagementResult.technicalBreakdown?.map((item, idx) => (
                      <div key={idx}>• {item}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Counter-UAS Systems Catalog */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {counterSystems.map((cs) => (
                <div
                  key={cs._id || cs.name}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="h-44 bg-slate-950 relative overflow-hidden">
                      <img
                        src={cs.image || cs.photo_url || '/counter/DroneHunter F700.png'}
                        alt={cs.name}
                        className="w-full h-full object-cover opacity-90"
                      />
                      <span className="absolute top-3 left-3 bg-rose-950/90 border border-rose-700 text-rose-300 text-[11px] font-semibold px-2.5 py-1 rounded">
                        {cs.country} • Range: {cs.rangeKm || cs.range_km} km
                      </span>
                    </div>
                    <div className="p-5 space-y-2">
                      <h3 className="text-lg font-bold text-white">{cs.name}</h3>
                      <p className="text-xs text-cyan-400 font-medium">{cs.type}</p>
                      <p className="text-xs text-slate-300">{cs.description}</p>
                    </div>
                  </div>
                  <div className="px-5 pb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Effectiveness Rating</span>
                      <span className="font-mono font-bold text-emerald-400">{cs.effectiveness}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${cs.effectiveness || 85}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODULE 3: ACADEMIC ENGINEERING LAB & AI PROFESSOR */}
        {activeTab === 'academic_lab' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div>
                <span className="text-xs font-mono uppercase text-cyan-400">
                  Propulsion & Aerodynamics Lab
                </span>
                <h2 className="text-xl font-bold text-white mt-1">
                  ISA Altitude & Actuator Disk Simulator
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3.5 text-xs">
                {[
                  { key: 'frameWeightKg', label: 'Frame Mass (kg)', step: 0.1 },
                  { key: 'batteryWeightKg', label: 'Battery Mass (kg)', step: 0.1 },
                  { key: 'payloadWeightKg', label: 'Payload Mass (kg)', step: 0.1 },
                  { key: 'batteryCapacityMah', label: 'Battery (mAh)', step: 500 },
                  { key: 'batteryVoltageV', label: 'Bus Voltage (V)', step: 3.7 },
                  { key: 'rotorCount', label: 'Rotor Count', step: 2 },
                  { key: 'propDiameterInch', label: 'Prop Diameter (in)', step: 1 },
                  { key: 'maxThrustPerMotorKg', label: 'Thrust / Motor (kg)', step: 0.2 },
                  { key: 'altitudeMeters', label: 'Operating Altitude (m)', step: 250 }
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-slate-400 mb-1">{f.label}</label>
                    <input
                      type="number"
                      step={f.step}
                      value={simParams[f.key]}
                      onChange={(e) =>
                        setSimParams({ ...simParams, [f.key]: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                ))}
              </div>

              {simResult && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Envelope Status:</span>
                    <span className="font-bold text-cyan-300">{simResult.flightViability}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-500">Thrust-to-Weight:</span>
                      <div className="text-lg font-mono font-bold text-cyan-400">
                        {simResult.thrustToWeightRatio} : 1
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Hover Endurance:</span>
                      <div className="text-lg font-mono font-bold text-emerald-400">
                        {simResult.hoverEnduranceMinutes} mins
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Air Density (ρ):</span>
                      <div className="font-mono text-slate-200">{simResult.airDensityKgM3} kg/m³</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Hover Power:</span>
                      <div className="font-mono text-slate-200">
                        {simResult.hoverPowerWatts}W ({simResult.hoverCurrentAmps}A)
                      </div>
                    </div>
                  </div>
                  {simResult.warnings?.map((w, i) => (
                    <div key={i} className="text-amber-300 bg-amber-950/40 p-2 rounded">
                      ⚠️ {w}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-xl font-bold text-white">
                  Aerospace Engineering Curriculum
                </h2>
                {ACADEMIC_MODULES.map((mod) => (
                  <div
                    key={mod.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2"
                  >
                    <div className="flex justify-between">
                      <h3 className="font-bold text-cyan-300 text-sm">{mod.title}</h3>
                      <span className="text-xs text-slate-400">{mod.level}</span>
                    </div>
                    <div className="bg-slate-900 px-3 py-1.5 rounded font-mono text-xs text-emerald-300">
                      {mod.formula}
                    </div>
                    <p className="text-xs text-slate-300">{mod.summary}</p>
                    <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                      {mod.takeaways.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Conversational AI Research Tutor */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-white">
                  Hybrid-AI Aerospace Research Assistant
                </h3>
                <form onSubmit={handleAskTutor} className="flex gap-2">
                  <input
                    type="text"
                    value={tutorQuestion}
                    onChange={(e) => setTutorQuestion(e.target.value)}
                    placeholder="Ask about UAV aerodynamics, Kalman filters, or compare drones in our database..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                  <button
                    type="submit"
                    disabled={tutorLoading}
                    className="bg-cyan-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs"
                  >
                    {tutorLoading ? 'Analyzing...' : 'Ask AI'}
                  </button>
                </form>

                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {tutorHistory.map((item, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
                      <div className="font-bold text-cyan-300">Q: {item.question}</div>
                      <div className="text-slate-200 whitespace-pre-wrap">{item.answer}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 4: GLOBAL COUNTRY & TEST BASE INTELLIGENCE */}
        {activeTab === 'geo_intel' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {countries.map((country) => (
              <div
                key={country._id || country.name}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">{country.name}</h3>
                  <span className="text-xs font-mono bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded">
                    {country.region} ({country.code})
                  </span>
                </div>
                <p className="text-xs text-slate-300">{country.summary}</p>
                <div className="text-xs space-y-1.5 pt-2 border-t border-slate-800">
                  <div>
                    <strong className="text-slate-400">Regulatory Authority: </strong>
                    <span className="text-cyan-300">{country.regulatoryBody}</span>
                  </div>
                  <div>
                    <strong className="text-slate-400">Key Manufacturers: </strong>
                    <span className="text-slate-200">
                      {(country.leadingManufacturers || []).join(', ')}
                    </span>
                  </div>
                  <div>
                    <strong className="text-slate-400">Aerospace Test Ranges & Labs: </strong>
                    <span className="text-emerald-300">
                      {(country.keyTestCenters || []).join(' • ')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODULE 5: UAV EVOLUTION & HISTORY TIMELINE */}
        {activeTab === 'history' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-bold text-white">
              Chronological Evolution of Unmanned Aerial Systems
            </h2>
            <div className="space-y-4 border-l-2 border-cyan-500/40 pl-6">
              {historyEvents.map((ev, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-cyan-400 text-base">{ev.year}</span>
                    <span className="text-xs bg-slate-900 px-2 py-0.5 rounded text-slate-400">
                      {ev.era}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-sm">{ev.title}</h3>
                  <p className="text-xs text-slate-300">{ev.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODULE 6: AUTOMATED MULTI-SOURCE DRONE DISCOVERY PIPELINE */}
        {activeTab === 'automation' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">
                  3-Engine Automated Drone Discovery Pipeline
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  1. Wikidata SPARQL Registry (`wd:Q484000`) • 2. ArXiv Robotics (`cs.RO`) Academic Papers • 3. Global UAV RSS + Gemini Structured JSON Extractor
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleTriggerSync('wikidata')}
                  disabled={syncing}
                  className="bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  Sync Wikidata Registry
                </button>
                <button
                  onClick={() => handleTriggerSync('news')}
                  disabled={syncing}
                  className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  Scan ArXiv & News Feeds
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <h3 className="text-xs font-mono uppercase text-slate-400">
                Real-Time Server-Sent Events (SSE) Telemetry Stream
              </h3>
              {liveEvents.length === 0 ? (
                <p className="text-xs text-slate-500">
                  SSE stream connected. Trigger a Wikidata or News scan above to watch new drones ingest live.
                </p>
              ) : (
                liveEvents.map((ev, i) => (
                  <div
                    key={i}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex justify-between items-center text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-emerald-400 mr-2">[{ev.type}]</span>
                      <span className="text-slate-200">
                        {ev.payload?.name
                          ? `${ev.payload.name} (${ev.payload.country}) added to encyclopedia`
                          : JSON.stringify(ev.payload)}
                      </span>
                    </div>
                    <span className="font-mono text-slate-500">{ev.timestamp}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* MODULE 7: SIDE-BY-SIDE COMPARISON */}
        {activeTab === 'compare' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Multi-UAV Technical & Tactical Comparison Matrix
            </h2>
            {compareList.length === 0 ? (
              <p className="text-xs text-slate-400">
                Click the &quot;+&quot; button on up to 3 drones in the Encyclopedia tab to compare them side-by-side.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {compareList.map((d) => (
                  <div key={d._id} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3 text-xs">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-bold text-white text-base">{d.name}</h3>
                        <p className="text-cyan-400">{d.country} • {d.category}</p>
                      </div>
                      <button onClick={() => toggleCompare(d)} className="text-rose-400">Remove</button>
                    </div>
                    <div className="space-y-1.5 border-t border-slate-800 pt-3">
                      <div><span className="text-slate-500">Manufacturer:</span> {d.manufacturer}</div>
                      <div><span className="text-slate-500">Speed:</span> {d.specifications?.maxSpeedKmh} km/h</div>
                      <div><span className="text-slate-500">Range:</span> {d.specifications?.rangeKm} km</div>
                      <div><span className="text-slate-500">Endurance:</span> {d.specifications?.enduranceHours} hrs</div>
                      <div><span className="text-slate-500">MTOW:</span> {d.specifications?.maxTakeoffWeightKg} kg</div>
                      <div><span className="text-slate-500">RCS:</span> {d.tacticalData?.rcs || '0.1 m²'}</div>
                      <div><span className="text-slate-500">EW Resilience:</span> {d.tacticalData?.ewResilience || 75}/100</div>
                      <div><span className="text-slate-500">Aerodynamics:</span> {d.academicNotes?.aerodynamicProfile}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Full Engineering & Tactical Dossier Modal */}
      {selectedDrone && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-mono uppercase text-cyan-400">
                  {selectedDrone.category} • {selectedDrone.country} • {selectedDrone.introducedYear || selectedDrone.year}
                </span>
                <h2 className="text-2xl font-bold text-white">{selectedDrone.name}</h2>
                <p className="text-xs text-slate-400">{selectedDrone.manufacturer}</p>
              </div>
              <button
                onClick={() => setSelectedDrone(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-sm text-slate-300">{selectedDrone.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-cyan-300 uppercase">Academic & Avionics Breakdown</h4>
                <p><strong>Aerodynamics:</strong> {selectedDrone.academicNotes?.aerodynamicProfile}</p>
                <p><strong>Control Law:</strong> {selectedDrone.academicNotes?.controlArchitecture}</p>
                <p><strong>Sensors:</strong> {(selectedDrone.academicNotes?.sensorSuite || []).join(', ')}</p>
                {(selectedDrone.academicNotes?.learningTakeaways || []).map((lt, i) => (
                  <p key={i} className="text-emerald-300">• {lt}</p>
                ))}
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-rose-300 uppercase">Signatures & Telemetry</h4>
                <p><strong>Radar Cross Section (RCS):</strong> {selectedDrone.tacticalData?.rcs || '0.1 m²'}</p>
                <p><strong>Thermal Signature:</strong> {selectedDrone.tacticalData?.thermalSignature || 'Low'}</p>
                <p><strong>EW Resilience:</strong> {selectedDrone.tacticalData?.ewResilience || 75}/100</p>
                <p><strong>Datalinks:</strong> {(selectedDrone.tacticalData?.communicationLinks || []).join(', ') || 'Encrypted LOS/BLOS'}</p>
                <p><strong>Recommended C-UAS:</strong> {(selectedDrone.tacticalData?.recommendedCounters || []).join(', ') || 'SkyFence EW'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
