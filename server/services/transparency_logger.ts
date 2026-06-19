import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TransparencyLogger {
    static logApproval(txHash: string, title: string, category: string, inputSignals: string, reason: string, confidence: number, decision: string) {
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
            inputSignals: inputSignals,
            aiReasoning: reason,
            confidenceScore: confidence,
            finalApprovalDecision: decision
        };

        fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
        
        // Dynamically update formatted_transparency.json
        const formattedLogFile = path.join(logDir, 'formatted_transparency.json');
        let formattedEntries: any[] = [];
        if (fs.existsSync(formattedLogFile)) {
            try {
                const content = fs.readFileSync(formattedLogFile, 'utf-8');
                formattedEntries = JSON.parse(content);
                if (!Array.isArray(formattedEntries)) {
                    formattedEntries = [];
                }
            } catch (e) {
                formattedEntries = [];
            }
        }
        formattedEntries.push(logEntry);
        fs.writeFileSync(formattedLogFile, JSON.stringify(formattedEntries, null, 2), 'utf-8');

        console.log(`[TRANSPARENCY] Log written securely for txHash: ${txHash}`);
    }
}
