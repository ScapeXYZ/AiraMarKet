import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { metaMaskWallet, injectedWallet } from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { Chain } from 'viem';
import { getActiveChainConfig, getAllChains } from '../../../config/chains/loader';

export const activeChainConfig = getActiveChainConfig();
const allChainConfigs = getAllChains();

// Map our custom ChainConfig array to Viem's Chain structure
const viemChains = allChainConfigs.map(c => ({
  id: c.chainId,
  name: c.networkName,
  nativeCurrency: c.nativeCurrency,
  rpcUrls: {
    default: { http: [c.rpcUrl] },
    public: { http: [c.rpcUrl] },
  },
  blockExplorers: {
    default: {
      name: `${c.networkName} Explorer`,
      url: c.blockExplorer,
    },
  },
  testnet: c.isTestnet,
} as Chain));

// Create Wagmi Connectors
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Supported Wallets',
      wallets: [metaMaskWallet, injectedWallet],
    },
  ],
  {
    appName: 'Aira Markets Protocol',
    projectId: 'f36f7f706a5807add3b4bb181ba4f9ea',
  }
);

// Dynamically build transports mapping
const transports = allChainConfigs.reduce((acc, c) => {
  acc[c.chainId] = http(c.rpcUrl);
  return acc;
}, {} as Record<number, any>);

// Create Wagmi Config
export const wagmiConfig = createConfig({
  connectors,
  chains: viemChains as [Chain, ...Chain[]],
  transports,
});

// Explorer link helpers
export function getExplorerTxLink(txHash: string): string {
  const explorerUrl = activeChainConfig.blockExplorer.replace(/\/$/, '');
  return `${explorerUrl}/tx/${txHash}`;
}

export function getExplorerAddressLink(address: string): string {
  const explorerUrl = activeChainConfig.blockExplorer.replace(/\/$/, '');
  return `${explorerUrl}/address/${address}`;
}

export function getNativeCurrencySymbol(): string {
  return activeChainConfig.nativeCurrency.symbol;
}
