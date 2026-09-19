// Quick script to sync all vehicles without blockchain TX to blockchain
// Run with: cd backend && node src/quick-sync.js

import dotenv from "dotenv";
import mongoose from "mongoose";
import { ethers } from "ethers";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/BioChainRTO";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RPC_URL = process.env.POLYGON_RPC_URL || "https://rpc-amoy.polygon.technology";
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;

async function quickSync() {
    await mongoose.connect(MONGO_URI);

    // Import all models first
    await import("./models/User.js");
    await import("./models/Vehicle.js");
    await import("./models/Request.js");

    const Vehicle = mongoose.model("Vehicle");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    const contractABI = [
        "function registerNewVehicle(string regNumber, string chassisNumber, string engineNumber, string make, string model, uint256 year, address owner) external"
    ];
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

    // Find vehicles without blockchain TX or with null/undefined
    const vehicles = await Vehicle.find({
        $or: [
            { blockchainTxHash: { $exists: false } },
            { blockchainTxHash: null },
            { blockchainTxHash: "" }
        ]
    }).populate("currentOwner");

    console.log(`\n🔄 Found ${vehicles.length} vehicles to sync\n`);

    for (const v of vehicles) {
        console.log(`Syncing: ${v.regNumber}...`);
        try {
            const ownerAddr = v.currentOwner?.blockchainWalletAddress || "0xF7167C4089CA6e6374D9B42dE09b97DC416cF725";
            const tx = await contract.registerNewVehicle(
                v.regNumber, v.chassisNumber, v.engineNumber,
                v.make, v.model, parseInt(v.year) || 2024, ownerAddr
            );
            await tx.wait();
            v.blockchainTxHash = tx.hash;
            await v.save();
            console.log(`  ✅ ${tx.hash}\n`);
        } catch (e) {
            console.log(`  ❌ ${e.message}\n`);
        }
    }

    console.log("Done!");
    await mongoose.disconnect();
    process.exit(0);
}

quickSync();
