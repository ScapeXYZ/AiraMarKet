import { ethers } from 'ethers';
import { getActiveChainConfig } from '../../config/chains/loader';

/**
 * ProviderFactory
 * Standardizes the instantiation and caching of JSON-RPC providers,
 * and prepares for future WebSocket providers.
 */
export class ProviderFactory {
  private static providerCache: Record<string, ethers.JsonRpcProvider> = {};
  private static wsProviderCache: Record<string, ethers.WebSocketProvider> = {};

  /**
   * Returns a cached or new JsonRpcProvider for the given RPC URL.
   * If no RPC URL is provided, the active chain's configured RPC is used.
   */
  public static getProvider(rpcUrl?: string): ethers.JsonRpcProvider {
    const activeConfig = getActiveChainConfig();
    const targetRpc = rpcUrl || activeConfig.rpcUrl;

    if (!targetRpc) {
      throw new Error("[PROVIDER_FACTORY] RPC URL is not defined or configured.");
    }

    if (!this.providerCache[targetRpc]) {
      console.log(`[PROVIDER_FACTORY] Initializing new JsonRpcProvider for: ${targetRpc}`);
      this.providerCache[targetRpc] = new ethers.JsonRpcProvider(targetRpc);
    }

    return this.providerCache[targetRpc];
  }

  /**
   * Returns a cached or new WebSocketProvider for the given WebSocket URL.
   */
  public static getWebSocketProvider(wsUrl: string): ethers.WebSocketProvider {
    if (!this.wsProviderCache[wsUrl]) {
      console.log(`[PROVIDER_FACTORY] Initializing new WebSocketProvider for: ${wsUrl}`);
      this.wsProviderCache[wsUrl] = new ethers.WebSocketProvider(wsUrl);
    }
    return this.wsProviderCache[wsUrl];
  }
}
