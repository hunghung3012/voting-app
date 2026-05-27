import React, { Component } from 'react';
import { Router } from '../routes';
import Cookies from 'js-cookie';
import { Helmet } from 'react-helmet';
import ToastContainer, { showToast } from '../components/Toast';
import '../static/styles.css';

class CompanyLogin extends Component {
  state = {
    activeTab: 'signin',
    loading: false,
    showPw: false,
    showPw2: false,
  };

  signup = () => {
    const email = document.getElementById('signup_email').value;
    const password = document.getElementById('signup_password').value;
    const repeat = document.getElementById('signup_repeat_password').value;
    if (!email || !password) return showToast('Vui lòng nhập đầy đủ thông tin.', 'warning');
    if (password !== repeat) return showToast('Mật khẩu xác nhận không khớp!', 'error');

    this.setState({ loading: true });
    var http = new XMLHttpRequest();
    http.open('POST', 'company/register', true);
    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    http.onreadystatechange = () => {
      if (http.readyState == 4 && http.status == 200) {
        var r = JSON.parse(http.responseText);
        this.setState({ loading: false });
        if (r.status === 'success') {
          Cookies.set('company_email', encodeURI(r.data.email));
          showToast('Đăng ký thành công! Hãy đăng nhập.', 'success');
          this.setState({ activeTab: 'signin' });
        } else {
          showToast(r.message, 'error');
        }
      }
    };
    http.send('email=' + email + '&password=' + password);
  };

  signin = async () => {
    const email = document.getElementById('signin_email').value;
    const password = document.getElementById('signin_password').value;
    if (!email || !password) return showToast('Vui lòng nhập email và mật khẩu.', 'warning');

    this.setState({ loading: true });
    var http = new XMLHttpRequest();
    http.open('POST', 'company/authenticate', true);
    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    http.onreadystatechange = async () => {
      if (http.readyState == 4 && http.status == 200) {
        var r = JSON.parse(http.responseText);
        if (r.status === 'success') {
          Cookies.set('company_id', encodeURI(r.data.id));
          Cookies.set('company_email', encodeURI(r.data.email));
          showToast('Đăng nhập thành công!', 'success');
          try {
            const web3mod = (await import('../Ethereum/web3')).default;
            const EF = (await import('../Ethereum/election_factory')).default;
            const accounts = await web3mod.eth.getAccounts();
            let summary;
            try {
              summary = await EF.methods.getDeployedElection(email).call({ from: accounts[0] });
            } catch (e) {
              summary = ['0x0000000000000000000000000000000000000000', '', 'Create an election.'];
            }
            if (summary[2] == 'Create an election.') {
              Router.pushRoute('/election/create_election');
            } else {
              Cookies.set('address', summary[0]);
              Router.pushRoute(`/election/${summary[0]}/company_dashboard`);
            }
          } catch (e) {
            Router.pushRoute('/election/create_election');
          }
        } else {
          this.setState({ loading: false });
          showToast(r.message, 'error');
        }
      }
    };
    http.send('email=' + email + '&password=' + password);
  };

  render() {
    const { activeTab, loading, showPw, showPw2 } = this.state;
    return (
      <div>
        <Helmet><title>Company Login — BlockVotes</title></Helmet>
        <ToastContainer />
        <div className="bv-auth">
          {/* Left Panel */}
          <div className="bv-auth-left">
            <h1>Block<span style={{ color: '#60a5fa' }}>Votes</span></h1>
            <p>Nền tảng bầu cử phi tập trung — bảo mật, minh bạch, và không thể can thiệp.</p>
            <ul className="bv-auth-features">
              <li>Tạo cuộc bầu cử trên Smart Contract</li>
              <li>Quản lý ứng cử viên và cử tri dễ dàng</li>
              <li>Theo dõi kết quả bỏ phiếu real-time</li>
              <li>Gửi email thông báo tự động</li>
            </ul>
          </div>

          {/* Right Panel */}
          <div className="bv-auth-right">
            <div className="bv-auth-form">
              <div className="bv-auth-tabs">
                <div className={`bv-auth-tab ${activeTab === 'signin' ? 'active' : ''}`}
                  onClick={() => this.setState({ activeTab: 'signin' })}>
                  Sign In
                </div>
                <div className={`bv-auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
                  onClick={() => this.setState({ activeTab: 'signup' })}>
                  Sign Up
                </div>
              </div>

              {activeTab === 'signin' ? (
                <div>
                  <h2>Chào mừng trở lại</h2>
                  <p className="auth-subtitle">Đăng nhập để quản lý cuộc bầu cử của bạn.</p>
                  <div className="bv-input-group">
                    <label>Email</label>
                    <div className="bv-input-icon-wrap">
                      <input className="bv-input" id="signin_email" type="email" placeholder="company@example.com" style={{ paddingLeft: '14px' }} />
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
                  <button className="bv-btn bv-btn-primary bv-btn-lg bv-btn-full" onClick={this.signin} disabled={loading}>
                    {loading ? <span className="bv-spinner"></span> : 'Sign In'}
                  </button>
                  <div className="bv-auth-switch">
                    Chưa có tài khoản? <a onClick={() => this.setState({ activeTab: 'signup' })}>Đăng ký →</a>
                  </div>
                </div>
              ) : (
                <div>
                  <h2>Tạo tài khoản</h2>
                  <p className="auth-subtitle">Đăng ký để bắt đầu tạo cuộc bầu cử.</p>
                  <div className="bv-input-group">
                    <label>Email</label>
                    <div className="bv-input-icon-wrap">
                      <input className="bv-input" id="signup_email" type="email" placeholder="company@example.com" style={{ paddingLeft: '14px' }} />
                    </div>
                  </div>
                  <div className="bv-input-group">
                    <label>Mật khẩu</label>
                    <div className="bv-input-pw-wrap">
                      <input className="bv-input" id="signup_password" type={showPw ? 'text' : 'password'} placeholder="••••••••" />
                      <button className="pw-toggle" type="button" onClick={() => this.setState({ showPw: !showPw })}>
                        {showPw ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  <div className="bv-input-group">
                    <label>Xác nhận mật khẩu</label>
                    <div className="bv-input-pw-wrap">
                      <input className="bv-input" id="signup_repeat_password" type={showPw2 ? 'text' : 'password'} placeholder="••••••••" />
                      <button className="pw-toggle" type="button" onClick={() => this.setState({ showPw2: !showPw2 })}>
                        {showPw2 ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  <button className="bv-btn bv-btn-primary bv-btn-lg bv-btn-full" onClick={this.signup} disabled={loading}>
                    {loading ? <span className="bv-spinner"></span> : 'Create Account'}
                  </button>
                  <div className="bv-auth-switch">
                    Đã có tài khoản? <a onClick={() => this.setState({ activeTab: 'signin' })}>Đăng nhập →</a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default CompanyLogin;
