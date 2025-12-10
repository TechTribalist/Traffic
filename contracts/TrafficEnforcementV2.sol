// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title TrafficEnforcementV2
 * @dev Improved traffic enforcement contract with enhanced security and best practices
 * @notice This contract manages traffic violations, fines, and appeals with advanced security features
 * 
 * Key Improvements:
 * - Role-based access control (RBAC) for better permission management
 * - ReentrancyGuard to prevent reentrancy attacks
 * - Pausable mechanism for emergency stops
 * - Rate limiting to prevent spam
 * - Proper refund mechanism for waived fines
 * - Upgrade proxy pattern support
 * - Fixed currency conversion issues
 * - Gas optimizations
 */

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract TrafficEnforcementV2 is 
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable 
{
    
    // ============================================================================
    // CONSTANTS & ROLES
    // ============================================================================
    
    /**
     * @dev Role definitions for access control
     * Separation of concerns - each role has specific permissions
     */
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OFFICER_MANAGER_ROLE = keccak256("OFFICER_MANAGER_ROLE");
    bytes32 public constant OFFICER_ROLE = keccak256("OFFICER_ROLE");
    bytes32 public constant JUDGE_ROLE = keccak256("JUDGE_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    
    /**
     * @dev Rate limiting constants to prevent spam
     */
    uint256 public constant MAX_VIOLATIONS_PER_DAY = 100; // Maximum violations an officer can log per day
    uint256 public constant MAX_APPEALS_PER_VIOLATION = 3; // Maximum appeals per violation
    uint256 public constant APPEAL_COOLDOWN = 7 days; // Cooldown period between appeals
    
    /**
     * @dev Currency conversion constant
     * 1 KES = 1e15 wei (0.001 ETH) - This should be updated via oracle in production
     */
    uint256 public constant KES_TO_WEI_RATE = 1e15;
    
    /**
     * @dev Maximum string lengths for input validation
     */
    uint256 public constant MAX_STRING_LENGTH = 500;
    uint256 public constant MAX_VEHICLE_ID_LENGTH = 20;
    uint256 public constant MAX_BADGE_LENGTH = 50;
    
    // ============================================================================
    // ENUMS
    // ============================================================================
    
    enum ViolationStatus { 
        Unpaid,      // 0: Fine not yet paid
        Paid,        // 1: Fine has been paid
        Appealed,    // 2: Currently under appeal
        Waived,      // 3: Fine waived after appeal
        Rejected,    // 4: Appeal rejected, fine stands
        Refunded     // 5: Fine was refunded after successful appeal
    }
    
    // ============================================================================
    // STRUCTS
    // ============================================================================
    
    /**
     * @dev Enhanced violation structure with gas optimizations
     * Removed redundant offenseName field - can be retrieved from mapping
     */
    struct Violation {
        bytes32 violationId;
        string vehicleId;        // License plate number
        address officerId;       // Officer who issued the violation
        uint32 offenseCode;      // Changed to uint32 for gas optimization
        string evidenceHash;     // IPFS hash of evidence
        uint256 timestamp;
        uint256 fineAmount;      // Amount in wei
        ViolationStatus status;
        address driverId;        // Driver's wallet address
        uint256 paidAmount;      // Track amount paid for refunds
        address paidBy;          // Who paid the fine (for refunds)
    }
    
    /**
     * @dev Officer structure with additional validation
     */
    struct Officer {
        address officerId;
        string name;
        string badgeNumber;
        bool isActive;           // Changed from isRegistered for clarity
        uint256 registrationTime;
        uint256 dailyViolationCount;  // For rate limiting
        uint256 lastViolationDate;    // For rate limiting reset
    }
    
    /**
     * @dev Enhanced appeal structure
     */
    struct Appeal {
        bytes32 violationId;
        address appellant;       // Changed from driverId for clarity
        string appealReason;
        uint256 appealTime;
        bool resolved;
        bool approved;           // Changed from waived for clarity
        string resolution;       // Changed from judgeNotes
        address resolvedBy;      // Track which judge resolved
        uint256 appealCount;     // Track number of appeals for this violation
        uint256 lastAppealTime;  // For cooldown enforcement
    }
    
    /**
     * @dev Offense definition structure
     */
    struct Offense {
        uint256 fineAmountKES;   // Fine amount in KES
        string name;
        bool isActive;           // Can be deactivated without deletion
    }
    
    // ============================================================================
    // STATE VARIABLES
    // ============================================================================
    
    /**
     * @dev Mappings for core data storage
     */
    mapping(bytes32 => Violation) public violations;
    mapping(address => Officer) public officers;
    mapping(string => bytes32[]) public vehicleViolations;
    mapping(bytes32 => Appeal) public appeals;
    mapping(uint32 => Offense) public offenses; // Changed key to uint32
    
    /**
     * @dev Statistics tracking
     */
    uint256 public totalViolations;
    uint256 public totalFinesPaid;
    uint256 public totalFinesRefunded;
    
    /**
     * @dev Rate limiting tracking
     */
    mapping(address => mapping(uint256 => uint256)) public officerDailyViolations;
    
    /**
     * @dev Pending refunds for async processing
     */
    mapping(address => uint256) public pendingRefunds;
    
    /**
     * @dev Contract version for upgrades
     */
    uint256 public version;
    
    // ============================================================================
    // EVENTS
    // ============================================================================
    
    /**
     * @dev Comprehensive event logging for transparency
     */
    event OfficerRegistered(address indexed officerId, string name, string badgeNumber, address indexed registeredBy);
    event OfficerDeactivated(address indexed officerId, address indexed deactivatedBy);
    event OfficerReactivated(address indexed officerId, address indexed reactivatedBy);
    
    event ViolationLogged(
        bytes32 indexed violationId, 
        string vehicleId, 
        uint32 indexed offenseCode, 
        uint256 fineAmount,
        address indexed officerId
    );
    
    event FinePaid(bytes32 indexed violationId, address indexed paidBy, uint256 amount);
    event FineRefunded(bytes32 indexed violationId, address indexed refundedTo, uint256 amount);
    
    event AppealSubmitted(bytes32 indexed violationId, address indexed appellant, string reason);
    event AppealResolved(
        bytes32 indexed violationId, 
        bool approved, 
        string resolution, 
        address indexed resolvedBy
    );
    
    event FundsWithdrawn(address indexed withdrawnBy, address indexed recipient, uint256 amount);
    event RefundClaimed(address indexed claimant, uint256 amount);
    
    event OffenseUpdated(uint32 indexed offenseCode, uint256 fineAmountKES, string name);
    event ContractUpgraded(uint256 newVersion);
    
    // ============================================================================
    // MODIFIERS
    // ============================================================================
    
    /**
     * @dev Validates that a violation exists
     */
    modifier violationExists(bytes32 violationId) {
        require(violations[violationId].timestamp != 0, "Violation does not exist");
        _;
    }
    
    /**
     * @dev Input validation modifiers
     */
    modifier validAddress(address _addr) {
        require(_addr != address(0), "Invalid address: zero address");
        _;
    }
    
    modifier validString(string memory _str, uint256 maxLength) {
        require(bytes(_str).length > 0, "String cannot be empty");
        require(bytes(_str).length <= maxLength, "String exceeds maximum length");
        _;
    }
    
    /**
     * @dev Rate limiting modifier for officers
     */
    modifier rateLimited() {
        uint256 today = block.timestamp / 1 days;
        require(
            officerDailyViolations[msg.sender][today] < MAX_VIOLATIONS_PER_DAY,
            "Daily violation limit exceeded"
        );
        _;
    }
    
    // ============================================================================
    // INITIALIZER (REPLACES CONSTRUCTOR FOR UPGRADEABLE CONTRACTS)
    // ============================================================================
    
    /**
     * @dev Initializes the contract with proper role setup
     * @param _admin The initial admin address
     */
    function initialize(address _admin) public initializer {
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        // Setup initial roles
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(OFFICER_MANAGER_ROLE, _admin);
        _grantRole(JUDGE_ROLE, _admin);
        _grantRole(TREASURY_ROLE, _admin);
        _grantRole(UPGRADER_ROLE, _admin);
        
        // Initialize version
        version = 1;
        
        // Initialize default offenses
        _initializeOffenses();
    }
    
    // ============================================================================
    // INITIALIZATION FUNCTIONS
    // ============================================================================
    
    /**
     * @dev Initialize offense codes with proper KES amounts
     * @notice Fine amounts are now stored in KES and converted to wei when needed
     */
    function _initializeOffenses() private {
        // Warning - no fine
        offenses[1] = Offense({
            fineAmountKES: 0,
            name: "Speeding 1-5 kph over limit (Warning)",
            isActive: true
        });
        
        // Minor offenses
        offenses[2] = Offense({
            fineAmountKES: 500,
            name: "Speeding 6-10 kph over limit",
            isActive: true
        });
        
        offenses[3] = Offense({
            fineAmountKES: 3000,
            name: "Speeding 11-15 kph over limit",
            isActive: true
        });
        
        offenses[4] = Offense({
            fineAmountKES: 10000,
            name: "Speeding 16-20 kph over limit",
            isActive: true
        });
        
        offenses[5] = Offense({
            fineAmountKES: 500,
            name: "Failure to wear seatbelt",
            isActive: true
        });
        
        // Major offenses
        offenses[6] = Offense({
            fineAmountKES: 3000,
            name: "Driving without valid license",
            isActive: true
        });
        
        offenses[7] = Offense({
            fineAmountKES: 3000,
            name: "Failure to obey traffic signs",
            isActive: true
        });
        
        offenses[8] = Offense({
            fineAmountKES: 5000,
            name: "Failure to stop when signaled by police",
            isActive: true
        });
        
        offenses[9] = Offense({
            fineAmountKES: 10000,
            name: "Causing obstruction with vehicle",
            isActive: true
        });
        
        offenses[10] = Offense({
            fineAmountKES: 5000,
            name: "Driving on pavement or pedestrian walkway",
            isActive: true
        });
        
        // Severe offenses
        offenses[11] = Offense({
            fineAmountKES: 10000,
            name: "Driving without identification plates",
            isActive: true
        });
        
        offenses[12] = Offense({
            fineAmountKES: 1000,
            name: "Motorcycle carrying more than one pillion passenger",
            isActive: true
        });
        
        offenses[13] = Offense({
            fineAmountKES: 3000,
            name: "Touting",
            isActive: true
        });
        
        offenses[14] = Offense({
            fineAmountKES: 2000,
            name: "Using mobile phone while driving",
            isActive: true
        });
        
        offenses[15] = Offense({
            fineAmountKES: 10000,
            name: "Driving without valid inspection certificate",
            isActive: true
        });
    }
    
    // ============================================================================
    // OFFICER MANAGEMENT FUNCTIONS
    // ============================================================================
    
    /**
     * @dev Register a new police officer with enhanced validation
     * @param officerId The Ethereum address of the officer
     * @param name The name of the officer
     * @param badgeNumber The badge number of the officer
     */
    function registerOfficer(
        address officerId,
        string memory name,
        string memory badgeNumber
    ) 
        public 
        onlyRole(OFFICER_MANAGER_ROLE)
        validAddress(officerId)
        validString(name, MAX_STRING_LENGTH)
        validString(badgeNumber, MAX_BADGE_LENGTH)
        whenNotPaused
    {
        require(!officers[officerId].isActive, "Officer already active");
        
        // If officer exists but was deactivated, just reactivate
        if (officers[officerId].registrationTime > 0) {
            officers[officerId].isActive = true;
            _grantRole(OFFICER_ROLE, officerId);
            emit OfficerReactivated(officerId, msg.sender);
        } else {
            // New officer registration
            officers[officerId] = Officer({
                officerId: officerId,
                name: name,
                badgeNumber: badgeNumber,
                isActive: true,
                registrationTime: block.timestamp,
                dailyViolationCount: 0,
                lastViolationDate: 0
            });
            
            _grantRole(OFFICER_ROLE, officerId);
            emit OfficerRegistered(officerId, name, badgeNumber, msg.sender);
        }
    }
    
    /**
     * @dev Deactivate a police officer (doesn't delete data for audit trail)
     * @param officerId The Ethereum address of the officer to deactivate
     */
    function deactivateOfficer(address officerId) 
        public 
        onlyRole(OFFICER_MANAGER_ROLE)
        whenNotPaused
    {
        require(officers[officerId].isActive, "Officer not active");
        
        officers[officerId].isActive = false;
        _revokeRole(OFFICER_ROLE, officerId);
        
        emit OfficerDeactivated(officerId, msg.sender);
    }
    
    /**
     * @dev Check if an officer is active
     * @param officerId The Ethereum address of the officer
     * @return bool True if the officer is active, false otherwise
     */
    function isOfficerActive(address officerId) public view returns (bool) {
        return officers[officerId].isActive && hasRole(OFFICER_ROLE, officerId);
    }
    
    // ============================================================================
    // VIOLATION MANAGEMENT FUNCTIONS
    // ============================================================================
    
    /**
     * @dev Log a new traffic violation with enhanced validation and rate limiting
     * @param vehicleId The license plate of the vehicle
     * @param offenseCode The code of the offense
     * @param evidenceHash The IPFS hash of the evidence
     * @param driverId The Ethereum address of the driver
     * @return violationId The unique identifier of the violation
     */
    function logViolation(
        string memory vehicleId,
        uint32 offenseCode,
        string memory evidenceHash,
        address driverId
    ) 
        public 
        onlyRole(OFFICER_ROLE)
        rateLimited
        validString(vehicleId, MAX_VEHICLE_ID_LENGTH)
        validString(evidenceHash, MAX_STRING_LENGTH)
        validAddress(driverId)
        whenNotPaused
        returns (bytes32) 
    {
        require(offenses[offenseCode].isActive, "Invalid or inactive offense code");
        
        // Update rate limiting
        uint256 today = block.timestamp / 1 days;
        if (officers[msg.sender].lastViolationDate != today) {
            officers[msg.sender].dailyViolationCount = 0;
            officers[msg.sender].lastViolationDate = today;
        }
        officers[msg.sender].dailyViolationCount++;
        
        // Calculate fine amount in wei
        uint256 fineAmount = offenses[offenseCode].fineAmountKES * KES_TO_WEI_RATE;
        
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
            fineAmount: fineAmount,
            status: ViolationStatus.Unpaid,
            driverId: driverId,
            paidAmount: 0,
            paidBy: address(0)
        });
        
        vehicleViolations[vehicleId].push(violationId);
        totalViolations++;
        
        emit ViolationLogged(violationId, vehicleId, offenseCode, fineAmount, msg.sender);
        
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
     * @dev Get all violations for a specific vehicle with pagination
     * @param vehicleId The license plate of the vehicle
     * @param offset The starting index
     * @param limit The maximum number of violations to return
     * @return Array of violation IDs
     */
    function getVehicleViolations(string memory vehicleId, uint256 offset, uint256 limit)
        public
        view
        returns (bytes32[] memory)
    {
        bytes32[] memory allViolations = vehicleViolations[vehicleId];
        
        if (offset >= allViolations.length) {
            return new bytes32[](0);
        }
        
        uint256 end = offset + limit;
        if (end > allViolations.length) {
            end = allViolations.length;
        }
        
        bytes32[] memory result = new bytes32[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = allViolations[i];
        }
        
        return result;
    }
    
    // ============================================================================
    // FINE PAYMENT FUNCTIONS
    // ============================================================================
    
    /**
     * @dev Pay a fine for a violation with reentrancy protection
     * @param violationId The unique identifier of the violation
     */
    function payFine(bytes32 violationId)
        public
        payable
        nonReentrant
        violationExists(violationId)
        whenNotPaused
    {
        Violation storage violation = violations[violationId];
        
        require(violation.status == ViolationStatus.Unpaid, "Violation is not unpaid");
        require(msg.value >= violation.fineAmount, "Insufficient payment");
        
        // Update state before transfer (CEI pattern)
        violation.status = ViolationStatus.Paid;
        violation.paidAmount = violation.fineAmount;
        violation.paidBy = msg.sender;
        
        totalFinesPaid += violation.fineAmount;
        
        // Refund excess payment
        if (msg.value > violation.fineAmount) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - violation.fineAmount}("");
            require(success, "Refund transfer failed");
        }
        
        emit FinePaid(violationId, msg.sender, violation.fineAmount);
    }
    
    // ============================================================================
    // APPEAL FUNCTIONS
    // ============================================================================
    
    /**
     * @dev Submit an appeal for a violation with cooldown and limits
     * @param violationId The unique identifier of the violation
     * @param appealReason The reason for the appeal
     */
    function submitAppeal(bytes32 violationId, string memory appealReason)
        public
        violationExists(violationId)
        whenNotPaused
    {
        Violation storage violation = violations[violationId];
        Appeal storage appeal = appeals[violationId];
        
        require(
            violation.status == ViolationStatus.Unpaid || violation.status == ViolationStatus.Paid,
            "Cannot appeal this violation"
        );
        require(msg.sender == violation.driverId, "Only the driver can appeal");
        require(bytes(appealReason).length > 0, "Appeal reason cannot be empty");
        require(!appeal.resolved, "Previous appeal already resolved");
        
        // Check appeal limits
        require(appeal.appealCount < MAX_APPEALS_PER_VIOLATION, "Max appeals exceeded");
        if (appeal.appealCount > 0) {
            require(
                block.timestamp >= appeal.lastAppealTime + APPEAL_COOLDOWN,
                "Appeal cooldown active"
            );
        }
        
        violation.status = ViolationStatus.Appealed;
        
        // Update appeal struct
        appeal.violationId = violationId;
        appeal.appellant = msg.sender;
        appeal.appealReason = appealReason;
        appeal.appealTime = block.timestamp;
        appeal.resolved = false;
        appeal.approved = false;
        appeal.resolution = "";
        appeal.appealCount++;
        appeal.lastAppealTime = block.timestamp;
        
        emit AppealSubmitted(violationId, msg.sender, appealReason);
    }
    
    /**
     * @dev Resolve an appeal with automatic refund processing
     * @param violationId The unique identifier of the violation
     * @param approve Whether to approve the appeal (waive fine)
     * @param resolution Notes from the judge
     */
    function resolveAppeal(
        bytes32 violationId,
        bool approve,
        string memory resolution
    ) 
        public 
        onlyRole(JUDGE_ROLE) 
        violationExists(violationId)
        whenNotPaused
    {
        require(violations[violationId].status == ViolationStatus.Appealed, "No pending appeal");
        require(!appeals[violationId].resolved, "Appeal already resolved");
        
        Appeal storage appeal = appeals[violationId];
        Violation storage violation = violations[violationId];
        
        appeal.resolved = true;
        appeal.approved = approve;
        appeal.resolution = resolution;
        appeal.resolvedBy = msg.sender;
        
        if (approve) {
            if (violation.paidAmount > 0) {
                // If fine was paid, mark for refund
                violation.status = ViolationStatus.Refunded;
                pendingRefunds[violation.paidBy] += violation.paidAmount;
                totalFinesRefunded += violation.paidAmount;
                emit FineRefunded(violationId, violation.paidBy, violation.paidAmount);
            } else {
                violation.status = ViolationStatus.Waived;
            }
        } else {
            if (violation.paidAmount > 0) {
                violation.status = ViolationStatus.Paid;
            } else {
                violation.status = ViolationStatus.Rejected; // Back to unpaid effectively, but marked as rejected appeal
            }
        }
        
        emit AppealResolved(violationId, approve, resolution, msg.sender);
    }
    
    /**
     * @dev Claim pending refunds (Pull payment pattern)
     */
    function claimRefund() public nonReentrant whenNotPaused {
        uint256 amount = pendingRefunds[msg.sender];
        require(amount > 0, "No pending refunds");
        
        pendingRefunds[msg.sender] = 0;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit RefundClaimed(msg.sender, amount);
    }
    
    // ============================================================================
    // ADMIN & TREASURY FUNCTIONS
    // ============================================================================
    
    /**
     * @dev Update offense details
     * @param offenseCode The code of the offense
     * @param fineAmountKES The new fine amount in KES
     * @param name The new name of the offense
     * @param isActive Whether the offense is active
     */
    function updateOffense(
        uint32 offenseCode,
        uint256 fineAmountKES,
        string memory name,
        bool isActive
    ) public onlyRole(ADMIN_ROLE) {
        offenses[offenseCode] = Offense({
            fineAmountKES: fineAmountKES,
            name: name,
            isActive: isActive
        });
        
        emit OffenseUpdated(offenseCode, fineAmountKES, name);
    }
    
    /**
     * @dev Withdraw funds from the contract
     * @param recipient The address to receive the funds
     * @param amount The amount to withdraw
     */
    function withdrawFunds(address recipient, uint256 amount) 
        public 
        onlyRole(TREASURY_ROLE) 
        nonReentrant
    {
        require(amount <= address(this).balance, "Insufficient contract balance");
        require(recipient != address(0), "Invalid recipient");
        
        (bool success, ) = payable(recipient).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit FundsWithdrawn(msg.sender, recipient, amount);
    }
    
    /**
     * @dev Pause the contract in case of emergency
     */
    function pause() public onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() public onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Authorize contract upgrade (UUPS pattern)
     * @param newImplementation The address of the new implementation
     */
    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyRole(UPGRADER_ROLE) 
    {
        version++;
        emit ContractUpgraded(version);
    }
    
    // ============================================================================
    // FALLBACK FUNCTIONS
    // ============================================================================
    
    receive() external payable {}
    
    fallback() external payable {}
}
