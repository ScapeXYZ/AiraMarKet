// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract AiraMarketProtocol is Ownable {
    // ==========================================
    // MARKET FACTORY STRUCTS & STATE
    // ==========================================
    
    // Gas Optimized Struct Packing: address (20) + bool (1) + bool (1) fits in 1 slot (32 bytes)
    struct Market {
        uint256 id;
        uint256 expiry;
        uint256 totalYesPool;
        uint256 totalNoPool;
        address creator;
        bool resolved;
        bool outcome; // true = YES, false = NO
        string title;
        string category;
    }

    uint256 public marketCount;
    mapping(uint256 => Market) public markets;

    // marketId => user => amount
    mapping(uint256 => mapping(address => uint256)) public yesShares;
    mapping(uint256 => mapping(address => uint256)) public noShares;
    
    // marketId => user => claimed
    mapping(uint256 => mapping(address => bool)) public hasClaimed;

    event MarketCreated(uint256 indexed id, string title, string category, uint256 expiry, address creator);
    event TradeRecorded(uint256 indexed marketId, address indexed user, string position, uint256 amount);
    event MarketResolved(uint256 indexed marketId, bool outcome, address resolver);
    event WinningsRedeemed(uint256 indexed marketId, address indexed user, uint256 amount);

    constructor() Ownable(msg.sender) {}

    // ==========================================
    // MARKET FACTORY LOGIC
    // ==========================================

    // Use calldata for strings to save gas instead of memory
    function createMarket(string calldata _title, string calldata _category, uint256 _expiry) external {
        uint256 currentId = ++marketCount; // Caching to save SLOAD gas
        
        markets[currentId] = Market({
            id: currentId,
            expiry: _expiry,
            totalYesPool: 0,
            totalNoPool: 0,
            creator: msg.sender,
            resolved: false,
            outcome: false,
            title: _title,
            category: _category
        });

        emit MarketCreated(currentId, _title, _category, _expiry, msg.sender);
    }

    function getMarket(uint256 _marketId) external view returns (Market memory) {
        require(_marketId > 0 && _marketId <= marketCount, "Invalid market ID");
        return markets[_marketId];
    }

    function listMarkets() external view returns (Market[] memory) {
        Market[] memory allMarkets = new Market[](marketCount);
        for (uint256 i = 1; i <= marketCount; i++) {
            allMarkets[i - 1] = markets[i];
        }
        return allMarkets;
    }

    // ==========================================
    // TRADING CONTRACT LOGIC
    // ==========================================

    function buyYes(uint256 _marketId) external payable {
        require(msg.value > 0, "Must send native MNT tokens");
        Market storage market = markets[_marketId];
        require(market.id != 0, "Market does not exist");
        require(!market.resolved, "Market already resolved");
        require(block.timestamp < market.expiry, "Market expired");

        market.totalYesPool += msg.value;
        yesShares[_marketId][msg.sender] += msg.value;

        emit TradeRecorded(_marketId, msg.sender, "YES", msg.value);
    }

    function buyNo(uint256 _marketId) external payable {
        require(msg.value > 0, "Must send native MNT tokens");
        Market storage market = markets[_marketId];
        require(market.id != 0, "Market does not exist");
        require(!market.resolved, "Market already resolved");
        require(block.timestamp < market.expiry, "Market expired");

        market.totalNoPool += msg.value;
        noShares[_marketId][msg.sender] += msg.value;

        emit TradeRecorded(_marketId, msg.sender, "NO", msg.value);
    }

    function claimWinnings(uint256 _marketId) external {
        Market storage market = markets[_marketId];
        require(market.resolved, "Market not resolved");
        require(!hasClaimed[_marketId][msg.sender], "Already claimed");

        uint256 reward = 0;
        uint256 totalPool = market.totalYesPool + market.totalNoPool;

        if (market.outcome == true) {
            uint256 userYes = yesShares[_marketId][msg.sender];
            require(userYes > 0, "No winning YES shares");
            // proportional reward calculation
            reward = (userYes * totalPool) / market.totalYesPool;
        } else {
            uint256 userNo = noShares[_marketId][msg.sender];
            require(userNo > 0, "No winning NO shares");
            // proportional reward calculation
            reward = (userNo * totalPool) / market.totalNoPool;
        }

        hasClaimed[_marketId][msg.sender] = true;

        (bool success, ) = payable(msg.sender).call{value: reward}("");
        require(success, "Transfer failed");

        emit WinningsRedeemed(_marketId, msg.sender, reward);
    }

    // ==========================================
    // RESOLUTION LOGIC
    // ==========================================

    // Can be triggered by verified API source or Oracle (represented by onlyOwner)
    function resolveMarket(uint256 _marketId, bool _outcome) external onlyOwner {
        Market storage market = markets[_marketId];
        require(market.id != 0, "Market does not exist");
        require(!market.resolved, "Market already resolved");

        market.resolved = true;
        market.outcome = _outcome;

        emit MarketResolved(_marketId, _outcome, msg.sender);
    }
}
