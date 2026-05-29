import React, { useEffect, useState } from 'react';
import StageProgress from '../StageProgress';
import LiveConsole from '../LiveConsole';
import { Play, Sparkles, RefreshCw, AlertTriangle, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';

export default function PipelineConsole({ selectedRepo, onNavigateToSandbox }) {
  const [repos, setRepos] = useState([]);
  const [activeRepo, setActiveRepo] = useState(selectedRepo || null);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [logs, setLogs] = useState('');
  
  // AI Fix state
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  const [fixSuccess, setFixSuccess] = useState(false);
  const [attempt, setAttempt] = useState(1);
  const [error, setError] = useState('');

  // Sandbox state
  const [isCreatingSandbox, setIsCreatingSandbox] = useState(false);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const res = await fetch('/api/repos');
        const data = await res.json();
        setRepos(data);
        if (!activeRepo && data.length > 0) {
          setActiveRepo(data[0]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchRepos();
  }, [selectedRepo]);

  // Track activeRepo change
  useEffect(() => {
    if (activeRepo) {
      setRunResult(null);
      setLogs('');
      setDiagnosis(null);
      setAttempt(1);
    }
  }, [activeRepo]);

  const handleRunPipeline = async () => {
    if (!activeRepo || !activeRepo.containerId) return;

    setIsRunning(true);
    setRunResult(null);
    setLogs('');
    setDiagnosis(null);
    setError('');

    // Stream fake execution console logs trigger (real execution happens in background API)
    setLogs(`\u001b[90m[VibeCheck AI] ephemeral container starting for workspace ${activeRepo.containerId}...\u001b[0m\n\u001b[90m[VibeCheck AI] sandbox resources restricted: 1 CPU, 512MB RAM, isolated network boundary.\u001b[0m\n\n`);

    try {
      const res = await fetch('/api/container/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoId: activeRepo.id, containerId: activeRepo.containerId })
      });
      const data = await res.json();
      
      if (res.ok) {
        setLogs(prev => prev + data.logs);
        setRunResult(data);
      } else {
        setError(data.error || 'Pipeline execution aborted');
        setIsRunning(false);
      }
    } catch (err) {
      console.error(err);
      setError('Connection failed during pipeline execution');
    } finally {
      setIsRunning(false);
    }
  };

  const handleDiagnose = async () => {
    if (!activeRepo || !runResult) return;

    setIsDiagnosing(true);
    setDiagnosis(null);
    setError('');

    try {
      const res = await fetch('/api/container/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ containerId: activeRepo.containerId, logs: runResult.logs })
      });
      const data = await res.json();
      
      if (res.ok) {
        setDiagnosis(data);
      } else {
        setError(data.error || 'AI could not diagnose this log failure');
      }
    } catch (err) {
      console.error(err);
      setError('AI diagnosis timeout or connection loss');
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleApplyFix = async () => {
    if (!activeRepo || !diagnosis) return;

    setIsApplying(true);
    setError('');

    try {
      const res = await fetch('/api/container/apply-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          containerId: activeRepo.containerId,
          filePath: diagnosis.filePath,
          originalCode: diagnosis.originalCode,
          patchedCode: diagnosis.patchedCode
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setFixSuccess(true);
        setAttempt(prev => prev + 1);
        
        // Auto trigger pipeline re-run to verify the fix!
        setTimeout(() => {
          handleRunPipeline();
        }, 1000);
      } else {
        setError(data.error || 'Failed to apply patch inside container');
      }
    } catch (err) {
      console.error(err);
      setError('Apply patch transaction failure');
    } finally {
      setIsApplying(false);
    }
  };

  const handleCreateSandbox = async () => {
    if (!activeRepo) return;

    setIsCreatingSandbox(true);
    setError('');

    try {
      const res = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoId: activeRepo.id, containerId: activeRepo.containerId })
      });
      const data = await res.json();
      
      if (res.ok) {
        if (onNavigateToSandbox) {
          onNavigateToSandbox(activeRepo, data.sandboxId, diagnosis || null);
        }
      } else {
        setError(data.error || 'Failed to initialize sandbox copy');
      }
    } catch (err) {
      console.error(err);
      setError('Sandbox instantiation connection loss');
    } finally {
      setIsCreatingSandbox(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-white text-zinc-900 dark:bg-[#090909] dark:text-zinc-50">
      
      {/* LEFT COLUMN: Controls & Info (Width: 320px) */}
      <div className="w-full md:w-80 shrink-0 border-r border-zinc-200/80 dark:border-zinc-900/60 p-6 flex flex-col justify-between overflow-y-auto scrollbar-thin">
        <div className="space-y-6">
          
          {/* Repository Context Card Selector */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-550 mb-1.5">
              Active Context Directory
            </label>
            <select
              value={activeRepo ? activeRepo.id : ''}
              onChange={(e) => {
                const r = repos.find(x => x.id === e.target.value);
                if (r) setActiveRepo(r);
              }}
              className="w-full px-4 py-2.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 dark:bg-zinc-950 dark:hover:bg-zinc-900 dark:border-zinc-900 rounded-xl text-xs font-mono focus:outline-none transition-colors text-zinc-900 dark:text-white"
            >
              {repos.length === 0 && <option value="">No Active Sandboxes</option>}
              {repos.map(r => (
                <option key={r.id} value={r.id}>
                  {r.owner}/{r.name} ({r.branch})
                </option>
              ))}
            </select>
          </div>

          <div className="w-full h-[1px] bg-zinc-200 dark:bg-zinc-900/85" />

          {/* Action Trigger Card */}
          <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-900 rounded-2xl p-5 space-y-4">
            <h4 className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
              Pipeline Control
            </h4>
            <p className="text-[9px] text-zinc-400 dark:text-zinc-550 font-mono tracking-tight leading-relaxed">
              Triggers the multi-stage execution stack inside an ephemeral container.
            </p>

            <button
              onClick={handleRunPipeline}
              disabled={isRunning || !activeRepo || activeRepo.status === 'cloning'}
              className="w-full py-3 bg-zinc-950 hover:bg-zinc-900 disabled:opacity-50 dark:bg-white dark:hover:bg-zinc-150 text-white dark:text-zinc-950 text-[10px] font-mono font-bold uppercase tracking-wider rounded-full flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Running Pipeline...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Trigger Pipeline (Run)
                </>
              )}
            </button>

            {attempt > 1 && (
              <div className="text-center">
                <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500 uppercase">
                  Execution Attempt: {attempt}
                </span>
              </div>
            )}
          </div>

          {/* AI Repairs Widget */}
          {runResult && runResult.status === 'failed' && (
            <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-5 space-y-4 transition-all duration-300">
              <div className="flex items-center space-x-2 text-red-500">
                <AlertTriangle className="h-4 w-4" />
                <h4 className="text-[10px] uppercase font-mono tracking-wider font-bold">
                  Pipeline Crashed
                </h4>
              </div>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-550 font-mono tracking-tight leading-relaxed">
                Log capture completed with exit code 1. Autonomic AI resolution available.
              </p>

              {!diagnosis ? (
                <button
                  onClick={handleDiagnose}
                  disabled={isDiagnosing}
                  className="w-full py-3 bg-red-650 hover:bg-red-700 disabled:opacity-50 text-white text-[10px] font-mono font-bold uppercase tracking-wider rounded-full flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98 bg-zinc-950 hover:bg-zinc-900 dark:bg-zinc-900 dark:hover:bg-zinc-850 dark:border dark:border-zinc-800"
                >
                  {isDiagnosing ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Analyzing Log Dump...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Diagnose & Fix (AI)
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleApplyFix}
                  disabled={isApplying}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[10px] font-mono font-bold uppercase tracking-wider rounded-full flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98"
                >
                  {isApplying ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Applying Fix inside VM...
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current" />
                      Apply Fix & Re-Verify
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Verification Success Promotion Card */}
          {runResult && runResult.status === 'passed' && (
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-5 space-y-4 animate-fadeIn transition-all duration-300">
              <div className="flex items-center space-x-2 text-emerald-500">
                <CheckCircle className="h-4 w-4" />
                <h4 className="text-[10px] uppercase font-mono tracking-wider font-bold">
                  Pipeline Verified
                </h4>
              </div>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-550 font-mono tracking-tight leading-relaxed">
                All tests passed successfully in container! Initialize isolated sandbox to prepare PR checkout.
              </p>

              <button
                onClick={handleCreateSandbox}
                disabled={isCreatingSandbox}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[10px] font-mono font-bold uppercase tracking-wider rounded-full flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98"
              >
                {isCreatingSandbox ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Committing VM State...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Create Sandbox
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          )}

        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-mono rounded-xl mt-4">
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Terminal Log Console & AI Code Diff (Flex-1) */}
      <div className="flex-1 flex flex-col p-6 space-y-6 h-full overflow-hidden">
        
        {/* Stages Checklist */}
        <StageProgress stages={runResult ? runResult.stages : []} />

        {/* Dynamic Split Layout: Terminal on top, AI patch below (if diagnosis available) */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          
          <div className={`flex-1 transition-all duration-300 ${diagnosis ? 'h-1/2' : 'h-full'}`}>
            <LiveConsole logs={logs} isRunning={isRunning} />
          </div>

          {diagnosis && (
            <div className="h-1/2 bg-zinc-50 border border-zinc-200/60 dark:bg-zinc-950 dark:border-zinc-900 rounded-2xl p-5 flex flex-col overflow-hidden shadow-sm animate-slideUp">
              
              {/* Diagnosis header */}
              <div className="flex items-center justify-between mb-3 border-b border-zinc-250/20 dark:border-zinc-900/60 pb-3 shrink-0">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4.5 w-4.5 text-indigo-500" />
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-900 dark:text-white">
                    AI Auto-Hotfix Diagnosis for <span className="text-zinc-500 dark:text-zinc-400 font-bold">{diagnosis.filePath}</span>
                  </span>
                </div>
                <span className="text-[9px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25 uppercase">
                  Patch Ready
                </span>
              </div>

              {/* Diagnosis details */}
              <div className="flex-1 overflow-y-auto space-y-4 text-xs font-mono scrollbar-thin">
                
                {/* Explanation text */}
                <div className="text-[10px] leading-relaxed text-zinc-650 dark:text-zinc-400 border-l-2 border-indigo-500 pl-3">
                  <span className="font-bold text-zinc-950 dark:text-white uppercase text-[9px] tracking-wider block mb-1">Root Cause Analysis</span>
                  {diagnosis.explanation}
                </div>

                {/* Diff box */}
                <div className="border border-zinc-200 dark:border-zinc-900 rounded-xl overflow-hidden text-[10px]">
                  <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-900 font-bold text-zinc-400 uppercase tracking-wider text-[9px]">
                    Unified Hotfix Patch Preview
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 text-xs font-mono h-40 overflow-y-auto">
                    
                    {/* Buggy Original */}
                    <div className="p-3 bg-red-500/5 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-900 space-y-1">
                      <span className="text-[8px] uppercase font-bold text-red-500 block mb-2">Original Buggy Segment</span>
                      <pre className="text-red-500 bg-red-500/10 p-2.5 rounded-lg whitespace-pre-wrap font-bold border border-red-500/20">{diagnosis.originalCode}</pre>
                    </div>

                    {/* Autonomic Correction */}
                    <div className="p-3 bg-emerald-500/5 space-y-1">
                      <span className="text-[8px] uppercase font-bold text-emerald-500 block mb-2">AI Patched Drop-In</span>
                      <pre className="text-emerald-500 bg-emerald-500/10 p-2.5 rounded-lg whitespace-pre-wrap font-bold border border-emerald-500/20">{diagnosis.patchedCode}</pre>
                    </div>

                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
