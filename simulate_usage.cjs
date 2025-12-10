const hre = require("hardhat");

async function main() {
  console.log("Starting System Simulation...");

  // 1. Setup Accounts
  const [admin, officer, driver1, driver2, judge] = await hre.ethers.getSigners();
  console.log(`Admin: ${admin.address}`);
  console.log(`Officer: ${officer.address}`);
  console.log(`Driver 1: ${driver1.address}`);
  console.log(`Judge: ${judge.address}`);

  // 2. Get Deployed Contract
  const TrafficEnforcement = await hre.ethers.getContractFactory("TrafficEnforcement");
  // We need to attach to the already deployed contract. 
  // Since we don't have the address easily accessible in this script context without reading the file,
  // we'll deploy a fresh one for this simulation script to ensure clean state.
  // In a real E2E test, we would read from contract-data.json.
  const trafficEnforcement = await TrafficEnforcement.deploy();
  await trafficEnforcement.deployed();
  console.log(`\nContract Deployed to: ${trafficEnforcement.address}`);

  // 3. Register Officer (Admin Action)
  console.log("\n--- Step 1: Officer Registration ---");
  const tx1 = await trafficEnforcement.connect(admin).registerOfficer(
    officer.address, 
    "John Kamau", 
    "POL-4421"
  );
  await tx1.wait();
  console.log("Officer John Kamau (POL-4421) registered successfully.");

  // 4. Log Violation (Officer Action)
  console.log("\n--- Step 2: Violation Logging ---");
  const offenseCode = 4; // Speeding 16-20 kph over limit (10,000 KES)
  const evidenceHash = "QmXyZ..."; // Mock IPFS hash
  
  const tx2 = await trafficEnforcement.connect(officer).logViolation(
    "KBZ 123X",
    offenseCode,
    evidenceHash,
    driver1.address
  );
  const receipt2 = await tx2.wait();
  
  // Extract violation ID from event
  const violationLoggedEvent = receipt2.events.find(e => e.event === "ViolationLogged");
  const violationId = violationLoggedEvent.args.violationId;
  console.log(`Violation logged for KBZ 123X. ID: ${violationId}`);
  console.log(`Fine Amount: ${hre.ethers.utils.formatEther(violationLoggedEvent.args.fineAmount)} ETH (simulated KES)`);

  // 5. Pay Fine (Driver Action)
  console.log("\n--- Step 3: Fine Payment ---");
  const fineAmount = violationLoggedEvent.args.fineAmount;
  
  const tx3 = await trafficEnforcement.connect(driver1).payFine(violationId, { value: fineAmount });
  await tx3.wait();
  console.log("Fine paid successfully by Driver 1.");

  // Verify status
  const violationDetails = await trafficEnforcement.getViolation(violationId);
  console.log(`Violation Status: ${violationDetails.status === 1 ? "Paid" : "Unpaid"}`);

  // 6. Log Another Violation & Appeal (Driver Action)
  console.log("\n--- Step 4: Appeal Process ---");
  const tx4 = await trafficEnforcement.connect(officer).logViolation(
    "KCA 456Y",
    7, // Failure to obey traffic signs
    "QmAbC...",
    driver2.address
  );
  const receipt4 = await tx4.wait();
  const violationId2 = receipt4.events.find(e => e.event === "ViolationLogged").args.violationId;
  console.log(`New Violation logged for KCA 456Y. ID: ${violationId2}`);

  const tx5 = await trafficEnforcement.connect(driver2).submitAppeal(
    violationId2,
    "Traffic light was malfunctioning, stuck on red."
  );
  await tx5.wait();
  console.log("Appeal submitted by Driver 2.");

  // 7. Resolve Appeal (Admin/Judge Action)
  console.log("\n--- Step 5: Appeal Resolution ---");
  const tx6 = await trafficEnforcement.connect(admin).resolveAppeal(
    violationId2,
    true, // Waive fine
    "Evidence confirms traffic light malfunction."
  );
  await tx6.wait();
  console.log("Appeal resolved. Fine Waived.");

  const violationDetails2 = await trafficEnforcement.getViolation(violationId2);
  console.log(`Violation Status: ${violationDetails2.status === 3 ? "Waived" : "Other"}`);

  console.log("\nSimulation Complete. All workflows verified.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
