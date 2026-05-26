import Web3 from 'web3';

let web3;

if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
	// Modern MetaMask — uses window.ethereum
	window.ethereum.request({ method: 'eth_requestAccounts' });
	web3 = new Web3(window.ethereum);
} else if (typeof window !== 'undefined' && typeof window.web3 !== 'undefined') {
	// Legacy MetaMask
	web3 = new Web3(window.web3.currentProvider);
} else {
	// No MetaMask — fallback to Ganache directly (for server-side)
	const provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545');
	web3 = new Web3(provider);
}

export default web3;
