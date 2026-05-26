const assert = require('assert');
const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const eF = require('./Build/ElectionFact.json');

const provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545');
const web3 = new Web3(provider);

const deploy = async () => {
	const accounts = await web3.eth.getAccounts();

	console.log('Attemping to deploy from account', accounts[0]);

	const result = await new web3.eth.Contract(JSON.parse(eF.interface))
		.deploy({ data: '0x' + eF.bytecode })
		.send({ gas: '3000000', from: accounts[0] });

	console.log('Contract deployed to: ', result.options.address);
};
deploy();
