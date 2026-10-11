
import React from 'react';
import { Menu, Flame, Sun, Moon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import AiStatusPill from '../ui/AiStatusPill';
import { useTheme } from '../../context/ThemeContext';

export default function AppHeader({ onOpenMobileMenu }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="app-header">
      <div className="app-header-left">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="btn-icon app-mobile-menu-toggle"
          id="mobile-nav-toggle"
          aria-label="Open navigation menu"
          aria-controls="app-sidebar"
        >
          <Menu size={21} />
        </button>

        <NavLink
          to="/dashboard"
          className="app-header-brand"
          aria-label="PlantCare AI dashboard"
        >
          <span className="app-header-brand-icon">
            <span aria-hidden="true">🌿</span>
          </span>
          <span>PlantCare AI</span>
        </NavLink>
      </div>

      <div className="app-header-actions">
        <div className="app-header-ai-status">
          <AiStatusPill showDetails={true} />
        </div>

        <NavLink
          to="/challenge"
          className="btn btn-sm btn-earth app-header-challenge"
          title="Hacktoberfest Week 1: Touch Grass"
        >
          <Flame size={16} color="#FBBF24" />
          <span>Touch Grass</span>
        </NavLink>

        <button
          type="button"
          onClick={toggleTheme}
          className="btn-icon app-header-theme-toggle"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
        </button>
      </div>
    </header>
  );
}
