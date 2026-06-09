import { PrismaClient } from '@prisma/client';

export class DbAdapter {
    private static prisma: PrismaClient;

    static getClient() {
        if (!this.prisma) {
            this.prisma = new PrismaClient();
        }
        return this.prisma;
    }

    static async getPendingMarkets(): Promise<any[]> {
        try {
            const client = this.getClient();
            const records = await client.pendingMarket.findMany({
                orderBy: { createdAt: 'asc' }
            });
            return records;
        } catch (error) {
            console.error('[DB_ADAPTER] Error fetching pending markets:', error);
            return [];
        }
    }

    static async addPendingMarket(proposal: any) {
        try {
            const client = this.getClient();
            await client.pendingMarket.create({
                data: {
                    title: proposal.title || '',
                    category: proposal.category || '',
                    expiry: String(proposal.expiry || ''),
                    confidence: Number(proposal.confidence || 0),
                    sentiment: proposal.sentiment || '',
                    status: proposal.status || 'PENDING_APPROVAL'
                }
            });
            console.log(`[DB_ADAPTER] Stored proposal in SQLite relational DB successfully: ${proposal.title}`);
        } catch (error) {
            console.error('[DB_ADAPTER] Error writing to SQLite DB:', error);
        }
    }

    static async clearPendingMarkets() {
        try {
            const client = this.getClient();
            await client.pendingMarket.deleteMany({});
            console.log('[DB_ADAPTER] SQLite pending markets cleared.');
        } catch (error) {
            console.error('[DB_ADAPTER] Error clearing SQLite DB:', error);
        }
    }
}
