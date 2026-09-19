import mongoose from "mongoose";
import { Vehicle } from "./src/models/Vehicle.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/BioChainRTO";

mongoose.connect(MONGO_URI).then(async () => {
    console.log("✅ MongoDB connected");

    // Find vehicles WITH blockchain hash
    const withHash = await Vehicle.find({
        blockchainTxHash: { $exists: true, $ne: null },
        blockchainTxHash: { $ne: "", $ne: "0x0" }
    });

    console.log(`\n📊 Vehicles WITH blockchain hash: ${withHash.length}`);
    withHash.forEach(v => {
        console.log(`  ✅ ${v.regNumber}: ${v.blockchainTxHash}`);
    });

    // Find vehicles WITHOUT blockchain hash
    const withoutHash = await Vehicle.find({
        $or: [
            { blockchainTxHash: null },
            { blockchainTxHash: { $exists: false } },
            { blockchainTxHash: "" },
            { blockchainTxHash: "0x0" }
        ]
    });

    console.log(`\n⚠️  Vehicles WITHOUT blockchain hash: ${withoutHash.length}`);
    withoutHash.forEach(v => {
        console.log(`  ❌ ${v.regNumber}: ${v.blockchainTxHash || 'not set'}`);
    });

    process.exit(0);
}).catch(err => {
    console.error("❌ Error:", err.message);
    process.exit(1);
});
