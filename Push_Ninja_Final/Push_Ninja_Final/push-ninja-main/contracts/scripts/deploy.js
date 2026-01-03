const hre = require("hardhat");

async function main() {
  console.log("Deploying PushNinjaGameNFT to Push Chain...");

  const PushNinjaGameNFT = await hre.ethers.getContractFactory("PushNinjaGameNFT");
  const nft = await PushNinjaGameNFT.deploy();

  await nft.waitForDeployment();

  const address = await nft.getAddress();
  console.log(`✅ PushNinjaGameNFT deployed to: ${address}`);
  console.log(`\n📝 Update this address in src/services/pushChainService.ts:`);
  console.log(`   GAME_NFT_CONTRACT_ADDRESS = "${address}"`);
  console.log(`\n🔗 View on Push Explorer: https://explorer.push.org/address/${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
