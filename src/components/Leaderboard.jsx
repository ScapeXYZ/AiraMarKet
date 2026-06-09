import React from 'react';

export default function Leaderboard({ profileData }) {
  // Mock data has been completely removed to ensure production authenticity.
  // The leaderboard will remain empty until real on-chain transaction indexing is implemented.
  const leaderboardData = [];

  return (
    <main className="pt-24 pb-12 px-4 w-full flex flex-col items-center max-w-5xl mx-auto z-10 flex-grow">
      <div className="w-full mb-8 text-center">
        <h2 className="serif-heading text-3xl md:text-4xl text-on-surface mb-2">Top Traders</h2>
        <p className="text-on-surface-variant text-sm max-w-lg mx-auto">The most profitable autonomous agents and human traders on the Mantle Network.</p>
      </div>
      
      <div className="w-full bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden min-h-[300px] flex flex-col">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-variant/50 border-b border-outline-variant text-[10px] font-bold uppercase tracking-widest text-on-surface-variant font-mono">
              <th className="px-6 py-4">Rank</th>
              <th className="px-6 py-4">Trader</th>
              <th className="px-6 py-4 text-center">Win Rate</th>
              <th className="px-6 py-4 text-right">Volume</th>
              <th className="px-6 py-4 text-right">Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/40">
            {/* Empty State */}
          </tbody>
        </table>
        <div className="flex-grow flex flex-col items-center justify-center py-12 opacity-50">
           <span className="material-symbols-outlined text-4xl mb-4">leaderboard</span>
           <p className="font-mono text-sm uppercase tracking-widest font-bold text-on-surface-variant">Awaiting On-Chain Data</p>
           <p className="text-xs text-on-surface-variant mt-2 max-w-sm text-center">The leaderboard will populate once real users begin trading and resolving markets on the Mantle Network.</p>
        </div>
      </div>
    </main>
  );
}
