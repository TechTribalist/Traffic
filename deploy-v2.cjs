const { ethers, upgrades } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Deploying TrafficEnforcementV2 (Proxy)...");

  const TrafficEnforcementV2 = await ethers.getContractFactory("TrafficEnforcementV2");
  
  // Deploy proxy
  const trafficEnforcement = await upgrades.deployProxy(TrafficEnforcementV2, [
    (await ethers.getSigners())[0].address // Admin address
  ], { kind: 'uups' });

  await trafficEnforcement.deployed();

  console.log("TrafficEnforcementV2 deployed to:", trafficEnforcement.address);

  // Save contract data
  const artifact = await hre.artifacts.readArtifact("TrafficEnforcementV2");
  const contractData = {
    address: trafficEnforcement.address,
    abi: artifact.abi
  };

  fs.writeFileSync(
    "./client/src/contract-data.json",
    JSON.stringify(contractData, null, 2)
  );

  console.log("Contract data saved to ./client/src/contract-data.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
