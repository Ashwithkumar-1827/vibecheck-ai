import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Key, GitBranch, Network, CheckCircle, Sparkles, Play,
  Settings, RefreshCw, GitPullRequest
} from 'lucide-react';

/* ============================================================
   VibeCheck AI - How It Works (Simplified User Guide)
   Premium operations guide & self-correcting architecture
   ============================================================ */

function StepTimelineCard({ number, icon: Icon, title, children, accent = 'indigo', code = '', isLast = false, stage = '' }) {
  const accentColors = {
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      badgeBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]',
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.04)]',
      dotBg: 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]',
      textColor: 'text-amber-400',
      line: 'bg-gradient-to-b from-amber-500/40 via-amber-500/15 to-transparent',
    },
    indigo: {
      border: 'border-indigo-500/20 hover:border-indigo-500/40',
      badgeBg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.25)]',
      glow: 'shadow-[0_0_30px_rgba(99,102,241,0.04)]',
      dotBg: 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]',
      textColor: 'text-indigo-400',
      line: 'bg-gradient-to-b from-indigo-500/40 via-indigo-500/15 to-transparent',
    },
    violet: {
      border: 'border-violet-500/20 hover:border-violet-500/40',
      badgeBg: 'bg-violet-500/10 text-violet-400 border border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.25)]',
      glow: 'shadow-[0_0_30px_rgba(139,92,246,0.04)]',
      dotBg: 'bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.5)]',
      textColor: 'text-violet-400',
      line: 'bg-gradient-to-b from-violet-500/40 via-violet-500/15 to-transparent',
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.25)]',
      glow: 'shadow-[0_0_30px_rgba(16,185,129,0.04)]',
      dotBg: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]',
      textColor: 'text-emerald-400',
      line: 'bg-gradient-to-b from-emerald-500/40 via-emerald-500/15 to-transparent',
    },
    rose: {
      border: 'border-rose-500/20 hover:border-rose-500/40',
      badgeBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.25)]',
      glow: 'shadow-[0_0_30px_rgba(244,63,94,0.04)]',
      dotBg: 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]',
      textColor: 'text-rose-400',
      line: 'bg-gradient-to-b from-rose-500/40 via-rose-500/15 to-transparent',
    },
    sky: {
      border: 'border-sky-500/20 hover:border-sky-500/40',
      badgeBg: 'bg-sky-500/10 text-sky-400 border border-sky-500/40 shadow-[0_0_15px_rgba(14,165,233,0.25)]',
      glow: 'shadow-[0_0_30px_rgba(14,165,233,0.04)]',
      dotBg: 'bg-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.5)]',
      textColor: 'text-sky-400',
      line: 'bg-gradient-to-b from-sky-500/40 via-sky-500/15 to-transparent',
    },
  };

  const style = accentColors[accent] || accentColors.indigo;

  return (
    <div className="flex gap-5 md:gap-8 reveal group relative w-full items-start">
      
      {/* COLUMN A: Robust Flex Timeline Track */}
      <div className="flex flex-col items-center select-none shrink-0 w-10 md:w-12 relative self-stretch">
        {/* The glowing timeline dot badge */}
        <div className={`h-10 w-10 rounded-full bg-[#0c0c0c] ${style.badgeBg} flex items-center justify-center transition-all duration-300 z-10 relative`}>
          <span className="text-[13px] font-mono font-bold">{number}</span>
        </div>
        
        {/* Connecting Line that extends exactly centered underneath the badge */}
        {!isLast && (
          <div className={`absolute top-10 bottom-[-48px] w-[1px] ${style.line} pointer-events-none`} />
        )}
      </div>

      {/* COLUMN B: Premium Card Content */}
      <div className={`flex-1 min-w-0 relative bg-[#0c0c0c]/85 backdrop-blur-md border ${style.border} ${style.glow} rounded-2xl p-6 md:p-8 hover:bg-[#111111]/90 transition-all duration-300 hover:translate-y-[-2px] overflow-hidden`}>
        
        {/* Large Decorative Watermark Number on the far right */}
        <div className="absolute right-6 bottom-[-20px] font-mono text-[110px] md:text-[140px] font-extrabold text-white/[0.02] select-none pointer-events-none leading-none z-0">
          {number}
        </div>

        {/* Card Header */}
        <div className="flex items-center justify-between gap-4 mb-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className={`h-11 w-11 rounded-xl ${style.badgeBg} flex items-center justify-center shrink-0 border-none shadow-none`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 font-bold">{stage}</span>
              <h3 className="text-base font-semibold tracking-tight text-white mt-0.5">{title}</h3>
            </div>
          </div>
        </div>

        {/* Card Body Description */}
        <div className="text-[13.5px] text-zinc-400 leading-relaxed space-y-3 relative z-10 max-w-[95%]">
          {children}
        </div>

        {/* Code Block / User Action */}
        {code && (
          <div className="mt-5 border border-zinc-900/80 rounded-lg overflow-hidden bg-zinc-950/60 relative z-10">
            <div className="flex items-center justify-between px-3 py-2 bg-zinc-950/80 border-b border-zinc-900/60 font-mono text-[9px] text-zinc-500 uppercase tracking-wider font-bold">
              <span>User Action Command</span>
              <span className={`h-1.5 w-1.5 rounded-full ${style.dotBg}`} />
            </div>
            <div className="p-3 font-mono text-[11.5px] text-zinc-300 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-emerald-500 select-none font-bold">❯</span>
              <code className="select-all">{code}</code>
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
}

export default function HowItWorks() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );

    const elements = document.querySelectorAll('.reveal');
    elements.forEach((el) => observer.observe(el));
    return () => elements.forEach((el) => observer.unobserve(el));
  }, []);

  return (
    <div className="landing-page select-text relative min-h-screen">
      <Head>
        <title>How it works | VibeCheck AI</title>
        <meta
          name="description"
          content="Learn how to use VibeCheck AI to secure credentials, import repositories, map dependencies, run sandbox builds, and promote autonomous patches."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* Ambient background glow at the top for premium depth */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[250px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-amber-500/10 blur-[120px] opacity-80" />
      </div>

      {/* ============ FLOATING NAVIGATION ============ */}
      <nav className={`landing-nav ${navScrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <img src="/logo.jpg" alt="VibeCheck AI Logo" />
            <span className="nav-logo-text">VibeCheck AI</span>
          </Link>

          <ul className="nav-links">
            <li><Link href="/">Home</Link></li>
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
        <Link href="/" onClick={() => setMobileNavOpen(false)}>Home</Link>
        <Link href="/flow" onClick={() => setMobileNavOpen(false)}>Flow</Link>
        <Link href="/about" onClick={() => setMobileNavOpen(false)}>About</Link>
        <Link href="/console/repositories" className="btn-primary btn-primary-lg" style={{ marginTop: 20 }} onClick={() => setMobileNavOpen(false)}>Go to console</Link>
      </div>

      {/* ============ HERO SECTION ============ */}
      <section className="hero-section" style={{ paddingBottom: '40px' }}>
        <div className="landing-container relative z-10 flex flex-col items-center w-full">
          <div className="hero-eyebrow">
            <span className="dot" />
            <span>Interactive User Guide</span>
          </div>

          <h1 className="hero-title" style={{ fontSize: '64px', letterSpacing: '-3.1px', lineHeight: '1.02' }}>
            Getting Started<br />
            <span className="gradient-text">with VibeCheck AI.</span>
          </h1>

          <p className="hero-subtitle" style={{ maxWidth: '640px' }}>
            A simple, step-by-step guide to configure your keys, import repositories, run sandbox builds, and repair broken pipelines.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '28px' }}>
            <Link href="/console/repositories" className="btn-primary btn-primary-lg">
              Launch console
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
            <Link href="/flow" className="btn-secondary">View execution flow</Link>
          </div>
        </div>
      </section>

      {/* ============ STEP-BY-STEP USER GUIDE ============ */}
      <section className="features-section" style={{ paddingTop: '20px', paddingBottom: '96px' }}>
        <div className="landing-container relative z-10 flex flex-col items-center w-full">
          {/* Glowing Timeline Container - Flex layout for full alignment and absolute centering */}
          <div className="w-full max-w-4xl space-y-12 py-6">

            <StepTimelineCard
              number="01"
              icon={Settings}
              title="Configure your credentials"
              accent="amber"
              code="Go to sidebar > Credentials > Add Gemini API Key"
              stage="STG.01 / CREDENTIALS"
            >
              <p>
                Navigate to the <strong>Credentials</strong> tab in the console sidebar. 
                Paste your <strong>Gemini API key</strong> (available for free from Google AI Studio) to enable AI diagnostics and chat patching.
              </p>
              <p>
                Optionally, paste a <strong>GitHub Personal Access Token (PAT)</strong> to pull private repositories and autonomously open Pull Requests.
              </p>
            </StepTimelineCard>

            <StepTimelineCard
              number="02"
              icon={GitBranch}
              title="Import and clone a repository"
              accent="indigo"
              code="Go to sidebar > Repositories > Add Repository URL"
              stage="STG.02 / REPOSITORY"
            >
              <p>
                Go to the <strong>Repositories</strong> tab, click <strong>Add Repository</strong>, and paste your Git URL.
              </p>
              <p>
                VibeCheck AI will shallow clone the repository and automatically detect its project type (such as Node or Python).
              </p>
            </StepTimelineCard>

            <StepTimelineCard
              number="03"
              icon={Network}
              title="Generate the dependency Knowledge Graph"
              accent="violet"
              code="Graphify automatically parses abstract syntax trees (AST)"
              stage="STG.03 / ANALYSIS"
            >
              <p>
                Upon import, VibeCheck's custom <strong>Graphify</strong> tool automatically indexes imports, exports, and function references to create a global Knowledge Graph.
              </p>
              <p>
                This visual architecture map gives the AI diagnostic engine structural context to identify the exact cause of bugs across multiple files.
              </p>
            </StepTimelineCard>

            <StepTimelineCard
              number="04"
              icon={Play}
              title="Run build pipeline inside the secure Sandbox"
              accent="emerald"
              code="Go to sidebar > Sandbox > Click Run Sandbox"
              stage="STG.04 / SANDBOX"
            >
              <p>
                Open the <strong>Sandbox</strong> tab and click <strong>Run Sandbox</strong>. The system launches a secure container to execute:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                <li><strong>Install:</strong> Sets up all necessary library dependencies.</li>
                <li><strong>Build:</strong> Compiles source files and checks for static errors.</li>
                <li><strong>Test:</strong> Executes unit and integration test suites.</li>
              </ul>
            </StepTimelineCard>

            <StepTimelineCard
              number="05"
              icon={Sparkles}
              title="Simultaneous multi-error AI diagnosis"
              accent="rose"
              code="Click Diagnose to inspect raw logs and get precision patches"
              stage="STG.05 / DIAGNOSIS"
            >
              <p>
                If any stage fails, click <strong>Diagnose</strong>. 
                The AI reads the build traces and Knowledge Graph to pinpoint all distinct bugs at once.
              </p>
              <p>
                It generates highly accurate, self-contained syntax and structural corrective patches with estimated confidence scores.
              </p>
            </StepTimelineCard>

            <StepTimelineCard
              number="06"
              icon={RefreshCw}
              title="Review, edit, and verify patches"
              accent="sky"
              code="Review Diffs > Chat with Copilot to adjust > Click Apply & Rerun"
              stage="STG.06 / PATCH"
            >
              <p>
                Review side-by-side git diffs for each proposed fix. 
                Use the integrated <strong>AI Chat panel</strong> to refine patches or edit the code manually.
              </p>
              <p>
                Click <strong>Apply and Rerun</strong> to write the fix to the workspace and verify the sandbox pipeline turns green.
              </p>
            </StepTimelineCard>

            <StepTimelineCard
              number="07"
              icon={GitPullRequest}
              title="Promote changes to a GitHub Pull Request"
              accent="emerald"
              code="Click Create PR or Download workspace as ZIP"
              isLast={true}
              stage="STG.07 / PROMOTE"
            >
              <p>
                Once all pipeline tests pass successfully, promote your verified fixes.
              </p>
              <p>
                Click <strong>Create PR</strong> to autonomously commit, push, and open a ready-to-merge Pull Request on GitHub. 
                Alternatively, download the fully patched workspace directly as a ZIP.
              </p>
            </StepTimelineCard>
          </div>

          {/* Golden Rule Banner */}
          <div className="reveal w-full max-w-4xl mx-auto" style={{ marginTop: '40px' }}>
            <div className="flex items-start gap-4 p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(99, 102, 241, 0.06))', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
              <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white" style={{ letterSpacing: '-0.3px' }}>The Self-Correcting Loop Gating</p>
                <p className="mt-2 text-[13px] text-zinc-400 leading-relaxed">
                  Your codebase is always protected. Changes are applied and fully compiled inside isolated container workspaces. No code is pushed to your remote repository until all twin verification gates pass successfully.
                </p>
              </div>
            </div>
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
