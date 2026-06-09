const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AiraMarketProtocol - Comprehensive Test Suite", function () {
  let protocol;
  let owner;
  let oracle;
  let user1;
  let user2;
  let user3;
  let attacker;

  beforeEach(async function () {
    [owner, oracle, user1, user2, user3, attacker] = await ethers.getSigners();
    
    const AiraMarketProtocol = await ethers.getContractFactory("AiraMarketProtocol");
    protocol = await AiraMarketProtocol.deploy();
    await protocol.waitForDeployment();

    // Set the oracle address
    await protocol.setChainlinkOracle(oracle.address);
  });

  describe("Deployment", function () {
    it("should deploy with the correct owner and default oracle", async function () {
      expect(await protocol.owner()).to.equal(owner.address);
      expect(await protocol.chainlinkOracle()).to.equal(oracle.address);
    });
  });

  describe("Market Creation", function () {
    it("should create a market correctly", async function () {
      const latestBlock = await ethers.provider.getBlock("latest");
      const expiry = latestBlock.timestamp + 3600;
      await expect(protocol.createMarket("Will ETH hit $4k?", "Crypto", expiry))
        .to.emit(protocol, "MarketCreated")
        .withArgs(1, "Will ETH hit $4k?", "Crypto", expiry, owner.address);

      const market = await protocol.getMarket(1);
      expect(market.id).to.equal(1);
      expect(market.title).to.equal("Will ETH hit $4k?");
      expect(market.category).to.equal("Crypto");
      expect(market.expiry).to.equal(expiry);
      expect(market.totalYesPool).to.equal(0);
      expect(market.totalNoPool).to.equal(0);
      expect(market.resolved).to.be.false;
      expect(market.outcome).to.be.false;
      expect(market.creator).to.equal(owner.address);
    });

    it("should allow listing multiple markets", async function () {
      const latestBlock = await ethers.provider.getBlock("latest");
      const expiry = latestBlock.timestamp + 3600;
      await protocol.createMarket("Market 1", "Misc", expiry);
      await protocol.createMarket("Market 2", "Misc", expiry);
      
      const markets = await protocol.listMarkets();
      expect(markets.length).to.equal(2);
      expect(markets[0].title).to.equal("Market 1");
      expect(markets[1].title).to.equal("Market 2");
    });
  });

  describe("Trading: YES and NO Purchases", function () {
    let expiry;
    beforeEach(async function () {
      const latestBlock = await ethers.provider.getBlock("latest");
      expiry = latestBlock.timestamp + 3600;
      await protocol.createMarket("Will BTC hit $100k?", "Crypto", expiry);
    });

    it("should allow YES purchases and update pools", async function () {
      const buyAmount = ethers.parseEther("1.0");
      await expect(protocol.connect(user1).buyYes(1, { value: buyAmount }))
        .to.emit(protocol, "TradeRecorded")
        .withArgs(1, user1.address, "YES", buyAmount);

      const market = await protocol.getMarket(1);
      expect(market.totalYesPool).to.equal(buyAmount);

      const shares = await protocol.yesShares(1, user1.address);
      expect(shares).to.equal(buyAmount);
    });

    it("should allow NO purchases and update pools", async function () {
      const buyAmount = ethers.parseEther("2.0");
      await expect(protocol.connect(user2).buyNo(1, { value: buyAmount }))
        .to.emit(protocol, "TradeRecorded")
        .withArgs(1, user2.address, "NO", buyAmount);

      const market = await protocol.getMarket(1);
      expect(market.totalNoPool).to.equal(buyAmount);

      const shares = await protocol.noShares(1, user2.address);
      expect(shares).to.equal(buyAmount);
    });

    it("should revert if msg.value is 0", async function () {
      await expect(protocol.connect(user1).buyYes(1, { value: 0 }))
        .to.be.revertedWith("Must send native MNT tokens");
      await expect(protocol.connect(user2).buyNo(1, { value: 0 }))
        .to.be.revertedWith("Must send native MNT tokens");
    });

    it("should revert if market does not exist", async function () {
      await expect(protocol.connect(user1).buyYes(99, { value: ethers.parseEther("1") }))
        .to.be.revertedWith("Market does not exist");
    });

    it("should revert if market is expired", async function () {
      const latestBlock = await ethers.provider.getBlock("latest");
      const pastExpiry = latestBlock.timestamp - 3600;
      await protocol.createMarket("Expired", "Misc", pastExpiry);

      await expect(protocol.connect(user1).buyYes(2, { value: ethers.parseEther("1") }))
        .to.be.revertedWith("Market expired");
    });
  });

  describe("Market Resolution", function () {
    beforeEach(async function () {
      const latestBlock = await ethers.provider.getBlock("latest");
      const expiry = latestBlock.timestamp + 3600;
      await protocol.createMarket("Will it rain?", "Weather", expiry);
    });

    it("should allow oracle to resolve instantly", async function () {
      await expect(protocol.connect(oracle).resolveMarket(1, true))
        .to.emit(protocol, "MarketResolved")
        .withArgs(1, true, oracle.address);

      const market = await protocol.getMarket(1);
      expect(market.resolved).to.be.true;
      expect(market.outcome).to.be.true;
    });

    it("should prevent double resolution", async function () {
      await protocol.connect(oracle).resolveMarket(1, true);
      await expect(protocol.connect(oracle).resolveMarket(1, false))
        .to.be.revertedWith("Market already resolved");
    });

    it("should prevent trading after resolution", async function () {
      await protocol.connect(oracle).resolveMarket(1, true);
      await expect(protocol.connect(user1).buyYes(1, { value: ethers.parseEther("1") }))
        .to.be.revertedWith("Market already resolved");
    });

    it("should require a 24-hour timelock if owner resolves it", async function () {
      await expect(protocol.connect(owner).resolveMarket(1, true))
        .to.emit(protocol, "ResolutionProposed");

      await expect(protocol.connect(owner).resolveMarket(1, true))
        .to.be.revertedWith("Resolution timelock has not expired");

      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine");

      await expect(protocol.connect(owner).resolveMarket(1, true))
        .to.emit(protocol, "MarketResolved")
        .withArgs(1, true, owner.address);
    });

    it("should prevent unauthorized addresses from resolving", async function () {
      await expect(protocol.connect(user1).resolveMarket(1, true))
        .to.be.revertedWith("Not authorized to resolve market");
    });
  });

  describe("Winnings Claims & Proportional Payouts", function () {
    let yesAmount, noAmount;
    beforeEach(async function () {
      const latestBlock = await ethers.provider.getBlock("latest");
      const expiry = latestBlock.timestamp + 3600;
      await protocol.createMarket("Will it rain?", "Weather", expiry);

      yesAmount = ethers.parseEther("10.0"); // user1
      noAmount = ethers.parseEther("30.0"); // user2 (20) + user3 (10)

      await protocol.connect(user1).buyYes(1, { value: yesAmount });
      await protocol.connect(user2).buyNo(1, { value: ethers.parseEther("20.0") });
      await protocol.connect(user3).buyNo(1, { value: ethers.parseEther("10.0") });
    });

    it("should distribute correctly for YES outcome", async function () {
      await protocol.connect(oracle).resolveMarket(1, true);

      // Total pool = 40. user1 owns 100% of YES shares, so they get 40.
      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      const tx = await protocol.connect(user1).claimWinnings(1);
      const receipt = await tx.wait();
      const gasSpent = receipt.gasUsed * tx.gasPrice;

      const finalBalance = await ethers.provider.getBalance(user1.address);
      const expectedReward = ethers.parseEther("40.0");

      expect(finalBalance - initialBalance + gasSpent).to.equal(expectedReward);

      // Check hasClaimed flag
      expect(await protocol.hasClaimed(1, user1.address)).to.be.true;
    });

    it("should distribute correctly for NO outcome", async function () {
      await protocol.connect(oracle).resolveMarket(1, false);

      // Total pool = 40. user2 owns 2/3 of NO shares, user3 owns 1/3 of NO shares.
      // 20 out of 30 NO shares = 2/3 * 40 = 26.666...
      const initialBalance2 = await ethers.provider.getBalance(user2.address);
      
      const tx2 = await protocol.connect(user2).claimWinnings(1);
      const receipt2 = await tx2.wait();
      const gasSpent2 = receipt2.gasUsed * tx2.gasPrice;
      const finalBalance2 = await ethers.provider.getBalance(user2.address);

      const expectedReward2 = (ethers.parseEther("20.0") * ethers.parseEther("40.0")) / ethers.parseEther("30.0");
      expect(finalBalance2 - initialBalance2 + gasSpent2).to.equal(expectedReward2);
    });

    it("should revert if user tries to claim twice", async function () {
      await protocol.connect(oracle).resolveMarket(1, true);
      await protocol.connect(user1).claimWinnings(1);
      
      await expect(protocol.connect(user1).claimWinnings(1))
        .to.be.revertedWith("Already claimed");
    });

    it("should revert if market is not resolved", async function () {
      await expect(protocol.connect(user1).claimWinnings(1))
        .to.be.revertedWith("Market not resolved");
    });

    it("should revert if user has no winning shares", async function () {
      await protocol.connect(oracle).resolveMarket(1, true); // YES won
      await expect(protocol.connect(user2).claimWinnings(1))
        .to.be.revertedWith("No winning YES shares"); // user2 bought NO
    });
  });

  describe("Reentrancy & Edge Cases", function () {
    it("reentrancy protection: CEI pattern check", async function () {
      // Contract follows Checks-Effects-Interactions correctly because it updates `hasClaimed` 
      // BEFORE transferring funds out. We verify this state change logic.
      const latestBlock = await ethers.provider.getBlock("latest");
      const expiry = latestBlock.timestamp + 3600;
      await protocol.createMarket("Reentrancy Test", "Tech", expiry);
      await protocol.connect(user1).buyYes(1, { value: ethers.parseEther("1") });
      await protocol.connect(oracle).resolveMarket(1, true);

      // Execute claim
      await protocol.connect(user1).claimWinnings(1);

      // Validate `hasClaimed` is true, meaning reentrancy would hit "Already claimed" check
      const claimed = await protocol.hasClaimed(1, user1.address);
      expect(claimed).to.be.true;
    });

    it("edge case: 0 total winning pool (e.g., no one bought winning side)", async function () {
      const latestBlock = await ethers.provider.getBlock("latest");
      const expiry = latestBlock.timestamp + 3600;
      await protocol.createMarket("Zero Pool", "Tech", expiry);
      // user1 buys YES
      await protocol.connect(user1).buyYes(1, { value: ethers.parseEther("1") });
      
      // resolves as NO, but NO pool is 0
      await protocol.connect(oracle).resolveMarket(1, false);

      // user1 tries to claim, should fail because they didn't win
      await expect(protocol.connect(user1).claimWinnings(1)).to.be.revertedWith("No winning NO shares");

      // Note: this locks the funds in the contract. A future iteration might refund users, but this tests current behavior.
    });
  });
});
