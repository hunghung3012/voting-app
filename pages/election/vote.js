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
    showChat: false, chatMessages: [], chatInput: '', chatLoading: false,
    is_ended: false, winner_name: '', winner_votes: 0
  };

  async componentDidMount() {
    try {
      const add = Cookies.get('address');
      const voterEmail = decodeURIComponent(Cookies.get('voter_email') || '');
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

      // Kiểm tra voter đã vote chưa (từ DB), disable nút ngay từ đầu
      if (voterEmail && add) {
        try {
          const res = await fetch('/voter/checkVoted', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ voter_email: voterEmail, election_address: add })
          });
          const data = await res.json();
          if (data.has_voted) {
            this.setState({ voted: true, votedFor: data.candidate_id });
          }
        } catch (e) {
          console.log('checkVoted error:', e.message);
        }
      }

      // Kiểm tra trạng thái kết thúc bầu cử
      try {
        const metaRes = await fetch('/company/meta/' + add);
        const metaData = await metaRes.json();
        if (metaData.status === 'success') {
          this.setState({
            is_ended: metaData.is_ended,
            winner_name: metaData.winner_name,
            winner_votes: metaData.winner_votes
          });
        }
      } catch (e) {
        console.log('API meta error:', e.message);
      }

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

      this.setState(prevState => {
        const updatedCandidates = prevState.candidates.map(c => 
          c.id === candidateId ? { ...c, votes: c.votes + 1 } : c
        );
        return { voted: true, votedFor: candidateId, candidates: updatedCandidates };
      });
      showToast('Phiếu bầu đã được ghi nhận trên Blockchain! ✅', 'success', 5000);

      // Ghi lịch sử vote vào MongoDB
      const candidate = this.state.candidates.find(c => c.id === candidateId);
      try {
        await fetch('/voter/recordVote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            voter_email: voterEmail,
            election_address: add,
            candidate_id: candidateId,
            candidate_name: candidate ? candidate.name : ''
          })
        });
      } catch (e) {
        console.log('recordVote error (non-critical):', e.message);
      }
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

  sendChatMessage = async () => {
    if (!this.state.chatInput.trim() || this.state.chatLoading) return;
    
    const userMessage = this.state.chatInput;
    this.setState(prev => ({
      chatMessages: [...prev.chatMessages, { role: 'user', content: userMessage }],
      chatInput: '',
      chatLoading: true
    }));

    setTimeout(() => {
      const box = document.getElementById('chat-box');
      if (box) box.scrollTop = box.scrollHeight;
    }, 100);

    const maxVotes = Math.max(...this.state.candidates.map(c => c.votes), 0);
    const leaders = this.state.candidates.filter(c => c.votes === maxVotes && maxVotes > 0).map(c => c.name).join(', ');
    
    let contextStr = `Cuộc bầu cử: ${this.state.election_name} (${this.state.election_description})\n`;
    contextStr += `Tổng số ứng viên: ${this.state.candidates.length}\n`;
    contextStr += `Người đang dẫn đầu: ${leaders || 'Chưa có ai'}\n\n`;
    contextStr += `Danh sách ứng viên chi tiết:\n`;
    
    this.state.candidates.forEach(c => {
      contextStr += `- ${c.name} (Email: ${c.email}) - ${c.votes} phiếu. Thành tích/Mô tả: ${c.desc.substring(0, 300)}...\n`;
    });

    try {
      const response = await fetch('/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, context: contextStr })
      });

      if (!response.ok) throw new Error('API Error');

      this.setState(prev => ({
        chatMessages: [...prev.chatMessages, { role: 'bot', content: '' }],
        chatLoading: false
      }));

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let botContent = '';
      let buffer = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunkStr = decoder.decode(value, { stream: true });
          buffer += chunkStr;
          
          const lines = buffer.split('\n');
          buffer = lines.pop(); // keep the last incomplete line in buffer

          for (let line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              if (dataStr) {
                try {
                  const dataObj = JSON.parse(dataStr);
                  // New format from @google/genai SDK: { text: '...' }
                  if (dataObj.text) {
                    botContent += dataObj.text;
                    
                    this.setState(prev => {
                      const newMessages = [...prev.chatMessages];
                      newMessages[newMessages.length - 1].content = botContent;
                      return { chatMessages: newMessages };
                    });

                    const box = document.getElementById('chat-box');
                    if (box) box.scrollTop = box.scrollHeight;
                  }
                } catch (e) {
                  // ignore parse errors for incomplete JSON
                }
              }
            }
          }
        }
      }
    } catch (err) {
      this.setState(prev => ({
        chatLoading: false,
        chatMessages: [...prev.chatMessages, { role: 'bot', content: 'Xin lỗi, có lỗi xảy ra khi kết nối tới AI.' }]
      }));
    }
  };

  render() {
    const { election_name, election_description, candidates, voted, votedFor, loading, votingId, showPanel, panelCandidate, search, sort } = this.state;
    const totalVotes = candidates.reduce((a, b) => a + b.votes, 0);
    const maxVotes = candidates.length > 0 ? Math.max(...candidates.map(c => c.votes)) : 0;

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
          <div className="bv-card" style={{ marginBottom: '24px', borderLeft: this.state.is_ended ? '4px solid #10B981' : '4px solid #2563EB' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>{election_name}</h2>
            <p style={{ color: '#64748b', marginBottom: '8px' }}>{election_description}</p>
            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#94a3b8' }}>
              {this.state.is_ended ? (
                <span style={{ color: '#10B981', fontWeight: 600 }}>Đã kết thúc</span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ position: 'relative', display: 'inline-flex', width: '10px', height: '10px' }}>
                    <span style={{ position: 'absolute', display: 'inline-flex', width: '100%', height: '100%', borderRadius: '50%', background: '#10B981', opacity: 0.75, animation: 'bvPulse 1.5s ease-in-out infinite' }}></span>
                    <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', width: '10px', height: '10px', background: '#10B981' }}></span>
                  </span>
                  Đang diễn ra
                </span>
              )}
              <span>{candidates.length} ứng viên</span>
              <span>{totalVotes} phiếu đã bầu</span>
            </div>
          </div>

          {this.state.is_ended ? (
            <div className="bv-card" style={{ textAlign: 'center', padding: '60px 20px', borderTop: '4px solid #10B981' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', background: '#ecfdf5', color: '#10B981', marginBottom: '24px' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>Kết quả chung cuộc</h2>
              <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '32px' }}>Người chiến thắng</p>
              
              <div style={{ display: 'inline-block', background: '#f8fafc', padding: '24px 48px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#10B981', marginBottom: '8px' }}>{this.state.winner_name}</div>
                <div style={{ fontSize: '15px', color: '#475569' }}>Tổng số phiếu: <strong>{this.state.winner_votes}</strong></div>
              </div>
              <p style={{ marginTop: '32px', color: '#94a3b8' }}>Cảm ơn bạn đã tham gia bỏ phiếu!</p>
            </div>
          ) : (
            <>
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
              const color = colors[idx % colors.length];
              const isVotedCard = voted && votedFor === c.id;
              const candidateVotes = c.votes;
              const isHighest = maxVotes > 0 && candidateVotes === maxVotes;
              
              let border = '1px solid transparent';
              let boxShadow = '';
              if (isHighest) {
                border = '2px solid #F59E0B'; // using hardcoded hex since css var might be missing
                boxShadow = '0 0 16px rgba(245, 158, 11, 0.4)';
              } else if (isVotedCard) {
                border = '2px solid #10B981';
              }

              return (
                <div key={idx} className="bv-card bv-card-lift" style={{ textAlign: 'center', position: 'relative', border, boxShadow, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {isHighest && (
                    <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, background: '#F59E0B', color: '#fff', fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)', whiteSpace: 'nowrap' }}>
                      🏆 Người có lượt vote cao nhất
                    </div>
                  )}
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
                  <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', whiteSpace: 'pre-line' }}>{c.desc}</p>
                  
                  <div style={{ marginTop: 'auto' }}>
                    <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>Email: {c.email}</p>
                    <div style={{ marginBottom: '16px' }}>
                      <span className="bv-badge bv-badge-primary" style={{ padding: '6px 12px', fontSize: '13px' }}>
                        {candidateVotes} phiếu bầu
                      </span>
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
                </div>
              );
            })}
          </div>
          </>
          )}
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
                  <p style={{ fontSize: '14px', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{panelCandidate.desc}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Chat Button */}
        <button 
          onClick={() => this.setState({ showChat: !this.state.showChat })}
          style={{ position: 'fixed', bottom: '24px', right: '24px', width: '56px', height: '56px', borderRadius: '50%', background: '#2563EB', color: '#fff', border: 'none', boxShadow: '0 4px 12px rgba(37,99,235,0.4)', cursor: 'pointer', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
        </button>

        {/* Chat Panel */}
        {this.state.showChat && (
          <div style={{ position: 'fixed', bottom: '90px', right: '24px', width: '340px', height: '480px', background: '#fff', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', zIndex: 1000, display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', overflow: 'hidden', animation: 'bvSlideUp 0.3s ease' }}>
            <div style={{ background: '#2563EB', color: '#fff', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a2 2 0 0 1 2 2 2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1 2-2z"></path><path d="M19 15v-3h-2v3h-2v-3h-2v3h-2v-3H9v3H7v-3H5v3"></path><path d="M22 9a2 2 0 0 0-2-2h-3.4a2 2 0 0 0-3.2 0H10.6a2 2 0 0 0-3.2 0H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9z"></path></svg>
                BlockVotes AI
              </div>
              <button onClick={() => this.setState({ showChat: false })} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>
            
            <div id="chat-box" style={{ flex: 1, padding: '16px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {this.state.chatMessages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', marginTop: '20px' }}>
                  Xin chào! Tôi là AI phân tích dữ liệu ứng cử viên. Tôi có thể giúp gì cho bạn?
                </div>
              )}
              {this.state.chatMessages.map((msg, i) => {
                let formattedHtml = msg.content
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/\n/g, '<br />');

                return (
                  <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                    <div 
                      style={{ background: msg.role === 'user' ? '#2563EB' : '#fff', color: msg.role === 'user' ? '#fff' : '#1e293b', padding: '10px 14px', borderRadius: '12px', borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px', borderBottomLeftRadius: msg.role === 'bot' ? '4px' : '12px', fontSize: '13px', lineHeight: 1.5, border: msg.role === 'bot' ? '1px solid #e2e8f0' : 'none', wordBreak: 'break-word' }}
                      dangerouslySetInnerHTML={{ __html: msg.role === 'user' ? msg.content : formattedHtml }}
                    />
                  </div>
                );
              })}
              {this.state.chatLoading && (
                <div style={{ alignSelf: 'flex-start', background: '#fff', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#64748b' }}>
                  <span className="bv-spinner bv-spinner-dark" style={{ width: '12px', height: '12px', marginRight: '6px' }}></span> Đang trả lời...
                </div>
              )}
            </div>

            <div style={{ padding: '12px', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
              <input 
                value={this.state.chatInput} 
                onChange={e => this.setState({ chatInput: e.target.value })}
                onKeyPress={e => e.key === 'Enter' && this.sendChatMessage()}
                placeholder="Hỏi AI..." 
                style={{ flex: 1, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '20px', fontSize: '13px', outline: 'none' }}
                disabled={this.state.chatLoading}
              />
              <button 
                onClick={this.sendChatMessage}
                disabled={this.state.chatLoading || !this.state.chatInput.trim()}
                style={{ background: '#2563EB', color: '#fff', border: 'none', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: (this.state.chatLoading || !this.state.chatInput.trim()) ? 0.5 : 1 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </div>
          </div>
        )}

      </div>
    );
  }
}

export default VotePage;