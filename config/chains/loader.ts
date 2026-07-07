import { ChainConfig } from './types';
import { chains } from './index';

// Helper to look up environment variables statically, supporting both Node process.env and Vite import.meta.env
export function getEnv(key: string): string | undefined {
  // Check backend process.env first
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  
  // Statically check all variables to ensure Vite can replace them at compile time!
  try {
    if (key === 'DEFAULT_CHAIN') {
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_DEFAULT_CHAIN) {
        // @ts-ignore
        return import.meta.env.VITE_DEFAULT_CHAIN;
      }
    }
    if (key === 'RPC_URL') {
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_RPC_URL) {
        // @ts-ignore
        return import.meta.env.VITE_RPC_URL;
      }
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_MANTLE_RPC_URL) {
        // @ts-ignore
        return import.meta.env.VITE_MANTLE_RPC_URL;
      }
    }
    if (key === 'CHAIN_ID') {
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_CHAIN_ID) {
        // @ts-ignore
        return import.meta.env.VITE_CHAIN_ID;
      }
    }
    if (key === 'BLOCK_EXPLORER') {
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BLOCK_EXPLORER) {
        // @ts-ignore
        return import.meta.env.VITE_BLOCK_EXPLORER;
      }
    }
    if (key === 'CONTRACT_ADDRESS') {
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_CONTRACT_ADDRESS) {
        // @ts-ignore
        return import.meta.env.VITE_CONTRACT_ADDRESS;
      }
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_MANTLE_CONTRACT_ADDRESS) {
        // @ts-ignore
        return import.meta.env.VITE_MANTLE_CONTRACT_ADDRESS;
      }
    }
  } catch (e) {
    // Ignore compile/bundling reference errors
  }
  
  // Legacy backend fallbacks
  if (typeof process !== 'undefined' && process.env) {
    if (key === 'RPC_URL' && process.env.MANTLE_RPC_URL) {
      return process.env.MANTLE_RPC_URL;
    }
    if (key === 'CONTRACT_ADDRESS' && process.env.VITE_MANTLE_CONTRACT_ADDRESS) {
      return process.env.VITE_MANTLE_CONTRACT_ADDRESS;
    }
  }

  return undefined;
}

export function getActiveChainConfig(): ChainConfig {
  const defaultChainKey = getEnv('DEFAULT_CHAIN') || 'mantleSepoliaTestnet';
  const chainIdEnv = getEnv('CHAIN_ID');
  
  let activeConfig: ChainConfig | undefined;
  
  if (chainIdEnv) {
    const chainId = parseInt(chainIdEnv, 10);
    activeConfig = Object.values(chains).find(c => c.chainId === chainId);
    
    // If not found in predefined list, initialize a generic ChainConfig
    if (!activeConfig) {
      activeConfig = {
        chainId,
        networkName: getEnv('DEFAULT_CHAIN') || `Chain ${chainId}`,
        rpcUrl: getEnv('RPC_URL') || '',
        blockExplorer: getEnv('BLOCK_EXPLORER') || '',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        contracts: { marketProtocol: getEnv('CONTRACT_ADDRESS') || '' },
        confirmations: 1,
        isTestnet: true
      };
    }
  }
  
  if (!activeConfig) {
    activeConfig = chains[defaultChainKey] || chains['mantleSepoliaTestnet'];
  }
  
  // Clone config to apply runtime environment overrides
  const config = {
    ...activeConfig,
    contracts: { ...activeConfig.contracts }
  };
  
  const rpcUrlOverride = getEnv('RPC_URL');
  if (rpcUrlOverride) {
    config.rpcUrl = rpcUrlOverride;
  }
  
  const blockExplorerOverride = getEnv('BLOCK_EXPLORER');
  if (blockExplorerOverride) {
    config.blockExplorer = blockExplorerOverride;
  }
  
  const contractAddressOverride = getEnv('CONTRACT_ADDRESS');
  if (contractAddressOverride) {
    config.contracts.marketProtocol = contractAddressOverride;
  }
  
  return config;
}

export function getAllChains(): ChainConfig[] {
  return Object.values(chains);
}
