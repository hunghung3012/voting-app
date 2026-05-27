import React from 'react';
import Head from 'next/head';
import Cookies from 'js-cookie';
import { Link, Router } from '../routes';
import ToastContainer, { showToast } from './Toast';
import '../static/styles.css';

export default (props) => {
  const address = Cookies.get('address');
  const email = Cookies.get('company_email') || Cookies.get('voter_email') || '';
  const isVoter = !!Cookies.get('voter_email');
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  const signOut = () => {
    Cookies.remove('address');
    Cookies.remove('company_email');
    Cookies.remove('company_id');
    Cookies.remove('voter_email');
    showToast('Đã đăng xuất.', 'info');
    setTimeout(() => Router.pushRoute('/homepage'), 500);
  };

  const isActive = (path) => currentPath.includes(path);

  return (
    <div>
      <Head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" />
        <link rel="shortcut icon" type="image/x-icon" href="/static/logo3.png" />
      </Head>
      <ToastContainer />

      {!isVoter && (
        <nav className="bv-sidebar">
          <div className="bv-sidebar-logo">Block<span>Votes</span></div>
          <div className="bv-sidebar-nav">
            <Link route={`/election/${address}/company_dashboard`}>
              <a className={`bv-sidebar-item ${isActive('company_dashboard') ? 'active' : ''}`}>
                Bảng Điều Khiển
              </a>
            </Link>
            <Link route={`/election/${address}/candidate_list`}>
              <a className={`bv-sidebar-item ${isActive('candidate_list') ? 'active' : ''}`}>
                Ứng Cử Viên
              </a>
            </Link>
            <Link route={`/election/${address}/voting_list`}>
              <a className={`bv-sidebar-item ${isActive('voting_list') ? 'active' : ''}`}>
                Cử Tri
              </a>
            </Link>
          </div>
          <div className="bv-sidebar-footer">
            <a className="bv-sidebar-item" onClick={signOut} style={{ cursor: 'pointer' }}>
              Đăng Xuất
            </a>
          </div>
        </nav>
      )}

      <main className={isVoter ? '' : 'bv-main'}>
        <div className="bv-topbar">
          <div></div>
          <div className="bv-topbar-user">
            <span>{decodeURIComponent(email)}</span>
          </div>
        </div>
        {props.children}
      </main>
    </div>
  );
};