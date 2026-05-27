import React, { Component } from 'react';

let toastInstance = null;

class ToastContainer extends Component {
  state = { toasts: [] };
  componentDidMount() { toastInstance = this; }
  componentWillUnmount() { toastInstance = null; }

  addToast(message, type = 'info', duration = 4000) {
    const id = Date.now();
    this.setState(prev => ({ toasts: [...prev.toasts, { id, message, type }] }));
    setTimeout(() => {
      this.setState(prev => ({ toasts: prev.toasts.filter(t => t.id !== id) }));
    }, duration);
  }

  render() {
    return (
      <div className="bv-toast-container">
        {this.state.toasts.map(t => (
          <div key={t.id} className={`bv-toast bv-toast-${t.type}`}>
            <span style={{ fontWeight: 'bold' }}>
              {t.type === 'success' ? 'Success:' : t.type === 'error' ? 'Error:' : t.type === 'warning' ? 'Warning:' : 'Info:'}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    );
  }
}

export function showToast(message, type = 'info', duration = 4000) {
  if (toastInstance) toastInstance.addToast(message, type, duration);
  else console.log(`[Toast ${type}] ${message}`);
}

export default ToastContainer;
