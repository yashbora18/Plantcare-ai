
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Leaf,
  Sun,
  Moon,
  ArrowRight,
  Flame,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import AiStatusPill from '../ui/AiStatusPill';

export default function Navbar() {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="landing-nav">
      <NavLink
        to="/"
        className="brand-logo"
        onClick={closeMenu}
        aria-label="PlantCare AI home"
      >
        <span className="brand-logo-icon">
          <Leaf size={20} />
        </span>
        <span className="brand-logo-name">PlantCare AI</span>
        <span className="brand-tag">Open-Source AI</span>
      </NavLink>

      <button
        type="button"
        className="landing-mobile-toggle"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={menuOpen}
        aria-controls="landing-nav-links"
      >
        {menuOpen ? <X size={23} /> : <Menu size={23} />}
      </button>

      {menuOpen && (
        <button
          type="button"
          className="landing-nav-backdrop"
          onClick={closeMenu}
          aria-label="Close navigation menu"
        />
      )}

      <nav
        id="landing-nav-links"
        className={`landing-nav-links${menuOpen ? ' is-open' : ''}`}
        aria-label="Main navigation"
      >
        <a href="/#features" onClick={closeMenu}>Features</a>
        <a href="/#privacy" onClick={closeMenu}>Why Local AI?</a>

        <a
          href="/#touch-grass"
          className="landing-touch-grass-link"
          onClick={closeMenu}
        >
          <Flame size={16} color="var(--color-earth-brown)" />
          <span>Touch Grass</span>
        </a>

        <div className="landing-nav-ai-status">
          <AiStatusPill showDetails={false} />
        </div>

        <button
          type="button"
          onClick={() => {
            toggleTheme();
            closeMenu();
          }}
          className="btn-icon landing-nav-theme"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
        </button>

        {isAuthenticated ? (
          <NavLink
            to="/dashboard"
            className="btn btn-primary btn-sm landing-nav-cta"
            onClick={closeMenu}
          >
            <span>Open Dashboard</span>
            <ArrowRight size={15} />
          </NavLink>
        ) : (
          <div className="landing-nav-auth">
            <NavLink
              to="/login"
              className="btn btn-outline btn-sm"
              onClick={closeMenu}
            >
              Sign In
            </NavLink>

            <NavLink
              to="/register"
              className="btn btn-primary btn-sm"
              onClick={closeMenu}
            >
              Start Growing
            </NavLink>
          </div>
        )}
      </nav>
    </header>
  );
}
