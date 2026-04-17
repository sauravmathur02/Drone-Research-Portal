import React, { useState, useEffect, Suspense } from 'react';
import { Loader2, Flag, ChevronDown, ChevronRight, Crosshair, Shield, X, Box } from 'lucide-react';
import { getCountries, getDrones } from '../services/api';

const Drone3DModal = React.lazy(() => import('../components/Drone3DModal'));



export default function CountryOverview() {
  const [countries, setCountries] = useState([]);
  const [drones, setDrones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCountry, setExpandedCountry] = useState(null);
  const [selectedDrone, setSelectedDrone] = useState(null);

  useEffect(() => {
    Promise.all([getCountries(), getDrones()])
      .then(([countriesData, dronesData]) => {
        setCountries(countriesData);
        setDrones(dronesData);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const toggleCountry = (code) => {
    setExpandedCountry(expandedCountry === code ? null : code);
  };

  if (loading) {
    return (
      <div className="flex w-full h-64 items-center justify-center">
        <Loader2 className="animate-spin text-neon" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 border-b border-border pb-4">
        <h2 className="font-heading text-xl text-white flex items-center gap-2">
          <Flag className="text-neon" size={20} />
          Global Arsenals Overview
        </h2>
        <p className="text-textMuted text-sm font-data mt-2">
          Explore known autonomous platforms filtered by their host nation
        </p>
      </div>

      <div className="grid gap-4">
        {countries.map((country) => {
          const isExpanded = expandedCountry === country.code;
          const countryDrones = drones.filter(d => d.country === country.name || d.country === country.code);

          return (
            <div 
              key={country.code} 
              className={`rounded-lg border border-border bg-panel overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-1 ring-neon/50 shadow-[0_0_15px_rgba(0,243,255,0.15)]' : 'hover:border-neon/30'}`}
            >
              <div 
                className="p-5 cursor-pointer flex items-center justify-between hover:bg-white/[0.02]"
                onClick={() => toggleCountry(country.code)}
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 flex items-center justify-center bg-black/40 rounded-full border border-white/10 font-heading text-neon tracking-widest text-sm">
                    {country.code}
                  </div>
                  <div>
                    <h3 className="text-lg font-heading text-white">{country.name}</h3>
                    <div className="flex gap-4 mt-1 font-data text-xs text-textMuted">
                      <span className="flex items-center gap-1">
                        <Crosshair size={12} className="text-danger" /> 
                        {countryDrones.length} Verified Platforms
                      </span>
                      <span className="flex items-center gap-1">
                        <Shield size={12} className="text-warning" />
                        {country.specialization || 'General Purpose'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-textMuted">
                  {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-border bg-black/20 p-5">
                  {countryDrones.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {countryDrones.map(drone => (
                        <div 
                          key={drone._id} 
                          className="group cursor-pointer rounded bg-panel overflow-hidden border border-white/10 hover:border-neon/50 hover:shadow-[0_0_20px_rgba(0,243,255,0.15)] transition-all"
                          onClick={() => setSelectedDrone(drone)}
                        >
                          <div className="h-32 w-full overflow-hidden rounded-t-lg relative">
                            <img
                              src={drone.photo_url}
                              alt={drone.name}
                              loading="lazy"
                              onError={(e) => { e.target.onerror = null; e.target.src = "/drones/default.jpg"; }}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <span className="absolute top-2 right-2 text-[10px] uppercase font-data tracking-widest text-neon bg-black/80 border border-neon/50 px-2 py-1 rounded z-10">
                              {drone.type}
                            </span>
                          </div>

                          <div className="p-4 relative z-10 bg-panel/90">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-heading text-white group-hover:text-neon transition-colors">{drone.name}</h4>
                            </div>
                            <p className="text-xs text-textMuted mb-3 line-clamp-2 min-h-[32px]">
                              {drone.description}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs font-data border-t border-white/5 pt-3">
                              <div>
                                <span className="text-textMuted block text-[10px]">RANGE</span>
                                <span className="text-white">{drone.specs.range_km} km</span>
                              </div>
                              <div>
                                <span className="text-textMuted block text-[10px]">PAYLOAD</span>
                                <span className="text-white">{drone.specs.payload_kg} kg</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 font-data text-sm text-textMuted">
                      No specific platform data available for {country.name} currently.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedDrone && (
        <Suspense fallback={null}>
          <Drone3DModal drone={selectedDrone} onClose={() => setSelectedDrone(null)} />
        </Suspense>
      )}
    </div>
  );
}
