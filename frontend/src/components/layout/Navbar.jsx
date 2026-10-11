import React from 'react';
import { NavLink } from 'react-router-dom';
import { Leaf, Sun, Moon, ArrowRight, Flame } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import AiStatusPill from '../ui/AiStatusPill';

export default function Navbar() {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="landing-nav">
      <NavLink to="/" className="brand-logo">
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-fresh-leaf)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#111713',
          }}
        >
          <Leaf size={20} />
        </div>
        <span>PlantCare AI</span>
        <span className="brand-tag">Open-Source AI</span>
      </NavLink>

      <nav className="landing-nav-links">
        <a href="#features">Features</a>
        <a href="#privacy">Why Local AI?</a>
        <a href="#touch-grass" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <Flame size={15} color="var(--color-earth-brown)" /> Touch Grass
        </a>
        <AiStatusPill showDetails={false} />

        <button
          onClick={toggleTheme}
          className="btn-icon"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {isAuthenticated ? (
          <NavLink to="/dashboard" className="btn btn-primary btn-sm">
            <span>Open Dashboard</span>
            <ArrowRight size={15} />
          </NavLink>
        ) : (
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <NavLink to="/login" className="btn btn-outline btn-sm">
              Sign In
            </NavLink>
            <NavLink to="/register" className="btn btn-primary btn-sm">
              <span>Start Growing</span>
            </NavLink>
          </div>
        )}
      </nav>
    </header>
  );
}
