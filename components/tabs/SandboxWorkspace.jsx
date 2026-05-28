import React, { useEffect, useMemo, useRef, useState } from 'react';
import LiveConsole from '../LiveConsole';
import StageProgress from '../StageProgress';
import {
  AlertTriangle,
  Bot,
  CheckCircle,
  Download,
  ExternalLink,
  GitPullRequest,
  GitBranch,
  MessageSquare,
  Network,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Terminal,
  UploadCloud,
  XCircle
} from 'lucide-react';

function StatusPill({ state, children }) {
  const classes = {
    pending: 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-500 dark:border-zinc-800',
    active: 'bg-amber-500/10 text-amber-600 border-amber-500/25',
    passed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25',
    failed: 'bg-red-500/10 text-red-600 border-red-500/25'
  };
  return <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${classes[state] || classes.pending}`}>{children}</span>;
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-black px-4 py-3">
      <div className="text-[9px] uppercase font-mono font-bold tracking-wider text-zinc-400">{label}</div>
      <div className="mt-1 text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">{value}</div>
    </div>
  );
}

function SandboxChat({ sandboxId, logs, diagnosis, graphSummary }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    setMessages([]);
    setInput('');
    setError('');
  }, [sandboxId, diagnosis?.filePath]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const send = async (preset) => {
    const message = (preset || input).trim();
    if (!message || isSending) return;

    const nextMessages = [...messages, { role: 'user', content: message }];
    setMessages(nextMessages);
    setInput('');
    setError('');
    setIsSending(true);

    try {
      const res = await fetch('/api/sandbox/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sandboxId,
          message,
          history: messages,
          context: {
            logOutput: logs || '',
            explanation: diagnosis?.explanation || '',
            filePath: diagnosis?.filePath || '',
            originalCode: diagnosis?.originalCode || '',
            patchedCode: diagnosis?.patchedCode || '',
            graphSummary: graphSummary || ''
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI chat failed');
      setMessages([...nextMessages, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setError(err.message);
      setMessages(messages);
      setInput(message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-zinc-500" />
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider">Ask AI About This Run</span>
        </div>
        <StatusPill state={diagnosis ? 'passed' : 'pending'}>{diagnosis ? 'Patch Context' : 'Needs Diagnosis'}</StatusPill>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
        {messages.length === 0 && (
          <div className="py-10 text-center text-zinc-400 dark:text-zinc-600 font-mono text-[10px] uppercase tracking-wider space-y-3">
            <Bot className="h-8 w-8 mx-auto" />
            <div>Ask about the error, graph context, patch safety, or alternate fixes.</div>
            <div className="flex flex-wrap justify-center gap-2">
              {['Which files are impacted?', 'Are there multiple root causes?', 'Suggest a safer patch'].map((item) => (
                <button
                  key={item}
                  onClick={() => send(item)}
                  disabled={!diagnosis || isSending}
                  className="px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-40"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[82%] rounded-lg px-3 py-2 leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                : 'bg-zinc-50 border border-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isSending && <div className="flex items-center gap-2 text-zinc-400 font-mono text-[10px] uppercase"><RefreshCw className="h-3.5 w-3.5 animate-spin" />Analyzing context...</div>}
        {error && <div className="text-red-500 font-mono text-[10px]">{error}</div>}
        <div ref={endRef} />
      </div>

      <div className="p-3 border-t border-zinc-200 dark:border-zinc-900 flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          disabled={!diagnosis || isSending}
          placeholder={diagnosis ? 'Ask a focused question...' : 'Run AI diagnosis first'}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:opacity-50"
        />
        <button onClick={() => send()} disabled={!input.trim() || !diagnosis || isSending} className="p-2 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 disabled:opacity-40" title="Send">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function SandboxWorkspace({ sandboxConfig, onNavigateToRepos }) {
  const [repo, setRepo] = useState(sandboxConfig?.repo || null);
  const [sandboxId, setSandboxId] = useState(sandboxConfig?.sandboxId || sandboxConfig?.repo?.sandboxId || null);
  const [sandboxDetails, setSandboxDetails] = useState(null);
  const [activePanel, setActivePanel] = useState('overview');
  const [isPreparing, setIsPreparing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isMainRunning, setIsMainRunning] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [mainResult, setMainResult] = useState(null);
  const [promotionResult, setPromotionResult] = useState(null);
  const [diagnosis, setDiagnosis] = useState(sandboxConfig?.diagnosis || null);
  const [logs, setLogs] = useState('');
  const [mainLogs, setMainLogs] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setRepo(sandboxConfig?.repo || null);
    setSandboxId(sandboxConfig?.sandboxId || sandboxConfig?.repo?.sandboxId || null);
    setDiagnosis(sandboxConfig?.diagnosis || null);
    setRunResult(null);
    setMainResult(null);
    setPromotionResult(null);
    setLogs('');
    setMainLogs('');
    setActivePanel('overview');
    setError('');
  }, [sandboxConfig]);

  const fetchSandboxDetails = async (id = sandboxId) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/sandbox?sandboxId=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load sandbox');
      setSandboxDetails(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchSandboxDetails();
  }, [sandboxId]);

  const graphStats = sandboxDetails?.metadata?.knowledgeGraph?.stats || sandboxDetails?.knowledgeGraph?.stats || {};
  const graphNodes = sandboxDetails?.metadata?.knowledgeGraph?.godNodes || sandboxDetails?.knowledgeGraph?.godNodes || [];
  const graphSummary = graphNodes.map((node) => `${node.label} (${node.source_file})`).join(', ');

  const gateState = useMemo(() => {
    const sandboxPassed = runResult?.status === 'passed';
    const sandboxFailed = runResult?.status === 'failed';
    const mainPassed = mainResult?.status === 'passed';
    const mainFailed = mainResult?.status === 'failed';
    return { sandboxPassed, sandboxFailed, mainPassed, mainFailed };
  }, [runResult, mainResult]);

  const ensureSandbox = async () => {
    if (sandboxId || !repo?.containerId) return sandboxId;
    setIsPreparing(true);
    setError('');
    try {
      const res = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoId: repo.id, containerId: repo.containerId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create sandbox');
      setSandboxId(data.sandboxId);
      setRepo((prev) => prev ? { ...prev, sandboxId: data.sandboxId } : prev);
      await fetchSandboxDetails(data.sandboxId);
      return data.sandboxId;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsPreparing(false);
    }
  };

  const handleRunSandbox = async () => {
    const id = await ensureSandbox();
    if (!id) return;
    setActivePanel('logs');
    setIsRunning(true);
    setRunResult(null);
    setMainResult(null);
    setDiagnosis(null);
    setError('');
    setLogs(`\u001b[90m[VibeCheck AI] sandbox boundary ready: ${id}\u001b[0m\n\u001b[90m[VibeCheck AI] repository graph loaded before execution.\u001b[0m\n\n`);
    try {
      const res = await fetch('/api/sandbox/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sandboxId: id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sandbox execution failed');
      setLogs((prev) => prev + data.logs);
      setRunResult(data);
      setActivePanel(data.status === 'failed' ? 'patch' : 'overview');
      await fetchSandboxDetails(id);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleDiagnose = async () => {
    if (!sandboxId || !runResult?.logs) return;
    setActivePanel('patch');
    setIsDiagnosing(true);
    setError('');
    try {
      const res = await fetch('/api/container/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ containerId: sandboxId, logs: runResult.logs })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || data.explanation || 'AI diagnosis failed');
      setDiagnosis(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleApplyFix = async () => {
    if (!sandboxId || !diagnosis) return;
    setIsApplying(true);
    setError('');
    try {
      const res = await fetch('/api/sandbox/apply-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sandboxId,
          filePath: diagnosis.filePath,
          originalCode: diagnosis.originalCode,
          patchedCode: diagnosis.patchedCode
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply patch in sandbox');
      await fetchSandboxDetails(sandboxId);
      await handleRunSandbox();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsApplying(false);
    }
  };

  const handleRunMainPipeline = async () => {
    if (!repo?.id || !sandboxId) return;
    setActivePanel('logs');
    setIsMainRunning(true);
    setMainResult(null);
    setError('');
    setMainLogs(`\u001b[90m[VibeCheck AI] sandbox verification passed. Copying reviewed patch set into controlled repo pipeline.\u001b[0m\n\n`);
    try {
      const res = await fetch('/api/sandbox/main-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoId: repo.id, sandboxId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Main pipeline failed');
      setMainLogs((prev) => prev + data.logs);
      setMainResult(data);
      setActivePanel('overview');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsMainRunning(false);
    }
  };

  const handlePromote = async () => {
    if (!repo?.id || !sandboxId) return;
    setIsPromoting(true);
    setError('');
    try {
      const res = await fetch('/api/sandbox/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoId: repo.id,
          sandboxId,
          diagnosis: diagnosis ? `${diagnosis.filePath}: ${diagnosis.explanation}` : '',
          explanation: diagnosis?.explanation || ''
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Promotion failed');
      setPromotionResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsPromoting(false);
    }
  };

  const steps = [
    ['Clone', sandboxId ? 'passed' : isPreparing ? 'active' : 'pending'],
    ['Graph', graphStats.nodes ? 'passed' : 'pending'],
    ['Sandbox run', gateState.sandboxPassed ? 'passed' : gateState.sandboxFailed ? 'failed' : isRunning ? 'active' : 'pending'],
    ['AI patch', diagnosis ? 'passed' : gateState.sandboxFailed ? 'active' : 'pending'],
    ['Repo pipeline', gateState.mainPassed ? 'passed' : gateState.mainFailed ? 'failed' : isMainRunning ? 'active' : 'pending'],
    ['Promote', gateState.mainPassed ? 'active' : 'pending']
  ];

  const panels = [
    { id: 'overview', label: 'Overview', icon: ShieldCheck },
    { id: 'logs', label: 'Logs', icon: Terminal },
    { id: 'patch', label: 'AI Patch', icon: Sparkles },
    { id: 'graph', label: 'Knowledge Graph', icon: Network },
    { id: 'chat', label: 'Chat', icon: MessageSquare }
  ];

  if (!repo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-black text-center px-6">
        <ShieldCheck className="h-12 w-12 text-zinc-300 dark:text-zinc-800 mb-4" />
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">No Sandbox Selected</h2>
        <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mt-2 max-w-sm">Clone a repository and VibeCheck will route it here before any pipeline execution.</p>
      </div>
    );
  }

  if (promotionResult) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-black p-8">
        <div className="max-w-xl w-full border border-emerald-500/25 bg-emerald-500/5 rounded-lg p-8 text-center space-y-5">
          <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
          <div>
            <StatusPill state="passed">Verified and promoted</StatusPill>
            <h2 className="mt-3 text-sm font-mono font-bold uppercase tracking-wider">Pull Request Created</h2>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">The fix passed sandbox verification and the controlled repo pipeline before promotion.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={promotionResult.prUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-[10px] font-mono font-bold uppercase flex items-center justify-center gap-2">
              Open PR #{promotionResult.prNumber}<ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button onClick={onNavigateToRepos} className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[10px] font-mono font-bold uppercase">Back to Repositories</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white text-zinc-900 dark:bg-black dark:text-zinc-50">
      <header className="shrink-0 border-b border-zinc-200 dark:border-zinc-900 px-6 py-5">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
              <GitBranch className="h-3.5 w-3.5" />
              {repo.owner}/{repo.name} · {repo.branch}
            </div>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">Sandbox control room</h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">One guided flow for graph-aware diagnostics, sandbox repair, repo verification, and promotion.</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <button onClick={handleRunSandbox} disabled={isPreparing || isRunning} className="px-4 py-2 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 disabled:opacity-50 text-[10px] font-mono font-bold uppercase flex items-center gap-2">
              {isPreparing || isRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Run Sandbox
            </button>
            {gateState.sandboxFailed && !diagnosis && (
              <button onClick={handleDiagnose} disabled={isDiagnosing} className="px-4 py-2 rounded-lg bg-red-600 text-white disabled:opacity-50 text-[10px] font-mono font-bold uppercase flex items-center gap-2">
                {isDiagnosing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Diagnose
              </button>
            )}
            {diagnosis && !gateState.sandboxPassed && (
              <button onClick={handleApplyFix} disabled={isApplying} className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50 text-[10px] font-mono font-bold uppercase flex items-center gap-2">
                {isApplying ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Apply and Rerun
              </button>
            )}
            {gateState.sandboxPassed && !gateState.mainPassed && (
              <button onClick={handleRunMainPipeline} disabled={isMainRunning} className="px-4 py-2 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 disabled:opacity-50 text-[10px] font-mono font-bold uppercase flex items-center gap-2">
                {isMainRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                Verify Repo
              </button>
            )}
            {gateState.mainPassed && (
              <>
                <button onClick={handlePromote} disabled={isPromoting} className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50 text-[10px] font-mono font-bold uppercase flex items-center gap-2">
                  {isPromoting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <GitPullRequest className="h-4 w-4" />}
                  Create PR
                </button>
                <a href={`/api/sandbox/download?sandboxId=${encodeURIComponent(sandboxId)}`} className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[10px] font-mono font-bold uppercase flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-6 gap-3">
          {steps.map(([label, state]) => (
            <div key={label} className="rounded-lg border border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider truncate">{label}</span>
              <StatusPill state={state}>{state}</StatusPill>
            </div>
          ))}
        </div>
        {error && <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 p-3 text-[10px] font-mono">{error}</div>}
      </header>

      <main className="flex-1 min-h-0 p-6 flex flex-col gap-5 overflow-hidden">
        <StageProgress stages={runResult?.stages || []} />

        <div className="shrink-0 flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-900">
          {panels.map((panel) => {
            const Icon = panel.icon;
            const active = activePanel === panel.id;
            return (
              <button key={panel.id} onClick={() => setActivePanel(panel.id)} className={`px-4 py-2.5 -mb-px border-b-2 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-2 ${active ? 'border-zinc-950 dark:border-white text-zinc-950 dark:text-white' : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                <Icon className="h-3.5 w-3.5" />
                {panel.label}
              </button>
            );
          })}
        </div>

        <section className="flex-1 min-h-0 overflow-hidden">
          {activePanel === 'overview' && (
            <div className="h-full overflow-y-auto space-y-5 pr-1">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Metric label="Graph files" value={graphStats.files || 0} />
                <Metric label="Graph nodes" value={graphStats.nodes || 0} />
                <Metric label="Graph edges" value={graphStats.edges || 0} />
                <Metric label="Last sandbox" value={runResult?.status || 'Not run'} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 p-5">
                  <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider">Recommended next action</h3>
                  <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {!runResult && 'Run the sandbox pipeline. VibeCheck will use the repo knowledge graph before diagnosing any errors.'}
                    {gateState.sandboxFailed && !diagnosis && 'Run AI diagnosis. The model will receive logs plus the knowledge graph report to separate root causes from cascading failures.'}
                    {diagnosis && !gateState.sandboxPassed && 'Review the patch, ask questions if needed, then apply it inside the sandbox and rerun.'}
                    {gateState.sandboxPassed && !gateState.mainPassed && 'Sandbox is green. Run the controlled repo pipeline before promotion.'}
                    {gateState.mainPassed && 'Repo verification passed. You can create a PR or download the verified archive.'}
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 p-5">
                  <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider">Central graph nodes</h3>
                  <div className="mt-3 space-y-2">
                    {graphNodes.slice(0, 6).map((node, idx) => (
                      <div key={`${node.id}-${idx}`} className="flex items-center justify-between text-xs">
                        <span className="truncate text-zinc-700 dark:text-zinc-300">{node.label}</span>
                        <span className="ml-3 text-zinc-400 font-mono shrink-0">{node.degree || 0}</span>
                      </div>
                    ))}
                    {graphNodes.length === 0 && <div className="text-xs text-zinc-400">Graph context will appear after clone or sandbox refresh.</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePanel === 'logs' && (
            <div className="h-full grid grid-cols-1 xl:grid-cols-2 gap-5">
              <LiveConsole logs={logs} isRunning={isRunning} />
              <LiveConsole logs={mainLogs} isRunning={isMainRunning} />
            </div>
          )}

          {activePanel === 'patch' && (
            <div className="h-full overflow-y-auto pr-1">
              {diagnosis ? (
                <div className="space-y-5">
                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider">Root cause and impact</h3>
                      <StatusPill state="active">{diagnosis.filePath}</StatusPill>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{diagnosis.explanation}</p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-[11px] font-mono">
                    <div>
                      <div className="mb-2 font-bold uppercase text-red-500">Original</div>
                      <pre className="whitespace-pre-wrap rounded-lg border border-red-500/20 bg-red-500/5 text-red-500 p-4 overflow-auto max-h-[420px]">{diagnosis.originalCode}</pre>
                    </div>
                    <div>
                      <div className="mb-2 font-bold uppercase text-emerald-500">Patched</div>
                      <pre className="whitespace-pre-wrap rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 p-4 overflow-auto max-h-[420px]">{diagnosis.patchedCode}</pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 font-mono text-[10px] uppercase tracking-wider">
                  {gateState.sandboxFailed ? <AlertTriangle className="h-8 w-8 mb-3 text-red-500" /> : <XCircle className="h-8 w-8 mb-3" />}
                  {gateState.sandboxFailed ? 'Run AI diagnosis to create a graph-aware patch.' : 'Patch review appears after a failing sandbox run.'}
                </div>
              )}
            </div>
          )}

          {activePanel === 'graph' && (
            <div className="h-full grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5">
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 p-5 overflow-y-auto">
                <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider">Graphify-compatible output</h3>
                <p className="mt-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  The clone contains `graphify-out/graph.json`, `graph.html`, and `GRAPH_REPORT.md`. AI diagnosis reads this report before selecting a patch target.
                </p>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <Metric label="Files" value={graphStats.files || 0} />
                  <Metric label="Nodes" value={graphStats.nodes || 0} />
                  <Metric label="Edges" value={graphStats.edges || 0} />
                </div>
                <div className="mt-5 space-y-2">
                  {graphNodes.slice(0, 10).map((node, idx) => (
                    <div key={`${node.id}-${idx}`} className="rounded border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-black px-3 py-2">
                      <div className="text-xs font-medium truncate">{node.label}</div>
                      <div className="text-[10px] font-mono text-zinc-400 truncate">{node.source_file} · degree {node.degree || 0}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg bg-zinc-950 border border-zinc-900 overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-300 uppercase font-mono font-bold tracking-wider">Sandbox Diff</span>
                  <StatusPill state={sandboxDetails?.diff && sandboxDetails.diff !== 'No changes detected.' ? 'active' : 'pending'}>Review</StatusPill>
                </div>
                <pre className="flex-1 overflow-auto p-4 text-[11px] leading-relaxed text-zinc-400 whitespace-pre-wrap">{sandboxDetails?.diff || 'No code differences detected yet.'}</pre>
              </div>
            </div>
          )}

          {activePanel === 'chat' && (
            <SandboxChat sandboxId={sandboxId} logs={logs} diagnosis={diagnosis} graphSummary={graphSummary} />
          )}
        </section>
      </main>
    </div>
  );
}
