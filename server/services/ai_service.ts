import { NormalizedSignal } from './signal_ingestion';

/**
 * AIRA AI Intelligence Service
 * Handles prompt generation, confidence scoring, and outcome prediction.
 */
export class AIService {
    static async generateMarketProposal(signal: NormalizedSignal) {
        // Structuring the prediction market from live web signals
        console.log(`[AI_SERVICE] Analyzing signal for ${signal.category.toUpperCase()}: ${signal.topic.substring(0, 50)}...`);
        
        // Calculate a highly realistic and deterministic confidence score based on signal strength & sentiment
        // Base confidence is signal_strength mapped from [10, 100] to [0.5, 0.9]
        let baseConfidence = 0.5 + (Math.min(100, Math.max(10, signal.signal_strength)) - 10) * 0.0044; // maps 10-100 to 0.5-0.9
        
        // Slightly amplify confidence if the sentiment is bullish or bearish (stronger trend direction)
        if (signal.sentiment === 'bullish' || signal.sentiment === 'bearish') {
            baseConfidence += 0.05;
        }
        
        const confidence = parseFloat(Math.min(0.95, Math.max(0.6, baseConfidence)).toFixed(2));

        return {
            category: signal.category,
            title: `Will ${signal.topic.substring(0, 40).trim()}... occur?`,
            description: `Prediction market based on recent ${signal.sentiment} news: ${signal.topic}`,
            expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            confidence,
            inputSignals: JSON.stringify({ source: signal.source, topic: signal.topic, strength: signal.signal_strength, sentiment: signal.sentiment }),
            reason: `Generated from ${signal.source} exhibiting a ${signal.sentiment} sentiment score of ${signal.signal_strength}.`
        };
    }


}
