import React from 'react';

import { useAccount } from 'wagmi';

export default function Leaderboard({ profileData }) {
  const { address: walletAddress } = useAccount();

  // The leaderboard will remain empty for other users until real on-chain transaction indexing is implemented.
  // However, we dynamically inject the connected user so they can see their own rank.
  const leaderboardData = walletAddress ? [{
    id: 'user_self',
    rank: 1,
    name: profileData.nickname || 'Anonymous',
    address: walletAddress,
    avatar: profileData.picture || 'https://api.dicebear.com/7.x/identicon/svg?seed=user',
    winRate: '100%',
    volume: '0.00 MNT',
    profit: '+0.00 MNT',
    isUser: true
  }] : [];

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
            {leaderboardData.map((trader) => (
              <tr key={trader.id} className="hover:bg-surface-variant/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="w-8 h-8 rounded-full bg-surface-variant border border-outline-variant flex items-center justify-center font-mono font-bold text-sm text-on-surface">
                    #{trader.rank}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={trader.avatar} alt="avatar" className="w-10 h-10 rounded-full border border-outline-variant object-cover" />
                    <div>
                      <div className="font-bold text-sm text-on-surface flex items-center gap-2">
                        {trader.name}
                        {trader.isUser && <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-mono uppercase">You</span>}
                      </div>
                      <div className="font-mono text-xs text-on-surface-variant/60">
                        {trader.address.substring(0,6)}...{trader.address.substring(trader.address.length - 4)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="font-mono font-bold text-sm text-on-surface">{trader.winRate}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-mono text-sm text-on-surface-variant">{trader.volume}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-mono font-bold text-sm text-bullish-green">{trader.profit}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {leaderboardData.length === 0 && (
          <div className="flex-grow flex flex-col items-center justify-center py-12 opacity-50">
             <span className="material-symbols-outlined text-4xl mb-4">leaderboard</span>
             <p className="font-mono text-sm uppercase tracking-widest font-bold text-on-surface-variant">Awaiting On-Chain Data</p>
             <p className="text-xs text-on-surface-variant mt-2 max-w-sm text-center">Connect your wallet to view your rank. Global leaderboard will populate once real users begin trading.</p>
          </div>
        )}
      </div>
    </main>
  );
}
