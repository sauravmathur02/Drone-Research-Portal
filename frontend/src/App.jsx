import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Globe, Database, Scale, Shield, BrainCircuit, Activity, Settings2, Bell, Search, Flag } from 'lucide-react';
import AIHome from './pages/AIHome';
import GlobalCommand from './pages/GlobalCommand';
import DroneDatabase from './pages/DroneDatabase';
import ComparisonTool from './pages/ComparisonTool';
import CounterSystems from './pages/CounterSystems';
import Simulation from './pages/Simulation';
import AdminPanel from './pages/AdminPanel';
import CountryOverview from './pages/CountryOverview';
import SplashScreen from './components/SplashScreen';
import UpdatesPanel from './components/UpdatesPanel';
import ToastAlert from './components/ToastAlert';
import { getUpdates, subscribeToUpdates } from './services/api';

const routeTitles = {
  '/': 'Drone Intelligence Search',
  '/command': 'Tactical Overview',
  '/database': 'Drone Database',
  '/compare': 'Platform Comparison',
  '/counters': 'Counter-Drone Systems',
  '/countries': 'Global Arsenals',
  '/simulation': 'AI Simulation',
  '/admin': 'Admin Control',
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
  const [toast, setToast] = useState(null);

  const currentTitle = useMemo(
    () => routeTitles[location.pathname] || 'Tactical Overview',
    [location.pathname]
  );

  useEffect(() => {
    const loadUpdates = async () => {
      try {
        const response = await getUpdates({ limit: 40 });
        setUpdates(response);
      } catch (error) {
        console.error(error);
      }
    };

    loadUpdates();
    const interval = window.setInterval(loadUpdates, 10000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToUpdates(
      (update) => {
        setUpdates((current) => [update, ...current.filter((item) => item._id !== update._id)].slice(0, 60));
        setToast({
          title: update.title,
          message: update.summary,
        });
        setUnreadCount((current) => (isUpdatesPanelOpen ? 0 : current + 1));
      },
      (error) => {
        console.error('Updates stream error:', error);
      }
    );

    return unsubscribe;
  }, [isUpdatesPanelOpen]);

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

  if (location.pathname === '/') {
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
      />
      <ToastAlert toast={toast} onClose={() => setToast(null)} />

      <nav className="w-64 bg-panel backdrop-blur-glass border-r border-border flex flex-col z-50">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <Activity className="text-neon animate-pulse" size={24} />
          <h2 className="text-neon font-heading font-bold text-lg drop-shadow-[0_0_10px_rgba(0,243,255,0.8)]">DroneScope AI</h2>
        </div>
        <ul className="flex-grow py-4">
          <SidebarLink to="/" icon={<Search size={18} />} label="AI Search" />
          <SidebarLink to="/command" icon={<Globe size={18} />} label="Global Command" />
          <SidebarLink to="/database" icon={<Database size={18} />} label="Drone Database" />
          <SidebarLink to="/compare" icon={<Scale size={18} />} label="Comparison Tool" />
          <SidebarLink to="/countries" icon={<Flag size={18} />} label="Country Arsenals" />
          <SidebarLink to="/counters" icon={<Shield size={18} />} label="Counter-Drone" />
          <SidebarLink to="/simulation" icon={<BrainCircuit size={18} />} label="AI Simulation" />
          <SidebarLink to="/admin" icon={<Settings2 size={18} />} label="Admin Control" />
        </ul>
        <div className="p-5 border-t border-border font-data text-xs text-success flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_#00ff66] animate-pulse"></span>
          System Online
        </div>
      </nav>

      <main className="flex-grow flex flex-col relative overflow-y-auto custom-scrollbar">
        <header className="p-6 bg-gradient-to-b from-panel to-transparent flex justify-between items-center z-40 relative pointer-events-none">
          <div className="pointer-events-auto">
            <h1 className="text-2xl font-heading tracking-wider">{currentTitle}</h1>
          </div>

          <div className="flex items-center gap-3 pointer-events-auto">
            <button
              type="button"
              onClick={handleOpenUpdatesPanel}
              className="relative w-11 h-11 rounded border border-white/10 bg-black/30 flex items-center justify-center text-textMain hover:border-neon hover:text-neon transition-all"
            >
              <Bell size={18} />
              {unreadCount > 0 ? (
                <span className="absolute -top-2 -right-2 min-w-6 h-6 px-1 rounded-full bg-danger text-white text-[11px] font-data flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
            </button>

            <div className="font-data text-sm bg-neon/10 border border-border px-3 py-1 rounded text-neon">
              AUTH: cmnd-auth
            </div>
          </div>
        </header>

        <div className="p-6 pt-0 relative z-10 w-full h-full">
          <Routes>
            <Route path="/command" element={<GlobalCommand />} />
            <Route path="/database" element={<DroneDatabase />} />
            <Route path="/compare" element={<ComparisonTool />} />
            <Route path="/countries" element={<CountryOverview />} />
            <Route path="/counters" element={<CounterSystems />} />
            <Route path="/simulation" element={<Simulation />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function SidebarLink({ to, icon, label }) {
  return (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex items-center gap-3 px-6 py-4 cursor-pointer transition-all duration-300 font-semibold border-l-4 ${
            isActive
              ? 'bg-neon/10 text-neon border-neon shadow-[inset_50px_0_50px_-50px_rgba(0,243,255,0.2)]'
              : 'text-textMuted border-transparent hover:bg-neon/5 hover:text-neon'
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
