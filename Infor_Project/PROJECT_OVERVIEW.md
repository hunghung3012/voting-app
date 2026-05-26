# Project Overview — BlockChainVoting (BlockVotes)

## Project Name
**BlockChainVoting** (branded as **BlockVotes** in the UI)

## Purpose
A blockchain-based E-voting system, created as the **final year project** of **Shri Bhagubhai Mafatlal Polytechnic** by **Ansh Mehta**, with teammates **Sayyam Gada** and **Charmee Mehta**.

## Problem Statement
Replace traditional voting systems with a decentralized, tamper-proof, and transparent blockchain-based electronic voting solution. The system aims to ensure:
- Vote immutability (cannot be altered once cast)
- Prevention of double-voting
- Transparency of results
- Privacy of voter identity

## Key Features (verified from actual code)

1. **Company Registration & Authentication**
   - Company (election organizer) registers with email/password
   - Credentials stored in MongoDB with bcrypt password hashing
   - Session managed via browser cookies (`js-cookie`)

2. **Election Creation**
   - Authenticated company creates an election via `ElectionFact` smart contract factory
   - Each election deploys a new `Election` contract on the blockchain
   - Election has name and description

3. **Candidate Management**
   - Company adds candidates with name, description, email, and photo
   - Candidate photos uploaded to **IPFS** (via Infura gateway)
   - IPFS hash stored in the smart contract
   - Candidate receives email notification via Nodemailer

4. **Voter Management**
   - Company adds voters by email
   - System auto-generates credentials (password = email, then hashed)
   - Voter receives login credentials via email (Nodemailer)
   - Voters can be edited (email changed) or deleted by admin

5. **Voting Process**
   - Voter logs in with email/password (traditional web auth, NOT MetaMask login)
   - Voter sees candidate list with photos from IPFS
   - Vote is recorded on the Ethereum smart contract via Web3.js + MetaMask
   - Smart contract prevents double-voting per voter email

6. **Results & Dashboard**
   - Company dashboard shows real-time vote counts via bar chart (Chart.js)
   - Displays number of voters, candidates, and total votes
   - "End Election" button determines winner and emails results to all voters + winning candidate

## Current Status
- **Proof-of-concept / Academic project** — NOT production-ready
- Originally deployed to Rinkeby testnet (now deprecated since 2022)
- Only works with local Ganache blockchain
- License: MIT

## Known Limitations
- Requires Node.js v11.14.0 (older runtime)
- IPFS gateway (`ipfs.infura.io`) may no longer be freely accessible
- No automatic election end date
- No voter self-registration
- Session management via cookies only (no JWT, no express-session)
- Email credentials sent in plaintext
