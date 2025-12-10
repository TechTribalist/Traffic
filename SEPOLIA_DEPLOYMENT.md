# Sepolia Testnet Deployment Guide

## Prerequisites

Before deploying to Sepolia, you need:

1. **Sepolia ETH** - Get test ETH from faucets:
   - https://sepoliafaucet.com/
   - https://sepolia-faucet.pk910.de/
   - https://faucets.chain.link/sepolia

2. **RPC Provider** - Choose one:
   - **Infura**: Sign up at https://infura.io/
   - **Alchemy**: Sign up at https://www.alchemy.com/

3. **Etherscan API Key** (optional, for verification):
   - Sign up at https://etherscan.io/
   - Get API key from https://etherscan.io/myapikey

## Setup Steps

### 1. Configure Environment Variables

Edit the `.env` file with your credentials:

```env
# Choose one RPC provider:
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
# OR
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# Your wallet private key (WITHOUT 0x prefix)
SEPOLIA_PRIVATE_KEY=your_private_key_here

# Optional: For contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key
```

⚠️ **Security Warning**: 
- Never commit `.env` file to Git
- Keep your private key secure
- Use a dedicated testnet wallet, not your mainnet wallet

### 2. Check Your Balance

```bash
npx hardhat run scripts/check-balance.js --network sepolia
```

Make sure you have at least 0.1 Sepolia ETH for deployment.

### 3. Deploy the Contract

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

This will:
- Deploy TrafficEnforcementV2 as an upgradeable proxy
- Save deployment addresses to `deployments/sepolia.json`
- Attempt to verify on Etherscan (if API key provided)

### 4. Update Frontend Configuration

After deployment, update these files:

1. **`.env.production`**:
```env
VITE_CONTRACT_ADDRESS=YOUR_NEW_PROXY_ADDRESS
VITE_DEVELOPMENT_MODE=false
```

2. **`client/src/data/contract-data.json`**:
```json
{
  "address": "YOUR_NEW_PROXY_ADDRESS",
  "network": "sepolia",
  "chainId": 11155111,
  "implementation": "YOUR_IMPLEMENTATION_ADDRESS"
}
```

### 5. Test the Deployment

1. Check on Etherscan:
   - Go to: https://sepolia.etherscan.io/address/YOUR_PROXY_ADDRESS
   - Verify contract is deployed

2. Test with Frontend:
   - Switch MetaMask to Sepolia network
   - Connect wallet with deployment account
   - Test role assignments and functions

## Contract Interaction Scripts

### Check Roles
```bash
npx hardhat run scripts/check-roles.js --network sepolia
```

### Grant Admin Role
```bash
npx hardhat run scripts/grant-admin.js --network sepolia
```

## Troubleshooting

### "Insufficient funds" error
- Get more Sepolia ETH from faucets
- Check your wallet balance

### "Network error" 
- Verify RPC URL is correct
- Check internet connection
- Try alternative RPC provider

### "Invalid private key"
- Ensure private key is 64 characters (without 0x)
- Check for spaces or special characters

### Verification fails
- Wait 1-2 minutes after deployment
- Manually verify: `npx hardhat verify --network sepolia CONTRACT_ADDRESS`

## Next Steps

After successful deployment:

1. **Test all functions** on Sepolia
2. **Document the deployment** in your project README
3. **Update Vercel deployment** with new contract address
4. **Switch app to production mode** when ready

## Useful Links

- Sepolia Explorer: https://sepolia.etherscan.io/
- Sepolia Faucets: https://sepoliafaucet.com/
- MetaMask Setup: https://support.metamask.io/hc/en-us/articles/360059213492
- Hardhat Documentation: https://hardhat.org/tutorial/deploying-to-a-live-network