# Tech Stack — BlockChainVoting

All versions are taken from the actual `package.json` unless noted otherwise.

## Blockchain Layer

| Technology | Version | Purpose |
|---|---|---|
| **Solidity** | ^0.4.25 (from pragma) | Smart contract language for Election and ElectionFact contracts |
| **Truffle** | (global install) | Compile, migrate, and test smart contracts (not used in code — project uses custom `compile.js`) |
| **Ganache** | (global install, `ganache-cli` ^6.4.1 in deps) | Local Ethereum blockchain simulator for development/testing |
| **Web3.js** | ^1.0.0-beta.52 | JavaScript library to interact with Ethereum blockchain from browser and server |
| **truffle-hdwallet-provider** | ^1.0.5 | HD Wallet provider for deploying contracts to testnets (used in `deploy.js` for Rinkeby) |
| **solc** | ^0.4.25 | Solidity compiler used by custom `compile.js` script |

## Backend

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | v11.14.0 (PINNED) | Server runtime — older version required for native module compatibility |
| **Express.js** | ^4.16.4 | HTTP server framework, handles API routes |
| **Next.js** | ^8.0.3 | Server-side rendering framework, integrated as Express middleware |
| **MongoDB** | (external) | Stores company accounts and voter accounts |
| **Mongoose** | ^5.5.1 | MongoDB ODM for schema definition and queries |
| **Nodemailer** | ^6.1.0 | Sends email notifications (voter credentials, election results) via Gmail SMTP |
| **bcrypt** | ^3.0.6 | Password hashing for company and voter accounts |
| **body-parser** | ^1.18.3 | Parse incoming request bodies (JSON and URL-encoded) |
| **dotenv** | ^8.2.0 | Load environment variables from `.env` file |
| **fs-extra** | ^7.0.1 | Extended file system operations (used in contract compilation) |
| **path** | ^0.12.7 | File path utilities |

## Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | ^16.8.5 | UI component library |
| **React DOM** | ^16.8.5 | React DOM rendering |
| **Semantic UI React** | ^0.86.0 | UI component library for forms, buttons, grids, modals |
| **Semantic UI CSS** | ^2.4.1 | CSS styles for Semantic UI (also loaded via CDN) |
| **@zeit/next-css** | ^1.0.1 | CSS import support for Next.js (legacy) |
| **next-routes** | ^1.4.2 | Dynamic route definitions for Next.js |
| **js-cookie** | ^2.2.0 | Client-side cookie management for session state |
| **react-helmet** | ^5.2.0 | Manage document head (page titles, favicons) |
| **Chart.js** | ^2.8.0 | Bar chart visualization for vote counts on dashboard |
| **react-chartjs-2** | ^2.7.6 | React wrapper for Chart.js |
| **chartjs-plugin-annotation** | ^0.5.7 | Chart.js annotation plugin |
| **prop-types** | (peer dep) | React prop type checking |

## File Storage

| Technology | Version | Purpose |
|---|---|---|
| **ipfs-api** | ^26.1.2 | IPFS client to upload candidate images to decentralized storage (via Infura) |

## Dev Dependencies

| Technology | Version | Purpose |
|---|---|---|
| **mocha** | ^6.1.4 | Test framework (test script defined but no tests present) |

## Why Each Technology Was Chosen

- **Solidity + Ethereum**: Core blockchain requirement for immutable vote recording
- **Next.js**: SSR support for SEO and faster initial page loads
- **Express.js**: Needed for API routes (voter/company CRUD) alongside Next.js
- **MongoDB**: Stores mutable user data that doesn't belong on-chain (accounts, credentials)
- **Semantic UI React**: Rapid UI development with pre-built, styled components
- **Nodemailer**: Automated email notifications are a key feature (voter onboarding, results)
- **IPFS**: Decentralized image storage aligns with the blockchain philosophy
- **bcrypt**: Industry-standard password hashing
- **Chart.js**: Simple, effective data visualization for election results
