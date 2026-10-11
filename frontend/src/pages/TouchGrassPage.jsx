import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Flame,
  CheckCircle2,
  Clock,
  Award,
  Sparkles,
  Camera,
  Play,
  Pause,
  RotateCcw,
  X,
  Plus,
  ShieldCheck,
  TrendingUp,
  Leaf,
  Info,
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import '../styles/touchgrass.css';

export default function TouchGrassPage() {
  const { addToast } = useToast();
  const [missions, setMissions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Zen "Put Your Phone Away" Mode
  const [zenModeOpen, setZenModeOpen] = useState(false);
  const [zenSeconds, setZenSeconds] = useState(900); // 15 mins default
  const [zenActive, setZenActive] = useState(false);

  // Complete Mission Modal
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [evidencePhotoFile, setEvidencePhotoFile] = useState(null);
  const [submittingMission, setSubmittingMission] = useState(false);

  // Quick Activity Log
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logMinutes, setLogMinutes] = useState(15);
  const [logActivityType, setLogActivityType] = useState('Soil & Garden Inspection');
  const [logNotes, setLogNotes] = useState('');

  const loadChallengeData = async () => {
    try {
      setLoading(true);
      const [missionsData, summaryData] = await Promise.all([
        api.getMissions(),
        api.getChallengeSummary(),
      ]);
      setMissions(missionsData);
      setSummary(summaryData);
    } catch (err) {
      addToast(err.message || 'Could not load challenge data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallengeData();
  }, []);

  // Zen Mode Countdown Timer
  useEffect(() => {
    let interval = null;
    if (zenActive && zenSeconds > 0) {
      interval = setInterval(() => {
        setZenSeconds((prev) => prev - 1);
      }, 1000);
    } else if (zenSeconds === 0 && zenActive) {
      setZenActive(false);
      addToast('Zen Outdoor Session Complete! Welcome back.', 'success');
      // Automatically prompt to log the 15 minutes!
      api.logOutdoorActivity({
        minutes_spent: 15,
        activity_type: 'Zen Screen-Free Garden Time',
        notes: 'Completed 15-minute Put Your Phone Away session.',
      }).then(() => loadChallengeData());
    }
    return () => clearInterval(interval);
  }, [zenActive, zenSeconds]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOpenCompleteModal = (mission) => {
    setSelectedMission(mission);
    setCompletionNotes('');
    setEvidencePhotoFile(null);
    setCompleteModalOpen(true);
  };

  const handleConfirmCompleteMission = async (e) => {
    e.preventDefault();
    if (!selectedMission) return;

    setSubmittingMission(true);
    try {
      let photoUrl = null;
      if (evidencePhotoFile) {
        const uploadRes = await api.uploadChallengeEvidence(evidencePhotoFile);
        photoUrl = uploadRes.evidence_photo_url;
      }

      await api.completeMission(selectedMission.id, {
        notes: completionNotes,
        evidence_photo_url: photoUrl,
      });

      addToast(`Mission Completed: ${selectedMission.title}!`, 'success');
      setCompleteModalOpen(false);
      loadChallengeData();
    } catch (err) {
      addToast(err.message || 'Failed to complete mission', 'error');
    } finally {
      setSubmittingMission(false);
    }
  };

  const handleQuickLogMinutes = async (minutes) => {
    try {
      await api.logOutdoorActivity({
        minutes_spent: minutes,
        activity_type: 'Hands-on Plant Care',
        notes: `Quick logged ${minutes} outdoor gardening minutes`,
      });
      addToast(`Logged +${minutes} minutes outdoors!`, 'success');
      loadChallengeData();
    } catch (err) {
      addToast(err.message || 'Failed to log minutes', 'error');
    }
  };

  const handleCustomLogSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.logOutdoorActivity({
        minutes_spent: parseInt(logMinutes, 10),
        activity_type: logActivityType,
        notes: logNotes,
      });
      addToast(`Logged +${logMinutes} minutes outdoors!`, 'success');
      setLogModalOpen(false);
      setLogNotes('');
      loadChallengeData();
    } catch (err) {
      addToast(err.message || 'Failed to log minutes', 'error');
    }
  };

  return (
    <div>
      {/* Hero Banner */}
      <div className="touch-grass-hero">
        <div>
          <span className="badge badge-earth" style={{ marginBottom: '0.75rem', background: 'rgba(255,255,255,0.2)', color: '#FFFFFF' }}>
            Hacktoberfest 2026 Week 1 Core Challenge
          </span>
          <h1>Touch Grass Challenge</h1>
          <p>
            "Less Scrolling. More Growing." Take a break from the IDE and screens. Touch your soil, inspect leaf growth, and care for real plants outdoors.
          </p>

          <div style={{ display: 'flex', gap: '0.85rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setZenSeconds(900);
                setZenActive(true);
                setZenModeOpen(true);
              }}
              className="btn btn-secondary btn-lg"
              style={{ fontWeight: 700 }}
            >
              <Play size={18} /> Put Your Phone Away Mode
            </button>

            <button
              onClick={() => setLogModalOpen(true)}
              className="btn btn-outline btn-lg"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.3)' }}
            >
              <Plus size={18} /> Log Outdoor Minutes
            </button>
          </div>
        </div>

        {/* Milestone Badge preview */}
        <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.2)', padding: '1.5rem 2rem', borderRadius: 'var(--radius-xl)', backdropFilter: 'blur(8px)' }}>
          <Award size={48} color="#FBBF24" style={{ margin: '0 auto 0.5rem' }} />
          <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>Soil Whisperer Badge</div>
          <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)' }}>
            Hacktoberfest 2026 Week 1
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="challenge-metrics-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--badge-bg)', color: 'var(--accent-fresh)' }}>
            <Flame size={26} color="var(--color-earth-brown)" />
          </div>
          <div className="stat-content">
            <div className="stat-label">Current Streak</div>
            <div className="stat-value">{summary?.current_streak_days || 0} Days</div>
            <div className="stat-trend">Longest: {summary?.longest_streak_days || 0} days</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--status-healthy-bg)', color: 'var(--status-healthy)' }}>
            <Clock size={26} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Weekly Outdoor Time</div>
            <div className="stat-value">{summary?.weekly_logged_minutes || 0} Mins</div>
            <div className="stat-trend">Goal: {summary?.weekly_target_minutes || 120} mins</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--accent-earth-light)', color: 'var(--color-earth-brown)' }}>
            <TrendingUp size={26} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Weekly Goal Progress</div>
            <div className="stat-value">{summary?.weekly_progress_pct || 0}%</div>
            <div className="stat-trend">
              {summary?.weekly_logged_minutes >= summary?.weekly_target_minutes
                ? 'Target achieved!'
                : `${(summary?.weekly_target_minutes || 120) - (summary?.weekly_logged_minutes || 0)} mins remaining`}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--status-info-bg)', color: 'var(--status-info)' }}>
            <CheckCircle2 size={26} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Missions Completed</div>
            <div className="stat-value">
              {summary?.completed_missions || 0} / {summary?.total_missions || 7}
            </div>
            <div className="stat-trend">Real gardening actions</div>
          </div>
        </div>
      </div>

      {/* Quick Add Minutes Bar */}
      <div className="botanical-card" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <strong style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Clock size={18} color="var(--accent-fresh)" /> Quick Log Outdoor Gardening Time:
          </strong>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Spent time with your plants just now? Add it to your streak in one click:
          </span>
        </div>

        <div className="quick-log-chips">
          <button onClick={() => handleQuickLogMinutes(10)} className="quick-log-chip">+10 Mins</button>
          <button onClick={() => handleQuickLogMinutes(15)} className="quick-log-chip">+15 Mins</button>
          <button onClick={() => handleQuickLogMinutes(30)} className="quick-log-chip">+30 Mins</button>
          <button onClick={() => handleQuickLogMinutes(45)} className="quick-log-chip">+45 Mins</button>
          <button onClick={() => setLogModalOpen(true)} className="btn btn-outline btn-sm">Custom</button>
        </div>
      </div>

      {/* Daily Real-World Gardening Missions */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>Daily Real-World Gardening Missions</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Hands-on botanical activities for Hacktoberfest Week 1. Self-reported with optional field notes and photos.
        </p>
      </div>

      {loading ? (
        <div className="missions-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton" style={{ height: '320px' }} />
          ))}
        </div>
      ) : (
        <div className="missions-grid">
          {missions.map((mission) => (
            <div
              key={mission.id}
              className={`mission-card ${mission.is_completed ? 'completed' : ''}`}
            >
              <div className="mission-header-row">
                <span className={`badge ${mission.is_completed ? 'badge-healthy' : 'badge-leaf'}`}>
                  {mission.is_completed ? 'Completed ✓' : `${mission.estimated_minutes} Mins`}
                </span>
                <span className="badge badge-earth">{mission.badge_name}</span>
              </div>

              <h3 className="mission-title">{mission.title}</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                {mission.description}
              </p>

              <div className="mission-instructions">
                {mission.instructions}
              </div>

              {mission.sustainable_tip && (
                <div className="mission-sustainable-tip">
                  <Leaf size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Eco Tip:</strong> {mission.sustainable_tip}
                  </div>
                </div>
              )}

              {mission.user_notes && (
                <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Your Recorded Notes:</span>
                  <div style={{ fontStyle: 'italic', marginTop: '0.2rem' }}>"{mission.user_notes}"</div>
                </div>
              )}

              <div className="mission-footer">
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {mission.is_completed
                    ? `Recorded on ${new Date(mission.completed_at).toLocaleDateString()}`
                    : 'Self-reported outdoor challenge'}
                </span>

                {!mission.is_completed ? (
                  <button
                    onClick={() => handleOpenCompleteModal(mission)}
                    className="btn btn-primary btn-sm"
                  >
                    <CheckCircle2 size={15} /> Complete Mission
                  </button>
                ) : (
                  <span className="badge badge-healthy" style={{ padding: '0.35rem 0.65rem' }}>
                    Mission Accomplished
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zen "Put Your Phone Away" Modal Mode */}
      {zenModeOpen && createPortal(
        <div className="zen-overlay" role="dialog" aria-modal="true" aria-labelledby="zen-mode-title">
          <div className="zen-leaf-pulsing">
            <Leaf size={44} />
          </div>

          <h2 id="zen-mode-title" className="zen-title">Put Your Screen Away</h2>
          <p className="zen-subtitle">
            Your plants don't live in code. Step into natural light, take three deep breaths, feel the garden breeze, and inspect your plants with your own eyes.
          </p>

          <div className="zen-timer-display">
            {formatTimer(zenSeconds)}
          </div>

          <div className="zen-tip-box">
            "Observe without photographing. Listen to the outdoor birds and feel the soil temperature."
          </div>

          <div className="zen-session-controls">
            <button
              onClick={() => setZenActive(!zenActive)}
              className="btn btn-primary btn-lg"
              style={{ padding: '0.85rem 2rem' }}
            >
              {zenActive ? <Pause size={18} /> : <Play size={18} />}
              <span>{zenActive ? 'Pause Session' : 'Resume Timer'}</span>
            </button>

            
<button
  type="button"
  onClick={() => {
    setZenActive(false);
    setZenModeOpen(false);
  }}
  className="btn btn-outline btn-lg zen-return-button"
>
  <span>Return to App</span>
</button>

          </div>
        </div>,
        document.body
      )}

      {/* Complete Mission Modal */}
      {completeModalOpen && selectedMission && (
        <div className="modal-overlay" onClick={() => setCompleteModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <CheckCircle2 size={22} color="var(--status-healthy)" />
                <span>Complete Mission: {selectedMission.title}</span>
              </h3>
              <button onClick={() => setCompleteModalOpen(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmCompleteMission}>
              <div className="modal-body">
                <div style={{ background: 'var(--badge-bg)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--accent-fresh)' }}>
                  <Info size={16} style={{ display: 'inline', marginRight: '6px' }} />
                  PlantCare AI uses self-reported honesty. Tell us what you observed or did in your real garden!
                </div>

                <div className="form-group">
                  <label className="form-label">Your Real-World Gardening Notes *</label>
                  <textarea
                    className="textarea-control"
                    rows="3"
                    placeholder="e.g. Checked 3 outdoor containers; tomatoes were slightly dry, soil felt warm, spotted two ladybugs on the basil leaves..."
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Optional Photo Evidence</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEvidencePhotoFile(e.target.files[0])}
                    className="input-control"
                  />
                  <span className="form-hint">
                    Upload an optional snap of your garden bed, seedling, or soil test.
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setCompleteModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMission}
                  className="btn btn-primary"
                >
                  {submittingMission ? 'Recording Mission...' : 'Log Mission Completion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Log Minutes Modal */}
      {logModalOpen && (
        <div className="modal-overlay" onClick={() => setLogModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <Clock size={22} color="var(--accent-fresh)" />
                <span>Log Outdoor Gardening Minutes</span>
              </h3>
              <button onClick={() => setLogModalOpen(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCustomLogSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Minutes Spent Outside</label>
                  <input
                    type="number"
                    min="1"
                    max="720"
                    className="input-control"
                    value={logMinutes}
                    onChange={(e) => setLogMinutes(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Activity Type</label>
                  <select
                    className="select-control"
                    value={logActivityType}
                    onChange={(e) => setLogActivityType(e.target.value)}
                  >
                    <option value="Soil & Moisture Testing">Soil & Moisture Testing</option>
                    <option value="Watering & Foliage Wash">Watering & Foliage Wash</option>
                    <option value="Seed Sowing & Transplanting">Seed Sowing & Transplanting</option>
                    <option value="Pruning & Weed Clearing">Pruning & Weed Clearing</option>
                    <option value="Compost Care">Compost Turning & Aeration</option>
                    <option value="Pollinator Watch">Pollinator & Biodiversity Watch</option>
                    <option value="General Garden Time">General Screen-Free Garden Time</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes (Optional)</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="e.g. Cleared dry leaves from terrace pots"
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setLogModalOpen(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Log Minutes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
