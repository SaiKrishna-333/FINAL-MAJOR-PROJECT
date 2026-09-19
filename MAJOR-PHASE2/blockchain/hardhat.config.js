import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();

/** @type import('hardhat/config').HardhatUserConfig */
export default {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    networks: {
        polygonAmoy: {
            url: process.env.POLYGON_RPC_URL || "https://rpc-amoy.polygon.technology",
            accounts: [process.env.WALLET_PRIVATE_KEY],
            chainId: 80002,
            gas: 6000000,
            gasPrice: 50000000000, // 50 gwei
            maxFeePerGas: 150000000000, // 150 gwei
            maxPriorityFeePerGas: 40000000000 // 40 gwei
        }
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    }
};
