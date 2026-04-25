import React, { useEffect, useState, Suspense } from 'react';
import { X, Box, Loader2, Search, Zap, Shield, Crosshair, Gauge } from 'lucide-react';
import { getDrones } from '../services/api';

import Drone3DModal from '../components/Drone3DModal';
import DroneListRow from '../components/DroneListRow';
import DroneIntelligencePanel from '../components/DroneIntelligencePanel';

const TYPES = ['All', 'Nano', 'Tactical', 'MALE', 'HALE', 'UCAV', 'Loitering', 'Swarm'];

export default function DroneDatabase() {
  const [drones, setDrones] = useState([]);
  const [filter, setFilter] = useState('All');
  const [selectedDrone, setSelectedDrone] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch drones from backend
  useEffect(() => {
    const fetchDrones = async () => {
      setIsLoading(true);
      const params = {};
      if (filter !== 'All') params.type = filter;
      if (debouncedSearch.trim()) params.search = debouncedSearch;

      try {
        let data = await getDrones(params);
        
        // Client-side sorting
        data.sort((a, b) => {
          let valA = a[sortBy];
          let valB = b[sortBy];
          
          if (sortBy === 'range') { valA = a.specs?.range_km || 0; valB = b.specs?.range_km || 0; }
          if (sortBy === 'speed') { valA = a.specs?.speed_kmh || 0; valB = b.specs?.speed_kmh || 0; }
          if (sortBy === 'endurance') { valA = a.specs?.endurance_hr || 0; valB = b.specs?.endurance_hr || 0; }

          if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
          if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        });

        setDrones(data);
        if (data.length > 0 && !selectedDrone) {
          setSelectedDrone(data[0]); // Auto-select first
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDrones();
  }, [filter, debouncedSearch, sortBy, sortOrder]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't interfere if user is typing in the search box
      if (document.activeElement.tagName === 'INPUT') return;
      
      if (drones.length === 0) return;
      
      const currentIndex = drones.findIndex(d => d._id === selectedDrone?._id);
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = currentIndex < drones.length - 1 ? currentIndex + 1 : 0;
        setSelectedDrone(drones[nextIndex]);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : drones.length - 1;
        setSelectedDrone(drones[prevIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drones, selectedDrone]);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-6">
      
      {/* LEFT PANEL: Smart Drone List */}
      <div className="w-full lg:w-[450px] flex flex-col gap-4 h-full shrink-0">
        
        {/* Search + Controls */}
        <div className="bg-panel border border-white/5 rounded-xl p-4 shrink-0 space-y-4">
          <div className="relative group">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-neon transition-colors pointer-events-none" />
            <input
              type="text"
              placeholder="Search registry..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 pl-10 pr-4 py-2.5 rounded-lg font-data text-sm text-white outline-none focus:border-neon focus:bg-white/5 transition-all placeholder:text-white/30"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
            {TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1.5 rounded-md font-heading text-[10px] uppercase tracking-widest whitespace-nowrap transition-all duration-200 ${
                  filter === type
                    ? 'bg-neon text-dark font-bold'
                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-3">
             <div className="text-[10px] font-data text-white/40 uppercase tracking-widest">
               {drones.length} Platforms Found
             </div>
             <div className="flex items-center gap-2">
               <select 
                 className="bg-transparent border-none text-[10px] font-data text-white/70 uppercase tracking-widest outline-none cursor-pointer"
                 value={sortBy}
                 onChange={e => setSortBy(e.target.value)}
               >
                 <option value="name">Sort: Name</option>
                 <option value="range">Sort: Range</option>
                 <option value="speed">Sort: Speed</option>
                 <option value="endurance">Sort: Endurance</option>
               </select>
               <button 
                 onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                 className="text-white/50 hover:text-white text-[10px] font-data uppercase"
               >
                 {sortOrder === 'asc' ? '▲' : '▼'}
               </button>
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 pb-6">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-20 bg-white/5 border border-white/5 rounded-xl animate-pulse flex items-center p-3 gap-4">
                  <div className="w-16 h-12 bg-black/40 rounded-lg shrink-0"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-3 bg-white/10 rounded-full w-1/3"></div>
                    <div className="h-2 bg-white/5 rounded-full w-1/4"></div>
                  </div>
                  <div className="w-8 h-8 bg-black/20 rounded-full shrink-0"></div>
                </div>
              ))}
            </div>
          ) : drones.length === 0 ? (
            <div className="text-center py-16 text-textMuted font-data space-y-2">
              <Search size={32} strokeWidth={1} className="mx-auto text-white/10" />
              <p className="text-xs">No platforms match criteria.</p>
            </div>
          ) : (
            drones.map((drone) => (
              <DroneListRow 
                key={drone._id} 
                drone={drone} 
                isSelected={selectedDrone?._id === drone._id}
                onClick={() => setSelectedDrone(drone)} 
              />
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Intelligence Detail */}
      <div className="hidden lg:block flex-1 h-full min-w-0 pb-6">
         <DroneIntelligencePanel drone={selectedDrone} />
      </div>

      {/* Mobile Modal Fallback */}
      <div className="lg:hidden">
        {selectedDrone && (
          <Drone3DModal drone={selectedDrone} onClose={() => setSelectedDrone(null)} />
        )}
      </div>
    </div>
  );
}

