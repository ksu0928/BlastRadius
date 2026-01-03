const { ethers } = require("hardhat");

async function main() {
    try {
        console.log("🚀 Starting MultiplayerEscrow deployment process...");

        // Get deployer account
        const [deployer] = await ethers.getSigners();
        console.log("Deploying with account:", deployer.address);

        const balance = await ethers.provider.getBalance(deployer.address);
        console.log("Account balance:", ethers.formatEther(balance), "PUSH");

        // Oracle address - defaults to deployer
        const oracleAddress = process.env.ORACLE_ADDRESS || deployer.address;
        console.log("Oracle address:", oracleAddress);

        // Deploy contract
        const MultiplayerEscrow = await ethers.getContractFactory("MultiplayerEscrow");
        console.log("Contract factory loaded. Deploying...");

        const escrow = await MultiplayerEscrow.deploy(oracleAddress);
        console.log("⏳ Transaction sent. Hash:", escrow.deploymentTransaction().hash);

        await escrow.waitForDeployment();
        const escrowAddress = await escrow.getAddress();

        console.log("\n==================================================");
        console.log("✅ DEPLOYED ADDRESS:", escrowAddress);
        console.log("==================================================\n");

        console.log("🎉 Deployment successful!");
    } catch (error) {
        console.error("❌ DEPLOYMENT ERROR:", error.message);
        if (error.stack) console.error(error.stack);
    }
}

main().catch((error) => {
    console.error("FATAL ERROR:", error);
    process.exit(1);
});
