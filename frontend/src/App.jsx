import React, { useState, useEffect, useMemo } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ACADEMIC_MODULES = [
  {
    id: 'aero-101',
    title: '1. Multirotor vs. Fixed-Wing Aerodynamics',
    level: 'Foundational',
    duration: '25 mins',
    formula: 'L = ½ · ρ · v² · S · C_L   |   P_hover = T^(3/2) / √(2 · ρ · A)',
    summary:
      'Understand how fixed-wing UAVs generate lift via airfoil pressure differentials (Bernoulli & Newton) to achieve 20+ hour endurance, whereas multirotors rely on momentum theory and disk loading for VTOL agility.',
    keyPoints: [
      'Disk Loading (T/A): Larger, slower-spinning propellers require less power per kg of thrust in hover.',
      'Reynolds Number (Re): Micro-UAVs (like Black Hornet) operate at Re < 50,000 where laminar separation bubbles increase drag.',
      'QuadPlane Hybrids (like ideaForge SWITCH) combine vertical lift rotors with a fixed wing for cruise efficiency.'
    ]
  },
  {
    id: 'control-201',
    title: '2. Flight Control Laws, PID Loops & Sensor Fusion',
    level: 'Intermediate',
    duration: '35 mins',
    formula: 'u(t) = K_p·e(t) + K_i·∫e(τ)dτ + K_d·(de/dt)',
    summary:
      'Explore how modern autopilots (PX4, ArduPilot) fuse high-rate IMU gyroscopes (1 kHz) with accelerometers, magnetometers, barometers, and RTK-GNSS using an Extended Kalman Filter (EKF).',
    keyPoints: [
      'Cascaded PID Architecture: Outer attitude loop (angle error) feeds the inner rate loop (angular velocity error).',
      'Variable-Mass Gain Scheduling: Agricultural spraying drones (like AgriBot) dynamically scale PID gains as liquid payload empties.',
      'Control Mixing: Converting roll, pitch, yaw, and throttle demands into individual PWM/DShot ESC motor commands.'
    ]
  },
  {
    id: 'autonomy-301',
    title: '3. GPS-Denied Navigation, VIO & Swarm Consensus',
    level: 'Advanced',
    duration: '45 mins',
    formula: 'ẋ_i = ∑ a_ij · (x_j - x_i)   (Olfati-Saber Swarm Consensus)',
    summary:
      'Learn how autonomous drones navigate indoors or under electronic jamming using Visual-Inertial Odometry (VIO), 3D LiDAR SLAM, and decentralized multi-agent swarm algorithms.',
    keyPoints: [
      'Visual-Inertial Odometry: Tracks optical feature points across camera frames fused with IMU pre-integration.',
      'Decentralized Swarming: Uses Ultra-Wideband (UWB) time-of-flight ranging so drones maintain formation without a central server.',
      'Counter-UAS Resilience: Frequency-hopping spread spectrum (FHSS) and optical terrain matching.'
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('encyclopedia'); // encyclopedia | academic | automation | compare
  const [drones, setDrones] = useState([]);
  const [stats, setStats] = useState({ totalDrones: 0, autoDiscoveredCount: 0, countriesCount: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDrone, setSelectedDrone] = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [syncing, setSyncing] = useState(false);

  // Flight Physics Simulator State
  const [simParams, setSimParams] = useState({
    frameWeightKg: 1.8,
    batteryWeightKg: 0.9,
    payloadWeightKg: 0.6,
    batteryCapacityMah: 12000,
    batteryVoltageV: 22.2,
    rotorCount: 4,
    propDiameterInch: 15,
    maxThrustPerMotorKg: 2.4
  });
  const [simResult, setSimResult] = useState(null);

  // AI Academic Tutor State
  const [tutorQuestion, setTutorQuestion] = useState('');
  const [tutorResponse, setTutorResponse] = useState(null);
  const [tutorLoading, setTutorLoading] = useState(false);

  // Fetch Drones
  const fetchDrones = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedCategory !== 'All') params.set('category', selectedCategory);

      const res = await fetch(`${API_BASE}/drones?${params.toString()}`);
      const data = await res.json();
      setDrones(data.drones || []);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error('Failed to fetch drones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrones();
  }, [search, selectedCategory]);

  // Connect to Real-Time SSE Stream for Auto-Discovered Drones
  useEffect(() => {
    const eventSource = new EventSource(`${API_BASE}/updates/stream`);
    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === 'NEW_DRONE_DISCOVERED') {
          setLiveEvents((prev) => [parsed, ...prev.slice(0, 19)]);
          setDrones((prev) => {
            const exists = prev.some((d) => d.name === parsed.payload.name);
            return exists ? prev : [parsed.payload, ...prev];
          });
        } else if (parsed.type === 'NEWS_UPDATE') {
          setLiveEvents((prev) => [parsed, ...prev.slice(0, 19)]);
        }
      } catch (e) {
        console.error('SSE parse error:', e);
      }
    };
    return () => eventSource.close();
  }, []);

  // Run Flight Physics Simulation
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/academic/simulate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(simParams)
        });
        const data = await res.json();
        setSimResult(data);
      } catch (err) {
        console.error('Simulation error:', err);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [simParams]);

  // Trigger Automated Discovery Sync
  const handleTriggerSync = async (mode = 'both') => {
    setSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/automation/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      const data = await res.json();
      await fetchDrones();
      setLiveEvents((prev) => [
        {
          type: 'SYNC_COMPLETED',
          payload: data.results,
          timestamp: new Date().toISOString()
        },
        ...prev
      ]);
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  // Ask AI Tutor
  const handleAskTutor = async (e) => {
    e.preventDefault();
    if (!tutorQuestion.trim()) return;
    setTutorLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: tutorQuestion })
      });
      const data = await res.json();
      setTutorResponse(data);
    } catch (err) {
      console.error('Tutor error:', err);
    } finally {
      setTutorLoading(false);
    }
  };

  const categories = useMemo(
    () => [
      'All',
      'Academic & Research',
      'Commercial & Photography',
      'Agricultural',
      'Urban Air Mobility (eVTOL)',
      'Micro / Nano UAV',
      'MALE / HALE Surveillance',
      'Autonomous Swarm',
      'Experimental'
    ],
    []
  );

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
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-lg">
              UAV
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Drone Research & Academic Portal
              </h1>
              <p className="text-xs text-slate-400">
                Automated Global UAV Registry • Aerospace Engineering Lab • AI Research Tutor
              </p>
            </div>
          </div>

          {/* Live Telemetry Counters */}
          <div className="flex items-center gap-6 text-xs">
            <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
              <span className="text-slate-400">Cataloged UAVs: </span>
              <span className="font-mono font-bold text-cyan-400">{stats.totalDrones}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
              <span className="text-slate-400">Auto-Discovered: </span>
              <span className="font-mono font-bold text-emerald-400">{stats.autoDiscoveredCount}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
              <span className="text-slate-400">Countries: </span>
              <span className="font-mono font-bold text-indigo-400">{stats.countriesCount}</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex gap-2">
            {[
              { id: 'encyclopedia', label: 'UAV Encyclopedia' },
              { id: 'academic', label: 'Academic Lab & Simulator' },
              { id: 'automation', label: 'Auto-Discovery Pipeline' },
              { id: 'compare', label: `Compare (${compareList.length}/3)` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* TAB 1: GLOBAL UAV ENCYCLOPEDIA */}
        {activeTab === 'encyclopedia' && (
          <div className="space-y-6">
            {/* Search & Category Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by drone name, manufacturer, country, propulsion, or sensor (e.g., LiDAR, Tapas, eVTOL)..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleTriggerSync('both')}
                disabled={syncing}
                className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 px-4 py-2.5 rounded-xl text-sm font-medium transition"
              >
                {syncing ? 'Scanning Global Feeds...' : '⚡ Sync New Drones'}
              </button>
            </div>

            {/* Drone Cards Grid */}
            {loading ? (
              <div className="text-center py-16 text-slate-400">Loading UAV database...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {drones.map((drone) => (
                  <div
                    key={drone._id || drone.name}
                    className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-cyan-500/50 transition"
                  >
                    <div>
                      <div className="relative h-48 bg-slate-950 overflow-hidden">
                        <img
                          src={drone.image || '/drones/default.jpg'}
                          alt={drone.name}
                          onError={(e) => {
                            e.currentTarget.src = '/drones/default.jpg';
                          }}
                          className="w-full h-full object-cover opacity-90"
                        />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className="bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-md text-xs font-medium text-cyan-300 border border-slate-700">
                            {drone.category}
                          </span>
                          {drone.automationMeta?.source !== 'Manual' && (
                            <span className="bg-emerald-950/90 px-2.5 py-1 rounded-md text-xs font-medium text-emerald-300 border border-emerald-700">
                              Auto-Discovered
                            </span>
                          )}
                        </div>
                        <span className="absolute bottom-3 right-3 bg-slate-950/80 px-2.5 py-1 rounded text-xs text-slate-300">
                          {drone.country} ({drone.introducedYear || 'N/A'})
                        </span>
                      </div>

                      <div className="p-5">
                        <h3 className="text-lg font-bold text-white">{drone.name}</h3>
                        <p className="text-xs text-slate-400 mb-3">{drone.manufacturer}</p>
                        <p className="text-sm text-slate-300 line-clamp-2 mb-4">
                          {drone.description}
                        </p>

                        {/* Quick Technical Specs */}
                        <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-center text-xs">
                          <div>
                            <div className="text-slate-500">Speed</div>
                            <div className="font-mono font-semibold text-slate-200">
                              {drone.specifications?.maxSpeedKmh || '—'} km/h
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-500">Endurance</div>
                            <div className="font-mono font-semibold text-slate-200">
                              {drone.specifications?.enduranceHours || '—'} hrs
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-500">Payload</div>
                            <div className="font-mono font-semibold text-slate-200">
                              {drone.specifications?.payloadCapacityKg || '—'} kg
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-2 flex gap-2">
                      <button
                        onClick={() => setSelectedDrone(drone)}
                        className="flex-1 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 py-2 rounded-xl text-xs font-semibold transition"
                      >
                        Academic & Spec Dossier
                      </button>
                      <button
                        onClick={() => toggleCompare(drone)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                          compareList.some((d) => d._id === drone._id)
                            ? 'bg-indigo-500 text-white border-indigo-400'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {compareList.some((d) => d._id === drone._id) ? '✓ Added' : '+ Compare'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ACADEMIC ENGINEERING LAB & FLIGHT SIMULATOR */}
        {activeTab === 'academic' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Interactive Flight & Propulsion Physics Simulator */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  Interactive Aerospace Lab
                </span>
                <h2 className="text-xl font-bold text-white mt-1">
                  UAV Propulsion & Endurance Simulator
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Adjust airframe mass, LiPo battery capacity, and rotor geometry to compute real-time Momentum Theory hover power and flight time.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                {[
                  { key: 'frameWeightKg', label: 'Frame Mass (kg)', step: 0.1, min: 0.1 },
                  { key: 'batteryWeightKg', label: 'Battery Mass (kg)', step: 0.1, min: 0.1 },
                  { key: 'payloadWeightKg', label: 'Payload Mass (kg)', step: 0.1, min: 0 },
                  { key: 'batteryCapacityMah', label: 'Battery Capacity (mAh)', step: 500, min: 500 },
                  { key: 'batteryVoltageV', label: 'Voltage (V)', step: 3.7, min: 3.7 },
                  { key: 'rotorCount', label: 'Number of Rotors', step: 2, min: 1 },
                  { key: 'propDiameterInch', label: 'Propeller Diameter (in)', step: 1, min: 3 },
                  { key: 'maxThrustPerMotorKg', label: 'Max Thrust / Motor (kg)', step: 0.2, min: 0.2 }
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-slate-400 mb-1">{field.label}</label>
                    <input
                      type="number"
                      step={field.step}
                      min={field.min}
                      value={simParams[field.key]}
                      onChange={(e) =>
                        setSimParams({ ...simParams, [field.key]: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                ))}
              </div>

              {simResult && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-xs text-slate-400">Flight Viability Status:</span>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded ${
                        simResult.flightViability === 'Optimal'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {simResult.flightViability}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500">Thrust-to-Weight Ratio:</span>
                      <div className="text-lg font-mono font-bold text-cyan-400">
                        {simResult.thrustToWeightRatio} : 1
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Estimated Hover Time:</span>
                      <div className="text-lg font-mono font-bold text-emerald-400">
                        {simResult.hoverEnduranceMinutes} mins
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Hover Power Draw:</span>
                      <div className="font-mono text-slate-200">
                        {simResult.hoverPowerWatts} W ({simResult.hoverCurrentAmps} A)
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Disk Loading:</span>
                      <div className="font-mono text-slate-200">
                        {simResult.diskLoadingKgM2} kg/m²
                      </div>
                    </div>
                  </div>

                  {simResult.warnings?.map((w, idx) => (
                    <div key={idx} className="text-xs text-amber-300 bg-amber-950/40 p-2.5 rounded-lg">
                      ⚠️ {w}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Structured Academic Curriculum & AI Professor Tutor */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-xl font-bold text-white">
                  UAV Engineering Curriculum Modules
                </h2>
                <div className="space-y-4">
                  {ACADEMIC_MODULES.map((mod) => (
                    <div
                      key={mod.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-cyan-300 text-sm">{mod.title}</h3>
                        <span className="text-xs bg-slate-900 px-2.5 py-0.5 rounded text-slate-400">
                          {mod.level} • {mod.duration}
                        </span>
                      </div>
                      <div className="bg-slate-900/90 px-3 py-1.5 rounded font-mono text-xs text-emerald-300">
                        {mod.formula}
                      </div>
                      <p className="text-xs text-slate-300">{mod.summary}</p>
                      <ul className="list-disc list-inside text-xs text-slate-400 space-y-1 pt-1">
                        {mod.keyPoints.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Aerospace Professor Q&A */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-white">
                  Ask the AI UAV Engineering Tutor
                </h3>
                <form onSubmit={handleAskTutor} className="flex gap-2">
                  <input
                    type="text"
                    value={tutorQuestion}
                    onChange={(e) => setTutorQuestion(e.target.value)}
                    placeholder="Ask about PID tuning, Reynolds numbers, QuadPlane transition, or compare specific drones..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                  <button
                    type="submit"
                    disabled={tutorLoading}
                    className="bg-cyan-500 text-slate-950 font-semibold px-5 py-2.5 rounded-xl text-sm"
                  >
                    {tutorLoading ? 'Thinking...' : 'Ask Professor'}
                  </button>
                </form>

                {tutorResponse && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 whitespace-pre-wrap">
                    {tutorResponse.answer}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AUTOMATED DRONE DISCOVERY PIPELINE */}
        {activeTab === 'automation' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Zero-Touch Automated Drone Harvester
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Automatically synchronizes existing UAVs from Wikidata SPARQL (`wd:Q484000`) and scans global aerospace RSS feeds every 6 hours using AI structured extraction to add newly unveiled drones.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleTriggerSync('wikidata')}
                  disabled={syncing}
                  className="bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 px-4 py-2.5 rounded-xl text-xs font-semibold"
                >
                  Sync Wikidata Registry
                </button>
                <button
                  onClick={() => handleTriggerSync('news')}
                  disabled={syncing}
                  className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl text-xs font-semibold"
                >
                  Scan Live News Feeds Now
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
                Real-Time Ingestion Stream (Server-Sent Events)
              </h3>
              {liveEvents.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Listening for real-time discovery events... Click &quot;Sync Wikidata Registry&quot; or &quot;Scan Live News Feeds Now&quot; above to trigger an immediate harvest.
                </p>
              ) : (
                <div className="space-y-3">
                  {liveEvents.map((ev, index) => (
                    <div
                      key={index}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-emerald-400 mr-2">
                          [{ev.type}]
                        </span>
                        <span className="text-slate-200">
                          {ev.payload?.name
                            ? `Added new drone: ${ev.payload.name} (${ev.payload.country})`
                            : JSON.stringify(ev.payload)}
                        </span>
                      </div>
                      <span className="text-slate-500 font-mono">{ev.timestamp}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SIDE-BY-SIDE DRONE COMPARISON */}
        {activeTab === 'compare' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Side-by-Side Technical & Academic Comparison
            </h2>
            {compareList.length === 0 ? (
              <p className="text-sm text-slate-400">
                Select up to 3 drones from the UAV Encyclopedia tab to compare their specifications and aerodynamic profiles.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {compareList.map((d) => (
                  <div key={d._id} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-white text-base">{d.name}</h3>
                        <p className="text-xs text-cyan-400">{d.country} • {d.category}</p>
                      </div>
                      <button
                        onClick={() => toggleCompare(d)}
                        className="text-xs text-rose-400 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="text-xs space-y-2 border-t border-slate-800 pt-3">
                      <div><span className="text-slate-500">Propulsion:</span> {d.specifications?.propulsionType}</div>
                      <div><span className="text-slate-500">Max Speed:</span> {d.specifications?.maxSpeedKmh} km/h</div>
                      <div><span className="text-slate-500">Range:</span> {d.specifications?.rangeKm} km</div>
                      <div><span className="text-slate-500">Endurance:</span> {d.specifications?.enduranceHours} hrs</div>
                      <div><span className="text-slate-500">MTOW:</span> {d.specifications?.maxTakeoffWeightKg} kg</div>
                      <div><span className="text-slate-500">Payload:</span> {d.specifications?.payloadCapacityKg} kg</div>
                      <div><span className="text-slate-500">Aerodynamics:</span> {d.academicNotes?.aerodynamicProfile}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Academic & Technical Dossier Modal */}
      {selectedDrone && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-mono uppercase text-cyan-400">
                  {selectedDrone.category} • {selectedDrone.country}
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

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
              <h4 className="font-bold text-cyan-300 uppercase tracking-wider">
                Academic & Engineering Analysis
              </h4>
              <p>
                <strong className="text-slate-300">Aerodynamic Profile:</strong>{' '}
                {selectedDrone.academicNotes?.aerodynamicProfile || 'Standard airframe'}
              </p>
              <p>
                <strong className="text-slate-300">Control & Avionics Architecture:</strong>{' '}
                {selectedDrone.academicNotes?.controlArchitecture || 'Autonomous flight controller'}
              </p>
              <p>
                <strong className="text-slate-300">Sensor Suite:</strong>{' '}
                {(selectedDrone.academicNotes?.sensorSuite || []).join(', ') || 'Standard telemetry'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
