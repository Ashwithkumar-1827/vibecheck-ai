import { useState, useEffect } from 'react';
import Head from 'next/head';

/* ============================================================
   VibeCheck AI — Landing Page
   Dark canvas marketing site inspired by DESIGN.md
   ============================================================ */

export default function LandingPage() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Sticky nav scroll listener
  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for scroll reveals
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    const elements = document.querySelectorAll('.reveal');
    elements.forEach((el) => observer.observe(el));
    return () => elements.forEach((el) => observer.unobserve(el));
  }, []);

  const scrollTo = (id) => {
    setMobileNavOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="landing-page">
      <Head>
        <title>VibeCheck AI — Autonomous Self-Healing CI/CD Platform</title>
        <meta
          name="description"
          content="Ship faster with zero downtime. VibeCheck AI detects pipeline failures, diagnoses root causes with AI, patches code autonomously, and opens verified Pull Requests — all in seconds."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* ============ FLOATING NAVIGATION ============ */}
      <nav className={`landing-nav ${navScrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <a href="#" className="nav-logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <img src="/logo.jpg" alt="VibeCheck AI Logo" />
            <span className="nav-logo-text">VibeCheck AI</span>
          </a>

          <ul className="nav-links">
            <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollTo('features'); }}>Features</a></li>
            <li><a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollTo('how-it-works'); }}>How it works</a></li>
            <li><a href="#integrations" onClick={(e) => { e.preventDefault(); scrollTo('integrations'); }}>Integrations</a></li>
          </ul>

          <div className="nav-actions">
            <a href="/" className="btn-primary">Go to console</a>
          </div>

          <button
            className="nav-hamburger"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>
      </nav>

      {/* Mobile Nav Overlay */}
      <div className={`mobile-nav-overlay ${mobileNavOpen ? 'open' : ''}`}>
        <button className="mobile-nav-close" onClick={() => setMobileNavOpen(false)} aria-label="Close menu">✕</button>
        <a href="#features" onClick={(e) => { e.preventDefault(); scrollTo('features'); }}>Features</a>
        <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollTo('how-it-works'); }}>How it works</a>
        <a href="#integrations" onClick={(e) => { e.preventDefault(); scrollTo('integrations'); }}>Integrations</a>
        <a href="/" className="btn-primary btn-primary-lg" style={{ marginTop: 20 }}>Go to console</a>
      </div>

      {/* ============ HERO ============ */}
      <section className="hero-section">
        <div className="landing-container">
          <h1 className="hero-title">
            Your CI/CD<br />
            <span className="gradient-text">heals itself.</span>
          </h1>

          <p className="hero-subtitle">
            VibeCheck AI watches your pipelines, detects failures the moment they happen,
            diagnoses root causes with AI, generates precision patches, and opens verified
            Pull Requests — all autonomously, in seconds.
          </p>

          <div className="hero-actions">
            <a href="/" className="btn-primary btn-primary-lg">
              Go to console
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
            <a href="#how-it-works" className="btn-secondary" onClick={(e) => { e.preventDefault(); scrollTo('how-it-works'); }}>
              See how it works
            </a>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">10x</div>
              <div className="hero-stat-label">Faster Bug Resolution</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">93%</div>
              <div className="hero-stat-label">Auto-Heal Success</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">&lt;30s</div>
              <div className="hero-stat-label">Time to Patch</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">0</div>
              <div className="hero-stat-label">Manual Interventions</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PRODUCT SHOWCASE ============ */}
      <section className="showcase-section">
        <div className="landing-container reveal">
          <div className="showcase-mockup">
            <div className="mockup-chrome">
              <span className="mockup-dot red" />
              <span className="mockup-dot yellow" />
              <span className="mockup-dot green" />
              <span className="mockup-url">vibecheck.ai / pipeline / console</span>
            </div>
            <div className="mockup-body">
              <div className="mockup-terminal">
                <div className="line"><span className="prompt">❯</span> <span className="cmd">vibecheck pipeline run --repo enterprise-api</span></div>
                <div className="line"><span className="info">⬤</span> Cloning repository into sandbox container...</div>
                <div className="line"><span className="info">⬤</span> Running install → build → test pipeline stages...</div>
                <div className="line"><span className="error">✖ STAGE FAILED:</span> test — 3 assertions failed in services/auth.js</div>
                <div className="line"><span className="ai">🧠 AI DIAGNOSIS:</span> Root cause identified → stale JWT secret rotation</div>
                <div className="line"><span className="ai">🧠 PATCH GENERATED:</span> services/auth.js — 12 lines replaced</div>
                <div className="line"><span className="success">✓ PATCH APPLIED</span> → re-running test suite inside sandbox...</div>
                <div className="line"><span className="success">✓ ALL STAGES PASSED</span> — <span className="orange">PR #247 opened</span> on github.com/org/enterprise-api</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="features-section" id="features">
        <div className="landing-container">
          <div className="section-header reveal">
            <div className="section-eyebrow">Capabilities</div>
            <h2 className="section-title">
              Everything your<br />pipeline needs.
            </h2>
            <p className="section-subtitle">
              A complete autonomous DevOps AI platform that detects, diagnoses, patches, and ships — without waking you up at 3 AM.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card reveal">
              <div className="feature-icon violet">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-5"/></svg>
              </div>
              <h3 className="feature-card-title">Smart Pipeline Monitor</h3>
              <p className="feature-card-desc">Real-time surveillance of your CI/CD pipelines. Detects failures across Install, Build, and Test stages the instant they occur.</p>
            </div>

            <div className="feature-card reveal">
              <div className="feature-icon magenta">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/></svg>
              </div>
              <h3 className="feature-card-title">AI Root Cause Analysis</h3>
              <p className="feature-card-desc">Multi-model AI engine powered by OpenAI and Gemini pinpoints exact failure origins with double-pass contextual log analysis.</p>
            </div>

            <div className="feature-card reveal">
              <div className="feature-icon orange">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="m9 15 3-3 3 3"/></svg>
              </div>
              <h3 className="feature-card-title">Precision Code Patching</h3>
              <p className="feature-card-desc">Generates surgical git-style diffs targeting only the broken lines. Fuzzy block-matching ensures patches apply cleanly every time.</p>
            </div>

            <div className="feature-card reveal">
              <div className="feature-icon coral">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m6 8 4 4-4 4"/><line x1="12" y1="16" x2="18" y2="16"/></svg>
              </div>
              <h3 className="feature-card-title">Sandboxed Execution</h3>
              <p className="feature-card-desc">Patches are applied and tested inside isolated Docker containers. Your production environment is never touched until verification passes.</p>
            </div>

            <div className="feature-card reveal">
              <div className="feature-icon blue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
              </div>
              <h3 className="feature-card-title">GitHub Native Integration</h3>
              <p className="feature-card-desc">Full OAuth flow, auto branch creation, PR submissions with unified diffs, diagnostic reports, and verification proofs attached.</p>
            </div>

            <div className="feature-card reveal">
              <div className="feature-icon green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/></svg>
              </div>
              <h3 className="feature-card-title">AI Chat Companion</h3>
              <p className="feature-card-desc">Conversational debugging with your AI copilot. Discuss failures, explore alternatives, then approve fixes — all within the same session.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ GRADIENT SPOTLIGHT CARDS ============ */}
      <section className="spotlight-section">
        <div className="landing-container">
          <div className="spotlight-grid">
            <div className="spotlight-card violet reveal">
              <div className="spotlight-card-icon">🧬</div>
              <h3 className="spotlight-card-title">Multi-Model<br />Fallback Engine</h3>
              <p className="spotlight-card-desc">Cascading AI models with automatic timeout failover. If one model is slow, the next picks up — guaranteed sub-30s diagnosis.</p>
            </div>
            <div className="spotlight-card magenta reveal">
              <div className="spotlight-card-icon">🔒</div>
              <h3 className="spotlight-card-title">Zero-Trust<br />Security</h3>
              <p className="spotlight-card-desc">Path traversal interceptors, static command execution, and no-write server sandboxes. Your code is untouchable by design.</p>
            </div>
            <div className="spotlight-card orange reveal">
              <div className="spotlight-card-icon">⚡</div>
              <h3 className="spotlight-card-title">Real-Time<br />Log Streaming</h3>
              <p className="spotlight-card-desc">Server-Sent Events push every pipeline log line to your browser as it happens. Watch your builds heal live.</p>
            </div>
            <div className="spotlight-card coral reveal">
              <div className="spotlight-card-icon">🚀</div>
              <h3 className="spotlight-card-title">Controlled<br />Promotion</h3>
              <p className="spotlight-card-desc">Twin sandbox verification, unified diff comparison, and one-click PR creation. Ship confidently with full audit trails.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS — TREE STRUCTURE ============ */}
      <section className="workflow-section" id="how-it-works">
        <div className="landing-container">
          <div className="section-header reveal">
            <div className="section-eyebrow">Workflow</div>
            <h2 className="section-title">
              From failure to<br />fix in seconds.
            </h2>
            <p className="section-subtitle">
              VibeCheck AI orchestrates the complete self-healing pipeline — no human needed in the loop.
            </p>
          </div>

          <div className="pipeline-tree reveal">
            {/* Root node */}
            <div className="tree-row tree-root">
              <div className="tree-node root-node">
                <div className="tree-node-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
                <div className="tree-node-content">
                  <span className="tree-node-label">git push origin main</span>
                </div>
              </div>
            </div>

            {/* Connector down */}
            <div className="tree-connector-v" />

            {/* Pipeline stages row */}
            <div className="tree-row tree-branches">
              <div className="tree-branch">
                <div className="tree-connector-h left" />
                <div className="tree-node stage-node install">
                  <div className="tree-node-dot install" />
                  <div className="tree-node-content">
                    <span className="tree-node-title">Install</span>
                    <span className="tree-node-meta">npm install</span>
                  </div>
                  <span className="tree-badge success">✓ PASS</span>
                </div>
              </div>
              <div className="tree-branch">
                <div className="tree-connector-h mid" />
                <div className="tree-node stage-node build">
                  <div className="tree-node-dot build" />
                  <div className="tree-node-content">
                    <span className="tree-node-title">Build</span>
                    <span className="tree-node-meta">npm run build</span>
                  </div>
                  <span className="tree-badge success">✓ PASS</span>
                </div>
              </div>
              <div className="tree-branch">
                <div className="tree-connector-h right" />
                <div className="tree-node stage-node test">
                  <div className="tree-node-dot test-fail" />
                  <div className="tree-node-content">
                    <span className="tree-node-title">Test</span>
                    <span className="tree-node-meta">npm test</span>
                  </div>
                  <span className="tree-badge fail">✖ FAIL</span>
                </div>
              </div>
            </div>

            {/* Connector down from test fail */}
            <div className="tree-connector-v fail-line" />

            {/* AI Diagnosis */}
            <div className="tree-row">
              <div className="tree-node ai-node">
                <div className="tree-node-icon ai-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/></svg>
                </div>
                <div className="tree-node-content">
                  <span className="tree-node-title">AI Diagnosis</span>
                  <span className="tree-node-meta">Root cause: stale JWT secret in auth.js:42</span>
                </div>
              </div>
            </div>

            <div className="tree-connector-v ai-line" />

            {/* Patch & Verify */}
            <div className="tree-row">
              <div className="tree-node patch-node">
                <div className="tree-node-icon patch-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="m9 15 3-3 3 3"/></svg>
                </div>
                <div className="tree-node-content">
                  <span className="tree-node-title">Patch &amp; Verify</span>
                  <span className="tree-node-meta">12 lines replaced → all tests re-passed in sandbox</span>
                </div>
                <span className="tree-badge success">✓ HEALED</span>
              </div>
            </div>

            <div className="tree-connector-v success-line" />

            {/* Ship to GitHub */}
            <div className="tree-row">
              <div className="tree-node ship-node">
                <div className="tree-node-icon ship-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                </div>
                <div className="tree-node-content">
                  <span className="tree-node-title">Ship to GitHub</span>
                  <span className="tree-node-meta">PR #247 opened with diff, diagnosis &amp; proof</span>
                </div>
                <span className="tree-badge merged">⬤ PR OPENED</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ INTEGRATIONS ============ */}
      <section className="integrations-section" id="integrations">
        <div className="landing-container">
          <div className="section-header reveal">
            <div className="section-eyebrow">Integrations</div>
            <h2 className="section-title">
              Works with your stack.
            </h2>
            <p className="section-subtitle">
              VibeCheck connects directly with your existing tools and workflows.
            </p>
          </div>
          <div className="integrations-logos reveal">
            {/* GitHub */}
            <div className="integration-badge">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/></svg>
              GitHub
            </div>
            {/* Docker — whale icon */}
            <div className="integration-badge">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.983 11.078h2.119a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.119a.185.185 0 0 0-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 0 0 .186-.186V3.574a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.186m0 2.716h2.118a.187.187 0 0 0 .186-.186V6.29a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 0 0 .184-.186V6.29a.185.185 0 0 0-.185-.185H8.1a.185.185 0 0 0-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 0 0 .185-.186V6.29a.185.185 0 0 0-.185-.185H5.136a.186.186 0 0 0-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 0 0 .185-.185V9.006a.185.185 0 0 0-.185-.186H5.136a.186.186 0 0 0-.186.185v1.888c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.184.186v1.887c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 0 0-.75.748 11.687 11.687 0 0 0 .692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.228 12.228 0 0 0 3.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z"/></svg>
              Docker
            </div>
            {/* Node.js */}
            <div className="integration-badge">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.998 24c-.321 0-.641-.084-.922-.247l-2.936-1.737c-.438-.245-.224-.332-.08-.383.585-.203.703-.25 1.328-.604.065-.037.151-.023.218.017l2.256 1.339a.294.294 0 0 0 .272 0l8.795-5.076a.277.277 0 0 0 .134-.238V6.921a.282.282 0 0 0-.137-.242l-8.791-5.072a.278.278 0 0 0-.271 0L3.075 6.68a.284.284 0 0 0-.139.241v10.15a.27.27 0 0 0 .138.236l2.409 1.392c1.307.654 2.108-.116 2.108-.89V7.787c0-.142.114-.253.256-.253h1.115c.139 0 .255.112.255.253v10.021c0 1.745-.95 2.745-2.604 2.745-.508 0-.909 0-2.026-.551L2.28 18.675a1.857 1.857 0 0 1-.922-1.604V6.921c0-.659.353-1.275.922-1.603L11.075.242a1.928 1.928 0 0 1 1.846 0l8.794 5.076c.57.329.924.944.924 1.603v10.15a1.86 1.86 0 0 1-.924 1.604l-8.794 5.078a1.842 1.842 0 0 1-.923.247z"/></svg>
              Node.js
            </div>
            {/* Python */}
            <div className="integration-badge">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.35.12-.33.2-.32.28-.3.35-.27.43-.25.52-.21.6-.18.67-.14.74-.09.81-.06.87-.02.93.01.97.05.72.09m-6.48 9.77l-.93.01-.83.05-.74.09-.66.13-.56.17-.47.21-.38.25-.3.28-.22.3-.16.32-.1.33-.05.33-.01.33v3.78l.05.55.13.46.21.37.27.29.34.22.39.17.43.13.46.09.49.06.5.03h4.23l.53-.02.49-.05.44-.1.38-.15.33-.21.28-.27.22-.34.17-.41.12-.49.07-.56.03-.63V15l-.08-.63-.19-.52-.3-.42-.42-.32-.54-.24-.66-.16-.79-.1-.92-.04h-2.96l.04-.36.12-.29.21-.23.3-.18.39-.13.48-.08.57-.04.64-.01h4.03m-.3 8.38l.37-.02.33-.05.28-.09.22-.13.17-.17.12-.2.08-.22.04-.23.01-.24-.01-.23-.04-.22-.08-.2-.12-.17-.17-.14-.22-.11-.28-.07-.33-.04-.37-.01h-2.47l-.37.01-.33.04-.28.07-.22.11-.17.14-.12.17-.08.2-.04.22-.01.23.01.24.04.23.08.22.12.2.17.17.22.13.28.09.33.05.37.02h2.47z"/></svg>
              Python
            </div>
            {/* OpenAI */}
            <div className="integration-badge">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.998 5.998 0 0 0-3.998 2.9 6.042 6.042 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/></svg>
              OpenAI
            </div>
            {/* Google Gemini */}
            <div className="integration-badge">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z"/></svg>
              Gemini
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="cta-section">
        <div className="landing-container reveal">
          <h2 className="cta-title">
            Stop firefighting.<br />
            <span className="gradient-text">Start shipping.</span>
          </h2>
          <p className="cta-desc">
            Join thousands of developers who sleep soundly knowing their pipelines heal themselves.
          </p>
          <div className="cta-actions">
            <a href="/" className="btn-primary btn-primary-lg">
              Go to console
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
            <a href="#" className="btn-secondary">Talk to Sales</a>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="footer-brand-logo">
              <img src="/logo.jpg" alt="VibeCheck AI" />
              <span className="footer-brand-name">VibeCheck AI</span>
            </div>
            <p className="footer-brand-desc">
              Autonomous self-healing CI/CD pipeline platform powered by AI. Detect, diagnose, patch, and ship — automatically.
            </p>
          </div>
          <div>
            <div className="footer-col-title">Product</div>
            <ul className="footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#how-it-works">How it works</a></li>
              <li><a href="#integrations">Integrations</a></li>
              <li><a href="/">Console</a></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-title">Developers</div>
            <ul className="footer-links">
              <li><a href="#">Documentation</a></li>
              <li><a href="#">API Reference</a></li>
              <li><a href="#">Changelog</a></li>
              <li><a href="#">Status</a></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-title">Company</div>
            <ul className="footer-links">
              <li><a href="#">About</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span className="footer-bottom-text">© 2026 VibeCheck AI. All rights reserved.</span>
          <div className="footer-socials">
            <a href="#" className="footer-social-btn" aria-label="Twitter/X">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="#" className="footer-social-btn" aria-label="GitHub">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/></svg>
            </a>
            <a href="#" className="footer-social-btn" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
