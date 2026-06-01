import { cryptoAgent } from './agents/crypto_agent';
import { sportsAgent } from './agents/sports_agent';
import { politicsAgent } from './agents/politics_agent';
import { techAgent } from './agents/tech_agent';
import { marketService } from './services/market_service';
import { SignalIngestionService } from './services/signal_ingestion';
import * as http from 'http';
import { TransparencyLogger } from './services/transparency_logger';

console.log("🚀 Starting AIRA Markets Autonomous Backend...");

cryptoAgent;
sportsAgent;
politicsAgent;
techAgent;
marketService;

setTimeout(() => {
    SignalIngestionService.runIngestionCycle();
}, 2000);

// HTTP Server to accept verifiable transparency logs from Frontend
const server = http.createServer((req, res) => {
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
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(3001, () => {
    console.log("🔒 Transparency Log server running on port 3001");
});
