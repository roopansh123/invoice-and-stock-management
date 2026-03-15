import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSeed = async () => {
    try {
      const res = await API.post('/auth/seed');
      toast.success(res.data.message || 'Admin created!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Seed failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', height: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: 'var(--font)'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '64px', height: '64px', background: 'linear-gradient(135deg, #1a56db, #1040b0)',
            borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', margin: '0 auto 16px',
          }}>👟</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--cream)' }}>
            Ram Footware
          </h1>
          <p style={{ color: 'var(--muted)', marginTop: '4px', fontSize: '13px', letterSpacing: '2px', fontFamily: 'var(--font-mono)' }}>
            INDUSTRIES — MANAGEMENT SYSTEM
          </p>
        </div>

        {/* Form */}
        <div className="card">
          <h2 style={{ fontSize: '18px', color: 'var(--cream)', marginBottom: '24px', fontWeight: '600' }}>Sign In</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input className="input" type="email" placeholder="admin@rfi.com" value={email}
                onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="input-label">Password</label>
              <input className="input" type="password" placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '8px', padding: '11px' }}>
              {loading ? 'Signing in...' : '→ Sign In'}
            </button>
          </form>
        </div>

        {/* First time setup */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '8px' }}>
            First time setup? Create admin account:
          </p>
          <button className="btn btn-ghost btn-sm" onClick={handleSeed}>
            ⚙️ Initialize Admin
          </button>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--muted2)', fontSize: '11px', marginTop: '24px', fontFamily: 'var(--font-mono)' }}>
          RFI Management v1.0.0
        </p>
      </div>
    </div>
  );
}
