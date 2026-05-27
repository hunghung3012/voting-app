import web3 from './web3';
import ElectionFactory from './Build/ElectionFact.json';

const instance = new web3.eth.Contract(
	JSON.parse(ElectionFactory.interface),
    '0x18D1208550336D6bb1A2d781Aa1Ca20D028c4709'
);

export default instance;