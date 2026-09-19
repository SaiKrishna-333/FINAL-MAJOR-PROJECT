// Comprehensive System Test Script for BioChain RTO
import { ethers } from "ethers";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/BioChainRTO";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RPC_URL = process.env.POLYGON_RPC_URL || "https://rpc-amoy.polygon.technology";
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;

console.log("🧪 BIOCHAIN RTO - COMPREHENSIVE SYSTEM TEST\n");

// Test Results Tracker
const results = {
    passed: 0,
    failed: 0,
    tests: [] as string[]
};

function test(name: string, condition: boolean) {
    if (condition) {
        console.log(`✅ PASS: ${name}`);
        results.passed++;
        results.tests.push(`✅ ${name}`);
    } else {
        console.log(`❌ FAIL: ${name}`);
        results.failed++;
        results.tests.push(`❌ ${name}`);
    }
}

async function runTests() {
    console.log("=".repeat(60));
    
    // TEST 1: Environment Variables
    console.log("\n📋 TEST 1: Environment Configuration");
    test("MONGO_URI configured", !!MONGO_URI);
    test("CONTRACT_ADDRESS configured", !!CONTRACT_ADDRESS);
    test("PRIVATE_KEY configured", !!PRIVATE_KEY);
    test("RPC_URL configured", !!RPC_URL);
    
    // TEST 2: MongoDB Connection
    console.log("\n📋 TEST 2: MongoDB Database Connection");
    try {
        await mongoose.connect(MONGO_URI);
        test("MongoDB connected successfully", true);
        
        // Import models to register them with mongoose
        await import('../src/models/User.js');
        await import('../src/models/Vehicle.js');
        await import('../src/models/Request.js');
        await import('../src/models/Challan.js');
        
        // Check collections exist
        const models = mongoose.connection.models;
        test("User model exists", !!models.User);
        test("Vehicle model exists", !!models.Vehicle);
        test("Request model exists", !!models.Request);
        test("Challan model exists", !!models.Challan);
        
        await mongoose.disconnect();
    } catch (err: any) {
        test("MongoDB connection", false);
        console.log(`   Error: ${err.message}`);
    }
    
    // TEST 3: Blockchain Connection
    console.log("\n📋 TEST 3: Blockchain (Polygon Amoy) Connection");
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const blockNumber = await provider.getBlockNumber();
        test("Connected to Polygon Amoy", blockNumber > 0);
        console.log(`   Current block: ${blockNumber}`);
        
        // Check wallet balance
        const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
        const balance = await provider.getBalance(wallet.address);
        const balanceInMatic = ethers.formatEther(balance);
        test("Wallet has balance", parseFloat(balanceInMatic) > 0);
        console.log(`   Wallet address: ${wallet.address}`);
        console.log(`   Balance: ${parseFloat(balanceInMatic).toFixed(4)} MATIC`);
        
    } catch (err: any) {
        test("Blockchain connection", false);
        console.log(`   Error: ${err.message}`);
    }
    
    // TEST 4: Smart Contract
    console.log("\n📋 TEST 4: Smart Contract Verification");
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
        
        // Minimal ABI for testing
        const testABI = [
            "function admin() view returns (address)",
            "function registerNewVehicle(string regNumber, string chassisNumber, string engineNumber, string make, string model, uint256 year, address owner) external"
        ];
        
        const contract = new ethers.Contract(CONTRACT_ADDRESS!, testABI, wallet);
        
        // Check contract is deployed
        const code = await provider.getCode(CONTRACT_ADDRESS!);
        test("Contract is deployed", code.length > 2);
        
        // Check admin
        const admin = await contract.admin();
        test("Contract admin accessible", admin !== undefined);
        console.log(`   Contract address: ${CONTRACT_ADDRESS}`);
        console.log(`   Admin: ${admin}`);
        
    } catch (err: any) {
        test("Smart contract verification", false);
        console.log(`   Error: ${err.message}`);
    }
    
    // TEST 5: Backend API Health (if running)
    console.log("\n📋 TEST 5: Backend API Endpoints");
    try {
        const response = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "test@test.com", password: "test" })
        });
        
        // We expect 401 for invalid credentials, but server should respond
        test("Backend server responding", response.status !== 503);
        console.log(`   Response status: ${response.status}`);
    } catch (err: any) {
        test("Backend server reachable", false);
        console.log(`   Error: Server not running or unreachable`);
    }
    
    // TEST 6: Frontend Build
    console.log("\n📋 TEST 6: Frontend Build Artifacts");
    import('fs').then(({ default: fs }) => {
        import('path').then(({ default: path }) => {
            const distPath = path.join(process.cwd(), '../frontend/dist');
            
            test("Frontend dist folder exists", fs.existsSync(distPath));
            test("index.html exists", fs.existsSync(path.join(distPath, 'index.html')));
            test("assets folder exists", fs.existsSync(path.join(distPath, 'assets')));
            
            printSummary();
        });
    });
}

function printSummary() {
    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 TEST SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total Tests: ${results.passed + results.failed}`);
    console.log(`Passed: ${results.passed} ✅`);
    console.log(`Failed: ${results.failed} ❌`);
    console.log("\nDetailed Results:");
    results.tests.forEach((t, i) => console.log(`${i + 1}. ${t}`));
    
    if (results.failed === 0) {
        console.log("\n🎉 ALL TESTS PASSED! System is ready for deployment.");
    } else {
        console.log(`\n⚠️  ${results.failed} test(s) failed. Please review and fix.`);
    }
    
    process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(console.error);
