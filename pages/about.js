import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Sparkles, Shield, Cpu, Code, Heart, GitBranch, 
  Github, Linkedin, ExternalLink, User, CheckCircle, 
  Zap, Activity, Terminal, Layers, Network 
} from 'lucide-react';

/* ============================================================
   VibeCheck AI - About Page
   Premium educational & developer showcase interface
   ============================================================ */

function TechStatCard({ icon: Icon, value, label, accent = 'indigo' }) {
  const accentGradients = {
    indigo: 'from-indigo-500/10 to-indigo-500/0 border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400',
    violet: 'from-violet-500/10 to-violet-500/0 border-violet-500/20 hover:border-violet-500/40 text-violet-400',
    emerald: 'from-emerald-500/10 to-emerald-500/0 border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400',
    rose: 'from-rose-500/10 to-rose-500/0 border-rose-500/20 hover:border-rose-500/40 text-rose-400',
    amber: 'from-amber-500/10 to-amber-500/0 border-amber-500/20 hover:border-amber-500/40 text-amber-400',
  };

  const style = accentGradients[accent] || accentGradients.indigo;

  return (
    <div className={`reveal bg-gradient-to-br ${style} backdrop-blur-md border rounded-2xl p-6 transition-all duration-300 hover:translate-y-[-2px] w-full`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xl font-bold font-mono text-white tracking-tight">{value}</div>
          <div className="text-xs text-zinc-500 mt-0.5 uppercase tracking-wider font-mono">{label}</div>
        </div>
      </div>
    </div>
  );
}

function PillarCard({ icon: Icon, title, tag, children, accent = 'indigo' }) {
  const accentColors = {
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };

  const colorStyle = accentColors[accent] || accentColors.indigo;

  return (
    <div className="reveal group relative flex flex-col justify-between p-7 rounded-2xl bg-[#0c0c0c]/80 backdrop-blur-md border border-zinc-900/60 hover:border-zinc-800 transition-all duration-300 hover:bg-[#111111]/80 hover:translate-y-[-2px] w-full">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className={`h-10 w-10 rounded-xl ${colorStyle} flex items-center justify-center shrink-0`}>
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 font-bold">{tag}</span>
        </div>
        <h4 className="text-[15px] font-semibold text-white tracking-tight">{title}</h4>
        <div className="mt-3 text-[13px] text-zinc-400 leading-relaxed space-y-2">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AboutPage() {
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
        <title>About | VibeCheck AI</title>
        <meta
          name="description"
          content="Learn about the self-correcting AI engine behind VibeCheck AI and the builder, Ashwith Kumar, who designed it during the OpenAI × Outskill Hackathon."
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
            <li><Link href="/how-it-works">How it works</Link></li>
            <li><Link href="/flow">Flow</Link></li>
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
        <Link href="/how-it-works" onClick={() => setMobileNavOpen(false)}>How it works</Link>
        <Link href="/flow" onClick={() => setMobileNavOpen(false)}>Flow</Link>
        <Link href="/console/repositories" className="btn-primary btn-primary-lg" style={{ marginTop: 20 }} onClick={() => setMobileNavOpen(false)}>Go to console</Link>
      </div>

      {/* ============ HERO SECTION ============ */}
      <section className="hero-section" style={{ paddingBottom: '32px' }}>
        <div className="landing-container flex flex-col items-center w-full relative z-10">
          <div className="hero-eyebrow">
            <span className="dot" />
            <span>Autonomic DevOps Vision</span>
          </div>

          <h1 className="hero-title" style={{ fontSize: '56px', letterSpacing: '-2.5px', lineHeight: '1.05' }}>
            Autonomic CI/CD.<br />
            <span className="gradient-text">No more 11 PM alerts.</span>
          </h1>

          <p className="hero-subtitle" style={{ maxWidth: '680px', fontSize: '16px' }}>
            Meet the developer, explore the core engineering stack, and discover the self-correcting AI engine designed to autonomously patch and ship broken pipelines.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
            <Link href="/console/repositories" className="btn-primary btn-primary-lg">
              Launch platform
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
            <a href="#builder-profile" className="btn-secondary">
              Meet the Builder
            </a>
          </div>
        </div>
      </section>

      {/* ============ APPLICATION METRICS GRID ============ */}
      <section className="features-section" style={{ paddingTop: '10px', paddingBottom: '48px' }}>
        <div className="landing-container flex flex-col items-center w-full relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full mx-auto">
            <TechStatCard icon={Zap} value="Sub-30s" label="Diagnostic Loop" accent="amber" />
            <TechStatCard icon={Shield} value="100% Secure" label="Isolated Sandbox" accent="emerald" />
            <TechStatCard icon={Layers} value="AST-Level" label="Graphify Parser" accent="violet" />
            <TechStatCard icon={Cpu} value="Multi-Model" label="Quota Fallbacks" accent="indigo" />
          </div>
        </div>
      </section>

      {/* ============ THE VIBECHECK AI STORY ============ */}
      <section className="features-section" style={{ paddingTop: '48px', paddingBottom: '64px', borderTop: '1px solid #1a1a1a' }}>
        <div className="landing-container flex flex-col items-center w-full relative z-10">
          <div className="section-header reveal" style={{ marginBottom: '48px' }}>
            <span className="section-eyebrow">The Mission</span>
            <h2 className="section-title" style={{ fontSize: '38px', letterSpacing: '-1.5px' }}>Why VibeCheck AI?</h2>
            <p className="section-subtitle" style={{ maxWidth: '680px', fontSize: '15px' }}>
              Every developer knows the dread: a critical build breaks late at night, and you spend an hour digging through 500 lines of raw compiler logs just to fix a single misplaced character. VibeCheck AI was built to solve exactly that.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mx-auto">
            <PillarCard icon={Terminal} title="Zero Repo Access Required" tag="Security First" accent="rose">
              <p>
                Unlike standard CI/CD tooling which demands massive root write access permissions to your production codebases, VibeCheck AI takes a zero-trust approach.
              </p>
              <p className="mt-2 text-zinc-500">
                Paste raw log traces, run builds inside isolated browser containers, and review patches before downloading them or creating safe fork-based Pull Requests.
              </p>
            </PillarCard>

            <PillarCard icon={Layers} title="AST-Powered Graphify" tag="Rich Context" accent="violet">
              <p>
                Generic AI tools paste code blindly. VibeCheck uses its custom **Graphify** analyzer to parse abstract syntax tree (AST) nodes, mapping imports, exports, and function weights.
              </p>
              <p className="mt-2 text-zinc-500">
                By presenting Gemini models with a precise structural blueprint, VibeCheck AI identifies the root cause of compiler failure paths instead of merely fixing cascading downstream symptoms.
              </p>
            </PillarCard>

            <PillarCard icon={Cpu} title="Automated Quota Fallback" tag="Resiliency" accent="emerald">
              <p>
                Building at scale requires robust infrastructure. Our autonomic engine runs a multi-model fallback chain to safeguard against sudden rate limit and network errors.
              </p>
              <p className="mt-2 text-zinc-500">
                If the primary Gemini model hits a high-priority rate limit quota, secondary failover modules engage in milliseconds, guaranteeing uninterrupted background compilation.
              </p>
            </PillarCard>
          </div>
        </div>
      </section>

      {/* ============ MEET THE BUILDER ============ */}
      <section id="builder-profile" className="features-section" style={{ paddingTop: '64px', paddingBottom: '96px', borderTop: '1px solid #1a1a1a', background: 'radial-gradient(circle at 50% 90%, rgba(99, 102, 241, 0.05) 0%, transparent 60%)' }}>
        <div className="landing-container flex flex-col items-center w-full relative z-10">
          <div className="section-header reveal" style={{ marginBottom: '48px' }}>
            <span className="section-eyebrow">The Architect</span>
            <h2 className="section-title" style={{ fontSize: '38px', letterSpacing: '-1.5px' }}>Meet the Builder</h2>
            <p className="section-subtitle" style={{ maxWidth: '680px', fontSize: '15px' }}>
              Designed and engineered by a developer who understands the pain of modern software compilation and pipeline triage alert fatigue.
            </p>
          </div>

          {/* Builder Showcase Glass Panel */}
          <div className="reveal w-full max-w-4xl mx-auto bg-[#0c0c0c]/80 border border-zinc-900/60 rounded-3xl overflow-hidden hover:border-zinc-800/80 transition-all duration-300 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="grid grid-cols-1 md:grid-cols-12">
              
              {/* Profile Avatar / Art Column */}
              <div className="md:col-span-4 bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-transparent p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-zinc-900/60 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[#090909]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Glow Ring Avatar */}
                <div className="relative h-32 w-32 rounded-2xl bg-[#090909] border border-zinc-800 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.15)] group-hover:shadow-[0_0_40px_rgba(99,102,241,0.25)] transition-all duration-500">
                  <div className="absolute inset-1.5 rounded-xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-amber-500 opacity-20" />
                  <img 
                    src="/ashwith.jpg" 
                    alt="Ashwith Kumar" 
                    className="h-[116px] w-[116px] rounded-xl object-cover relative z-20 border border-zinc-800/40 shadow-inner group-hover:scale-[1.03] transition-transform duration-500"
                  />
                </div>

                <div className="mt-5 text-center relative z-10">
                  <h3 className="text-base font-semibold text-white tracking-tight">Ashwith Kumar</h3>
                  <p className="text-[11px] font-mono text-indigo-400 mt-1 uppercase tracking-wider font-bold">ML Engineer</p>
                </div>
              </div>

              {/* Bio & Professional Info Column */}
              <div className="md:col-span-8 p-8 md:p-10 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">Biography</span>
                    <a 
                      href="https://github.com/Ashwithkumar-1827" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[11px] font-mono text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      GitHub Profile <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white tracking-tight">Ashwith Kumar</h3>
                  
                  <p className="text-[13.5px] text-zinc-400 leading-relaxed">
                    Ashwith is a Machine Learning Engineer and AI Builder who transforms complex data and advanced AI into intelligent, production-ready systems. He specializes in architecting scalable data platforms, automating high-performance Python ETL pipelines, and leveraging Apache Spark and Databricks to process massive datasets and accelerate machine learning innovation. From deploying predictive models on Microsoft Azure to orchestrating seamless workflows with Azure Data Factory and Databricks, he builds solutions designed for reliability, scalability, and business impact. Passionate about the next generation of AI, Ashwith develops autonomous agentic systems using LangGraph that can reason, self-monitor, validate outcomes in real time, and make intelligent decisions with minimal human intervention. His expertise spans data engineering, machine learning, MLOps, and AI automation, enabling him to create systems that not only analyze data but also adapt, learn, and drive meaningful outcomes at scale.
                  </p>
                </div>

                {/* Social Actions row */}
                <div className="mt-8 pt-6 border-t border-zinc-900/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-[11px] text-zinc-500 leading-none">
                    Connecting data architectures to active models.
                  </div>
                  <div className="flex items-center gap-3">
                    <a 
                      href="https://www.linkedin.com/in/madishetti-ashwith-kumar" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn-primary flex items-center gap-2"
                      style={{ padding: '8px 16px', fontSize: '12px' }}
                    >
                      <Linkedin className="h-3.5 w-3.5" />
                      LinkedIn
                    </a>
                  </div>
                </div>

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
