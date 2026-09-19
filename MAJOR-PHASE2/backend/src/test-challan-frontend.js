// Simulate exact frontend challan creation request
import mongoose from "mongoose";
import { Challan } from "./models/Challan.js";
import { Vehicle } from "./models/Vehicle.js";
import { User } from "./models/User.js";

await mongoose.connect("mongodb://localhost:27017/BioChainRTO");

console.log("\n=== SIMULATE FRONTEND CHALLAN REQUEST ===\n");

// Find police user
const policeUser = await User.findOne({ role: "police" });
if (!policeUser) {
    console.log("❌ No police user found!");
    await mongoose.disconnect();
    process.exit(1);
}

console.log("Police User:", policeUser.name);
console.log("Badge Number:", policeUser.badgeNumber || "UNDEFINED");

// Find a vehicle
const vehicle = await Vehicle.findOne();
if (!vehicle) {
    console.log("❌ No vehicles found!");
    await mongoose.disconnect();
    process.exit(1);
}

console.log("\nVehicle:", vehicle.regNumber);

// Simulate what frontend sends (with fineAmount: 0 initially)
const frontendData = {
    vehicleId: "",  // Empty by default
    regNumber: vehicle.regNumber,
    violationType: "speeding",
    violationDescription: "Test violation",
    location: "Test Location",
    violationDate: new Date().toISOString().split("T")[0],
    fineAmount: 0,  // Default in frontend is 0
    penaltyPoints: 0,
    remarks: ""
};

console.log("\nFrontend Data:", JSON.stringify(frontendData, null, 2));

// Test 1: Try with fineAmount = 0 (should fail validation)
console.log("\n--- Test 1: fineAmount = 0 ---");
try {
    const challan1 = new Challan({
        vehicle: vehicle._id,
        regNumber: vehicle.regNumber,
        violationType: frontendData.violationType,
        violationDescription: frontendData.violationDescription,
        location: frontendData.location,
        violationDate: new Date(frontendData.violationDate),
        fineAmount: 0,  // This should fail
        penaltyPoints: frontendData.penaltyPoints,
        issuingOfficer: policeUser._id,
        officerName: policeUser.name,
        officerBadgeNumber: policeUser.badgeNumber || `POLICE-${policeUser._id.toString().substring(0, 6)}`,
        status: "active",
        paymentStatus: "pending"
    });

    await challan1.save();
    console.log("❌ ERROR: Should have failed validation but saved!");
} catch (err) {
    console.log("✅ Expected validation error:", err.message);
}

// Test 2: Try with valid fineAmount
console.log("\n--- Test 2: fineAmount = 1000 ---");
try {
    const challan2 = new Challan({
        vehicle: vehicle._id,
        regNumber: vehicle.regNumber,
        violationType: "speeding",
        violationDescription: "Valid violation",
        location: "Valid Location",
        violationDate: new Date(),
        fineAmount: 1000,
        penaltyPoints: 2,
        issuingOfficer: policeUser._id,
        officerName: policeUser.name,
        officerBadgeNumber: policeUser.badgeNumber || `POLICE-${policeUser._id.toString().substring(0, 6)}`,
        status: "active",
        paymentStatus: "pending"
    });

    await challan2.save();
    console.log("✅ Successfully created challan:", challan2._id);
} catch (err) {
    console.log("❌ Unexpected error:", err.message);
    console.log("Stack:", err.stack);
}

await mongoose.disconnect();
console.log("\n=== TEST COMPLETE ===\n");
