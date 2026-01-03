const { ethers } = require("ethers");
require("dotenv").config();

const RPC_URL = "https://evm.donut.rpc.push.org/";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

async function main() {
    if (!PRIVATE_KEY) {
        console.error("Please add PRIVATE_KEY to .env");
        return;
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log("Checking balance for:", wallet.address);
    const balance = await provider.getBalance(wallet.address);
    console.log("Balance:", ethers.formatEther(balance), "PUSH");

    const feeData = await provider.getFeeData();
    console.log("Gas Price:", ethers.formatUnits(feeData.gasPrice, "gwei"), "gwei");

    // Load ABI and Bytecode from Hardhat artifacts
    const artifact = require("../artifacts/contracts/MultiplayerEscrow.sol/MultiplayerEscrow.json");
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

    console.log("Deploying MultiplayerEscrow...");
    const escrow = await factory.deploy(wallet.address);

    console.log("Wait for deployment...");
    await escrow.waitForDeployment();

    const address = await escrow.getAddress();
    console.log("✅ MultiplayerEscrow deployed to:", address);
}

main().catch(console.error);
