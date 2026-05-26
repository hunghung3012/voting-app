/**
 * Deploy script using ethers.js v4 (compatible with Node v22)
 * Deploys ElectionFact factory contract to local Ganache at port 8545
 */
const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

const eF = JSON.parse(fs.readFileSync(path.join(__dirname, 'Build/ElectionFact.json'), 'utf8'));

// Ganache deterministic account 0 private key
const PRIVATE_KEY = '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d';
const GANACHE_URL  = 'http://127.0.0.1:8545';
const GANACHE_NETWORK = { chainId: 1337, name: 'ganache' };

async function deploy() {
    const provider = new ethers.providers.JsonRpcProvider(GANACHE_URL, GANACHE_NETWORK);
    const wallet   = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log('Deploying from account:', wallet.address);

    const factory  = new ethers.ContractFactory(
        JSON.parse(eF.interface),
        eF.bytecode,
        wallet
    );

    const contract = await factory.deploy({ gasLimit: 3000000 });
    await contract.deployed();

    console.log('Contract deployed to:', contract.address);

    // Auto-update election_factory.js with new address
    const factoryFile = path.join(__dirname, 'election_factory.js');
    let content = fs.readFileSync(factoryFile, 'utf8');
    content = content.replace(
        /'0x[0-9a-fA-F]{40}'/,
        `'${contract.address}'`
    );
    fs.writeFileSync(factoryFile, content, 'utf8');
    console.log('Updated election_factory.js with new address:', contract.address);
}

deploy().catch(err => {
    console.error('Deploy failed:', err.message || err);
    process.exit(1);
});
