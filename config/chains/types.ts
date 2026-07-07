export interface ChainConfig {
  chainId: number;
  networkName: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  contracts: {
    marketProtocol: string;
    [key: string]: string;
  };
  confirmations: number;
  websocket?: string;
  icon?: string;
  isTestnet: boolean;
}
