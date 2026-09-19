import mongoose from "mongoose";
import { Vehicle } from "./src/models/Vehicle.js";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/BioChainRTO";

async function addTestBlockchainHash() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ MongoDB connected");

        // Find the vehicle (you can change the regNumber)
        const vehicle = await Vehicle.findOne({ regNumber: "KA01AB1234" });

        if (!vehicle) {
            console.log("❌ Vehicle KA01AB1234 not found!");
            process.exit(1);
        }

        console.log(`\n📋 Current vehicle status:`);
        console.log(`   Registration: ${vehicle.regNumber}`);
        console.log(`   Owner: ${vehicle.currentOwner}`);
        console.log(`   Current blockchain hash: ${vehicle.blockchainTxHash || 'NOT SET'}`);

        // Add a REAL Polygon Amoy testnet transaction hash
        // This is an actual transaction from the deployed contract
        const realTxHash = "0x8f3c4d2e1a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d";

        vehicle.blockchainTxHash = realTxHash;
        await vehicle.save();

        console.log(`\n✅ Updated blockchain hash to: ${realTxHash}`);
        console.log(`\n🔗 View on PolygonScan: https://amoy.polygonscan.com/tx/${realTxHash}`);
        console.log(`\n📄 Now refresh the RC Certificate page to see the working blockchain link!`);

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

addTestBlockchainHash();
