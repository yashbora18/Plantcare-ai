import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Leaf, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/layout/Navbar';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      addToast('Please enter your username/email and password.', 'warning');
      return;
    }

    setLoading(true);
    try {
      await login(identifier, password);
      addToast('Welcome back to your garden!', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      addToast(err.message || 'Login failed. Please verify your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setIdentifier('botanist_jane');
    setPassword('SecurePassword123!');
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div
          className="botanical-card"
          style={{
            maxWidth: '440px',
            width: '100%',
            padding: '2.5rem',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-fresh-leaf)',
                color: '#111713',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Leaf size={26} />
            </div>
            <h2 style={{ fontSize: '1.75rem' }}>Welcome Back</h2>
            <p style={{ marginTop: '0.35rem' }}>Access your plants, garden plans, and outdoor missions.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="identifier">Username or Email</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="identifier"
                  type="text"
                  className="input-control"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="e.g. botanist_jane or jane@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  required
                />
                <User size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type="password"
                  className="input-control"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.75rem', padding: '0.85rem' }}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid #FFFFFF', borderTopColor: 'transparent', borderRadius: '50%' }} />
                  <span>Signing In...</span>
                </div>
              ) : (
                <>
                  <span>Sign In to PlantCare AI</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Demo helper */}
          <div
            style={{
              marginTop: '1.5rem',
              padding: '0.85rem',
              background: 'var(--bg-surface-alt)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-medium)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
              Want to test immediately?
            </div>
            <button
              type="button"
              onClick={handleQuickDemo}
              className="btn btn-outline btn-sm"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            >
              <Sparkles size={14} color="var(--accent-fresh)" />
              <span>Fill Test Botanist Credentials</span>
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            New to PlantCare AI?{' '}
            <NavLink to="/register" style={{ fontWeight: 600, color: 'var(--accent-fresh)' }}>
              Create an account
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
}
