import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Globe, Database, Scale, Shield, BrainCircuit, Activity, Settings2, Bell, Search, Flag, Crosshair, Menu, X, Bookmark } from 'lucide-react';
import AIHome from './pages/AIHome';
import GlobalCommand from './pages/GlobalCommand';
import DroneDatabase from './pages/DroneDatabase';
import ComparisonTool from './pages/ComparisonTool';
import CounterSystems from './pages/CounterSystems';
import Simulation from './pages/Simulation';
import AdminPanel from './pages/AdminPanel';
import CountryOverview from './pages/CountryOverview';
import Matchup from './pages/Matchup';
import SplashScreen from './components/SplashScreen';
import UpdatesPanel from './components/UpdatesPanel';
import { getUpdates, subscribeToUpdates } from './services/api';
import SearchAssistant from './components/SearchAssistant';
import SavedDrones from './pages/SavedDrones';

const routeTitles = {
  '/search': 'Drone Intelligence Search',
  '/command': 'Tactical Overview',
  '/database': 'Drone Database',
  '/compare': 'Platform Comparison',
  '/counters': 'Counter-Drone Systems',
  '/countries': 'Global Arsenals',
  '/simulation': 'AI Simulation',
  '/matchup': 'Threat Matchup',
  '/admin': 'Admin Control',
  '/saved': 'Saved Intelligence',
};

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showIntro, setShowIntro] = useState(true);
  const [updates, setUpdates] = useState([]);
  const [isUpdatesPanelOpen, setIsUpdatesPanelOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [clearedAt, setClearedAt] = useState(() => {
    const saved = localStorage.getItem('droneScope_clearedAt');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [compareCount, setCompareCount] = useState(0);

  const currentTitle = useMemo(
    () => routeTitles[location.pathname] || 'Tactical Overview',
    [location.pathname]
  );

  useEffect(() => {
    const updateCompareCount = () => {
      const saved = JSON.parse(localStorage.getItem('compareDrones') || '[]');
      setCompareCount(saved.length);
    };
    updateCompareCount();
    window.addEventListener('compareUpdated', updateCompareCount);
    return () => window.removeEventListener('compareUpdated', updateCompareCount);
  }, []);

  useEffect(() => {
    const loadUpdates = async () => {
      try {
        const response = await getUpdates({ limit: 40 });
        setUpdates(response.filter(u => new Date(u.timestamp || Date.now()).getTime() > clearedAt));
      } catch (error) {
        console.error(error);
      }
    };

    loadUpdates();
    const interval = window.setInterval(loadUpdates, 10000);

    return () => {
      window.clearInterval(interval);
    };
  }, [clearedAt]);

  useEffect(() => {
    const unsubscribe = subscribeToUpdates(
      (update) => {
        if (new Date(update.timestamp || Date.now()).getTime() <= clearedAt) return;
        setUpdates((current) => [update, ...current.filter((item) => item._id !== update._id)].slice(0, 60));
        setUnreadCount((current) => (isUpdatesPanelOpen ? 0 : current + 1));
      },
      (error) => {
        console.error('Updates stream error:', error);
      }
    );

    return unsubscribe;
  }, [isUpdatesPanelOpen, clearedAt]);

  const handleEnterCommand = () => {
    setShowIntro(false);
    navigate('/command');
  };

  const handleOpenUpdatesPanel = () => {
    setIsUpdatesPanelOpen(true);
    setUnreadCount(0);
  };

  const handleOpenDashboard = () => {
    setShowIntro(false);
    navigate('/command');
  };

  if (location.pathname === '/search') {
    return <AIHome onOpenDashboard={handleOpenDashboard} />;
  }

  if (showIntro) {
    return <SplashScreen onEnter={handleEnterCommand} />;
  }

  return (
    <div className="flex h-screen bg-dark text-textMain font-body overflow-hidden">
      <UpdatesPanel
        open={isUpdatesPanelOpen}
        updates={updates}
        onClose={() => setIsUpdatesPanelOpen(false)}
        onClearAll={() => { 
          setUpdates([]); 
          setUnreadCount(0); 
          const now = Date.now();
          setClearedAt(now); 
          localStorage.setItem('droneScope_clearedAt', now.toString());
        }}
      />
      <SearchAssistant />

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <nav className={`fixed lg:relative inset-y-0 left-0 w-64 bg-[#050505] border-r border-white/5 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="text-white" size={20} />
            <h2 className="text-white font-heading font-semibold text-lg tracking-tight">DroneScope AI</h2>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-textMuted hover:text-white">
            <X size={20} />
          </button>
        </div>
        <ul className="flex-grow py-4 overflow-y-auto">
          <SidebarLink to="/search" icon={<Search size={18} />} label="AI Search" onClick={() => setSidebarOpen(false)} />
          <SidebarLink to="/command" icon={<Globe size={18} />} label="Global Command" onClick={() => setSidebarOpen(false)} />
          <SidebarLink to="/database" icon={<Database size={18} />} label="Drone Database" onClick={() => setSidebarOpen(false)} />
          <SidebarLink to="/compare" icon={<Scale size={18} />} label="Comparison Tool" onClick={() => setSidebarOpen(false)} />
          <SidebarLink to="/saved" icon={<Bookmark size={18} />} label="Saved Drones" onClick={() => setSidebarOpen(false)} />
          <SidebarLink to="/countries" icon={<Flag size={18} />} label="Country Arsenals" onClick={() => setSidebarOpen(false)} />
          <SidebarLink to="/counters" icon={<Shield size={18} />} label="Counter-Drone" onClick={() => setSidebarOpen(false)} />
          <SidebarLink to="/matchup" icon={<Crosshair size={18} />} label="Threat Matchup" onClick={() => setSidebarOpen(false)} />
          <SidebarLink to="/simulation" icon={<BrainCircuit size={18} />} label="AI Simulation" onClick={() => setSidebarOpen(false)} />
          <SidebarLink to="/admin" icon={<Settings2 size={18} />} label="Admin Control" onClick={() => setSidebarOpen(false)} />
        </ul>
        <div className="p-5 border-t border-white/5 font-data text-[11px] text-white/50 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
          System Online
        </div>
      </nav>

      <main className="flex-grow flex flex-col relative overflow-y-auto custom-scrollbar">
        <header className="p-6 md:p-8 pb-4 flex justify-between items-center z-40 relative pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-10 h-10 rounded-md border border-white/10 bg-transparent flex items-center justify-center text-textMuted hover:border-white/30 hover:text-white transition-all">
              <Menu size={18} />
            </button>
            <h1 className="text-2xl md:text-3xl font-heading font-medium tracking-tight text-white">{currentTitle}</h1>
          </div>

          <div className="flex items-center gap-3 pointer-events-auto">
            {compareCount > 0 && (
              <button
                onClick={() => { setShowIntro(false); navigate('/compare'); }}
                className="font-heading text-xs bg-neon/10 border border-neon/30 text-neon px-3 py-1.5 rounded-md hover:bg-neon/20 transition-all flex items-center gap-2"
              >
                <Scale size={14} /> Compare ({compareCount})
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenUpdatesPanel}
              className="relative w-10 h-10 rounded-full border border-white/10 bg-transparent flex items-center justify-center text-textMuted hover:border-white/30 hover:text-white transition-all"
            >
              <Bell size={18} />
              {unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-neon text-dark text-[10px] font-medium flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
            </button>

            <div className="font-data text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-md text-textMuted hidden md:block">
              AUTH: cmnd-auth
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 pt-0 relative z-10 w-full h-full">
          <Routes>
            <Route path="/" element={<Navigate to="/command" replace />} />
            <Route path="/command" element={<GlobalCommand />} />
            <Route path="/database" element={<DroneDatabase />} />
            <Route path="/saved" element={<SavedDrones />} />
            <Route path="/compare" element={<ComparisonTool />} />
            <Route path="/countries" element={<CountryOverview />} />
            <Route path="/counters" element={<CounterSystems />} />
            <Route path="/matchup" element={<Matchup />} />
            <Route path="/simulation" element={<Simulation />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function SidebarLink({ to, icon, label, onClick }) {
  return (
    <li>
      <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
          `flex items-center gap-3 mx-3 px-3 py-2.5 my-1 rounded-lg cursor-pointer transition-all duration-200 font-medium text-sm ${
            isActive
              ? 'bg-white/10 text-white'
              : 'text-textMuted hover:bg-white/5 hover:text-white'
          }`
        }
      >
        {icon}
        {label}
      </NavLink>
    </li>
  );
}

export default App;
