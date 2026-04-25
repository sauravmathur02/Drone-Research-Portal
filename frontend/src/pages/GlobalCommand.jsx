import React, { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, Circle } from 'react-leaflet';
import { getCountries, getDrones } from '../services/api';
import { calculateGeometricThreats, detectRiskPatterns } from '../utils/ThreatPredictor';
import { Brain, ShieldAlert, Activity, Globe, Layout, Layers, Shield, ChevronRight } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import DroneCard from '../components/DroneCard';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend);

export default function GlobalCommand() {
  const [countries, setCountries] = useState([]);
  const [drones, setDrones] = useState([]);
  const [threatZones, setThreatZones] = useState([]);
  const [showThreats, setShowThreats] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [countriesData, dronesData] = await Promise.all([getCountries(), getDrones()]);
        setCountries(countriesData);
        setDrones(dronesData);
        setThreatZones(calculateGeometricThreats(countriesData, dronesData));
      } catch (error) {
        console.error(error);
      }
    };

    loadData();
    const interval = window.setInterval(loadData, 10000);
    return () => window.clearInterval(interval);
  }, []);

  const chartData = {
    labels: countries.slice(0, 5).map((country) => country.name),
    datasets: [
      {
        label: 'Active UAVs',
        data: countries.slice(0, 5).map((country) => country.drone_count),
        backgroundColor: [
          'rgba(0, 243, 255, 0.8)',
          'rgba(255, 51, 102, 0.8)',
          'rgba(255, 153, 51, 0.8)',
          'rgba(0, 255, 102, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b9bb4', font: { family: 'Roboto Mono' } } },
      x: { grid: { display: false }, ticks: { color: '#8b9bb4', font: { family: 'Roboto Mono' } } },
    },
  };

  return (
    <div className="grid grid-cols-3 gap-6 h-full">
      <div className="col-span-2 flex flex-col gap-6">
        <div className="glass-card flex-grow relative overflow-hidden p-0">
          {/* Map Controls */}
          <div className="absolute top-4 left-4 z-[400] flex items-center gap-3">
            <div className="bg-panel/80 p-2 rounded border border-border backdrop-blur">
              <h3 className="font-heading text-lg flex items-center gap-2"><Globe size={16} className="text-neon" /> Global Live Threat Map</h3>
            </div>
            <button
              onClick={() => setShowThreats(!showThreats)}
              className={`flex items-center gap-2 px-3 py-2 rounded border backdrop-blur font-data text-[10px] uppercase tracking-wider transition-all ${
                showThreats ? 'bg-danger/20 border-danger/50 text-danger' : 'bg-panel/80 border-border text-textMuted hover:text-neon hover:border-neon'
              }`}
            >
              <ShieldAlert size={14} />
              Threat Patterns: {showThreats ? 'ON' : 'OFF'}
            </button>
          </div>

          <MapContainer center={[30, 20]} zoom={2} style={{ height: '100%', width: '100%', backgroundColor: '#050914' }} zoomControl={false}>
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="&copy; Esri"
            />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
              attribution="&copy; CartoDB"
            />

            {/* Threat Prediction Overlay */}
            {showThreats && threatZones.map(zone => (
              <Circle
                key={zone.id}
                center={zone.center}
                radius={zone.radius}
                pathOptions={{
                  color: zone.riskScore >= 60 ? '#ff3366' : '#ff9933',
                  fillColor: zone.riskScore >= 60 ? '#ff3366' : '#ff9933',
                  fillOpacity: 0.06,
                  weight: 1,
                  dashArray: '8, 6'
                }}
              >
                <Tooltip direction="top" opacity={1}>
                  <div className="font-data text-xs">
                    <div className="font-bold text-sm">{zone.baseName} — {zone.country}</div>
                    <div>Platform: {zone.dominantPlatform}</div>
                    <div>Operational Radius: {zone.radius / 1000}km</div>
                    <div>CTI Score: {zone.riskScore}/100 ({zone.cti?.classification || 'N/A'})</div>
                  </div>
                </Tooltip>
              </Circle>
            ))}

            {countries.map((country) =>
              country.lat && country.lng ? (
                <CircleMarker
                  key={country.code}
                  center={[country.lat, country.lng]}
                  radius={country.drone_count > 100 ? 12 : 8}
                  fillColor={country.code === 'CHN' || country.code === 'RUS' || country.code === 'IRN' ? '#ff3366' : '#00f3ff'}
                  color={country.code === 'CHN' || country.code === 'RUS' || country.code === 'IRN' ? '#ff3366' : '#00f3ff'}
                  weight={2}
                  opacity={0.8}
                  fillOpacity={0.4}
                >
                  <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                    <div className="font-body text-sm">
                      <strong>{country.name}</strong>
                      <div>Drones: {country.drone_count.toLocaleString()}</div>
                      <div>Specialization: {country.specialization}</div>
                    </div>
                  </Tooltip>
                  <Popup minWidth={280} className="tactical-popup">
                    <div className="p-0 overflow-hidden rounded-xl border border-none shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                      {(() => {
                        const topDroneName = country.top_drones[0];
                        const topDrone = drones.find(d => d.name.includes(topDroneName) || topDroneName.includes(d.name));
                        if (topDrone) {
                          return <DroneCard drone={topDrone} />;
                        }
                        return (
                          <div className="bg-[#050914] text-white p-4 font-data text-xs border border-[#00f3ff]/30 rounded-xl">
                            <div className="text-[#00f3ff] font-heading mb-2 uppercase tracking-widest">{country.name} Intelligence</div>
                            <div className="space-y-1 opacity-80">
                               <p>Specialization: {country.specialization}</p>
                               <p>Active Platforms: {country.drone_count}</p>
                            </div>
                          </div>
                        );
                      })()}
                      <div className="bg-black/80 px-4 py-2 border-t border-white/5 flex justify-between items-center group cursor-pointer hover:bg-neon/10 transition-colors">
                        <span className="text-[10px] font-heading text-white/50 uppercase">Access Full Intel</span>
                        <ChevronRight size={12} className="text-neon group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ) : null
            )}
          </MapContainer>
        </div>
      </div>

      <div className="col-span-1 flex flex-col gap-6">
        <div className="glass-card h-1/2 flex flex-col">
          <h3 className="font-heading mb-4 text-lg">Top 5 Drone Powers</h3>
          <div className="flex-grow relative">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="glass-card h-1/2 flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-lg text-danger">Intelligence Alerts</h3>
            <Shield size={16} className="text-danger" />
          </div>
          <div className="space-y-4 font-data text-sm">
            {detectRiskPatterns(threatZones).map((pattern, i) => (
              <div key={i} className="border-l-4 border-danger bg-danger/10 p-3 rounded-r animate-pulse">
                <div className="text-white font-bold flex items-center justify-between uppercase text-[10px]">
                  <span>{pattern.type}</span>
                  <Activity size={12} />
                </div>
                <div className="text-white/80 mt-1 text-[11px] leading-tight font-body">{pattern.reason}</div>
                <div className="text-textMuted mt-2 text-[9px] uppercase tracking-tighter">Impact Zone: {pattern.location}</div>
              </div>
            ))}
            {countries.slice(0, 3).map((country) => (
              <div key={country.code} className="border-l-4 border-warning bg-warning/10 p-3 rounded-r">
                <div className="text-white font-bold text-[10px] uppercase">
                  {country.name} <span className="text-warning float-right">+{country.growth_rate}% YoY</span>
                </div>
                <div className="text-textMuted mt-1 text-[11px]">{country.specialization}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
