import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { metaMaskWallet, injectedWallet } from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { mantle, mantleSepoliaTestnet } from 'wagmi/chains';

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

export const config = createConfig({
  connectors,
  chains: [mantle, mantleSepoliaTestnet],
  transports: {
    [mantle.id]: http(),
    [mantleSepoliaTestnet.id]: http(),
  },
});
