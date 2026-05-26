# Setup Guide — BlockChainVoting

This guide helps you set up the project locally for development and testing.

## Prerequisites
- **OS**: Windows 10/11 (or macOS/Linux)
- **Node.js**: v11.14.0 or v22+ (using `--ignore-scripts`)
- **MongoDB Community Server**: Running locally on port 27017
- **Ganache**: `npm install -g ganache`
- **Truffle**: `npm install -g truffle` (optional, for compiling)
- **MetaMask**: Browser extension installed and configured

## Step-by-Step Setup

### 1. Clone the Repository
```bash
git clone https://github.com/mehtaAnsh/BlockChainVoting.git
cd BlockChainVoting
```

### 2. Environment Variables
Create a `.env` file in the root directory (DO NOT commit this file):
```
EMAIL=your_gmail@gmail.com
PASSWORD=your_gmail_app_password
```
*Note: Use a Gmail App Password, not your regular Gmail password. If you don't care about email notifications, any placeholder values will work, and the rest of the app will still function.*

### 3. Install Dependencies
```bash
# If using Node v22+ on Windows, you must use --ignore-scripts to skip native module builds
npm install --legacy-peer-deps --ignore-scripts

# If using Node v11, you may need windows-build-tools for native modules
# npm install --legacy-peer-deps
```

*Note: The `bcrypt` dependency has been replaced with `bcryptjs` to avoid Windows build issues.*

### 4. Start Services (Requires 3 Terminals)

**Terminal 1: Start MongoDB**
```powershell
# Create data directory if it doesn't exist
mkdir C:\data\db
# Start MongoDB service
mongod --dbpath C:\data\db
```

**Terminal 2: Start Local Blockchain (Ganache)**
```powershell
# Start Ganache with deterministic accounts and network ID 5777
ganache --port 8545 --networkId 5777 --deterministic
```
*Keep this terminal open. You will need the Private Keys printed here to import into MetaMask.*

**Terminal 3: Deploy Contract & Start Server**
```powershell
# 1. Compile the smart contracts
node ./Ethereum/compile.js

# 2. Deploy ElectionFact contract
# NOTE: You MUST update Ethereum/deploy.js to use localhost provider instead of Rinkeby Infura
# AND update Ethereum/election_factory.js with the new deployed address!

# 3. Start the Next.js app
npm start
```

### 5. MetaMask Configuration
1. Open MetaMask extension.
2. Add a new network:
   - Network Name: Ganache Local
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: 1337 (or 5777)
   - Currency Symbol: ETH
3. Import an account using a Private Key from your Ganache terminal output.

### 6. Post-Setup Test Checklist
- [ ] Visit `http://localhost:3000`
- [ ] Click "Company" and sign up a new company account
- [ ] Company login successful
- [ ] Create election (ensure MetaMask prompts to sign transaction)
- [ ] Add candidate (IPFS image upload must succeed)
- [ ] Add voter (check server console or email for credentials)
- [ ] Log out, then log in as Voter
- [ ] Vote for candidate (MetaMask signs transaction)
- [ ] Log back in as Company and End Election
- [ ] Results email sent successfully
