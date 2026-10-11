import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Sprout,
  CheckCircle2,
  Clock,
  Flame,
  Award,
  Compass,
  Stethoscope,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import '../styles/analytics.css';

export default function AnalyticsPage() {
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        const res = await api.getAnalyticsOverview();
        setData(res);
      } catch (err) {
        addToast(err.message || 'Could not load analytics', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading && !data) {
    return (
      <div>
        <div className="skeleton" style={{ height: '40px', width: '280px', marginBottom: '1.5rem' }} />
        <div className="analytics-grid-top">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: '110px' }} />
          ))}
        </div>
      </div>
    );
  }

  // Find max minutes in 7-day activity for scaling bars
  const maxMinutes = Math.max(
    ...(data?.seven_day_activity?.map((d) => d.minutes) || [30]),
    30
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>
            <span>Gardening Analytics & Progress</span>
            <BarChart3 size={28} color="var(--accent-fresh)" />
          </h1>
          <p className="page-subtitle">
            Derived directly from your database records: plant growth, tasks completed, and outdoor minutes.
          </p>
        </div>
      </div>

      {/* Top 4 Metrics */}
      <div className="analytics-grid-top">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--badge-bg)', color: 'var(--accent-fresh)' }}>
            <Sprout size={26} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Plants</div>
            <div className="stat-value">{data?.total_plants || 0}</div>
            <div className="stat-trend">In active collection</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--status-healthy-bg)', color: 'var(--status-healthy)' }}>
            <CheckCircle2 size={26} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Task Completion Rate</div>
            <div className="stat-value">{data?.tasks_completion_rate || 0}%</div>
            <div className="stat-trend">
              {data?.total_tasks_completed || 0} completed / {data?.total_tasks_pending || 0} pending
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--status-info-bg)', color: 'var(--status-info)' }}>
            <Clock size={26} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Outdoor Gardening</div>
            <div className="stat-value">{data?.total_outdoor_minutes || 0} Mins</div>
            <div className="stat-trend">{data?.weekly_outdoor_minutes || 0} mins this week</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--accent-earth-light)', color: 'var(--color-earth-brown)' }}>
            <Flame size={26} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Touch Grass Streak</div>
            <div className="stat-value">{data?.streak_days || 0} Days</div>
            <div className="stat-trend">Consecutive active days</div>
          </div>
        </div>
      </div>

      {/* 2-Column Section */}
      <div className="analytics-two-columns">
        {/* 7-Day Activity Bar Chart */}
        <div className="botanical-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Calendar size={20} color="var(--accent-fresh)" />
            <span>7-Day Outdoor Gardening Activity</span>
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Minutes spent outdoors tending plants and checking soil.
          </p>

          <div className="timeline-bar-chart">
            {data?.seven_day_activity?.map((day, idx) => {
              const heightPercent = Math.max(8, Math.round((day.minutes / maxMinutes) * 100));
              return (
                <div key={idx} className="timeline-bar-column">
                  <span className="bar-value-label">{day.minutes}m</span>
                  <div
                    className="bar-fill-outdoor"
                    style={{ height: `${heightPercent}%` }}
                    title={`${day.date}: ${day.minutes} mins, ${day.tasks_done} tasks`}
                  />
                  <span className="bar-date-label">{day.date.split(' ')[0]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Plant Category Breakdown */}
        <div className="botanical-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Sprout size={20} color="var(--accent-fresh)" />
            <span>Collection Category Breakdown</span>
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Distribution of foliage, edibles, herbs, and succulents.
          </p>

          {data?.category_breakdown?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              Add plants to view category distribution.
            </div>
          ) : (
            <div className="category-progress-list">
              {data?.category_breakdown?.map((cat, idx) => {
                const total = data.total_plants || 1;
                const pct = Math.round((cat.count / total) * 100);
                return (
                  <div key={idx} className="category-row">
                    <div className="category-row-header">
                      <span>{cat.category}</span>
                      <span>{cat.count} ({pct}%)</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Feature Milestones Breakdown */}
      <div className="botanical-card">
        <h3 style={{ marginBottom: '1.25rem' }}>Hacktoberfest 2026 Milestone Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          <div style={{ background: 'var(--bg-surface-alt)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-earth-brown)', marginBottom: '0.35rem' }}>
              <Flame size={18} />
              <strong style={{ fontSize: '0.95rem' }}>Touch Grass Missions</strong>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              {data?.completed_missions_count || 0} / {data?.total_missions_count || 7}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Missions completed with notes</div>
          </div>

          <div style={{ background: 'var(--bg-surface-alt)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-danger)', marginBottom: '0.35rem' }}>
              <Stethoscope size={18} />
              <strong style={{ fontSize: '0.95rem' }}>AI Health Assessments</strong>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              {data?.total_assessments || 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Leaf diagnostics run & saved</div>
          </div>

          <div style={{ background: 'var(--bg-surface-alt)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-forest-green)', marginBottom: '0.35rem' }}>
              <Compass size={18} />
              <strong style={{ fontSize: '0.95rem' }}>Smart Garden Plans</strong>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              {data?.total_garden_plans || 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Permaculture layouts generated</div>
          </div>
        </div>
      </div>
    </div>
  );
}
