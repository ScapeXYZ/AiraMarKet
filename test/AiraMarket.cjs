const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AiraMarketProtocol - Comprehensive Test Suite", function () {
  let protocol;
  let owner;
  let user1;
  let user2;
  let user3;
  let attacker;

  beforeEach(async function () {
    [owner, user1, user2, user3, attacker] = await ethers.getSigners();
    
    const AiraMarketProtocol = await ethers.getContractFactory("AiraMarketProtocol");
    protocol = await AiraMarketProtocol.deploy();
    await protocol.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should deploy with the correct owner", async function () {
      expect(await protocol.owner()).to.equal(owner.address);
    });
  });

  describe("Market Creation", function () {
    it("should create a market correctly", async function () {
      const latestBlock = await ethers.provider.getBlock("latest");
      const expiry = latestBlock.timestamp + 3600;
      await expect(protocol.createMarket("Will ETH hit $4k?", "Crypto", expiry, "ipfs://QmMockData123", { value: ethers.parseEther("2.0") }))
        .to.emit(protocol, "MarketCreated")
        .withArgs(1, "Will ETH hit $4k?", "Crypto", expiry, owner.address);

      const market = await protocol.getMarket(1);
      expect(market.id).to.equal(1);
      expect(market.totalYesPool).to.equal(ethers.parseEther("1.0"));
      expect(market.resolved).to.be.false;
    });
  });

  describe("Trading: YES and NO Purchases", function () {
    let expiry;
    beforeEach(async function () {
      const latestBlock = await ethers.provider.getBlock("latest");
      expiry = latestBlock.timestamp + 3600;
      await protocol.createMarket("Will BTC hit $100k?", "Crypto", expiry, "ipfs://QmMockData123", { value: ethers.parseEther("2.0") });
    });

    it("should allow YES purchases and update pools", async function () {
      const buyAmount = ethers.parseEther("1.0");
      await protocol.connect(user1).buyYes(1, { value: buyAmount });
      const market = await protocol.getMarket(1);
      expect(market.totalYesPool).to.equal(buyAmount + ethers.parseEther("1.0"));
    });
  });

  describe("Decentralized Optimistic Resolution", function () {
    const bondAmount = ethers.parseEther("10.0");

    beforeEach(async function () {
      const latestBlock = await ethers.provider.getBlock("latest");
      const expiry = latestBlock.timestamp + 3600;
      await protocol.createMarket("Will it rain?", "Weather", expiry, "ipfs://QmMockData123", { value: ethers.parseEther("2.0") });
    });

    it("should allow anyone to propose a resolution", async function () {
      await expect(protocol.connect(user1).proposeResolution(1, true, { value: bondAmount }))
        .to.emit(protocol, "ResolutionProposed");
      
      const timelock = await protocol.resolutionTimelock(1);
      expect(timelock).to.be.gt(0);
    });

    it("should prevent execution before timelock expires", async function () {
      await protocol.connect(user1).proposeResolution(1, true, { value: bondAmount });
      await expect(protocol.connect(user2).executeResolution(1))
        .to.be.revertedWith("Timelock active");
    });

    it("should allow execution after timelock", async function () {
      await protocol.connect(user1).proposeResolution(1, true, { value: bondAmount });
      await ethers.provider.send("evm_increaseTime", [86400]); // 24 hours
      await ethers.provider.send("evm_mine");

      await expect(protocol.connect(user2).executeResolution(1))
        .to.emit(protocol, "MarketResolved")
        .withArgs(1, true, user2.address);
    });

    it("should allow disputes to block resolution", async function () {
      await protocol.connect(user1).proposeResolution(1, true, { value: bondAmount });
      await protocol.connect(user2).disputeResolution(1, { value: bondAmount });
      
      expect(await protocol.isDisputed(1)).to.be.true;

      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine");

      await expect(protocol.connect(user3).executeResolution(1))
        .to.be.revertedWith("No resolution proposed");
    });

    it("should allow arbitration to resolve disputed markets", async function () {
      await protocol.connect(user1).proposeResolution(1, true, { value: bondAmount });
      await protocol.connect(user2).disputeResolution(1, { value: bondAmount });
      
      await expect(protocol.connect(owner).resolveDisputedMarket(1, false))
        .to.emit(protocol, "MarketResolved")
        .withArgs(1, false, owner.address);
    });
  });

  describe("Winnings Claims & Proportional Payouts", function () {
    const bondAmount = ethers.parseEther("10.0");

    beforeEach(async function () {
      const latestBlock = await ethers.provider.getBlock("latest");
      const expiry = latestBlock.timestamp + 3600;
      await protocol.createMarket("Will it rain?", "Weather", expiry, "ipfs://QmMockData123", { value: ethers.parseEther("2.0") });

      await protocol.connect(user1).buyYes(1, { value: ethers.parseEther("10.0") });
      await protocol.connect(user2).buyNo(1, { value: ethers.parseEther("20.0") });

      await protocol.connect(user1).proposeResolution(1, true, { value: bondAmount });
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine");
      await protocol.connect(user1).executeResolution(1);
    });

    it("should distribute correctly for YES outcome", async function () {
      const initialBalance = await ethers.provider.getBalance(user1.address);
      const tx = await protocol.connect(user1).claimWinnings(1);
      const receipt = await tx.wait();
      const gasSpent = receipt.gasUsed * tx.gasPrice;

      const finalBalance = await ethers.provider.getBalance(user1.address);
      // User1 owns 10 YES. Seed is 1 YES. Total YES = 11. Total Pool = 32.
      // Proportional reward = (10 * 32) / 11 = 29.0909...
      const expectedReward = 29090909090909090909n;

      expect(finalBalance - initialBalance + gasSpent).to.equal(expectedReward);
    });
  });
});
