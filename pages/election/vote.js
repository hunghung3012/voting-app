import React, { Component } from 'react';
import Layout from '../../components/Layout';
import { showToast } from '../../components/Toast';
import Election from '../../Ethereum/election';
import Cookies from 'js-cookie';
import { Router } from '../../routes';
import { Helmet } from 'react-helmet';
import '../../static/styles.css';

class VotePage extends Component {
  state = {
    election_name: '', election_description: '',
    candidates: [], voted: false, votedFor: -1,
    loading: false, votingId: -1,
    showPanel: false, panelCandidate: null,
    search: '', sort: 'default',
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
      showToast('Phiên hết hạn. Đang chuyển hướng...', 'error');
      setTimeout(() => Router.pushRoute('/voter_login'), 1500);
    }
  }

  vote = async (candidateId) => {
    this.setState({ loading: true, votingId: candidateId });
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const from = accounts[0];
      const add = decodeURIComponent(Cookies.get('address') || '');
      const voterEmail = decodeURIComponent(Cookies.get('voter_email') || '');

      const { AbiCoder } = require('web3-eth-abi');
      const abi = new AbiCoder();
      const data = abi.encodeFunctionCall(
        { name: 'vote', type: 'function', inputs: [{ type: 'uint8', name: 'candidateID' }, { type: 'string', name: 'e' }] },
        [candidateId, voterEmail]
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

      this.setState({ voted: true, votedFor: candidateId });
      showToast('Phiếu bầu đã được ghi nhận trên Blockchain! ✅', 'success', 5000);
    } catch (err) {
      showToast('Lỗi: ' + (err.message || err), 'error');
    }
    this.setState({ loading: false, votingId: -1 });
  };

  signOut = () => {
    Cookies.remove('address');
    Cookies.remove('voter_email');
    showToast('Đã đăng xuất.', 'info');
    setTimeout(() => Router.pushRoute('/homepage'), 500);
  };

  render() {
    const { election_name, election_description, candidates, voted, votedFor, loading, votingId, showPanel, panelCandidate, search, sort } = this.state;
    const totalVotes = candidates.reduce((a, b) => a + b.votes, 0) + (voted ? 1 : 0);

    let filtered = [...candidates];
    if (search) filtered = filtered.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    if (sort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'votes') filtered.sort((a, b) => b.votes - a.votes);

    const colors = ['#2563EB', '#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#06b6d4'];

    return (
      <div>
        <Helmet><title>Vote — {election_name || 'BlockVotes'}</title></Helmet>

        {/* Voter Header */}
        <div style={{ background: '#1e293b', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>Block<span style={{ color: '#60a5fa' }}>Votes</span></div>
          <div style={{ color: '#fff', fontSize: '14px' }}>{election_name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>{decodeURIComponent(Cookies.get('voter_email') || '')}</span>
            <button className="bv-btn bv-btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.2)', fontSize: '13px', padding: '6px 14px' }} onClick={this.signOut}>
              Sign Out
            </button>
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 32px' }}>
          {/* Election Info Banner */}
          <div className="bv-card" style={{ marginBottom: '24px', borderLeft: '4px solid #2563EB' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>{election_name}</h2>
            <p style={{ color: '#64748b', marginBottom: '8px' }}>{election_description}</p>
            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#94a3b8' }}>
              <span>Đang diễn ra</span>
              <span>{candidates.length} ứng viên</span>
              <span>{totalVotes} phiếu đã bầu</span>
            </div>
          </div>

          {/* Toolbar */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <div className="bv-search" style={{ flex: 1, maxWidth: '320px' }}>
              <input placeholder="Tìm ứng viên..." value={search} onChange={e => this.setState({ search: e.target.value })} style={{ paddingLeft: '14px' }} />
            </div>
            <select className="bv-input" style={{ width: 'auto' }} value={sort} onChange={e => this.setState({ sort: e.target.value })}>
              <option value="default">Mặc định</option>
              <option value="name">Tên A→Z</option>
              <option value="votes">Phiếu cao nhất</option>
            </select>
          </div>

          {/* Candidate Cards */}
          <div className="bv-grid bv-grid-3">
            {filtered.map((c, idx) => {
              const pct = totalVotes > 0 ? Math.round(((c.votes + (voted && votedFor === c.id ? 1 : 0)) / totalVotes) * 100) : 0;
              const color = colors[idx % colors.length];
              const isVotedCard = voted && votedFor === c.id;

              return (
                <div key={idx} className="bv-card bv-card-lift" style={{ textAlign: 'center', position: 'relative', border: isVotedCard ? '2px solid #10B981' : '1px solid transparent' }}>
                  {isVotedCard && (
                    <div className="bv-badge bv-badge-success" style={{ position: 'absolute', top: '12px', right: '12px' }}>Phiếu của bạn</div>
                  )}
                  {(() => {
                    let imgSrc = null;
                    if (c.img && c.img.startsWith('local_')) {
                      imgSrc = localStorage.getItem(c.img);
                    }
                    if (imgSrc) {
                      return <img src={imgSrc} className="bv-avatar bv-avatar-lg" style={{ margin: '8px auto 16px', objectFit: 'cover' }} />;
                    } else {
                      return (
                        <div className="bv-avatar bv-avatar-lg" style={{ margin: '8px auto 16px', background: color + '15', color }}>
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                      );
                    }
                  })()}
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>{c.name}</h3>
                  <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.desc}</p>
                  <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>Email: {c.email}</p>

                  {/* Progress bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color }}>{c.votes + (isVotedCard ? 1 : 0)}</span>
                    <div className="bv-progress" style={{ flex: 1 }}>
                      <div className="bv-progress-fill" style={{ width: pct + '%', background: color }} />
                    </div>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{pct}%</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button className="bv-btn bv-btn-outline" style={{ fontSize: '13px' }}
                      onClick={() => this.setState({ showPanel: true, panelCandidate: c })}>
                      Chi tiết
                    </button>
                    <button className="bv-btn bv-btn-primary" style={{ fontSize: '13px' }}
                      onClick={() => this.vote(c.id)} disabled={voted || (loading && votingId === c.id)}
                      title={voted ? 'Bạn đã bỏ phiếu rồi' : ''}>
                      {loading && votingId === c.id ? <span className="bv-spinner" style={{ width: '16px', height: '16px' }}></span> : 'Bầu chọn'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail Panel */}
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
                <span className="bv-badge bv-badge-primary" style={{ fontSize: '14px', padding: '6px 14px' }}>{panelCandidate.votes} phiếu</span>
                <div style={{ textAlign: 'left', marginTop: '32px', padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#64748b' }}>Mô tả</h4>
                  <p style={{ fontSize: '14px', lineHeight: 1.7 }}>{panelCandidate.desc}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default VotePage;