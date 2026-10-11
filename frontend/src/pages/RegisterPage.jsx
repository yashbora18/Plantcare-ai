
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Leaf,
  Lock,
  User,
  Mail,
  ArrowRight,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/layout/Navbar';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.username.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      addToast('Please complete all required fields.', 'warning');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      addToast('Passwords do not match.', 'error');
      return;
    }

    if (formData.password.length < 6) {
      addToast(
        'Password must be at least 6 characters long.',
        'warning'
      );
      return;
    }

    setLoading(true);

    try {
      await register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        full_name: formData.full_name.trim(),
        password: formData.password,
      });

      addToast(
        'Account created successfully! Please sign in.',
        'success'
      );

      // Registration does not automatically log the user in.
      navigate('/login', {
        replace: true,
        state: {
          registered: true,
          identifier: formData.username.trim(),
        },
      });
    } catch (err) {
      addToast(err.message || 'Registration failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Navbar />

      <main className="login-main">
        <section className="botanical-card login-card">
          <NavLink to="/" className="login-back-home">
            <ArrowLeft size={17} />
            <span>Back to Home</span>
          </NavLink>

          <div className="login-heading">
            <div className="login-icon">
              <Leaf size={26} />
            </div>

            <h2>Join PlantCare AI</h2>

            <p>
              Open-source plant companion • Hacktoberfest 2026
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                Username
              </label>

              <div className="login-input-wrapper">
                <User
                  size={16}
                  className="login-input-icon"
                  aria-hidden="true"
                />

                <input
                  id="username"
                  name="username"
                  type="text"
                  className="input-control login-input"
                  placeholder="e.g. green_thumb"
                  value={formData.username}
                  onChange={handleChange}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address
              </label>

              <div className="login-input-wrapper">
                <Mail
                  size={16}
                  className="login-input-icon"
                  aria-hidden="true"
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  className="input-control login-input"
                  placeholder="gardener@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="full_name">
                Full Name (Optional)
              </label>

              <input
                id="full_name"
                name="full_name"
                type="text"
                className="input-control"
                placeholder="e.g. Jane Green"
                value={formData.full_name}
                onChange={handleChange}
                autoComplete="name"
              />
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
                  name="password"
                  type="password"
                  className="input-control login-input"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label
                className="form-label"
                htmlFor="confirmPassword"
              >
                Confirm Password
              </label>

              <div className="login-input-wrapper">
                <Lock
                  size={16}
                  className="login-input-icon"
                  aria-hidden="true"
                />

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  className="input-control login-input"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <div className="register-security-note">
              <ShieldCheck
                size={17}
                color="var(--accent-fresh)"
                aria-hidden="true"
              />
              <span>
                Passwords are securely hashed with bcrypt.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary login-submit"
            >
              {loading ? (
                <span className="login-loading">
                  <span className="login-spinner" />
                  Creating Account...
                </span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <p className="login-register">
            Already have an account?{' '}
            <NavLink to="/login">Sign in</NavLink>
          </p>
        </section>
      </main>
    </div>
  );
}
