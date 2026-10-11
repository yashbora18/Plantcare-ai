import React, { useState } from 'react';
import { AlertTriangle, Terminal, ShieldCheck, RefreshCw, ExternalLink } from 'lucide-react';
import { useAiStatus } from '../../context/AiStatusContext';

export default function OfflineAiNotice({ title = 'Local Open-Source AI Required' }) {
  const { aiStatus, checkStatus } = useAiStatus();
  const [checking, setChecking] = useState(false);

  const handleRecheck = async () => {
    setChecking(true);
    await checkStatus();
    setChecking(false);
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1.5px solid var(--status-warning)',
        borderRadius: 'var(--radius-xl)',
        padding: '2rem',
        margin: '1.5rem 0',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div
          style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--status-warning-bg)',
            color: 'var(--status-warning)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AlertTriangle size={22} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>{title}</h3>
          <p style={{ fontSize: '0.88rem', margin: 0 }}>
            PlantCare AI guarantees zero proprietary API dependencies. All inference runs locally on your computer via Ollama.
          </p>
        </div>
      </div>

      <div
        style={{
          background: 'var(--bg-surface-alt)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          margin: '1.25rem 0',
        }}
      >
        <h4 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Terminal size={16} /> Quick Setup Steps (Takes ~2 minutes):
        </h4>
        <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          <li>
            Install Ollama from{' '}
            <a href="https://ollama.com" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              ollama.com <ExternalLink size={12} />
            </a>
          </li>
          <li>
            Start the Ollama server:
            <pre style={{ background: 'var(--bg-base)', padding: '0.4rem 0.75rem', borderRadius: '4px', margin: '0.35rem 0', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
              ollama serve
            </pre>
          </li>
          <li>
            Download the open-weight language model:
            <pre style={{ background: 'var(--bg-base)', padding: '0.4rem 0.75rem', borderRadius: '4px', margin: '0.35rem 0', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
              ollama pull {aiStatus.configured_model || 'llama3.2'}
            </pre>
          </li>
          <li>
            (Optional for leaf image vision diagnosis):
            <pre style={{ background: 'var(--bg-base)', padding: '0.4rem 0.75rem', borderRadius: '4px', margin: '0.35rem 0', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
              ollama pull {aiStatus.configured_vision_model || 'llama3.2-vision'}
            </pre>
          </li>
        </ol>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-fresh)', fontSize: '0.85rem' }}>
          <ShieldCheck size={18} />
          <span>Your plant photos and chats remain 100% private on your machine.</span>
        </div>

        <button
          onClick={handleRecheck}
          disabled={checking}
          className="btn btn-primary btn-sm"
        >
          <RefreshCw size={14} className={checking ? 'spinner' : ''} />
          {checking ? 'Checking Connection...' : 'Check Connection Again'}
        </button>
      </div>
    </div>
  );
}
