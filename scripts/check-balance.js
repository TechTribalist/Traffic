const { ethers } = require("hardhat");

async function main() {
  console.log("Checking Sepolia testnet balance...\n");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Account address:", deployer.address);
  
  // Check balance
  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
  
  // Check if balance is sufficient
  const minRequired = ethers.utils.parseEther("0.1"); // 0.1 ETH recommended
  if (balance.lt(minRequired)) {
    console.log("\n⚠️  Warning: Balance might be insufficient for deployment!");
    console.log("   Recommended: At least 0.1 ETH");
    console.log("\n   Get Sepolia ETH from:");
    console.log("   - https://sepoliafaucet.com/");
    console.log("   - https://sepolia-faucet.pk910.de/");
    console.log("   - https://faucets.chain.link/sepolia");
  } else {
    console.log("\n✅ Balance is sufficient for deployment!");
  }
  
  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("\n📊 Network Info:");
  console.log("   Name:", network.name);
  console.log("   Chain ID:", network.chainId);
  
  // Get gas price
  const gasPrice = await ethers.provider.getGasPrice();
  console.log("   Current gas price:", ethers.utils.formatUnits(gasPrice, "gwei"), "gwei");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });