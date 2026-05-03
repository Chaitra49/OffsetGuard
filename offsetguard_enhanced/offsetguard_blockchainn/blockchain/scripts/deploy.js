/**
 * Deploy script for CarbonCreditNFT → Ganache
 *
 * Usage:
 *   npx hardhat run scripts/deploy.js --network ganache
 *   npx hardhat run scripts/deploy.js --network hardhat   (built-in node)
 *
 * Before running:
 *   1. Start Ganache (GUI on port 7545 OR `ganache` CLI on port 8545)
 *   2. Copy a private key from the Ganache accounts list into blockchain/.env
 */

const { ethers, network } = require("hardhat");
const fs   = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("=".repeat(60));
  console.log("  OffsetGuard — CarbonCreditNFT Deployment (Ganache)");
  console.log("=".repeat(60));
  console.log(`  Deployer : ${deployer.address}`);
  console.log(`  Network  : ${network.name}`);
  console.log(`  RPC      : ${network.config.url || "hardhat in-process"}`);
  console.log(`  Chain ID : ${network.config.chainId}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`  Balance  : ${ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n) {
    throw new Error(
      "Deployer wallet has zero balance.\n" +
      "Make sure OWNER_PRIVATE_KEY in .env matches one of the Ganache accounts."
    );
  }

  // Deploy
  console.log("Deploying CarbonCreditNFT...");
  const CarbonCreditNFT = await ethers.getContractFactory("CarbonCreditNFT");

  // ✅ FIXED HERE
  const contract = await CarbonCreditNFT.deploy();

  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`✓ CarbonCreditNFT deployed at: ${contractAddress}`);

  // Save deployment info
  const deployment = {
    network:         network.name,
    rpcUrl:          network.config.url || "hardhat in-process",
    chainId:         network.config.chainId,
    contractAddress,
    deployerAddress: deployer.address,
    deployedAt:      new Date().toISOString(),
  };

  const outDir  = path.join(__dirname, "..", "artifacts");
  const outFile = path.join(outDir, `deployment-${network.name}.json`);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(deployment, null, 2));
  console.log(`✓ Deployment info saved to: ${outFile}`);

  // Print backend .env snippet
  const rpc = network.config.url || "http://127.0.0.1:7545";
  console.log("\n" + "─".repeat(60));
  console.log("Add these to your backend/.env file:");
  console.log("─".repeat(60));
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`POLYGON_RPC_URL=${rpc}`);
  console.log(`NETWORK_NAME=${network.name}`);
  console.log("─".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Deployment failed:", err);
    process.exit(1);
  });