import React, { useState } from 'react';
import useAppStore from '../store/useAppStore';
import { useAccount } from 'wagmi';

export default function Portfolio() {
  const { isConnected, address: walletAddress } = useAccount();
  const profileData = useAppStore(state => state.profileData);
  const setProfileData = useAppStore(state => state.setProfileData);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState(profileData);

  return (
    <main className="pt-24 pb-4 px-4 w-full flex flex-col items-center max-w-5xl mx-auto z-10 flex-grow">
      <div className="w-full bg-surface rounded-xl border border-outline-variant shadow-lg p-6 lg:p-10 text-center flex flex-col items-center">
        <div className="w-24 h-24 rounded-full border-4 border-primary/20 p-1 mb-6 relative group">
           <img 
             alt="User avatar" 
             className="w-full h-full rounded-full object-cover" 
             src={profileData.picture}
           />
           <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => { setEditForm({...profileData}); setIsEditingProfile(true); }}>
             <span className="material-symbols-outlined text-white">edit</span>
           </div>
        </div>
        
        <h2 className="serif-heading text-2xl mb-1 text-on-surface flex items-center gap-2 justify-center">
          {profileData.nickname}
          <button onClick={() => { setEditForm({...profileData}); setIsEditingProfile(true); }} className="material-symbols-outlined text-sm text-primary hover:text-primary/80">edit</button>
        </h2>
        <p className="text-on-surface-variant font-mono text-xs tracking-widest uppercase mb-8">
          {walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : 'Not Connected'}
        </p>

        {/* Profile Edit Modal */}
        {isEditingProfile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="bg-surface border border-outline-variant rounded-xl p-6 w-full max-w-md shadow-xl text-left">
              <h3 className="serif-heading text-xl mb-4 text-on-surface">Edit Profile</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-on-surface-variant mb-1">Profile Picture URL</label>
                  <input 
                    type="text" 
                    value={editForm.picture} 
                    onChange={(e) => setEditForm({...editForm, picture: e.target.value})}
                    className="w-full bg-surface-variant border border-outline-variant rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-on-surface-variant mb-1">Nickname</label>
                  <input 
                    type="text" 
                    value={editForm.nickname} 
                    onChange={(e) => setEditForm({...editForm, nickname: e.target.value})}
                    className="w-full bg-surface-variant border border-outline-variant rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-on-surface-variant mb-1">X (Twitter) Handle</label>
                  <div className="flex gap-2">
                    <span className="bg-surface-variant border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface-variant">@</span>
                    <input 
                      type="text" 
                      value={editForm.xHandle} 
                      onChange={(e) => setEditForm({...editForm, xHandle: e.target.value})}
                      className="flex-1 bg-surface-variant border border-outline-variant rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                    />
                  </div>
                  {editForm.xHandle && (
                     <div className="mt-2 inline-flex items-center gap-1 bg-blue-500/10 text-blue-500 px-2 py-1 rounded text-[10px] font-bold">
                       <span className="material-symbols-outlined text-[12px]">check_circle</span> Connected
                     </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 text-sm font-bold text-on-surface-variant hover:text-on-surface"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setProfileData(editForm);
                    setIsEditingProfile(false);
                  }}
                  className="px-4 py-2 bg-primary text-white text-sm font-bold rounded hover:bg-primary/90"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <div className="sahara-panel p-6 rounded-xl flex flex-col items-center justify-center bg-surface-variant/30">
            <span className="material-symbols-outlined text-primary text-3xl mb-2">account_balance_wallet</span>
            <p className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">Total Balance</p>
            <p className="text-xl font-bold font-mono text-on-surface">
              {walletAddress ? '0.00 MNT' : '---'}
            </p>
          </div>

          <div className="sahara-panel p-6 rounded-xl flex flex-col items-center justify-center bg-surface-variant/30">
            <span className="material-symbols-outlined text-bullish-green text-3xl mb-2">trending_up</span>
            <p className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">Active Positions</p>
            <p className="text-xl font-bold font-mono text-on-surface">
              {walletAddress ? '0' : '---'}
            </p>
          </div>

          <div className="sahara-panel p-6 rounded-xl flex flex-col items-center justify-center bg-surface-variant/30">
            <span className="material-symbols-outlined text-amber-500 text-3xl mb-2">emoji_events</span>
            <p className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">Total Winnings</p>
            <p className="text-xl font-bold font-mono text-on-surface">
              {walletAddress ? '0.00 MNT' : '---'}
            </p>
          </div>
        </div>

        {!walletAddress && (
          <button 
            className="mt-8 px-8 py-3 bg-primary text-white rounded font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-all cursor-not-allowed opacity-50"
          >
            Connect Wallet in Header to view Portfolio
          </button>
        )}
      </div>
    </main>
  );
}
