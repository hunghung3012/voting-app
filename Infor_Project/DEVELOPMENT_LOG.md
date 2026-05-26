# Development Log

## 2026-05-26 — Initial Setup
- **Cloned from:** https://github.com/mehtaAnsh/BlockChainVoting
- **Node version used:** v22.14.0
- **Issues encountered during setup:**
  1. `bcrypt` native module compilation failed on Windows due to missing Visual Studio C++ Build Tools.
  2. `sha3` and `secp256k1` (Web3 dependencies) also failed native compilation.
- **Fixes applied:**
  1. Replaced `bcrypt` with `bcryptjs` (pure JS) across `package.json`, models, and controllers.
  2. Ran `npm install --legacy-peer-deps --ignore-scripts` to bypass native module builds.
- **App status:** Dependencies installed successfully. Waiting for MongoDB and Ganache to start the app.
