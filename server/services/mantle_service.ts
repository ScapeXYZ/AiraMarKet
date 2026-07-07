import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import { ProviderFactory } from './providerFactory';
import { ContractFactory } from './contractFactory';
import { loadDeployment } from '../../deployments/loader';
dotenv.config({ path: '../../.env' });

/**
 * Verifiable Prediction Market Oracle Service
 * Handles verifiable resolutions of markets on the configured blockchain network
 */
export class MantleService {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private contractAddress: string;

    constructor() {
        this.provider = ProviderFactory.getProvider();
        
        const pk = process.env.PRIVATE_KEY;
        if (!pk) {
             console.error("[MANTLE_SERVICE] FATAL: PRIVATE_KEY is missing from environment variables!");
             process.exit(1);
        }
        this.wallet = new ethers.Wallet(pk, this.provider);
        
        // Load target contract address via deployment loader
        const deployment = loadDeployment('AiraMarketProtocol');
        this.contractAddress = deployment.address;
        
        if (!this.contractAddress) {
            console.warn("[MANTLE_SERVICE] Contract address is not configured. Oracle resolution will fail.");
        }
    }

    listenToEvents() {
        console.log(`[MANTLE_SERVICE] Connecting to smart contract events at ${this.contractAddress}`);
        
        // Instantiate contract using ContractFactory
        const marketContract = ContractFactory.getContract('AiraMarketProtocol', this.provider);
        
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
            // Obtain contract instance bound to signer wallet
            const marketContract = ContractFactory.getContract('AiraMarketProtocol', this.wallet);
            
            // Execute real on-chain transaction
            const tx = await marketContract.resolveMarket(marketId, outcome);
            console.log(`[MANTLE_ORACLE] Tx submitted! Hash: ${tx.hash}`);
            
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
