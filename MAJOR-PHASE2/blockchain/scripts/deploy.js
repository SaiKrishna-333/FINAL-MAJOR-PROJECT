import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
    console.log("Deploying VehicleRegistry contract to Polygon Amoy...");

    // Get the deployer's address
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "MATIC");

    if (balance === 0n) {
        throw new Error(
            "❌ No MATIC found! Please get test tokens from the faucet first.\n" +
            "Visit: https://faucet.polygon.technology/"
        );
    }

    // Deploy the contract
    const VehicleRegistry = await ethers.getContractFactory("VehicleRegistry");
    const vehicleRegistry = await VehicleRegistry.deploy();

    await vehicleRegistry.waitForDeployment();

    const contractAddress = await vehicleRegistry.getAddress();
    console.log("\n✅ VehicleRegistry deployed to:", contractAddress);
    console.log("\n📝 Next steps:");
    console.log("1. Copy this contract address");
    console.log("2. Update backend/.env with CONTRACT_ADDRESS=" + contractAddress);
    console.log("3. Restart your backend server\n");

    console.log("🔍 View on Polygonscan:");
    console.log("https://amoy.polygonscan.com/address/" + contractAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
