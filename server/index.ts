import { cryptoAgent } from './agents/crypto_agent';
import { sportsAgent } from './agents/sports_agent';
import { politicsAgent } from './agents/politics_agent';
import { techAgent } from './agents/tech_agent';
import { marketService } from './services/market_service';
import { SignalIngestionService } from './services/signal_ingestion';
import * as http from 'http';
import { TransparencyLogger } from './services/transparency_logger';
import { MarketCache } from './services/market_cache';
import { exec } from 'child_process';

console.log("[SYSTEM] Starting AIRA Markets Autonomous Backend...");

async function runPrismaMigrations() {
    if (process.env.USE_PRISMA === 'true') {
        console.log("[DB] USE_PRISMA is enabled. Running database migrations/push...");
        return new Promise<void>((resolve) => {
            exec('npx prisma db push --accept-data-loss', (error, stdout, stderr) => {
                if (error) {
                    console.error("[DB ERROR] Prisma db push failed:", error.message);
                } else {
                    console.log("[DB OK] Prisma database schema synchronized successfully.");
                }
                resolve();
            });
        });
    }
}

import { indexer } from './indexer';

// Start sequence
runPrismaMigrations().then(() => {
    indexer.startIndexing();
    cryptoAgent;
    sportsAgent;
    politicsAgent;
    techAgent;
    marketService;

    setTimeout(() => {
        SignalIngestionService.runIngestionCycle();
        setInterval(() => {
            SignalIngestionService.runIngestionCycle();
        }, 60000); // 1 minute interval for continuous AI market generation
    }, 2000);
});

// HTTP Server to accept verifiable transparency logs from Frontend
const server = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/log-transparency') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);
                TransparencyLogger.logApproval(
                    payload.txHash,
                    payload.title,
                    payload.category,
                    payload.inputSignals,
                    payload.reason,
                    payload.confidence,
                    payload.decision
                );
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'Logged verifiably' }));
            } catch (err) {
                res.writeHead(400);
                res.end('Invalid JSON');
            }
        });
        return;
    }

    if (req.method === 'POST' && req.url === '/resolve-market') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const { mantleService } = await import('./services/mantle_service');
                const payload = JSON.parse(body);
                const result = await mantleService.resolveMarket(Number(payload.marketId), payload.outcome === true);
                if (result.success) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                } else {
                    res.writeHead(500);
                    res.end(JSON.stringify(result));
                }
            } catch (err) {
                res.writeHead(400);
                res.end('Failed');
            }
        });
        return;
    }

    if (req.method === 'GET' && req.url === '/pending-markets') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        const pending = await MarketCache.getPendingMarkets();
        res.end(JSON.stringify(pending));
        await MarketCache.clearPendingMarkets(); // Clear after sending to avoid duplicates
        return;
    }

    if (req.method === 'GET' && req.url === '/live-trending') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        const signals = SignalIngestionService.getRecentSignals();
        res.end(JSON.stringify(signals));
        return;
    }

    if (req.method === 'GET' && req.url?.startsWith('/api/portfolio/')) {
        const address = req.url.split('/').pop()?.toLowerCase();
        if (!address) {
            res.writeHead(400); res.end('Invalid address'); return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        try {
            const { PrismaClient } = await import('@prisma/client');
            const prisma = new PrismaClient();
            
            const user = await prisma.user.findUnique({
                where: { address },
                include: { trades: { include: { market: true } } }
            });
            
            if (!user) {
                res.end(JSON.stringify({ totalWinnings: 0, activePositions: 0 }));
                return;
            }

            const activePositionsList = [];
            const uniqueActiveMarkets = new Set();
            for (const trade of user.trades) {
                if (!trade.market.resolved && !uniqueActiveMarkets.has(trade.marketId)) {
                    uniqueActiveMarkets.add(trade.marketId);
                    activePositionsList.push({
                        id: trade.marketId,
                        title: trade.market.title,
                        side: trade.isYes ? 'YES' : 'NO',
                        amount: trade.amount
                    });
                }
            }
            
            res.end(JSON.stringify({ 
                totalWinnings: user.totalWinnings, 
                activePositionsCount: uniqueActiveMarkets.size,
                activePositions: activePositionsList
            }));
        } catch(e) {
            res.writeHead(500); res.end('DB Error');
        }
        return;
    }

    res.writeHead(404);
    res.end('Not Found');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`[SERVER] Transparency Log server running on port ${PORT}`);
});
