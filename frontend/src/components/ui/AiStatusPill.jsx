
import React, { useState } from 'react';
import {
  Cpu,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { useAiStatus } from '../../context/AiStatusContext';

export default function AiStatusPill({ showDetails = true }) {
  const { aiStatus = {}, checkStatus } = useAiStatus();
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const provider = String(
    aiStatus.provider || aiStatus.ai_provider || 'Gemini'
  );

  const configuredModel =
    aiStatus.configured_model ||
    aiStatus.model ||
    'Gemini';

  const isOnline = Boolean(aiStatus.available);
  const modelReady =
    aiStatus.model_ready ?? aiStatus.available ?? false;

  const providerName =
    /ollama/i.test(provider) ? 'Ollama' : 'Gemini';

  const statusLabel = !isOnline
    ? 'AI Offline'
    : modelReady
      ? `${providerName} AI`
      : `${providerName} Unavailable`;

  const handleRefresh = async (event) => {
    event.stopPropagation();
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await checkStatus();
    } catch (error) {
      console.error('Unable to refresh AI status:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="ai-status-wrapper">
      <div className="ai-status-pill">
        <button
          type="button"
          className="ai-status-main"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-label={`AI provider status: ${statusLabel}`}
        >
          <span
            className={`status-dot ${isOnline && modelReady ? 'online' : 'offline'}`}
          />
          <Cpu size={14} aria-hidden="true" />
          <span className="ai-status-label">{statusLabel}</span>
          {showDetails && (
            <ChevronDown
              size={13}
              className="ai-status-chevron"
              aria-hidden="true"
            />
          )}
        </button>

        <button
          type="button"
          className="ai-status-refresh"
          onClick={handleRefresh}
          disabled={isRefreshing}
          title="Refresh AI status"
          aria-label="Refresh AI status"
        >
          <RefreshCw
            size={13}
            className={isRefreshing ? 'spinner' : ''}
          />
        </button>
      </div>

      {isOpen && showDetails && (
        <>
          <button
            type="button"
            className="ai-status-dismiss"
            aria-label="Close AI status details"
            onClick={() => setIsOpen(false)}
          />

          <section
            className="ai-status-details"
            role="dialog"
            aria-label="AI provider details"
          >
            <div className="ai-status-details-heading">
              <Cpu size={19} color="var(--accent-fresh)" />
              <strong>AI Service Status</strong>
            </div>

            <div className="ai-status-detail-row">
              <span>Provider</span>
              <strong>{providerName}</strong>
            </div>

            <div className="ai-status-detail-row">
              <span>Service</span>
              <strong
                className={
                  isOnline && modelReady
                    ? 'ai-status-success'
                    : 'ai-status-error'
                }
              >
                {isOnline && modelReady ? 'Available' : 'Unavailable'}
              </strong>
            </div>

            <div className="ai-status-detail-row">
              <span>Configured model</span>
              <strong className="ai-status-model">
                {configuredModel}
              </strong>
            </div>

            {aiStatus.note && (
              <p className="ai-status-note">{aiStatus.note}</p>
            )}

            {!isOnline || !modelReady ? (
              <div className="ai-status-warning">
                <AlertCircle size={16} />
                <span>
                  The AI service is currently unavailable. Try refreshing
                  the status or retry your request shortly.
                </span>
              </div>
            ) : (
              <div className="ai-status-healthy">
                <CheckCircle2 size={16} />
                <span>The AI service reports that it is available.</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn btn-outline btn-sm ai-status-close"
            >
              Close
            </button>
          </section>
        </>
      )}
    </div>
  );
}
