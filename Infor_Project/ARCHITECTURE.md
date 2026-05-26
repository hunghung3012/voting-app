# Architecture — BlockChainVoting

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                              │
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │  Next.js     │    │  MetaMask    │    │  js-cookie           │   │
│  │  Pages       │    │  Extension   │    │  (session state)     │   │
│  │  (React UI)  │    │  (Web3 sign) │    │                      │   │
│  └──────┬───────┘    └──────┬───────┘    └──────────────────────┘   │
│         │                   │                                        │
└─────────┼───────────────────┼────────────────────────────────────────┘
          │ HTTP/XHR          │ RPC (JSON-RPC)
          │                   │
┌─────────▼───────────────────▼────────────────────────────────────────┐
│                     SERVER (Node.js + Express)                       │
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │  Express     │    │  Next.js     │    │  Nodemailer          │   │
│  │  API Routes  │    │  SSR Engine  │    │  (Gmail SMTP)        │   │
│  │  /company/*  │    │  Page render │    │                      │   │
│  │  /voter/*    │    │              │    │                      │   │
│  │  /candidate/*│    │              │    │                      │   │
│  └──────┬───────┘    └──────────────┘    └──────────────────────┘   │
│         │                                                            │
└─────────┼────────────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────┐          ┌──────────────────────────────────────┐
│   MongoDB        │          │   Ethereum Blockchain (Ganache)      │
│   localhost:27017│          │   localhost:8545                      │
│                  │          │                                      │
│  ┌────────────┐  │          │  ┌──────────────┐  ┌─────────────┐  │
│  │ companies  │  │          │  │ ElectionFact │  │  Election    │  │
│  │ collection │  │          │  │ (factory)    │──▶│ (per-org)   │  │
│  ├────────────┤  │          │  │              │  │              │  │
│  │ voters     │  │          │  │ createElec() │  │ addCandidate │  │
│  │ collection │  │          │  │ getDeploy()  │  │ vote()       │  │
│  └────────────┘  │          │  └──────────────┘  │ getCandidate │  │
│                  │          │                    │ winnerCand() │  │
└──────────────────┘          │                    └─────────────┘  │
                              └──────────────────────────────────────┘

                              ┌──────────────────────────────────────┐
                              │   IPFS Network                       │
                              │   (via ipfs.infura.io:5001)          │
                              │                                      │
                              │   Stores: Candidate profile images   │
                              │   Returns: Content hash (imgHash)    │
                              └──────────────────────────────────────┘
```

## User Types & Authentication Flow

### Company (Election Admin)

```
Company Registration/Login:
┌──────────┐   POST /company/register    ┌──────────┐
│  Browser │ ──────────────────────────► │  Express │
│  Form    │   {email, password}         │  Route   │
└──────────┘                             └────┬─────┘
                                              │
                                              ▼
                                        ┌──────────┐
                                        │  MongoDB  │
                                        │ bcrypt    │
                                        │ hash+save │
                                        └──────────┘
                                              │
Company Login → check password with bcrypt ───┘
             → set cookies (company_email, company_id)
             → call ElectionFact.getDeployedElection(email) via Web3
             → if no election: redirect to /election/create_election
             → if election exists: redirect to /election/{address}/company_dashboard
```

### Voter

```
Voter Creation (by Company):
┌──────────┐  POST /voter/register       ┌──────────┐   ┌──────────┐
│ Company  │ ──────────────────────────► │  Express │──►│  MongoDB │
│ Dashboard│  {email, election_address}  │  Route   │   │  (save)  │
└──────────┘                             └────┬─────┘   └──────────┘
                                              │
                                              ▼
                                        ┌──────────┐
                                        │Nodemailer│
                                        │ send     │
                                        │ creds    │
                                        └──────────┘
Note: voter password = voter email (then bcrypt hashed)

Voter Login:
┌──────────┐  POST /voter/authenticate   ┌──────────┐
│  Browser │ ──────────────────────────► │  Express │
│  Form    │  {email, password}          │  Route   │
└──────────┘                             └────┬─────┘
                                              │
                                              ▼
                                        Query MongoDB by {email, password}
                                        (NOTE: compares hashed password directly
                                         — this is a BUG, see KNOWN_ISSUES.md)
                                              │
                                              ▼
                                        Set cookies → redirect to /election/{address}/vote
```

### Voting Process

```
Vote Cast:
┌──────────┐    Web3.js call             ┌──────────────┐
│  Voter   │ ──────────────────────────► │  MetaMask    │
│  clicks  │    election.methods.vote()  │  (sign tx)   │
│  "Vote!" │                             └──────┬───────┘
└──────────┘                                    │
                                                ▼
                                          ┌──────────────┐
                                          │  Ganache     │
                                          │  Election.sol│
                                          │  vote()      │
                                          │  - check !voted
                                          │  - record vote
                                          │  - increment count
                                          └──────────────┘
```

## Important Architecture Notes

1. **Dual Authentication Model**: Authentication is split:
   - **Traditional web auth** (MongoDB + cookies) for login/registration
   - **MetaMask** only for signing blockchain transactions (not for login)
   - These two layers are independent — a user can be logged into the web app
     without MetaMask, but cannot vote without it

2. **Server Integration**: Express and Next.js run in the same process:
   - Express handles API routes (`/company/*`, `/voter/*`, `/candidate/*`)
   - Next.js handles page rendering (SSR for all pages under `/pages`)
   - Express is the outer shell, Next.js is mounted as middleware via `routes.js`

3. **Smart Contract Factory Pattern**: `ElectionFact` is deployed once and creates
   new `Election` contracts for each company. This means:
   - One `ElectionFact` address is hardcoded in `election_factory.js`
   - Each company gets a unique `Election` contract address
   - The factory maps company emails to their election contract addresses

4. **No Session Middleware**: The app does NOT use `express-session`. All session
   state is managed client-side via `js-cookie`. This means:
   - Server has no concept of "logged in" users
   - API endpoints are unprotected (no auth middleware)
   - Anyone who knows the API structure can call endpoints directly
