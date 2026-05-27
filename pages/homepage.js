import React, { Component } from 'react';
import { Link } from '../routes';
import { Helmet } from 'react-helmet';
import '../static/styles.css';

class Homepage extends Component {
  render() {
    return (
      <div>
        <Helmet>
          <title>BlockVotes — Hệ thống bỏ phiếu Blockchain</title>
          <link rel="shortcut icon" type="image/x-icon" href="/static/logo3.png" />
        </Helmet>

        <div className="bv-landing">
          {/* Header */}
          <div className="bv-landing-header">
            <div className="bv-landing-logo">
              Block<span>Votes</span>
            </div>
            <div className="bv-landing-subtitle">
              Hệ thống bầu cử phi tập trung trên Blockchain
            </div>
          </div>

          {/* Two panels */}
          <div className="bv-landing-panels">
            {/* Left Panel - Tạo Bầu Cử */}
            <div className="bv-landing-panel" id="panel-create-election">
              <div className="bv-landing-panel-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#059862" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
              </div>
              <h2>Tạo Bầu Cử Mới</h2>
              <p>
                Thiết lập và quản lý cuộc bầu cử của tổ chức bạn một cách minh bạch 
                và an toàn trên nền tảng Blockchain. Thêm ứng cử viên, cấp quyền cho 
                cử tri và theo dõi kết quả theo thời gian thực.
              </p>
              <Link route="/company_login">
                <a>
                  <div className="bv-landing-btn" id="btn-create-election">
                    Bắt đầu tạo bầu cử
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </div>
                </a>
              </Link>
            </div>

            {/* Right Panel - Tham Gia Bầu Cử */}
            <div className="bv-landing-panel" id="panel-join-election">
              <div className="bv-landing-panel-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#059862" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
              </div>
              <h2>Tham Gia Bầu Cử</h2>
              <p>
                Đăng nhập để tham gia bỏ phiếu cho cuộc bầu cử mà bạn đã được 
                đăng ký và cấp quyền. Mỗi phiếu bầu được ghi nhận trên Blockchain, 
                đảm bảo tính minh bạch và không thể gian lận.
              </p>
              <Link route="/voter_login">
                <a>
                  <div className="bv-landing-btn" id="btn-join-election">
                    Tham gia bỏ phiếu
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </div>
                </a>
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="bv-landing-footer">
            BlockVotes © 2024 — Blockchain-based E-Voting System
          </div>
        </div>
      </div>
    );
  }
}

export default Homepage;
