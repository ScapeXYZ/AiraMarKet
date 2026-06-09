export const trendingSuggestions = [
  {
    id: 'tech_1',
    category: 'TECH',
    title: 'GPT-5 Autumn Release',
    prompt: 'Create a market for OpenAI announcing GPT-5 before October 2025',
    volume: '$3.4M',
    hotness: '98%',
    icon: 'developer_board'
  },
  {
    id: 'tech_2',
    category: 'TECH',
    title: 'Foldable Apple iPhone',
    prompt: 'Create a market for Apple launching its first fully foldable iPhone in 2025',
    volume: '$1.8M',
    hotness: '89%',
    icon: 'devices'
  },
  {
    id: 'tech_3',
    category: 'TECH',
    title: 'AGI Verification by Lab',
    prompt: 'Create a market for a major AI laboratory claiming to achieve AGI by 2026',
    volume: '$5.1M',
    hotness: '94%',
    icon: 'psychology'
  },
  {
    id: 'crypto_1',
    category: 'CRYPTO',
    title: 'Bitcoin $150K Target',
    prompt: 'Create a market for BTC crossing $150k before July 2025',
    volume: '$18.9M',
    hotness: '97%',
    icon: 'currency_bitcoin'
  },
  {
    id: 'crypto_2',
    category: 'CRYPTO',
    title: 'Solana Active Users Spike',
    prompt: 'Create a market for Solana active addresses exceeding 5 million in Q3',
    volume: '$4.1M',
    hotness: '92%',
    icon: 'token'
  },
  {
    id: 'crypto_3',
    category: 'CRYPTO',
    title: 'ETH Spot ETF Net Inflow',
    prompt: 'Create a market for ETH spot ETFs achieving $1B net inflow in first 10 days of release',
    volume: '$8.2M',
    hotness: '85%',
    icon: 'account_balance_wallet'
  },
  {
    id: 'politics_1',
    category: 'POLITICS',
    title: 'US Election Vote Speed',
    prompt: 'Create a market for the US presidential election resolution happening within 24 hours of closing',
    volume: '$45.1M',
    hotness: '99%',
    icon: 'gavel'
  },
  {
    id: 'politics_2',
    category: 'POLITICS',
    title: 'UK Snap Election Timeline',
    prompt: 'Create a market for the UK Prime Minister calling for a snap election before 2026',
    volume: '$5.9M',
    hotness: '76%',
    icon: 'storefront'
  },
  {
    id: 'general_1',
    category: 'SPORTS',
    title: 'Real Madrid Trophy Run',
    prompt: 'Create a market for Real Madrid winning the next Champions League final',
    volume: '$6.2M',
    hotness: '84%',
    icon: 'sports_soccer'
  },
  {
    id: 'general_2',
    category: 'TECH',
    title: 'SpaceX Starship Booster Catch',
    prompt: 'Create a market for SpaceX catching the Starship booster on IFT-5',
    volume: '$18.4M',
    hotness: '96%',
    icon: 'rocket_launch'
  }
];

export const getLeaderboardData = (profileNickname, profilePicture) => [
  { rank: 1, user: "MantleWhale", avatar: "https://i.pravatar.cc/150?u=1", winRate: "89%", volume: "$4.2M", profit: "+$1.1M" },
  { rank: 2, user: "0xQuantum", avatar: "https://i.pravatar.cc/150?u=2", winRate: "76%", volume: "$2.8M", profit: "+$890K" },
  { rank: 3, user: "AlphaSeeker", avatar: "https://i.pravatar.cc/150?u=3", winRate: "82%", volume: "$1.9M", profit: "+$640K" },
  { rank: 4, user: "DeFi_Ninja", avatar: "https://i.pravatar.cc/150?u=4", winRate: "71%", volume: "$1.5M", profit: "+$420K" },
  { rank: 5, user: profileNickname, avatar: profilePicture, winRate: "68%", volume: "$1.2M", profit: "+$310K" },
];

export const feedCategories = [
  { id: 'TECH', label: 'Tech Feed', icon: 'developer_board', color: 'text-bearish' },
  { id: 'CRYPTO', label: 'Crypto Feed', icon: 'currency_bitcoin', color: 'text-primary' },
  { id: 'SPORTS', label: 'Sports Feed', icon: 'sports_soccer', color: 'text-bullish-green' },
  { id: 'POLITICS', label: 'Politics Feed', icon: 'gavel', color: 'text-bullish' }
];
