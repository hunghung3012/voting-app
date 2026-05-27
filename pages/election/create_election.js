import React, { Component } from 'react';
import { Router } from '../../routes';
import Cookies from 'js-cookie';
import { Helmet } from 'react-helmet';
import ToastContainer, { showToast } from '../../components/Toast';
import '../../static/styles.css';

const FACTORY_ADDRESS = '0x48ecA5D131eA586d88D76C6970568DA602FF91AF';
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
            showToast(err.message || String(err), 'error');
        }
    };

    render() {
        return (
            <div>
                <Helmet><title>Create Election — BlockVotes</title></Helmet>
                <ToastContainer />
                <div style={{ 
                    minHeight: '100vh', 
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(30, 58, 138, 0.85)), url("../../static/blockchain.jpg") no-repeat center center',
                    backgroundSize: 'cover',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: '24px',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Decorative background nodes (optional touch for the blockchain theme) */}
                    <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
                    <div style={{ position: 'absolute', bottom: '-5%', right: '-5%', width: '200px', height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
                    
                    <div className="bv-card" style={{ maxWidth: '480px', width: '100%', padding: '40px 32px', position: 'relative', zIndex: 1 }}>
                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1E293B', marginBottom: '8px' }}>
                                Block<span style={{ color: '#2563EB' }}>Votes</span>
                            </h1>
                            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1E293B', marginBottom: '8px' }}>Create an election!</h2>
                            <p style={{ color: '#64748B', fontSize: '14px', lineHeight: '1.5' }}>
                                Khởi tạo cuộc bầu cử phi tập trung. Dữ liệu được lưu trữ an toàn trên Blockchain.
                            </p>
                        </div>
                        
                        <form onSubmit={this.signin}>
                            <div className="bv-input-group">
                                <label>Tên cuộc bầu cử (Election Name)</label>
                                <div className="bv-input-icon-wrap">
                                    <input 
                                        className="bv-input" 
                                        type="text" 
                                        required
                                        placeholder="Ví dụ: Bầu cử ban cán sự lớp..." 
                                        value={this.state.election_name}
                                        onChange={e => this.setState({ election_name: e.target.value })}
                                        style={{ paddingLeft: '14px' }}
                                    />
                                </div>
                            </div>

                            <div className="bv-input-group" style={{ marginBottom: '24px' }}>
                                <label>Mô tả chi tiết (Description)</label>
                                <textarea 
                                    className="bv-input" 
                                    required
                                    rows="4"
                                    placeholder="Nhập mô tả cho cuộc bầu cử này..." 
                                    value={this.state.election_description}
                                    onChange={e => this.setState({ election_description: e.target.value })}
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            {this.state.statusMsg && (
                                <div style={{ 
                                    background: '#eff6ff', 
                                    color: '#2563EB', 
                                    padding: '12px 16px', 
                                    borderRadius: '8px',
                                    marginBottom: '20px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}>
                                    {this.state.loading && <span className="bv-spinner bv-spinner-dark" style={{ width: '16px', height: '16px' }}></span>}
                                    {this.state.statusMsg}
                                </div>
                            )}

                            {this.state.errorMess && (
                                <div style={{ 
                                    background: '#fef2f2', 
                                    color: '#ef4444', 
                                    padding: '12px 16px', 
                                    borderRadius: '8px',
                                    marginBottom: '20px',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}>
                                    Lỗi: {this.state.errorMess}
                                </div>
                            )}

                            <button 
                                type="submit"
                                className="bv-btn bv-btn-primary bv-btn-lg bv-btn-full" 
                                disabled={this.state.loading}
                            >
                                {this.state.loading ? <span className="bv-spinner"></span> : 'Submit Transaction'}
                            </button>
                        </form>

                        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                <span style={{ width: '18px', height: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#f1f5f9', color: '#64748B', fontSize: '12px', fontWeight: 'bold' }}>!</span>
                                <i>Lưu ý: MetaMask sẽ hiện popup xác nhận.</i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default LoginForm;
