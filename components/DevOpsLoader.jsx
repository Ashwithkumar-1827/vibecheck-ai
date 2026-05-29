import React, { useEffect, useState } from 'react';
import { Terminal, Shield, Cpu, RefreshCw, Layers } from 'lucide-react';

export default function DevOpsLoader() {
  const [progress, setProgress] = useState(0);
  const [visibleLogs, setVisibleLogs] = useState([]);
  const [activeStepIdx, setActiveStepIdx] = useState(0);

  const totalDuration = 3182.7; // 3.1827 seconds

  const logSequence = [
    { time: 0, text: '[0.000s] ⚙️ INITIALIZING EPHEMERAL MICROVM RUNTIME...' },
    { time: 350, text: '[0.350s] 🛡️ VERIFYING PATH TRAVERSAL AND SECURITY ENVELOPES...' },
    { time: 700, text: '[0.700s] 🌿 PARSING GRAPHIFY REPOSITORY SCHEMA NODES...' },
    { time: 1100, text: '[1.100s] 🔐 LOADING SAAS CREDENTIALS VAULT...' },
    { time: 1500, text: '[1.500s] 🧠 ESTABLISHING GEMINI AUTONOMIC TRIAGE SWARM...' },
    { time: 1900, text: '[1.900s] 🐳 MOUNTING ISOLATED EXECUTION SANDBOX...' },
    { time: 2300, text: '[2.300s] 🧪 RUNNING CI/CD HYDRATION TEST SEEDS...' },
    { time: 2700, text: '[2.700s] 🟢 CONTAINER VIBECHECK-CI-3 HEALTHY (UPTIME 99.9%).' },
    { time: 3000, text: '[3.000s] 🚀 PLAYGROUND COCKPIT READY. LAUNCHING OPERATOR VIEW...' }
  ];

  const pipelineSteps = [
    { label: 'CLONE', start: 0, end: 600 },
    { label: 'GRAPHIFY', start: 600, end: 1200 },
    { label: 'SANDBOX', start: 1200, end: 1800 },
    { label: 'AI TRIAGE', start: 1800, end: 2500 },
    { label: 'PROMOTE', start: 2500, end: 3182.7 }
  ];

  useEffect(() => {
    const startTime = Date.now();

    // 1. Log simulation ticker
    const logTimers = logSequence.map(item => {
      return setTimeout(() => {
        setVisibleLogs(prev => [...prev, item.text]);
      }, item.time);
    });

    // 2. Progress and pipeline step updater
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(pct);

      // Find active step
      const stepIdx = pipelineSteps.findIndex(
        step => elapsed >= step.start && elapsed <= step.end
      );
      if (stepIdx !== -1) {
        setActiveStepIdx(stepIdx);
      } else if (elapsed > totalDuration) {
        setActiveStepIdx(pipelineSteps.length - 1);
      }
    }, 16); // ~60fps

    return () => {
      logTimers.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-zinc-950 text-zinc-100 z-[9999] flex flex-col items-center justify-center p-4 font-mono select-none overflow-hidden select-none cursor-wait transition-all duration-300">
      
      {/* Background Matrix/Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#09090b_1px,transparent_1px),linear-gradient(to_bottom,#09090b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />

      {/* Loader Main Console Container */}
      <div className="relative w-full max-w-2xl bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] z-10">
        
        {/* Console Header Bar */}
        <div className="bg-zinc-950/60 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <span className="h-3 w-3 rounded-full bg-green-500/80" />
            <span className="text-[10px] text-zinc-500 font-bold ml-2 uppercase tracking-widest flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-zinc-400" />
              vibecheck-core-orchestrator v1.0.0
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
            <span className="animate-pulse relative flex h-2 w-2 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            secure shell connection
          </div>
        </div>

        {/* Pipeline Stage Indicators (DevOps Flow Visual) */}
        <div className="bg-zinc-950/20 px-6 py-4 border-b border-zinc-850 flex items-center justify-between text-[10px] uppercase font-bold tracking-wider">
          {pipelineSteps.map((step, idx) => {
            const isActive = idx === activeStepIdx;
            const isCompleted = idx < activeStepIdx;
            
            return (
              <React.Fragment key={step.label}>
                <div className={`flex items-center space-x-2 transition-all duration-300 ${
                  isActive 
                    ? 'text-cyan-400 scale-[1.05]' 
                    : isCompleted 
                      ? 'text-emerald-500' 
                      : 'text-zinc-600'
                }`}>
                  <div className={`h-4 w-4 rounded-full flex items-center justify-center text-[8px] border transition-all ${
                    isActive 
                      ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.3)]' 
                      : isCompleted 
                        ? 'bg-emerald-500/10 border-emerald-500' 
                        : 'bg-transparent border-zinc-800'
                  }`}>
                    {isCompleted ? '✓' : idx + 1}
                  </div>
                  <span>{step.label}</span>
                </div>
                {idx < pipelineSteps.length - 1 && (
                  <div className={`flex-1 h-[1px] mx-3 transition-colors duration-300 ${
                    isCompleted ? 'bg-emerald-500/40' : 'bg-zinc-800'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Terminal Screen log logs output view */}
        <div className="p-6 h-56 font-mono text-[11px] leading-relaxed text-zinc-400 overflow-y-auto scrollbar-thin select-text bg-zinc-950/40">
          <div className="space-y-1.5">
            {visibleLogs.map((log, idx) => {
              let color = 'text-zinc-400';
              if (log.includes('🛡️') || log.includes('🟢')) color = 'text-emerald-450';
              if (log.includes('🧠') || log.includes('🚀')) color = 'text-cyan-400';
              if (log.includes('⚙️')) color = 'text-zinc-300';
              
              return (
                <div key={idx} className={`whitespace-nowrap truncate transition-all duration-200 ${color}`}>
                  <span className="text-zinc-600 select-none mr-2 font-bold">❯</span>
                  {log}
                </div>
              );
            })}
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold animate-pulse text-[10px] uppercase">
              <span className="w-1.5 h-3.5 bg-cyan-400 inline-block animate-caret" />
              <span>Orchestrating...</span>
            </div>
          </div>
        </div>

        {/* Console Footer Bar with exact Progress Bar */}
        <div className="bg-zinc-950/60 p-6 border-t border-zinc-800 space-y-4">
          <div className="flex justify-between items-center text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
            <div className="flex items-center space-x-2">
              <Cpu className="h-4 w-4 text-zinc-500 animate-pulse" />
              <span>Host CPU Alloc: 1 Core (Limit)</span>
            </div>
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-3.5 w-3.5 text-zinc-500 animate-spin" />
              <span>Loading: {Math.round(progress)}%</span>
            </div>
          </div>

          {/* Glowing DevOps Progress Bar */}
          <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-850 p-[2px]">
            <div
              style={{ width: `${progress}%` }}
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 shadow-[0_0_12px_rgba(6,182,212,0.6)] transition-all duration-[16ms] ease-linear"
            />
          </div>
        </div>

      </div>
      
      {/* Precision Timestamp Display */}
      <div className="absolute bottom-6 text-[10px] text-zinc-600 font-bold uppercase tracking-widest select-none">
        Calibration sequence interval: <span className="text-zinc-500 font-mono">3.1827s</span>
      </div>
    </div>
  );
}
