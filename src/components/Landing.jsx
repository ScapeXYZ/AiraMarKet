import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  return (
    <main className="relative pt-36 pb-6 min-h-[calc(100vh-120px)] flex flex-col justify-between items-center px-4 md:px-8 flex-grow w-full max-w-5xl mx-auto z-10">
      <div className="w-full text-center flex flex-col items-center flex-grow justify-center max-w-3xl">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-primary/20 mb-3 bg-surface shadow-sm text-[9px] font-bold tracking-[0.25em] text-primary uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
          Autonomous Engine v2.4
        </div>
        
        <h1 className="serif-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.08] mb-3 text-on-surface tracking-tight font-extrabold">
          Where AI turns information into <span className="italic text-primary">markets.</span>
        </h1>
        
        <p className="max-w-2xl mx-auto text-on-surface-variant text-xs sm:text-sm md:text-base font-medium leading-relaxed mb-6 opacity-90 px-2">
          The world's first autonomous prediction ecosystem. AIRA scans petabytes of global data to generate precision markets before the news even breaks.
        </p>
        
        <div className="flex flex-row gap-4 justify-center items-center px-4 w-full mb-2">
          <button 
            className="px-6 sm:px-8 py-3.5 bg-primary text-white rounded-lg font-bold text-[10px] tracking-[0.2em] uppercase hover:bg-on-surface transition-colors shadow-lg shadow-primary/20"
            onClick={() => navigate('/creator')}
          >
            Launch AI Creator
          </button>
          <button 
            className="px-6 sm:px-8 py-3.5 bg-surface border border-outline text-on-surface rounded-lg font-bold text-[10px] tracking-[0.2em] uppercase hover:border-primary hover:text-primary transition-all"
            onClick={() => navigate('/feed')}
          >
            Explore Feed
          </button>
        </div>
      </div>
    </main>
  );
}
