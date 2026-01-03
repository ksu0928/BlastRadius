const { ethers } = require("hardhat");

async function main() {
    try {
        const [deployer] = await ethers.getSigners();
        console.log("Checking balance for:", deployer.address);
        const balance = await ethers.provider.getBalance(deployer.address);
        console.log("Balance:", ethers.formatEther(balance), "PUSH");

        const feeData = await ethers.provider.getFeeData();
        console.log("Gas Price:", ethers.formatUnits(feeData.gasPrice, "gwei"), "gwei");

        const factory = await ethers.getContractFactory("MultiplayerEscrow");
        console.log("Factory loaded");

        // Use deployer address as oracle
        const deployTx = await factory.getDeployTransaction(deployer.address);
        console.log("Generated deployment transaction");

        const estimateGas = await ethers.provider.estimateGas(deployTx);
        console.log("Estimated Gas:", estimateGas.toString());

        const totalCost = estimateGas * feeData.gasPrice;
        console.log("Total Cost:", ethers.formatEther(totalCost), "PUSH");
    } catch (error) {
        console.error("ERROR:", error.message);
    }
}

main().catch(console.error);
