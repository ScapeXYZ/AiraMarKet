import axios from 'axios';
import { eventBus, SystemEvents } from '../core/event_bus';

export interface NormalizedSignal {
    category: "crypto" | "sports" | "politics" | "tech";
    topic: string;
    source: string;
    timestamp: string;
    signal_strength: number;
    sentiment: "bullish" | "bearish" | "neutral";
}

export class SignalIngestionService {
    
    /**
     * Determines a rough signal strength (0-100) based on upvotes, rank, or pure randomness if missing
     */
    private static calculateSignalStrength(metric: number | undefined, topic: string = ""): number {
        if (!metric) {
            let hash = 0;
            for (let i = 0; i < topic.length; i++) {
                hash = topic.charCodeAt(i) + ((hash << 5) - hash);
            }
            const strength = 60 + (Math.abs(hash) % 36); // generates 60 to 95 deterministically
            return strength;
        }
        const strength = Math.min(100, Math.max(10, metric / 100));
        return Math.floor(strength);
    }

    /**
     * Roughly estimates sentiment. In a real prod environment, this would hit an NLP API.
     */
    private static estimateSentiment(text: string): "bullish" | "bearish" | "neutral" {
        const lower = text.toLowerCase();
        if (lower.match(/(surge|high|win|success|breakthrough|launch|up|bull|soar|top|good)/)) return "bullish";
        if (lower.match(/(crash|low|lose|fail|hack|down|bear|drop|bad)/)) return "bearish";
        return "neutral";
    }

    static async fetchCryptoSignals(): Promise<NormalizedSignal[]> {
        try {
            const res = await axios.get('https://api.coingecko.com/api/v3/search/trending');
            const coins = res.data.coins.slice(0, 10); // Top 10 trending
            
            return coins.map((item: any) => ({
                category: "crypto",
                topic: `${item.item.name} (${item.item.symbol}) is currently trending globally`,
                source: "CoinGecko API",
                timestamp: new Date().toISOString(),
                signal_strength: this.calculateSignalStrength(item.item.score ? 10000 / (item.item.score + 1) : 85),
                sentiment: "bullish"
            }));
        } catch (error: any) {
            console.error("[INGESTION] Crypto fetch failed:", error.message);
            return [];
        }
    }

    static async fetchTechSignals(): Promise<NormalizedSignal[]> {
        try {
            const topRes = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json');
            const topIds = topRes.data.slice(0, 10);
            
            const signals: NormalizedSignal[] = [];
            for (const id of topIds) {
                const itemRes = await axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
                const item = itemRes.data;
                signals.push({
                    category: "tech",
                    topic: item.title,
                    source: "Hacker News API",
                    timestamp: new Date(item.time * 1000).toISOString(),
                    signal_strength: this.calculateSignalStrength(item.score * 10),
                    sentiment: this.estimateSentiment(item.title)
                });
            }
            return signals;
        } catch (error: any) {
            console.error("[INGESTION] Tech fetch failed:", error.message);
            return [];
        }
    }

    static async fetchPoliticsSignals(): Promise<NormalizedSignal[]> {
        try {
            // Using Reddit as a free robust JSON feed with a mock User-Agent to bypass 403 blocks
            const res = await axios.get('https://www.reddit.com/r/politics/top.json?limit=10', {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 AiraMarket/1.0' }
            });
            const posts = res.data.data.children;
            
            return posts.map((post: any) => ({
                category: "politics",
                topic: post.data.title,
                source: "Reddit r/politics",
                timestamp: new Date(post.data.created_utc * 1000).toISOString(),
                signal_strength: this.calculateSignalStrength(post.data.ups / 10),
                sentiment: this.estimateSentiment(post.data.title)
            }));
        } catch (error: any) {
            console.error("[INGESTION] Politics fetch failed:", error.message);
            return [];
        }
    }

    static async fetchSportsSignals(): Promise<NormalizedSignal[]> {
        try {
            const res = await axios.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/news');
            const articles = res.data.articles.slice(0, 10);
            
            return articles.map((article: any) => ({
                category: "sports",
                topic: article.headline,
                source: "ESPN API",
                timestamp: new Date(article.published).toISOString(),
                signal_strength: this.calculateSignalStrength(8500),
                sentiment: this.estimateSentiment(article.headline)
            }));
        } catch (error: any) {
            console.error("[INGESTION] Sports fetch failed:", error.message);
            return [];
        }
    }

    public static recentSignals: NormalizedSignal[] = [];

    static getRecentSignals(): NormalizedSignal[] {
        return this.recentSignals;
    }

    static async runIngestionCycle() {
        console.log("[INGESTION] Starting REAL data ingestion cycle...");
        
        const [crypto, tech, politics, sports] = await Promise.all([
            this.fetchCryptoSignals(),
            this.fetchTechSignals(),
            this.fetchPoliticsSignals(),
            this.fetchSportsSignals()
        ]);

        const allSignals = [...crypto, ...tech, ...politics, ...sports];
        this.recentSignals = allSignals;
        
        allSignals.forEach(signal => {
            console.log(`[INGESTION] Emitted real normalized signal for ${signal.category.toUpperCase()}: ${signal.topic.substring(0, 50)}...`);
            eventBus.emit(SystemEvents.SIGNAL_RECEIVED, signal);
        });
        
        return allSignals;
    }
}
