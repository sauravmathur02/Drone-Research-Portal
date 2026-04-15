import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getCountries } from '../services/api';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend);

export default function GlobalCommand() {
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    const loadCountries = () => {
      getCountries().then(setCountries).catch(console.error);
    };

    loadCountries();
    const interval = window.setInterval(loadCountries, 10000);

    return () => {
      window.clearInterval(interval);
    };
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
          <div className="absolute top-4 left-4 z-[400] bg-panel/80 p-2 rounded border border-border backdrop-blur">
            <h3 className="font-heading text-lg flex items-center gap-2"><span className="text-neon">*</span> Global Live Threat Map</h3>
          </div>
          <MapContainer center={[30, 20]} zoom={2} style={{ height: '100%', width: '100%', backgroundColor: '#050914' }} zoomControl={false}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; CartoDB"
            />
            {countries.map((country) =>
              country.lat && country.lng ? (
                <CircleMarker
                  key={country.code}
                  center={[country.lat, country.lng]}
                  radius={country.drone_count > 10000 ? 12 : 8}
                  fillColor={country.code === 'CHN' || country.code === 'RUS' ? '#ff3366' : '#00f3ff'}
                  color={country.code === 'CHN' || country.code === 'RUS' ? '#ff3366' : '#00f3ff'}
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
                  <Popup>
                    <div className="font-body">
                      <strong className="text-lg text-neon font-heading">{country.name}</strong><br />
                      <span className="text-textMuted font-data text-xs uppercase mb-2 block">
                        Drones: {country.drone_count.toLocaleString()}
                      </span>
                      <div className="bg-black/40 p-2 rounded text-sm">
                        Focus: <span className="text-warning">{country.specialization}</span><br />
                        Core Tech: {country.top_drones.join(', ')}
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
          <h3 className="font-heading mb-4 text-lg text-danger">High Threat Trajectories</h3>
          <div className="space-y-4 font-data text-sm">
            {countries.map((country) => (
              <div key={country.code} className="border-l-4 border-danger bg-danger/10 p-3 rounded-r">
                <div className="text-white font-bold">
                  {country.name} <span className="text-danger float-right">+{country.growth_rate}% YoY</span>
                </div>
                <div className="text-textMuted mt-1">{country.specialization}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
