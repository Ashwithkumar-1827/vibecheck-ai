import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import DevOpsLoader from '../../components/DevOpsLoader';
import Sidebar from '../../components/Sidebar';
import ConsoleLog from '../../components/ConsoleLog';
import DiagnosticCard from '../../components/DiagnosticCard';
import DiffViewer from '../../components/DiffViewer';
import RepoManager from '../../components/tabs/RepoManager';
import PipelineConsole from '../../components/tabs/PipelineConsole';
import SandboxWorkspace from '../../components/tabs/SandboxWorkspace';
import UserGuide from '../../components/tabs/UserGuide';
import { 
  GitBranch, ChevronRight, Activity, ShieldCheck, AlertCircle, Sliders, 
  Sparkles, Terminal, Database, Key, Cpu, HardDrive, KeyRound, Save, 
  Trash2, CheckCircle, RefreshCw, Play, Info, AlertTriangle, Eye, EyeOff 
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 3182.7);
    return () => clearTimeout(timer);
  }, []);

  const routeToTabMap = {
    pipeline: 'pipelines',
    diagnostics: 'agent',
    repositories: 'repos',
    sandbox: 'sandbox',
    storage: 'database',
    credentials: 'keys',
    guide: 'guide',
    execution: 'execution'
  };

  const tabToRouteMap = {
    pipelines: 'pipeline',
    agent: 'diagnostics',
    repos: 'repositories',
    sandbox: 'sandbox',
    database: 'storage',
    keys: 'credentials',
    guide: 'guide',
    execution: 'execution'
  };

  useEffect(() => {
    if (!router.isReady) return;
    const { tab } = router.query;
    if (tab) {
      const active = routeToTabMap[tab];
      if (active && active !== activeTab) {
        console.log(`[Router] URL updated activeTab to: ${active}`);
        setActiveTab(active);
      }
    } else {
      router.replace('/console/pipeline', undefined, { shallow: true });
    }
  }, [router.isReady, router.query.tab]);

  const [builds, setBuilds] = useState([]);
  const [selectedBuild, setSelectedBuild] = useState(null);
  const [isTriggering, setIsTriggering] = useState(false);

  // SaaS Custom Log Diagnostic Engine State
  const [customJobName, setCustomJobName] = useState('');
  const [customLogOutput, setCustomLogOutput] = useState('');
  const [customSourceCode, setCustomSourceCode] = useState('');
  const [isDiagnosingCustom, setIsDiagnosingCustom] = useState(false);
  const [customError, setCustomError] = useState('');

  const handleCustomDiagnose = async (e) => {
    e.preventDefault();
    if (!customJobName.trim() || !customLogOutput.trim()) {
      setCustomError('Job/Service name and Console log output are required.');
      return;
    }
    setCustomError('');
    setIsDiagnosingCustom(true);

    try {
      const res = await fetch('/api/builds/diagnose-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobName: customJobName,
          logOutput: customLogOutput,
          sourceCode: customSourceCode
        })
      });
      const data = await res.json();
      
      if (res.ok && data.id) {
        // Clear forms
        setCustomJobName('');
        setCustomLogOutput('');
        setCustomSourceCode('');
        
        // Refresh builds and select this new custom build
        await fetchBuilds();
        fetchBuildDetails(data.id);
      } else {
        setCustomError(data.error || 'AI could not generate a patch for this failure.');
      }
    } catch (err) {
      console.error("Failed to run custom diagnosis:", err);
      setCustomError(`Failed to run AI diagnosis: ${err.message}`);
    } finally {
      setIsDiagnosingCustom(false);
    }
  };
  const [systemConfig, setSystemConfig] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to premium dark mode
  const [activeTab, setActiveTab] = useState('pipelines'); // 'pipelines', 'agent', 'database', 'keys', 'repos', 'execution', 'sandbox'
  const [selectedRepoForConsole, setSelectedRepoForConsole] = useState(null);
  const [sandboxConfig, setSandboxConfig] = useState(null);
  
  // Database tab states
  const [rawDbContent, setRawDbContent] = useState('');
  const [dbStatusMsg, setDbStatusMsg] = useState({ type: '', text: '' });
  const [isResettingDb, setIsResettingDb] = useState(false);
  const [isSavingDb, setIsSavingDb] = useState(false);

  // Credentials tab states
  const [credentials, setCredentials] = useState({ openaiKey: '', geminiKey: '' });
  const [credentialsConfigured, setCredentialsConfigured] = useState({ openai: false, gemini: false });
  const [maskedKeys, setMaskedKeys] = useState({ openai: '', gemini: '' });
  const [credStatusMsg, setCredStatusMsg] = useState({ type: '', text: '' });
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  const [showKeys, setShowKeys] = useState({ openai: false, gemini: false });

  // Azure DevOps Tab Coordination (Summary vs Logs)
  const [activeSubTab, setActiveSubTab] = useState('summary');
  
  // ADO Logs Selected Step Navigator
  const [selectedLogStep, setSelectedLogStep] = useState('env');

  // Fetch initial builds and system configuration on mount
  useEffect(() => {
    fetchSystemConfig();
    fetchBuilds(true);
    fetchCredentialsStatus();
  }, []);

  // 2-HOUR BACKGROUND CRON: Automatically append a new enterprise failure scenario
  useEffect(() => {
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    
    const cronRefresh = async () => {
      console.log('[Cron] Triggering 2-hour enterprise scenario refresh...');
      try {
        const res = await fetch('/api/system/refresh', { method: 'POST' });
        const data = await res.json();
        console.log('[Cron] Refresh result:', data.message);
        // Silently reload the builds list to show the new scenario
        fetchBuilds();
      } catch (e) {
        console.error('[Cron] Failed to refresh use cases:', e);
      }
    };

    const intervalId = setInterval(cronRefresh, TWO_HOURS_MS);
    console.log('[Cron] Background scenario refresh scheduler started (every 2 hours).');
    
    return () => clearInterval(intervalId);
  }, []);

  // Sync db raw view when builds update
  useEffect(() => {
    fetchRawDbData();
  }, [builds, activeTab]);

  // DOUBLE-LAYER THEME INJECTION: Force 'dark' class on BOTH document element and document body
  useEffect(() => {
    console.log(`[Theme] Toggling color mode. Dark Mode Active: ${isDarkMode}`);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const fetchSystemConfig = async () => {
    try {
      const res = await fetch('/api/system/config');
      const data = await res.json();
      setSystemConfig(data);
    } catch (e) {
      console.error("Failed to fetch system configuration:", e);
    }
  };

  const fetchBuilds = async (selectLatest = false) => {
    try {
      const res = await fetch('/api/builds');
      const data = await res.json();
      setBuilds(data);
      console.log(`[Database] Fetched builds list successfully: ${data.length} records found.`);
      
      if (selectLatest && data.length > 0) {
        fetchBuildDetails(data[0].id);
      }
    } catch (e) {
      console.error("Failed to fetch builds list:", e);
    }
  };

  const fetchBuildDetails = async (id) => {
    console.log(`[Database] Loading full build details for Build #${id}...`);
    try {
      const res = await fetch(`/api/builds/${id}`);
      const data = await res.json();
      setSelectedBuild(data);
      
      // Reset to Azure DevOps Summary Tab on build selection
      setActiveSubTab('summary');
      setSelectedLogStep('env');
    } catch (e) {
      console.error(`Failed to fetch build details for Build #${id}:`, e);
    }
  };

  const handleSelectBuild = (id) => {
    console.log(`[User Event] Selected Build #${id}`);
    if (id === 'custom_triage') {
      setSelectedBuild('custom_triage');
    } else {
      fetchBuildDetails(id);
    }
  };

  const handleTriggerBuild = async () => {
    console.log("[User Event] Triggered fresh Enterprise Build run.");
    setIsTriggering(true);
    try {
      const res = await fetch('/api/builds', { method: 'POST' });
      const newBuild = await res.json();
      await fetchBuilds();
      setSelectedBuild(newBuild);
    } catch (e) {
      console.error("Failed to trigger pipeline build:", e);
    } finally {
      setIsTriggering(false);
    }
  };

  const handleApprovePatch = async (patchId) => {
    if (!selectedBuild) return;
    console.log(`[User Event] Approved patch #${patchId}. Applying autonomic hotfix fixes...`);
    setSelectedBuild(prev => ({ ...prev, status: 'HEALING' }));
    
    try {
      const res = await fetch(`/api/patches/${patchId}/approve`, { method: 'POST' });
      const result = await res.json();
      
      if (res.ok && result.success) {
        setTimeout(async () => {
          await fetchBuilds();
          setSelectedBuild(result.build);
        }, 1500);
      } else {
        const errMsg = result.error || "The healing pipeline executed but the verification tests failed. Inspect the console logs.";
        alert(`Autonomic Healing Failure:\n\n${errMsg}`);
        await fetchBuilds();
        fetchBuildDetails(selectedBuild.id);
      }
    } catch (e) {
      console.error("Failed to approve and apply code patch:", e);
      alert(`Network/System Error: Failed to apply code patch. ${e.message}`);
      await fetchBuilds();
      fetchBuildDetails(selectedBuild.id);
    }
  };

  const handleRejectPatch = async (patchId) => {
    if (!selectedBuild) return;
    console.log(`[User Event] Rejected proposed patch #${patchId}.`);
    
    try {
      const res = await fetch(`/api/patches/${patchId}/reject`, { method: 'POST' });
      const result = await res.json();
      
      if (result.success) {
        await fetchBuilds();
        setSelectedBuild(result.build);
      }
    } catch (e) {
      console.error("Failed to reject code patch:", e);
    }
  };

  // Trigger AI diagnosis for a FAILED build (no hardcoded answers)
  const handleDiagnose = async (buildId) => {
    console.log(`[User Event] Triggering AI diagnosis for Build #${buildId}...`);
    try {
      const res = await fetch(`/api/builds/${buildId}/diagnose`, { method: 'POST' });
      const result = await res.json();
      
      if (result.error) {
        console.error('Diagnosis failed:', result.error);
        alert(`AI Diagnosis Error: ${result.error}`);
        return;
      }
      
      if (result.build) {
        await fetchBuilds();
        setSelectedBuild(result.build);
      }
    } catch (e) {
      console.error('Failed to trigger AI diagnosis:', e);
      alert('Failed to trigger AI diagnosis. Check console for details.');
    }
  };

  // Fetch masks and env credentials config
  const fetchCredentialsStatus = async () => {
    try {
      const res = await fetch('/api/system/credentials');
      const data = await res.json();
      setCredentialsConfigured({
        openai: data.openai_configured,
        gemini: data.gemini_configured
      });
      setMaskedKeys({
        openai: data.openai_masked,
        gemini: data.gemini_masked
      });
    } catch (err) {
      console.error("Failed to load credentials status:", err);
    }
  };

  // Fetch raw db.json content for editor
  const fetchRawDbData = async () => {
    try {
      const res = await fetch('/api/builds');
      const buildsData = await res.json();
      
      // Let's create a beautiful styled JSON representation including schema overview
      const fullSchema = {
        database_engine: "Zero-Binary Local JSON Core (lib/db.js)",
        records_count: buildsData.length,
        data: buildsData
      };
      setRawDbContent(JSON.stringify(fullSchema, null, 2));
    } catch (e) {
      setRawDbContent("// Failed to query local db.json storage.");
    }
  };

  const handleResetDb = async () => {
    setIsResettingDb(true);
    setDbStatusMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/system/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setDbStatusMsg({ type: 'success', text: 'Database successfully restored to original enterprise seeds.' });
        await fetchBuilds(true);
        fetchSystemConfig();
      } else {
        setDbStatusMsg({ type: 'error', text: 'Failed to clear local database.' });
      }
    } catch (err) {
      setDbStatusMsg({ type: 'error', text: 'Error executing database reset request.' });
    } finally {
      setIsResettingDb(false);
      setTimeout(() => setDbStatusMsg({ type: '', text: '' }), 5000);
    }
  };

  const handleSaveCredentials = async (e) => {
    e.preventDefault();
    setIsSavingKeys(true);
    setCredStatusMsg({ type: '', text: '' });
    
    try {
      const res = await fetch('/api/system/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openaiKey: credentials.openaiKey || undefined,
          geminiKey: credentials.geminiKey || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setCredStatusMsg({ type: 'success', text: 'Credentials stored! Hot-reloading environment context...' });
        setCredentials({ openaiKey: '', geminiKey: '' });
        await fetchCredentialsStatus();
        await fetchSystemConfig();
      } else {
        setCredStatusMsg({ type: 'error', text: 'Failed to update credentials. Check logs.' });
      }
    } catch (err) {
      setCredStatusMsg({ type: 'error', text: 'Network connection failure updating configurations.' });
    } finally {
      setIsSavingKeys(false);
      setTimeout(() => setCredStatusMsg({ type: '', text: '' }), 5000);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUCCESS': return 'text-emerald-600 dark:text-emerald-450';
      case 'FAILED': return 'text-red-600 dark:text-red-450';
      case 'PENDING_APPROVAL': return 'text-amber-600 dark:text-amber-405';
      case 'HEALING': return 'text-zinc-500 dark:text-zinc-400';
      default: return 'text-zinc-400';
    }
  };

  // 1. Diagnostics Cockpit Workspace View (tab: 'agent')
  const renderAgentWorkspace = () => {
    const totalRuns = builds.length;
    const passedRuns = builds.filter(b => b.status === 'SUCCESS').length;
    const failedRuns = builds.filter(b => b.status === 'FAILED' || b.status === 'PENDING_APPROVAL').length;
    const healingRuns = builds.filter(b => b.status === 'HEALING').length;
    const successRate = totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 100) : 100;
    
    return (
      <div className="flex-1 p-8 overflow-y-auto h-full max-w-5xl mx-auto space-y-8 select-text no-scrollbar">
        {/* Apple Style Monochromatic Header */}
        <div className="border-b border-zinc-200 dark:border-zinc-900 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-zinc-950 text-white dark:bg-white dark:text-black rounded-xl">
              <Sparkles className="h-5 w-5 fill-current" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-sans tracking-tight text-zinc-950 dark:text-white uppercase">VibeCheck Diagnostics Dashboard</h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">Enterprise Triage Performance, Latency Gauges, & autonomic hotfix Workflows</p>
            </div>
          </div>
        </div>

        {/* Executive Stats Cards (Apple Design: Flat, high-contrast, padded) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="p-5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm">
            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">Total Pipeline Runs</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{totalRuns}</span>
              <span className="text-xs font-mono text-zinc-400">runs</span>
            </div>
          </div>
          <div className="p-5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm">
            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">Verification Pass Rate</span>
            <div className="flex items-baseline space-x-1.5">
              <span className={`text-3xl font-bold tracking-tight ${successRate > 70 ? 'text-emerald-600' : 'text-zinc-900 dark:text-white'}`}>{successRate}%</span>
              <span className="text-xs font-mono text-zinc-400">healed/green</span>
            </div>
          </div>
          <div className="p-5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm">
            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">Active Failures</span>
            <div className="flex items-baseline space-x-1.5">
              <span className={`text-3xl font-bold tracking-tight ${failedRuns > 0 ? 'text-red-500' : 'text-zinc-900 dark:text-white'}`}>{failedRuns}</span>
              <span className="text-xs font-mono text-zinc-400">triage pending</span>
            </div>
          </div>
          <div className="p-5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm">
            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">Active Healers</span>
            <div className="flex items-baseline space-x-1.5">
              <span className={`text-3xl font-bold tracking-tight ${healingRuns > 0 ? 'text-zinc-900 dark:text-white animate-pulse' : 'text-zinc-900 dark:text-white'}`}>{healingRuns}</span>
              <span className="text-xs font-mono text-zinc-400">in execution</span>
            </div>
          </div>
        </div>

        {/* Diagnostics Latency & Multi-LLM Benchmarks (Google Inspired Panels) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-zinc-200/80 dark:border-zinc-900 pb-3">
              <Cpu className="h-4.5 w-4.5 text-zinc-500" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200">LLM Triage Speed Benchmarks</h3>
            </div>
            
            <div className="space-y-4">
              {/* Row 1: Gemini */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-700 dark:text-zinc-300">Google Gemini 2.5 Flash</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">~0.9s (Active Failover)</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[85%] rounded-full"></div>
                </div>
              </div>
              
              {/* Row 2: OpenAI */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-700 dark:text-zinc-300">OpenAI GPT-4o-mini</span>
                  <span className="text-zinc-500 dark:text-zinc-450">~1.2s (Quota Limited 429)</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-zinc-400 dark:bg-zinc-700 h-full w-[65%] rounded-full"></div>
                </div>
              </div>

              {/* Row 3: Simulator Fallback */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-700 dark:text-zinc-300">Offline Triage Simulator</span>
                  <span className="text-zinc-400 dark:text-zinc-500">~0.01s (Instant Core Engine)</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-zinc-250 dark:bg-zinc-800 h-full w-[98%] rounded-full"></div>
                </div>
              </div>
            </div>
            
            <div className="bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded-lg border border-zinc-250/80 dark:border-zinc-900 text-[10px] text-zinc-450 dark:text-zinc-500 font-mono flex items-start space-x-2">
              <Info className="h-3.5 w-3.5 mt-0.5 text-zinc-400 shrink-0" />
              <span>VibeCheck dynamically evaluates active LLM state constraints. If your configured OpenAI token yields a quota limitation, it initiates zero-delay fallback failover to the Google Gemini Flash API.</span>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl space-y-5 flex flex-col min-h-[460px]">
            <div className="flex items-center space-x-2 border-b border-zinc-200/80 dark:border-zinc-900 pb-3 shrink-0">
              <Activity className="h-4.5 w-4.5 text-zinc-500" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200">automated hotfix pipeline Tree Flowchart</h3>
            </div>

            {/* Tree Flowchart Container (flowcharting frameworks / modeling suites Inspired) */}
            <div className="flex-1 flex flex-col items-center justify-between select-none">
              
              {/* Level 1: Root Node */}
              <div className="relative z-10 flex flex-col items-center shrink-0">
                <div className="bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border border-zinc-900 dark:border-zinc-250 px-6 py-2.5 rounded-xl font-mono text-[9px] uppercase font-bold tracking-widest shadow-sm flex items-center space-x-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>VibeCheck CI-CD Engine</span>
                </div>
              </div>

              {/* Connector Tree level 1 -> level 2 */}
              <div className="w-full h-6 relative select-none pointer-events-none shrink-0">
                <svg className="absolute inset-0 w-full h-full text-zinc-250 dark:text-zinc-800" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="50%" y1="0" x2="50%" y2="50%" />
                  <line x1="25%" y1="50%" x2="75%" y2="50%" />
                  <line x1="25%" y1="50%" x2="25%" y2="100%" />
                  <line x1="75%" y1="50%" x2="75%" y2="100%" />
                </svg>
              </div>

              {/* Level 2 & 3 Combined Vertical Branching Paths */}
              <div className="w-full flex justify-between gap-4 flex-1">
                
                {/* Left Column: Diagnostics Subsystem Branch */}
                <div className="w-[48%] flex flex-col items-center justify-between h-full">
                  <div className="w-full text-center border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 py-2 rounded-lg font-mono text-[8.5px] uppercase font-bold tracking-wider text-zinc-650 dark:text-zinc-300 shadow-sm shrink-0">
                    Diagnostics Pipeline
                  </div>
                  
                  <div className="w-full h-4 relative select-none pointer-events-none shrink-0">
                    <svg className="absolute inset-0 w-full h-full text-zinc-250 dark:text-zinc-800" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <line x1="50%" y1="0" x2="50%" y2="100%" />
                    </svg>
                  </div>

                  {/* Leaf Node 1 */}
                  <div className="w-full bg-zinc-50 dark:bg-zinc-900/25 border border-zinc-200 dark:border-zinc-850 p-3 rounded-xl flex items-center space-x-3 shadow-sm hover:scale-[1.01] transition-transform duration-150 group flex-1 min-h-[72px]">
                    <div className="h-8 w-8 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 rounded-lg flex items-center justify-center text-red-650 dark:text-red-400 shrink-0">
                      <AlertCircle className="h-4.5 w-4.5" />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase text-[9px] tracking-wide font-mono block">1. Intercept Fail</span>
                      <p className="text-[9px] text-zinc-450 dark:text-zinc-500 leading-snug font-sans mt-0.5">Intercepts stdout test tracebacks and dependencies.</p>
                    </div>
                  </div>

                  <div className="w-full h-4 relative select-none pointer-events-none shrink-0">
                    <svg className="absolute inset-0 w-full h-full text-zinc-250 dark:text-zinc-800" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <line x1="50%" y1="0" x2="50%" y2="100%" />
                    </svg>
                  </div>

                  {/* Leaf Node 2 */}
                  <div className="w-full bg-zinc-50 dark:bg-zinc-900/25 border border-zinc-200 dark:border-zinc-850 p-3 rounded-xl flex items-center space-x-3 shadow-sm hover:scale-[1.01] transition-transform duration-150 group flex-1 min-h-[72px]">
                    <div className="h-8 w-8 bg-zinc-950 text-white dark:bg-zinc-900 dark:text-zinc-150 border border-zinc-900 dark:border-zinc-850 rounded-lg flex items-center justify-center text-zinc-400 shrink-0">
                      <Sparkles className="h-4.5 w-4.5 fill-current text-white dark:text-zinc-950" />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase text-[9px] tracking-wide font-mono block">2. Agentic Triage</span>
                      <p className="text-[9px] text-zinc-450 dark:text-zinc-500 leading-snug font-sans mt-0.5">Gemini 1.5 Flash generates high-precision code patches.</p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Healing Subsystem Branch */}
                <div className="w-[48%] flex flex-col items-center justify-between h-full">
                  <div className="w-full text-center border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 py-2 rounded-lg font-mono text-[8.5px] uppercase font-bold tracking-wider text-zinc-650 dark:text-zinc-300 shadow-sm shrink-0">
                    Autonomic Healing
                  </div>
                  
                  <div className="w-full h-4 relative select-none pointer-events-none shrink-0">
                    <svg className="absolute inset-0 w-full h-full text-zinc-250 dark:text-zinc-800" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <line x1="50%" y1="0" x2="50%" y2="100%" />
                    </svg>
                  </div>

                  {/* Leaf Node 3 */}
                  <div className="w-full bg-zinc-50 dark:bg-zinc-900/25 border border-zinc-200 dark:border-zinc-850 p-3 rounded-xl flex items-center space-x-3 shadow-sm hover:scale-[1.01] transition-transform duration-150 group flex-1 min-h-[72px]">
                    <div className="h-8 w-8 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                      <ShieldCheck className="h-4.5 w-4.5" />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase text-[9px] tracking-wide font-mono block">3. Operator Review</span>
                      <p className="text-[9px] text-zinc-450 dark:text-zinc-500 leading-snug font-sans mt-0.5">Human review of diffs. Approval triggers automated injection.</p>
                    </div>
                  </div>

                  <div className="w-full h-4 relative select-none pointer-events-none shrink-0">
                    <svg className="absolute inset-0 w-full h-full text-zinc-250 dark:text-zinc-800" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <line x1="50%" y1="0" x2="50%" y2="100%" />
                    </svg>
                  </div>

                  {/* Leaf Node 4 */}
                  <div className="w-full bg-zinc-50 dark:bg-zinc-900/25 border border-zinc-200 dark:border-zinc-850 p-3 rounded-xl flex items-center space-x-3 shadow-sm hover:scale-[1.01] transition-transform duration-150 group flex-1 min-h-[72px]">
                    <div className="h-8 w-8 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-450 shrink-0">
                      <RefreshCw className="h-4.5 w-4.5 group-hover:animate-spin" />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase text-[9px] tracking-wide font-mono block">4. Autonomic Heal</span>
                      <p className="text-[9px] text-zinc-450 dark:text-zinc-500 leading-snug font-sans mt-0.5">Injects code edits and validates the pytest outcomes.</p>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      </div>
    );
  };

  // 2. Storage Database Console Workspace View (tab: 'database')
  const renderDatabaseWorkspace = () => {
    return (
      <div className="flex-1 p-8 overflow-y-auto h-full max-w-5xl mx-auto space-y-6 select-text no-scrollbar">
        {/* Apple Style Monochromatic Header */}
        <div className="border-b border-zinc-200 dark:border-zinc-900 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-zinc-950 text-white dark:bg-white dark:text-black rounded-xl">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-sans tracking-tight text-zinc-950 dark:text-white uppercase">VibeCheck Database Storage</h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-550 font-mono mt-0.5">Query, Edit, and Reset local database schema parameters dynamically</p>
            </div>
          </div>
        </div>

        {/* Database Info Banner */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl flex items-start space-x-3 text-xs leading-relaxed">
          <Info className="h-4.5 w-4.5 text-zinc-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Zero-Binary SQLite/JSON Framework</span>
            <p className="text-zinc-500 dark:text-zinc-450">
              The application utilizes a transaction-safe local JSON storage core mapped to <code className="bg-zinc-200/50 dark:bg-zinc-900 px-1 py-0.5 rounded font-mono">db.json</code> in your workspace root. This ensures simultaneous pipeline trigger safety, sub-millisecond execution times, and complete portability across servers.
            </p>
          </div>
        </div>

        {/* DB Status Message */}
        {dbStatusMsg.text && (
          <div className={`p-3.5 rounded-lg border text-xs font-mono flex items-center space-x-2 ${
            dbStatusMsg.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' 
              : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30'
          }`}>
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{dbStatusMsg.text}</span>
          </div>
        )}

        {/* JSON Database Viewer Panel */}
        <div className="flex flex-col bg-white border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-900 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-zinc-50 border-b border-zinc-200/80 dark:bg-zinc-900/40 dark:border-zinc-900 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="h-4 w-4 text-zinc-500" />
              <span className="font-mono text-xs text-zinc-800 dark:text-zinc-300 uppercase tracking-widest font-bold">db.json Terminal View</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleResetDb}
                disabled={isResettingDb}
                className="py-1.5 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 rounded font-mono text-[10px] uppercase font-bold tracking-wider flex items-center space-x-1.5 active:scale-[0.98] transition-transform duration-100 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isResettingDb ? 'Resetting...' : 'Reset Database to Seeds'}</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-zinc-50/30 dark:bg-zinc-950/50">
            <textarea
              readOnly
              value={rawDbContent}
              className="w-full h-96 p-4 bg-zinc-950 text-emerald-450 border border-zinc-900 rounded-lg font-mono text-[10.5px] select-text outline-none resize-none focus:ring-0 leading-relaxed scrollbar-thin overflow-y-auto"
            />
          </div>
        </div>
      </div>
    );
  };

  // 3. Credentials Manager Workspace View (tab: 'keys')
  const renderCredentialsWorkspace = () => {
    return (
      <div className="flex-1 p-8 overflow-y-auto h-full max-w-5xl mx-auto space-y-6 select-text no-scrollbar">
        {/* Apple Style Monochromatic Header */}
        <div className="border-b border-zinc-200 dark:border-zinc-900 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-zinc-950 text-white dark:bg-white dark:text-black rounded-xl">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-sans tracking-tight text-zinc-950 dark:text-white uppercase">VibeCheck Credentials Vault</h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-550 font-mono mt-0.5">Securely manage OpenAI, Google Gemini, and failover diagnostic API keys</p>
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <Cpu className="h-4.5 w-4.5 text-zinc-400" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">OpenAI GPT-4o-mini status</span>
                <span className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200">
                  {credentialsConfigured.openai ? maskedKeys.openai : 'Not Configured (Fallback Mode)'}
                </span>
              </div>
            </div>
            <div>
              {credentialsConfigured.openai ? (
                <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-[9px] font-mono font-bold rounded border border-emerald-200 dark:border-emerald-900/30">
                  ACTIVE
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 text-[9px] font-mono rounded border border-zinc-200 dark:border-zinc-800">
                  OFFLINE SIMULATOR
                </span>
              )}
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <Cpu className="h-4.5 w-4.5 text-zinc-400" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">Google Gemini API status</span>
                <span className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200">
                  {credentialsConfigured.gemini ? maskedKeys.gemini : 'Not Configured (Fallback Mode)'}
                </span>
              </div>
            </div>
            <div>
              {credentialsConfigured.gemini ? (
                <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 text-[9px] font-mono font-bold rounded border border-emerald-200 dark:border-emerald-900/30">
                  ACTIVE
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 text-[9px] font-mono rounded border border-zinc-200 dark:border-zinc-800">
                  OFFLINE SIMULATOR
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Credentials Form Message */}
        {credStatusMsg.text && (
          <div className={`p-3.5 rounded-lg border text-xs font-mono flex items-center space-x-2 ${
            credStatusMsg.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30' 
              : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30'
          }`}>
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{credStatusMsg.text}</span>
          </div>
        )}

        {/* Google / OpenAI GCP-Style Keys Form */}
        <div className="p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm space-y-6">
          <div className="flex items-center space-x-2 border-b border-zinc-150 dark:border-zinc-900 pb-3">
            <KeyRound className="h-4.5 w-4.5 text-zinc-500" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200">Configure Local environment variables (.env)</h3>
          </div>

          <form onSubmit={handleSaveCredentials} className="space-y-5">
            {/* OpenAI API Key Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-300 block">
                OpenAI API Key (OPENAI_API_KEY)
              </label>
              <div className="relative">
                <input
                  type={showKeys.openai ? 'text' : 'password'}
                  value={credentials.openaiKey}
                  onChange={(e) => setCredentials(prev => ({ ...prev, openaiKey: e.target.value }))}
                  placeholder={credentialsConfigured.openai ? '••••••••••••••••••••••••••••••••' : 'sk-proj-...'}
                  className="w-full py-2.5 pl-3.5 pr-10 bg-zinc-50/50 focus:bg-white dark:bg-zinc-900/50 dark:focus:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 focus:border-zinc-850 dark:focus:border-zinc-200 rounded-lg text-xs font-mono outline-none transition-all duration-150 text-zinc-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowKeys(prev => ({ ...prev, openai: !prev.openai }))}
                  className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {showKeys.openai ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              <p className="text-[9.5px] text-zinc-450 dark:text-zinc-500 font-mono">
                Used to trigger high-fidelity GPT-4o-mini structured triage patches. Saves to the sandbox environment root directly.
              </p>
            </div>

            {/* Gemini API Key Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-300 block">
                Google Gemini API Key (GEMINI_API_KEY)
              </label>
              <div className="relative">
                <input
                  type={showKeys.gemini ? 'text' : 'password'}
                  value={credentials.geminiKey}
                  onChange={(e) => setCredentials(prev => ({ ...prev, geminiKey: e.target.value }))}
                  placeholder={credentialsConfigured.gemini ? '••••••••••••••••••••••••••••••••' : 'AIzaSy...'}
                  className="w-full py-2.5 pl-3.5 pr-10 bg-zinc-50/50 focus:bg-white dark:bg-zinc-900/50 dark:focus:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 focus:border-zinc-850 dark:focus:border-zinc-200 rounded-lg text-xs font-mono outline-none transition-all duration-150 text-zinc-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowKeys(prev => ({ ...prev, gemini: !prev.gemini }))}
                  className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {showKeys.gemini ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              <p className="text-[9.5px] text-zinc-450 dark:text-zinc-500 font-mono">
                Google Free-tier Gemini 2.5 Flash failover fallback diagnostics key. Triggers failover seamlessly if OpenAI hits quotas!
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingKeys || (!credentials.openaiKey && !credentials.geminiKey)}
                className={`py-2.5 px-6 rounded-lg bg-zinc-950 hover:bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 font-mono font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition-colors duration-150 active:scale-[0.98] ${
                  isSavingKeys || (!credentials.openaiKey && !credentials.geminiKey) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Save className="h-4 w-4 shrink-0" />
                <span>{isSavingKeys ? 'Saving...' : 'Update & Hot-Reload Keys'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // SaaS Custom Triage Form Panel
  const renderCustomTriageConsole = () => {
    return (
      <div className="flex-1 p-8 overflow-y-auto h-full max-w-4xl mx-auto space-y-6 select-text no-scrollbar">
        {/* Apple Style Monochromatic Header */}
        <div className="border-b border-zinc-200 dark:border-zinc-900 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-zinc-950 text-white dark:bg-white dark:text-black rounded-xl">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-sans tracking-tight text-zinc-950 dark:text-white uppercase">SaaS Custom Triage Console</h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-550 font-mono mt-0.5">Diagnose any raw trace logs and source code in a 100% secure, zero-trust sandbox</p>
            </div>
          </div>
        </div>

        {/* Security Guard Notice */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl flex items-start space-x-3 text-xs leading-relaxed">
          <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Production Security Guard Engaged</span>
            <p className="text-zinc-500 dark:text-zinc-400">
              VibeCheck operates a zero-write execution sandbox for custom user data. Your files are **never** written to our servers. The AI generates patches which are presented here for your review and grilling chat, allowing you to securely copy or download the healed files to apply locally.
            </p>
          </div>
        </div>

        {/* Error message display */}
        {customError && (
          <div className="p-3.5 bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30 rounded-lg text-xs font-mono flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{customError}</span>
          </div>
        )}

        {/* Form Submission Card */}
        <form onSubmit={handleCustomDiagnose} className="p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm space-y-5">
          {/* Job Name Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-300 block">
              Job / Service Name
            </label>
            <input
              type="text"
              required
              value={customJobName}
              onChange={(e) => setCustomJobName(e.target.value)}
              placeholder="e.g. payment-gateway-deploy, main-billing-pipeline"
              className="w-full py-2.5 px-3.5 bg-zinc-50/50 focus:bg-white dark:bg-zinc-900/50 dark:focus:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 focus:border-zinc-850 dark:focus:border-zinc-200 rounded-lg text-xs font-mono outline-none transition-all duration-150 text-zinc-900 dark:text-white"
            />
          </div>

          {/* Raw Logs Textarea */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-300 block">
              Raw Console Logs / Failure Tracebacks
            </label>
            <textarea
              required
              rows={6}
              value={customLogOutput}
              onChange={(e) => setCustomLogOutput(e.target.value)}
              placeholder="Paste the stderr logs, AssertionError, ZeroDivisionError, SyntaxError traceback details here..."
              className="w-full p-3.5 bg-zinc-50/50 focus:bg-white dark:bg-zinc-900/50 dark:focus:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 focus:border-zinc-850 dark:focus:border-zinc-200 rounded-lg text-xs font-mono outline-none transition-all duration-150 text-zinc-900 dark:text-white leading-relaxed resize-y scrollbar-thin"
            />
          </div>

          {/* Source Code Textarea */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-305 block">
              Original Buggy Source Code (Optional)
            </label>
            <textarea
              rows={8}
              value={customSourceCode}
              onChange={(e) => setCustomSourceCode(e.target.value)}
              placeholder="Paste the contents of the buggy file here. If provided, the AI will generate a side-by-side git diff patch you can review and download..."
              className="w-full p-3.5 bg-zinc-50/50 focus:bg-white dark:bg-zinc-900/50 dark:focus:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 focus:border-zinc-850 dark:focus:border-zinc-200 rounded-lg text-xs font-mono outline-none transition-all duration-150 text-zinc-900 dark:text-white leading-relaxed resize-y scrollbar-thin"
            />
          </div>

          {/* Submit Trigger */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isDiagnosingCustom}
              className={`w-full py-2.5 px-4 rounded-lg bg-zinc-950 hover:bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all duration-150 active:scale-[0.98] ${
                isDiagnosingCustom ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isDiagnosingCustom ? (
                <>
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  <span>AI is running multi-model diagnostics...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>Analyze & Generate Patch</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  };

  // 4. Default Pipelines Three-Column Workspace View (tab: 'pipelines')
  const renderPipelinesWorkspace = () => {
    // Dynamic ADO Logs Slicing Helper
    const getSlicedLogs = (build, stepId) => {
      if (!build || !build.log_output) return "No logs available.";
      
      const rawLog = build.log_output;
      
      // Step 1: Environment Initialization
      if (stepId === 'env') {
        return `============================= ENVIRONMENT INITIALIZATION =============================
Platform: win32 -- Python 3.10.2, pytest-7.4.0
Root directory: C:\\Users\\mashw\\Desktop\\Open AI\\mock_project
Configured modules: core/security.py, services/billing.py, services/report_engine.py
Verification environment successfully loaded.
Ready to run test suites...`;
      }
      
      // Step 2: core/security.py
      if (stepId === 'sec') {
        if (build.status === 'SUCCESS') {
          return `============================= VERIFYING core/security.py =============================
tests/test_security.py .                                                 [ 33%]

============================== 1 passed in 0.03s ==============================`;
        }
        
        // If Scenario A (Cascading Zero Division)
        if (rawLog.includes('ZeroDivisionError') || String(build.id) === '105' || String(build.id) === '106' || String(build.id) === '107' || build.target_scenario?.includes('Cascading')) {
          return `============================= VERIFYING core/security.py =============================
tests/test_security.py F                                                 [ 33%]

================================== FAILURES ===================================
______________________________ test_security_zero_scale _______________________

    def test_security_zero_scale():
        # Dynamic zero division vector: triggers crash in core/security.py.
>       assert validate_token("header.user:admin;scale:0.signature") is True

tests/test_security.py:13: 
_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _

token = 'header.user:admin;scale:0.signature'

    def validate_token(token: str) -> bool:
        ...
        try:
            scale = int(scale_str)
        except ValueError:
            scale = 1
            
        # BUG: Division by zero when scale is 0.
>       factor = 100 / scale
E       ZeroDivisionError: division by zero

core/security.py:27: ZeroDivisionError
============================== 1 failed in 0.05s ==============================`;
        }
        
        // Default green for this step in other scenarios
        return `============================= VERIFYING core/security.py =============================
tests/test_security.py .                                                 [ 33%]

============================== 1 passed in 0.03s ==============================`;
      }
      
      // Step 3: services/billing.py
      if (stepId === 'bill') {
        if (build.status === 'SUCCESS') {
          return `============================= VERIFYING services/billing.py =============================
tests/test_billing.py .                                                  [ 66%]

============================== 1 passed in 0.04s ==============================`;
        }
        
        // Scenario B (Syntax Error)
        if (rawLog.includes('SyntaxError') || String(build.id) === '103' || build.target_scenario?.includes('Syntax Error')) {
          return `============================= VERIFYING services/billing.py =============================
ImportError while importing test module 'C:\\Users\\mashw\\Desktop\\Open AI\\mock_project\\tests\\test_billing.py'.
Directory import failed because BillingService has a compilation error.
  File "C:\\Users\\mashw\\Desktop\\Open AI\\mock_project\\services\\billing.py", line 6
    def process_payment(self, amount: float, token: str)
                                                       ^
SyntaxError: expected ':' to terminate method signature

=========================== 1 error in 0.02s ===========================`;
        }
        
        // Scenario A (Cascading Zero Division)
        if (rawLog.includes('ZeroDivisionError') || String(build.id) === '105' || String(build.id) === '106' || String(build.id) === '107' || build.target_scenario?.includes('Cascading')) {
          return `============================= VERIFYING services/billing.py =============================
tests/test_billing.py F                                                  [ 66%]

================================== FAILURES ===================================
______________________________ test_billing_payment ___________________________
Import dependency core/security.py failed because validate_token crashed.
  File "core/security.py", line 27
    factor = 100 / scale
ZeroDivisionError: division by zero

============================== 1 failed in 0.04s ==============================`;
        }
        
        // Default green for this step in other scenarios
        return `============================= VERIFYING services/billing.py =============================
tests/test_billing.py .                                                  [ 66%]

============================== 1 passed in 0.03s ==============================`;
      }
      
      // Step 4: services/report_engine.py
      if (stepId === 'rep') {
        if (build.status === 'SUCCESS') {
          return `============================= VERIFYING services/report_engine.py =============================
tests/test_reports.py .                                                  [100%]

============================== 1 passed in 0.04s ==============================`;
        }
        
        // Scenario C (Logical Assertion Error) or Build 104
        if (rawLog.includes('AssertionError') || String(build.id) === '104' || build.target_scenario?.includes('Logical')) {
          return `============================= VERIFYING services/report_engine.py =============================
tests/test_reports.py F                                                  [100%]

================================== FAILURES ===================================
________________________ test_compile_financials_report _______________________

    def test_compile_financials_report():
        ...
        result = engine.compile_financials(transactions, "header.user:admin;scale:2.signature")
        
        assert result["total_cleared"] == 600.0
        
        # BUG: Logical assertion regression.
>       assert result["growth"] == 40.0
E       AssertionError: assert 20.0 == 40.0
E         -20.0
E         +40.0

tests/test_reports.py:16: AssertionError
============================== 1 failed in 0.06s ==============================`;
        }
        
        // Scenario B (Syntax Error) cascading
        if (rawLog.includes('SyntaxError') || String(build.id) === '103' || build.target_scenario?.includes('Syntax Error')) {
          return `============================= VERIFYING services/report_engine.py =============================
ImportError while importing test module 'C:\\Users\\mashw\\Desktop\\Open AI\\mock_project\\tests\\test_reports.py'.
Dependency services/billing.py has a compilation error.
  File "services/billing.py", line 6
    def process_payment(self, amount: float, token: str)
SyntaxError: expected ':' to terminate method signature

=========================== 1 error in 0.02s ===========================`;
        }
        
        // Scenario A (Cascading Zero Division)
        if (rawLog.includes('ZeroDivisionError') || String(build.id) === '105' || String(build.id) === '106' || String(build.id) === '107' || build.target_scenario?.includes('Cascading')) {
          return `============================= VERIFYING services/report_engine.py =============================
tests/test_reports.py F                                                  [100%]

================================== FAILURES ===================================
________________________ test_compile_financials_report _______________________
Import dependency core/security.py failed because validate_token crashed.
  File "core/security.py", line 27
    factor = 100 / scale
ZeroDivisionError: division by zero

============================== 1 failed in 0.04s ==============================`;
        }
        
        // Default green
        return `============================= VERIFYING services/report_engine.py =============================
tests/test_reports.py .                                                  [100%]

============================== 1 passed in 0.03s ==============================`;
      }

      // Step 5: services/database.py
      if (stepId === 'db') {
        if (build.status === 'SUCCESS') {
          return `============================= VERIFYING services/database.py =============================
tests/test_database.py .                                                 [ 80%]

============================== 1 passed in 0.03s ==============================`;
        }

        // Scenario D (Database pool exhaustion)
        if (rawLog.includes('Connection pool exhausted') || build.target_scenario?.includes('Database') || build.target_scenario?.includes('Timeout')) {
          return `============================= VERIFYING services/database.py =============================
tests/test_database.py F                                                 [ 80%]

================================== FAILURES ===================================
___________________________ test_database_connection __________________________

    def test_database_connection():
        service = DatabaseService()
        for i in range(5):
            service.execute_query(f"SELECT {i}")
            
>       service.execute_query("SELECT 6")

tests/test_database.py:12: 
_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _

self = <services.database.DatabaseConnectionPool object at 0x0000021F38AC39D0>

    def get_connection(self):
        if self.active_connections >= self.size:
>           raise RuntimeError("TimeoutError: Connection pool exhausted. Too many active cursors.")
E           RuntimeError: TimeoutError: Connection pool exhausted. Too many active cursors.

services/database.py:9: RuntimeError
============================== 1 failed in 0.04s ==============================`;
        }

        // Scenario A (Cascading division by zero)
        if (rawLog.includes('ZeroDivisionError') || build.target_scenario?.includes('Cascading')) {
          return `============================= VERIFYING services/database.py =============================
tests/test_database.py F                                                 [ 80%]

================================== FAILURES ===================================
___________________________ test_database_connection __________________________
Import dependency core/security.py failed because validate_token crashed.
  File "core/security.py", line 27
    factor = 100 / scale
ZeroDivisionError: division by zero

============================== 1 failed in 0.04s ==============================`;
        }

        return `============================= VERIFYING services/database.py =============================
tests/test_database.py .                                                 [ 80%]

============================== 1 passed in 0.03s ==============================`;
      }

      // Step 6: services/payment_gateway.py
      if (stepId === 'pay') {
        if (build.status === 'SUCCESS') {
          return `============================= VERIFYING services/payment_gateway.py =============================
tests/test_payment.py .                                                  [100%]

============================== 1 passed in 0.02s ==============================`;
        }

        // Scenario E (Payment webhook KeyError)
        if (rawLog.includes('KeyError') || build.target_scenario?.includes('Webhook') || build.target_scenario?.includes('Payment') || build.target_scenario?.includes('KeyError')) {
          return `============================= VERIFYING services/payment_gateway.py =============================
tests/test_payment.py F                                                  [100%]

================================== FAILURES ===================================
__________________________ test_payment_webhook_keys __________________________

    def test_payment_webhook_keys():
        gateway = PaymentGatewayService()
        invalid_payload = {"transaction": "tx_9921", "amount": 150.0}
        
>       assert gateway.parse_webhook_payload(invalid_payload) == "default_merchant"

tests/test_payment.py:10: 
_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _

self = <services.payment_gateway.PaymentGatewayService object at 0x0000021F38AC40B0>
payload = {'transaction': 'tx_9921', 'amount': 150.0}

    def parse_webhook_payload(self, payload):
>       return payload["meta"]["merchant_id"]
E       KeyError: 'meta'

services/payment_gateway.py:11: KeyError
============================== 1 failed in 0.03s ==============================`;
        }

        // Scenario A or B cascading
        if (rawLog.includes('ZeroDivisionError') || build.target_scenario?.includes('Cascading') || rawLog.includes('SyntaxError') || build.target_scenario?.includes('Syntax Error')) {
          return `============================= VERIFYING services/payment_gateway.py =============================
tests/test_payment.py F                                                  [100%]

================================== FAILURES ===================================
Import error: Dependency billing or security failed.
  File "services/billing.py", line 6
    def process_payment(self, amount: float, token: str)
SyntaxError: expected ':' to terminate method signature

=========================== 1 error in 0.02s ===========================`;
        }

        return `============================= VERIFYING services/payment_gateway.py =============================
tests/test_payment.py .                                                  [100%]

================-------------- 1 passed in 0.02s ==============================`;
      }
      
      return rawLog;
    };

    // Dynamic ADO Stages progress builder
    const renderStagesTree = (build) => {
      const isSuccess = build.status === 'SUCCESS';
      const isTriage = build.status === 'PENDING_APPROVAL' || build.status === 'FAILED';
      
      // Determine step statuses dynamically based on failing scenarios
      let s1 = 'passed';
      let s2 = 'passed';
      let s3 = 'passed';
      let s4 = 'passed';
      let s5 = 'passed';
      let s6 = 'passed';

      if (isTriage || build.status === 'HEALING') {
        if (build.target_scenario?.includes('Syntax Error') || String(build.id) === '103') {
          s3 = 'failed';
          s4 = 'failed'; // Cascade imports
          s6 = 'failed'; // Cascade imports to payment gateway
        } else if (build.target_scenario?.includes('Cascading') || String(build.id) === '105' || String(build.id) === '106' || String(build.id) === '107') {
          s2 = 'failed';
          s3 = 'failed';
          s4 = 'failed'; // Cascade divisions
          s5 = 'failed'; // Cascade divisions to db
          s6 = 'failed'; // Cascade divisions to payment
        } else if (build.target_scenario?.includes('Logical') || String(build.id) === '104') {
          s4 = 'failed'; // Assertion typo
        } else if (build.target_scenario?.includes('Database') || build.target_scenario?.includes('Timeout')) {
          s5 = 'failed'; // Database leak
        } else if (build.target_scenario?.includes('KeyError') || build.target_scenario?.includes('Webhook') || build.target_scenario?.includes('Payment')) {
          s6 = 'failed'; // Webhook KeyError
        }
      }

      const stages = [
        { name: '1. Initialize Environment & Packages', status: s1, details: 'Verified Node.js environment (v22.13.1) and Python packages successfully.' },
        { name: '2. Verify core/security.py (Token Validator)', status: s2, details: s2 === 'passed' ? 'Core security token parsing and math division tests verified.' : 'CRITICAL FAILURE: ZeroDivisionError inside validate_token.' },
        { name: '3. Verify services/billing.py (Payment Gateway)', status: s3, details: s3 === 'passed' ? 'Billing module payment gateway compiles and validates successfully.' : s3 === 'failed' && s2 === 'failed' ? 'CASCADING FAILURE: Import dependency core/security.py failed.' : 'CRITICAL FAILURE: SyntaxError missing mandatory method colon (:).' },
        { name: '4. Verify services/report_engine.py (Analytics Suite)', status: s4, details: s4 === 'passed' ? 'Compiled reporting spreadsheets and assertion tests validated.' : s4 === 'failed' && s2 === 'failed' ? 'CASCADING FAILURE: Import dependency core/security.py failed.' : 'CRITICAL FAILURE: AssertionError on growth calculation expected 40.0.' },
        { name: '5. Verify services/database.py (Database Connection Pool)', status: s5, details: s5 === 'passed' ? 'Database cursors, connections lease and release connection tests passing.' : s5 === 'failed' && s2 === 'failed' ? 'CASCADING FAILURE: Import dependency core/security.py failed.' : 'CRITICAL FAILURE: TimeoutError: Connection pool exhausted. Too many active cursors.' },
        { name: '6. Verify services/payment_gateway.py (Payment Webhook)', status: s6, details: s6 === 'passed' ? 'Payment provider webhooks and webhook refund processors operating cleanly.' : s6 === 'failed' && s2 === 'failed' ? 'CASCADING FAILURE: Import dependency core/security.py failed.' : 'CRITICAL FAILURE: KeyError: "meta" is absent in webhook callbacks payload.' }
      ];

      return (
        <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-900 rounded-xl p-5 space-y-4 max-w-4xl select-text">
          <div className="flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-900 pb-2">
            <Activity className="h-4 w-4 text-zinc-500" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Stages / Jobs Execution</h4>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {stages.map((stage, idx) => (
              <div key={idx} className="flex items-start space-x-3.5">
                <div className="mt-0.5 shrink-0 flex items-center justify-center">
                  {stage.status === 'passed' ? (
                    <div className="h-4 w-4 rounded-full bg-emerald-50 border border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-900/30 flex items-center justify-center">
                      <CheckCircle className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  ) : (
                    <div className="h-4 w-4 rounded-full bg-red-50 border border-red-300 dark:bg-red-950/20 dark:border-red-900/30 flex items-center justify-center animate-pulse">
                      <AlertCircle className="h-2.5 w-2.5 text-red-600 dark:text-red-400" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-0.5">
                  <span className={`font-bold text-[11px] uppercase ${stage.status === 'passed' ? 'text-zinc-800 dark:text-zinc-200' : 'text-red-700 dark:text-red-450'}`}>
                    {stage.name}
                  </span>
                  <p className="text-[10px] text-zinc-450 dark:text-zinc-500 leading-relaxed font-sans">{stage.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    // Dynamic ADO logs step console
    const renderAdoLogsWorkspace = (build) => {
      const isSuccess = build.status === 'SUCCESS';
      const isTriage = build.status === 'PENDING_APPROVAL' || build.status === 'FAILED';
      
      const isScenarioA = build.log_output?.includes('ZeroDivisionError') || build.target_scenario?.includes('Cascading');
      const isScenarioB = build.log_output?.includes('SyntaxError') || build.target_scenario?.includes('Syntax Error');
      const isScenarioC = build.log_output?.includes('AssertionError') || build.target_scenario?.includes('Logical');
      const isScenarioD = build.log_output?.includes('Connection pool exhausted') || build.target_scenario?.includes('Database') || build.target_scenario?.includes('Timeout');
      const isScenarioE = build.log_output?.includes('KeyError') || build.target_scenario?.includes('Webhook') || build.target_scenario?.includes('Payment');

      const steps = [
        { id: 'env', name: '1. Initialize Environment', status: 'passed' },
        { id: 'sec', name: '2. Verify core/security.py', status: !isTriage || (!isScenarioA) ? 'passed' : 'failed' },
        { id: 'bill', name: '3. Verify services/billing.py', status: !isTriage || (!isScenarioA && !isScenarioB) ? 'passed' : 'failed' },
        { id: 'rep', name: '4. Verify services/report_engine.py', status: !isTriage || (!isScenarioA && !isScenarioB && !isScenarioC) ? 'passed' : 'failed' },
        { id: 'db', name: '5. Verify services/database.py', status: !isTriage || (!isScenarioA && !isScenarioD) ? 'passed' : 'failed' },
        { id: 'pay', name: '6. Verify services/payment_gateway.py', status: !isTriage || (!isScenarioA && !isScenarioB && !isScenarioE) ? 'passed' : 'failed' }
      ];

      return (
        <div className="flex-1 flex overflow-hidden w-full h-full divide-x divide-zinc-200 dark:divide-zinc-900 -mx-6 -mb-6">
          {/* Logs Left Sidebar: Steps Navigator (Width: 220px) */}
          <div className="w-[220px] shrink-0 h-full flex flex-col p-4 space-y-2 bg-zinc-50/50 dark:bg-zinc-950/10 overflow-y-auto no-scrollbar border-r border-zinc-200 dark:border-zinc-900">
            <span className="text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest px-2 pb-1.5 block">Job Steps</span>
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => setSelectedLogStep(step.id)}
                className={`w-full py-2 px-3 rounded-lg text-left font-mono text-[10px] font-bold transition-all flex items-center justify-between border ${
                  selectedLogStep === step.id 
                    ? 'bg-white border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 text-zinc-900 dark:text-white shadow-sm' 
                    : 'bg-transparent border-transparent text-zinc-500 hover:bg-zinc-100/40 dark:hover:bg-zinc-900/10 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <span className="truncate">{step.name}</span>
                {step.status === 'passed' ? (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-450 shrink-0 ml-1.5" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400 shrink-0 ml-1.5 animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* Logs Right Panel: Sliced Console logs */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-6 bg-white dark:bg-black">
            <ConsoleLog logOutput={getSlicedLogs(build, selectedLogStep)} />
          </div>
        </div>
      );
    };

    return (
      <div className="flex-1 flex overflow-hidden w-full h-full bg-white text-zinc-900 dark:bg-black dark:text-zinc-50 transition-colors duration-250">
        
        {/* Column 1: Stable Fixed-width Builds History Sidebar */}
        <div className="w-64 border-r border-zinc-200/80 dark:border-zinc-900 shrink-0 h-full flex flex-col">
          <Sidebar
            builds={builds}
            selectedBuild={selectedBuild}
            onSelectBuild={handleSelectBuild}
            onTriggerBuild={handleTriggerBuild}
            isTriggering={isTriggering}
          />
        </div>

        {/* Master Workspace Detail Panel */}
        <div className="flex-1 flex overflow-hidden h-full bg-white dark:bg-black">
          
          {selectedBuild === 'custom_triage' ? (
            renderCustomTriageConsole()
          ) : selectedBuild ? (
            <div className="flex-1 flex flex-col p-6 min-w-0 h-full overflow-hidden transition-colors duration-200">
              
              {/* Azure DevOps Breadcrumb & Metadata Panel */}
              <div className="border-b border-zinc-200 dark:border-zinc-900/80 pb-3 mb-4 shrink-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
                    <span>Pipelines</span>
                    <ChevronRight className="h-3 w-3" />
                    <span>VibeCheck CI-CD</span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-zinc-900 dark:text-white">Run #{selectedBuild.id}</span>
                  </div>
                  
                  {/* Flat ADO status pill */}
                  {selectedBuild.status === 'SUCCESS' ? (
                    <span className="text-[9px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 px-2 py-0.5 rounded border border-emerald-250 dark:border-emerald-900/30">SUCCEEDED</span>
                  ) : selectedBuild.status === 'PENDING_APPROVAL' ? (
                    <span className="text-[9px] font-mono font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-450 px-2 py-0.5 rounded border border-amber-250 dark:border-amber-900/30 animate-pulse">NEEDS ATTENTION</span>
                  ) : selectedBuild.status === 'HEALING' ? (
                    <span className="text-[9px] font-mono font-bold bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 animate-pulse">HEALING RUN</span>
                  ) : (
                    <span className="text-[9px] font-mono font-bold bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-450 px-2 py-0.5 rounded border border-red-250 dark:border-red-900/30">FAILED</span>
                  )}
                </div>

                {/* ADO Metadata ribbon */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono text-zinc-450 dark:text-zinc-500">
                  <div className="flex items-center space-x-1">
                    <GitBranch className="h-3.5 w-3.5" />
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">main</span>
                  </div>
                  <span>•</span>
                  <span>Commit: <span className="font-bold text-zinc-700 dark:text-zinc-300">a3f4c82</span></span>
                  <span>•</span>
                  <span>Triggered by: <span className="font-bold text-zinc-700 dark:text-zinc-300">HITL Operator</span></span>
                  <span>•</span>
                  <span>Duration: <span className="font-bold text-zinc-700 dark:text-zinc-300">0.15s</span></span>
                  <span>•</span>
                  <span>Time: <span className="font-bold text-zinc-700 dark:text-zinc-300">{new Date(selectedBuild.timestamp).toLocaleTimeString()}</span></span>
                </div>
              </div>

              {/* Azure DevOps Style Header Tab deck */}
              <div className="flex border-b border-zinc-200 dark:border-zinc-900/80 pb-0.5 mb-5 shrink-0">
                <button
                  onClick={() => setActiveSubTab('summary')}
                  className={`pb-2.5 px-4 font-mono text-xs uppercase font-bold tracking-wider transition-all border-b-2 -mb-[2px] flex items-center space-x-2 relative ${
                    activeSubTab === 'summary'
                      ? 'border-zinc-950 text-zinc-950 dark:border-white dark:text-white'
                      : 'border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  <Activity className="h-3.5 w-3.5" />
                  <span>Summary</span>
                  {selectedBuild.status === 'PENDING_APPROVAL' && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                  )}
                </button>
                
                <button
                  onClick={() => setActiveSubTab('logs')}
                  className={`pb-2.5 px-4 font-mono text-xs uppercase font-bold tracking-wider transition-all border-b-2 -mb-[2px] flex items-center space-x-2 ${
                    activeSubTab === 'logs'
                      ? 'border-zinc-950 text-zinc-950 dark:border-white dark:text-white'
                      : 'border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  <Terminal className="h-3.5 w-3.5" />
                  <span>Logs</span>
                </button>
              </div>

              {/* Dynamic Sub-Tab Render Panels */}
              <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col">
                
                {activeSubTab === 'summary' ? (
                  /* Tab 1: ADO Run Summary View - Stages Tree + AI Diagnostics Card + Spacious Diff comparison */
                  <div className="flex-1 overflow-y-auto pr-1 space-y-6 scrollbar-thin">
                    
                    {/* Stages execution checklist progress block */}
                    {renderStagesTree(selectedBuild)}

                    {/* AI Diagnosis Hotfix description panel */}
                    {selectedBuild.patch && (
                      <div className="max-w-4xl space-y-6">
                        <DiagnosticCard
                          patch={selectedBuild.patch}
                          onApprove={handleApprovePatch}
                          onReject={handleRejectPatch}
                          buildStatus={selectedBuild.status}
                          buildId={selectedBuild.id}
                          onDiagnose={handleDiagnose}
                        />

                        {selectedBuild.status !== 'HEALING' && (
                          <div className="pb-6">
                            <DiffViewer
                              filePath={selectedBuild.patch.file_path}
                              originalCode={selectedBuild.patch.original_code}
                              patchedCode={selectedBuild.patch.patched_code}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {!selectedBuild.patch && (selectedBuild.status === 'SUCCESS' || selectedBuild.status === 'FAILED') && (
                      <div className="max-w-4xl">
                        <DiagnosticCard
                          patch={null}
                          onApprove={handleApprovePatch}
                          onReject={handleRejectPatch}
                          buildStatus={selectedBuild.status}
                          buildId={selectedBuild.id}
                          onDiagnose={handleDiagnose}
                        />
                      </div>
                    )}

                  </div>
                ) : (
                  /* Tab 2: ADO Logs View - Steps selector + Full terminal log stdout console */
                  renderAdoLogsWorkspace(selectedBuild)
                )}

              </div>

            </div>
          ) : (
            /* Loading Skeleton View */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-400 dark:text-zinc-550 font-mono">
              <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-950 dark:border-t-white rounded-full animate-spin mb-3.5" />
              <p className="text-[10px] uppercase tracking-widest">Hydrating Enterprise Workspace...</p>
            </div>
          )}

        </div>

      </div>
    );
  };

  if (isInitialLoading) {
    return <DevOpsLoader />;
  }

  return (
    <Layout
      systemConfig={systemConfig}
      isDarkMode={isDarkMode}
      onToggleTheme={toggleTheme}
      activeTab={activeTab}
      onChangeTab={(tab) => {
        console.log(`[Router] Changed active view tab to: ${tab}`);
        setActiveTab(tab);
        const mappedRoute = tabToRouteMap[tab];
        if (mappedRoute) {
          router.push(`/console/${mappedRoute}`, undefined, { shallow: true });
        }
      }}
    >
      <div className="flex-1 flex overflow-hidden w-full h-full relative">
        <div className="flex-1 flex overflow-hidden w-full h-full" style={{ display: activeTab === 'pipelines' ? 'flex' : 'none' }}>
          {renderPipelinesWorkspace()}
        </div>
        <div className="flex-1 overflow-y-auto h-full" style={{ display: activeTab === 'agent' ? 'block' : 'none' }}>
          {renderAgentWorkspace()}
        </div>
        <div className="flex-1 overflow-y-auto h-full" style={{ display: activeTab === 'database' ? 'block' : 'none' }}>
          {renderDatabaseWorkspace()}
        </div>
        <div className="flex-1 overflow-y-auto h-full" style={{ display: activeTab === 'keys' ? 'block' : 'none' }}>
          {renderCredentialsWorkspace()}
        </div>
        <div className="flex-1 overflow-y-auto h-full" style={{ display: activeTab === 'guide' ? 'block' : 'none' }}>
          <UserGuide />
        </div>
        <div className="flex-1 overflow-hidden h-full" style={{ display: activeTab === 'repos' ? 'flex' : 'none' }}>
          <RepoManager 
            onNavigateToSandbox={(repo, sandboxId, diagnosis) => {
              setSelectedRepoForConsole(repo);
              setSandboxConfig({ repo, sandboxId: sandboxId || repo.sandboxId || null, diagnosis });
              setActiveTab('sandbox');
              router.push('/console/sandbox', undefined, { shallow: true });
            }} 
          />
        </div>
        <div className="flex-1 overflow-hidden h-full" style={{ display: activeTab === 'execution' ? 'flex' : 'none' }}>
          <PipelineConsole 
            selectedRepo={selectedRepoForConsole}
            onNavigateToSandbox={(repo, sandboxId, diagnosis) => {
              setSandboxConfig({ repo, sandboxId, diagnosis });
              setActiveTab('sandbox');
              router.push('/console/sandbox', undefined, { shallow: true });
            }}
          />
        </div>
        <div className="flex-1 overflow-hidden h-full" style={{ display: activeTab === 'sandbox' ? 'flex' : 'none' }}>
          <SandboxWorkspace 
            sandboxConfig={sandboxConfig}
            onNavigateToRepos={() => {
              setSandboxConfig(null);
              setSelectedRepoForConsole(null);
              setActiveTab('repos');
              router.push('/console/repositories', undefined, { shallow: true });
            }}
          />
        </div>      </div>
    </Layout>
  );
}
