# Architecture

## System Overview
The Aira Markets protocol is composed of three primary layers:
1. **On-Chain Settlement Layer (Smart Contracts):** Built on the Mantle Network, managing the prediction pools, shares, and payouts.
2. **Backend & AI Ingestion Layer (Node.js/TypeScript):** Handles external signal ingestion (NewsAPI, SerpAPI, CoinGecko), AI sentiment analysis using Anthropic Claude API, and automated market proposition.
3. **Client Layer (React/Vite):** A high-fidelity user interface utilizing Wagmi for Web3 interactions, providing users with a dedicated portfolio view and interactive market dashboards.

## Smart Contract Flow
1. **Market Creation:** Markets are proposed and created on-chain. Each market has a distinct YES and NO pool.
2. **Trading Phase:** Users purchase YES or NO shares using native MNT tokens. The protocol tracks individual balances proportional to the total pool.
3. **Resolution Phase:** An Oracle (or Owner with Timelock) submits the outcome (YES or NO).
4. **Claim Phase:** Winning share holders claim their proportional slice of the combined total pool.

## Components
- `AiraMarket.sol`: Core factory and settlement engine.
- `ai_service.ts` / `signal_ingestion.ts`: Backend engines for agent logic and real-world data streaming.
