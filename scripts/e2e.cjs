const hre = require("hardhat");
const fs = require("fs");
require("dotenv").config();

async function main() {
    const contractAddress = process.env.VITE_MANTLE_CONTRACT_ADDRESS;
    if (!contractAddress) {
        throw new Error("No VITE_MANTLE_CONTRACT_ADDRESS in .env");
    }

    const [deployer] = await hre.ethers.getSigners();
    console.log("Using account:", deployer.address);
    console.log("Contract Address:", contractAddress);

    const AiraMarketProtocol = await hre.ethers.getContractFactory("AiraMarketProtocol");
    const protocol = AiraMarketProtocol.attach(contractAddress);

    const report = [];
    const log = (msg) => {
        console.log(msg);
        report.push(msg);
    }

    log("### Starting E2E Testing on Mantle Testnet ###\n");

    try {
        // Test A: Create Market
        log("Test A: Create Market");
        const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
        const txA = await protocol.createMarket("Will ETH cross $4000 today?", "crypto", expiry);
        log(`Tx Hash: ${txA.hash}`);
        const receiptA = await txA.wait();
        log(`Block Number: ${receiptA.blockNumber}`);
        // Extract market ID from event
        const eventA = receiptA.logs.map(log => protocol.interface.parseLog(log)).find(e => e && e.name === 'MarketCreated');
        const marketId = eventA.args[0];
        log(`Created Market ID: ${marketId}\n`);

        // Test B: Buy YES Position
        log("Test B: Buy YES Position");
        const txB = await protocol.buyYes(marketId, { value: hre.ethers.parseEther("0.001") });
        log(`Tx Hash: ${txB.hash}`);
        const receiptB = await txB.wait();
        log(`Block Number: ${receiptB.blockNumber}\n`);

        // Test C: Buy NO Position
        // Note: Using the same deployer wallet for simplicity, usually it's a different user
        log("Test C: Buy NO Position");
        const txC = await protocol.buyNo(marketId, { value: hre.ethers.parseEther("0.0005") });
        log(`Tx Hash: ${txC.hash}`);
        const receiptC = await txC.wait();
        log(`Block Number: ${receiptC.blockNumber}\n`);

        // Test D: Resolve Market
        log("Test D: Resolve Market");
        // Since deployer is the chainlinkOracle initially, it bypasses timelock
        const txD = await protocol.resolveMarket(marketId, true); // Resolve as YES
        log(`Tx Hash: ${txD.hash}`);
        const receiptD = await txD.wait();
        log(`Block Number: ${receiptD.blockNumber}\n`);

        // Test E: Claim Winnings
        log("Test E: Claim Winnings");
        const txE = await protocol.claimWinnings(marketId);
        log(`Tx Hash: ${txE.hash}`);
        const receiptE = await txE.wait();
        log(`Block Number: ${receiptE.blockNumber}\n`);

        log("### All tests passed successfully! ###");

        fs.writeFileSync("e2e_results.log", report.join("\n"));
    } catch (e) {
        console.error("E2E Test Failed:", e);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
