
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  Stethoscope,
  Bot,
  Compass,
  CalendarDays,
  Flame,
  BarChart3,
  LogOut,
  Sun,
  Moon,
  Leaf,
  X,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/plants', label: 'My Plants', icon: Sprout },
    { to: '/doctor', label: 'AI Plant Doctor', icon: Stethoscope },
    { to: '/assistant', label: 'Gardening AI', icon: Bot },
    { to: '/planner', label: 'Garden Planner', icon: Compass },
    { to: '/calendar', label: 'Care Calendar', icon: CalendarDays },
    {
      to: '/challenge',
      label: 'Touch Grass',
      icon: Flame,
      highlight: true,
      badge: 'Week 1',
    },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const handleLogout = () => {
    onClose();
    logout();
    addToast('You have been logged out.', 'info');
    navigate('/');
  };

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={onClose}
          aria-label="Close navigation menu"
          tabIndex={0}
        />
      )}

      <aside
        id="app-sidebar"
        className={`app-sidebar${isOpen ? ' is-open' : ''}`}
        aria-label="Main navigation"
        aria-hidden={undefined}
      >
        <div className="sidebar-brand">
          <NavLink
            to="/dashboard"
            className="sidebar-brand-link"
            onClick={onClose}
          >
            <span className="sidebar-brand-icon">
              <Leaf size={19} />
            </span>
            <span>PlantCare AI</span>
          </NavLink>

          <button
            type="button"
            className="sidebar-mobile-close"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            <X size={21} />
          </button>
        </div>

        <div className="sidebar-tagline">
          Less Scrolling. More Growing.
        </div>

        <nav className="sidebar-nav">
          {navLinks.map(({ to, label, icon: Icon, highlight, badge }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  'sidebar-nav-link',
                  isActive ? 'active' : '',
                  highlight ? 'highlight' : '',
                ]
                  .filter(Boolean)
                  .join(' ')
              }
            >
              <Icon
                size={19}
                aria-hidden="true"
                className={highlight ? 'sidebar-highlight-icon' : ''}
              />
              <span className="sidebar-nav-label">{label}</span>
              {badge && <span className="sidebar-nav-badge">{badge}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar" aria-hidden="true">
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>

            <div className="sidebar-user-details">
              <div className="sidebar-user-name">
                {user?.full_name || user?.username || 'User'}
              </div>
              <div className="sidebar-user-handle">
                @{user?.username || 'user'}
              </div>
            </div>

            <button
              type="button"
              className="sidebar-theme-toggle"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
            </button>
          </div>

          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
