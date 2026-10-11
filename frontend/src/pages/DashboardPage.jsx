import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Sprout,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Flame,
  Plus,
  Stethoscope,
  Compass,
  ArrowRight,
  TrendingUp,
  Droplets,
  Clock,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import '../styles/dashboard.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [stats, setStats] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [dashStats, tasks] = await Promise.all([
        api.getDashboardStats(),
        api.getTasks({ filter_by: 'today' }),
      ]);
      setStats(dashStats);
      setTodayTasks(tasks);
    } catch (err) {
      addToast(err.message || 'Could not load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCompleteTask = async (taskId) => {
    try {
      await api.completeTask(taskId, { notes: 'Completed from dashboard quick check' });
      addToast('Care task marked as complete!', 'success');
      loadDashboard();
    } catch (err) {
      addToast(err.message || 'Could not complete task', 'error');
    }
  };

  if (loading && !stats) {
    return (
      <div>
        <div className="skeleton" style={{ height: '40px', width: '320px', marginBottom: '1.5rem' }} />
        <div className="dashboard-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: '110px' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Title & Greeting */}
      <div className="page-header">
        <div>
          <h1>
            <span>Welcome back, {user?.full_name?.split(' ')[0] || user?.username}!</span>
            <Sprout size={28} color="var(--accent-fresh)" />
          </h1>
          <p className="page-subtitle">
            Here is your live garden summary. "Less Scrolling. More Growing."
          </p>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <NavLink to="/plants" className="btn btn-primary btn-sm">
            <Plus size={16} /> Add Plant
          </NavLink>
          <NavLink to="/doctor" className="btn btn-outline btn-sm">
            <Stethoscope size={16} /> Diagnose Leaf
          </NavLink>
        </div>
      </div>

      {/* Touch Grass Highlight Banner */}
      <div className="touch-grass-banner">
        <div className="banner-content">
          <span className="banner-badge">Hacktoberfest 2026 Week 1 Challenge</span>
          <h2>Touch Grass & Grow Plants</h2>
          <p>
            You have logged{' '}
            <strong>{stats?.weekly_outdoor_minutes || 0}</strong> of{' '}
            <strong>{stats?.weekly_outdoor_target || 120}</strong> outdoor gardening minutes this week.
            Put your phone away and inspect your soil!
          </p>
          <div className="banner-action-row">
            <NavLink to="/challenge" className="btn btn-secondary btn-sm" style={{ fontWeight: 700 }}>
              <Flame size={16} color="#FFFFFF" /> Open Touch Grass Challenge
            </NavLink>
          </div>
        </div>

        <div className="banner-stats">
          <div>
            <div className="banner-stat-num">{stats?.current_streak || 0}</div>
            <div className="banner-stat-desc">Day Streak</div>
          </div>
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '1.5rem' }}>
            <div className="banner-stat-num">{stats?.outdoor_progress_pct || 0}%</div>
            <div className="banner-stat-desc">Weekly Goal</div>
          </div>
        </div>
      </div>

      {/* Four Core Metric Cards */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--badge-bg)', color: 'var(--accent-fresh)' }}>
            <Sprout size={26} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Plants</div>
            <div className="stat-value">{stats?.total_plants || 0}</div>
            <div className="stat-trend">In your botanical collection</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--status-warning-bg)', color: 'var(--status-warning)' }}>
            <AlertTriangle size={26} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Needs Attention</div>
            <div className="stat-value" style={{ color: stats?.plants_needing_attention > 0 ? 'var(--status-warning)' : 'inherit' }}>
              {stats?.plants_needing_attention || 0}
            </div>
            <div className="stat-trend">Require health check or soil adjustment</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--status-info-bg)', color: 'var(--status-info)' }}>
            <Droplets size={26} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Care Due Today</div>
            <div className="stat-value">{stats?.tasks_due_today || 0}</div>
            <div className="stat-trend">{stats?.upcoming_tasks_count || 0} scheduled upcoming</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--status-healthy-bg)', color: 'var(--status-healthy)' }}>
            <CheckCircle2 size={26} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Completed (7d)</div>
            <div className="stat-value">{stats?.completed_tasks_recently || 0}</div>
            <div className="stat-trend">Plant tasks checked off</div>
          </div>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="dashboard-main-columns">
        {/* Left Column: Today's Tasks */}
        <div className="botanical-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={20} color="var(--accent-fresh)" />
                <span>Today's Plant Care Tasks</span>
              </h3>
              <p style={{ fontSize: '0.85rem' }}>Check off tasks to advance plant watering cycles.</p>
            </div>
            <NavLink to="/calendar" className="btn btn-outline btn-sm">
              <span>View Calendar</span>
              <ArrowRight size={14} />
            </NavLink>
          </div>

          {todayTasks.length === 0 ? (
            <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
              <div className="empty-icon">
                <CheckCircle2 size={28} />
              </div>
              <h4>All Caught Up For Today!</h4>
              <p>Your plants have been watered and cared for. Step outside and enjoy the fresh air!</p>
              <NavLink to="/challenge" className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }}>
                Complete an Outdoor Mission
              </NavLink>
            </div>
          ) : (
            <div>
              {todayTasks.map((t) => (
                <div key={t.id} className="task-item-card">
                  <div className="task-left">
                    <button
                      onClick={() => handleCompleteTask(t.id)}
                      className={`task-check-circle ${t.is_completed ? 'completed' : ''}`}
                      title="Mark Complete"
                      aria-label="Mark task complete"
                    >
                      {t.is_completed && <CheckCircle2 size={12} />}
                    </button>
                    <div>
                      <div className="task-title-text">{t.title}</div>
                      <div className="task-plant-sub">
                        {t.plant_name ? `Plant: ${t.plant_name}` : 'General Garden'} • {t.task_type}
                      </div>
                    </div>
                  </div>

                  <span className="badge badge-leaf">{t.task_type}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: AI & Garden Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quick Shortcuts */}
          <div className="botanical-card">
            <h3 style={{ marginBottom: '1rem', fontSize: '1.15rem' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <NavLink to="/plants" className="action-pill-btn">
                <Sprout size={18} color="var(--accent-fresh)" />
                <span>Manage My Plants Collection</span>
              </NavLink>

              <NavLink to="/doctor" className="action-pill-btn">
                <Stethoscope size={18} color="var(--status-danger)" />
                <span>Diagnose Plant Health with AI Doctor</span>
              </NavLink>

              <NavLink to="/assistant" className="action-pill-btn">
                <Sprout size={18} color="var(--color-earth-brown)" />
                <span>Chat with AI Gardening Companion</span>
              </NavLink>

              <NavLink to="/planner" className="action-pill-btn">
                <Compass size={18} color="var(--color-forest-green)" />
                <span>Generate Smart Garden Plan</span>
              </NavLink>
            </div>
          </div>

          {/* Local AI Status Card */}
          <div className="botanical-card" style={{ background: 'var(--bg-surface-alt)' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Sprout size={18} color="var(--accent-fresh)" />
              <span>Zero-Cloud Open-Source AI</span>
            </h4>
            <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
              PlantCare AI operates with local open-weight language models via Ollama. No personal garden data leaves your computer.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status:</span>
              <span style={{ fontWeight: 700, color: stats?.ai_status?.available ? 'var(--status-healthy)' : 'var(--status-warning)' }}>
                {stats?.ai_status?.available ? 'Online (Local Inference)' : 'Offline (Setup Required)'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
