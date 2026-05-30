import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import BrandLoader from '../components/BrandLoader';
import { Dna, Shield, Zap, Rocket } from 'lucide-react';

/* ============================================================
   VibeCheck AI - Landing Page
   Dark canvas marketing site inspired by DESIGN.md
   ============================================================ */

export default function LandingPage() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isStartupLoading, setIsStartupLoading] = useState(true);

  // Interactive Terminal State
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState([
    { type: 'info', text: 'Welcome to VibeCheck AI Interactive Console.' },
    { type: 'info', text: "Type 'help' to view available commands or 'run' to execute a live simulation." }
  ]);
  const [isSimulating, setIsSimulating] = useState(false);
  
  const terminalContainerRef = useRef(null);

  // Auto-scroll ONLY the terminal log container internally, without moving the webpage scrollbar
  useEffect(() => {
    if (terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  const handleCommandSubmit = (e) => {
    e.preventDefault();
    if (isSimulating) return;

    const trimmedInput = terminalInput.trim();
    if (!trimmedInput) return;

    const commandLower = trimmedInput.toLowerCase();
    const newLogs = [...terminalLogs, { type: 'command', text: `❯ ${trimmedInput}` }];
    setTerminalInput('');

    if (commandLower === 'clear') {
      setTerminalLogs([
        { type: 'info', text: 'Welcome to VibeCheck AI Interactive Console.' },
        { type: 'info', text: "Type 'help' to view available commands or 'run' to execute a live simulation." }
      ]);
      return;
    }

    if (commandLower === 'help') {
      setTerminalLogs([
        ...newLogs,
        { type: 'output', text: 'Available commands:' },
        { type: 'output', text: '  about    - What is VibeCheck AI?' },
        { type: 'output', text: '  stack    - Core engineering technologies.' },
        { type: 'output', text: '  builder  - Info about the developer.' },
        { type: 'output', text: '  run      - Run live self-correcting pipeline simulation!' },
        { type: 'output', text: '  clear    - Clear terminal logs.' },
        { type: 'output', text: '  help     - Show this help menu.' }
      ]);
      return;
    }

    if (commandLower === 'about') {
      setTerminalLogs([
        ...newLogs,
        { type: 'output', text: 'VibeCheck AI is an autonomous, self-correcting developer agent.' },
        { type: 'output', text: 'It monitors your CI/CD pipeline, isolates failures in secure sandboxes,' },
        { type: 'output', text: 'diagnoses root causes with double-pass AI, generates surgical AST patches,' },
        { type: 'output', text: 'and promotes clean commits to GitHub Pull Requests automatically.' }
      ]);
      return;
    }

    if (commandLower === 'stack') {
      setTerminalLogs([
        ...newLogs,
        { type: 'output', text: 'Core Technology Stack:' },
        { type: 'output', text: '  - Language: JavaScript / Node.js' },
        { type: 'output', text: '  - Frontend: React / Next.js (Tailwind CSS)' },
        { type: 'output', text: '  - AI Engine: Google Gemini AI / OpenAI API' },
        { type: 'output', text: '  - Containerization: Secure sandboxed Docker containers' },
        { type: 'output', text: '  - Version Control: GitHub Developer APIs & webhooks' }
      ]);
      return;
    }

    if (commandLower === 'builder') {
      setTerminalLogs([
        ...newLogs,
        { type: 'output', text: 'Builder Credentials:' },
        { type: 'output', text: '  Name: Madishetti Ashwith Kumar' },
        { type: 'output', text: '  Role: Machine Learning Engineer' },
        { type: 'output', text: '  Portfolio: Python ETL pipelines, Spark/Databricks ML models,' },
        { type: 'output', text: '             LangGraph agentic loops, and Microsoft Azure cloud solutions.' },
        { type: 'output', text: '  LinkedIn: https://www.linkedin.com/in/madishetti-ashwith-kumar' }
      ]);
      return;
    }

    if (commandLower === 'run') {
      setIsSimulating(true);
      
      const simulationSteps = [
        { delay: 800, type: 'info', text: '⬤ Cloning repository into sandbox container...' },
        { delay: 2000, type: 'info', text: '⬤ Running install → build → test pipeline stages...' },
        { delay: 3500, type: 'error', text: '✖ STAGE FAILED: test: 3 assertions failed in services/auth.js' },
        { delay: 5000, type: 'ai', text: 'AI DIAGNOSIS: Root cause identified → stale JWT secret rotation' },
        { delay: 6500, type: 'ai', text: 'PATCH GENERATED: services/auth.js: 12 lines replaced' },
        { delay: 8000, type: 'success', text: '✓ PATCH APPLIED → re-running test suite inside sandbox...' },
        { delay: 9500, type: 'success', text: '✓ ALL STAGES PASSED  -  PR #247 opened on github.com/org/enterprise-api' }
      ];

      let runningLogs = [...newLogs];
      setTerminalLogs(runningLogs);

      simulationSteps.forEach((step, idx) => {
        setTimeout(() => {
          runningLogs = [...runningLogs, { type: step.type, text: step.text }];
          setTerminalLogs(runningLogs);
          if (idx === simulationSteps.length - 1) {
            setIsSimulating(false);
          }
        }, step.delay);
      });
      return;
    }

    // Default unknown command
    setTerminalLogs([
      ...newLogs,
      { type: 'error', text: `command not found: ${trimmedInput}. Type 'help' to see available commands.` }
    ]);
  };

  useEffect(() => {
    const hasLoadedBefore = sessionStorage.getItem('vibecheck_loader_shown');
    if (hasLoadedBefore) {
      setIsStartupLoading(false);
    } else {
      const timer = setTimeout(() => {
        setIsStartupLoading(false);
        sessionStorage.setItem('vibecheck_loader_shown', 'true');
      }, 3182.7 + 400); // 3182.7ms duration + 400ms fadeout transition
      return () => clearTimeout(timer);
    }
  }, []);

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
      {isStartupLoading && <BrandLoader />}
      <Head>
        <title>VibeCheck AI | Autonomous Self-Correcting CI/CD Platform</title>
        <meta
          name="description"
          content="Ship faster with zero downtime. VibeCheck AI detects pipeline failures, diagnoses root causes with AI, patches code autonomously, and opens verified Pull Requests - all in seconds."
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
            <li><Link href="/how-it-works">How it works</Link></li>
            <li><Link href="/flow">Flow</Link></li>
            <li><Link href="/about">About</Link></li>
          </ul>

          <div className="nav-actions">
            <Link href="/console/repositories" className="btn-primary">Go to console</Link>
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
        <Link href="/how-it-works" onClick={() => setMobileNavOpen(false)}>How it works</Link>
        <Link href="/flow" onClick={() => setMobileNavOpen(false)}>Flow</Link>
        <Link href="/about" onClick={() => setMobileNavOpen(false)}>About</Link>
        <Link href="/console/repositories" className="btn-primary btn-primary-lg" style={{ marginTop: 20 }} onClick={() => setMobileNavOpen(false)}>Go to console</Link>
      </div>

      {/* ============ HERO ============ */}
      <section className="hero-section">
        <div className="landing-container">
          <h1 className="hero-title">
            Your CI/CD<br />
            <span className="gradient-text">repairs itself.</span>
          </h1>

          <p className="hero-subtitle">
            VibeCheck AI watches your pipelines, detects failures the moment they happen,
            diagnoses root causes with AI, generates precision patches, and opens verified
            Pull Requests - all autonomously, in seconds.
          </p>

          <div className="hero-actions">
            <a href="/console/repositories" className="btn-primary btn-primary-lg">
              Go to console
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
            <a href="/how-it-works" className="btn-secondary">
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
              <span className="mockup-url">vibecheck.ai / repositories / console</span>
            </div>
            <div 
              ref={terminalContainerRef}
              className="mockup-body" 
              onClick={() => document.getElementById('terminal-hidden-input')?.focus()}
              style={{ 
                maxHeight: '420px', 
                overflowY: 'auto', 
                cursor: 'text', 
                padding: '24px', 
                display: 'block',
                textAlign: 'left'
              }}
            >
              <div className="mockup-terminal" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: '13px', lineHeight: '1.7' }}>
                {terminalLogs.map((log, idx) => (
                  <div key={idx} className="line" style={{ marginBottom: '4px', whiteSpace: 'pre-wrap' }}>
                    {log.type === 'command' ? (
                      <>
                        <span className="prompt" style={{ color: '#6a4cf5', marginRight: '8px', fontWeight: 'bold' }}>❯</span>
                        <span className="cmd" style={{ color: '#fff', fontWeight: '600' }}>{log.text.substring(2)}</span>
                      </>
                    ) : log.type === 'error' ? (
                      <span className="error" style={{ color: '#ff5577' }}>{log.text}</span>
                    ) : log.type === 'ai' ? (
                      <span className="ai" style={{ color: '#d44df0' }}>{log.text}</span>
                    ) : log.type === 'success' ? (
                      <span className="success" style={{ color: '#22c55e' }}>{log.text}</span>
                    ) : log.type === 'info' ? (
                      <span className="info" style={{ color: '#0099ff' }}>{log.text}</span>
                    ) : (
                      <span style={{ color: '#a1a1aa' }}>{log.text}</span>
                    )}
                  </div>
                ))}
                
                {/* Active input prompt line */}
                {!isSimulating && (
                  <form onSubmit={handleCommandSubmit} style={{ display: 'flex', alignItems: 'center', width: '100%', marginTop: '6px' }}>
                    <span className="prompt" style={{ color: '#6a4cf5', marginRight: '8px', fontWeight: 'bold', userSelect: 'none' }}>❯</span>
                    <input 
                      id="terminal-hidden-input"
                      type="text"
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      placeholder="Type 'help' to start..."
                      style={{ 
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#fff',
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        fontSize: '13px',
                        flexGrow: 1,
                        padding: 0,
                        margin: 0,
                        caretColor: '#22c55e'
                      }}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                    />
                  </form>
                )}

                {isSimulating && (
                  <div className="line" style={{ opacity: 0.6, fontStyle: 'italic', marginTop: '6px', color: '#a1a1aa' }}>
                    <span className="prompt" style={{ color: '#6a4cf5', marginRight: '8px', fontWeight: 'bold' }}>❯</span>
                    Pipeline executing...
                  </div>
                )}
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
              A complete autonomous DevOps AI platform that detects, diagnoses, patches, and ships, without waking you up at 3 AM.
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
              <p className="feature-card-desc">Conversational debugging with your AI copilot. Discuss failures, explore alternatives, then approve fixes, all within the same session.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ GRADIENT SPOTLIGHT CARDS ============ */}
      <section className="spotlight-section">
        <div className="landing-container">
          <div className="spotlight-grid">
            <div className="spotlight-card violet reveal">
              <div className="spotlight-card-icon">
                <Dna className="w-12 h-12 stroke-[1.5] text-white" />
              </div>
              <h3 className="spotlight-card-title">Multi-Model<br />Fallback Engine</h3>
              <p className="spotlight-card-desc">Cascading AI models with automatic timeout failover. If one model is slow, the next picks up, guaranteeing sub-30s diagnosis.</p>
            </div>
            <div className="spotlight-card magenta reveal">
              <div className="spotlight-card-icon">
                <Shield className="w-12 h-12 stroke-[1.5] text-white" />
              </div>
              <h3 className="spotlight-card-title">Zero-Trust<br />Security</h3>
              <p className="spotlight-card-desc">Path traversal interceptors, static command execution, and no-write server sandboxes. Your code is untouchable by design.</p>
            </div>
            <div className="spotlight-card orange reveal">
              <div className="spotlight-card-icon">
                <Zap className="w-12 h-12 stroke-[1.5] text-white" />
              </div>
              <h3 className="spotlight-card-title">Real-Time<br />Log Streaming</h3>
              <p className="spotlight-card-desc">Server-Sent Events push every pipeline log line to your browser as it happens. Watch your builds heal live.</p>
            </div>
            <div className="spotlight-card coral reveal">
              <div className="spotlight-card-icon">
                <Rocket className="w-12 h-12 stroke-[1.5] text-white" />
              </div>
              <h3 className="spotlight-card-title">Controlled<br />Promotion</h3>
              <p className="spotlight-card-desc">Twin sandbox verification, unified diff comparison, and one-click PR creation. Ship confidently with full audit trails.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS - TREE STRUCTURE ============ */}
      <section className="workflow-section" id="how-it-works">
        <div className="landing-container">
          <div className="section-header reveal">
            <div className="section-eyebrow">Workflow</div>
            <h2 className="section-title">
              From failure to<br />fix in seconds.
            </h2>
            <p className="section-subtitle">
              VibeCheck AI orchestrates the complete self-correcting pipeline, with no human needed in the loop.
            </p>
          </div>

          <div className="w-full max-w-[800px] mx-auto py-8 px-2 reveal">
            <svg 
              id="landing-svg-flowchart" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 800 660"
              className="w-full h-auto"
            >
              <defs>
                {/* Flowchart Arrow Markers */}
                <marker id="arrow-gray" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#52525b" />
                </marker>
                <marker id="arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
                </marker>
                <marker id="arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f43f5e" />
                </marker>
                
                {/* Neon Pathway Gradients */}
                <linearGradient id="grad-purple-blue" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#d44df0" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <linearGradient id="grad-blue-green" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                <linearGradient id="grad-red-purple" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#d44df0" />
                </linearGradient>
              </defs>

              {/* Connecting Flow lines */}
              {/* Line from git push trigger down to branches */}
              <path d="M 400,100 L 400,125" fill="none" stroke="#52525b" strokeWidth="2" />
              {/* Horizontal branch line */}
              <path d="M 160,125 L 640,125" fill="none" stroke="#52525b" strokeWidth="2" />
              {/* Vertical branch lines */}
              <path d="M 160,125 L 160,150" fill="none" stroke="#52525b" strokeWidth="2" markerEnd="url(#arrow-gray)" />
              <path d="M 400,125 L 400,150" fill="none" stroke="#52525b" strokeWidth="2" markerEnd="url(#arrow-gray)" />
              <path d="M 640,125 L 640,150" fill="none" stroke="#52525b" strokeWidth="2" markerEnd="url(#arrow-gray)" />

              {/* Red-to-purple fail connection from Test fail down to AI Diagnosis */}
              <path d="M 640,220 L 640,250 A 15,15 0 0 1 625,265 L 415,265 A 15,15 0 0 0 400,280 L 400,290" fill="none" stroke="url(#grad-red-purple)" strokeWidth="2" markerEnd="url(#arrow-red)" />
              
              {/* Trace Fail Label on pathway */}
              <g>
                <rect x="465" y="253" width="110" height="20" rx="4" fill="#450a0a" stroke="#f43f5e" strokeWidth="1" />
                <text x="520" y="265" fill="#fb7185" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">YES (TRACE FAIL)</text>
              </g>

              {/* Pathway from Diagnosis to Patch & Verify */}
              <path d="M 400,370 L 400,410" fill="none" stroke="url(#grad-purple-blue)" strokeWidth="2" markerEnd="url(#arrow-gray)" strokeDasharray="4,4" />

              {/* Pathway from Patch to Ship */}
              <path d="M 400,490 L 400,530" fill="none" stroke="url(#grad-blue-green)" strokeWidth="2" markerEnd="url(#arrow-green)" />

              {/* Diagram Cards & Nodes */}
              {/* Node 1: Git push trigger */}
              <g>
                <rect x="240" y="30" width="320" height="70" rx="12" fill="#0f0f13" stroke="#6366f1" strokeWidth="1.5" />
                <circle cx="280" cy="65" r="16" fill="rgba(99, 102, 241, 0.15)" stroke="rgba(99, 102, 241, 0.4)" strokeWidth="1" />
                <polygon points="277,59 287,65 277,71" fill="#818cf8" />
                <text x="312" y="61" fill="#ffffff" fontSize="9" fontFamily="monospace" fontWeight="bold" letterSpacing="0.5">GIT TRIGGER</text>
                <text x="312" y="76" fill="#a1a1aa" fontSize="11" fontFamily="monospace" fontWeight="500">git push origin main</text>
              </g>

              {/* Node 2: Install Stage */}
              <g>
                <rect x="60" y="150" width="200" height="70" rx="12" fill="#0f0f13" stroke="#27272a" strokeWidth="1.5" />
                <circle cx="85" cy="185" r="5" fill="#10b981" />
                <text x="102" y="178" fill="#ffffff" fontSize="11" fontFamily="sans-serif" fontWeight="bold">Install</text>
                <text x="102" y="195" fill="#71717a" fontSize="9.5" fontFamily="monospace">npm install</text>
                <rect x="195" y="172" width="50" height="18" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
                <text x="220" y="184" fill="#34d399" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">✓ PASS</text>
              </g>

              {/* Node 3: Build Stage */}
              <g>
                <rect x="300" y="150" width="200" height="70" rx="12" fill="#0f0f13" stroke="#27272a" strokeWidth="1.5" />
                <circle cx="325" cy="185" r="5" fill="#10b981" />
                <text x="342" y="178" fill="#ffffff" fontSize="11" fontFamily="sans-serif" fontWeight="bold">Build</text>
                <text x="342" y="195" fill="#71717a" fontSize="9.5" fontFamily="monospace">npm run build</text>
                <rect x="435" y="172" width="50" height="18" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
                <text x="460" y="184" fill="#34d399" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">✓ PASS</text>
              </g>

              {/* Node 4: Test Stage (FAIL) */}
              <g>
                <rect x="540" y="150" width="200" height="70" rx="12" fill="#0f0f13" stroke="#f43f5e" strokeWidth="1.5" />
                <circle cx="565" cy="185" r="5" fill="#f43f5e" />
                <text x="582" y="178" fill="#ffffff" fontSize="11" fontFamily="sans-serif" fontWeight="bold">Test</text>
                <text x="582" y="195" fill="#71717a" fontSize="9.5" fontFamily="monospace">npm test</text>
                <rect x="675" y="172" width="50" height="18" rx="4" fill="#450a0a" stroke="#f43f5e" strokeWidth="1" />
                <text x="700" y="184" fill="#fb7185" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">✖ FAIL</text>
              </g>

              {/* Node 5: AI Diagnosis */}
              <g>
                <rect x="170" y="290" width="460" height="80" rx="12" fill="#0f0f13" stroke="#d44df0" strokeWidth="1.5" />
                <circle cx="210" cy="330" r="18" fill="rgba(212, 77, 240, 0.15)" stroke="rgba(212, 77, 240, 0.4)" strokeWidth="1" />
                <path d="M 210,320 L 212,328 L 220,330 L 212,332 L 210,340 L 208,332 L 200,330 L 208,328 Z" fill="#e879f9" />
                <text x="242" y="325" fill="#ffffff" fontSize="11" fontFamily="sans-serif" fontWeight="bold">AI Diagnosis</text>
                <text x="242" y="345" fill="#a1a1aa" fontSize="10.5" fontFamily="sans-serif">Root cause: stale JWT secret in auth.js:42</text>
                <rect x="525" y="302" width="90" height="15" rx="3" fill="#ff7a3d" fillOpacity="0.1" stroke="#ff7a3d" strokeOpacity="0.3" strokeWidth="0.5" />
                <text x="570" y="312" fill="#ff7a3d" fontSize="7" fontFamily="monospace" fontWeight="bold" textAnchor="middle">98% CONF</text>
              </g>

              {/* Node 6: Patch & Verify */}
              <g>
                <rect x="170" y="410" width="460" height="80" rx="12" fill="#0f0f13" stroke="#3b82f6" strokeWidth="1.5" />
                <circle cx="210" cy="450" r="18" fill="rgba(59, 130, 246, 0.15)" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="1" />
                <path d="M 205,440 L 213,440 L 217,444 L 217,460 L 205,460 Z M 213,440 L 213,444 L 217,444" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
                <path d="M 208,448 L 214,448 M 208,452 L 214,452" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
                <text x="242" y="445" fill="#ffffff" fontSize="11" fontFamily="sans-serif" fontWeight="bold">Patch &amp; Verify</text>
                <text x="242" y="465" fill="#a1a1aa" fontSize="10.5" fontFamily="sans-serif">12 lines replaced → all tests re-passed in sandbox</text>
                <rect x="545" y="441" width="70" height="18" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
                <text x="580" y="453" fill="#34d399" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">✓ HEALED</text>
              </g>

              {/* Node 7: Ship to GitHub */}
              <g>
                <rect x="170" y="530" width="460" height="80" rx="12" fill="#0f0f13" stroke="#10b981" strokeWidth="1.5" />
                <circle cx="210" cy="570" r="18" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1" />
                <path d="M210 557c-6.63 0-12 5.37-12 12 0 5.3 3.438 9.8 8.203 11.38.6.11.828-.26.828-.57 0-.285-.016-1.23-.016-2.23-3.015.56-3.797-.73-4.03-1.41-.137-.35-.723-1.41-1.235-1.69-.418-.23-1.02-.78-.016-.8 1-.01 1.62.87 1.848 1.23 1.08 1.82 2.805 1.3 3.496.99.105-.78.422-1.3.766-1.6-2.672-.3-5.465-1.34-5.465-5.93 0-1.3.465-2.38 1.23-3.22-.117-.3-.535-1.53.117-3.18 0 0 1.004-.32 3.301 1.23.96-.27 1.98-.4 3-.4s2.04.13 3 .4c2.297-1.55 3.3-1.23 3.3-1.23.653 1.65.235 2.88.118 3.18.766.84 1.23 1.9 1.23 3.22 0 4.61-2.805 5.62-5.477 5.92.434.38.813 1.1.813 2.22 0 1.6-.016 2.9-.016 3.3 0 .31.226.69.828.57 4.766-1.58 8.203-6.08 8.203-11.38 0-6.63-5.37-12-12-12z" fill="#34d399" />
                <text x="242" y="565" fill="#ffffff" fontSize="11" fontFamily="sans-serif" fontWeight="bold">Ship to GitHub</text>
                <text x="242" y="585" fill="#a1a1aa" fontSize="10.5" fontFamily="sans-serif">PR #247 opened with diff, diagnosis &amp; proof</text>
                <rect x="535" y="561" width="80" height="18" rx="4" fill="#312e81" stroke="#6366f1" strokeWidth="1" />
                <text x="575" y="573" fill="#a5b4fc" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">PR OPENED</text>
              </g>
            </svg>
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
            {/* Docker | whale icon */}
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
            <a href="/console/repositories" className="btn-primary btn-primary-lg">
              Go to console
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
            <a href="#" className="btn-secondary">Talk to Sales</a>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="landing-footer" style={{ padding: '48px 32px', background: '#090909', borderTop: '1px solid #141414' }}>
        <div className="footer-inner" style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1199px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
            {/* Left side: Brand */}
            <div className="flex items-center gap-3">
              <img src="/logo.jpg" alt="VibeCheck AI" style={{ height: '28px', width: '28px', borderRadius: '6px' }} />
              <span style={{ fontSize: '15px', fontWeight: '700', letterSpacing: '-0.3px', color: '#fff' }}>VibeCheck AI</span>
              <span style={{ height: '4px', width: '4px', borderRadius: '9999px', background: '#262626' }} />
              <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>Self-correcting CI/CD pipelines</p>
            </div>

            {/* Right side: Nav Links */}
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <Link href="/how-it-works" className="text-zinc-500 hover:text-white transition-colors" style={{ fontSize: '13px', textDecoration: 'none' }}>How it works</Link>
              <Link href="/flow" className="text-zinc-500 hover:text-white transition-colors" style={{ fontSize: '13px', textDecoration: 'none' }}>Flow</Link>
              <Link href="/about" className="text-zinc-500 hover:text-white transition-colors" style={{ fontSize: '13px', textDecoration: 'none' }}>About</Link>
              <Link href="/console/repositories" className="text-zinc-400 hover:text-white transition-colors font-semibold" style={{ fontSize: '13px', textDecoration: 'none' }}>Console</Link>
            </div>
          </div>

          {/* Separator */}
          <div style={{ height: '1px', width: '100%', background: '#141414' }} />

          {/* Bottom section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <span style={{ fontSize: '12px', color: '#444' }}>© {new Date().getFullYear()} VibeCheck AI. All rights reserved.</span>
            
            <div className="flex items-center gap-4">
              <a 
                href="https://github.com/Ashwithkumar-1827" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5"
                style={{ fontSize: '12px', textDecoration: 'none' }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ height: '14px', width: '14px' }}><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/></svg>
                GitHub
              </a>
              <a 
                href="https://www.linkedin.com/in/madishetti-ashwith-kumar" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5"
                style={{ fontSize: '12px', textDecoration: 'none' }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ height: '14px', width: '14px' }}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn
              </a>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
