require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/**
 * Hardhat configuration for OffsetGuard CarbonCreditNFT.
 * Primary target: Ganache (local blockchain)
 *
 * Environment variables (set in blockchain/.env):
 *   GANACHE_URL         — Ganache RPC URL  (default: http://127.0.0.1:7545)
 *   OWNER_PRIVATE_KEY   — Any private key shown in Ganache's accounts list
 *   GANACHE_CHAIN_ID    — Chain ID shown in Ganache UI (default: 1337)
 */

const PRIVATE_KEY   = process.env.OWNER_PRIVATE_KEY || "0x" + "0".repeat(64);
const GANACHE_URL   = process.env.GANACHE_URL        || "http://127.0.0.1:7545";
const GANACHE_CID   = parseInt(process.env.GANACHE_CHAIN_ID || "1337", 10);

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  defaultNetwork: "ganache",

  networks: {
    // Built-in Hardhat node (used for `npx hardhat test`)
    hardhat: {
      chainId: 31337,
    },

    // Ganache GUI or ganache CLI
    ganache: {
      url:      GANACHE_URL,
      chainId:  GANACHE_CID,
      accounts: [PRIVATE_KEY],
      gasPrice: 20000000000,   // 20 gwei — matches Ganache default
    },
  },

  paths: {
    sources:   "./contracts",
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },
};
