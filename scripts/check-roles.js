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
  console.log("Checking roles for contract at:", deployment.proxy);
  console.log("=========================================\n");
  
  // Get signer
  const [signer] = await ethers.getSigners();
  
  // Get contract instance
  const TrafficEnforcementV2 = await ethers.getContractFactory("TrafficEnforcementV2");
  const contract = TrafficEnforcementV2.attach(deployment.proxy);
  
  // Get all role constants
  const roles = {
    DEFAULT_ADMIN: await contract.DEFAULT_ADMIN_ROLE(),
    ADMIN: await contract.ADMIN_ROLE(),
    OFFICER_MANAGER: await contract.OFFICER_MANAGER_ROLE(),
    OFFICER: await contract.OFFICER_ROLE(),
    JUDGE: await contract.JUDGE_ROLE(),
    TREASURY: await contract.TREASURY_ROLE(),
    UPGRADER: await contract.UPGRADER_ROLE()
  };
  
  // Check address (can be passed as argument or use signer)
  const addressToCheck = process.argv[2] || signer.address;
  console.log("Checking roles for address:", addressToCheck);
  console.log("\n📋 Role Status:");
  console.log("-----------------------------------------");
  
  for (const [roleName, roleHash] of Object.entries(roles)) {
    const hasRole = await contract.hasRole(roleHash, addressToCheck);
    const emoji = hasRole ? "✅" : "❌";
    console.log(`${emoji} ${roleName.padEnd(20)} : ${hasRole}`);
  }
  
  // Get role member counts
  console.log("\n📊 Role Member Counts:");
  console.log("-----------------------------------------");
  
  for (const [roleName, roleHash] of Object.entries(roles)) {
    const count = await contract.getRoleMemberCount(roleHash);
    console.log(`${roleName.padEnd(20)} : ${count} member(s)`);
    
    // List members if count is small
    if (count > 0 && count <= 5) {
      for (let i = 0; i < count; i++) {
        const member = await contract.getRoleMember(roleHash, i);
        console.log(`  └─ ${member}`);
      }
    }
  }
  
  // Check contract state
  console.log("\n⚙️  Contract State:");
  console.log("-----------------------------------------");
  
  try {
    const isPaused = await contract.paused();
    console.log("Contract paused:", isPaused ? "Yes ⏸️" : "No ▶️");
  } catch (e) {
    console.log("Contract paused: Unable to check");
  }
  
  // Get statistics
  console.log("\n📈 Statistics:");
  console.log("-----------------------------------------");
  
  try {
    const totalViolations = await contract.totalViolations();
    const totalAppeals = await contract.totalAppeals();
    const totalOfficers = await contract.totalOfficers();
    
    console.log("Total Violations:", totalViolations.toString());
    console.log("Total Appeals:", totalAppeals.toString());
    console.log("Total Officers:", totalOfficers.toString());
  } catch (e) {
    console.log("Unable to fetch statistics");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });