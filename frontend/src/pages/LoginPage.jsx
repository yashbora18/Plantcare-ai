
import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Leaf,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/layout/Navbar';

export default function LoginPage() {
  
const location = useLocation();
const navigate = useNavigate();

const [identifier, setIdentifier] = useState(
  () => location.state?.identifier || ''
);
const [password, setPassword] = useState('');
const [loading, setLoading] = useState(false);

const { login } = useAuth();
const { addToast } = useToast();


  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!identifier.trim() || !password) {
      addToast(
        'Please enter your username/email and password.',
        'warning'
      );
      return;
    }

    setLoading(true);

    try {
      await login(identifier.trim(), password);
      addToast('Welcome back to your garden!', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      addToast(
        err.message || 'Login failed. Please verify your credentials.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setIdentifier('botanist_jane');
    setPassword('SecurePassword123!');
  };

  return (
    <div className="login-page">
      <Navbar />

      <main className="login-main">
        <section className="botanical-card login-card">
          <NavLink
            to="/"
            className="login-back-home"
            aria-label="Back to home"
          >
            <ArrowLeft size={17} />
            <span>Back to Home</span>
          </NavLink>

          <div className="login-heading">
            <div className="login-icon">
              <Leaf size={26} />
            </div>

            <h2>Welcome Back</h2>

            <p>
              Access your plants, garden plans, and outdoor missions.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="identifier">
                Username or Email
              </label>

              <div className="login-input-wrapper">
                <User
                  size={16}
                  className="login-input-icon"
                  aria-hidden="true"
                />

                <input
                  id="identifier"
                  type="text"
                  className="input-control login-input"
                  placeholder="Username or email address"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>

              <div className="login-input-wrapper">
                <Lock
                  size={16}
                  className="login-input-icon"
                  aria-hidden="true"
                />

                <input
                  id="password"
                  type="password"
                  className="input-control login-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary login-submit"
            >
              {loading ? (
                <span className="login-loading">
                  <span className="login-spinner" />
                  Signing In...
                </span>
              ) : (
                <>
                  <span>Sign In to PlantCare AI</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <div className="login-demo">
            <p>Want to test immediately?</p>

            <button
              type="button"
              onClick={handleQuickDemo}
              className="btn btn-outline btn-sm login-demo-button"
            >
              <Sparkles size={15} color="var(--accent-fresh)" />
              <span>Fill Test Botanist Credentials</span>
            </button>
          </div>

          <p className="login-register">
            New to PlantCare AI?{' '}
            <NavLink to="/register">
              Create an account
            </NavLink>
          </p>
        </section>
      </main>
    </div>
  );
}
