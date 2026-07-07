# AIRA Markets Protocol Architecture

AIRA Markets is a production-grade, AI-assisted prediction market protocol built on a chain-agnostic EVM-compatible design. It leverages autonomous AI agents to ingest real-world data, generate intelligent prediction markets, and submit them for human approval and on-chain deployment.

## 1. System Architecture

The protocol is divided into three core layers:

1. **Assisted Intelligence Layer (Backend Node.js/TypeScript)**
   - **Signal Ingestion**: Actively pulls real-time data from external sources:
     - `CRYPTO`: CoinGecko API
     - `TECH`: Hacker News Firebase API
     - `POLITICS`: Reddit (`/r/politics`) JSON Feed
     - `SPORTS`: ESPN API
   - **AI Service**: Analyzes normalized data, evaluates sentiment (`bullish`/`bearish`), generates structured prediction market titles, and calculates confidence scores.
   - **Agent Swarm**: Specialized agents (`crypto_agent`, `tech_agent`, etc.) that listen to the `EventBus`, query the AI Service, and enforce a strict `> 0.7` confidence threshold.
   - **Market Service**: Broadcasts approved market suggestions to the frontend interface. **(Crucially: It halts and waits for human cryptographic approval, preventing autonomous deployment).**
   - **Transparency Logger**: An HTTP endpoint (`:3001`) that receives transaction hashes from the frontend and securely logs the AI's reasoning to a verifiable local file (`aira_transparency.log`).

2. **On-Chain Settlement Layer (Solidity on EVM Networks)**
   - **AiraMarketProtocol.sol**: A highly gas-optimized smart contract containing both Market Factory and Trading logic.
   - Uses strict struct variable packing (combining `address` and `bool` flags) to ensure the `Market` struct fits perfectly within 32-byte storage slots, minimizing L2 deployment costs.
   - Secures all liquidity pools (`yesShares` and `noShares`) and manages proportional, math-verified `redeemWinnings` payouts.

3. **Frontend Interface (React / Web3)**
   - **Dynamic UI**: Renders live markets directly from the blockchain by aggressively polling `contract.listMarkets()`.
   - **Web3 Integration**: Integrates directly with `wagmi` and `RainbowKit` to prompt wallet connections.
   - **Market Execution**: Allows users to dynamically purchase YES/NO shares, which triggers physical on-chain transactions.
   - **Positions Dashboard**: Calculates real-time user holdings directly from the contract state.

---

## 2. Multi-Chain Abstraction Layer

To prepare the codebase for supporting multiple blockchains, all chain-specific assumptions and blockchain constants are abstracted behind a unified Multi-Chain Configuration system.

### A. Chain Configuration Module (`/config/chains`)
All network properties are isolated in standard declarative models:
- **`types.ts`**: Defines a common `ChainConfig` interface covering network name, chain ID, RPC and explorer URLs, native currency configuration, contract addresses, and network settings.
- **`index.ts`**: Defines supported networks (e.g., Mantle Sepolia Testnet, Mantle Mainnet) implementing the common interface.
- **`loader.ts`**: Resolves the active network dynamically. It reads environment variables (`DEFAULT_CHAIN`, `CHAIN_ID`, `RPC_URL`, etc.) with legacy fallback support and applies overrides. If a target network is specified but not predefined, it constructs a generic fallback configuration to make the system fully chain-agnostic.

### B. Provider Factory (`/server/services/providerFactory.ts`)
Manages JSON-RPC and WebSocket connections. It caches active providers to prevent redundant TCP connections and handles fallback connection overrides.

### C. Contract Factory (`/server/services/contractFactory.ts`)
Standardizes smart contract instantiation. It loads the target contract ABI and address dynamically and connects it to the appropriate ethers runner (signer or provider). Hardcoded contract addresses or ABIs are completely removed from backend logic.

### D. Deployment Loader (`/deployments`)
Houses deployment metadata per chain in individual directories (e.g., `/deployments/5003` for Mantle Sepolia). The loader resolves these directories dynamically, supporting isolated network deployments out-of-the-box.

### E. Frontend Network Layer (`/src/lib/network`)
Injects configurations from the central chain configuration module into `wagmi` and `RainbowKit` dynamically. It exposes unified helper utilities (`getExplorerTxLink`, `getExplorerAddressLink`) so UI components render dynamic currency symbols and block explorers based on the active network.

---

## 3. Data Flow (End-to-End)

1. **Ingestion**: `signal_ingestion.ts` hits external APIs, normalizes JSON, and emits a `SIGNAL_RECEIVED` event.
2. **Analysis**: `tech_agent.ts` captures the event and queries `ai_service.ts`. The AI creates a structured proposal.
3. **Suggestion**: If `confidence > 0.7`, it emits `MARKET_SUGGESTED` (awaiting human input).
4. **Human Approval**: A protocol administrator views the suggestion in the React UI (`App.jsx`) and clicks **Launch On-Chain**.
5. **Deployment**: Wallet extension prompts the user to sign the `createMarket` transaction using the configured native currency.
6. **Transparency Log**: The frontend receives the `txHash` and POSTs it back to the backend `TransparencyLogger`, binding the cryptographic proof to the AI's reasoning log.
7. **Trading Live**: The market instantly appears in the Live Feed, allowing global users to buy YES/NO positions.

---

## 4. Protocol Security & Guidelines

- **No Autonomous Trading**: AI is strictly an **assisted** layer. No on-chain state changes occur without cryptographic signatures from connected wallets.
- **Gas Optimized**: Heavy usage of `calldata` and storage variable packing guarantees low-fee operation on EVM networks.
- **Oracle Independence**: The resolution (`resolveMarket`) is currently restricted via `onlyOwner`. Future upgrades will distribute this to a decentralized oracle network or multi-sig.
