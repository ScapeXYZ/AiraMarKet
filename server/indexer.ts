import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import { ProviderFactory } from './services/providerFactory';
import { ContractFactory } from './services/contractFactory';

const prisma = new PrismaClient();

export class IndexerService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private lastProcessedBlock: number = 0;
  private isPolling: boolean = false;

  constructor() {
    this.provider = ProviderFactory.getProvider();
    this.contract = ContractFactory.getContract('AiraMarketProtocol', this.provider);
  }

  async startIndexing() {
    const contractAddress = this.contract.target as string;
    if (!contractAddress) {
        console.error("[INDEXER] Missing contract address for AiraMarketProtocol");
        return;
    }
    console.log(`[INDEXER] Starting real-time block polling indexer for contract ${contractAddress}...`);

    try {
        const currentBlock = await this.provider.getBlockNumber();
        // Start from recent blocks to avoid querying too many historical logs initially
        this.lastProcessedBlock = Math.max(0, currentBlock - 500); 
        console.log(`[INDEXER] Initialized block indexing from block ${this.lastProcessedBlock}`);
    } catch (e: any) {
        console.error("[INDEXER] Failed to get initial block number, defaulting to 0:", e.message);
        this.lastProcessedBlock = 0;
    }

    // Poll every 10 seconds
    setInterval(() => {
        this.pollEvents();
    }, 10000);
    
    // Trigger first poll immediately
    this.pollEvents();
  }

  async pollEvents() {
    if (this.isPolling) return;
    this.isPolling = true;
    try {
      const latestBlock = await this.provider.getBlockNumber();
      if (latestBlock > this.lastProcessedBlock) {
        const fromBlock = this.lastProcessedBlock + 1;
        const toBlock = latestBlock;

        console.log(`[INDEXER] Polling blocks ${fromBlock} to ${toBlock}...`);
        
        // Fetch all events for the contract in the block range
        const logs = await this.contract.queryFilter("*", fromBlock, toBlock);

        for (const log of logs) {
          try {
            await this.processLog(log);
          } catch (err: any) {
            console.error(`[INDEXER] Error processing log:`, err.message);
          }
        }

        this.lastProcessedBlock = toBlock;
      }
    } catch (error: any) {
      console.error("[INDEXER] Error during polling cycle:", error.message);
    } finally {
      this.isPolling = false;
    }
  }

  async processLog(log: any) {
    const eventName = log.eventName;
    if (!eventName) return;

    const txHash = log.transactionHash || log.log?.transactionHash || `tx-${Date.now()}`;

    if (eventName === "MarketCreated") {
      const [id, title, category, expiry, creator] = log.args;
      console.log(`[INDEXER] New Market Created: ${title} (ID: ${id})`);
      try {
        await prisma.market.create({
          data: {
            id: Number(id),
            title,
            category,
          }
        });
      } catch (e: any) {
        if (!e.message.includes("Unique constraint failed")) {
          console.error("[INDEXER] Failed to insert Market:", e.message);
        }
      }
    } else if (eventName === "TradeRecorded") {
      const [marketId, user, position, amount] = log.args;
      const isYes = position === "YES";
      console.log(`[INDEXER] Trade Recorded: Market ${marketId}, User ${user}, Amount ${amount}`);
      try {
        const userAddr = user.toLowerCase();
        // Ensure user exists
        await prisma.user.upsert({
          where: { address: userAddr },
          update: { totalVolume: { increment: Number(ethers.formatEther(amount)) } },
          create: { address: userAddr, totalVolume: Number(ethers.formatEther(amount)) }
        });

        // Create trade
        await prisma.trade.create({
          data: {
            id: txHash,
            marketId: Number(marketId),
            userAddr: userAddr,
            isYes,
            amount: Number(ethers.formatEther(amount)),
          }
        });

        // Update market pool
        const poolUpdate = isYes 
          ? { totalYesPool: { increment: Number(ethers.formatEther(amount)) } } 
          : { totalNoPool: { increment: Number(ethers.formatEther(amount)) } };
          
        await prisma.market.update({
          where: { id: Number(marketId) },
          data: poolUpdate
        });
      } catch (e: any) {
        if (!e.message.includes("Unique constraint failed")) {
          console.error("[INDEXER] Failed to record Trade:", e.message);
        }
      }
    } else if (eventName === "MarketResolved") {
      const [marketId, outcome, resolver] = log.args;
      console.log(`[INDEXER] Market ${marketId} Resolved. Outcome: ${outcome ? "YES" : "NO"}`);
      try {
        await prisma.market.update({
          where: { id: Number(marketId) },
          data: { resolved: true, outcome }
        });
      } catch (e: any) {
        console.error("[INDEXER] Failed to resolve Market:", e.message);
      }
    } else if (eventName === "WinningsRedeemed") {
      const [marketId, user, amount] = log.args;
      console.log(`[INDEXER] Winnings Redeemed: Market ${marketId}, User ${user}, Amount ${amount}`);
      try {
        const userAddr = user.toLowerCase();
        await prisma.user.update({
          where: { address: userAddr },
          data: { totalWinnings: { increment: Number(ethers.formatEther(amount)) } }
        });
      } catch (e: any) {
        console.error("[INDEXER] Failed to log winnings:", e.message);
      }
    }
  }
}

export const indexer = new IndexerService();
