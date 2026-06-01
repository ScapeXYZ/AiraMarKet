const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const AiraMarketProtocol = await hre.ethers.getContractFactory("AiraMarketProtocol");
  const protocol = await AiraMarketProtocol.deploy();

  await protocol.waitForDeployment();

  console.log("AiraMarketProtocol deployed to:", await protocol.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
