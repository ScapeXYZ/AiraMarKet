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
  const toast = useAppStore(state => state.toast);
  const hideToast = useAppStore(state => state.hideToast);

  const colors = {
    success: 'bg-bullish-green text-white border-bullish-green/50',
    error: 'bg-bearish-red text-white border-bearish-red/50',
    info: 'bg-surface border-outline-variant text-on-surface'
  };

  const icons = {
    success: 'check_circle',
    error: 'error',
    info: 'info'
  };
  return (
    <div className="min-h-[105vh] bg-background text-on-surface selection:bg-primary/20 flex flex-col w-full overflow-x-clip">
      {/* Background Texture Pattern dot grid */}
      <div className="fixed inset-0 sand-pattern pointer-events-none z-0"></div>

      {/* Top Navigation */}
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-3 md:px-12 h-20 bg-surface/90 backdrop-blur-md border-b border-outline-variant">
        <div className="flex items-center gap-4 md:gap-10">
          <span 
            className="font-bold text-base sm:text-lg md:text-xl tracking-tight sahara-gradient-text uppercase cursor-pointer font-display shrink-0"
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
        <div className="flex items-center gap-2 md:gap-6">
          <div className="flex items-center gap-1.5 sm:gap-4 relative">
            
            <div className="relative flex items-center shrink-0">
              <ConnectButton showBalance={false} chainStatus="none" />
            </div>
            
            <button 
              className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-all p-1.5 rounded-full hover:bg-surface-variant/40 flex items-center justify-center text-lg sm:text-xl"
              onClick={toggleTheme}
              title={isDarkMode ? "Switch to Day Mode" : "Switch to Night Mode"}
            >
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </button>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border-2 border-outline-variant p-0.5 shrink-0" onClick={() => navigate('/portfolio')} title="View Portfolio">
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
          <span className="material-symbols-outlined text-xl">dashboard</span>
          <span className="text-[8px] font-bold uppercase tracking-widest font-mono">Markets</span>
        </button>
        <button 
          className={`flex flex-col items-center gap-1 transition-all ${currentView === 'feed' ? 'text-primary font-bold' : 'text-on-surface-variant opacity-60'}`}
          onClick={() => navigate('/feed')}
        >
          <span className="material-symbols-outlined text-xl">explore</span>
          <span className="text-[8px] font-bold uppercase tracking-widest font-mono">Core Feed</span>
        </button>
        <button 
          className={`flex flex-col items-center gap-1 transition-all ${currentView === 'creator' ? 'text-primary font-bold' : 'text-on-surface-variant opacity-60'}`}
          onClick={() => navigate('/creator')}
        >
          <span className="material-symbols-outlined text-xl">smart_toy</span>
          <span className="text-[8px] font-bold uppercase tracking-widest font-mono">AI Creator</span>
        </button>
        <button 
          className={`flex flex-col items-center gap-1 transition-all ${currentView === 'terminal' ? 'text-primary font-bold' : 'text-on-surface-variant opacity-60'}`}
          onClick={() => navigate('/terminal')}
        >
          <span className="material-symbols-outlined text-xl">candlestick_chart</span>
          <span className="text-[8px] font-bold uppercase tracking-widest font-mono">Terminal</span>
        </button>
        <button 
          className={`flex flex-col items-center gap-1 transition-all ${currentView === 'leaderboard' ? 'text-primary font-bold' : 'text-on-surface-variant opacity-60'}`}
          onClick={() => navigate('/leaderboard')}
        >
          <span className="material-symbols-outlined text-xl">leaderboard</span>
          <span className="text-[8px] font-bold uppercase tracking-widest font-mono">Top Traders</span>
        </button>
      </nav>
      {/* Global Toast Notification */}
      {toast && (
        <div className={`fixed bottom-24 md:bottom-8 right-4 md:right-8 z-[100] flex flex-col gap-1 p-4 rounded-xl shadow-2xl border ${colors[toast.type]} animate-subtle-fade min-w-[300px] max-w-[400px]`}>
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">{icons[toast.type]}</span>
              <span className="font-bold text-[10px] uppercase tracking-widest font-mono">{toast.title}</span>
            </div>
            <button onClick={hideToast} className="opacity-50 hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          <p className="text-xs opacity-90 leading-relaxed font-medium">{toast.message}</p>
          {toast.hash && (
            <div className="mt-2 flex flex-col gap-1 border-t border-white/20 pt-2">
              <span className="text-[9px] font-mono opacity-60">
                CONTRACT: {import.meta.env.VITE_MANTLE_CONTRACT_ADDRESS || "0xDD277CCB8cDa72D652CdcA4df09df5f2522fc846"}
              </span>
              <a 
                href={`https://explorer.sepolia.mantle.xyz/tx/${toast.hash}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] font-bold font-mono underline opacity-80 hover:opacity-100 flex items-center gap-1"
              >
                VIEW ON MANTLE EXPLORER
                <span className="material-symbols-outlined text-[10px]">open_in_new</span>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
