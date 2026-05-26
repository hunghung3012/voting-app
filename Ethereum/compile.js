const path = require("path");
const fs = require("fs-extra");
const solc = require("solc");

const buildPath = path.resolve(__dirname, 'Build');
fs.removeSync(buildPath);

const contractPath = path.resolve(__dirname, 'Contract', 'Election.sol');
const source = fs.readFileSync(contractPath, 'utf-8');

const input = {
    language: 'Solidity',
    sources: { 'Election.sol': { content: source } },
    settings: { outputSelection: { '*': { '*': ['*'] } } }
};

const compiled = JSON.parse(solc.compile(JSON.stringify(input)));

if (compiled.errors) {
    compiled.errors.forEach(err => console.error(err.formattedMessage));
}

const output = compiled.contracts['Election.sol'];

fs.ensureDirSync(buildPath);

for(let contract in output) {
    const formatted = {
        interface: JSON.stringify(output[contract].abi),
        bytecode: output[contract].evm.bytecode.object
    };
    fs.outputJsonSync(
        path.resolve(buildPath, contract.replace(':', '') + '.json'), 
        formatted
    );
}