// Test challan creation
import mongoose from "mongoose";
import { Challan } from "./models/Challan.js";
import { Vehicle } from "./models/Vehicle.js";
import { User } from "./models/User.js";

await mongoose.connect("mongodb://localhost:27017/BioChainRTO");

console.log("\n=== TEST CHALLAN CREATION ===\n");

// Find a police user
const policeUser = await User.findOne({ role: "police" });
if (!policeUser) {
    console.log("❌ No police user found. Creating one...");

    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash("password123", 10);

    const newPolice = new User({
        name: "Test Police Officer",
        email: `test.police.${Date.now()}@police.gov.in`,
        passwordHash,
        role: "police",
        badgeNumber: `BADGE-${Date.now()}`,
        phone: "+91 9876543210",
        address: "Test Police Station, Mumbai"
    });

    await newPolice.save();
    console.log("✅ Created police user:", newPolice._id);

    // Try to create challan with new police user
    const vehicle = await Vehicle.findOne();
    if (!vehicle) {
        console.log("❌ No vehicles found!");
        await mongoose.disconnect();
        process.exit(1);
    }

    console.log("Using vehicle:", vehicle.regNumber);

    const challan = new Challan({
        vehicle: vehicle._id,
        regNumber: vehicle.regNumber,
        violationType: "speeding",
        violationDescription: "Overspeeding on highway",
        location: "Mumbai-Pune Expressway",
        violationDate: new Date(),
        fineAmount: 2000,
        penaltyPoints: 3,
        issuingOfficer: newPolice._id,
        officerName: newPolice.name,
        officerBadgeNumber: newPolice.badgeNumber,
        status: "active",
        paymentStatus: "pending"
    });

    await challan.save();
    console.log("✅ Challan created successfully:", challan._id);
    console.log("\nTest PASSED!\n");
} else {
    console.log("✅ Found police user:", policeUser.name, policeUser.badgeNumber);

    // Try to create a challan
    const vehicle = await Vehicle.findOne();
    if (!vehicle) {
        console.log("❌ No vehicles found!");
        await mongoose.disconnect();
        process.exit(1);
    }

    console.log("Creating challan for vehicle:", vehicle.regNumber);

    const challan = new Challan({
        vehicle: vehicle._id,
        regNumber: vehicle.regNumber,
        violationType: "red_light",
        violationDescription: "Jumped red light",
        location: "MG Road, Bangalore",
        violationDate: new Date(),
        fineAmount: 1000,
        penaltyPoints: 2,
        issuingOfficer: policeUser._id,
        officerName: policeUser.name,
        officerBadgeNumber: policeUser.badgeNumber || `POLICE-${policeUser._id.toString().substring(0, 6)}`,
        status: "active",
        paymentStatus: "pending"
    });

    await challan.save();
    console.log("✅ Challan created successfully:", challan._id);
    console.log("\nTest PASSED!\n");
}

await mongoose.disconnect();
