import React, { useEffect, useState } from 'react';
import { getDrones } from '../services/api';
import { Scale } from 'lucide-react';

const specAccessors = {
  price_usd: (drone) => drone.specs?.price_usd || 0,
  range_km: (drone) => drone.specs?.range_km || 0,
  endurance_hr: (drone) => drone.specs?.endurance_hr || 0,
  payload_kg: (drone) => drone.specs?.payload_kg || 0,
  speed_kmh: (drone) => drone.specs?.speed_kmh || 0,
  maintenance_cost_per_hr: (drone) => drone.specs?.maintenance_cost_per_hr || 0,
};

function SpecRow({ drone1, drone2, label, propName, unit = '', reverseLogic = false }) {
  if (!drone1 || !drone2) return null;

  const value1 = specAccessors[propName](drone1);
  const value2 = specAccessors[propName](drone2);

  let p1Win = value1 > value2;
  let p2Win = value2 > value1;

  if (reverseLogic) {
    p1Win = value1 < value2;
    p2Win = value2 < value1;
  }

  if (value1 === value2) {
    p1Win = false;
    p2Win = false;
  }

  return (
    <div className="grid grid-cols-3 border-b border-white/5 py-4 items-center">
      <div className={`text-center font-data text-lg ${p1Win ? 'text-success font-bold drop-shadow-[0_0_5px_#00ff66]' : 'text-textMuted'}`}>
        {value1.toLocaleString()} {unit}
      </div>
      <div className="text-center font-heading text-[11px] text-textMuted uppercase tracking-widest">{label}</div>
      <div className={`text-center font-data text-lg ${p2Win ? 'text-success font-bold drop-shadow-[0_0_5px_#00ff66]' : 'text-textMuted'}`}>
        {value2.toLocaleString()} {unit}
      </div>
    </div>
  );
}

export default function ComparisonTool() {
  const [drones, setDrones] = useState([]);
  const [drone1, setDrone1] = useState(null);
  const [drone2, setDrone2] = useState(null);

  useEffect(() => {
    getDrones()
      .then((response) => {
        setDrones(response);
        if (response.length > 1) {
          setDrone1(response[0]);
          setDrone2(response[1]);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="h-full flex flex-col items-center">
      <div className="glass-card w-full max-w-5xl flex flex-col h-full">
        <div className="flex justify-between border-b border-border pb-5 mb-5 items-center">
          <select
            className="bg-black/50 border border-neon/50 text-neon p-3 rounded font-heading w-[40%] outline-none focus:border-neon"
            value={drone1 ? drone1._id : ''}
            onChange={(event) => setDrone1(drones.find((drone) => drone._id === event.target.value))}
          >
            {drones.map((drone) => <option key={`left-${drone._id}`} value={drone._id}>{drone.name} ({drone.country})</option>)}
          </select>

          <div className="w-[10%] flex justify-center text-border">
            <Scale size={42} strokeWidth={1} />
          </div>

          <select
            className="bg-black/50 border border-neon/50 text-neon p-3 rounded font-heading w-[40%] outline-none focus:border-neon"
            value={drone2 ? drone2._id : ''}
            onChange={(event) => setDrone2(drones.find((drone) => drone._id === event.target.value))}
          >
            {drones.map((drone) => <option key={`right-${drone._id}`} value={drone._id}>{drone.name} ({drone.country})</option>)}
          </select>
        </div>

        {drone1 && drone2 && (
          <div className="flex-grow overflow-y-auto">
            <SpecRow drone1={drone1} drone2={drone2} label="Price" propName="price_usd" unit="$" reverseLogic={true} />
            <SpecRow drone1={drone1} drone2={drone2} label="Effective Range" propName="range_km" unit="km" />
            <SpecRow drone1={drone1} drone2={drone2} label="Flight Endurance" propName="endurance_hr" unit="h" />
            <SpecRow drone1={drone1} drone2={drone2} label="Payload Capacity" propName="payload_kg" unit="kg" />
            <SpecRow drone1={drone1} drone2={drone2} label="Top Speed" propName="speed_kmh" unit="km/h" />
            <SpecRow drone1={drone1} drone2={drone2} label="Maintenance Cost/Hour" propName="maintenance_cost_per_hr" unit="$" reverseLogic={true} />
          </div>
        )}
      </div>
    </div>
  );
}
