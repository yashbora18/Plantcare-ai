import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '0.75rem', background: 'var(--bg-base)' }}>
        <div className="spinner" style={{ width: '28px', height: '28px', border: '3px solid var(--border-medium)', borderTopColor: 'var(--accent-fresh)', borderRadius: '50%' }} />
        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Loading PlantCare AI...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
