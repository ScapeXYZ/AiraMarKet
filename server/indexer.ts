import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Use the ABI elements we care about indexing
const marketAbi = [
  "event MarketCreated(uint256 indexed id, string title, string category, uint256 expiry, address creator)",
  "event TradeRecorded(uint256 indexed marketId, address indexed user, string position, uint256 amount)",
  "event MarketResolved(uint256 indexed marketId, bool outcome, address resolver)",
  "event WinningsRedeemed(uint256 indexed marketId, address indexed user, uint256 amount)"
];

const CONTRACT_ADDRESS = process.env.VITE_MANTLE_CONTRACT_ADDRESS || "";

export class IndexerService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;

  constructor() {
    // Read from .env, fallback to Sepolia Testnet to avoid breaking current environment
    const rpcUrl = process.env.MANTLE_RPC_URL || "https://rpc.sepolia.mantle.xyz";
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.contract = new ethers.Contract(CONTRACT_ADDRESS, marketAbi, this.provider);
  }

  async startIndexing() {
    if (!CONTRACT_ADDRESS) {
        console.error("[INDEXER] Missing VITE_MANTLE_CONTRACT_ADDRESS in .env");
        return;
    }
    console.log(`[INDEXER] Starting real-time indexing for contract ${CONTRACT_ADDRESS}...`);

    this.contract.on("MarketCreated", async (id, title, category, expiry, creator, event) => {
      console.log(`[INDEXER] New Market Created: ${title} (ID: ${id})`);
      try {
          await prisma.market.create({
            data: {
              id: Number(id),
              title,
              category,
            }
          });
      } catch (e) {
          console.error("[INDEXER] Failed to insert Market:", e);
      }
    });

    this.contract.on("TradeRecorded", async (marketId, user, position, amount, event) => {
      const isYes = position === "YES";
      console.log(`[INDEXER] Trade Recorded: Market ${marketId}, User ${user}, Amount ${amount}`);
      try {
          // Ensure user exists
          await prisma.user.upsert({
            where: { address: user },
            update: { totalVolume: { increment: Number(ethers.formatEther(amount)) } },
            create: { address: user, totalVolume: Number(ethers.formatEther(amount)) }
          });

          // Create trade
          await prisma.trade.create({
            data: {
              id: event.log.transactionHash,
              marketId: Number(marketId),
              userAddr: user,
              isYes,
              amount: Number(ethers.formatEther(amount)),
            }
          });

          // Update market pool
          const poolUpdate = isYes ? { totalYesPool: { increment: Number(ethers.formatEther(amount)) } } : { totalNoPool: { increment: Number(ethers.formatEther(amount)) } };
          await prisma.market.update({
              where: { id: Number(marketId) },
              data: poolUpdate
          });
      } catch (e) {
          console.error("[INDEXER] Failed to record Trade:", e);
      }
    });

    this.contract.on("MarketResolved", async (marketId, outcome, resolver, event) => {
      console.log(`[INDEXER] Market ${marketId} Resolved. Outcome: ${outcome ? "YES" : "NO"}`);
      try {
          await prisma.market.update({
            where: { id: Number(marketId) },
            data: { resolved: true, outcome }
          });
      } catch (e) {
          console.error("[INDEXER] Failed to resolve Market:", e);
      }
    });

    this.contract.on("WinningsRedeemed", async (marketId, user, amount, event) => {
      console.log(`[INDEXER] Winnings Redeemed: Market ${marketId}, User ${user}, Amount ${amount}`);
      try {
          // Update User.totalWinnings dynamically!
          await prisma.user.update({
            where: { address: user },
            data: { totalWinnings: { increment: Number(amount) } } // Keep as raw numeric format for precision
          });
      } catch (e) {
          console.error("[INDEXER] Failed to log winnings:", e);
      }
    });
  }
}

export const indexer = new IndexerService();
