import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

/**
 * Mantle Network Blockchain Oracle Service
 * Handles verifiable resolutions of markets on Mantle
 */
export class MantleService {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private contractAddress: string;

    constructor() {
        const rpcUrl = process.env.MANTLE_RPC_URL || 'https://rpc.sepolia.mantle.xyz';
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        
        const pk = process.env.PRIVATE_KEY;
        if (!pk) {
             console.error("[MANTLE_SERVICE] FATAL: PRIVATE_KEY is missing from environment variables!");
             process.exit(1);
        }
        this.wallet = new ethers.Wallet(pk, this.provider);
        this.contractAddress = process.env.VITE_MANTLE_CONTRACT_ADDRESS || "";
        if (!this.contractAddress) {
            console.warn("[MANTLE_SERVICE] VITE_MANTLE_CONTRACT_ADDRESS is not set. Oracle resolution will fail.");
        } else {
            this.listenToEvents();
        }
    }

    listenToEvents() {
        console.log(`[MANTLE_SERVICE] Connecting to smart contract events at ${this.contractAddress}`);
        const abi = [
            "event MarketCreated(uint256 indexed id, string title, string category, uint256 expiry, address creator)",
            "event MarketResolved(uint256 indexed marketId, bool outcome, address resolver)"
        ];
        const marketContract = new ethers.Contract(this.contractAddress, abi, this.provider);
        
        marketContract.on("MarketCreated", (id, title, category, expiry, creator) => {
            console.log(`\n[ON-CHAIN EVENT] New Market Created: ${title} (ID: ${id}) by ${creator}`);
        });

        marketContract.on("MarketResolved", (marketId, outcome, resolver) => {
            console.log(`\n[ON-CHAIN EVENT] Market ${marketId} Resolved as ${outcome ? 'YES' : 'NO'} by ${resolver}`);
        });
    }

    async resolveMarket(marketId: number, outcome: boolean) {
        console.log(`[MANTLE_ORACLE] Attempting to resolve market ${marketId} on-chain with outcome: ${outcome ? 'YES' : 'NO'}`);
        
        try {
            const abi = ["function resolveMarket(uint256 _marketId, bool _outcome) external"];
            const marketContract = new ethers.Contract(this.contractAddress, abi, this.wallet);
            
            // Execute real on-chain transaction
            const tx = await marketContract.resolveMarket(marketId, outcome);
            console.log(`[MANTLE_ORACLE] Tx submitted to Mantle! Hash: ${tx.hash}`);
            
            await tx.wait();
            console.log(`[MANTLE_ORACLE] Resolution Confirmed for Market ID: ${marketId}`);
            
            return { success: true, txHash: tx.hash };
        } catch (error: any) {
            console.error(`[MANTLE_ORACLE] Resolution Failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
}

export const mantleService = new MantleService();
