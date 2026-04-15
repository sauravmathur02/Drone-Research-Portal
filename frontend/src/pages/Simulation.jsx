import React, { useEffect, useState } from 'react';
import { runSimulation, getCountries } from '../services/api';
import { BrainCircuit, Target } from 'lucide-react';

const attackOptions = [
  { value: 'Swarm', label: 'Coordinated Swarm' },
  { value: 'Tactical', label: 'Tactical Incursion' },
  { value: 'MALE', label: 'Medium Altitude Strike' },
  { value: 'HALE', label: 'High Altitude Strike' },
  { value: 'Loitering', label: 'Loitering Munition Raid' },
  { value: 'Nano', label: 'Micro Recon Intrusion' },
];

export default function Simulation() {
  const [countries, setCountries] = useState([]);
  const [country, setCountry] = useState('');
  const [attackType, setAttackType] = useState('Swarm');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCountries()
      .then((data) => {
        setCountries(data);
        if (data.length > 0) {
          setCountry(data[0].code);
        }
      })
      .catch(console.error);
  }, []);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const response = await runSimulation({ country, attack_type: attackType });
      setResult(response);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const threatColorClass =
    result?.threat_level === 'HIGH'
      ? 'text-danger'
      : result?.threat_level === 'MEDIUM'
        ? 'text-warning'
        : 'text-success';

  return (
    <div className="h-full flex flex-col items-center justify-center">
      <div className="glass-card w-full max-w-3xl flex flex-col p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-neon/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>

        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
          <div className="bg-neon/10 p-4 rounded-full border border-neon/50">
            <BrainCircuit className="text-neon" size={32} />
          </div>
          <div>
            <h2 className="font-heading text-2xl">AI Threat Simulation</h2>
            <p className="text-sm text-textMuted font-data mt-1">"What-If" Analysis Engine v4.2</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 relative z-10 mb-8">
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase font-heading text-textMuted tracking-wider">Origination Node</label>
            <select
              className="bg-black/40 border border-white/10 p-3 rounded font-data text-white focus:border-neon outline-none"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
            >
              {countries.map((countryOption) => (
                <option key={countryOption.code} value={countryOption.code}>
                  {countryOption.name} ({countryOption.code})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase font-heading text-textMuted tracking-wider">Assault Vector</label>
            <select
              className="bg-black/40 border border-white/10 p-3 rounded font-data text-white focus:border-neon outline-none"
              value={attackType}
              onChange={(event) => setAttackType(event.target.value)}
            >
              {attackOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSimulate}
          disabled={loading || !country}
          className="bg-danger/20 hover:bg-danger text-danger hover:text-white border border-danger transition-all py-4 rounded font-heading tracking-widest text-[13px] uppercase flex items-center justify-center gap-2 mb-8 shadow-[0_0_15px_rgba(255,51,102,0.3)] disabled:opacity-60"
        >
          <Target size={16} />
          {loading ? 'Running AI Model...' : 'Execute Simulation'}
        </button>

        {result && (
          <div className="mt-4 bg-black/50 border border-border rounded p-6 shadow-xl animate-[fadeIn_0.5s_ease-out]">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
              <div className="font-heading">
                <span className="text-textMuted text-xs uppercase tracking-widest block mb-1">Threat Level</span>
                <span className={`text-2xl font-bold ${threatColorClass}`}>{result.threat_level}</span>
              </div>
              <div className="text-right">
                <span className="text-textMuted text-xs uppercase tracking-widest block mb-1">Success Probability</span>
                <span className="text-3xl font-data font-bold text-success">{result.success_probability}</span>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/5 rounded p-4">
                <span className="text-[10px] text-textMuted uppercase font-heading tracking-widest block mb-2">Threat Score</span>
                <span className="font-data text-2xl text-neon">{result.threat_score ?? '--'}</span>
              </div>
              <div className="bg-white/5 border border-white/5 rounded p-4">
                <span className="text-[10px] text-textMuted uppercase font-heading tracking-widest block mb-2">Reasoning</span>
                <span className="text-sm text-white/80 leading-relaxed">{result.reasoning}</span>
              </div>
            </div>

            <div className="mb-4">
              <span className="text-[10px] text-textMuted uppercase font-heading tracking-widest mb-2 block">Recommended Counters:</span>
              <div className="flex gap-2 flex-wrap">
                {result.recommended_counters.length > 0 ? (
                  result.recommended_counters.map((counter) => (
                    <span key={counter} className="bg-neon/10 border border-neon text-neon text-xs px-3 py-1 rounded font-data">
                      {counter}
                    </span>
                  ))
                ) : (
                  <span className="text-textMuted font-data text-sm">No recommended counters available.</span>
                )}
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded text-sm text-white/80 leading-relaxed font-body border-l-2 border-neon">
              {result.analysis}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
