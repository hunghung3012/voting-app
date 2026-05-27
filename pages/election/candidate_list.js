import React, { Component } from 'react';
import Layout from '../../components/Layout';
import { showToast } from '../../components/Toast';
import Cookies from 'js-cookie';
import { Router } from '../../routes';
import Election from '../../Ethereum/election';
import { Helmet } from 'react-helmet';
import '../../static/styles.css';

class CandidateList extends Component {
  state = {
    election_address: Cookies.get('address'),
    election_name: '',
    election_description: '',
    candidates: [],
    cand_name: 'Nguyễn Văn A',
    cand_desc: 'Sinh viên năm 4 ngành CNTT, có kinh nghiệm lãnh đạo CLB Tin học.',
    buffer: null,
    imagePreview: null,
    loading: false,
    showModal: false,
    showPanel: false,
    panelCandidate: null,
    search: '',
    sort: 'default',
  };

  async componentDidMount() {
    try {
      const add = Cookies.get('address');
      const election = Election(add);
      const summary = await election.methods.getElectionDetails().call();
      this.setState({ election_name: summary[0], election_description: summary[1] });
      const c = await election.methods.getNumOfCandidates().call();

      let candidates = [];
      for (let i = 0; i < c; i++) {
        const cand = await election.methods.getCandidate(i).call();
        candidates.push({ id: i, name: cand[0], desc: cand[1], img: cand[2], votes: parseInt(cand[3]), email: cand[4] });
      }
      this.setState({ candidates });
    } catch (err) {
      console.log(err.message);
      showToast('Phiên đăng nhập hết hạn. Đang chuyển hướng...', 'error');
      setTimeout(() => Router.pushRoute('/company_login'), 1500);
    }
  }

  captureFile = (event) => {
    event.stopPropagation();
    event.preventDefault();
    const file = event.target.files[0];
    if (!file) return;
    // Preview
    const previewUrl = URL.createObjectURL(file);
    this.setState({ imagePreview: previewUrl });
    // Buffer
    let reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () => {
      const buffer = Buffer.from(reader.result);
      this.setState({ buffer });
    };
  };

  onSubmit = async () => {
    this.setState({ loading: true });
    try {
      let imgHash = 'no-image';
      if (this.state.buffer) {
        imgHash = 'local_' + Date.now();
        // Save base64 to local storage for demo so it shows on the list
        const base64 = btoa(new Uint8Array(this.state.buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
        localStorage.setItem(imgHash, 'data:image/jpeg;base64,' + base64);
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const from = accounts[0];
      const add = decodeURIComponent(Cookies.get('address') || '');
      const email = document.getElementById('cand_email').value;

      const { AbiCoder } = require('web3-eth-abi');
      const abi = new AbiCoder();
      const data = abi.encodeFunctionCall(
        { name: 'addCandidate', type: 'function', inputs: [
          { type: 'string', name: 'candidate_name' },
          { type: 'string', name: 'candidate_description' },
          { type: 'string', name: 'imgHash' },
          { type: 'string', name: 'email' },
        ]},
        [this.state.cand_name, this.state.cand_desc, imgHash, email]
      );

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ from, to: add, data, gas: '0x493E0' }],
      });

      let receipt = null, attempts = 0;
      while (!receipt && attempts < 30) {
        await new Promise(r => setTimeout(r, 2000));
        receipt = await window.ethereum.request({ method: 'eth_getTransactionReceipt', params: [txHash] });
        attempts++;
      }

      const http = new XMLHttpRequest();
      http.open('POST', '/candidate/registerCandidate', true);
      http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      http.send(`email=${email}&election_name=${this.state.election_name}`);

      showToast('Ứng cử viên đã được thêm thành công!', 'success');
      this.setState({ showModal: false });
      // Reload candidates
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      showToast('Lỗi: ' + (err.message || err), 'error');
    }
    this.setState({ loading: false });
  };

  getFiltered = () => {
    let list = [...this.state.candidates];
    if (this.state.search) {
      const s = this.state.search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s));
    }
    if (this.state.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    if (this.state.sort === 'votes') list.sort((a, b) => b.votes - a.votes);
    return list;
  };

  render() {
    const { showModal, showPanel, panelCandidate, loading, search, sort, election_name, election_description, imagePreview } = this.state;
    const candidates = this.getFiltered();

    return (
      <div>
        <Helmet><title>Candidates — BlockVotes</title></Helmet>
        <Layout>
          {/* Page Header */}
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 4 }}>Candidates</h1>
            <p style={{ color: '#64748b', fontSize: '14px' }}>{election_name} — {election_description}</p>
          </div>

          {/* Toolbar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                    className="bv-btn bv-btn-pastel-blue" 
                    onClick={() => this.setState({ showModal: true })}
                >
                    + Thêm ứng viên
                </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
              <div className="bv-search" style={{ flex: 1 }}>
                <input placeholder="Tìm kiếm ứng viên..." value={search} onChange={e => this.setState({ search: e.target.value })} style={{ paddingLeft: '14px', width: '100%' }} />
              </div>
              <select className="bv-input" style={{ width: 'auto', minWidth: '160px' }} value={sort} onChange={e => this.setState({ sort: e.target.value })}>
                <option value="default">Mặc định</option>
                <option value="name">Tên A→Z</option>
                <option value="votes">Phiếu cao nhất</option>
              </select>
            </div>
          </div>

          {/* Candidates Grid */}
          {candidates.length === 0 ? (
            <div className="bv-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
              <h3 style={{ marginBottom: '8px', color: '#64748b' }}>Chưa có ứng cử viên nào</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>Bấm "Thêm ứng viên" để đăng ký ứng cử viên đầu tiên.</p>
            </div>
          ) : (
            <div className="bv-grid bv-grid-3">
              {candidates.map((c, idx) => {
                let imgSrc = null;
                if (c.img && c.img.startsWith('local_')) {
                  imgSrc = localStorage.getItem(c.img);
                }
                return (
                <div key={idx} className="bv-card bv-card-lift" style={{ textAlign: 'center', cursor: 'pointer' }}>
                  {imgSrc ? (
                    <img src={imgSrc} className="bv-avatar bv-avatar-lg" style={{ margin: '0 auto 16px', objectFit: 'cover' }} />
                  ) : (
                    <div className="bv-avatar bv-avatar-lg" style={{ margin: '0 auto 16px', fontSize: '36px', background: `hsl(${idx * 60}, 70%, 90%)`, color: `hsl(${idx * 60}, 60%, 40%)` }}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>{c.name}</h3>
                  <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.desc}</p>
                  <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>Email: {c.email}</p>
                  <span className="bv-badge bv-badge-primary" style={{ marginBottom: '16px' }}>{c.votes} phiếu</span>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
                    <button className="bv-btn bv-btn-outline" style={{ fontSize: '13px' }} onClick={() => this.setState({ showPanel: true, panelCandidate: c })}>
                      Chi tiết
                    </button>
                  </div>
                </div>
              )})}
            </div>
          )}


          {/* Add Candidate Modal */}
          {showModal && (
            <div className="bv-modal-overlay" onClick={() => this.setState({ showModal: false })}>
              <div className="bv-modal" onClick={e => e.stopPropagation()}>
                <div className="bv-modal-header">
                  <h2>Thêm Ứng Cử Viên</h2>
                  <button className="bv-modal-close" onClick={() => this.setState({ showModal: false })}>✕</button>
                </div>
                <div className="bv-modal-body">
                  <div className="bv-input-group">
                    <label>Tên ứng viên *</label>
                    <input className="bv-input" value={this.state.cand_name} onChange={e => this.setState({ cand_name: e.target.value })} placeholder="Nguyễn Văn A" />
                  </div>
                  <div className="bv-input-group">
                    <label>Ảnh đại diện</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {imagePreview ? (
                        <img src={imagePreview} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div className="bv-avatar" style={{ width: '64px', height: '64px', fontSize: '14px' }}>No Image</div>
                      )}
                      <label className="bv-btn bv-btn-outline" style={{ cursor: 'pointer' }}>
                        Upload ảnh
                        <input type="file" accept="image/*" onChange={this.captureFile} style={{ display: 'none' }} />
                      </label>
                    </div>
                  </div>
                  <div className="bv-input-group">
                    <label>CV ứng viên (PDF)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <label className="bv-btn bv-btn-outline" style={{ cursor: 'pointer' }}>
                        Upload CV
                        <input type="file" accept=".pdf" style={{ display: 'none' }} />
                      </label>
                      <span style={{ fontSize: '13px', color: '#94a3b8' }}>Chưa chọn file (Tính năng đang phát triển)</span>
                    </div>
                  </div>
                  <div className="bv-input-group">
                    <label>Mô tả</label>
                    <textarea className="bv-input" rows="3" value={this.state.cand_desc} onChange={e => this.setState({ cand_desc: e.target.value })} placeholder="Mô tả về ứng viên..." />
                  </div>
                  <div className="bv-input-group">
                    <label>Email *</label>
                    <input className="bv-input" id="cand_email" type="email" defaultValue="candidate@example.com" placeholder="candidate@example.com" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>Verify with AI</span>
                    <span className="bv-badge bv-badge-muted" style={{ marginLeft: 'auto' }}>Coming soon</span>
                  </div>
                </div>
                <div className="bv-modal-footer">
                  <button className="bv-btn bv-btn-outline" onClick={() => this.setState({ showModal: false })}>Hủy</button>
                  <button className="bv-btn bv-btn-primary" onClick={this.onSubmit} disabled={loading}>
                    {loading ? <span className="bv-spinner"></span> : 'Đăng ký'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Detail Slide Panel */}
          {showPanel && panelCandidate && (
            <div>
              <div className="bv-panel-overlay" onClick={() => this.setState({ showPanel: false })} />
              <div className="bv-panel">
                <div className="bv-panel-header">
                  <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Thông tin ứng viên</h2>
                  <button className="bv-modal-close" onClick={() => this.setState({ showPanel: false })}>✕</button>
                </div>
                <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                  {(() => {
                    let imgSrc = null;
                    if (panelCandidate.img && panelCandidate.img.startsWith('local_')) {
                      imgSrc = localStorage.getItem(panelCandidate.img);
                    }
                    if (imgSrc) {
                      return <img src={imgSrc} className="bv-avatar bv-avatar-lg" style={{ margin: '0 auto 20px', objectFit: 'cover' }} />;
                    } else {
                      return (
                        <div className="bv-avatar bv-avatar-lg" style={{ margin: '0 auto 20px', fontSize: '48px', width: '120px', height: '120px', background: '#eff6ff', color: '#2563eb' }}>
                          {panelCandidate.name.charAt(0).toUpperCase()}
                        </div>
                      );
                    }
                  })()}
                  <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>{panelCandidate.name}</h2>
                  <p style={{ color: '#64748b', marginBottom: '4px' }}>Email: {panelCandidate.email}</p>
                  <span className="bv-badge bv-badge-primary" style={{ fontSize: '14px', padding: '6px 14px' }}>{panelCandidate.votes} phiếu bầu</span>
                  <div style={{ textAlign: 'left', marginTop: '32px', padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#64748b' }}>Mô tả</h4>
                    <p style={{ fontSize: '14px', lineHeight: 1.7 }}>{panelCandidate.desc}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Layout>
      </div>
    );
  }
}

export default CandidateList;