const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  // Check if deployment exists
  const deploymentPath = path.join(__dirname, '../deployments/sepolia.json');
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ No deployment found! Run deploy.js first.");
    process.exit(1);
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  console.log("Using proxy at:", deployment.proxy);
  
  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log("Operating as:", deployer.address);
  
  // Get contract instance
  const TrafficEnforcementV2 = await ethers.getContractFactory("TrafficEnforcementV2");
  const contract = TrafficEnforcementV2.attach(deployment.proxy);
  
  // Get address to grant admin to
  const addressToGrant = process.argv[2];
  if (!addressToGrant) {
    console.error("❌ Please provide an address: npm run grant-admin 0x...");
    process.exit(1);
  }
  
  // Grant admin role
  console.log(`\nGranting ADMIN role to ${addressToGrant}...`);
  
  try {
    const ADMIN_ROLE = await contract.ADMIN_ROLE();
    const tx = await contract.grantRole(ADMIN_ROLE, addressToGrant);
    console.log("Transaction hash:", tx.hash);
    
    await tx.wait();
    console.log("✅ Admin role granted successfully!");
    
    // Verify the role
    const hasRole = await contract.hasRole(ADMIN_ROLE, addressToGrant);
    console.log("Verification - Has admin role:", hasRole);
    
  } catch (error) {
    console.error("❌ Failed to grant role:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });