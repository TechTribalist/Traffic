// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title TrafficEnforcement
 * @dev A smart contract for transparent and tamper-evident traffic enforcement in Kenya
 * @notice This contract manages traffic violations, fines, and appeals using blockchain technology
 */

contract TrafficEnforcement {
    
    // ============================================================================
    // ENUMS
    // ============================================================================
    
    enum ViolationStatus { Unpaid, Paid, Appealed, Waived, Rejected }
    
    // ============================================================================
    // STRUCTS
    // ============================================================================
    
    /**
     * @dev Structure to store traffic violation details
     */
    struct Violation {
        bytes32 violationId;
        string vehicleId;
        address officerId;
        uint256 offenseCode;
        string evidenceHash;
        uint256 timestamp;
        uint256 fineAmount;
        ViolationStatus status;
        address driverId;
        string offenseName;
    }
    
    /**
     * @dev Structure to store registered police officer details
     */
    struct Officer {
        address officerId;
        string name;
        string badgeNumber;
        bool isRegistered;
        uint256 registrationTime;
    }
    
    /**
     * @dev Structure to store appeal details
     */
    struct Appeal {
        bytes32 violationId;
        address driverId;
        string appealReason;
        uint256 appealTime;
        bool resolved;
        bool waived;
        string judgeNotes;
    }
    
    // ============================================================================
    // STATE VARIABLES
    // ============================================================================
    
    address public admin;
    
    mapping(bytes32 => Violation) public violations;
    mapping(address => Officer) public officers;
    mapping(string => bytes32[]) public vehicleViolations;
    mapping(bytes32 => Appeal) public appeals;
    
    uint256 public totalViolations;
    uint256 public totalFinesPaid;
    
    // Offense code to fine amount mapping (in wei, representing KES)
    mapping(uint256 => uint256) public offenseFines;
    mapping(uint256 => string) public offenseNames;
    
    // ============================================================================
    // EVENTS
    // ============================================================================
    
    event OfficerRegistered(address indexed officerId, string name, string badgeNumber);
    event ViolationLogged(bytes32 indexed violationId, string vehicleId, uint256 offenseCode, uint256 fineAmount);
    event FinePaid(bytes32 indexed violationId, address indexed driverId, uint256 amount);
    event AppealSubmitted(bytes32 indexed violationId, address indexed driverId, string reason);
    event AppealResolved(bytes32 indexed violationId, bool waived, string judgeNotes);
    event FineWaived(bytes32 indexed violationId, string reason);
    
    // ============================================================================
    // MODIFIERS
    // ============================================================================
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }
    
    modifier onlyRegisteredOfficer() {
        require(officers[msg.sender].isRegistered, "Only registered officers can call this function");
        _;
    }
    
    modifier violationExists(bytes32 violationId) {
        require(violations[violationId].timestamp != 0, "Violation does not exist");
        _;
    }
    
    // ============================================================================
    // CONSTRUCTOR
    // ============================================================================
    
    constructor() {
        admin = msg.sender;
        _initializeOffenses();
    }
    
    // ============================================================================
    // INITIALIZATION FUNCTIONS
    // ============================================================================
    
    /**
     * @dev Initialize offense codes and their corresponding fines
     * @notice Fines are based on Kenya's Traffic (Minor Offences) Rules, 2016
     */
    function _initializeOffenses() private {
        // Speeding violations (1-5 kph over limit)
        offenseFines[1] = 0; // Warning
        offenseNames[1] = "Speeding 1-5 kph over limit";
        
        // Speeding violations (6-10 kph over limit)
        offenseFines[2] = 500 gwei; // 500 KES
        offenseNames[2] = "Speeding 6-10 kph over limit";
        
        // Speeding violations (11-15 kph over limit)
        offenseFines[3] = 3000 gwei; // 3000 KES
        offenseNames[3] = "Speeding 11-15 kph over limit";
        
        // Speeding violations (16-20 kph over limit)
        offenseFines[4] = 10000 gwei; // 10000 KES
        offenseNames[4] = "Speeding 16-20 kph over limit";
        
        // Failure to wear seatbelt
        offenseFines[5] = 500 gwei; // 500 KES
        offenseNames[5] = "Failure to wear seatbelt";
        
        // Driving without valid license
        offenseFines[6] = 3000 gwei; // 3000 KES
        offenseNames[6] = "Driving without valid license";
        
        // Failure to obey traffic signs
        offenseFines[7] = 3000 gwei; // 3000 KES
        offenseNames[7] = "Failure to obey traffic signs";
        
        // Failure to stop when signaled by police
        offenseFines[8] = 5000 gwei; // 5000 KES
        offenseNames[8] = "Failure to stop when signaled by police";
        
        // Causing obstruction with vehicle
        offenseFines[9] = 10000 gwei; // 10000 KES
        offenseNames[9] = "Causing obstruction with vehicle";
        
        // Driving on pavement or pedestrian walkway
        offenseFines[10] = 5000 gwei; // 5000 KES
        offenseNames[10] = "Driving on pavement or pedestrian walkway";
        
        // Driving without identification plates
        offenseFines[11] = 10000 gwei; // 10000 KES
        offenseNames[11] = "Driving without identification plates";
        
        // Motorcycle carrying more than one pillion passenger
        offenseFines[12] = 1000 gwei; // 1000 KES
        offenseNames[12] = "Motorcycle carrying more than one pillion passenger";
        
        // Touting
        offenseFines[13] = 3000 gwei; // 3000 KES
        offenseNames[13] = "Touting";
        
        // Using mobile phone while driving
        offenseFines[14] = 2000 gwei; // 2000 KES
        offenseNames[14] = "Using mobile phone while driving";
        
        // Driving without valid inspection certificate
        offenseFines[15] = 10000 gwei; // 10000 KES
        offenseNames[15] = "Driving without valid inspection certificate";
    }
    
    // ============================================================================
    // OFFICER MANAGEMENT FUNCTIONS
    // ============================================================================
    
    /**
     * @dev Register a new police officer
     * @param officerId The Ethereum address of the officer
     * @param name The name of the officer
     * @param badgeNumber The badge number of the officer
     */
    function registerOfficer(
        address officerId,
        string memory name,
        string memory badgeNumber
    ) public onlyAdmin {
        require(officerId != address(0), "Invalid officer address");
        require(bytes(name).length > 0, "Officer name cannot be empty");
        require(bytes(badgeNumber).length > 0, "Badge number cannot be empty");
        require(!officers[officerId].isRegistered, "Officer already registered");
        
        officers[officerId] = Officer({
            officerId: officerId,
            name: name,
            badgeNumber: badgeNumber,
            isRegistered: true,
            registrationTime: block.timestamp
        });
        
        emit OfficerRegistered(officerId, name, badgeNumber);
    }
    
    /**
     * @dev Deregister a police officer
     * @param officerId The Ethereum address of the officer to deregister
     */
    function deregisterOfficer(address officerId) public onlyAdmin {
        require(officers[officerId].isRegistered, "Officer not registered");
        officers[officerId].isRegistered = false;
    }
    
    /**
     * @dev Check if an officer is registered
     * @param officerId The Ethereum address of the officer
     * @return bool True if the officer is registered, false otherwise
     */
    function isOfficerRegistered(address officerId) public view returns (bool) {
        return officers[officerId].isRegistered;
    }
    
    // ============================================================================
    // VIOLATION MANAGEMENT FUNCTIONS
    // ============================================================================
    
    /**
     * @dev Log a new traffic violation
     * @param vehicleId The license plate of the vehicle
     * @param offenseCode The code of the offense
     * @param evidenceHash The IPFS hash of the evidence
     * @param driverId The Ethereum address of the driver
     * @return violationId The unique identifier of the violation
     */
    function logViolation(
        string memory vehicleId,
        uint256 offenseCode,
        string memory evidenceHash,
        address driverId
    ) public onlyRegisteredOfficer returns (bytes32) {
        require(bytes(vehicleId).length > 0, "Vehicle ID cannot be empty");
        require(offenseFines[offenseCode] > 0 || offenseCode == 1, "Invalid offense code");
        require(bytes(evidenceHash).length > 0, "Evidence hash cannot be empty");
        require(driverId != address(0), "Invalid driver address");
        
        bytes32 violationId = keccak256(
            abi.encodePacked(vehicleId, msg.sender, block.timestamp, offenseCode)
        );
        
        violations[violationId] = Violation({
            violationId: violationId,
            vehicleId: vehicleId,
            officerId: msg.sender,
            offenseCode: offenseCode,
            evidenceHash: evidenceHash,
            timestamp: block.timestamp,
            fineAmount: offenseFines[offenseCode],
            status: ViolationStatus.Unpaid,
            driverId: driverId,
            offenseName: offenseNames[offenseCode]
        });
        
        vehicleViolations[vehicleId].push(violationId);
        totalViolations++;
        
        emit ViolationLogged(violationId, vehicleId, offenseCode, offenseFines[offenseCode]);
        
        return violationId;
    }
    
    /**
     * @dev Get details of a specific violation
     * @param violationId The unique identifier of the violation
     * @return The Violation struct
     */
    function getViolation(bytes32 violationId)
        public
        view
        violationExists(violationId)
        returns (Violation memory)
    {
        return violations[violationId];
    }
    
    /**
     * @dev Get all violations for a specific vehicle
     * @param vehicleId The license plate of the vehicle
     * @return Array of violation IDs
     */
    function getVehicleViolations(string memory vehicleId)
        public
        view
        returns (bytes32[] memory)
    {
        return vehicleViolations[vehicleId];
    }
    
    /**
     * @dev Get the number of violations for a specific vehicle
     * @param vehicleId The license plate of the vehicle
     * @return The number of violations
     */
    function getVehicleViolationCount(string memory vehicleId)
        public
        view
        returns (uint256)
    {
        return vehicleViolations[vehicleId].length;
    }
    
    // ============================================================================
    // FINE PAYMENT FUNCTIONS
    // ============================================================================
    
    /**
     * @dev Pay a fine for a violation
     * @param violationId The unique identifier of the violation
     */
    function payFine(bytes32 violationId)
        public
        payable
        violationExists(violationId)
    {
        Violation storage violation = violations[violationId];
        
        require(violation.status == ViolationStatus.Unpaid, "Violation is not unpaid");
        require(msg.value >= violation.fineAmount, "Insufficient payment");
        require(msg.sender == violation.driverId, "Only the driver can pay this fine");
        
        violation.status = ViolationStatus.Paid;
        totalFinesPaid += violation.fineAmount;
        
        // Refund excess payment
        if (msg.value > violation.fineAmount) {
            payable(msg.sender).transfer(msg.value - violation.fineAmount);
        }
        
        emit FinePaid(violationId, msg.sender, violation.fineAmount);
    }
    
    /**
     * @dev Get the total fines paid
     * @return The total amount of fines paid
     */
    function getTotalFinesPaid() public view returns (uint256) {
        return totalFinesPaid;
    }
    
    // ============================================================================
    // APPEAL FUNCTIONS
    // ============================================================================
    
    /**
     * @dev Submit an appeal for a violation
     * @param violationId The unique identifier of the violation
     * @param appealReason The reason for the appeal
     */
    function submitAppeal(bytes32 violationId, string memory appealReason)
        public
        violationExists(violationId)
    {
        Violation storage violation = violations[violationId];
        
        require(
            violation.status == ViolationStatus.Unpaid || violation.status == ViolationStatus.Paid,
            "Cannot appeal this violation"
        );
        require(msg.sender == violation.driverId, "Only the driver can appeal");
        require(bytes(appealReason).length > 0, "Appeal reason cannot be empty");
        require(!appeals[violationId].resolved, "Appeal already resolved");
        
        violation.status = ViolationStatus.Appealed;
        
        appeals[violationId] = Appeal({
            violationId: violationId,
            driverId: msg.sender,
            appealReason: appealReason,
            appealTime: block.timestamp,
            resolved: false,
            waived: false,
            judgeNotes: ""
        });
        
        emit AppealSubmitted(violationId, msg.sender, appealReason);
    }
    
    /**
     * @dev Get appeal details
     * @param violationId The unique identifier of the violation
     * @return The Appeal struct
     */
    function getAppeal(bytes32 violationId)
        public
        view
        returns (Appeal memory)
    {
        return appeals[violationId];
    }
    
    /**
     * @dev Resolve an appeal (only admin/judge can call this)
     * @param violationId The unique identifier of the violation
     * @param waiveFine Whether to waive the fine
     * @param judgeNotes Notes from the judge
     */
    function resolveAppeal(
        bytes32 violationId,
        bool waiveFine,
        string memory judgeNotes
    ) public onlyAdmin violationExists(violationId) {
        require(violations[violationId].status == ViolationStatus.Appealed, "No pending appeal");
        require(!appeals[violationId].resolved, "Appeal already resolved");
        
        Appeal storage appeal = appeals[violationId];
        appeal.resolved = true;
        appeal.waived = waiveFine;
        appeal.judgeNotes = judgeNotes;
        
        if (waiveFine) {
            violations[violationId].status = ViolationStatus.Waived;
            emit FineWaived(violationId, judgeNotes);
        } else {
            violations[violationId].status = ViolationStatus.Rejected;
        }
        
        emit AppealResolved(violationId, waiveFine, judgeNotes);
    }
    
    // ============================================================================
    // STATISTICS FUNCTIONS
    // ============================================================================
    
    /**
     * @dev Get total number of violations recorded
     * @return The total number of violations
     */
    function getTotalViolations() public view returns (uint256) {
        return totalViolations;
    }
    
    /**
     * @dev Get contract balance (total fines collected)
     * @return The contract balance in wei
     */
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Withdraw funds from the contract (admin only)
     * @param amount The amount to withdraw
     */
    function withdrawFunds(uint256 amount) public onlyAdmin {
        require(amount <= address(this).balance, "Insufficient contract balance");
        payable(admin).transfer(amount);
    }
    
    // ============================================================================
    // FALLBACK FUNCTIONS
    // ============================================================================
    
    receive() external payable {}
    
    fallback() external payable {}
}
