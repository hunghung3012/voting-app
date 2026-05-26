import React, { Component } from 'react';
import { Button, Form, Grid, Header, Segment, Icon, Message } from 'semantic-ui-react';
import { Router } from '../../routes';
import Cookies from 'js-cookie';

const FACTORY_ADDRESS = '0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab';
const FACTORY_ABI = [
    {"constant":false,"inputs":[{"internalType":"string","name":"email","type":"string"},{"internalType":"string","name":"election_name","type":"string"},{"internalType":"string","name":"election_description","type":"string"}],"name":"createElection","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},
    {"constant":true,"inputs":[{"internalType":"string","name":"email","type":"string"}],"name":"getDeployedElection","outputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"}
];

// Encode function call data using minimal ABI encoder
function encodeFunctionCall(abiEntry, params) {
    // Use ethers if available, else fallback
    if (typeof window !== 'undefined' && window.ethers) {
        const iface = new window.ethers.utils.Interface([abiEntry]);
        return iface.encodeFunctionData(abiEntry.name, params);
    }
    return null;
}

// Get AbiCoder instance
function getAbi() {
    const { AbiCoder } = require('web3-eth-abi');
    return new AbiCoder();
}

function encodeCreateElection(email, name, desc) {
    return getAbi().encodeFunctionCall(
        {"name":"createElection","type":"function","inputs":[{"type":"string","name":"email"},{"type":"string","name":"election_name"},{"type":"string","name":"election_description"}]},
        [email, name, desc]
    );
}

function encodeGetDeployedElection(email) {
    return getAbi().encodeFunctionCall(
        {"name":"getDeployedElection","type":"function","inputs":[{"type":"string","name":"email"}]},
        [email]
    );
}

function decodeGetDeployedElectionResult(hex) {
    // eth_call returns full hex including 4-byte selector — strip it for decoding
    const data = hex.startsWith('0x') ? hex.slice(2) : hex;
    const result = getAbi().decodeParameters(
        [{"type":"address"},{"type":"string"},{"type":"string"}],
        '0x' + data
    );
    return [result[0], result[1], result[2]];
}

class LoginForm extends Component {
    state = {
        election_name: '',
        election_description: '',
        loading: false,
        errorMess: '',
        statusMsg: '',
    };

    signin = async event => {
        event.preventDefault();
        this.setState({ loading: true, errorMess: '', statusMsg: 'Connecting to MetaMask...' });
        try {
            const email = decodeURIComponent(Cookies.get('company_email') || '');
            if (!email) throw new Error('Not logged in. Please login first.');

            // Request MetaMask accounts
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const from = accounts[0];

            this.setState({ statusMsg: 'Sending transaction to blockchain...' });

            // Encode createElection call
            const data = encodeCreateElection(email, this.state.election_name, this.state.election_description);

            // Send transaction via MetaMask directly — bypasses Web3 beta bugs
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: from,
                    to: FACTORY_ADDRESS,
                    data: data,
                    gas: '0x2DC6C0', // 3000000
                }],
            });

            this.setState({ statusMsg: `Transaction sent! Hash: ${txHash.slice(0,16)}... Waiting for confirmation...` });

            // Poll for receipt
            let receipt = null;
            let attempts = 0;
            while (!receipt && attempts < 60) {
                await new Promise(r => setTimeout(r, 2000));
                receipt = await window.ethereum.request({
                    method: 'eth_getTransactionReceipt',
                    params: [txHash],
                });
                attempts++;
            }

            if (!receipt) throw new Error('Transaction not confirmed after 2 minutes.');

            this.setState({ statusMsg: 'Transaction confirmed! Loading dashboard...' });

            // Call getDeployedElection
            const callData = encodeGetDeployedElection(email);
            const callResult = await window.ethereum.request({
                method: 'eth_call',
                params: [{ to: FACTORY_ADDRESS, data: callData }, 'latest'],
            });

            const [address, elName, elDesc] = decodeGetDeployedElectionResult(callResult);
            this.setState({ loading: false });
            Cookies.set('address', address);
            Router.pushRoute(`/election/${address}/company_dashboard`);

        } catch (err) {
            this.setState({ loading: false, errorMess: err.message || String(err), statusMsg: '' });
        }
    };

    LoginForm = () => (
        <div className="login-form">
            <style JSX>{`
                .login-form {
                    width:100%;
                    height:100%;
                    position:absolute;
                    background: url('../../static/blockchain.jpg') no-repeat;
                } 
              `}</style>

            <Grid textAlign="center" style={{ height: '100%' }} verticalAlign="middle">
                <Grid.Column style={{ maxWidth: 420 }}>
                    <Form size="large">
                        <Segment>
                            <Header as="h2" color="black" textAlign="center" style={{ marginTop: 10 }}>
                                Create an election!
                            </Header>
                            <Form.Input
                                fluid
                                iconPosition="left"
                                icon="address card outline"
                                placeholder="Election Name"
                                style={{ padding: 5 }}
                                value={this.state.election_name}
                                onChange={event => this.setState({ election_name: event.target.value })}
                                required={true}
                            />
                            <Form.TextArea
                                required={true}
                                style={{ marginBottom: '10px', minHeight: 60 }}
                                placeholder="Election Description"
                                value={this.state.election_description}
                                onChange={event => this.setState({ election_description: event.target.value })}
                            />
                            {this.state.statusMsg && (
                                <Message info>
                                    <Icon name="spinner" loading />
                                    {this.state.statusMsg}
                                </Message>
                            )}
                            {this.state.errorMess && (
                                <Message negative>
                                    <Message.Header>Error</Message.Header>
                                    <p>{this.state.errorMess}</p>
                                </Message>
                            )}
                            <Button
                                color="blue"
                                fluid
                                size="large"
                                style={{ marginBottom: 15 }}
                                onClick={this.signin}
                                loading={this.state.loading}
                                disabled={this.state.loading}
                            >
                                Submit
                            </Button>
                            <Message icon info>
                                <Icon name="exclamation circle" />
                                <Message.Header>Note: </Message.Header>
                                <Message.Content>MetaMask will popup to confirm the transaction.</Message.Content>
                            </Message>
                        </Segment>
                    </Form>
                </Grid.Column>
            </Grid>
        </div>
    );

    render() {
        return (
            <div>
                <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/semantic-ui@2.4.2/dist/semantic.min.css" />
                {this.LoginForm()}
            </div>
        );
    }
}

export default LoginForm;
