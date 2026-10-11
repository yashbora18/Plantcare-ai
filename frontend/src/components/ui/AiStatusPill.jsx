import React, { useState } from 'react';
import { Cpu, RefreshCw, AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';
import { useAiStatus } from '../../context/AiStatusContext';

export default function AiStatusPill({ showDetails = true }) {
  const { aiStatus, checkStatus } = useAiStatus();
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async (e) => {
    e.stopPropagation();
    setIsRefreshing(true);
    await checkStatus();
    setIsRefreshing(false);
  };

  const isOnline = aiStatus.available;
  const modelReady = aiStatus.model_ready;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="ai-status-pill"
        title="Local AI Inference Status"
        aria-label="Local AI status"
      >
        <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
        <Cpu size={14} />
        <span>
          {isOnline
            ? modelReady
              ? `Ollama: ${aiStatus.configured_model}`
              : 'Ollama: Model Missing'
            : 'AI: Offline'}
        </span>
        <button
          onClick={handleRefresh}
          style={{ background: 'none', border: 'none', padding: '0 2px', display: 'flex', color: 'inherit' }}
          title="Refresh Ollama Status"
        >
          <RefreshCw size={12} className={isRefreshing ? 'spinner' : ''} />
        </button>
        {showDetails && <ChevronDown size={12} style={{ opacity: 0.7 }} />}
      </button>

      {isOpen && showDetails && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '320px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            padding: '1.25rem',
            zIndex: 1000,
            fontSize: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Cpu size={18} color="var(--accent-fresh)" />
            <strong style={{ fontSize: '0.95rem' }}>Local Open-Source AI</strong>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Service:</span>
              <span style={{ fontWeight: 600, color: isOnline ? 'var(--status-healthy)' : 'var(--status-danger)' }}>
                {isOnline ? 'Active (localhost:11434)' : 'Offline / Unreachable'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Text Model:</span>
              <span style={{ fontWeight: 600 }}>{aiStatus.configured_model}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Vision Model:</span>
              <span style={{ fontWeight: 600 }}>{aiStatus.configured_vision_model}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Vision Ready:</span>
              <span style={{ fontWeight: 600, color: aiStatus.vision_ready ? 'var(--status-healthy)' : 'var(--status-warning)' }}>
                {aiStatus.vision_ready ? 'Yes' : 'No (Text fallback active)'}
              </span>
            </div>
          </div>

          {!isOnline && (
            <div
              style={{
                background: 'var(--status-danger-bg)',
                border: '1px solid var(--status-danger)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'var(--status-danger)', marginBottom: '0.35rem' }}>
                <AlertCircle size={14} /> Start Ollama locally:
              </div>
              <code style={{ background: 'rgba(0,0,0,0.1)', padding: '0.15rem 0.35rem', borderRadius: '3px', display: 'block', marginBottom: '0.35rem' }}>
                ollama serve
              </code>
              <code style={{ background: 'rgba(0,0,0,0.1)', padding: '0.15rem 0.35rem', borderRadius: '3px', display: 'block' }}>
                ollama pull {aiStatus.configured_model}
              </code>
            </div>
          )}

          <div style={{ marginTop: '0.85rem', textAlign: 'center' }}>
            <button
              onClick={() => setIsOpen(false)}
              className="btn btn-outline btn-sm"
              style={{ width: '100%' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
