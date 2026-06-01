import * as fs from 'fs';
import * as path from 'path';

export class TransparencyLogger {
    static logApproval(txHash: string, title: string, category: string, reason: string, confidence: number, decision: string) {
        const logDir = path.join(__dirname, '../../logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        const logFile = path.join(logDir, 'aira_transparency.log');
        
        // Structure exact verifiable format as requested
        const logEntry = {
            timestamp: new Date().toISOString(),
            txHash,
            marketTitle: title,
            category: category,
            aiReasoning: reason,
            confidenceScore: confidence,
            finalApprovalDecision: decision
        };

        fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
        console.log(`[TRANSPARENCY] Log written securely for txHash: ${txHash}`);
    }
}
