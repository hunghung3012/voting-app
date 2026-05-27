import React, { Component } from 'react';
import { Router } from '../routes';
import Cookies from 'js-cookie';
import { Helmet } from 'react-helmet';
import ToastContainer, { showToast } from '../components/Toast';
import '../static/styles.css';

class VoterLogin extends Component {
  state = { loading: false, showPw: false };

  signin = () => {
    const email = document.getElementById('signin_email').value;
    const password = document.getElementById('signin_password').value;
    if (!email || !password) return showToast('Vui lòng nhập email và mật khẩu.', 'warning');

    this.setState({ loading: true });
    var http = new XMLHttpRequest();
    http.open('POST', 'voter/authenticate', true);
    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    http.onreadystatechange = () => {
      if (http.readyState == 4 && http.status == 200) {
        var r = JSON.parse(http.responseText);
        if (r.status == 'success') {
          Cookies.set('voter_email', encodeURI(email));
          Cookies.set('address', encodeURI(r.data.election_address));
          showToast('Đăng nhập thành công!', 'success');
          setTimeout(() => Router.pushRoute(`/election/${r.data.election_address}/vote`), 500);
        } else {
          this.setState({ loading: false });
          showToast(r.message, 'error');
        }
      }
    };
    http.send('email=' + email + '&password=' + password);
  };

  render() {
    const { loading, showPw } = this.state;
    return (
      <div>
        <Helmet><title>Voter Login — BlockVotes</title></Helmet>
        <ToastContainer />
        <div className="bv-auth">
          {/* Left Panel - Purple variant */}
          <div className="bv-auth-left purple">
            <h1>Block<span style={{ color: '#a78bfa' }}>Votes</span></h1>
            <p>Cổng bỏ phiếu dành cho cử tri — mỗi phiếu bầu đều được ghi lại an toàn trên Blockchain.</p>
            <ul className="bv-auth-features">
              <li>Bỏ phiếu an toàn, không thể gian lận</li>
              <li>Mỗi cử tri chỉ được vote 1 lần duy nhất</li>
              <li>Kết quả bầu cử minh bạch, có thể kiểm chứng</li>
              <li>Nhận thông báo kết quả qua email</li>
            </ul>
          </div>

          {/* Right Panel */}
          <div className="bv-auth-right">
            <div className="bv-auth-form">
              <h2>Đăng nhập Cử tri</h2>
              <p className="auth-subtitle">Nhập thông tin đã được cấp bởi ban tổ chức bầu cử.</p>

              <div className="bv-input-group">
                <label>Email</label>
                <div className="bv-input-icon-wrap">
                  <input className="bv-input" id="signin_email" type="email" placeholder="voter@example.com" style={{ paddingLeft: '14px' }} />
                </div>
              </div>
              <div className="bv-input-group">
                <label>Mật khẩu</label>
                <div className="bv-input-pw-wrap">
                  <input className="bv-input" id="signin_password" type={showPw ? 'text' : 'password'} placeholder="••••••••" />
                  <button className="pw-toggle" type="button" onClick={() => this.setState({ showPw: !showPw })}>
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <button className="bv-btn bv-btn-secondary bv-btn-lg bv-btn-full" onClick={this.signin} disabled={loading}>
                {loading ? <span className="bv-spinner"></span> : 'Sign In'}
              </button>
              <div className="bv-auth-switch" style={{ marginTop: '24px' }}>
                <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                  Liên hệ ban tổ chức bầu cử để được đăng ký tài khoản.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default VoterLogin;
