import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { DbAdapter } from './db_adapter';

// Define __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_DIR = path.join(__dirname, '../../cache');
const CACHE_FILE = path.join(CACHE_DIR, 'pending_markets.json');

// Toggle between filesystem cache and relational SQLite database via Prisma
const USE_PRISMA = process.env.USE_PRISMA === 'true';

export class MarketCache {
    private static ensureCacheExists() {
        if (!fs.existsSync(CACHE_DIR)) {
            fs.mkdirSync(CACHE_DIR, { recursive: true });
        }
        if (!fs.existsSync(CACHE_FILE)) {
            fs.writeFileSync(CACHE_FILE, JSON.stringify([]), 'utf-8');
        }
    }

    static async getPendingMarkets(): Promise<any[]> {
        if (USE_PRISMA) {
            console.log('[MARKET_CACHE] Fetching pending markets from relational SQLite DB via Prisma...');
            return await DbAdapter.getPendingMarkets();
        }
        try {
            this.ensureCacheExists();
            const data = fs.readFileSync(CACHE_FILE, 'utf-8');
            return JSON.parse(data) || [];
        } catch (error) {
            console.error('[MARKET_CACHE] Error reading cache file:', error);
            return [];
        }
    }

    static async addPendingMarket(proposal: any) {
        if (USE_PRISMA) {
            console.log('[MARKET_CACHE] Storing proposal in relational SQLite DB via Prisma...');
            await DbAdapter.addPendingMarket(proposal);
            return;
        }
        try {
            this.ensureCacheExists();
            const markets = await this.getPendingMarkets();
            markets.push(proposal);
            fs.writeFileSync(CACHE_FILE, JSON.stringify(markets, null, 2), 'utf-8');
            console.log(`[MARKET_CACHE] Proposal stored securely in filesystem database cache: ${proposal.title}`);
        } catch (error) {
            console.error('[MARKET_CACHE] Error writing to cache file:', error);
        }
    }

    static async clearPendingMarkets() {
        if (USE_PRISMA) {
            console.log('[MARKET_CACHE] Clearing pending markets in relational SQLite DB via Prisma...');
            await DbAdapter.clearPendingMarkets();
            return;
        }
        try {
            this.ensureCacheExists();
            fs.writeFileSync(CACHE_FILE, JSON.stringify([]), 'utf-8');
            console.log('[MARKET_CACHE] Pending markets filesystem cache cleared.');
        } catch (error) {
            console.error('[MARKET_CACHE] Error clearing cache file:', error);
        }
    }
}
