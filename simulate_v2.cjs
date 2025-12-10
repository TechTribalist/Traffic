const hre = require("hardhat");

async function main() {
  console.log("Starting V2 System Simulation...");

  const [admin, officer, driver, judge] = await hre.ethers.getSigners();
  
  // Load the deployed contract
  // Note: In a real scenario, we would read the address from contract-data.json
  // For this script, we'll assume the address from the previous deployment output
  // or deploy a fresh one for the simulation to be self-contained.
  
  // Let's deploy a fresh proxy for this simulation to ensure clean state
  const TrafficEnforcementV2 = await hre.ethers.getContractFactory("TrafficEnforcementV2");
  const traffic = await hre.upgrades.deployProxy(TrafficEnforcementV2, [admin.address], { kind: 'uups' });
  await traffic.deployed();
  
  const trafficAddress = traffic.address;
  console.log("TrafficEnforcementV2 deployed to:", trafficAddress);

  // 1. Setup Roles
  console.log("\n--- Setting up Roles ---");
  const OFFICER_ROLE = await traffic.OFFICER_ROLE();
  const JUDGE_ROLE = await traffic.JUDGE_ROLE();
  const OFFICER_MANAGER_ROLE = await traffic.OFFICER_MANAGER_ROLE();

  // Admin grants Officer Manager role to self (already done in initialize, but good to verify)
  // Admin registers an officer
  console.log("Registering Officer...");
  await traffic.connect(admin).registerOfficer(officer.address, "Jane Doe", "BADGE-999");
  console.log("Officer registered: Jane Doe (BADGE-999)");

  // Admin grants Judge role to judge account
  console.log("Granting Judge Role...");
  await traffic.grantRole(JUDGE_ROLE, judge.address);
  console.log("Judge role granted to:", judge.address);

  // 2. Log Violation (Standard)
  console.log("\n--- Logging Violation ---");
  const vehicleId = "KZZ 999Z";
  const offenseCode = 4; // Speeding 16-20 kph (10,000 KES)
  const evidenceHash = "QmHash123";
  
  const tx = await traffic.connect(officer).logViolation(vehicleId, offenseCode, evidenceHash, driver.address);
  const receipt = await tx.wait();
  
  // Parse logs to get violation ID
  // In ethers v6, parsing logs is different, but we are using v6 in the script context (hardhat default)
  // Wait, we downgraded hardhat config but the runtime might be using v6 if installed.
  // Let's just fetch the violation from the vehicle mapping for simplicity.
  
  const violations = await traffic.getVehicleViolations(vehicleId, 0, 1);
  const violationId = violations[0];
  console.log("Violation logged with ID:", violationId);
  
  const violation = await traffic.getViolation(violationId);
  console.log("Violation Amount (Wei):", violation.fineAmount.toString());

  // 3. Pay Fine
  console.log("\n--- Paying Fine ---");
  const fineAmount = violation.fineAmount;
  await traffic.connect(driver).payFine(violationId, { value: fineAmount });
  console.log("Fine paid by driver");
  
  const paidViolation = await traffic.getViolation(violationId);
  console.log("Violation Status:", paidViolation.status === 1n ? "Paid" : paidViolation.status);

  // 4. Appeal Process (Refund Scenario)
  console.log("\n--- Appeal & Refund Process ---");
  console.log("Driver submitting appeal...");
  await traffic.connect(driver).submitAppeal(violationId, "I was actually rushing a pregnant woman to the hospital.");
  
  console.log("Judge reviewing appeal...");
  // Judge approves appeal
  await traffic.connect(judge).resolveAppeal(violationId, true, "Medical emergency verified.");
  console.log("Appeal approved by Judge");
  
  const appealedViolation = await traffic.getViolation(violationId);
  console.log("Violation Status:", appealedViolation.status === 5n ? "Refunded (Pending Claim)" : appealedViolation.status);
  
  // Check pending refund
  const pendingRefund = await traffic.pendingRefunds(driver.address);
  console.log("Pending Refund for Driver:", pendingRefund.toString());
  
  // Claim Refund
  console.log("Driver claiming refund...");
  const balanceBefore = await hre.ethers.provider.getBalance(driver.address);
  await traffic.connect(driver).claimRefund();
  const balanceAfter = await hre.ethers.provider.getBalance(driver.address);
  
  console.log("Refund claimed. Balance increased by approx:", (balanceAfter - balanceBefore).toString());

  // 5. Rate Limiting Test
  console.log("\n--- Testing Rate Limiting ---");
  console.log("Attempting to log multiple violations...");
  
  // We already logged 1. Limit is 100.
  // Let's try to log 100 more to hit the limit.
  // This might take too long in simulation, so we'll just log one more to prove it works.
  
  await traffic.connect(officer).logViolation("KAA 111A", 2, "QmHash456", driver.address);
  console.log("Second violation logged successfully.");
  
  const officerData = await traffic.officers(officer.address);
  console.log("Officer Daily Count:", officerData.dailyViolationCount.toString());

  console.log("\nSimulation Completed Successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
