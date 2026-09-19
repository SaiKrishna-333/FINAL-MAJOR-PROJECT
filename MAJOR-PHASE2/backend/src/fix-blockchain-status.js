// Script to fix vehicles that exist on blockchain but don't have hash in DB
import dotenv from "dotenv";
import mongoose from "mongoose";
import { ethers } from "ethers";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/BioChainRTO";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RPC_URL = process.env.POLYGON_RPC_URL || "https://rpc-amoy.polygon.technology";
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;

async function fixVehiclesOnBlockchain() {
    await mongoose.connect(MONGO_URI);
    const Vehicle = (await import("./models/Vehicle.js")).Vehicle;

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    const contractABI = [
        "function getCurrentOwner(string regNumber) view returns (address)",
        "function registerNewVehicle(string regNumber, string chassisNumber, string engineNumber, string make, string model, uint256 year, address owner) external"
    ];
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

    // Get ALL vehicles from DB (not just those without hash)
    const vehicles = await Vehicle.find({});

    console.log(`\n🔍 Checking ${vehicles.length} vehicles against blockchain...\n`);

    let fixedCount = 0;
    let alreadyOnChain = 0;
    let notOnChain = 0;

    for (const v of vehicles) {
        try {
            // Try to get current owner from blockchain
            const owner = await contract.getCurrentOwner(v.regNumber);

            // If we get here, vehicle EXISTS on blockchain
            console.log(`✅ ${v.regNumber} exists on blockchain`);
            console.log(`   Current owner: ${owner}`);

            if (!v.blockchainTxHash) {
                // Vehicle exists on blockchain but hash not saved - mark it
                v.blockchainTxHash = "0xEXISTS_ON_CHAIN_" + v.regNumber;
                await v.save();
                console.log(`   📝 Updated DB with placeholder hash`);
                fixedCount++;
            } else {
                alreadyOnChain++;
            }
        } catch (e) {
            // Vehicle does NOT exist on blockchain
            if (e.message.includes("Vehicle not registered") || e.message.includes("execution reverted")) {
                notOnChain++;
                console.log(`❌ ${v.regNumber} NOT on blockchain yet`);
            } else {
                console.log(`⚠️ ${v.regNumber} error: ${e.message.substring(0, 50)}`);
            }
        }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 SUMMARY");
    console.log("=".repeat(50));
    console.log(`Total vehicles checked: ${vehicles.length}`);
    console.log(`Already on blockchain: ${alreadyOnChain + fixedCount}`);
    console.log(`Fixed (added placeholder): ${fixedCount}`);
    console.log(`Not on blockchain: ${notOnChain}`);

    await mongoose.disconnect();
    process.exit(0);
}

fixVehiclesOnBlockchain();
