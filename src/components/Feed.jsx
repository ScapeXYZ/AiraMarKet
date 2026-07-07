import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { feedCategories } from '../mocks/data';
import { useReadContract } from 'wagmi';
import { loadDeployment } from '../../deployments/loader';
import { activeChainConfig } from '../lib/network';

const deployment = loadDeployment('AiraMarketProtocol');
const abi = deployment.abi;
const contractAddress = deployment.address;


export default function Feed() {
  const navigate = useNavigate();
  const setActiveMarket = useAppStore(state => state.setActiveMarket);
  const [activeFeedFilter, setActiveFeedFilter] = useState('ACTIVE');
  const [feedCards, setFeedCards] = useState([]);
  const [activeCategoryTab, setActiveCategoryTab] = useState('TECH');

  const handleCategoryClick = (catId) => {
    setActiveCategoryTab(catId);
    scrollToColumn(catId);
  };

  // Use wagmi to fetch markets
  const { data: liveMarkets } = useReadContract({
    address: contractAddress,
    abi,
    functionName: 'listMarkets',
    watch: true,
  });

  React.useEffect(() => {
    if (liveMarkets) {
      const mappedMarkets = liveMarkets.map((m) => {
        const id = Number(m.id);
        const totalYes = Number(m.totalYesPool) / 1e18;
        const totalNo = Number(m.totalNoPool) / 1e18;
        const total = totalYes + totalNo;
        const yesProb = total > 0 ? Math.round((totalYes / total) * 100) : 50;
        const noProb = total > 0 ? Math.round((totalNo / total) * 100) : 50;
        
        return {
          id: `onchain_${id}`,
          realId: id,
          title: m.title,
          category: m.category.toUpperCase(),
          volume: `$${total.toFixed(2)} ${activeChainConfig.nativeCurrency.symbol}`,
          yesProb,
          noProb,
          yesPrice: yesProb / 100,
          noPrice: noProb / 100,
          confidence: "Live",
          openInterest: `${total.toFixed(2)} ${activeChainConfig.nativeCurrency.symbol}`,
          drift: "LIVE",
          status: m.resolved ? "ENDED" : "ACTIVE",
          passport: "https://images.unsplash.com/photo-1639762681485-074b7f4ec651?auto=format&fit=crop&q=80&w=200",
          bgImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuC9ZaIdCSD76vsMYol9iTeA3P-KQePR-wPwXlEf8HDGAcQXVLcWBTQf2XPSYlrNTDzYlAoOgq4IvPXuEZwitpqGSuLEoPVcX7-ucS_CmB7lUv1rFXuQqETHu6FcP44CbdbNERfV9UdIz-IYo_b2fCqdFHWsDXpdsbtPDhUbvxOqnaE4IuARVDI2c_81H_f9VcBGDMZamrZnDWlCu0pQWjFXdazF0kCZfwjb9g1siJ6jU8kdrt6XYa0L-4gC3h3_zaQkcZajNdL_5mY",
          nodeIcon: "https://lh3.googleusercontent.com/aida-public/AB6AXuC5mynRnO05PMYjJd4c9pATpp_CQNpzcuGCuynRG5rI2sR6fjElHLEmsj0uuq1_37kGszQW6Lm7Nx73hl71PgeFxr9oOyn14HpIVZkkfbHiEskuSrePFACjwxxNoJdO8xjTP0jpBN1bTi4K6IpZangC3HOfa0rNiJmVinhzBTn0HsixddoBCOCgjXN3d0SNJkz4EKnodR6fkkh14DscesLHVZ0wRgeEQKOqoC8cABi8GQ95kMVMGB4UgCFztlOQANyh7SsvMYkWoNA",
          nodeName: `${activeChainConfig.networkName.split(' ')[0]} Oracle`
        };
      });
      setFeedCards(mappedMarkets.reverse());
    }
  }, [liveMarkets]);

  const activateTerminalTrade = (marketTitle, yesPrice, noPrice, confidence, vol, openInterest, drift, realId) => {
    setActiveMarket({
      realId: realId,
      title: marketTitle,
      confidence: confidence || '92.4',
      impliedPrice: yesPrice,
      closesIn: '04H 22M 11S',
      vol: vol || '$1.2M',
      openInterest: openInterest || '$458K',
      drift: drift || '+0.12%',
      yesPrice: yesPrice,
      noPrice: noPrice
    });
    navigate('/terminal');
  };

  const scrollToColumn = (colId) => {
    const el = document.getElementById(`col-${colId.toLowerCase()}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  return (
    <div className="pt-20 flex flex-col w-full min-h-[calc(100vh-80px)] bg-background relative z-10">
      {/* Glassy, Floating Unified Status Selector & Category Anchor Bar */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[45] flex flex-col md:flex-row items-center gap-2 md:gap-4 bg-surface/90 backdrop-blur-md border border-outline-variant rounded-2xl md:rounded-full p-2 shadow-lg w-auto max-w-[95%]">
        <div className="flex items-center gap-1 bg-surface-variant/40 border border-outline-variant/60 rounded-full p-1 font-mono">
          <button 
            className={`px-4.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase transition-all flex items-center gap-1.5 ${activeFeedFilter === 'COMING' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
            onClick={() => setActiveFeedFilter('COMING')}
          >
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shrink-0"></span>
            Coming
          </button>
          <button 
            className={`px-4.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase transition-all flex items-center gap-1.5 ${activeFeedFilter === 'ACTIVE' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
            onClick={() => setActiveFeedFilter('ACTIVE')}
          >
            <span className="w-1.5 h-1.5 bg-bullish-green rounded-full animate-ping shrink-0"></span>
            Active
          </button>
          <button 
            className={`px-4.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase transition-all flex items-center gap-1.5 ${activeFeedFilter === 'ENDED' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
            onClick={() => setActiveFeedFilter('ENDED')}
          >
            <span className="w-1.5 h-1.5 bg-on-surface-variant/40 rounded-full shrink-0"></span>
            Ended
          </button>
        </div>
        <div className="hidden md:block h-6 w-px bg-outline-variant/80"></div>
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[280px] sm:max-w-md no-scrollbar">
          {feedCategories.map((col) => (
            <button 
              key={col.id}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold font-mono tracking-wider transition-all uppercase shrink-0 ${activeCategoryTab === col.id ? 'bg-primary/10 text-primary border border-primary/20' : 'text-on-surface-variant hover:text-primary border border-transparent'}`}
              onClick={() => handleCategoryClick(col.id)}
            >
              <span className="material-symbols-outlined text-[13px] leading-none">{col.icon}</span>
              <span>{col.label.replace(' Feed', '')}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Column Dashboard */}
      <main className="hidden md:flex pt-16 pb-4 px-4 w-full h-auto overflow-x-auto gap-6 z-10 scrollbar-thin">
        {feedCategories.map((col) => {
          const cardsInCol = feedCards.filter(card => card.category === col.id && card.status === activeFeedFilter);
          return (
            <div 
              id={`col-${col.id.toLowerCase()}`}
              key={col.id} 
              className="min-w-[320px] max-w-[340px] flex-shrink-0 flex flex-col h-auto bg-surface border border-outline-variant rounded-xl shadow-sm animate-subtle-fade"
            >
              <div className="px-5 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-variant/20">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-base ${col.color}`}>{col.icon}</span>
                  <h3 className="font-bold text-xs uppercase tracking-widest text-on-surface">{col.label}</h3>
                </div>
                <span className="font-mono text-[9px] font-bold bg-primary-container text-primary px-2 py-0.5 rounded-full">
                  {cardsInCol.length} MATCHED
                </span>
              </div>
              
              <div className="flex-grow col-snap-container p-4 space-y-4">
                {cardsInCol.length > 0 ? (
                  cardsInCol.map((card) => (
                    <div 
                      key={card.id} 
                      className="col-snap-section w-full aspect-[9/14.2] sahara-card rounded-xl overflow-hidden flex flex-col relative bg-surface border border-outline-variant/60 shadow-sm"
                    >
                      <div className="absolute inset-0 z-0">
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 via-surface-variant/10 to-background opacity-40 transition-all duration-700 hover:opacity-70"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
                      </div>
                      
                      <div className="relative z-10 flex flex-col h-full p-5 justify-between animate-subtle-fade">
                        <div className="flex justify-between items-center shrink-0">
                          {card.status === 'COMING' && (
                            <span className="border border-amber-500/30 bg-amber-500/10 text-amber-500 text-[8px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono uppercase">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shrink-0"></span>
                              Coming Soon
                            </span>
                          )}
                          {card.status === 'ACTIVE' && (
                            <span className="border border-bullish-green/30 bg-bullish-green/10 text-bullish-green text-[8px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono uppercase">
                              <span className="w-1.5 h-1.5 bg-bullish-green rounded-full animate-ping shrink-0"></span>
                              Active Live
                            </span>
                          )}
                          {card.status === 'ENDED' && (
                            <span className="border border-outline/50 bg-surface-container-low text-on-surface-variant/60 text-[8px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono uppercase">
                              <span className="w-1.5 h-1.5 bg-on-surface-variant/30 rounded-full shrink-0"></span>
                              Ended Resolved
                            </span>
                          )}
                          <span className="font-mono font-bold text-[8px] tracking-wider text-primary border border-primary/20 px-1.5 py-0.5 rounded uppercase">
                            {card.drift}
                          </span>
                        </div>

                        <div className="my-1 shrink-0 text-center">
                          <h4 className="font-display font-extrabold text-xs sm:text-sm text-on-surface leading-snug tracking-tight mb-1 text-center line-clamp-2 px-1">
                            {card.title}
                          </h4>
                          <p className="font-mono font-bold text-[8px] text-on-surface-variant/60 uppercase tracking-widest text-center">
                            24H VOL: {card.volume}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-2 shrink-0">
                          <button 
                            disabled={card.status !== 'ACTIVE'}
                            className={`py-2 rounded border transition-all flex flex-col items-center justify-center ${card.status === 'ACTIVE' ? 'border-outline bg-surface hover:border-primary cursor-pointer' : 'border-outline/25 bg-surface-variant/10 opacity-55 cursor-not-allowed'}`}
                            onClick={() => activateTerminalTrade(card.title, card.yesPrice, card.noPrice, card.confidence, card.volume, card.openInterest, card.drift, card.realId)}
                          >
                            <span className="text-[7px] font-bold text-on-surface-variant mb-0.5">YES</span>
                            <span className="font-extrabold text-bullish text-base leading-none">{card.yesProb}%</span>
                          </button>
                          <button 
                            disabled={card.status !== 'ACTIVE'}
                            className={`py-2 rounded border transition-all flex flex-col items-center justify-center ${card.status === 'ACTIVE' ? 'border-outline bg-surface hover:border-primary cursor-pointer' : 'border-outline/25 bg-surface-variant/10 opacity-55 cursor-not-allowed'}`}
                            onClick={() => activateTerminalTrade(card.title, card.yesPrice, card.noPrice, card.confidence, card.volume, card.openInterest, card.drift, card.realId)}
                          >
                            <span className="text-[7px] font-bold text-on-surface-variant mb-0.5">NO</span>
                            <span className="font-extrabold text-bearish text-base leading-none">{card.noProb}%</span>
                          </button>
                        </div>

                        {card.status === 'COMING' && (
                          <button disabled className="w-full bg-surface-container-high text-on-surface-variant/40 border border-outline-variant/60 py-3 rounded font-display font-bold text-[9px] tracking-[0.2em] uppercase cursor-not-allowed shrink-0">
                            COMING SOON
                          </button>
                        )}
                        {card.status === 'ACTIVE' && (
                          <button 
                            className="w-full bg-primary text-white py-3 rounded font-display font-bold text-[9px] tracking-[0.2em] uppercase hover:brightness-105 active:scale-[0.99] transition-all shrink-0"
                            onClick={() => activateTerminalTrade(card.title, card.yesPrice, card.noPrice, card.confidence, card.volume, card.openInterest, card.drift, card.realId)}
                          >
                            PLACE PREDICTION
                          </button>
                        )}
                        {card.status === 'ENDED' && (
                          <button disabled className="w-full bg-surface-container-low text-on-surface-variant/30 border border-outline-variant/30 py-3 rounded font-display font-bold text-[9px] tracking-[0.2em] uppercase cursor-not-allowed shrink-0">
                            MARKET RESOLVED
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-surface-variant/10 border border-dashed border-outline-variant rounded-xl">
                    <span className="material-symbols-outlined text-primary/30 text-3xl mb-2 animate-pulse">inventory_2</span>
                    <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase">NO MATCHING PREDICTIONS</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </main>

      {/* Mobile Stream Feed */}
      <main className="md:hidden pt-44 pb-24 px-4 w-full flex flex-col gap-4 z-10">
        {feedCategories.filter(c => c.id === activeCategoryTab).map((col) => {
          const cardsInCol = feedCards.filter(card => card.category === col.id && card.status === activeFeedFilter);
          return (
            <div key={col.id} className="w-full flex flex-col bg-surface border border-outline-variant rounded-xl shadow-xs animate-subtle-fade">
              <div className="px-4 py-3 border-b border-outline-variant flex justify-between items-center bg-surface-variant/20">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-base ${col.color}`}>{col.icon}</span>
                  <h3 className="font-bold text-xs uppercase tracking-widest text-on-surface">{col.label}</h3>
                </div>
                <span className="font-mono text-[9px] font-bold bg-primary-container text-primary px-2 py-0.5 rounded-full">
                  {cardsInCol.length} MATCHED
                </span>
              </div>
              
              <div className="p-3 space-y-4">
                {cardsInCol.length > 0 ? (
                  cardsInCol.map((card) => (
                    <div 
                      key={card.id} 
                      className="w-full sahara-card rounded-xl overflow-hidden flex flex-col relative bg-surface border border-outline-variant/60 shadow-sm"
                    >
                      <div className="absolute inset-0 z-0">
                        <div className="w-full h-full bg-gradient-to-br from-primary/10 via-surface-variant/5 to-background opacity-45"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent"></div>
                      </div>
                      
                      <div className="relative z-10 flex flex-col p-4 justify-between gap-4">
                        <div className="flex justify-between items-center">
                          {card.status === 'COMING' && (
                            <span className="border border-amber-500/30 bg-amber-500/10 text-amber-500 text-[8px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono uppercase">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                              Coming Soon
                            </span>
                          )}
                          {card.status === 'ACTIVE' && (
                            <span className="border border-bullish-green/30 bg-bullish-green/10 text-bullish-green text-[8px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono uppercase">
                              <span className="w-1.5 h-1.5 bg-bullish-green rounded-full animate-ping"></span>
                              Active Live
                            </span>
                          )}
                          {card.status === 'ENDED' && (
                            <span className="border border-outline/50 bg-surface-container-low text-on-surface-variant/60 text-[8px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono uppercase">
                              <span className="w-1.5 h-1.5 bg-on-surface-variant/30 rounded-full"></span>
                              Ended Resolved
                            </span>
                          )}
                          <span className="font-mono font-bold text-[8px] tracking-wider text-primary border border-primary/20 px-1.5 py-0.5 rounded uppercase">
                            {card.drift}
                          </span>
                        </div>

                        <div className="text-center">
                          <h4 className="font-display font-extrabold text-sm text-on-surface leading-snug tracking-tight mb-1">
                            {card.title}
                          </h4>
                          <p className="font-mono font-bold text-[8px] text-on-surface-variant/60 uppercase tracking-widest">
                            24H VOL: {card.volume}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            disabled={card.status !== 'ACTIVE'}
                            className={`py-2.5 rounded border transition-all flex flex-col items-center justify-center ${card.status === 'ACTIVE' ? 'border-outline bg-surface hover:border-primary cursor-pointer' : 'border-outline/25 bg-surface-variant/10 opacity-55'}`}
                            onClick={() => activateTerminalTrade(card.title, card.yesPrice, card.noPrice, card.confidence, card.volume, card.openInterest, card.drift, card.realId)}
                          >
                            <span className="text-[7px] font-bold text-on-surface-variant mb-0.5">YES</span>
                            <span className="font-extrabold text-bullish text-sm leading-none">{card.yesProb}%</span>
                          </button>
                          <button 
                            disabled={card.status !== 'ACTIVE'}
                            className={`py-2.5 rounded border transition-all flex flex-col items-center justify-center ${card.status === 'ACTIVE' ? 'border-outline bg-surface hover:border-primary cursor-pointer' : 'border-outline/25 bg-surface-variant/10 opacity-55'}`}
                            onClick={() => activateTerminalTrade(card.title, card.yesPrice, card.noPrice, card.confidence, card.volume, card.openInterest, card.drift, card.realId)}
                          >
                            <span className="text-[7px] font-bold text-on-surface-variant mb-0.5">NO</span>
                            <span className="font-extrabold text-bearish text-sm leading-none">{card.noProb}%</span>
                          </button>
                        </div>

                        {card.status === 'COMING' && (
                          <button disabled className="w-full bg-surface-container-high text-on-surface-variant/40 border border-outline-variant/60 py-2.5 rounded font-display font-bold text-[9px] tracking-[0.2em] uppercase">
                            COMING SOON
                          </button>
                        )}
                        {card.status === 'ACTIVE' && (
                          <button 
                            className="w-full bg-primary text-white py-2.5 rounded font-display font-bold text-[9px] tracking-[0.2em] uppercase hover:brightness-105"
                            onClick={() => activateTerminalTrade(card.title, card.yesPrice, card.noPrice, card.confidence, card.volume, card.openInterest, card.drift, card.realId)}
                          >
                            PLACE PREDICTION
                          </button>
                        )}
                        {card.status === 'ENDED' && (
                          <button disabled className="w-full bg-surface-container-low text-on-surface-variant/30 border border-outline-variant/30 py-2.5 rounded font-display font-bold text-[9px] tracking-[0.2em] uppercase">
                            MARKET RESOLVED
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="w-full py-8 flex flex-col items-center justify-center text-center p-6 bg-surface-variant/10 border border-dashed border-outline-variant rounded-xl">
                    <span className="material-symbols-outlined text-primary/30 text-3xl mb-2 animate-pulse">inventory_2</span>
                    <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase">NO MATCHING PREDICTIONS</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
