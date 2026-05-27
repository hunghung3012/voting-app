import React, { Component } from 'react';
import Layout from '../../components/Layout';
import { showToast } from '../../components/Toast';
import { Bar, Line } from 'react-chartjs-2';
import Election from '../../Ethereum/election';
import Cookies from 'js-cookie';
import { Router } from '../../routes';
import { Helmet } from 'react-helmet';
import '../../static/styles.css';

class CompanyDashboard extends Component {
  state = {
    election_name: '',
    election_desc: '',
    voters: 0,
    candidates: 0,
    registeredVoters: 0,
    candidatesList: [],
    loading: false,
    showConfirm: false,
    graphLabels: [],
    graphVotes: [],
    // Biểu đồ đường 7 ngày
    lineLabels: [],
    lineValues: [],
    // Lịch sử vote thực từ DB
    voteHistory: [],
    historySearch: '',
    historySort: 'newest',
  };

  async componentDidMount() {
    const electionAddress = Cookies.get('address');

    // Get registered voters count from MongoDB
    var http = new XMLHttpRequest();
    http.open('POST', '/voter/', true);
    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    http.onreadystatechange = () => {
      if (http.readyState == 4 && http.status == 200) {
        var r = JSON.parse(http.responseText);
        if (r.status == 'success') this.setState({ registeredVoters: r.count || 0 });
      }
    };
    http.send('election_address=' + electionAddress);

    // Lấy lịch sử vote 7 ngày từ DB
    try {
      const histRes = await fetch('/voter/voteHistory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ election_address: electionAddress })
      });
      const histData = await histRes.json();
      if (histData.status === 'success') {
        this.setState({
          lineLabels: histData.labels,
          lineValues: histData.values,
          voteHistory: histData.history,
        });
      }
    } catch (e) {
      console.log('voteHistory error:', e.message);
    }

    try {
      const add = Cookies.get('address');
      const election = Election(add);
      const summary = await election.methods.getElectionDetails().call();
      const v = await election.methods.getNumOfVoters().call();
      const c = await election.methods.getNumOfCandidates().call();
      this.setState({ election_name: summary[0], election_desc: summary[1], voters: parseInt(v), candidates: parseInt(c) });

      let labels = [], votes = [];
      for (let i = 0; i < c; i++) {
        const tp = await election.methods.getCandidate(i).call();
        labels.push(tp[0]);
        votes.push(parseInt(tp[3]));
      }
      this.setState({ graphLabels: labels, graphVotes: votes });
    } catch (err) {
      console.log(err.message);
      showToast('Phiên hết hạn. Đang chuyển hướng...', 'error');
      setTimeout(() => Router.pushRoute('/company_login'), 1500);
    }
  }

  endElection = async () => {
    this.setState({ showConfirm: false, loading: true });
    try {
      const add = decodeURIComponent(Cookies.get('address') || '');
      const { AbiCoder } = require('web3-eth-abi');
      const abi = new AbiCoder();

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const from = accounts[0];

      const winnerData = abi.encodeFunctionCall({ name: 'winnerCandidate', type: 'function', inputs: [] }, []);
      const winnerResult = await window.ethereum.request({ method: 'eth_call', params: [{ from, to: add, data: winnerData }, 'latest'] });
      const winnerId = parseInt(winnerResult, 16);

      const getCandData = abi.encodeFunctionCall({ name: 'getCandidate', type: 'function', inputs: [{ type: 'uint8', name: 'candidateID' }] }, [winnerId]);
      const candResult = await window.ethereum.request({ method: 'eth_call', params: [{ to: add, data: getCandData }, 'latest'] });
      const candDecoded = abi.decodeParameters([{ type: 'string' }, { type: 'string' }, { type: 'string' }, { type: 'uint8' }, { type: 'string' }], candResult);

      const winnerName = candDecoded[0], winnerEmail = candDecoded[4], winnerVotes = candDecoded[3];

      const http = new XMLHttpRequest();
      http.open('POST', '/voter/resultMail', true);
      http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      http.onreadystatechange = () => {
        if (http.readyState == 4) {
          this.setState({ loading: false });
          showToast(`Kết thúc! Người thắng: ${winnerName} (${winnerVotes} phiếu)`, 'success', 6000);
        }
      };
      http.send(`election_address=${encodeURIComponent(add)}&election_name=${encodeURIComponent(this.state.election_name)}&candidate_email=${encodeURIComponent(winnerEmail)}&winner_candidate=${encodeURIComponent(winnerName)}`);
    } catch (err) {
      this.setState({ loading: false });
      showToast('Lỗi: ' + (err.message || err), 'error');
    }
  };

  render() {
    const { election_name, election_desc, voters, candidates, registeredVoters, loading, showConfirm, graphLabels, graphVotes, lineLabels, lineValues, voteHistory, historySearch, historySort } = this.state;
    const totalVotes = graphVotes.reduce((a, b) => a + b, 0);
    const turnout = registeredVoters > 0 ? Math.round((voters / registeredVoters) * 100) : 0;
    const colors = ['#2563EB', '#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#06b6d4', '#ec4899', '#8b5cf6'];

    const barChartData = {
      labels: graphLabels,
      datasets: [{
        label: 'Số phiếu',
        data: graphVotes,
        backgroundColor: graphLabels.map((_, i) => colors[i % colors.length] + '33'),
        borderColor: graphLabels.map((_, i) => colors[i % colors.length]),
        borderWidth: 2, borderRadius: 8, barPercentage: 0.6,
      }],
    };

    const lineChartData = {
      labels: lineLabels,
      datasets: [{
        label: 'Lượt bầu chọn',
        data: lineValues,
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
        borderWidth: 2,
        pointBackgroundColor: '#2563EB',
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.4,
      }],
    };

    const chartOptions = {
      maintainAspectRatio: false, responsive: true,
      scales: { yAxes: [{ ticks: { beginAtZero: true, stepSize: 1 }, gridLines: { color: '#f1f5f9' } }], xAxes: [{ gridLines: { display: false } }] },
      legend: { display: false },
    };

    const lineChartOptions = {
      maintainAspectRatio: false, responsive: true,
      scales: {
        yAxes: [{ ticks: { beginAtZero: true, stepSize: 1, precision: 0 }, gridLines: { color: '#f1f5f9' } }],
        xAxes: [{ gridLines: { display: false } }]
      },
      legend: { display: true, labels: { fontColor: '#64748b', fontSize: 12 } },
    };

    // Lọc và sắp xếp lịch sử vote
    let historyLogs = [...voteHistory];
    if (historySearch) {
      const s = historySearch.toLowerCase();
      historyLogs = historyLogs.filter(r => r.voter_email.toLowerCase().includes(s) || (r.candidate_name || '').toLowerCase().includes(s));
    }
    // voteHistory đã sort descending từ server, nếu cần ascending thì reverse
    if (historySort === 'oldest') historyLogs = historyLogs.reverse();

    return (
      <div>
        <Helmet><title>Dashboard — BlockVotes</title></Helmet>
        <Layout>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 4 }}>Bảng Điều Khiển</h1>
              <p style={{ color: '#64748b', fontSize: '14px' }}>{election_name} — {election_desc}</p>
            </div>
            <button className="bv-btn bv-btn-danger" onClick={() => this.setState({ showConfirm: true })} disabled={loading}>
              {loading ? <span className="bv-spinner"></span> : 'Kết thúc bầu cử'}
            </button>
          </div>

          {/* Stat Cards */}
          <div className="bv-grid bv-grid-4" style={{ marginBottom: '24px' }}>
            <div className="bv-stat-card" style={{ borderLeftColor: '#2563EB' }}>
              <div className="bv-stat-icon" style={{ background: '#eff6ff', color: '#2563EB' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
              <div><div className="bv-stat-value">{registeredVoters}</div><div className="bv-stat-label">Cử tri đăng ký</div></div>
            </div>
            <div className="bv-stat-card" style={{ borderLeftColor: '#7C3AED' }}>
              <div className="bv-stat-icon" style={{ background: '#f5f3ff', color: '#7C3AED' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              <div><div className="bv-stat-value">{candidates}</div><div className="bv-stat-label">Ứng cử viên</div></div>
            </div>
            <div className="bv-stat-card" style={{ borderLeftColor: '#10B981' }}>
              <div className="bv-stat-icon" style={{ background: '#ecfdf5', color: '#10B981' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <div><div className="bv-stat-value">{totalVotes}</div><div className="bv-stat-label">Phiếu bầu</div></div>
            </div>
            <div className="bv-stat-card" style={{ borderLeftColor: '#F59E0B' }}>
              <div className="bv-stat-icon" style={{ background: '#fffbeb', color: '#F59E0B' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
              </div>
              <div><div className="bv-stat-value">{turnout}%</div><div className="bv-stat-label">Tỉ lệ bỏ phiếu</div></div>
            </div>
          </div>

          {/* Two charts side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            {/* Bar chart - phân bố phiếu */}
            <div className="bv-card">
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Phân bố phiếu bầu</h3>
              <div style={{ height: '260px' }}>
                {graphLabels.length > 0 ? <Bar data={barChartData} options={chartOptions} /> : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                    Chưa có dữ liệu phiếu bầu
                  </div>
                )}
              </div>
            </div>

            {/* Line chart - lượt vote 7 ngày */}
            <div className="bv-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Lượt bầu chọn (7 ngày)</h3>
                <span className="bv-badge bv-badge-primary">{lineValues.reduce((a, b) => a + b, 0)} lượt</span>
              </div>
              <div style={{ height: '260px' }}>
                {lineLabels.length > 0 ? <Line data={lineChartData} options={lineChartOptions} /> : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                    Chưa có lịch sử bầu cử
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* History Table - lịch sử vote thực */}
          <div className="bv-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>Lịch sử Bỏ Phiếu</h3>
                <p style={{ fontSize: '12px', color: '#64748b' }}>Danh sách cử tri đã bỏ phiếu ({voteHistory.length} lượt)</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div className="bv-search" style={{ width: '200px' }}>
                  <input placeholder="Tìm kiếm..." value={historySearch} onChange={e => this.setState({ historySearch: e.target.value })} style={{ paddingLeft: '14px' }} />
                </div>
                <select className="bv-input" style={{ width: '150px' }} value={historySort} onChange={e => this.setState({ historySort: e.target.value })}>
                  <option value="newest">Mới nhất trước</option>
                  <option value="oldest">Cũ nhất trước</option>
                </select>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px', paddingRight: '8px' }}>
              {historyLogs.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px' }}>
                  {voteHistory.length === 0 ? 'Chưa có ai bỏ phiếu' : 'Không tìm thấy kết quả'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {historyLogs.map((log, i) => (
                    <div key={i} style={{ display: 'flex', gap: '16px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ecfdf5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, fontSize: '16px' }}>
                        {(log.voter_name || log.voter_email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          title={log.voter_email}
                          style={{ fontSize: '14px', color: '#1e293b', fontWeight: 600, cursor: 'default', display: 'inline-block' }}
                        >
                          {log.voter_name || log.voter_email}
                        </div>
                        <div style={{ fontSize: '13px', color: '#10B981', marginTop: '2px' }}>
                          Đã bỏ phiếu cho <strong>{log.candidate_name || 'Ứng viên'}</strong>
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{log.dateStr}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Confirm Dialog */}
          {showConfirm && (
            <div className="bv-modal-overlay" onClick={() => this.setState({ showConfirm: false })}>
              <div className="bv-modal" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
                <div className="bv-modal-body" style={{ textAlign: 'center', padding: '32px' }}>
                  <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>Kết thúc cuộc bầu cử?</h2>
                  <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
                    Hành động này sẽ xác định người chiến thắng và gửi email thông báo đến tất cả cử tri. Không thể hoàn tác.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button className="bv-btn bv-btn-outline" onClick={() => this.setState({ showConfirm: false })}>Hủy</button>
                    <button className="bv-btn bv-btn-danger" onClick={this.endElection}>Xác nhận kết thúc</button>
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

export default CompanyDashboard;
