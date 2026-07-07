import { ethers } from 'ethers';
import { loadDeployment } from '../../deployments/loader';
import { ProviderFactory } from './providerFactory';

/**
 * ContractFactory
 * Responsible for loading ABIs and deployment addresses, and
 * returning ethers Contract instances.
 */
export class ContractFactory {
  /**
   * Instantiates and returns an ethers Contract instance.
   * If a runner (provider or signer) is provided, it is connected to the contract.
   * Otherwise, the default provider from ProviderFactory is used.
   */
  public static getContract(
    contractName: string,
    runner?: ethers.ContractRunner,
    chainId?: number
  ): ethers.Contract {
    const deployment = loadDeployment(contractName, chainId);
    
    if (!deployment.address) {
      console.warn(`[CONTRACT_FACTORY] Warning: Deployment address for "${contractName}" is not set.`);
    }

    const defaultRunner = runner || ProviderFactory.getProvider();
    return new ethers.Contract(deployment.address, deployment.abi, defaultRunner);
  }
}
