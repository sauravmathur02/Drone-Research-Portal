import React, { useEffect, useState } from 'react';
import { Search, Loader2, BookmarkX } from 'lucide-react';
import { getDrones } from '../services/api';
import DroneListRow from '../components/DroneListRow';
import DroneIntelligencePanel from '../components/DroneIntelligencePanel';
import Drone3DModal from '../components/Drone3DModal';

export default function SavedDrones() {
  const [drones, setDrones] = useState([]);
  const [selectedDrone, setSelectedDrone] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSavedDrones = async () => {
    setIsLoading(true);
    try {
      const data = await getDrones({});
      const savedIds = JSON.parse(localStorage.getItem('bookmarkedDrones') || '[]');
      const saved = data.filter(d => savedIds.includes(d._id));
      setDrones(saved);
      if (saved.length > 0 && (!selectedDrone || !savedIds.includes(selectedDrone._id))) {
        setSelectedDrone(saved[0]);
      } else if (saved.length === 0) {
        setSelectedDrone(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedDrones();
    
    // Listen for bookmark updates from Intelligence Panel
    const handleBookmarkUpdate = () => {
      fetchSavedDrones();
    };
    window.addEventListener('bookmarkUpdated', handleBookmarkUpdate);
    
    // Keyboard Navigation
    const handleKeyDown = (e) => {
      // Don't interfere if user is typing in the search box
      if (document.activeElement.tagName === 'INPUT') return;
      
      setDrones(currentDrones => {
        if (currentDrones.length === 0) return currentDrones;
        setSelectedDrone(currentSelected => {
          const currentIndex = currentDrones.findIndex(d => d._id === currentSelected?._id);
          
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = currentIndex < currentDrones.length - 1 ? currentIndex + 1 : 0;
            return currentDrones[nextIndex];
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : currentDrones.length - 1;
            return currentDrones[prevIndex];
          }
          return currentSelected;
        });
        return currentDrones;
      });
    };
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('bookmarkUpdated', handleBookmarkUpdate);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-6">
      {/* LEFT PANEL: Smart Drone List */}
      <div className="w-full lg:w-[450px] flex flex-col gap-4 h-full shrink-0">
        <div className="bg-panel border border-white/5 rounded-xl p-4 shrink-0">
          <h2 className="font-heading text-lg text-white mb-2 tracking-wide">Saved Intelligence</h2>
          <p className="font-data text-xs text-white/50">Your bookmarked high-priority platforms.</p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 pb-6">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
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
            <div className="text-center py-16 text-textMuted font-data space-y-3">
              <BookmarkX size={32} strokeWidth={1} className="mx-auto text-white/10" />
              <p className="text-xs">No platforms saved yet.</p>
              <p className="text-[10px] opacity-50">Bookmark drones from the database to view them here.</p>
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
         {selectedDrone ? (
           <DroneIntelligencePanel drone={selectedDrone} />
         ) : (
           <div className="h-full flex items-center justify-center border border-white/5 border-dashed rounded-2xl bg-black/20">
             <div className="text-center">
               <BookmarkX size={48} className="mx-auto mb-4 text-white/20" strokeWidth={1} />
               <p className="font-heading text-white/40 uppercase tracking-widest text-sm">No Drone Selected</p>
             </div>
           </div>
         )}
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
