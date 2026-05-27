import React, { Component } from 'react';
import { Link } from '../routes';
import { Helmet } from 'react-helmet';
import '../static/styles.css';

class Homepage extends Component {
  render() {
    const nodes = Array.from({ length: 20 }, (_, i) => ({
      left: Math.random() * 100 + '%',
      top: Math.random() * 100 + '%',
      delay: Math.random() * 4 + 's',
      size: 4 + Math.random() * 6 + 'px',
    }));

    return (
      <div>
        <Helmet>
          <title>BlockVotes — Hệ thống bỏ phiếu Blockchain</title>
          <link rel="shortcut icon" type="image/x-icon" href="/static/logo3.png" />
        </Helmet>

        <div className="bv-hero">
          {/* Animated nodes background */}
          <div className="bv-nodes">
            {nodes.map((n, i) => (
              <div key={i} className="bv-node" style={{
                left: n.left, top: n.top,
                animationDelay: n.delay,
                width: n.size, height: n.size,
                background: i % 2 === 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.2)',
              }} />
            ))}
          </div>

          <div className="bv-hero-content">
            <div className="bv-hero-logo">
              Block<span>Votes</span>
            </div>
            <div className="bv-hero-tagline">
              Decentralized · Transparent · Tamper-proof
            </div>

            <div className="bv-hero-cards">
              <Link route="/company_login">
                <a>
                  <div className="bv-hero-card" id="company-portal-card">
                    <h3>Election Organizer</h3>
                    <p>Tạo và quản lý cuộc bầu cử của tổ chức bạn một cách an toàn trên Blockchain.</p>
                    <div className="bv-btn bv-btn-light-green bv-btn-full">
                      Company Portal →
                    </div>
                  </div>
                </a>
              </Link>

              <Link route="/voter_login">
                <a>
                  <div className="bv-hero-card" id="voter-portal-card">
                    <h3>Registered Voter</h3>
                    <p>Tham gia bỏ phiếu cho cuộc bầu cử mà bạn đã được đăng ký và cấp quyền.</p>
                    <div className="bv-btn bv-btn-light-green bv-btn-full">
                      Voter Portal →
                    </div>
                  </div>
                </a>
              </Link>
            </div>
          </div>

          <div className="bv-hero-footer">
            BlockVotes © 2024 — Blockchain-based E-Voting System
          </div>
        </div>
      </div>
    );
  }
}

export default Homepage;
