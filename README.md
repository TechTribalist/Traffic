# Traffic Enforcement Blockchain System

A decentralized traffic enforcement system built on Ethereum blockchain with a modern React frontend. This system enables transparent, immutable, and efficient management of traffic violations, fines, and appeals.

## 🚀 Features

### Smart Contract (TrafficEnforcementV2)
- **Role-Based Access Control**: 6 different roles (Admin, Officer Manager, Officer, Judge, Treasury, Upgrader)
- **Violation Management**: Log and track traffic violations on-chain
- **Fine Payment System**: Secure payment processing with automatic refunds
- **Appeals Process**: Submit and resolve appeals with judge oversight
- **Rate Limiting**: Prevent spam with daily violation limits
- **Emergency Controls**: Pausable contract for security
- **Upgrade Support**: UUPS proxy pattern for future improvements

### Frontend Application
- **Development Mode Toggle**: Switch between mock data and live blockchain
- **Role-Based UI**: Different interfaces for Officers, Judges, Admins, and Citizens
- **Real-Time Data**: Live statistics and violation tracking
- **Modern UI/UX**: Built with React, TypeScript, and Tailwind CSS
- **Web3 Integration**: MetaMask wallet connection and transaction handling

## 📋 Prerequisites

- Node.js (v18 or higher)
- pnpm (v10 or higher)
- MetaMask wallet extension
- Git

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone https://github.com/TechTribalist/Traffic.git
cd Traffic
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Run the development server**
```bash
pnpm dev
```

The application will be available at:
- Local: http://localhost:3000
- Network: http://[your-ip]:3000

## 🎮 Usage

### Development Mode (Default)
The system starts in development mode with mock data, allowing you to test all features without deploying contracts:

- Click the **floating button** (bottom-right) to toggle between Development/Live mode
- All users have full permissions in development mode
- No blockchain transactions required
- Instant responses with mock data

### Available Roles

1. **Admin**: Full system access, officer management, system settings
2. **Officer**: Report violations, view own violations
3. **Judge**: Review and resolve appeals
4. **Treasury**: Manage funds, view financial statistics
5. **Citizen**: View own violations, pay fines, submit appeals

### Key Pages

- **Dashboard** (`/`): System overview and statistics
- **Violations** (`/violations`): View and manage violations
- **Report** (`/report`): Log new violations (Officers only)
- **Appeals** (`/appeals`): Submit and resolve appeals
- **Admin Panel** (`/admin`): Officer and system management
- **Treasury** (`/treasury`): Financial management

## 🏗️ Project Structure

```
Traffic/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts (Web3, Theme, DevMode)
│   │   ├── data/          # Mock data for development
│   │   ├── pages/         # Application pages
│   │   └── services/      # Data service layer
│   └── public/            # Static assets
├── contracts/             # Solidity smart contracts
│   ├── TrafficEnforcement.sol
│   └── TrafficEnforcementV2.sol
├── artifacts/             # Compiled contract artifacts
├── server/                # Express backend (optional)
└── hardhat.config.cjs     # Hardhat configuration
```

## 📜 Smart Contract Functions

### Officer Management
- `registerOfficer(address, name, badge)` - Register new officers
- `deactivateOfficer(address)` - Deactivate officers
- `isOfficerActive(address)` - Check officer status

### Violation Management
- `logViolation(vehicleId, offenseCode, evidence, driverId)` - Log violations
- `getViolation(violationId)` - Retrieve violation details
- `getVehicleViolations(vehicleId, offset, limit)` - Get violations by vehicle

### Fine & Appeals
- `payFine(violationId)` - Pay violation fines
- `submitAppeal(violationId, reason)` - Submit appeals
- `resolveAppeal(violationId, approved, resolution)` - Resolve appeals
- `claimRefund()` - Claim refunds for waived fines

## 🔧 Development

### Running Tests
```bash
# Run Hardhat tests
npx hardhat test

# Run contract coverage
npx hardhat coverage
```

### Deploying Contracts
```bash
# Deploy to local network
npx hardhat run deploy.cjs --network localhost

# Deploy to testnet (e.g., Sepolia)
npx hardhat run deploy.cjs --network sepolia
```

### Building for Production
```bash
# Build frontend
pnpm build

# Start production server
pnpm start
```

## 🔐 Security Features

- **ReentrancyGuard**: Prevents reentrancy attacks
- **Pausable**: Emergency pause functionality
- **Role-Based Access**: Granular permission system
- **Rate Limiting**: Prevents spam and abuse
- **Input Validation**: Comprehensive validation for all inputs
- **Upgrade Security**: UUPS proxy with role restrictions

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenZeppelin for secure contract libraries
- Hardhat for Ethereum development environment
- React and Vite for modern frontend tooling
- Tailwind CSS for styling
- Shadcn/ui for UI components

## 📞 Contact

- GitHub: [@TechTribalist](https://github.com/TechTribalist)
- Project Link: [https://github.com/TechTribalist/Traffic](https://github.com/TechTribalist/Traffic)

---

**Note**: This project is currently in development. The smart contracts have not been audited and should not be used in production without proper security review.