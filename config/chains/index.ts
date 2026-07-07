import { ChainConfig } from './types';

export const chains: Record<string, ChainConfig> = {
  mantleSepoliaTestnet: {
    chainId: 5003,
    networkName: 'Mantle Sepolia Testnet',
    rpcUrl: 'https://rpc.sepolia.mantle.xyz',
    blockExplorer: 'https://explorer.sepolia.mantle.xyz',
    nativeCurrency: {
      name: 'Mantle',
      symbol: 'MNT',
      decimals: 18,
    },
    contracts: {
      marketProtocol: '0xDD277CCB8cDa72D652CdcA4df09df5f2522fc846',
    },
    confirmations: 1,
    isTestnet: true,
  },
  mantleMainnet: {
    chainId: 5000,
    networkName: 'Mantle Mainnet',
    rpcUrl: 'https://rpc.mantle.xyz',
    blockExplorer: 'https://explorer.mantle.xyz',
    nativeCurrency: {
      name: 'Mantle',
      symbol: 'MNT',
      decimals: 18,
    },
    contracts: {
      marketProtocol: '',
    },
    confirmations: 2,
    isTestnet: false,
  },
};
