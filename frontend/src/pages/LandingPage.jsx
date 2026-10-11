import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Sprout,
  Leaf,
  ShieldCheck,
  Cpu,
  Flame,
  CheckCircle2,
  ArrowRight,
  Stethoscope,
  Compass,
  Calendar,
  Sparkles,
  ExternalLink,
  Code2,
  Heart,
  Droplets,
  Sun,
  Eye,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import '../styles/landing.css';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh' }}>
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-pill">
          <Flame size={15} color="var(--color-earth-brown)" />
          <span>Hacktoberfest 2026 Week 1 Challenge: Touch Grass</span>
        </div>

        <h1 className="hero-title">
          Your Plants Have a Plan. <br />
          <span>Now You Do Too.</span>
        </h1>

        <p className="hero-subtitle">
          An open-source gardening companion powered by local, private AI. We believe the screen
          should be the shortest part of your day:{' '}
          <strong style={{ color: 'var(--text-primary)' }}>"Less Scrolling. More Growing."</strong>
        </p>

        <div className="hero-actions">
          <NavLink
            to={isAuthenticated ? '/dashboard' : '/register'}
            className="btn btn-primary btn-lg"
          >
            <Sprout size={20} />
            <span>Start Growing</span>
          </NavLink>

          <a href="#features" className="btn btn-outline btn-lg">
            <span>Explore Features</span>
          </a>
        </div>

        {/* Dashboard Preview */}
        <div className="hero-preview">
          <div className="preview-bar">
            <div className="preview-dot" />
            <div className="preview-dot" />
            <div className="preview-dot" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
              PlantCare AI — Live Dashboard Preview
            </span>
          </div>

          <div className="preview-body">
            <div className="botanical-card" style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="badge badge-leaf">Today's Care</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>2 Tasks Due</span>
              </div>
              <h4 style={{ marginBottom: '0.4rem' }}>Water Sweet Basil & Monstera</h4>
              <p style={{ fontSize: '0.85rem' }}>Soil moisture check recommended before bottom-watering.</p>
            </div>

            <div className="botanical-card" style={{ textAlign: 'left', background: 'linear-gradient(135deg, rgba(23, 77, 53, 0.08), rgba(101, 166, 111, 0.15))' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="badge badge-earth">Touch Grass Challenge</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-earth-brown)' }}>75 / 120 Mins</span>
              </div>
              <h4 style={{ marginBottom: '0.4rem' }}>Mission: Soil Finger Test</h4>
              <p style={{ fontSize: '0.85rem' }}>Step outside, touch the soil 2 inches deep, and log field observations.</p>
            </div>

            <div className="botanical-card" style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="badge badge-healthy">Local Open-Source AI</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--status-healthy)' }}>100% On-Device</span>
              </div>
              <h4 style={{ marginBottom: '0.4rem' }}>Ollama Local Inference</h4>
              <p style={{ fontSize: '0.85rem' }}>Leaf diagnosis and companion planting run on your machine without cloud APIs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="open-source-section">
        <div className="section-inner">
          <div className="section-header">
            <div className="section-badge">Purpose-Built Gardening Companion</div>
            <h2>Tools Designed to Push You Outside</h2>
            <p>Every feature guides you back to hands-on soil, sunlight, and living plants.</p>
          </div>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon-wrap">
                <Stethoscope size={24} />
              </div>
              <h3>AI Plant Doctor</h3>
              <p style={{ marginTop: '0.5rem' }}>
                Snap a leaf photo or describe symptoms. Your locally running open-weight model provides structured diagnosis, organic remedies, and safe preventive practices.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap">
                <Flame size={24} color="var(--color-earth-brown)" />
              </div>
              <h3>Touch Grass Challenge</h3>
              <p style={{ marginTop: '0.5rem' }}>
                Hacktoberfest Week 1 core experience. Daily missions, weekly outdoor minutes targets, streak tracking, and our unique "Put Your Phone Away" Zen mode.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap">
                <Compass size={24} />
              </div>
              <h3>Smart Garden Planner</h3>
              <p style={{ marginTop: '0.5rem' }}>
                Tell us your balcony or yard size, sunlight hours, and USDA zone. Get a personalized planting layout, companion planting pairs, and seasonal timelines.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap">
                <Calendar size={24} />
              </div>
              <h3>Care Calendar & Task Manager</h3>
              <p style={{ marginTop: '0.5rem' }}>
                Synchronized watering, repotting, and pruning cycles. Checking off a task advances recurring plant schedules automatically.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap">
                <Cpu size={24} />
              </div>
              <h3>Context-Aware AI Assistant</h3>
              <p style={{ marginTop: '0.5rem' }}>
                Chat with an open-source model that actually knows what you're growing. Get concise, actionable instructions with suggested follow-up questions.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap">
                <ShieldCheck size={24} />
              </div>
              <h3>100% Privacy & Local Inference</h3>
              <p style={{ marginTop: '0.5rem' }}>
                No plant photos or gardening queries are ever sent to commercial data-harvesting AI APIs. Everything runs on your machine via Ollama.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Open-Source AI Section */}
      <section id="privacy" style={{ padding: '5rem 2rem', background: 'var(--bg-base)' }}>
        <div className="section-inner" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div className="section-header">
            <div className="section-badge">Transparency & Sovereignty</div>
            <h2>Why Open-Source AI Matters for Gardening</h2>
            <p>
              Gardening is about self-reliance, sustainability, and real living organisms. Your plant care tools should embody those exact values.
            </p>
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-xl)',
              padding: '2.5rem',
              boxShadow: 'var(--shadow-md)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem',
            }}
          >
            <div>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-forest-green)', marginBottom: '0.5rem' }}>
                <ShieldCheck size={20} /> Complete Data Privacy
              </h4>
              <p style={{ fontSize: '0.9rem' }}>
                When running Ollama locally, your home garden photos and soil questions never leave your computer. You retain complete ownership of your personal garden data.
              </p>
            </div>

            <div>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-forest-green)', marginBottom: '0.5rem' }}>
                <Cpu size={20} /> Model Freedom & Customization
              </h4>
              <p style={{ fontSize: '0.9rem' }}>
                Swap between Llama 3.2, Qwen 2.5, or specialized agricultural models with a single environment variable change. No proprietary vendor lock-in.
              </p>
            </div>

            <div>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-forest-green)', marginBottom: '0.5rem' }}>
                <Sprout size={20} /> Zero Cost Inference
              </h4>
              <p style={{ fontSize: '0.9rem' }}>
                Never pay per-token fees or worry about API rate limits cutting off your gardening advice right when your tomato plants need emergency diagnosis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hacktoberfest Grass Challenge Section */}
      <section id="touch-grass" className="grass-challenge-section">
        <div className="grass-box">
          <div>
            <span className="badge badge-earth" style={{ marginBottom: '1rem' }}>
              Hacktoberfest 2026 Week 1
            </span>
            <h2 style={{ fontSize: '2.4rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              "Touch Grass" Challenge
            </h2>
            <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              Software developers spend too much time staring at monitors. PlantCare AI provides structured real-world missions that count your actual time outside with plants.
            </p>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle2 size={18} color="var(--status-healthy)" />
                <span>Daily 10-20 minute hands-on outdoor gardening missions</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle2 size={18} color="var(--status-healthy)" />
                <span>Weekly outdoor minutes target (default 120 mins)</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle2 size={18} color="var(--status-healthy)" />
                <span>"Put Your Phone Away" Zen Mode with minimal screen interaction</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle2 size={18} color="var(--status-healthy)" />
                <span>Honest self-reported logging with optional photo evidence</span>
              </li>
            </ul>

            <NavLink to="/challenge" className="btn btn-primary btn-lg">
              <Flame size={18} /> Join the Challenge
            </NavLink>
          </div>

          <div className="mission-preview-list">
            <div className="mission-preview-item">
              <Droplets size={22} color="var(--accent-fresh)" />
              <div>
                <strong>Soil Finger Moisture Test</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>10 mins • Soil Care</div>
              </div>
            </div>

            <div className="mission-preview-item">
              <Eye size={22} color="var(--color-earth-brown)" />
              <div>
                <strong>Outdoor Growth Observation</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>15 mins • Record 3 changes</div>
              </div>
            </div>

            <div className="mission-preview-item">
              <Sprout size={22} color="var(--status-healthy)" />
              <div>
                <strong>Seed Sowing & Transplant</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>20 mins • Real dirt on hands</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div>
            <div className="brand-logo" style={{ marginBottom: '0.75rem' }}>
              <Leaf size={22} />
              <span>PlantCare AI</span>
            </div>
            <p style={{ fontSize: '0.88rem', maxWidth: '300px' }}>
              Open-source AI gardening companion built for Hacktoberfest 2026. Less scrolling. More growing.
            </p>
          </div>

          <div className="footer-col">
            <h4>Application</h4>
            <ul className="footer-links">
              <li><NavLink to="/dashboard">Dashboard</NavLink></li>
              <li><NavLink to="/plants">My Plants</NavLink></li>
              <li><NavLink to="/doctor">AI Plant Doctor</NavLink></li>
              <li><NavLink to="/challenge">Touch Grass</NavLink></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Technology</h4>
            <ul className="footer-links">
              <li><a href="https://ollama.com" target="_blank" rel="noreferrer">Ollama Local AI</a></li>
              <li><a href="/docs" target="_blank">FastAPI Backend</a></li>
              <li><a href="https://react.dev" target="_blank" rel="noreferrer">React + Vite</a></li>
              <li><a href="https://hacktoberfest.com" target="_blank" rel="noreferrer">Hacktoberfest 2026</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Open Source</h4>
            <ul className="footer-links">
              <li><a href="https://github.com" target="_blank" rel="noreferrer">GitHub Repository</a></li>
              <li><NavLink to="/register">Create Account</NavLink></li>
              <li><a href="#privacy">Privacy Model</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          PlantCare A • Hacktoberfest 2026 Week 1 • Built with passion for open-source AI and green living.
        </div>
      </footer>
    </div>
  );
}
