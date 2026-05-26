import web3 from './web3';
import ElectionFactory from './Build/ElectionFact.json';

const instance = new web3.eth.Contract(
	JSON.parse(ElectionFactory.interface),
    '0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab'
);

export default instance;