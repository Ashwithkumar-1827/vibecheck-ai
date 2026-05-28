import React, { useState } from 'react';
import { Cpu, AlertTriangle, ShieldCheck, Flame, Shield, Loader2, MessageSquare, Zap } from 'lucide-react';
import ChatPanel from './ChatPanel';

export default function DiagnosticCard({ patch, onApprove, onReject, buildStatus, buildId, onDiagnose }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [copied, setCopied] = useState(false);

  const isCustom = patch && patch.file_path && !patch.file_path.startsWith('mock_project/');

  const handleCopy = () => {
    navigator.clipboard.writeText(patch.patched_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    // Mark approved in database to transition build status in UI
    onApprove(patch.id);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([patch.patched_code], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    const filename = patch.file_path.split('/').pop() || 'healed_file.py';
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    // Mark approved in database to transition build status in UI
    onApprove(patch.id);
  };

  // Handler for triggering AI diagnosis
  const handleDiagnose = async () => {
    if (isDiagnosing) return;
    setIsDiagnosing(true);
    try {
      await onDiagnose(buildId);
    } finally {
      setIsDiagnosing(false);
    }
  };

  // State: Build succeeded, no patch needed
  if (!patch && buildStatus === 'SUCCESS') {
    return (
      <div className="p-6 bg-white border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-900 rounded-xl flex flex-col items-center text-center space-y-3.5 shadow-sm">
        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-full border border-emerald-100 dark:border-emerald-900/30">
          <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono uppercase tracking-wider">Enterprise Build Green</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-md">
            All integration pipelines are fully cleared and verified. No errors detected in the workspace.
          </p>
        </div>
      </div>
    );
  }

  // State: Build FAILED but no diagnosis yet — show "Run AI Diagnosis" button
  if (!patch && buildStatus === 'FAILED') {
    return (
      <div className="bg-white border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-900 p-5 rounded-xl shadow-sm flex flex-col space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-900 pb-3">
          <div className="flex items-center space-x-2.5">
            <Cpu className="h-4.5 w-4.5 text-zinc-500 shrink-0" />
            <div>
              <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-900 dark:text-zinc-100 uppercase">Pipeline Failure Detected</h3>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">AI diagnosis required</p>
            </div>
          </div>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        </div>

        <div className="text-zinc-600 dark:text-zinc-400 text-[12px] leading-relaxed font-sans bg-zinc-50/50 dark:bg-zinc-900/10 p-4 rounded-lg border border-zinc-200/80 dark:border-zinc-900">
          <p>This build has failed. Click below to trigger the AI diagnostic engine. The model will analyze the pipeline logs, identify the root cause, and generate a code patch — all in real-time with no pre-written answers.</p>
        </div>

        <button
          onClick={handleDiagnose}
          disabled={isDiagnosing}
          className="w-full py-2.5 px-4 rounded-lg bg-zinc-950 hover:bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDiagnosing ? (
            <>
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              <span>AI is analyzing logs...</span>
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 shrink-0" />
              <span>Run AI Diagnosis</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // State: No patch and not SUCCESS/FAILED — generic waiting state
  if (!patch) {
    return (
      <div className="p-6 bg-white border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-900 rounded-xl text-center py-8">
        <Loader2 className="h-5 w-5 text-zinc-400 animate-spin mx-auto mb-2.5" />
        <p className="text-xs font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          Awaiting pipeline failure triggers...
        </p>
      </div>
    );
  }

  // State: Patch exists — full diagnostic card
  return (
    <div className="space-y-4">
      <div className="bg-white border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-900 p-5 rounded-xl shadow-sm flex flex-col space-y-4">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-900 pb-3">
          <div className="flex items-center space-x-2.5">
            <Cpu className="h-4.5 w-4.5 text-zinc-500 shrink-0" />
            <div>
              <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-900 dark:text-zinc-100 uppercase">AI Diagnosis & Impact Assessment</h3>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">VibeCheck Gemini Diagnostic Engine</p>
            </div>
          </div>
          
          {patch.status === 'PENDING' && buildStatus === 'PENDING_APPROVAL' && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-500 dark:bg-zinc-400"></span>
            </span>
          )}
        </div>

        {/* Target Error Indicators */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center space-x-1.5 px-2.5 py-0.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded text-red-700 dark:text-red-400 text-[10px] font-mono font-bold">
            <Flame className="h-3 w-3 shrink-0" />
            <span>CRITICAL FAILURE</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-0.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-700 dark:text-zinc-300 text-[10px] font-mono">
            <span className="text-zinc-400 dark:text-zinc-500">Target:</span>
            <span className="truncate max-w-[180px] font-semibold">{patch.file_path}</span>
          </div>
          {patch.file_path.includes('core/') && (
            <div className="flex items-center space-x-1.5 px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-zinc-900 dark:text-zinc-200 text-[10px] font-mono font-bold">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>SHARED CORE DEPENDENCY</span>
            </div>
          )}
        </div>

        {/* Narrative Explanation */}
        <div className="text-zinc-700 dark:text-zinc-300 text-[12px] leading-relaxed font-sans prose prose-invert bg-zinc-50/50 dark:bg-zinc-900/10 p-4 rounded-lg border border-zinc-200/80 dark:border-zinc-900 max-w-none select-text">
          <p dangerouslySetInnerHTML={{ __html: patch.explanation
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-zinc-900 dark:text-white font-semibold font-mono">$1</strong>')
            .replace(/`(.*?)`/g, '<code class="bg-zinc-100 dark:bg-zinc-900 text-amber-700 dark:text-amber-400 px-1 py-0.5 rounded font-mono text-[10.5px] border border-zinc-200 dark:border-zinc-800">$1</code>')
          }} />
        </div>

        {/* Action / Pipeline Stages Deck */}
        <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-900 space-y-3">
          
          {/* Stage 1: Waiting for Human Approval — with Chat button */}
          {patch.status === 'PENDING' && buildStatus === 'PENDING_APPROVAL' && (
            <div className="space-y-3">
              {/* Chat with AI button */}
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`w-full py-2 px-4 rounded-lg border font-mono text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all duration-150 active:scale-[0.98] ${
                  isChatOpen
                    ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                    : 'bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                <span>{isChatOpen ? 'Close Chat' : 'Chat with AI about this issue'}</span>
              </button>

              {/* Approve / Reject buttons */}
              {isCustom ? (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={handleCopy}
                    className="w-full sm:flex-1 py-2 px-4 rounded-lg bg-zinc-950 hover:bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors duration-150 active:scale-[0.98]"
                  >
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <span>{copied ? 'Copied Patch!' : 'Copy Code Patch'}</span>
                  </button>
                  
                  <button
                    onClick={handleDownload}
                    className="w-full sm:flex-1 py-2 px-4 rounded-lg bg-zinc-950 hover:bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors duration-150 active:scale-[0.98]"
                  >
                    <Zap className="h-4 w-4 shrink-0" />
                    <span>Download Healed File</span>
                  </button>
                  
                  <button
                    onClick={() => onReject(patch.id)}
                    className="w-full sm:w-auto py-2 px-5 rounded-lg bg-transparent hover:bg-zinc-150 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono text-xs uppercase tracking-wider transition-colors duration-150 active:scale-[0.98]"
                  >
                    <span>Reject</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={() => onApprove(patch.id)}
                    className="w-full sm:flex-1 py-2 px-4 rounded-lg bg-zinc-950 hover:bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors duration-150 active:scale-[0.98]"
                  >
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <span>Approve & Execute Patch</span>
                  </button>
                  
                  <button
                    onClick={() => onReject(patch.id)}
                    className="w-full sm:w-auto py-2 px-5 rounded-lg bg-transparent hover:bg-zinc-150 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono text-xs uppercase tracking-wider transition-colors duration-150 active:scale-[0.98]"
                  >
                    <span>Reject Fix</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Stage 2: Active Healing Pipelines (Loading Checklist) */}
          {buildStatus === 'HEALING' && (
            <div className="bg-zinc-50/50 dark:bg-zinc-900/10 p-4 rounded-lg border border-zinc-200/80 dark:border-zinc-900 space-y-3 font-mono text-xs">
              <div className="flex items-center space-x-2 text-zinc-900 dark:text-zinc-100 font-bold uppercase tracking-wider pb-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Healing Pipeline Active</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  <span>Intercepted pipeline failure log</span>
                </div>
                <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  <span>Triggered Gemini Agent diagnostic report</span>
                </div>
                <div className="flex items-center space-x-2 text-zinc-900 dark:text-zinc-100">
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-zinc-400" />
                  <span>Injecting high-precision code patch...</span>
                </div>
                <div className="flex items-center space-x-2 text-zinc-400 dark:text-zinc-650">
                  <div className="w-3.5 h-3.5 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-full" />
                  <span>Re-running pytest suite for validation</span>
                </div>
              </div>
            </div>
          )}

          {/* Stage 3: Successfully Patched & Healed */}
          {patch.status === 'APPROVED' && buildStatus === 'SUCCESS' && (
            <div className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/30 p-4 rounded-lg flex items-start space-x-3">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 font-mono uppercase tracking-wider flex items-center gap-1">
                  Build healed Successfully
                </h4>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-450 mt-1 leading-relaxed">
                  The synthesized patch was applied to <code className="bg-zinc-200/50 dark:bg-zinc-900 px-1 py-0.5 rounded font-mono text-zinc-900 dark:text-zinc-100">{patch.file_path}</code>. Subsequent verification pipelines executed all test suites successfully!
                </p>
              </div>
            </div>
          )}

          {/* Stage 4: Patch Rejected */}
          {patch.status === 'REJECTED' && (
            <div className="bg-zinc-50 border border-zinc-200 dark:bg-zinc-900/20 dark:border-zinc-800 p-4 rounded-lg flex items-start space-x-3">
              <AlertTriangle className="h-4.5 w-4.5 text-zinc-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-zinc-600 dark:text-zinc-450 font-mono uppercase tracking-wider">Patch Rejected By Operator</h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-1 leading-relaxed">
                  AI diagnostic fix was dismissed. Pipeline execution remains flagged as FAILED. Developer manual intervention is requested.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Chat Panel — below the diagnostic card */}
      {buildId && (
        <ChatPanel
          buildId={buildId}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
}

// Simple internal check icon to avoid extra imports
function Check({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
