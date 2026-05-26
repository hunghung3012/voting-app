# Known Issues — BlockChainVoting

## Compatibility Issues

### Node.js Version
- **Originally requires v11.14.0** — this is a very old, end-of-life version
- v12+ may fail due to native modules (`bcrypt`, `sha3`, `keccak`, `secp256k1`)
- **Workaround applied**: Replaced `bcrypt` with `bcryptjs` (pure JS, no native build)
- Web3.js dependencies (`sha3`, `keccak`, `secp256k1`) require native compilation — may need `--ignore-scripts` flag or Visual Studio C++ Build Tools on Windows

### bcrypt → bcryptjs
- Original: `bcrypt ^3.0.6` (native C++ module, fails on Windows without VS Build Tools)
- Fixed: `bcryptjs ^2.4.3` (pure JavaScript, drop-in replacement)
- Files changed: `models/company.js`, `models/voter.js`, `controllers/company.js`, `controllers/voter.js`

### Rinkeby Testnet Deprecated
- `Ethereum/deploy.js` and `Ethereum/web3.js` reference Rinkeby Infura endpoints
- Rinkeby testnet was deprecated in 2022
- **Solution**: Use local Ganache only. Update `web3.js` fallback to `http://127.0.0.1:8545`

### IPFS Infura Gateway
- `ipfs.js` uses `ipfs.infura.io:5001` — Infura IPFS is no longer free (requires auth since 2022)
- Candidate image upload will fail without valid Infura IPFS credentials
- **Workaround**: Use local IPFS node or a different public gateway

### ElectionFact Hardcoded Address
- `Ethereum/election_factory.js` has a hardcoded contract address: `0xF5d3574DDc21D8Bd8bcB380de232cbbc8161234e`
- This was deployed on Rinkeby — WILL NOT WORK with local Ganache
- **Must redeploy** ElectionFact to Ganache and update this address

## Security Issues (NOT production-ready)

1. **No session middleware**: App uses client-side cookies only (`js-cookie`), no `express-session`
2. **No API authentication**: All Express routes are unprotected — no auth middleware
3. **Voter credentials sent in plaintext**: Email contains raw password in HTML body
4. **No rate limiting** on login endpoints — vulnerable to brute force
5. **IPFS is public**: Anyone can view candidate images if they know the hash
6. **Hardcoded mnemonic**: `deploy.js` contains a wallet mnemonic in plaintext
7. **Hardcoded Infura API key**: Both `deploy.js` and `web3.js` expose Infura keys
8. **No HTTPS**: App runs on plain HTTP
9. **No CSRF protection**: Forms use XHR without CSRF tokens
10. **No input validation**: No sanitization on email, password, or other fields

## Bugs Found in Code

### Voter Authentication Bug (Critical)
- **File**: `controllers/voter.js`, line 95
- **Issue**: `authenticate` queries `{email: req.body.email, password: req.body.password}` — but the password in DB is bcrypt-hashed. Raw password will never match the hash.
- **Impact**: Voters cannot log in through the normal flow
- **Fix needed**: Use `bcrypt.compareSync()` like in `controllers/company.js`

### Double Response in resultMail
- **File**: `controllers/voter.js`, `resultMail` function
- **Issue**: `res.json()` is called inside a loop (for each voter) AND after the loop (for the candidate). This will cause "Cannot set headers after they are sent" error.

### Unused `status` Variable
- **File**: `Election.sol`, line 36
- **Issue**: `bool status` is set to `true` in constructor but never checked or updated. There's no actual "end election" mechanism on-chain.

### Missing `create_election` Route in routes.js
- **File**: `routes.js`
- **Issue**: No route defined for `/election/create_election`, but `company_login.js` redirects to it. The route works because Next.js has file-based routing fallback, but it's inconsistent.

### Voter Password = Email
- **File**: `controllers/voter.js`, line 23
- **Issue**: `password: req.body.email` — voter's password is set to their email address. Combined with the auth bug, this creates a confusing auth flow.

## Feature Gaps

1. No voter self-registration (admin manually adds each voter)
2. No election end date / automatic closing
3. No audit trail beyond blockchain (no logging)
4. Results only viewable by admin (no public results page)
5. No ability to reset or restart an election
6. No candidate removal/editing
7. No voter verification (no ID check, no 2FA)
8. Maximum 255 candidates and 255 voters per election (uint8)
9. No mobile-responsive design
10. No test suite (mocha configured but no test files)
