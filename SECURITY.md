# Security & Oracle Audit

## Security Assumptions
1. **Smart Contracts:** The core contract `AiraMarket.sol` does not hold custody of funds longer than the market lifecycle. It utilizes simple state-checks prior to interaction (Checks-Effects-Interactions) to prevent reentrancy.
2. **Access Control:** Oracle resolution and fallback timelocked resolution are restricted to explicit addresses (Chainlink Oracle and Contract Owner).

## Oracle Resolution Methodology
1. **Primary Oracle (Chainlink):** The designated oracle address has immediate resolution authority. Upon the expiry of a market, the oracle submits a boolean outcome based on predefined resolution logic.
2. **Owner Fallback & Timelock:** If the primary oracle fails, the owner can propose a resolution. This triggers a `TIMELOCK_DURATION` (24 hours). The outcome cannot be enforced until the timelock expires.
3. **Dispute Handling:** The 24-hour timelock allows the community to verify the proposed outcome before funds are released. In future iterations, this timelock will allow DAO voting to slash or override malicious proposals.

## Data Sources & Expiry Rules
- **Data Sources:** Markets must specify a verifiable source (e.g., CoinGecko API for price, specific News outlets for events) upon creation.
- **Expiry Rules:** Markets strictly enforce `block.timestamp < expiry` for all trading. No YES/NO shares can be purchased post-expiry.

## Oracle Failure Scenarios
- **Downtime:** If the oracle goes offline, the market remains unresolved until the fallback owner mechanism is initiated.
- **Malicious Owner:** If the owner is compromised, the 24-hour timelock provides a buffer for users to be aware of the malicious resolution proposal before execution.
