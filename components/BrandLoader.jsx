import React, { useEffect, useState } from 'react';

export default function BrandLoader() {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [subtitleText, setSubtitleText] = useState('');
  
  const totalDuration = 3182.7; // 3.1827 seconds
  const fadeOutDuration = 400; // 0.4 seconds

  const fullSubtitle = 'AUTONOMIC SELF-HEALING CI/CD AGENT';

  useEffect(() => {
    const startTime = Date.now();
    
    // 1. Progress updater
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(pct);
      
      if (elapsed >= totalDuration) {
        clearInterval(progressInterval);
        setIsFadingOut(true);
      }
    }, 16); // ~60fps

    // 2. Subtitle typewriter effect
    let charIdx = 0;
    const typeInterval = setInterval(() => {
      if (charIdx < fullSubtitle.length) {
        setSubtitleText(prev => prev + fullSubtitle[charIdx]);
        charIdx++;
      } else {
        clearInterval(typeInterval);
      }
    }, 60);

    return () => {
      clearInterval(progressInterval);
      clearInterval(typeInterval);
    };
  }, []);

  return (
    <div className={`fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center font-sans overflow-hidden transition-opacity ease-in-out select-none cursor-wait ${
      isFadingOut ? 'opacity-0 duration-[400ms]' : 'opacity-100'
    }`}>
      
      {/* 1. Ambient Background Mesh Glowing Spotlight Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] rounded-full bg-violet-650/15 blur-[120px] animate-pulse duration-[6000ms] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[45vw] h-[45vw] rounded-full bg-cyan-500/10 blur-[130px] animate-pulse duration-[8000ms] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30vw] h-[30vw] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />
      
      {/* 2. Thin grid backdrop */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0a0a0c_1px,transparent_1px),linear-gradient(to_bottom,#0a0a0c_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-35" />

      {/* 3. Main Center Logo Box */}
      <div className="relative flex flex-col items-center justify-center text-center z-10 space-y-7">
        
        {/* Glow-ring wrapped Brand Logo */}
        <div className="relative h-28 w-28 flex items-center justify-center">
          {/* Outer rotating conic-gradient neon border */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-violet-600 animate-spin [animation-duration:4s] opacity-80 blur-[2px]" />
          
          {/* Thick black masking ring for visual space */}
          <div className="absolute inset-[3px] rounded-full bg-black z-0" />
          
          {/* Innermost pulsing glow backplate */}
          <div className="absolute inset-[6px] rounded-full bg-gradient-to-br from-zinc-800 to-zinc-950 animate-pulse z-0" />
          
          {/* High-fidelity Logo image */}
          <img 
            src="/logo.jpg" 
            alt="VibeCheck AI Logo" 
            className="absolute inset-[6px] rounded-full h-[calc(100%-12px)] w-[calc(100%-12px)] object-cover z-10 border border-zinc-850 shadow-inner"
          />
        </div>

        {/* Title & Subtitle block */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-[0.45em] text-white uppercase ml-[0.45em] drop-shadow-md">
            VibeCheck AI
          </h1>
          
          {/* Typewriter Subtitle */}
          <div className="h-4 flex items-center justify-center">
            <p className="text-[10px] md:text-[11px] font-mono tracking-[0.25em] text-zinc-450 uppercase font-semibold">
              {subtitleText}
              <span className="w-1.5 h-3 bg-zinc-400 inline-block animate-pulse ml-1 align-middle" />
            </p>
          </div>
        </div>

        {/* Thin Premium Loading Line */}
        <div className="w-56 space-y-2.5 pt-3">
          <div className="w-full bg-zinc-900/60 h-[3px] rounded-full overflow-hidden p-[0.5px] border border-zinc-850">
            <div 
              style={{ width: `${progress}%` }}
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-600 shadow-[0_0_12px_rgba(139,92,246,0.6)] transition-all duration-[16ms] ease-linear"
            />
          </div>
          <div className="flex justify-between items-center text-[9px] font-mono text-zinc-550 uppercase tracking-widest font-bold px-0.5">
            <span>connecting host</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

      </div>

    </div>
  );
}
