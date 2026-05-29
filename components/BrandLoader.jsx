import React, { useEffect, useState } from 'react';

export default function BrandLoader() {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [subtitle, setSubtitle] = useState('booting sandbox container');

  const totalDuration = 3182.7; // 3.1827 seconds

  useEffect(() => {
    const startTime = Date.now();

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(pct);

      // Dynamically update the subtitle based on progress milestones
      if (pct < 25) {
        setSubtitle('booting sandbox container');
      } else if (pct < 50) {
        setSubtitle('generating dependency graph');
      } else if (pct < 75) {
        setSubtitle('establishing secure sandbox');
      } else if (pct < 98) {
        setSubtitle('initializing cockpit console');
      } else {
        setSubtitle('playground ready');
      }

      if (elapsed >= totalDuration) {
        clearInterval(progressInterval);
        setIsFadingOut(true);
      }
    }, 16); // ~60fps

    return () => clearInterval(progressInterval);
  }, []);

  return (
    <div className={`fixed inset-0 bg-[#090909] z-[9999] flex flex-col items-center justify-center font-sans overflow-hidden select-none cursor-wait transition-opacity ease-in-out ${
      isFadingOut ? 'opacity-0 duration-[400ms]' : 'opacity-100'
    }`}>
      
      {/* 1. Subtle, slow pulsing ambient backdrop glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-violet-600/10 blur-[90px] animate-pulse duration-[4000ms] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-cyan-500/5 blur-[80px] pointer-events-none" />

      {/* 2. Grid backdrop pattern matching the site */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#141416_1px,transparent_1px),linear-gradient(to_bottom,#141416_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-35" />

      {/* 3. Center Content Panel */}
      <div className="relative flex flex-col items-center justify-center text-center z-10 space-y-6">
        
        {/* Sleek, circular brand logo with thin white hairline border */}
        <div className="relative h-20 w-20 flex items-center justify-center">
          {/* Inner hairline container */}
          <div className="absolute inset-0 rounded-full border border-white/10 bg-[#141414] overflow-hidden shadow-2xl flex items-center justify-center">
            <img 
              src="/logo.jpg" 
              alt="VibeCheck AI Logo" 
              className="h-full w-full object-cover grayscale opacity-90 hover:grayscale-0 transition-all duration-300"
            />
          </div>
        </div>

        {/* Minimal Typography Block */}
        <div className="space-y-1.5">
          <h1 className="text-lg md:text-xl font-bold tracking-[0.3em] text-white uppercase ml-[0.3em]">
            VibeCheck AI
          </h1>
          <div className="h-4 flex items-center justify-center">
            <p className="text-[9px] font-mono tracking-[0.2em] text-[#999999] uppercase font-medium">
              {subtitle}
              <span className="w-1 h-2.5 bg-zinc-500 inline-block animate-pulse ml-1 align-middle" />
            </p>
          </div>
        </div>

        {/* Minimalist 2px loading line */}
        <div className="w-44 pt-2 space-y-2">
          <div className="w-full bg-white/5 h-[2px] rounded-full overflow-hidden p-0">
            <div 
              style={{ width: `${progress}%` }}
              className="h-full rounded-full bg-white transition-all duration-[16ms] ease-linear"
            />
          </div>
          <div className="flex justify-between items-center text-[8px] font-mono text-[#555555] uppercase tracking-widest font-bold px-0.5">
            <span>init sandbox</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

      </div>

    </div>
  );
}
