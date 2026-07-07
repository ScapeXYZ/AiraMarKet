import { getActiveChainConfig } from '../config/chains/loader';
import sepoliaDeployment from './5003/AiraMarketProtocol.json';

export interface Deployment {
  address: string;
  abi: any[];
}

const deployments: Record<number, Record<string, Deployment>> = {
  5003: {
    AiraMarketProtocol: sepoliaDeployment
  }
};

export function loadDeployment(contractName: string, chainId?: number): Deployment {
  const activeChain = getActiveChainConfig();
  const targetChainId = chainId || activeChain.chainId;
  
  const chainDeployments = deployments[targetChainId];
  if (chainDeployments && chainDeployments[contractName]) {
    const dep = chainDeployments[contractName];
    return {
      address: activeChain.contracts.marketProtocol || dep.address,
      abi: dep.abi
    };
  }

  // Fallback: If not explicitly configured but address is provided via environment/config,
  // return the address with the default contract ABI.
  return {
    address: activeChain.contracts.marketProtocol || '',
    abi: sepoliaDeployment.abi
  };
}
