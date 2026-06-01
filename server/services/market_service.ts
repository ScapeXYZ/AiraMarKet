import { eventBus, SystemEvents } from '../core/event_bus';

/**
 * Orchestrates Market Lifecycle: ASSISTED ONLY
 * AI generates suggestions, but does NOT deploy to smart contracts automatically.
 * User must manually approve and sign the transaction via MetaMask.
 */
export class MarketService {
    constructor() {
        eventBus.on(SystemEvents.MARKET_APPROVED, this.handleMarketApproval.bind(this));
    }

    async handleMarketApproval(proposal: any) {
        console.log(`[MARKET_SERVICE] AI Suggestion Generated: ${proposal.title} (Confidence: ${proposal.confidence})`);
        console.log(`[MARKET_SERVICE] WAITING FOR USER APPROVAL TO DEPLOY ON-CHAIN.`);
        
        // Broadcast the Suggested Event to Frontend/DB for User Approval
        eventBus.emit(SystemEvents.MARKET_SUGGESTED, {
            ...proposal,
            status: 'PENDING_APPROVAL'
        });

        // Store into global memory for frontend polling
        if (!(global as any).pendingMarkets) {
            (global as any).pendingMarkets = [];
        }
        (global as any).pendingMarkets.push(proposal);
    }
}

export const marketService = new MarketService();
