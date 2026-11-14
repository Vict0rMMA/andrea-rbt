import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { StoreProvider } from './store.jsx';
import './index.css';

// If anything crashes, show a friendly screen with a way out instead of a blank page.
class SafetyNet extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    console.error(error);
  }
  fix = () => {
    try {
      // Clears only this device's copy; the cloud copy loads back automatically.
      localStorage.removeItem('andrea-rbt-v1');
      localStorage.removeItem('andrea-rbt-test');
    } catch {
      /* ignore */
    }
    window.location.hash = '';
    window.location.reload();
  };
  render() {
    if (!this.state.error) return this.props.children;
    const btn = { height: 48, padding: '0 20px', borderRadius: 16, border: 0, fontWeight: 700, fontSize: 16, cursor: 'pointer' };
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center', fontFamily: 'system-ui, sans-serif', color: '#4C1D95' }}>
        <p style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Oops! Something went wrong.</p>
        <p style={{ margin: 0, color: '#64748B' }}>Your progress is safe. Try one of these:</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button style={{ ...btn, background: '#7C3AED', color: '#fff' }} onClick={() => window.location.reload()}>
            Reload
          </button>
          <button style={{ ...btn, background: '#EDE9FE', color: '#6D28D9' }} onClick={this.fix}>
            Fix the app
          </button>
        </div>
      </div>
    );
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SafetyNet>
      <StoreProvider>
        <App />
      </StoreProvider>
    </SafetyNet>
  </React.StrictMode>
);

// Offline support + "Add to Home Screen" (only in the real build).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
