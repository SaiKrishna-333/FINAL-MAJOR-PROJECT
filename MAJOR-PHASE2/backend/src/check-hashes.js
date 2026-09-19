// Check stored blockchain hashes
import mongoose from "mongoose";
mongoose.connect("mongodb://localhost:27017/BioChainRTO");
await import("./models/Vehicle.js");
const Vehicle = mongoose.model("Vehicle");
const vehicles = await Vehicle.find({});
console.log("\n=== Stored Transaction Hashes ===\n");
for (const v of vehicles) {
    console.log(v.regNumber + ":");
    console.log("  Hash: " + v.blockchainTxHash);
    console.log("");
}
await mongoose.disconnect();
