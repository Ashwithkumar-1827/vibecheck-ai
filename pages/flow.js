import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Download, Play, Shield, Sparkles, Database, GitPullRequest } from 'lucide-react';

export default function FlowPage() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDownloadPng = () => {
    const svgEl = document.getElementById('lifecycle-svg-flowchart');
    if (!svgEl) return;
    
    try {
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(svgEl);
      svgString = svgString.replace('<svg id="lifecycle-svg-flowchart"', '<svg id="lifecycle-svg-flowchart" width="800" height="2300"');
      
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobUrl = URL.createObjectURL(svgBlob);
      
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 800;
          canvas.height = 2300;
          const ctx = canvas.getContext('2d');
          
          ctx.fillStyle = '#090909';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          
          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = 'vibecheck-application-flow.png';
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        } catch (err) {
          console.error('Canvas export failed:', err);
        } finally {
          URL.revokeObjectURL(blobUrl);
        }
      };
      img.src = blobUrl;
    } catch (e) {
      console.error('Failed to export flowchart:', e);
    }
  };

  return (
    <div className="landing-page select-text">
      <Head>
        <title>Execution Flow | VibeCheck AI</title>
        <meta
          name="description"
          content="Explore the visual autonomic remediation execution map of VibeCheck AI. Detailed structural flow from Git clone to Pull Request promotion."
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
          <Link href="/" className="nav-logo">
            <img src="/logo.jpg" alt="VibeCheck AI Logo" />
            <span className="nav-logo-text">VibeCheck AI</span>
          </Link>

          <ul className="nav-links">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/how-it-works">How it works</Link></li>
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
        <Link href="/how-it-works" onClick={() => setMobileNavOpen(false)}>How it works</Link>
        <Link href="/about" onClick={() => setMobileNavOpen(false)}>About</Link>
        <Link href="/console/repositories" className="btn-primary btn-primary-lg" style={{ marginTop: 20 }} onClick={() => setMobileNavOpen(false)}>Go to console</Link>
      </div>

      {/* ============ HERO SECTION ============ */}
      <section className="hero-section" style={{ paddingBottom: '32px' }}>
        <div className="landing-container">
          <div className="hero-eyebrow">
            <span className="dot" />
            <span>Autonomic Architecture Map</span>
          </div>

          <h1 className="hero-title" style={{ fontSize: '56px', letterSpacing: '-2.5px', lineHeight: '1.05' }}>
            Visualizing the<br />
            <span className="gradient-text">Self-Correcting Loop.</span>
          </h1>

          <p className="hero-subtitle" style={{ maxWidth: '640px', fontSize: '16px' }}>
            Follow the complete programmatic path from remote Git repository clones to 
            Knowledge Graph parsing, simultaneous multi-error AI diagnostics, and autonomous PR promotion.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
            <button
              onClick={handleDownloadPng}
              className="btn-primary flex items-center gap-2"
            >
              <Download style={{ width: '16px', height: '16px' }} />
              Download schematic (PNG)
            </button>
            <Link href="/how-it-works" className="btn-secondary">
              Read step guide
            </Link>
          </div>
        </div>
      </section>

      {/* ============ GRAPH CONTAINER ============ */}
      <section className="features-section" style={{ paddingTop: '0px', paddingBottom: '96px' }}>
        <div className="landing-container">
          {/* SVG Flowchart - fluid, clean, directly kept in the page layout */}
          <div className="w-full max-w-[800px] mx-auto py-4 px-2">
            <svg 
              id="lifecycle-svg-flowchart" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 800 2300"
              className="w-full h-auto bg-[#090909] rounded-2xl border border-zinc-900/80 shadow-[0_0_50px_rgba(0,0,0,0.8)]"
            >
              <rect width="800" height="2300" rx="16" fill="#090909" />
              <defs>
                <marker id="arrow-gray" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#52525b" />
                </marker>
                <marker id="arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
                </marker>
                <marker id="arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f43f5e" />
                </marker>
              </defs>

              {/* Lines & Paths */}
              <path d="M 400,160 L 400,220" fill="none" stroke="#52525b" strokeWidth="2" markerEnd="url(#arrow-gray)" />
              <path d="M 340,280 L 220,280" fill="none" stroke="#f43f5e" strokeWidth="2" markerEnd="url(#arrow-red)" />
              <path d="M 130,320 L 130,420 A 20,20 0 0 0 150,440 L 300,440" fill="none" stroke="#f43f5e" strokeWidth="2" markerEnd="url(#arrow-red)" />
              <path d="M 400,340 L 400,400" fill="none" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrow-green)" />
              <path d="M 400,480 L 400,505" fill="none" stroke="#52525b" strokeWidth="2" markerEnd="url(#arrow-gray)" />
              <path d="M 400,575 L 400,640" fill="none" stroke="#52525b" strokeWidth="2" markerEnd="url(#arrow-gray)" />
              <path d="M 400,780 L 400,840" fill="none" stroke="#52525b" strokeWidth="2" markerEnd="url(#arrow-gray)" />
              <path d="M 400,960 L 400,1020" fill="none" stroke="#f43f5e" strokeWidth="2" markerEnd="url(#arrow-red)" />
              <path d="M 460,900 L 640,900 A 20,20 0 0 1 660,920 L 660,1730 A 20,20 0 0 1 640,1750 L 460,1750" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4,4" markerEnd="url(#arrow-green)" />
              <path d="M 400,1160 L 400,1220" fill="none" stroke="#52525b" strokeWidth="2" markerEnd="url(#arrow-gray)" />
              <path d="M 400,1300 L 400,1360" fill="none" stroke="#52525b" strokeWidth="2" markerEnd="url(#arrow-gray)" />
              <path d="M 400,1510 L 400,1570" fill="none" stroke="#52525b" strokeWidth="2" markerEnd="url(#arrow-gray)" />
              <path d="M 340,1630 L 160,1630 A 20,20 0 0 1 140,1610 L 140,1280 A 20,20 0 0 1 160,1260 L 300,1260" fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4,4" markerEnd="url(#arrow-red)" />
              <path d="M 400,1690 L 400,1750" fill="none" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrow-green)" />
              <path d="M 400,1880 L 400,1940" fill="none" stroke="#52525b" strokeWidth="2" markerEnd="url(#arrow-gray)" />
              <path d="M 340,2000 L 240,2000" fill="none" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrow-green)" />
              <path d="M 460,2000 L 560,2000" fill="none" stroke="#f43f5e" strokeWidth="2" markerEnd="url(#arrow-red)" />

              {/* Decision Overlays */}
              <g>
                <rect x="230" y="250" width="110" height="25" rx="4" fill="#450a0a" stroke="#f43f5e" strokeWidth="1.5" />
                <text x="285" y="266" fill="#fb7185" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">YES (AUTH REQUIRED)</text>
              </g>
              <g>
                <rect x="410" y="350" width="110" height="25" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                <text x="465" y="366" fill="#34d399" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">NO (PUBLIC CLONE)</text>
              </g>
              <g>
                <rect x="410" y="970" width="110" height="25" rx="4" fill="#450a0a" stroke="#f43f5e" strokeWidth="1.5" />
                <text x="465" y="986" fill="#fb7185" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">YES (TRACE FAIL)</text>
              </g>
              <g>
                <rect x="490" y="875" width="110" height="25" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                <text x="545" y="891" fill="#34d399" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">NO (BYPASS TRIAGE)</text>
              </g>
              <g>
                <rect x="180" y="1640" width="130" height="25" rx="4" fill="#450a0a" stroke="#f43f5e" strokeWidth="1.5" />
                <text x="245" y="1656" fill="#fb7185" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">NO (REGRESSION RETRY)</text>
              </g>
              <g>
                <rect x="410" y="1700" width="110" height="25" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                <text x="465" y="1716" fill="#34d399" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">YES (ALL CLEAN)</text>
              </g>
              <g>
                <rect x="250" y="1970" width="80" height="25" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                <text x="290" y="1986" fill="#34d399" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">NO (ACTIVE)</text>
              </g>
              <g>
                <rect x="470" y="1970" width="80" height="25" rx="4" fill="#450a0a" stroke="#f43f5e" strokeWidth="1.5" />
                <text x="510" y="1986" fill="#fb7185" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">YES (CLEANUP)</text>
              </g>

              {/* Flowchart Presentation Cards */}
              <g>
                <rect x="280" y="40" width="240" height="120" rx="12" fill="#0f0f13" stroke="#27272a" strokeWidth="1.5" />
                <text x="294" y="62" fill="#ffffff" fontSize="9" fontFamily="monospace" fontWeight="bold" letterSpacing="0.5">GITHUB REPO IMPORT</text>
                <rect x="442" y="52" width="28" height="13" rx="3" fill="#ff7a3d" fillOpacity="0.1" stroke="#ff7a3d" strokeOpacity="0.3" strokeWidth="0.5" />
                <text x="446" y="61" fill="#ff7a3d" fontSize="7" fontFamily="monospace" fontWeight="bold">NEW</text>
                <rect x="476" y="52" width="30" height="13" rx="3" fill="#f59e0b" fillOpacity="0.1" stroke="#f59e0b" strokeOpacity="0.3" strokeWidth="0.5" />
                <text x="481" y="61" fill="#f59e0b" fontSize="7" fontFamily="monospace" fontWeight="bold">ATTN</text>
                <rect x="294" y="78" width="212" height="20" rx="4" fill="#18181f" stroke="#27272a" strokeWidth="0.75" />
                <circle cx="304" cy="88" r="3" fill="#6366f1" />
                <text x="314" y="91" fill="#a1a1aa" fontSize="7.5" fontFamily="monospace">github.com/vibecheck-ai/mock...</text>
                <rect x="488" y="82" width="14" height="12" rx="2" fill="#27272a" />
                <text x="491" y="90" fill="#ffffff" fontSize="6" fontFamily="monospace">GO</text>
                <text x="294" y="114" fill="#a1a1aa" fontSize="8.5" fontFamily="sans-serif">
                  <tspan x="294" dy="0">User inputs remote Git URL to start the autonomic</tspan>
                  <tspan x="294" dy="12">workspace pipeline.</tspan>
                </text>
              </g>

              <g>
                <polygon points="400,220 460,280 400,340 340,280" fill="#172554" stroke="#3b82f6" strokeWidth="1.5" />
                <text x="400" y="283" fill="#60a5fa" fontSize="9" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">Is Repo Private?</text>
              </g>

              <g>
                <ellipse cx="130" cy="280" rx="90" ry="40" fill="#451a03" stroke="#f59e0b" strokeWidth="1.5" />
                <text x="130" y="272" fill="#fde047" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">OAUTH HANDSHAKE</text>
                <text x="130" y="286" fill="#eab308" fontSize="8.5" fontFamily="sans-serif" textAnchor="middle">
                  <tspan x="130" dy="0">Exchange keys to fetch private</tspan>
                  <tspan x="130" dy="11">repo paths securely.</tspan>
                </text>
              </g>

              <g>
                <ellipse cx="400" cy="440" rx="100" ry="40" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                <text x="400" y="432" fill="#34d399" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">WORKSPACE LOCAL INIT</text>
                <text x="400" y="446" fill="#a7f3d0" fontSize="8.5" fontFamily="sans-serif" textAnchor="middle">
                  <tspan x="400" dy="0">System creates local workspace and</tspan>
                  <tspan x="400" dy="11">syncs metadata in db.json.</tspan>
                </text>
              </g>

              <g>
                <ellipse cx="400" cy="540" rx="115" ry="35" fill="#2e1065" stroke="#8b5cf6" strokeWidth="1.5" />
                <text x="400" y="532" fill="#c084fc" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">GRAPHIFY DEPS MAPPER</text>
                <text x="400" y="546" fill="#ddd6fe" fontSize="8.5" fontFamily="sans-serif" textAnchor="middle">
                  <tspan x="400" dy="0">Parses cloned repo to map AST nodes</tspan>
                  <tspan x="400" dy="11">and cross-file structural dependencies.</tspan>
                </text>
              </g>

              <g>
                <rect x="280" y="640" width="240" height="140" rx="12" fill="#0f0f13" stroke="#27272a" strokeWidth="1.5" />
                <text x="294" y="662" fill="#ffffff" fontSize="9" fontFamily="monospace" fontWeight="bold" letterSpacing="0.5">SANDBOX COCKPIT</text>
                <rect x="442" y="652" width="28" height="13" rx="3" fill="#ff7a3d" fillOpacity="0.1" stroke="#ff7a3d" strokeOpacity="0.3" strokeWidth="0.5" />
                <text x="446" y="661" fill="#ff7a3d" fontSize="7" fontFamily="monospace" fontWeight="bold">NEW</text>
                <rect x="476" y="652" width="30" height="13" rx="3" fill="#6366f1" fillOpacity="0.1" stroke="#6366f1" strokeOpacity="0.3" strokeWidth="0.5" />
                <text x="481" y="661" fill="#818cf8" fontSize="7" fontFamily="monospace" fontWeight="bold">REVW</text>
                <rect x="294" y="678" width="212" height="32" rx="4" fill="#18181f" stroke="#27272a" strokeWidth="0.75" />
                <line x1="300" y1="686" x2="360" y2="686" stroke="#52525b" strokeWidth="3" strokeLinecap="round" />
                <line x1="300" y1="692" x2="350" y2="692" stroke="#52525b" strokeWidth="3" strokeLinecap="round" />
                <line x1="300" y1="698" x2="355" y2="698" stroke="rgba(99, 102, 241, 0.6)" strokeWidth="3" strokeLinecap="round" />
                <line x1="370" y1="682" x2="370" y2="706" stroke="#27272a" strokeWidth="0.5" />
                <text x="376" y="688" fill="#a1a1aa" fontSize="5" fontFamily="monospace" fontWeight="bold">CODE DIFF VIEW</text>
                <line x1="376" y1="694" x2="496" y2="694" stroke="rgba(16, 185, 129, 0.7)" strokeWidth="3" strokeLinecap="round" />
                <line x1="376" y1="700" x2="480" y2="700" stroke="rgba(244, 63, 94, 0.7)" strokeWidth="3" strokeLinecap="round" />
                <text x="294" y="734" fill="#a1a1aa" fontSize="8.5" fontFamily="sans-serif">
                  <tspan x="294" dy="0">Loads buggy repository structure inside fully secure,</tspan>
                  <tspan x="294" dy="12">isolated sandbox editor cockpit.</tspan>
                </text>
              </g>

              <g>
                <polygon points="400,840 460,900 400,960 340,900" fill="#450a0a" stroke="#f43f5e" strokeWidth="1.5" />
                <text x="400" y="903" fill="#fda4af" fontSize="9" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">Pipeline Fails?</text>
              </g>

              <g>
                <rect x="280" y="1020" width="240" height="140" rx="12" fill="#0f0f13" stroke="#27272a" strokeWidth="1.5" />
                <text x="294" y="1042" fill="#ffffff" fontSize="9" fontFamily="monospace" fontWeight="bold" letterSpacing="0.5">AI TRIAGE ENGINE</text>
                <rect x="442" y="1032" width="28" height="13" rx="3" fill="#f43f5e" fillOpacity="0.1" stroke="#f43f5e" strokeOpacity="0.3" strokeWidth="0.5" />
                <text x="446" y="1041" fill="#fb7185" fontSize="7" fontFamily="monospace" fontWeight="bold">ASAP</text>
                <rect x="476" y="1032" width="30" height="13" rx="3" fill="#f59e0b" fillOpacity="0.1" stroke="#f59e0b" strokeOpacity="0.3" strokeWidth="0.5" />
                <text x="481" y="1041" fill="#f59e0b" fontSize="7" fontFamily="monospace" fontWeight="bold">ATTN</text>
                <rect x="294" y="1058" width="212" height="32" rx="4" fill="#18181f" stroke="#27272a" strokeWidth="0.75" />
                <text x="300" y="1068" fill="#a1a1aa" fontSize="5.5" fontFamily="monospace">COMPRESSED STACK TRACE LOGS</text>
                <text x="446" y="1068" fill="#10b981" fontSize="5.5" fontFamily="monospace" fontWeight="bold">94% CONFIDENCE</text>
                <rect x="300" y="1076" width="200" height="6" rx="2" fill="#27272a" />
                <rect x="300" y="1076" width="180" height="6" rx="2" fill="#6366f1" />
                <text x="294" y="1114" fill="#a1a1aa" fontSize="8.5" fontFamily="sans-serif">
                  <tspan x="294" dy="0">Parses traces. Calls Gemini AI to output highly</tspan>
                  <tspan x="294" dy="12">structured AST corrective patches.</tspan>
                </text>
              </g>

              <g>
                <ellipse cx="400" cy="1260" rx="100" ry="40" fill="#0c2540" stroke="#0ea5e9" strokeWidth="1.5" />
                <text x="400" y="1252" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">DEVELOPER REVIEW CHAT</text>
                <text x="400" y="1266" fill="#7dd3fc" fontSize="8.5" fontFamily="sans-serif" textAnchor="middle">
                  <tspan x="400" dy="0">Iterate, dialogue, and refine structural</tspan>
                  <tspan x="400" dy="11">fixes in real-time.</tspan>
                </text>
              </g>

              <g>
                <rect x="280" y="1360" width="240" height="150" rx="12" fill="#0f0f13" stroke="#27272a" strokeWidth="1.5" />
                <text x="294" y="1382" fill="#ffffff" fontSize="9" fontFamily="monospace" fontWeight="bold" letterSpacing="0.5">CONTAINER STAGE PIPELINE</text>
                <rect x="442" y="1372" width="28" height="13" rx="3" fill="#ff7a3d" fillOpacity="0.1" stroke="#ff7a3d" strokeOpacity="0.3" strokeWidth="0.5" />
                <text x="446" y="1381" fill="#ff7a3d" fontSize="7" fontFamily="monospace" fontWeight="bold">NEW</text>
                <rect x="476" y="1372" width="30" height="13" rx="3" fill="#10b981" fillOpacity="0.1" stroke="#10b981" strokeOpacity="0.3" strokeWidth="0.5" />
                <text x="481" y="1381" fill="#34d399" fontSize="7" fontFamily="monospace" fontWeight="bold">DONE</text>
                <g>
                  <rect x="294" y="1398" width="64" height="16" rx="2" fill="#18181f" stroke="#27272a" strokeWidth="0.75" />
                  <circle cx="302" cy="1406" r="2.5" fill="#10b981" />
                  <text x="310" y="1409" fill="#a1a1aa" fontSize="6" fontFamily="monospace">Install</text>
                </g>
                <g>
                  <rect x="368" y="1398" width="64" height="16" rx="2" fill="#18181f" stroke="#27272a" strokeWidth="0.75" />
                  <circle cx="376" cy="1406" r="2.5" fill="#10b981" />
                  <text x="384" y="1409" fill="#a1a1aa" fontSize="6" fontFamily="monospace">Build</text>
                </g>
                <g>
                  <rect x="442" y="1398" width="64" height="16" rx="2" fill="#18181f" stroke="#27272a" strokeWidth="0.75" />
                  <circle cx="450" cy="1406" r="2.5" fill="#10b981" />
                  <text x="458" y="1409" fill="#a1a1aa" fontSize="6" fontFamily="monospace">Pipeline</text>
                </g>
                <text x="294" y="1438" fill="#a1a1aa" fontSize="8.5" fontFamily="sans-serif">
                  <tspan x="294" dy="0">Executes sterile container pipeline (Install,</tspan>
                  <tspan x="294" dy="12">Build, and Pipeline stages) for verification.</tspan>
                </text>
              </g>

              <g>
                <polygon points="400,1570 460,1630 400,1690 340,1630" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                <text x="400" y="1633" fill="#6ee7b7" fontSize="9" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">Pipeline Passes?</text>
              </g>

              <g>
                <rect x="280" y="1750" width="240" height="130" rx="12" fill="#0f0f13" stroke="#27272a" strokeWidth="1.5" />
                <text x="294" y="1772" fill="#ffffff" fontSize="9" fontFamily="monospace" fontWeight="bold" letterSpacing="0.5">AUTONOMIC PR PROMOTE</text>
                <rect x="442" y="1762" width="28" height="13" rx="3" fill="#10b981" fillOpacity="0.1" stroke="#10b981" strokeOpacity="0.3" strokeWidth="0.5" />
                <text x="446" y="1771" fill="#34d399" fontSize="7" fontFamily="monospace" fontWeight="bold">DONE</text>
                <rect x="476" y="1762" width="30" height="13" rx="3" fill="#6366f1" fillOpacity="0.1" stroke="#6366f1" strokeOpacity="0.3" strokeWidth="0.5" />
                <text x="481" y="1771" fill="#818cf8" fontSize="7" fontFamily="monospace" fontWeight="bold">REVW</text>
                <rect x="294" y="1788" width="212" height="20" rx="4" fill="#18181f" stroke="#27272a" strokeWidth="0.75" />
                <text x="300" y="1801" fill="#a1a1aa" fontSize="6.5" fontFamily="monospace" fontWeight="bold">PR #14 Promoted successfully!</text>
                <rect x="452" y="1792" width="50" height="12" rx="2" fill="#4f46e5" />
                <text x="477" y="1800" fill="#ffffff" fontSize="5.5" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">Back to Repo</text>
                <text x="294" y="1826" fill="#a1a1aa" fontSize="8.5" fontFamily="sans-serif">
                  <tspan x="294" dy="0">Stages modifications. Auto-commits and pushes</tspan>
                  <tspan x="294" dy="12">branch upstream. Creates PR autonomously.</tspan>
                </text>
              </g>

              <g>
                <polygon points="400,1940 460,2000 400,2060 340,2000" fill="#451a03" stroke="#f59e0b" strokeWidth="1.5" />
                <text x="400" y="2003" fill="#fde047" fontSize="9" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">Disconnected?</text>
              </g>

              <g>
                <ellipse cx="140" cy="2000" rx="100" ry="40" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                <text x="140" y="1992" fill="#34d399" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">PR STATUS MONITORING</text>
                <text x="140" y="2006" fill="#a7f3d0" fontSize="8.5" fontFamily="sans-serif" textAnchor="middle">
                  <tspan x="140" dy="0">"Open Sandbox" button transforms</tspan>
                  <tspan x="140" dy="11">to "PR Status" tracker.</tspan>
                </text>
              </g>

              <g>
                <ellipse cx="660" cy="2000" rx="100" ry="40" fill="#450a0a" stroke="#f43f5e" strokeWidth="1.5" />
                <text x="660" y="1992" fill="#fb7185" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">AUTONOMIC TEARDOWN</text>
                <text x="660" y="2006" fill="#fda4af" fontSize="8.5" fontFamily="sans-serif" textAnchor="middle">
                  <tspan x="660" dy="0">Emergency cleanup: Wipes all container</tspan>
                  <tspan x="660" dy="11">workspaces automatically!</tspan>
                </text>
              </g>

              {/* Glossary Legend Box */}
              <g>
                <rect x="100" y="2100" width="600" height="170" rx="12" fill="#0f0f13" stroke="#27272a" strokeWidth="1.5" />
                <text x="400" y="2130" fill="#ffffff" fontSize="11" fontFamily="monospace" fontWeight="bold" letterSpacing="1" textAnchor="middle">FLOWCHART ACRONYM GLOSSARY</text>
                <text x="400" y="2152" fill="#a1a1aa" fontSize="9" fontFamily="sans-serif" textAnchor="middle">To maintain the visual symmetry of the flowchart, key words are written in short form.</text>
                <text x="400" y="2165" fill="#a1a1aa" fontSize="9" fontFamily="sans-serif" textAnchor="middle">The full form of each abbreviated word is detailed below:</text>
                <line x1="140" y1="2185" x2="660" y2="2185" stroke="#27272a" strokeWidth="1" />
                
                {/* ATTN Pill */}
                <g>
                  <rect x="128" y="2205" width="44" height="16" rx="3" fill="#f59e0b" fillOpacity="0.1" stroke="#f59e0b" strokeOpacity="0.4" strokeWidth="0.75" />
                  <text x="150" y="2216" fill="#f59e0b" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">ATTN</text>
                  <text x="150" y="2236" fill="#e4e4e7" fontSize="8.5" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">Attention</text>
                </g>
                {/* AUTH Pill */}
                <g>
                  <rect x="238" y="2205" width="44" height="16" rx="3" fill="#8b5cf6" fillOpacity="0.1" stroke="#8b5cf6" strokeOpacity="0.4" strokeWidth="0.75" />
                  <text x="260" y="2216" fill="#a78bfa" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">AUTH</text>
                  <text x="260" y="2236" fill="#e4e4e7" fontSize="8.5" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">Authorization</text>
                </g>
                {/* DEPS Pill */}
                <g>
                  <rect x="348" y="2205" width="44" height="16" rx="3" fill="#3b82f6" fillOpacity="0.1" stroke="#3b82f6" strokeOpacity="0.4" strokeWidth="0.75" />
                  <text x="370" y="2216" fill="#60a5fa" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">DEPS</text>
                  <text x="370" y="2236" fill="#e4e4e7" fontSize="8.5" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">Dependencies</text>
                </g>
                {/* REVW Pill */}
                <g>
                  <rect x="458" y="2205" width="44" height="16" rx="3" fill="#6366f1" fillOpacity="0.1" stroke="#6366f1" strokeOpacity="0.4" strokeWidth="0.75" />
                  <text x="480" y="2216" fill="#818cf8" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">REVW</text>
                  <text x="480" y="2236" fill="#e4e4e7" fontSize="8.5" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">Review</text>
                </g>
                {/* ASAP Pill */}
                <g>
                  <rect x="568" y="2205" width="44" height="16" rx="3" fill="#f43f5e" fillOpacity="0.1" stroke="#f43f5e" strokeOpacity="0.4" strokeWidth="0.75" />
                  <text x="590" y="2216" fill="#fb7185" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">ASAP</text>
                  <text x="590" y="2236" fill="#e4e4e7" fontSize="8.5" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">As Soon As Possible</text>
                </g>
              </g>
            </svg>
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
