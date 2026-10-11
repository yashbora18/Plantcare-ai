import React from 'react';
import { Menu, Flame, Sun, Moon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import AiStatusPill from '../ui/AiStatusPill';
import { useTheme } from '../../context/ThemeContext';

export default function AppHeader({ onOpenMobileMenu }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      style={{
        height: '68px',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 800,
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Left: Mobile Menu & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onOpenMobileMenu}
          className="btn-icon"
          style={{ display: 'none' }}
          id="mobile-nav-toggle"
          aria-label="Open mobile navigation"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Right: Actions, AI Status, Theme */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <AiStatusPill showDetails={true} />

        <NavLink
          to="/challenge"
          className="btn btn-sm btn-earth"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.85rem',
            borderRadius: 'var(--radius-full)',
          }}
          title="Hacktoberfest Week 1: Touch Grass"
        >
          <Flame size={15} color="#FBBF24" />
          <span>Touch Grass</span>
        </NavLink>

        <button
          onClick={toggleTheme}
          className="btn-icon"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>
    </header>
  );
}
