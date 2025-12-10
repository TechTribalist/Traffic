const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("Deploying TrafficEnforcement V2 to Sepolia testnet...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Check balance
  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
  
  // Deploy TrafficEnforcementV2 as upgradeable proxy
  console.log("\nDeploying TrafficEnforcementV2...");
  const TrafficEnforcementV2 = await ethers.getContractFactory("TrafficEnforcementV2");
  
  const proxy = await upgrades.deployProxy(
    TrafficEnforcementV2,
    [], // initialize function arguments (if any)
    { 
      initializer: 'initialize',
      kind: 'uups'
    }
  );
  
  await proxy.deployed();
  
  console.log("\n✅ TrafficEnforcementV2 deployed!");
  console.log("Proxy address:", proxy.address);
  
  // Get implementation address
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxy.address);
  console.log("Implementation address:", implementationAddress);
  
  // Wait for a few block confirmations
  console.log("\nWaiting for block confirmations...");
  await proxy.deployTransaction.wait(5);
  
  // Save deployment info
  const deploymentInfo = {
    network: "sepolia",
    chainId: 11155111,
    proxy: proxy.address,
    implementation: implementationAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    blockNumber: proxy.deployTransaction.blockNumber
  };
  
  console.log("\n📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  // Save to file
  const fs = require('fs');
  const path = require('path');
  
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  fs.writeFileSync(
    path.join(deploymentsDir, 'sepolia.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n💾 Deployment info saved to deployments/sepolia.json");
  
  // Verify on Etherscan
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("\n🔍 Verifying contract on Etherscan...");
    console.log("Please wait a moment for Etherscan to index the contract...");
    
    setTimeout(async () => {
      try {
        await run("verify:verify", {
          address: implementationAddress,
          constructorArguments: [],
        });
        console.log("✅ Contract verified on Etherscan!");
      } catch (error) {
        console.log("❌ Verification failed:", error.message);
        console.log("You can verify manually later with:");
        console.log(`npx hardhat verify --network sepolia ${implementationAddress}`);
      }
    }, 30000); // Wait 30 seconds before verification
  }
  
  console.log("\n🎉 Deployment complete!");
  console.log("\n📝 Next steps:");
  console.log("1. Update .env.production with the new proxy address:", proxy.address);
  console.log("2. Update client/src/data/contract-data.json with the new addresses");
  console.log("3. Test the contract on Sepolia testnet");
  console.log("4. Switch the app from development mode to production mode");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });