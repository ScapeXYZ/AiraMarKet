import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { useAccount, useWriteContract, useReadContract, usePublicClient } from 'wagmi';
import { parseEther, formatEther } from 'viem';

const abi = [
  { "inputs": [{ "internalType": "uint256", "name": "_marketId", "type": "uint256" }], "name": "buyYes", "outputs": [], "stateMutability": "payable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "_marketId", "type": "uint256" }], "name": "buyNo", "outputs": [], "stateMutability": "payable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "_marketId", "type": "uint256" }], "name": "claimWinnings", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }, { "internalType": "address", "name": "", "type": "address" }], "name": "yesShares", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }, { "internalType": "address", "name": "", "type": "address" }], "name": "noShares", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
];

export default function Terminal() {
  const navigate = useNavigate();
  const { isConnected, address: walletAddress } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const profileData = useAppStore(state => state.profileData);
  const activeMarket = useAppStore(state => state.activeMarket);
  
  const [tradeSize, setTradeSize] = useState(500);
  const [selectedDirection, setSelectedDirection] = useState('YES');
  const [activeTab, setActiveTab] = useState('PROBABILITY');
  const [activeChartRange, setActiveChartRange] = useState('4H');
  const [chatText, setChatText] = useState('');
  const [messages, setMessages] = useState([]);

  // Wagmi Read Contracts for positions
  const { data: yesSharesData, refetch: refetchYes } = useReadContract({
    address: import.meta.env.VITE_MANTLE_CONTRACT_ADDRESS,
    abi,
    functionName: 'yesShares',
    args: [activeMarket.realId, walletAddress],
    query: { enabled: !!activeMarket.realId && !!walletAddress }
  });

  const { data: noSharesData, refetch: refetchNo } = useReadContract({
    address: import.meta.env.VITE_MANTLE_CONTRACT_ADDRESS,
    abi,
    functionName: 'noShares',
    args: [activeMarket.realId, walletAddress],
    query: { enabled: !!activeMarket.realId && !!walletAddress }
  });

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    const newMessageObj = {
      id: Date.now(),
      type: 'user',
      sender: profileData.nickname,
      time: 'JUST NOW',
      avatar: profileData.picture,
      content: chatText
    };
    setMessages(prev => [newMessageObj, ...prev]);
    setChatText('');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'POSITIONS') {
      refetchYes();
      refetchNo();
    }
  };

  const handleClaim = async () => {
    if(!activeMarket.realId) return;
    try {
      const hash = await writeContractAsync({
        address: import.meta.env.VITE_MANTLE_CONTRACT_ADDRESS,
        abi,
        functionName: 'claimWinnings',
        args: [activeMarket.realId]
      });
      alert(`Claim submitted! Hash: ${hash}`);
    } catch(e) {
      alert(e.message);
    }
  };

  const handleTrade = async () => {
    if (!isConnected) {
       alert("Please connect your wallet first!");
       return;
    }
    try {
       if (!activeMarket.realId) {
           alert("Market ID missing. Ensure this market is verified on-chain.");
           return;
       }
       const txValue = parseEther(tradeSize.toString());
       
       let gasLimit = undefined;
       try {
         const estimatedGas = await publicClient.estimateContractGas({
           address: import.meta.env.VITE_MANTLE_CONTRACT_ADDRESS,
           abi,
           functionName: selectedDirection === 'YES' ? 'buyYes' : 'buyNo',
           args: [activeMarket.realId],
           account: walletAddress,
           value: txValue
         });
         // Add a 20% safety buffer to prevent failed trade txs
         gasLimit = estimatedGas + (estimatedGas * 20n) / 100n;
         console.log(`[DYNAMIC_GAS] Estimated gas: ${estimatedGas}, with buffer: ${gasLimit}`);
       } catch (gasErr) {
         console.warn("[DYNAMIC_GAS] Gas estimation failed, falling back to wallet default:", gasErr);
       }

       const hash = await writeContractAsync({
         address: import.meta.env.VITE_MANTLE_CONTRACT_ADDRESS,
         abi,
         functionName: selectedDirection === 'YES' ? 'buyYes' : 'buyNo',
         args: [activeMarket.realId],
         value: txValue,
         gas: gasLimit
       });
       
       alert(`Transaction submitted! Hash: ${hash}`);
    } catch (err) {
       console.error(err);
       alert("Transaction failed! " + err.message);
    }
  };

  const handleOracleResolve = async (outcome) => {
    try {
      const response = await fetch('http://localhost:3001/resolve-market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketId: activeMarket.realId, outcome })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        alert(`Oracle Resolution Transaction submitted! Hash: ${data.txHash}`);
      } else {
        alert(`Oracle Resolution failed: ${data.error || 'Unknown error'}`);
      }
    } catch(err) {
      alert("Resolution error: " + err.message);
    }
  };

  const handleOwnerResolve = async (outcome) => {
    try {
      const hash = await writeContractAsync({
        address: import.meta.env.VITE_MANTLE_CONTRACT_ADDRESS,
        abi: [
          ...abi,
          {
            "inputs": [
              { "internalType": "uint256", "name": "_marketId", "type": "uint256" },
              { "internalType": "bool", "name": "_outcome", "type": "bool" }
            ],
            "name": "resolveMarket",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        functionName: 'resolveMarket',
        args: [activeMarket.realId, outcome]
      });
      alert(`Fallback Owner Proposal/Resolution submitted! Hash: ${hash}`);
    } catch(e) {
      alert(e.message);
    }
  };

  if (!activeMarket.realId) {
    return (
      <main className="pt-24 pb-4 px-4 w-full min-h-[calc(100vh-100px)] grid grid-cols-12 gap-4 max-w-[1600px] mx-auto flex-grow z-10">
        <div className="col-span-12 flex flex-col items-center justify-center h-full w-full bg-surface rounded-xl border border-outline/20">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">candlestick_chart</span>
          <p className="text-on-surface font-mono tracking-widest text-sm">SELECT A MARKET FROM THE FEED TO TRADE</p>
          <button onClick={() => navigate('/feed')} className="mt-6 px-6 py-2 bg-primary text-white text-xs font-bold uppercase rounded hover:bg-primary/90 transition-all">Go To Feed</button>
        </div>
      </main>
    );
  }

  const activeSharePrice = selectedDirection === 'YES' ? activeMarket.yesPrice : activeMarket.noPrice;
  const estShares = +(tradeSize / activeSharePrice).toFixed(2);
  const potentialPayout = +(estShares * 1.00).toFixed(2);

  return (
    <main className="pt-24 pb-4 px-4 w-full min-h-[calc(100vh-100px)] grid grid-cols-12 gap-4 max-w-[1600px] mx-auto flex-grow z-10">
      <div className="col-span-12 lg:col-span-8 xl:col-span-9 flex flex-col gap-4 h-auto">
        <div className="sahara-panel p-4 rounded-xl flex items-center justify-between gap-4 bg-surface shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-surface-variant rounded-xl flex items-center justify-center border border-outline-variant flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base text-on-surface tracking-tight mb-0.5">{activeMarket.title}</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">MARKET EXPIRY PENDING RESOLUTION</p>
              </div>
            </div>
          </div>
          <div className="flex gap-6 items-center">
            <div className="text-right">
              <p className="text-[8px] font-bold uppercase tracking-widest text-on-surface-variant mb-0.5 font-mono">AI CONFIDENCE</p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-primary font-bold">{activeMarket.confidence}%</span>
                <div className="h-1 w-16 bg-surface-variant rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${activeMarket.confidence}%` }}></div>
                </div>
              </div>
            </div>
            <div className="text-right border-l border-outline-variant pl-4 hidden sm:block">
              <p className="text-[8px] font-bold uppercase tracking-widest text-on-surface-variant mb-0.5">VOLATILITY</p>
              <span className="font-bold text-[10px] text-on-surface">MED-HIGH</span>
            </div>
          </div>
        </div>

        <div className="sahara-panel rounded-xl p-4 relative flex-grow flex flex-col min-h-[400px] bg-surface justify-between">
          <div className="flex justify-between items-center mb-3">
            <div className="flex gap-1.5 p-0.5 bg-surface-variant rounded-lg">
              {['PROBABILITY', 'VOLUME', 'POSITIONS', 'ADMIN CONTROL'].map(tab => (
                <button 
                  key={tab}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${activeTab === tab ? 'bg-surface text-primary shadow-xs' : 'bg-transparent text-on-surface-variant hover:text-on-surface'}`}
                  onClick={() => handleTabChange(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 font-bold text-[10px] text-on-surface-variant">
              {['1H', '4H', '1D', '1W'].map(range => (
                <button 
                  key={range}
                  className={`hover:text-primary transition-all ${activeChartRange === range ? 'text-primary border-b-2 border-primary' : ''}`}
                  onClick={() => setActiveChartRange(range)}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          
          {activeTab === 'POSITIONS' && (
            <div className="relative w-full flex-grow flex flex-col justify-center items-center text-center min-h-0 bg-surface-variant/20 rounded-xl p-4 border border-outline-variant/30">
               <h3 className="text-sm font-bold text-on-surface mb-4 font-display tracking-widest uppercase">My On-Chain Positions</h3>
               <div className="flex gap-8 w-full justify-center">
                 <div className="p-4 bg-surface rounded-lg border border-bullish-green/30 w-32 shadow-sm">
                    <p className="text-[10px] text-on-surface-variant font-bold mb-1">YES SHARES</p>
                    <p className="text-xl font-mono text-bullish-green font-extrabold">{yesSharesData ? formatEther(yesSharesData) : "0"}</p>
                 </div>
                 <div className="p-4 bg-surface rounded-lg border border-bearish-red/30 w-32 shadow-sm">
                    <p className="text-[10px] text-on-surface-variant font-bold mb-1">NO SHARES</p>
                    <p className="text-xl font-mono text-bearish-red font-extrabold">{noSharesData ? formatEther(noSharesData) : "0"}</p>
                 </div>
               </div>
               {(yesSharesData > 0n || noSharesData > 0n) && (
                 <button className="mt-6 px-6 py-2 border border-primary text-primary hover:bg-primary hover:text-white transition-all text-xs font-bold uppercase rounded-md tracking-widest"
                   onClick={handleClaim}
                 >Claim Winnings</button>
               )}
            </div>
          )}

          {activeTab === 'ADMIN CONTROL' && (
            <div className="relative w-full flex-grow flex flex-col justify-center items-center text-center min-h-0 bg-surface-variant/20 rounded-xl p-6 border border-outline-variant/30">
               <h3 className="text-sm font-bold text-on-surface mb-2 font-display tracking-widest uppercase flex items-center gap-2">
                 <span className="material-symbols-outlined text-primary">shield</span>
                 ADMINISTRATIVE PROTOCOL RESOLUTION
               </h3>
               <p className="text-xs text-on-surface-variant max-w-lg mb-6">
                 Trigger oracle resolution instantly or initiate the fallback owner timelock proposal.
               </p>
               
               <div className="flex flex-col sm:flex-row gap-6 w-full max-w-xl justify-center">
                 {/* Oracle Resolution Section */}
                 <div className="p-5 bg-surface rounded-xl border border-primary/20 flex-grow shadow-sm flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] text-primary font-bold mb-1 tracking-widest uppercase font-mono">1. ORACLE RESOLVE (INSTANT)</p>
                      <p className="text-[11px] text-on-surface-variant mb-4">Triggers immediate resolution via verified Chainlink Oracle node credentials (no delay).</p>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <button 
                        onClick={() => handleOracleResolve(true)}
                        className="px-4 py-2 bg-bullish-green/20 hover:bg-bullish-green text-bullish-green hover:text-white font-mono text-[10px] font-bold rounded uppercase tracking-wider transition-all"
                      >
                        Resolve YES
                      </button>
                      <button 
                        onClick={() => handleOracleResolve(false)}
                        className="px-4 py-2 bg-bearish-red/20 hover:bg-bearish-red text-bearish-red hover:text-white font-mono text-[10px] font-bold rounded uppercase tracking-wider transition-all"
                      >
                        Resolve NO
                      </button>
                    </div>
                 </div>

                 {/* Fallback Owner Section */}
                 <div className="p-5 bg-surface rounded-xl border border-outline-variant flex-grow shadow-sm flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] text-on-surface-variant font-bold mb-1 tracking-widest uppercase font-mono">2. FALLBACK OWNER (TIMELOCKED)</p>
                      <p className="text-[11px] text-on-surface-variant mb-4">Proposes outcome. Enforces a strict 24-hour dispute timelock before on-chain execution.</p>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <button 
                        onClick={() => handleOwnerResolve(true)}
                        className="px-4 py-2 bg-surface-variant hover:bg-on-surface hover:text-surface text-on-surface font-mono text-[10px] font-bold rounded uppercase tracking-wider transition-all"
                      >
                        Propose YES
                      </button>
                      <button 
                        onClick={() => handleOwnerResolve(false)}
                        className="px-4 py-2 bg-surface-variant hover:bg-on-surface hover:text-surface text-on-surface font-mono text-[10px] font-bold rounded uppercase tracking-wider transition-all"
                      >
                        Propose NO
                      </button>
                    </div>
                 </div>
               </div>
            </div>
          )}

          {(activeTab === 'PROBABILITY' || activeTab === 'VOLUME') && (
            <div className="relative w-full flex-grow flex items-end min-h-0">
              <svg className="w-full h-full overflow-visible max-h-[160px] md:max-h-[200px]" viewBox="0 0 1000 300" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradientSahara" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#c2652a" stopOpacity="0.15"></stop>
                    <stop offset="100%" stopColor="#c2652a" stopOpacity="0"></stop>
                  </linearGradient>
                </defs>
                <path d="M0,250 Q100,240 200,200 T400,180 T600,120 T800,80 T1000,40 L1000,300 L0,300 Z" fill="url(#chartGradientSahara)"></path>
                <path d="M0,250 Q100,240 200,200 T400,180 T600,120 T800,80 T1000,40" fill="none" stroke="#c2652a" strokeLinecap="round" strokeWidth="2.5"></path>
                <circle cx="800" cy="80" fill="#c2652a" r="5">
                  <animate attributeName="r" dur="3s" repeatCount="indefinite" values="5;7;5"></animate>
                </circle>
              </svg>
            </div>
          )}

          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
            <div className="p-2.5 bg-surface-variant/30 rounded border border-outline-variant/50">
              <p className="text-[8px] font-bold text-on-surface-variant mb-0.5 uppercase tracking-widest font-mono">Implied Prob.</p>
              <p className="font-mono text-xs text-primary font-semibold">{(activeMarket.yesPrice * 100).toFixed(1)}%</p>
            </div>
            <div className="p-2.5 bg-surface-variant/30 rounded border border-outline-variant/50">
              <p className="text-[8px] font-bold text-on-surface-variant mb-0.5 uppercase tracking-widest font-mono">24h Vol.</p>
              <p className="font-mono text-xs text-on-surface font-semibold">{activeMarket.vol}</p>
            </div>
            <div className="p-2.5 bg-surface-variant/30 rounded border border-outline-variant/50">
              <p className="text-[8px] font-bold text-on-surface-variant mb-0.5 uppercase tracking-widest font-mono">Open Interest</p>
              <p className="font-mono text-xs text-on-surface font-semibold">{activeMarket.openInterest}</p>
            </div>
            <div className="p-2.5 bg-surface-variant/30 rounded border border-outline-variant/50">
              <p className="text-[8px] font-bold text-on-surface-variant mb-0.5 uppercase tracking-widest font-mono">AI Drift</p>
              <p className={`font-mono text-xs font-semibold ${activeMarket.drift.startsWith('+') ? 'text-bullish-green' : 'text-bearish-red'}`}>{activeMarket.drift}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-4 xl:col-span-3 flex flex-col gap-4 h-auto">
        <div className="sahara-panel rounded-xl p-5 border-t-2 border-t-primary bg-surface shrink-0">
          <h3 className="font-bold text-xs mb-4 flex items-center gap-2 text-on-surface uppercase tracking-widest">
            <span className="material-symbols-outlined text-primary text-sm">bolt</span>
            EXECUTE POSITION
          </h3>
          <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
            <button 
              className={`flex flex-col items-center justify-center p-2.5 rounded border transition-all active:scale-[0.98] ${selectedDirection === 'YES' ? 'border-bullish-green bg-bullish-green/10 font-bold' : 'border-bullish-green/20 bg-bullish-green/5'}`}
              onClick={() => setSelectedDirection('YES')}
            >
              <span className="text-bullish-green mb-0.5">YES</span>
              <span className="font-mono text-[9px] text-on-surface-variant font-bold">${activeMarket.yesPrice.toFixed(2)}</span>
            </button>
            <button 
              className={`flex flex-col items-center justify-center p-2.5 rounded border transition-all active:scale-[0.98] ${selectedDirection === 'NO' ? 'border-bearish-red bg-bearish-red/10 font-bold' : 'border-bearish-red/20 bg-bearish-red/5'}`}
              onClick={() => setSelectedDirection('NO')}
            >
              <span className="text-bearish-red mb-0.5">NO</span>
              <span className="font-mono text-[9px] text-on-surface-variant font-bold">${activeMarket.noPrice.toFixed(2)}</span>
            </button>
          </div>
          <div className="mb-4">
            <div className="flex justify-between items-end mb-2 text-[9px]">
              <span className="font-bold text-on-surface-variant uppercase tracking-widest font-mono">POSITION SIZE</span>
              <span className="font-mono text-primary font-bold text-xs">${tradeSize}</span>
            </div>
            <input 
              className="w-full h-1 bg-surface-variant rounded-full appearance-none cursor-pointer" 
              max="5000" 
              min="10" 
              type="range" 
              value={tradeSize}
              onChange={(e) => setTradeSize(Number(e.target.value))}
            />
          </div>
          <button 
            className="w-full py-3 bg-primary text-white font-bold text-[10px] rounded hover:bg-primary/90 transition-all active:scale-[0.97] uppercase tracking-widest"
            onClick={handleTrade}
          >
            CONFIRM POSITION
          </button>
        </div>

        <div className="sahara-panel rounded-xl flex-grow flex flex-col min-h-[500px] bg-surface">
          <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between shrink-0">
            <h3 className="font-bold text-[9px] text-on-surface tracking-widest uppercase">LIVE CHAT</h3>
            <span className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest">2.4K WATCHING</span>
          </div>
          
          <div className="flex-grow p-4 space-y-4 min-h-0 col-snap-container">
            {messages.map((msg, index) => (
              <div key={msg.id} className={`flex gap-3 col-snap-section ${index >= 2 ? 'opacity-65' : ''}`}>
                {msg.type === 'bot' ? (
                  <div className="flex-shrink-0 w-7 h-7 rounded bg-primary/10 flex items-center justify-center border border-primary/20">
                    <span className="material-symbols-outlined text-sm text-primary">smart_toy</span>
                  </div>
                ) : (
                  <img className="w-7 h-7 rounded object-cover border border-outline-variant shrink-0" src={msg.avatar} alt="User" />
                )}
                <div className="space-y-1 flex-grow text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[9px] text-primary tracking-widest uppercase">{msg.sender}</span>
                    <span className="text-[8px] font-bold text-on-surface-variant/50">{msg.time}</span>
                  </div>
                  <p className={`leading-relaxed text-[11px] ${msg.type === 'bot' ? 'bg-surface-variant/40 p-2.5 rounded-lg rounded-tl-none border border-outline-variant' : 'text-on-surface'}`}>
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendChat} className="p-3 border-t border-outline-variant bg-surface-variant/10 shrink-0">
            <div className="relative">
              <input 
                className="w-full bg-background border border-outline-variant rounded py-2 px-3 pr-10 text-xs focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/50" 
                placeholder="Share insight..." 
                type="text"
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
              />
              <button type="submit" className="absolute right-3 top-2 text-primary">
                <span className="material-symbols-outlined text-base">send</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
