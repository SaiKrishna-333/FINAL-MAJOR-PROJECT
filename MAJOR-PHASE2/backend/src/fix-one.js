// Fix KA53EC0868 by registering on blockchain properly
import dotenv from "dotenv";
import mongoose from "mongoose";
import { ethers } from "ethers";

dotenv.config();

async function fixOneVehicle() {
    await mongoose.connect("mongodb://localhost:27017/BioChainRTO");
    const Vehicle = (await import("./models/Vehicle.js")).Vehicle;

    const provider = new ethers.JsonRpcProvider("https://rpc-amoy.polygon.technology");
    const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY || "", provider);

    const contractABI = [
        "function registerNewVehicle(string regNumber, string chassisNumber, string engineNumber, string make, string model, uint256 year, address owner) external"
    ];
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS || "", contractABI, wallet);

    // Get the vehicle
    const v = await Vehicle.findOne({ regNumber: "KA53EC0868" });

    console.log("\nFixing: " + v.regNumber);
    console.log("Owner: " + v.currentOwner);

    // Get owner address - use a valid address
    const ownerAddress = "0xff49a3d8ab9666519349280BF3aB8fac2e9c9E18";

    console.log("Registering on blockchain...");

    try {
        const tx = await contract.registerNewVehicle(
            v.regNumber,
            v.chassisNumber,
            v.engineNumber,
            v.make,
            v.model,
            parseInt(v.year) || 2024,
            ownerAddress
        );

        console.log("Transaction submitted: " + tx.hash);

        const receipt = await tx.wait();
        console.log("Confirmed in block: " + receipt.blockNumber);

        // Save the REAL hash
        v.blockchainTxHash = tx.hash;
        await v.save();

        console.log("\n✅ FIXED! Real hash saved: " + tx.hash);
    } catch (e) {
        console.log("Error: " + e.message);
    }

    await mongoose.disconnect();
    process.exit(0);
}

fixOneVehicle();
