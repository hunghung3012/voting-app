# AI Onboarding Context — BlockChainVoting

## What this project is
A student final-year blockchain voting DApp. Not production-ready.
Primary goal: demonstrate blockchain concepts for academic assessment.

## Critical constraints AI must respect
1. Node.js version was originally pinned at v11.14.0, but we are running on modern Node (v22) using `--ignore-scripts` to bypass native module build errors.
2. The `bcrypt` package was replaced with `bcryptjs` for Windows compatibility.
3. The smart contract is simple by design — it's educational.
4. Email functionality is optional — app works without valid Gmail creds (but outputs errors in console).
5. This runs LOCAL ONLY — Rinkeby testnet is deprecated. The `web3.js` and `deploy.js` files must be updated to use local Ganache.

## How authentication works (common confusion point)
- Company/Voter login = traditional web session (Express + MongoDB)
- MetaMask = only used to SIGN blockchain transactions, not for login
- These are two separate auth layers that work independently. A user is "logged in" via `js-cookie`, but signs votes via MetaMask.

## File to read first when debugging
1. `server.js` — understand Express + Next.js integration
2. `config/web3.js` — Web3 provider configuration (most common bug source)
3. `Ethereum/Contract/Election.sol` — understand what the contract can/cannot do
4. `models/` — understand data structure before touching routes
5. `Ethereum/election_factory.js` — holds the hardcoded deployed factory address

## Common tasks and where to look
- "Add a new field to voter" → `models/voter.js` + `routes/voter.js` + `pages/election/voting_list.js`
- "Fix MetaMask not connecting" → `config/web3.js` or `components/Header.js`
- "Vote not recorded" → `Election.sol` + `pages/election/vote.js` + Web3 call
- "Email not sending" → `.env` credentials + `controllers/candidate.js` or `controllers/voter.js`
- "Login not working" → `routes/company.js` or `routes/voter.js` + session config

## What AI should NOT do without asking
- Change Node.js version requirement drastically
- Replace MongoDB with another DB
- Rewrite smart contract logic significantly
- Change the authentication method (e.g., to JWT or full Web3 login)
- Add external API dependencies

## Suggested improvements (safe to implement)
- Fix the voter authentication bug (comparing raw password to bcrypt hash)
- Update `web3.js` to rely on Ganache instead of Rinkeby
- Replace the hardcoded `election_factory.js` address with a dynamic one loaded from a file or env var
- Add input validation middleware
- Add loading states to voting UI
- Add election end date feature
- Add voter count display
