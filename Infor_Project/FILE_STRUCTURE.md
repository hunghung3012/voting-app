# File Structure — BlockChainVoting

```
BlockChainVoting/
├── server.js              — Express entry point, mounts routes + Next.js on port 3000
├── routes.js              — next-routes definitions (URL → page mapping)
├── ipfs.js                — IPFS client config (Infura gateway)
├── next.config.js         — Next.js config (@zeit/next-css)
├── package.json           — Dependencies and npm scripts
├── .env                   — EMAIL, PASSWORD secrets (not committed)
│
├── Ethereum/
│   ├── Contract/
│   │   └── Election.sol   — Solidity: ElectionFact (factory) + Election contracts
│   ├── Build/
│   │   ├── Election.json  — Compiled Election ABI + bytecode
│   │   └── ElectionFact.json — Compiled ElectionFact ABI + bytecode
│   ├── compile.js         — Custom solc compiler script
│   ├── deploy.js          — Rinkeby deployment script (deprecated)
│   ├── web3.js            — Web3 provider (MetaMask or fallback)
│   ├── election.js        — Election contract instance factory
│   └── election_factory.js — ElectionFact instance (HARDCODED address)
│
├── config/
│   └── database.js        — MongoDB connection: localhost:27017/BlockVotes
│
├── models/
│   ├── company.js         — CompanyList schema: {email, password}
│   └── voter.js           — VoterList schema: {email, password, election_address}
│
├── controllers/
│   ├── company.js         — create, authenticate
│   ├── voter.js           — create, authenticate, getAll, updateById, deleteById, resultMail
│   └── candidate.js       — register (sends email notification)
│
├── routes/
│   ├── company.js         — POST /register, POST /authenticate
│   ├── voter.js           — POST /register, POST /authenticate, POST /, PUT /:voterId, DELETE /:voterId, POST /resultMail
│   └── candidate.js       — POST /registerCandidate
│
├── pages/
│   ├── homepage.js        — Landing page with Company/Voter buttons
│   ├── company_login.js   — Company sign-in / sign-up form
│   ├── voter_login.js     — Voter login form
│   └── election/
│       ├── create_election.js   — Create election form
│       ├── company_dashboard.js — Dashboard: stats + chart + end election
│       ├── candidate_list.js    — View/add candidates with IPFS image upload
│       ├── voting_list.js       — View/add/edit/delete voters
│       ├── vote.js              — Voter voting interface
│       ├── canvasjs.min.js      — Bundled chart library
│       └── canvasjs.react.js    — React wrapper for CanvasJS
│
├── components/
│   ├── Header.js          — Navigation bar (BlockVotes + user email)
│   └── Layout.js          — Page wrapper (Semantic UI Container + Header)
│
├── static/                — Images, CSS, icons
│   ├── blockchain.jpg     — Login background
│   ├── ether2.png         — Homepage Ethereum icon
│   ├── logo3.png          — Favicon
│   ├── hometest.css       — Homepage styles
│   ├── test.css           — General styles
│   └── ...                — Other assets
│
└── screenshots/           — README screenshots
```

## Models (Mongoose Schemas)

### models/company.js — Collection: `companylists`
| Field | Type | Required | Notes |
|---|---|---|---|
| email | String | Yes | Company email |
| password | String | Yes | bcrypt hashed (salt=10), hashed in pre-save hook |

### models/voter.js — Collection: `voterlists`
| Field | Type | Required | Notes |
|---|---|---|---|
| email | String | Yes | Voter email |
| password | String | Yes | bcrypt hashed, initial value = email |
| election_address | String | Yes | Ethereum Election contract address |
