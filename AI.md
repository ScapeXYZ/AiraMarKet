# AI Systems

## AI Responsibilities
The AI components of Aira Markets serve as an autonomous swarm dedicated to finding, analyzing, and proposing prediction markets.

1. **Signal Ingestion:** Continuously pulling data from sources like NewsAPI, SerpAPI, and CoinGecko.
2. **Sentiment Analysis:** Using Anthropic's Claude API to process unstructured data and determine the validity and interest level of a potential market.
3. **Market Creation:** Formulating distinct, binary (YES/NO) questions with clear resolution criteria and proposing them to the protocol.
4. **Creator Lab:** Assisting human users in generating well-defined markets via an interactive prompt interface.

## AI Infrastructure
- **Model:** Anthropic Claude API.
- **Integration:** The agent swarm operates as a plugin SDK, preventing circular dependencies and allowing modular addition of new data providers.
- **Reliability:** The AI acts as an initiator, but the absolute source of truth for resolution relies on cryptographic oracles and smart contract logic, ensuring AI hallucinations do not corrupt funds.
