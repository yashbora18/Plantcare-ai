import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Plus,
  Trash2,
  Sprout,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAiStatus } from '../context/AiStatusContext';
import OfflineAiNotice from '../components/common/OfflineAiNotice';
import '../styles/assistant.css';

const DEFAULT_PROMPTS = [
  'How do I test if my plant soil is hydrophobic?',
  'What are the best companion herbs for a sunny balcony container?',
  'How can I naturally prevent aphids without toxic chemical sprays?',
  'Why are my indoor plant leaves turning yellow at the bottom?',
];

export default function GardeningAssistantPage() {
  const { addToast } = useToast();
  const { aiStatus } = useAiStatus();

  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [userPlants, setUserPlants] = useState([]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  // Load initial sessions & user plants
  useEffect(() => {
    async function init() {
      try {
        const [sessList, plants] = await Promise.all([
          api.getChatSessions(),
          api.getPlants(),
        ]);
        setSessions(sessList);
        setUserPlants(plants);
        if (sessList.length > 0) {
          loadSession(sessList[0].id);
        }
      } catch (err) {
        console.error('Failed to init assistant:', err);
      }
    }
    init();
  }, []);

  const loadSession = async (sessionId) => {
    try {
      setCurrentSessionId(sessionId);
      const detail = await api.getSessionDetail(sessionId);
      setMessages(detail.messages || []);
    } catch (err) {
      addToast(err.message || 'Could not load conversation', 'error');
    }
  };

  const handleStartNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    try {
      await api.deleteChatSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        handleStartNewChat();
      }
      addToast('Conversation deleted', 'info');
    } catch (err) {
      addToast(err.message || 'Failed to delete chat', 'error');
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    if (!aiStatus.available) {
      addToast('Local Ollama AI service is offline. Please start Ollama locally.', 'error');
      return;
    }

    const tempUserMsg = {
      id: Date.now(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInputMessage('');
    setSending(true);

    try {
      const response = await api.chatWithAssistant({
        content: text,
        session_id: currentSessionId,
        include_plant_context: true,
      });

      const asstMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.reply,
        suggested_followups: response.suggested_followups,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, asstMsg]);

      // Refresh sessions list
      const updatedSessions = await api.getChatSessions();
      setSessions(updatedSessions);
      if (!currentSessionId && updatedSessions.length > 0) {
        setCurrentSessionId(updatedSessions[0].id);
      }
    } catch (err) {
      addToast(err.message || 'Failed to generate advice. Check local AI.', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h1>
            <span>AI Gardening Assistant</span>
            <Bot size={28} color="var(--accent-fresh)" />
          </h1>
          <p className="page-subtitle">
            Local open-weight companion with context awareness of your active garden.
          </p>
        </div>

        <button onClick={handleStartNewChat} className="btn btn-outline btn-sm">
          <Plus size={16} /> New Conversation
        </button>
      </div>

      {!aiStatus.available && (
        <OfflineAiNotice title="Start Ollama to Chat with Gardening AI" />
      )}

      <div className="assistant-layout">
        {/* Left: Chat Sessions List */}
        <aside className="assistant-sidebar">
          <div className="sidebar-header">
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              Past Conversations
            </span>
            <button
              onClick={handleStartNewChat}
              className="btn btn-primary btn-sm"
              style={{ padding: '0.3rem 0.65rem' }}
              title="New Chat"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="session-list">
            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No saved chats yet. Ask your first gardening question!
              </div>
            ) : (
              sessions.map((sess) => (
                <div
                  key={sess.id}
                  onClick={() => loadSession(sess.id)}
                  className={`session-item ${currentSessionId === sess.id ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                    <MessageSquare size={14} style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {sess.title}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(e, sess.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: '2px' }}
                    title="Delete session"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Right: Active Chat Panel */}
        <main className="assistant-chat-panel">
          {/* Panel Top Header */}
          <div className="chat-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--badge-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-fresh)',
                }}
              >
                <Bot size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  PlantCare AI ({aiStatus.configured_model})
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Tagline: "Less Scrolling. More Growing."
                </div>
              </div>
            </div>

            {userPlants.length > 0 && (
              <span className="badge badge-leaf" title="AI includes your plants in reasoning">
                <Sprout size={12} />
                <span>Aware of {userPlants.length} plants in your collection</span>
              </span>
            )}
          </div>

          {/* Messages Container */}
          <div className="chat-messages-container">
            {messages.length === 0 ? (
              <div style={{ margin: 'auto', textAlign: 'center', maxWidth: '560px', padding: '2rem 1rem' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--badge-bg)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-fresh)',
                    marginBottom: '1rem',
                  }}
                >
                  <Bot size={32} />
                </div>
                <h3 style={{ marginBottom: '0.5rem' }}>Ask Anything About Your Garden</h3>
                <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  From seedling care and moisture testing to companion planting and organic pest defense.
                </p>

                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.65rem', textTransform: 'uppercase' }}>
                    Suggested Gardening Prompts:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {DEFAULT_PROMPTS.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(prompt)}
                        className="btn btn-outline btn-sm"
                        style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                      >
                        <Sparkles size={14} color="var(--accent-fresh)" />
                        <span>{prompt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`chat-bubble-wrap ${msg.role}`}>
                  <div className={`chat-avatar ${msg.role}`}>
                    {msg.role === 'user' ? 'You' : <Bot size={16} />}
                  </div>

                  <div>
                    <div className="chat-bubble-content">
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>

                      {/* Disclaimer tag for AI message */}
                      {msg.role === 'assistant' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.65rem', fontSize: '0.72rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.45rem' }}>
                          <ShieldCheck size={12} color="var(--accent-fresh)" />
                          <span>Generated locally via {aiStatus.configured_model} • Verify safety before applying remedies.</span>
                        </div>
                      )}
                    </div>

                    {/* Suggested Follow-ups */}
                    {msg.role === 'assistant' && msg.suggested_followups?.length > 0 && (
                      <div className="suggested-chips-row">
                        {msg.suggested_followups.map((q, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSendMessage(q)}
                            className="suggested-chip"
                          >
                            + {q}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {sending && (
              <div className="chat-bubble-wrap assistant">
                <div className="chat-avatar assistant">
                  <Bot size={16} />
                </div>
                <div className="chat-bubble-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="spinner" style={{ width: '14px', height: '14px', border: '2px solid var(--border-medium)', borderTopColor: 'var(--accent-fresh)', borderRadius: '50%' }} />
                    <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Thinking locally...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Input Field */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="chat-input-bar"
          >
            <input
              type="text"
              className="chat-input-field"
              placeholder="Ask about soil, pests, watering, companion plants..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={sending}
            />

            <button
              type="submit"
              disabled={sending || !inputMessage.trim()}
              className="btn btn-primary"
              style={{ borderRadius: 'var(--radius-full)', padding: '0.75rem 1.25rem' }}
              aria-label="Send message"
            >
              <Send size={16} />
              <span>Send</span>
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
