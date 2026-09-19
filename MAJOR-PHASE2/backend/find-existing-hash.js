import mongoose from "mongoose";
import { Vehicle } from "./src/models/Vehicle.js";
import { OwnershipHistory } from "./src/models/OwnershipHistory.js";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/BioChainRTO";

async function findExistingBlockchainHash() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ MongoDB connected\n");

        // Find the vehicle
        const vehicle = await Vehicle.findOne({ regNumber: "KA01AB1234" });

        if (!vehicle) {
            console.log("❌ Vehicle KA01AB1234 not found!");
            process.exit(1);
        }

        console.log("📋 VEHICLE DETAILS:");
        console.log(`   Registration: ${vehicle.regNumber}`);
        console.log(`   Blockchain Hash: ${vehicle.blockchainTxHash || 'NOT SET'}`);
        console.log(`   IPFS Record: ${vehicle.ipfsRecordHash || 'NOT SET'}\n`);

        // Check ownership history
        const history = await OwnershipHistory.find({
            vehicle: vehicle._id
        }).sort({ createdAt: -1 });

        console.log(`📊 OWNERSHIP HISTORY (${history.length} records):\n`);

        let foundHash = false;
        for (const record of history) {
            const index = history.indexOf(record);
            console.log(`${index + 1}. ${record.transferType.toUpperCase()}`);
            console.log(`   Date: ${new Date(record.createdAt).toLocaleString()}`);
            console.log(`   From: ${record.fromOwner || 'DEALER'}`);
            console.log(`   To: ${record.toOwner}`);
            console.log(`   Blockchain Hash: ${record.blockchainTxHash || 'NOT SET'}`);
            console.log(`   Biometric: ${record.biometricVerification ? 'YES' : 'NO'}\n`);

            if (record.blockchainTxHash && record.blockchainTxHash !== "0x0") {
                foundHash = true;
                console.log(`   ✅ FOUND VALID HASH: ${record.blockchainTxHash}\n`);
                console.log(`   🔗 PolygonScan Link: https://amoy.polygonscan.com/tx/${record.blockchainTxHash}\n`);

                // Update vehicle with this hash
                vehicle.blockchainTxHash = record.blockchainTxHash;
                await vehicle.save();
                console.log(`   💾 Updated vehicle.blockchainTxHash in database!\n`);
            }
        }

        if (!foundHash) {
            console.log("⚠️  No valid blockchain hash found in ownership history.\n");
            console.log("ℹ️  This vehicle was likely:");
            console.log("   - Created before blockchain integration, OR");
            console.log("   - Blockchain transaction failed during approval\n");
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

findExistingBlockchainHash();
