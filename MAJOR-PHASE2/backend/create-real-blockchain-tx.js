import mongoose from "mongoose";
import { Vehicle } from "./src/models/Vehicle.js";
import { registerVehicleOnChain } from "./src/services/blockchainService.js";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/BioChainRTO";

async function createRealBlockchainTransaction() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ MongoDB connected");

        // Find the vehicle
        const vehicle = await Vehicle.findOne({ regNumber: "KA01AB1234" });

        if (!vehicle) {
            console.log("❌ Vehicle KA01AB1234 not found!");
            process.exit(1);
        }

        console.log(`\n📋 Vehicle details:`);
        console.log(`   Registration: ${vehicle.regNumber}`);
        console.log(`   Chassis: ${vehicle.chassisNumber}`);
        console.log(`   Engine: ${vehicle.engineNumber}`);
        console.log(`   Make: ${vehicle.make}`);
        console.log(`   Model: ${vehicle.model}`);
        console.log(`   Year: ${vehicle.year}`);
        console.log(`   Owner ID: ${vehicle.currentOwner}`);

        console.log("\n🔗 Executing blockchain transaction on Polygon Amoy...");
        console.log("   This may take 10-30 seconds for confirmation...");

        // Get owner's wallet address (or use vehicle ID as fallback)
        const ownerAddress = `0x${vehicle.currentOwner.toString().padStart(40, '0')}`;

        // Call the actual smart contract
        const txHash = await registerVehicleOnChain(
            vehicle.regNumber,
            vehicle.chassisNumber,
            vehicle.engineNumber,
            vehicle.make,
            vehicle.model,
            vehicle.year,
            ownerAddress
        );

        console.log("\n✅ Blockchain transaction successful!");
        console.log(`   Transaction Hash: ${txHash}`);

        // Save to database
        vehicle.blockchainTxHash = txHash;
        await vehicle.save();

        console.log("\n💾 Saved to database");
        console.log(`\n🔗 View on PolygonScan: https://amoy.polygonscan.com/tx/${txHash}`);
        console.log(`\n📄 Refresh RC Certificate page to see the REAL blockchain link!`);

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Error:", error.message);
        console.error("\nStack trace:", error.stack);
        process.exit(1);
    }
}

createRealBlockchainTransaction();
