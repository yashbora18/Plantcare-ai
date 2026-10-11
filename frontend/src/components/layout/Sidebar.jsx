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
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    addToast('You have been logged out.', 'info');
    navigate('/');
  };

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

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 900,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      <aside
        style={{
          width: '260px',
          backgroundColor: 'var(--bg-sidebar)',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 950,
          flexShrink: 0,
          transition: 'transform var(--transition-normal)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          ...(isOpen
            ? { transform: 'translateX(0)', position: 'fixed' }
            : { '@media (max-width: 900px)': { transform: 'translateX(-100%)', position: 'fixed' } }),
        }}
        className={isOpen ? 'sidebar-open' : ''}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '1.5rem 1.25rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <NavLink
            to="/dashboard"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              color: '#FFFFFF',
              textDecoration: 'none',
              fontFamily: 'var(--font-heading)',
              fontSize: '1.25rem',
              fontWeight: 800,
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-fresh-leaf)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#111713',
              }}
            >
              <Leaf size={18} />
            </div>
            <span>PlantCare AI</span>
          </NavLink>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            style={{
              display: 'none',
              color: 'rgba(255,255,255,0.7)',
              padding: '0.25rem',
            }}
            className="mobile-close-btn"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tagline Badge */}
        <div style={{ padding: '0.65rem 1.25rem 0.25rem' }}>
          <div
            style={{
              fontSize: '0.72rem',
              color: 'rgba(255, 255, 255, 0.65)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Less Scrolling. More Growing.
          </div>
        </div>

        {/* Navigation Links */}
        <nav
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem 0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
          }}
        >
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.78)',
                  backgroundColor: isActive
                    ? 'var(--bg-sidebar-active)'
                    : item.highlight
                    ? 'rgba(101, 166, 111, 0.15)'
                    : 'transparent',
                  border: item.highlight && !isActive
                    ? '1px dashed rgba(101, 166, 111, 0.45)'
                    : '1px solid transparent',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.92rem',
                  textDecoration: 'none',
                  transition: 'all var(--transition-fast)',
                })}
              >
                <Icon size={18} color={item.highlight ? 'var(--color-fresh-leaf)' : 'currentColor'} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      backgroundColor: 'var(--color-fresh-leaf)',
                      color: '#0F3323',
                      padding: '0.15rem 0.45rem',
                      borderRadius: 'var(--radius-full)',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Controls */}
        <div
          style={{
            padding: '1.25rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            backgroundColor: 'rgba(0, 0, 0, 0.15)',
          }}
        >
          {/* User info */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-earth-brown)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                }}
              >
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {user?.full_name || user?.username}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                  @{user?.username}
                </div>
              </div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#FFFFFF',
                width: '30px',
                height: '30px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            </button>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'rgba(255, 255, 255, 0.75)',
              fontSize: '0.85rem',
              padding: '0.45rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              width: '100%',
              justifyContent: 'flex-start',
            }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
