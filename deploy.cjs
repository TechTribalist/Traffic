const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Deploying TrafficEnforcement contract...");

  // Get the contract factory
  const TrafficEnforcement = await hre.ethers.getContractFactory("TrafficEnforcement");

  // Deploy the contract
  const trafficEnforcement = await TrafficEnforcement.deploy();

  // Wait for deployment to finish
  await trafficEnforcement.deployed();

  const contractAddress = trafficEnforcement.address;
  console.log("TrafficEnforcement deployed to:", contractAddress);

  // Save the contract address and ABI to a file for the frontend to use
  const artifact = await hre.artifacts.readArtifact("TrafficEnforcement");
  const contractData = {
    address: contractAddress,
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
