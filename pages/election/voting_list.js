import React, { Component } from 'react';
import Layout from '../../components/Layout';
import { showToast } from '../../components/Toast';
import Cookies from 'js-cookie';
import { Link, Router } from '../../routes';
import Election from '../../Ethereum/election';
import { Helmet } from 'react-helmet';
import '../../static/styles.css';

class VotingList extends Component {
  state = {
    election_address: Cookies.get('address'),
    election_name: '', election_description: '',
    voters: [], search: '', showAddModal: false, showEditModal: false,
    editId: null, editEmail: '', editName: '',
  };

  async componentDidMount() {
    const self = this;
    var http = new XMLHttpRequest();
    http.open('POST', '/voter/', true);
    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    http.onreadystatechange = function () {
      if (http.readyState == 4 && http.status == 200) {
        var r = JSON.parse(http.responseText);
        if (r.status == 'success') {
          self.setState({ voters: r.data.voters || [] });
        }
      }
    };
    http.send('election_address=' + this.state.election_address);

    try {
      const election = Election(Cookies.get('address'));
      const summary = await election.methods.getElectionDetails().call();
      this.setState({ election_name: summary[0], election_description: summary[1] });
    } catch (err) {
      showToast('Phiên hết hạn.', 'error');
      setTimeout(() => Router.pushRoute('/company_login'), 1500);
    }
  }

  register = () => {
    const email = document.getElementById('register_voter_email').value;
    const name = document.getElementById('register_voter_name').value;
    if (!email || !name) return showToast('Vui lòng nhập đầy đủ tên và email.', 'warning');
    var http = new XMLHttpRequest();
    http.open('POST', '/voter/register', true);
    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    http.onreadystatechange = () => {
      if (http.readyState == 4 && http.status == 200) {
        var r = JSON.parse(http.responseText);
        if (r.status == 'success') {
          showToast('Đã thêm cử tri thành công!', 'success');
          this.setState({ showAddModal: false });
          setTimeout(() => window.location.reload(), 1000);
        } else showToast(r.message, 'error');
      }
    };
    http.send(`email=${email}&name=${encodeURIComponent(name)}&election_address=${this.state.election_address}&election_name=${this.state.election_name}&election_description=${this.state.election_description}`);
  };

  updateEmail = () => {
    const email = this.state.editEmail;
    const name = this.state.editName;
    if (!email || !name) return showToast('Vui lòng nhập đầy đủ tên và email.', 'warning');
    var http = new XMLHttpRequest();
    http.open('PUT', '/voter/' + this.state.editId, true);
    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    http.onreadystatechange = () => {
      if (http.readyState == 4 && http.status == 200) {
        showToast('Đã cập nhật email!', 'success');
        this.setState({ showEditModal: false });
        setTimeout(() => window.location.reload(), 1000);
      }
    };
    http.send(`email=${email}&name=${encodeURIComponent(name)}&election_name=${this.state.election_name}&election_description=${this.state.election_description}`);
  };

  deleteEmail = (id) => {
    if (!confirm('Bạn chắc chắn muốn xóa cử tri này?')) return;
    var http = new XMLHttpRequest();
    http.open('DELETE', '/voter/' + id, true);
    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    http.onreadystatechange = () => {
      if (http.readyState == 4 && http.status == 200) {
        showToast('Đã xóa cử tri!', 'success');
        setTimeout(() => window.location.reload(), 1000);
      }
    };
    http.send();
  };

  handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Load XLSX from CDN dynamically
    if (!window.XLSX) {
      showToast('Đang tải thư viện xử lý Excel...', 'info');
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      script.onload = () => this.processExcel(file);
      document.body.appendChild(script);
    } else {
      this.processExcel(file);
    }
  };

  processExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = window.XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = window.XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) return showToast('File rỗng.', 'error');
        
        // Kiểm tra cột tên và email (không phân biệt hoa thường)
        const firstRow = data[0];
        const keys = Object.keys(firstRow).map(k => k.toLowerCase().trim());
        
        let emailKey = Object.keys(firstRow).find(k => k.toLowerCase().trim() === 'email');
        let nameKey = Object.keys(firstRow).find(k => k.toLowerCase().trim() === 'tên' || k.toLowerCase().trim() === 'name');

        if (!emailKey || !nameKey) {
            return showToast('File Excel phải có cột "tên" và "email".', 'error');
        }

        let successCount = 0;
        let processed = 0;

        showToast(`Đang import ${data.length} cử tri...`, 'info');

        data.forEach((row, index) => {
            const email = row[emailKey];
            const name = row[nameKey];

            if (!email) {
                processed++;
                return;
            }

            var http = new XMLHttpRequest();
            http.open('POST', '/voter/register', true);
            http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            http.onreadystatechange = () => {
              if (http.readyState == 4) {
                processed++;
                if (http.status == 200) {
                  var r = JSON.parse(http.responseText);
                  if (r.status == 'success') successCount++;
                }
                
                // Nếu đã xử lý xong dòng cuối
                if (processed === data.length) {
                    showToast(`Import hoàn tất! Đã thêm ${successCount} cử tri.`, 'success', 5000);
                    setTimeout(() => window.location.reload(), 1500);
                }
              }
            };
            // Send request for each
            http.send(`email=${encodeURIComponent(email)}&election_address=${encodeURIComponent(this.state.election_address)}&election_name=${encodeURIComponent(this.state.election_name)}&election_description=${encodeURIComponent(this.state.election_description)}&name=${encodeURIComponent(name || '')}`);
        });

      } catch (err) {
          showToast('Lỗi khi đọc file Excel', 'error');
      }
    };
    reader.readAsBinaryString(file);
    // Reset file input
    document.getElementById('excel-upload').value = '';
  };

  render() {
    const { voters, search, showAddModal, showEditModal, editEmail, election_name, election_description } = this.state;
    const filtered = search ? voters.filter(v => v.email.toLowerCase().includes(search.toLowerCase())) : voters;

    return (
      <div>
        <Helmet><title>Voters — BlockVotes</title></Helmet>
        <Layout>
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 4 }}>Danh sách Cử tri</h1>
            <p style={{ color: '#64748b', fontSize: '14px' }}>{election_name} — {election_description}</p>
          </div>

          {/* Toolbar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button 
                    className="bv-btn bv-btn-pastel-blue" 
                    onClick={() => this.setState({ showAddModal: true })}
                >
                    + Thêm Cử Tri
                </button>

                <input 
                    type="file" 
                    id="excel-upload" 
                    accept=".xlsx, .xls, .csv" 
                    style={{ display: 'none' }} 
                    onChange={this.handleImportExcel}
                />
                <button 
                    className="bv-btn bv-btn-pastel" 
                    onClick={() => document.getElementById('excel-upload').click()}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    Import File Excel
                </button>
                <span style={{ fontSize: '13px', color: '#64748b', marginLeft: '4px' }}>
                    * Excel cần cột <strong>tên</strong> & <strong>email</strong>
                </span>
            </div>

            <div style={{ width: '100%' }}>
                <div className="bv-search" style={{ width: '100%' }}>
                  <input placeholder="Tìm theo email..." value={search} onChange={e => this.setState({ search: e.target.value })} style={{ paddingLeft: '14px', width: '100%' }} />
                </div>
            </div>
          </div>

          {/* Table */}
          <table className="bv-table">
            <thead>
              <tr><th>#</th><th>Tên</th><th>Email</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Chưa có cử tri nào</td></tr>
              ) : filtered.map((v, i) => (
                <tr key={i}>
                  <td style={{ color: '#94a3b8' }}>{i + 1}</td>
                  <td><strong>{v.name}</strong></td>
                  <td>{v.email}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="bv-btn bv-btn-outline" style={{ fontSize: '12px', padding: '6px 12px' }}
                        onClick={() => this.setState({ showEditModal: true, editId: v.id, editEmail: v.email, editName: v.name || '' })}>
                        Sửa
                      </button>
                      <button className="bv-btn bv-btn-danger" style={{ fontSize: '12px', padding: '6px 12px' }}
                        onClick={() => this.deleteEmail(v.id)}>
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Add Modal */}
          {showAddModal && (
            <div className="bv-modal-overlay" onClick={() => this.setState({ showAddModal: false })}>
              <div className="bv-modal" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
                <div className="bv-modal-header">
                  <h2>Đăng ký Cử tri</h2>
                  <button className="bv-modal-close" onClick={() => this.setState({ showAddModal: false })}>✕</button>
                </div>
                <div className="bv-modal-body">
                  <div className="bv-input-group">
                    <label>Tên cử tri *</label>
                    <input className="bv-input" id="register_voter_name" type="text" placeholder="Nguyễn Văn A" />
                  </div>
                  <div className="bv-input-group">
                    <label>Email *</label>
                    <input className="bv-input" id="register_voter_email" type="email" defaultValue="voter@example.com" placeholder="voter@example.com" />
                  </div>
                </div>
                <div className="bv-modal-footer">
                  <button className="bv-btn bv-btn-outline" onClick={() => this.setState({ showAddModal: false })}>Hủy</button>
                  <button className="bv-btn bv-btn-primary" onClick={this.register}>Đăng ký</button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {showEditModal && (
            <div className="bv-modal-overlay" onClick={() => this.setState({ showEditModal: false })}>
              <div className="bv-modal" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
                <div className="bv-modal-header">
                  <h2>Sửa Email Cử tri</h2>
                  <button className="bv-modal-close" onClick={() => this.setState({ showEditModal: false })}>✕</button>
                </div>
                <div className="bv-modal-body">
                  <div className="bv-input-group">
                    <label>Tên cử tri mới</label>
                    <input className="bv-input" value={this.state.editName} onChange={e => this.setState({ editName: e.target.value })} />
                  </div>
                  <div className="bv-input-group">
                    <label>Email mới</label>
                    <input className="bv-input" value={editEmail} onChange={e => this.setState({ editEmail: e.target.value })} />
                  </div>
                </div>
                <div className="bv-modal-footer">
                  <button className="bv-btn bv-btn-outline" onClick={() => this.setState({ showEditModal: false })}>Hủy</button>
                  <button className="bv-btn bv-btn-primary" onClick={this.updateEmail}>Lưu thay đổi</button>
                </div>
              </div>
            </div>
          )}
        </Layout>
      </div>
    );
  }
}

export default VotingList;