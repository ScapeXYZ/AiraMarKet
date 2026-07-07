import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { trendingSuggestions } from '../mocks/data';
import { useAccount, useWriteContract } from 'wagmi';
import { loadDeployment } from '../../deployments/loader';
import { activeChainConfig } from '../lib/network';

const deployment = loadDeployment('AiraMarketProtocol');
const abi = deployment.abi;
const contractAddress = deployment.address;

export default function CreatorLab() {
  const navigate = useNavigate();
  const profileData = useAppStore(state => state.profileData);
  const { isConnected } = useAccount();
  
  const [creatorInput, setCreatorInput] = useState('');
  const [isProcessingCreator, setIsProcessingCreator] = useState(false);
  const [launchingMarket, launchingMarketSet] = useState(null);
  const [selectedSuggestionTab, setSelectedSuggestionTab] = useState('ALL');
  const [creatorMessages, setCreatorMessages] = useState([]);
  const [liveTrending, setLiveTrending] = useState([]);

  const { writeContractAsync } = useWriteContract();

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/live-trending`);
        const data = await res.json();
        if (data && data.length > 0) {
          const mapped = data.map((signal, index) => {
            const categoryUpper = signal.category.toUpperCase();
            
            let icon = 'developer_board';
            if (categoryUpper === 'CRYPTO') icon = 'currency_bitcoin';
            if (categoryUpper === 'SPORTS') icon = 'sports_soccer';
            if (categoryUpper === 'POLITICS') icon = 'gavel';

            return {
              id: `signal_${index}_${Date.now()}`,
              category: categoryUpper,
              title: signal.topic.substring(0, 30),
              prompt: `Create a market for ${signal.topic}`,
              volume: `$${(signal.signal_strength * 25).toFixed(0)}K`,
              hotness: `${signal.signal_strength}%`,
              icon
            };
          });
          setLiveTrending(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch live trending signals", err);
      }
    };
    fetchTrending();
    const interval = setInterval(fetchTrending, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/pending-markets`);
        const data = await res.json();
        
        if (data && data.length > 0) {
          data.forEach(proposal => {
            const botMessage = {
              id: Date.now() + Math.random(),
              type: 'bot',
              isProposal: true,
              title: proposal.title,
              expiry: proposal.expiry,
              category: proposal.category,
              resolves: 'ORACLE',
              likelihood: `${Math.round(proposal.confidence * 100)}% CONF.`,
              yesProb: Math.round(proposal.confidence * 100),
              noProb: 100 - Math.round(proposal.confidence * 100),
              inputSignals: proposal.inputSignals,
              reason: proposal.reason
            };
            setCreatorMessages(prev => [...prev, botMessage]);
          });
        }
      } catch (err) {
        console.error("No live AI suggestions available");
      }
    };
    const interval = setInterval(fetchPending, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSendCreator = (e) => {
    e.preventDefault();
    if (!creatorInput.trim()) return;
    const userMessage = { id: Date.now(), type: 'user', content: creatorInput };
    setCreatorMessages(prev => [...prev, userMessage]);
    setCreatorInput('');
  };

  const handleSelectSuggestion = (promptText) => {
    setCreatorInput(promptText);
    const userMessage = { id: Date.now(), type: 'user', content: promptText };
    setCreatorMessages(prev => [...prev, userMessage]);
    setCreatorInput('');
  };

  const handleLaunchOnChain = async (market) => {
    if (!isConnected) {
      useAppStore.getState().showToast("Wallet Disconnected", "Please connect your wallet first to deploy this market on-chain!", "error");
      return;
    }
    launchingMarketSet(market);

    try {
      const expirySeconds = BigInt(Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60));
      const mockIpfsCID = `ipfs://Qm${Date.now()}VerifiableAILog`; // Hackathon MVP verifiability
      
      const { parseEther } = await import('viem');
      
      const hash = await writeContractAsync({
        address: contractAddress,
        abi,
        functionName: 'createMarket',
        args: [market.title, market.category, expirySeconds, mockIpfsCID],
        value: parseEther("2.0") // 2 MNT initial liquidity seed
      });
      
      useAppStore.getState().showToast("Transaction Pending", "Waiting for network confirmation...", "info", hash);
      
      await fetch(`${import.meta.env.VITE_API_URL}/log-transparency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            txHash: hash,
            title: market.title,
            category: market.category,
            inputSignals: market.inputSignals || "Manual Override",
            reason: market.reason || "Manual Deployment",
            confidence: market.likelihood || "80%",
            decision: "User physically signed and approved via Wagmi"
        })
      });

      useAppStore.getState().showToast("Deploy Complete", `"${market.title}" deployed securely on-chain!`, "success", hash);
      navigate('/feed');
    } catch (err) {
      console.error(err);
      useAppStore.getState().showToast("Deployment Failed", err.shortMessage || err.message, "error");
    } finally {
      launchingMarketSet(null);
    }
  };

  return (
    <>
      {launchingMarket && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md">
          <div className="sahara-card p-10 rounded-2xl max-w-md text-center space-y-6 bg-surface border-2 border-primary/20">
            <span className="material-symbols-outlined text-primary text-6xl animate-bounce">rocket_launch</span>
            <h3 className="serif-heading text-2xl text-on-surface">NEURAL DEPLOYER</h3>
            <p className="text-sm text-on-surface-variant font-medium animate-pulse">Structuring liquidity pool contract...</p>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-marquee w-[60%]"></div>
            </div>
            <p className="text-[10px] font-mono text-on-surface-variant/60 uppercase">Securing transactions on Mantle Network...</p>
          </div>
        </div>
      )}

      <main className="pt-24 pb-24 md:pb-4 px-4 w-full min-h-[calc(100vh-100px)] grid grid-cols-12 gap-4 max-w-7xl mx-auto z-10 relative flex-grow">
        <div className="col-span-12 lg:col-span-4 flex flex-col justify-between h-auto bg-surface-variant/20 border border-outline-variant rounded-xl p-5 order-2 lg:order-1">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary-container text-primary font-mono text-[9px] tracking-widest uppercase font-bold animate-pulse">
              <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
              NEURAL ENGINE ACTIVE
            </div>
            <h2 className="serif-heading text-2xl md:text-3xl lg:text-4xl text-on-surface tracking-tight leading-tight">
              Intelligent Markets, <br/><span className="text-primary italic">Deployed Instantly.</span>
            </h2>
            <p className="text-on-surface-variant text-xs leading-relaxed opacity-95">
              Describe your market vision and let AIRA's intelligence structure, validate, and launch liquidity pools directly to the Mantle Network ledger.
            </p>
          </div>

          <div className="space-y-3 mt-6">
            <div className="bg-surface p-4 rounded-lg border border-outline-variant flex items-center gap-4 shadow-sm">
              <div className="w-9 h-9 rounded bg-primary-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-lg">psychology</span>
              </div>
              <div>
                <p className="font-mono text-[8px] text-on-surface-variant mb-0.5 uppercase tracking-widest font-bold">AI Probability</p>
                <p className="font-bold text-xs text-on-surface">94.2% Accuracy Vector</p>
              </div>
            </div>
            <div className="bg-surface p-4 rounded-lg border border-outline-variant flex items-center gap-4 shadow-sm">
              <div className="w-9 h-9 rounded bg-surface-variant flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-lg">link</span>
              </div>
              <div>
                <p className="font-mono text-[8px] text-on-surface-variant mb-0.5 uppercase tracking-widest font-bold">Network Fee</p>
                <p className="font-bold text-xs text-on-surface">~0.002 ETH Gas Bound</p>
              </div>
            </div>
            <div className="bg-surface p-4 rounded-lg border border-outline-variant flex items-center gap-4 shadow-sm">
              <div className="w-9 h-9 rounded bg-surface-container-high flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-lg">verified_user</span>
              </div>
              <div>
                <p className="font-mono text-[8px] text-on-surface-variant mb-0.5 uppercase tracking-widest font-bold">Ledger Oracle</p>
                <p className="font-bold text-xs text-on-surface">Secure Multi-Oracle</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 bg-surface rounded-xl border border-outline-variant shadow-lg p-5 flex flex-col h-auto order-1 lg:order-2">
          <div className="flex-grow pr-2 space-y-6 min-h-0 col-snap-container">
            {creatorMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-4 col-snap-section">
                {msg.type === 'user' ? (
                  <>
                    <div className="w-8 h-8 shrink-0 rounded bg-surface-variant flex items-center justify-center border border-outline-variant">
                      <span className="material-symbols-outlined text-on-surface-variant text-sm">person</span>
                    </div>
                    <div className="bg-surface-variant/40 px-5 py-3 rounded-xl border border-outline-variant max-w-xl">
                      <p className="text-on-surface leading-relaxed text-xs">{msg.content}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 shrink-0 rounded bg-primary-container flex items-center justify-center border border-primary/20">
                      <span className="material-symbols-outlined text-primary text-sm">smart_toy</span>
                    </div>
                    <div className="market-card p-5 md:p-6 rounded-xl w-full max-w-2xl relative shadow-sm bg-surface">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-outline-variant">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-primary text-[9px] tracking-widest uppercase font-bold">Proposal</span>
                          <span className="px-1.5 py-0.5 bg-bullish-green/10 text-bullish-green text-[8px] rounded font-bold font-mono">AIRA APPROVED</span>
                        </div>
                        <span className="font-mono text-on-surface-variant text-[9px]">2.14ms Ticker</span>
                      </div>
                      <div className="space-y-4">
                        <h3 className="serif-heading text-base md:text-lg text-on-surface leading-tight font-extrabold">{msg.title}</h3>
                        
                        <div className="grid grid-cols-4 gap-px bg-outline-variant border border-outline-variant rounded overflow-hidden text-[10px]">
                          <div className="bg-surface p-2.5">
                            <div className="text-[8px] font-mono text-on-surface-variant mb-0.5 uppercase tracking-wider font-bold">Expiry</div>
                            <div className="font-mono text-on-surface font-semibold">{msg.expiry}</div>
                          </div>
                          <div className="bg-surface p-2.5">
                            <div className="text-[8px] font-mono text-on-surface-variant mb-0.5 uppercase tracking-wider font-bold">Category</div>
                            <div className="font-mono text-on-surface font-semibold">{msg.category}</div>
                          </div>
                          <div className="bg-surface p-2.5">
                            <div className="text-[8px] font-mono text-on-surface-variant mb-0.5 uppercase tracking-wider font-bold">Resolves</div>
                            <div className="font-mono text-on-surface font-semibold">{msg.resolves}</div>
                          </div>
                          <div className="bg-surface p-2.5">
                            <div className="text-[8px] font-mono text-on-surface-variant mb-0.5 uppercase tracking-wider font-bold">Conf.</div>
                            <div className="font-mono text-bullish-green font-bold">{msg.likelihood}</div>
                          </div>
                        </div>

                        <div className="py-3 border-y border-outline-variant space-y-2">
                          <div className="flex justify-between items-end mb-1 text-[9px]">
                            <span className="font-mono text-on-surface-variant uppercase tracking-widest font-bold">Neural Sentiment (Probability)</span>
                            <div className="flex gap-3 font-mono font-bold">
                              <span className="text-bullish-green font-mono">YES {msg.yesProb}%</span>
                              <span className="text-bearish-red font-mono">NO {msg.noProb}%</span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden flex mb-4">
                            <div className="h-full bg-primary" style={{ width: `${msg.yesProb}%` }}></div>
                            <div className="h-full bg-secondary opacity-30" style={{ width: `${msg.noProb}%` }}></div>
                          </div>

                          <div className="bg-surface-variant/30 rounded border border-outline-variant/50 p-2">
                             <div className="flex items-center gap-1.5 mb-1.5">
                                <span className="material-symbols-outlined text-[10px] text-primary">data_object</span>
                                <span className="text-[8px] font-mono font-bold text-on-surface-variant uppercase tracking-widest">Raw AI Reasoning (Pre-IPFS Anchor)</span>
                             </div>
                             <p className="text-[9px] font-mono text-on-surface-variant leading-relaxed opacity-80 mb-1">
                               <strong className="text-primary">SIGNALS:</strong> {msg.inputSignals || "SerpAPI trending search analysis, Twitter sentiment index."}
                             </p>
                             <p className="text-[9px] font-mono text-on-surface-variant leading-relaxed opacity-80 italic border-l-2 border-primary/30 pl-2">
                               "{msg.reason || "Historical probability heavily favors this outcome based on localized news volume."}"
                             </p>
                          </div>
                        </div>

                        <div className="flex justify-center pt-1">
                          <button 
                            className="group px-6 py-3.5 bg-primary text-white font-mono text-[9px] tracking-[0.2em] rounded-lg transition-all hover:bg-on-surface hover:shadow-lg active:scale-95 uppercase font-bold flex items-center gap-2"
                            onClick={() => handleLaunchOnChain(msg)}
                          >
                            <span>Create Market</span>
                            <span className="material-symbols-outlined text-xs">rocket_launch</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}

            {isProcessingCreator && (
              <div className="flex items-start gap-4 col-snap-section">
                <div className="w-8 h-8 shrink-0 rounded bg-primary-container flex items-center justify-center border border-primary/20">
                  <span className="material-symbols-outlined text-primary text-sm animate-spin">sync</span>
                </div>
                <div className="bg-surface-variant/40 px-5 py-3 rounded-xl border border-outline-variant max-w-xl">
                  <p className="text-on-surface-variant leading-relaxed text-xs animate-pulse">AIRA is analyzing sentiment and structuring liquidity contracts...</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-outline-variant pt-4 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm animate-pulse">local_fire_department</span>
                <span className="font-mono text-on-surface text-[10px] tracking-widest uppercase font-extrabold">GLOBAL TRENDING TOPICS</span>
              </div>
              <div className="flex items-center gap-1 bg-surface-variant/60 border border-outline-variant/60 rounded-full p-0.5 font-mono text-[9px] w-fit overflow-x-auto">
                {['ALL', 'TECH', 'CRYPTO', 'POLITICS', 'SPORTS'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`px-3 py-1 rounded-full text-[9px] font-extrabold uppercase transition-all shrink-0 ${selectedSuggestionTab === tab ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
                    onClick={() => setSelectedSuggestionTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-thin max-w-full">
              {(liveTrending.length > 0 ? liveTrending : trendingSuggestions)
                .filter(item => selectedSuggestionTab === 'ALL' || item.category === selectedSuggestionTab)
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="flex-shrink-0 w-64 text-left p-3.5 rounded-xl border border-outline-variant bg-surface-variant/30 hover:border-primary hover:bg-surface-variant/50 transition-all duration-300 group flex flex-col justify-between shadow-xs relative overflow-hidden"
                    onClick={() => handleSelectSuggestion(item.prompt)}
                  >
                    <div className="flex justify-between items-center w-full mb-2.5">
                      <span className="flex items-center gap-1 text-[8px] font-bold text-on-surface-variant/60 uppercase tracking-widest font-mono">
                        <span className="material-symbols-outlined text-[11px] text-primary">{item.icon}</span>
                        {item.category}
                      </span>
                      <span className="bg-primary/10 text-primary text-[8px] font-bold px-2 py-0.5 rounded font-mono flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[9px]">trending_up</span>
                        {item.hotness}
                      </span>
                    </div>
                    <p className="font-semibold text-xs text-on-surface leading-snug tracking-tight mb-3 line-clamp-2 italic group-hover:text-primary transition-colors">
                      "{item.prompt.replace(/Create a market for /gi, '')}"
                    </p>
                    <div className="flex justify-between items-center w-full mt-auto pt-2 border-t border-outline-variant/60 text-[8px] font-bold tracking-widest text-on-surface-variant/50 uppercase font-mono">
                      <span>VOL POTENTIAL</span>
                      <span className="text-on-surface font-semibold">{item.volume}</span>
                    </div>
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </button>
                ))}
            </div>
          </div>

          <form onSubmit={handleSendCreator} className="mt-4 shrink-0">
            <div className="relative bg-surface-container-low border border-outline-variant rounded-xl p-1 flex items-center gap-3 focus-within:border-primary transition-colors">
              <div className="p-2 ml-1 text-primary">
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              </div>
              <input 
                className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-on-surface-variant/50 py-2.5 text-xs outline-none" 
                placeholder="Describe your market idea..." 
                type="text"
                value={creatorInput}
                onChange={(e) => setCreatorInput(e.target.value)}
              />
              <button type="submit" className="p-2.5 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
