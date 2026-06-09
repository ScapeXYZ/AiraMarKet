import React from 'react';
import './App.css';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import useAppStore from './store/useAppStore';

import Landing from './components/Landing';
import Leaderboard from './components/Leaderboard';
import Feed from './components/Feed';
import CreatorLab from './components/CreatorLab';
import Terminal from './components/Terminal';
import Portfolio from './components/Portfolio';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentView = location.pathname.substring(1) || 'landing';

  // Global State (Zustand)
  const isDarkMode = useAppStore(state => state.isDarkMode);
  const toggleTheme = useAppStore(state => state.toggleTheme);
  const profileData = useAppStore(state => state.profileData);

  return (
    <div className="min-h-[105vh] bg-background text-on-surface selection:bg-primary/20 flex flex-col w-full overflow-x-clip">
      {/* Background Texture Pattern dot grid */}
      <div className="fixed inset-0 sand-pattern pointer-events-none z-0"></div>

      {/* Top Navigation */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-12 h-20 bg-surface/90 backdrop-blur-md border-b border-outline-variant">
        <div className="flex items-center gap-10">
          <span 
            className="font-bold text-xl tracking-tight sahara-gradient-text uppercase cursor-pointer font-display"
            onClick={() => navigate('/landing')}
          >
            AIRA MARKETS
          </span>
          <nav className="hidden md:flex gap-8">
            <button 
              className={`font-semibold text-sm pb-1 transition-all ${currentView === 'landing' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`}
              onClick={() => navigate('/landing')}
            >
              Markets
            </button>
            <button 
              className={`font-semibold text-sm pb-1 transition-all ${currentView === 'feed' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`}
              onClick={() => navigate('/feed')}
            >
              Core Feed
            </button>
            <button 
              className={`font-semibold text-sm pb-1 transition-all ${currentView === 'creator' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`}
              onClick={() => navigate('/creator')}
            >
              AI Agent
            </button>
            <button 
              className={`font-semibold text-sm pb-1 transition-all ${currentView === 'terminal' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`}
              onClick={() => navigate('/terminal')}
            >
              Terminal
            </button>
            <button 
              className={`font-semibold text-sm pb-1 transition-all ${currentView === 'leaderboard' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`}
              onClick={() => navigate('/leaderboard')}
            >
              Leaderboard
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center bg-surface-variant rounded-full px-5 py-2 border border-outline-variant">
            <span className="material-symbols-outlined text-on-surface-variant text-lg mr-2">search</span>
            <input 
              className="bg-transparent border-none outline-none text-sm font-medium w-48 text-on-surface placeholder:text-on-surface-variant/60 focus:ring-0" 
              placeholder="Search markets..." 
              type="text"
            />
          </div>
          <div className="flex items-center gap-4 relative">
            <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-all flex items-center justify-center">sensors</button>
            
            <div className="relative flex items-center">
              <ConnectButton showBalance={false} chainStatus="none" />
            </div>
            
            <button 
              className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-all p-2 rounded-full hover:bg-surface-variant/40 flex items-center justify-center"
              onClick={toggleTheme}
              title={isDarkMode ? "Switch to Day Mode" : "Switch to Night Mode"}
            >
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </button>

            <div className="relative flex items-center justify-center">
              <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-all flex items-center justify-center">notifications</button>
              <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full ring-2 ring-surface"></span>
            </div>
            <div className="h-10 w-10 rounded-full border-2 border-outline-variant p-0.5" onClick={() => navigate('/portfolio')} title="View Portfolio">
              <img 
                alt="User avatar" 
                className="w-full h-full rounded-full object-cover grayscale hover:grayscale-0 transition-all cursor-pointer" 
                src={profileData.picture}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main View Area Routing */}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/creator" element={<CreatorLab />} />
        <Route path="/terminal" element={<Terminal />} />
        <Route path="/leaderboard" element={<Leaderboard profileData={profileData} />} />
        <Route path="/portfolio" element={<Portfolio />} />
      </Routes>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 pb-safe bg-surface/95 backdrop-blur-xl border-t border-outline-variant shadow-lg">
        <button 
          className={`flex flex-col items-center gap-1 transition-all ${currentView === 'landing' ? 'text-primary font-bold' : 'text-on-surface-variant opacity-60'}`}
          onClick={() => navigate('/landing')}
        >
          <span className="material-symbols-outlined">explore</span>
          <span className="text-[9px] font-bold uppercase tracking-widest font-mono">Markets</span>
        </button>
        <button 
          className={`flex flex-col items-center gap-1 transition-all ${currentView === 'feed' ? 'text-primary font-bold' : 'text-on-surface-variant opacity-60'}`}
          onClick={() => navigate('/feed')}
        >
          <span className="material-symbols-outlined">explore</span>
          <span className="text-[9px] font-bold uppercase tracking-widest font-mono">Core Feed</span>
        </button>
        <button 
          className={`flex flex-col items-center gap-1 transition-all ${currentView === 'creator' ? 'text-primary font-bold' : 'text-on-surface-variant opacity-60'}`}
          onClick={() => navigate('/creator')}
        >
          <span className="material-symbols-outlined">smart_toy</span>
          <span className="text-[9px] font-bold uppercase tracking-widest font-mono">AI Creator</span>
        </button>
        <button 
          className={`flex flex-col items-center gap-1 transition-all ${currentView === 'terminal' ? 'text-primary font-bold' : 'text-on-surface-variant opacity-60'}`}
          onClick={() => navigate('/terminal')}
        >
          <span className="material-symbols-outlined">account_balance</span>
          <span className="text-[9px] font-bold uppercase tracking-widest font-mono">Terminal</span>
        </button>
        <button 
          className={`flex flex-col items-center gap-1 transition-all ${currentView === 'leaderboard' ? 'text-primary font-bold' : 'text-on-surface-variant opacity-60'}`}
          onClick={() => navigate('/leaderboard')}
        >
          <span className="material-symbols-outlined">leaderboard</span>
          <span className="text-[9px] font-bold uppercase tracking-widest font-mono">Top Traders</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
