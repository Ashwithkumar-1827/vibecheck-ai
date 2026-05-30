import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Sidebar from '../../components/Sidebar';
import ConsoleLog from '../../components/ConsoleLog';
import DiagnosticCard from '../../components/DiagnosticCard';
import DiffViewer from '../../components/DiffViewer';
import RepoManager from '../../components/tabs/RepoManager';
import PipelineConsole from '../../components/tabs/PipelineConsole';
import SandboxWorkspace from '../../components/tabs/SandboxWorkspace';
import { 
  GitBranch, ChevronRight, Activity, ShieldCheck, AlertCircle, Sliders, 
  Sparkles, Terminal, Database, Key, Cpu, HardDrive, KeyRound, Save, 
  Trash2, CheckCircle, RefreshCw, Play, Info, AlertTriangle, Eye, EyeOff 
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();

  const routeToTabMap = {
    pipeline: 'pipelines',
    diagnostics: 'agent',
    repositories: 'repos',
    sandbox: 'sandbox',
    storage: 'database',
    credentials: 'keys',
    execution: 'execution'
  };

  const tabToRouteMap = {
    pipelines: 'pipeline',
    agent: 'diagnostics',
    repos: 'repositories',
    sandbox: 'sandbox',
    database: 'storage',
    keys: 'credentials',
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
  const [activeTab, setActiveTab] = useState('pipelines'); // 'pipelines', 'agent', 'database', 'keys', 'repos', 'execution', 'sandbox', 'flow'
  const [selectedRepoForConsole, setSelectedRepoForConsole] = useState(null);
  const [sandboxConfig, setSandboxConfig] = useState(null);
  const [repos, setRepos] = useState([]);
  
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

  const fetchRepos = async () => {
    try {
      const res = await fetch('/api/repos');
      const data = await res.json();
      if (res.ok) {
        setRepos(data);
      }
    } catch (err) {
      console.error("Failed to load repositories inside Dashboard:", err);
    }
  };

  // Fetch initial system configuration and credentials on mount
  useEffect(() => {
    fetchSystemConfig();
    fetchCredentialsStatus();
    fetchRepos();
  }, []);

  // Clear builds when entering the test pipelines page to keep it clean and transient.
  // When entering other pages (like dashboard), load builds for KPI analytics.
  useEffect(() => {
    if (activeTab === 'pipelines') {
      console.log("[Pipelines] Entering test pipelines page. Clearing historical builds as requested...");
      const clearHistory = async () => {
        try {
          await fetch('/api/builds', { method: 'DELETE' });
          setBuilds([]);
          setSelectedBuild(null);
        } catch (e) {
          console.error("Failed to clear builds:", e);
        }
      };
      clearHistory();
    } else {
      fetchBuilds(false);
    }
  }, [activeTab]);

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
    fetchRepos();
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
    setSelectedBuild(prev => ({ ...prev, status: 'REPAIRING' }));
    
    try {
      const res = await fetch(`/api/patches/${patchId}/approve`, { method: 'POST' });
      const result = await res.json();
      
      if (res.ok && result.success) {
        setTimeout(async () => {
          await fetchBuilds();
          setSelectedBuild(result.build);
        }, 1500);
      } else {
        const errMsg = result.error || "The remediation pipeline executed but the verification tests failed. Inspect the console logs.";
        alert(`Autonomic Remediation Failure:\n\n${errMsg}`);
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
      case 'REPAIRING': return 'text-zinc-500 dark:text-zinc-400';
      default: return 'text-zinc-400';
    }
  };

  // 1. Diagnostics Cockpit Workspace View (tab: 'agent')
  const renderAgentWorkspace = () => {
    const totalWorkspaces = repos.length;
    const readyWorkspaces = repos.filter(r => r.status === 'ready').length;
    const promotedWorkspaces = repos.filter(r => r.status === 'promoted').length;
    const activeSandboxes = repos.filter(r => r.sandboxId && r.status !== 'promoted').length;
    const greenWorkspaces = repos.filter(r => r.status === 'ready' || r.status === 'promoted').length;
    const healthRate = totalWorkspaces > 0 ? Math.round((greenWorkspaces / totalWorkspaces) * 100) : 100;
    
    return (
      <div className="flex-1 p-8 overflow-y-auto h-full w-full bg-transparent dark:bg-transparent space-y-8 select-text no-scrollbar">
        {/* Apple Style Monochromatic Header */}
        <div className="border-b border-zinc-200 dark:border-zinc-900 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-zinc-950 text-white dark:bg-white dark:text-black rounded-xl">
              <Sparkles className="h-5 w-5 fill-current" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-sans tracking-tight text-zinc-950 dark:text-white uppercase">VibeCheck Diagnostics Dashboard</h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-550 font-mono mt-0.5">Enterprise Triage Performance, Latency Gauges, & autonomic hotfix Workflows</p>
            </div>
          </div>
        </div>

        {/* Executive Stats Cards (Apple Design: Flat, high-contrast, padded) */}
        <div className="space-y-8">
          {/* Row 1: 3 up containers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white dark:bg-[#1c1c1c] border border-zinc-200 dark:border-[#262626] rounded-2xl shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200 min-h-[220px]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-550 uppercase tracking-widest block font-bold">Total Workspaces</span>
                  <HardDrive className="h-5 w-5 text-zinc-400 dark:text-zinc-650" />
                </div>
                <div className="text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">{totalWorkspaces}</div>
              </div>
              <div className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 mt-4 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>active systems</span>
              </div>
            </div>
            
            <div className="p-8 bg-white dark:bg-[#1c1c1c] border border-zinc-200 dark:border-[#262626] rounded-2xl shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200 min-h-[220px]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-550 uppercase tracking-widest block font-bold">Workspace Health</span>
                  <ShieldCheck className="h-5 w-5 text-zinc-400 dark:text-zinc-650" />
                </div>
                <div className="text-5xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">{healthRate}%</div>
              </div>
              <div className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 mt-4 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>ready/promoted</span>
              </div>
            </div>

            <div className="p-8 bg-white dark:bg-[#1c1c1c] border border-zinc-200 dark:border-[#262626] rounded-2xl shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200 min-h-[220px]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-550 uppercase tracking-widest block font-bold">Active Trials</span>
                  <AlertTriangle className="h-5 w-5 text-zinc-400 dark:text-zinc-650" />
                </div>
                <div className={`text-5xl font-extrabold tracking-tight ${activeSandboxes > 0 ? "text-red-500 animate-pulse" : "text-zinc-900 dark:text-white"}`}>{activeSandboxes}</div>
              </div>
              <div className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 mt-4 flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${activeSandboxes > 0 ? "bg-red-500 animate-ping" : "bg-zinc-400"}`} />
                <span>{activeSandboxes > 0 ? "debugging active" : "no active debugging"}</span>
              </div>
            </div>
          </div>

          {/* Row 2: 2 down containers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 bg-white dark:bg-[#1c1c1c] border border-zinc-200 dark:border-[#262626] rounded-2xl shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200 min-h-[220px]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-550 uppercase tracking-widest block font-bold">Operational Slots</span>
                  <Cpu className="h-5 w-5 text-zinc-400 dark:text-zinc-650" />
                </div>
                <div className="text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">{readyWorkspaces}</div>
              </div>
              <div className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 mt-4 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>slots ready</span>
              </div>
            </div>

            <div className="p-8 bg-white dark:bg-[#1c1c1c] border border-zinc-200 dark:border-[#262626] rounded-2xl shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200 min-h-[220px]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-550 uppercase tracking-widest block font-bold">PRs Promoted</span>
                  <GitBranch className="h-5 w-5 text-zinc-400 dark:text-zinc-650" />
                </div>
                <div className="text-5xl font-extrabold tracking-tight text-indigo-500 dark:text-indigo-400">{promotedWorkspaces}</div>
              </div>
              <div className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 mt-4 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                <span>submitted/active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Download vertical flowchart as PNG client-side (100% Robust Standard SVG, no taints)
  const handleDownloadPng = () => {
    const svgEl = document.getElementById('lifecycle-svg-flowchart');
    if (!svgEl) return;
    
    try {
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(svgEl);
      
      // Ensure absolute dimensions inside the XML string for high-resolution canvas export
      svgString = svgString.replace('<svg id="lifecycle-svg-flowchart"', '<svg id="lifecycle-svg-flowchart" width="800" height="2120"');
      
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobUrl = URL.createObjectURL(svgBlob);
      
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 800;
          canvas.height = 2120;
          const ctx = canvas.getContext('2d');
          
          // Draw the dark background color explicitly for dark board background
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
          console.error('Canvas serialization or drawing failed:', err);
          alert('Canvas serialization failed: ' + err.message + '\n' + err.stack);
        } finally {
          URL.revokeObjectURL(blobUrl);
        }
      };
      img.onerror = (err) => {
        console.error('Image loading failed inside PNG exporter:', err);
        URL.revokeObjectURL(blobUrl);
        alert('PNG export failed: the browser was unable to render the SVG elements into a canvas image.');
      };
      img.src = blobUrl;
    } catch (e) {
      console.error('Failed to export flowchart as PNG:', e);
      alert('Failed to export flowchart: ' + e.message);
    }
  };

  // 1.5. Application Flow Presentation Workspace View (tab: 'flow')
  const renderFlowWorkspace = () => {
    return (
      <div className="flex-1 p-8 overflow-y-auto h-full w-full bg-transparent dark:bg-transparent space-y-8 select-text no-scrollbar">
        {/* Apple Style Monochromatic Header */}
        <div className="border-b border-zinc-200 dark:border-zinc-900 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-zinc-950 text-white dark:bg-white dark:text-black rounded-xl">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-sans tracking-tight text-zinc-950 dark:text-white uppercase">VibeCheck Application Flow</h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-550 font-mono mt-0.5">End-to-End Sequential Architecture & Autonomic Lifecycle Stages</p>
            </div>
          </div>
        </div>

        {/* Cloned Repository Autonomic Lifecycle Architecture (High-Contrast Presentation Flowchart - Vertical Flow) */}
        <div className="flex flex-col bg-white dark:bg-[#1c1c1c] border border-zinc-200 dark:border-[#262626] rounded-2xl overflow-hidden shadow-sm">
          {/* Header Panel */}
          <div className="p-5 border-b border-zinc-150 dark:border-[#262626] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50/50 dark:bg-[#141414]/30">
            <div>
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white uppercase font-sans">
                  application flow
                </h3>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-550 font-mono mt-0.5">
                End-to-End sequential presentation schema of repository clone, dependency parsing, troubleshooting sandbox, build execution, and PR promotion
              </p>
            </div>

            {/* Buttons Panel */}
            <div className="flex items-center gap-3">
              {/* Back to Dashboard routing button */}
              <button
                onClick={() => {
                  setActiveTab('agent');
                  router.push('/console/diagnostics', undefined, { shallow: true });
                }}
                className="py-1.5 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-850 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-full font-mono text-[10px] uppercase font-bold tracking-wider flex items-center space-x-2 active:scale-[0.98] transition-all duration-100 shadow-sm"
              >
                <span>Back to Dashboard</span>
              </button>

              {/* Download Button */}
              <button
                onClick={handleDownloadPng}
                className="py-1.5 px-4 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-450 border border-emerald-250/30 dark:border-emerald-900/30 rounded-full font-mono text-[10px] uppercase font-bold tracking-wider flex items-center space-x-2 active:scale-[0.98] transition-transform duration-100 shadow-sm"
              >
                <svg className="h-3.5 w-3.5 fill-current shrink-0" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L9 5.414V17a1 1 0 102 0V5.414l5.293 5.293a1 1 0 00-1.414-1.414l-7-7z" transform="rotate(180 10 10)" transformOrigin="center" />
                </svg>
                <span>Download Diagram (PNG)</span>
              </button>
            </div>
          </div>

          {/* Flowchart Presentation Board Canvas */}
          <div className="w-full bg-[#090909] select-none p-6 rounded-b-2xl border-t border-zinc-200 dark:border-zinc-800">
            <div className="w-[800px] h-[2120px] mx-auto relative">
              <svg 
                id="lifecycle-svg-flowchart" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 800 2120"
                className="absolute inset-0 w-full h-full z-0 select-none"
                style={{ width: '800px', height: '2120px', backgroundColor: '#090909' }}
              >
                {/* SVG Solid Dark Background */}
                <rect width="800" height="2120" fill="#090909" />

                {/* SVG Connections & Markers */}
                <defs>
                  <marker id="arrow-gray" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a1a1aa" />
                  </marker>
                  <marker id="arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
                  </marker>
                  <marker id="arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f43f5e" />
                  </marker>
                </defs>

                {/* ==================== HIGH-CONTRAST ORTHOGONAL CONNECTION PATHS ==================== */}

                {/* Line 1: Import Card -> Private Diamond */}
                <path
                  d="M 400,160 L 400,220"
                  fill="none"
                  stroke="#a1a1aa"
                  strokeWidth="2"
                  markerEnd="url(#arrow-gray)"
                />

                {/* Line 2: Private Diamond -> OAuth Handshake (Yes Path) */}
                <path
                  d="M 340,280 L 220,280"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2"
                  markerEnd="url(#arrow-red)"
                />

                {/* Line 3: OAuth Handshake -> Workspace Init */}
                <path
                  d="M 130,320 L 130,420 A 20,20 0 0 0 150,440 L 300,440"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2"
                  markerEnd="url(#arrow-red)"
                />

                {/* Line 4: Private Diamond -> Workspace Init (No Path) */}
                <path
                  d="M 400,340 L 400,400"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  markerEnd="url(#arrow-green)"
                />

                {/* Line 5a: Workspace Init -> Graphify */}
                <path
                  d="M 400,480 L 400,505"
                  fill="none"
                  stroke="#a1a1aa"
                  strokeWidth="2"
                  markerEnd="url(#arrow-gray)"
                />

                {/* Line 5b: Graphify -> Sandbox Interactive Cockpit */}
                <path
                  d="M 400,575 L 400,640"
                  fill="none"
                  stroke="#a1a1aa"
                  strokeWidth="2"
                  markerEnd="url(#arrow-gray)"
                />

                {/* Line 6: Sandbox -> Sandbox Fail Diamond */}
                <path
                  d="M 400,780 L 400,840"
                  fill="none"
                  stroke="#a1a1aa"
                  strokeWidth="2"
                  markerEnd="url(#arrow-gray)"
                />

                {/* Line 7: Diamond Fail -> AI Triage (Yes Path: Build Fails) */}
                <path
                  d="M 400,960 L 400,1020"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2"
                  markerEnd="url(#arrow-red)"
                />

                {/* Line 8: Diamond Fail -> Direct Promotion Bypass */}
                <path
                  d="M 460,900 L 640,900 A 20,20 0 0 1 660,920 L 660,1730 A 20,20 0 0 1 640,1750 L 460,1750"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                  markerEnd="url(#arrow-green)"
                />

                {/* Line 9: AI Triage -> Grilling Chat */}
                <path
                  d="M 400,1160 L 400,1220"
                  fill="none"
                  stroke="#a1a1aa"
                  strokeWidth="2"
                  markerEnd="url(#arrow-gray)"
                />

                {/* Line 10: Grilling Chat -> Docker Verification Pipeline */}
                <path
                  d="M 400,1300 L 400,1360"
                  fill="none"
                  stroke="#a1a1aa"
                  strokeWidth="2"
                  markerEnd="url(#arrow-gray)"
                />

                {/* Line 11: Pipeline -> Diamond Pass */}
                <path
                  d="M 400,1510 L 400,1570"
                  fill="none"
                  stroke="#a1a1aa"
                  strokeWidth="2"
                  markerEnd="url(#arrow-gray)"
                />

                {/* Line 12: Diamond Pass -> Grilling Chat */}
                <path
                  d="M 340,1630 L 160,1630 A 20,20 0 0 1 140,1610 L 140,1280 A 20,20 0 0 1 160,1260 L 300,1260"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                  markerEnd="url(#arrow-red)"
                />

                {/* Line 13: Diamond Pass -> PR Promotion (Yes Path) */}
                <path
                  d="M 400,1690 L 400,1750"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  markerEnd="url(#arrow-green)"
                />

                {/* Line 14: PR Promotion -> Account Connected Guard */}
                <path
                  d="M 400,1880 L 400,1940"
                  fill="none"
                  stroke="#a1a1aa"
                  strokeWidth="2"
                  markerEnd="url(#arrow-gray)"
                />

                {/* Line 15: Guard -> PR Active Oval (No Path) */}
                <path
                  d="M 340,2000 L 240,2000"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  markerEnd="url(#arrow-green)"
                />

                {/* Line 16: Guard -> Autonomic Teardown (Yes Path: Disconnect) */}
                <path
                  d="M 460,2000 L 560,2000"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2"
                  markerEnd="url(#arrow-red)"
                />


                {/* ==================== STABLE PATH OVERLAY LABELS ==================== */}

                {/* Yes Label for Private Diamond */}
                <g>
                  <rect x="230" y="250" width="110" height="25" rx="4" fill="#fee2e2" stroke="#fca5a5" strokeWidth="1" />
                  <text x="285" y="266" fill="#991b1b" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">YES (AUTH REQUIRED)</text>
                </g>

                {/* No Label for Private Diamond */}
                <g>
                  <rect x="410" y="350" width="110" height="25" rx="4" fill="#d1fae5" stroke="#6ee7b7" strokeWidth="1" />
                  <text x="465" y="366" fill="#065f46" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">NO (PUBLIC CLONE)</text>
                </g>

                {/* Yes Label for Sandbox Failure Diamond */}
                <g>
                  <rect x="410" y="970" width="110" height="25" rx="4" fill="#fee2e2" stroke="#fca5a5" strokeWidth="1" />
                  <text x="465" y="986" fill="#991b1b" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">YES (TRACE FAIL)</text>
                </g>

                {/* Direct Bypass Label */}
                <g>
                  <rect x="490" y="875" width="110" height="25" rx="4" fill="#d1fae5" stroke="#6ee7b7" strokeWidth="1" />
                  <text x="545" y="891" fill="#065f46" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">NO (BYPASS TRIAGE)</text>
                </g>

                {/* No Label for pipeline pass retry */}
                <g>
                  <rect x="180" y="1640" width="130" height="25" rx="4" fill="#fee2e2" stroke="#fca5a5" strokeWidth="1" />
                  <text x="245" y="1656" fill="#991b1b" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">NO (REGRESSION RETRY)</text>
                </g>

                {/* Yes Label for pipeline test pass */}
                <g>
                  <rect x="410" y="1700" width="110" height="25" rx="4" fill="#d1fae5" stroke="#6ee7b7" strokeWidth="1" />
                  <text x="465" y="1716" fill="#065f46" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">YES (ALL CLEAN)</text>
                </g>

                {/* No Label for disconnect status */}
                <g>
                  <rect x="250" y="1970" width="80" height="25" rx="4" fill="#d1fae5" stroke="#6ee7b7" strokeWidth="1" />
                  <text x="290" y="1986" fill="#065f46" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">NO (ACTIVE)</text>
                </g>

                {/* Yes Label for disconnect status */}
                <g>
                  <rect x="470" y="1970" width="80" height="25" rx="4" fill="#fee2e2" stroke="#fca5a5" strokeWidth="1" />
                  <text x="510" y="1986" fill="#991b1b" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">YES (CLEANUP)</text>
                </g>


                {/* ==================== FLOWCHART PRESENTATION CARDS ==================== */}

                {/* 1. Repository Import Card */}
                <g>
                  <rect x="280" y="40" width="240" height="120" rx="12" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
                  <text x="294" y="62" fill="#18181b" fontSize="9" fontFamily="monospace" fontWeight="bold" letterSpacing="0.5">GITHUB REPO IMPORT</text>
                  
                  {/* Badge [NEW] */}
                  <rect x="442" y="52" width="28" height="13" rx="3" fill="#ffe4cc" stroke="#ffb380" strokeWidth="0.5" />
                  <text x="446" y="61" fill="#cc5200" fontSize="7" fontFamily="monospace" fontWeight="bold">NEW</text>
                  
                  {/* Badge [ATTN] */}
                  <rect x="476" y="52" width="30" height="13" rx="3" fill="#fff7e6" stroke="#ffe0b3" strokeWidth="0.5" />
                  <text x="481" y="61" fill="#b37700" fontSize="7" fontFamily="monospace" fontWeight="bold">ATTN</text>
                  
                  {/* Code box mock */}
                  <rect x="294" y="78" width="212" height="20" rx="4" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="0.75" />
                  <circle cx="304" cy="88" r="3" fill="#6366f1" />
                  <text x="314" y="91" fill="#3f3f46" fontSize="7.5" fontFamily="monospace">github.com/vibecheck-ai/mock...</text>
                  <rect x="488" y="82" width="14" height="12" rx="2" fill="#18181b" />
                  <text x="491" y="90" fill="#ffffff" fontSize="6" fontFamily="monospace">GO</text>
                  
                  {/* Description */}
                  <text x="294" y="114" fill="#71717a" fontSize="8.5" fontFamily="sans-serif">
                    <tspan x="294" dy="0">User inputs remote Git URL to start the autonomic</tspan>
                    <tspan x="294" dy="12">workspace pipeline.</tspan>
                  </text>
                </g>

                {/* 2. Is Private Decision Diamond */}
                <g>
                  <polygon points="400,220 460,280 400,340 340,280" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
                  <text x="400" y="283" fill="#1e3a8a" fontSize="9" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">Is Repo Private?</text>
                </g>

                {/* 3. OAuth Token Handshake Oval */}
                <g>
                  <ellipse cx="130" cy="280" rx="90" ry="40" fill="#fffbeb" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="130" y="272" fill="#b45309" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">OAUTH HANDSHAKE</text>
                  <text x="130" y="286" fill="#78350f" fontSize="8.5" fontFamily="sans-serif" textAnchor="middle">
                    <tspan x="130" dy="0">Exchange keys to fetch private</tspan>
                    <tspan x="130" dy="11">repo paths securely.</tspan>
                  </text>
                </g>

                {/* 4. Workspace Sync Init Oval */}
                <g>
                  <ellipse cx="400" cy="440" rx="100" ry="40" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
                  <text x="400" y="432" fill="#047857" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">WORKSPACE LOCAL INIT</text>
                  <text x="400" y="446" fill="#065f46" fontSize="8.5" fontFamily="sans-serif" textAnchor="middle">
                    <tspan x="400" dy="0">System creates local workspace and</tspan>
                    <tspan x="400" dy="11">syncs metadata in db.json.</tspan>
                  </text>
                </g>

                {/* 5. [NEW] Graphify Structural dependency analysis Oval */}
                <g>
                  <ellipse cx="400" cy="540" rx="115" ry="35" fill="#f5f3ff" stroke="#8b5cf6" strokeWidth="1.5" />
                  <text x="400" y="532" fill="#6d28d9" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">GRAPHIFY DEPS MAPPER</text>
                  <text x="400" y="546" fill="#4c1d95" fontSize="8.5" fontFamily="sans-serif" textAnchor="middle">
                    <tspan x="400" dy="0">Parses cloned repo to map AST nodes</tspan>
                    <tspan x="400" dy="11">and cross-file structural dependencies.</tspan>
                  </text>
                </g>

                {/* 6. Sandbox Interactive Cockpit Card */}
                <g>
                  <rect x="280" y="640" width="240" height="140" rx="12" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
                  <text x="294" y="662" fill="#18181b" fontSize="9" fontFamily="monospace" fontWeight="bold" letterSpacing="0.5">SANDBOX COCKPIT</text>
                  
                  {/* Badge [NEW] */}
                  <rect x="442" y="652" width="28" height="13" rx="3" fill="#ffe4cc" stroke="#ffb380" strokeWidth="0.5" />
                  <text x="446" y="661" fill="#cc5200" fontSize="7" fontFamily="monospace" fontWeight="bold">NEW</text>
                  
                  {/* Badge [REVW] */}
                  <rect x="476" y="652" width="30" height="13" rx="3" fill="#e6f2ff" stroke="#b3d7ff" strokeWidth="0.5" />
                  <text x="481" y="661" fill="#0066cc" fontSize="7" fontFamily="monospace" fontWeight="bold">REVW</text>
                  
                  {/* Split diff mock */}
                  <rect x="294" y="678" width="212" height="32" rx="4" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="0.75" />
                  <line x1="300" y1="686" x2="360" y2="686" stroke="#d4d4d8" strokeWidth="3" strokeLinecap="round" />
                  <line x1="300" y1="692" x2="350" y2="692" stroke="#d4d4d8" strokeWidth="3" strokeLinecap="round" />
                  <line x1="300" y1="698" x2="355" y2="698" stroke="rgba(99, 102, 241, 0.5)" strokeWidth="3" strokeLinecap="round" />
                  
                  <line x1="370" y1="682" x2="370" y2="706" stroke="#e4e4e7" strokeWidth="0.5" />
                  
                  <text x="376" y="688" fill="#71717a" fontSize="5" fontFamily="monospace" fontWeight="bold">CODE DIFF VIEW</text>
                  <line x1="376" y1="694" x2="496" y2="694" stroke="rgba(16, 185, 129, 0.5)" strokeWidth="3" strokeLinecap="round" />
                  <line x1="376" y1="700" x2="480" y2="700" stroke="rgba(244, 63, 94, 0.5)" strokeWidth="3" strokeLinecap="round" />
                  
                  {/* Description */}
                  <text x="294" y="734" fill="#71717a" fontSize="8.5" fontFamily="sans-serif">
                    <tspan x="294" dy="0">Loads buggy repository structure inside fully secure,</tspan>
                    <tspan x="294" dy="12">isolated sandbox editor cockpit.</tspan>
                  </text>
                </g>

                {/* 7. Sandbox Build Fail Decision Diamond */}
                <g>
                  <polygon points="400,840 460,900 400,960 340,900" fill="#fff1f2" stroke="#f43f5e" strokeWidth="1.5" />
                  <text x="400" y="903" fill="#9f1239" fontSize="9" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">Tests Fail?</text>
                </g>

                {/* 8. AI Multi-Model Triage Engine Card */}
                <g>
                  <rect x="280" y="1020" width="240" height="140" rx="12" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
                  <text x="294" y="1042" fill="#18181b" fontSize="9" fontFamily="monospace" fontWeight="bold" letterSpacing="0.5">AI TRIAGE ENGINE</text>
                  
                  {/* Badge [ASAP] */}
                  <rect x="442" y="1032" width="28" height="13" rx="3" fill="#ffe6e6" stroke="#ffb3b3" strokeWidth="0.5" />
                  <text x="446" y="1041" fill="#cc0000" fontSize="7" fontFamily="monospace" fontWeight="bold">ASAP</text>
                  
                  {/* Badge [ATTN] */}
                  <rect x="476" y="1032" width="30" height="13" rx="3" fill="#fff7e6" stroke="#ffe0b3" strokeWidth="0.5" />
                  <text x="481" y="1041" fill="#b37700" fontSize="7" fontFamily="monospace" fontWeight="bold">ATTN</text>
                  
                  {/* Progress mock */}
                  <rect x="294" y="1058" width="212" height="32" rx="4" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="0.75" />
                  <text x="300" y="1068" fill="#71717a" fontSize="5.5" fontFamily="monospace">COMPRESSED STACK TRACE LOGS</text>
                  <text x="446" y="1068" fill="#10b981" fontSize="5.5" fontFamily="monospace" fontWeight="bold">94% CONFIDENCE</text>
                  <rect x="300" y="1076" width="200" height="6" rx="2" fill="#e4e4e7" />
                  <rect x="300" y="1076" width="180" height="6" rx="2" fill="#6366f1" />
                  
                  {/* Description */}
                  <text x="294" y="1114" fill="#71717a" fontSize="8.5" fontFamily="sans-serif">
                    <tspan x="294" dy="0">Parses traces. Calls GPT-4o-mini to output highly</tspan>
                    <tspan x="294" dy="12">structured AST corrective patches.</tspan>
                  </text>
                </g>

                {/* 9. Human in the Loop Grilling Chat Oval */}
                <g>
                  <ellipse cx="400" cy="1260" rx="100" ry="40" fill="#f0f9ff" stroke="#0ea5e9" strokeWidth="1.5" />
                  <text x="400" y="1252" fill="#0369a1" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">DEVELOPER GRILLING CHAT</text>
                  <text x="400" y="1266" fill="#0c4a6e" fontSize="8.5" fontFamily="sans-serif" textAnchor="middle">
                    <tspan x="400" dy="0">Iterate, dialogue, and refine structural</tspan>
                    <tspan x="400" dy="11">fixes in real-time.</tspan>
                  </text>
                </g>

                {/* 10. Docker Container Verification Pipeline Card */}
                <g>
                  <rect x="280" y="1360" width="240" height="150" rx="12" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
                  <text x="294" y="1382" fill="#18181b" fontSize="9" fontFamily="monospace" fontWeight="bold" letterSpacing="0.5">DOCKER TEST PIPELINE</text>
                  
                  {/* Badge [NEW] */}
                  <rect x="442" y="1372" width="28" height="13" rx="3" fill="#ffe4cc" stroke="#ffb380" strokeWidth="0.5" />
                  <text x="446" y="1381" fill="#cc5200" fontSize="7" fontFamily="monospace" fontWeight="bold">NEW</text>
                  
                  {/* Badge [DONE] */}
                  <rect x="476" y="1372" width="30" height="13" rx="3" fill="#e6ffe6" stroke="#b3ffb3" strokeWidth="0.5" />
                  <text x="481" y="1381" fill="#008000" fontSize="7" fontFamily="monospace" fontWeight="bold">DONE</text>
                  
                  {/* Grid steps */}
                  <g>
                    <rect x="294" y="1398" width="64" height="16" rx="2" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="0.75" />
                    <circle cx="302" cy="1406" r="2.5" fill="#10b981" />
                    <text x="310" y="1409" fill="#3f3f46" fontSize="6" fontFamily="monospace">Security</text>
                  </g>
                  <g>
                    <rect x="368" y="1398" width="64" height="16" rx="2" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="0.75" />
                    <circle cx="376" cy="1406" r="2.5" fill="#10b981" />
                    <text x="384" y="1409" fill="#3f3f46" fontSize="6" fontFamily="monospace">Billing</text>
                  </g>
                  <g>
                    <rect x="442" y="1398" width="64" height="16" rx="2" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="0.75" />
                    <circle cx="450" cy="1406" r="2.5" fill="#10b981" />
                    <text x="458" y="1409" fill="#3f3f46" fontSize="6" fontFamily="monospace">Database</text>
                  </g>
                  
                  {/* Description */}
                  <text x="294" y="1438" fill="#71717a" fontSize="8.5" fontFamily="sans-serif">
                    <tspan x="294" dy="0">Executes sterile container test suite (Init</tspan>
                    <tspan x="294" dy="12">and Security and Billing and DB and Webhook).</tspan>
                  </text>
                </g>

                {/* 11. Did Docker Test Pass Decision Diamond */}
                <g>
                  <polygon points="400,1570 460,1630 400,1690 340,1630" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
                  <text x="400" y="1633" fill="#065f46" fontSize="9" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">Tests Pass?</text>
                </g>

                {/* 12. Autonomic PR Promotion Card */}
                <g>
                  <rect x="280" y="1750" width="240" height="130" rx="12" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
                  <text x="294" y="1772" fill="#18181b" fontSize="9" fontFamily="monospace" fontWeight="bold" letterSpacing="0.5">AUTONOMIC PR PROMOTE</text>
                  
                  {/* Badge [DONE] */}
                  <rect x="442" y="1762" width="28" height="13" rx="3" fill="#e6ffe6" stroke="#b3ffb3" strokeWidth="0.5" />
                  <text x="446" y="1771" fill="#008000" fontSize="7" fontFamily="monospace" fontWeight="bold">DONE</text>
                  
                  {/* Badge [REVW] */}
                  <rect x="476" y="1762" width="30" height="13" rx="3" fill="#e6f2ff" stroke="#b3d7ff" strokeWidth="0.5" />
                  <text x="481" y="1771" fill="#0066cc" fontSize="7" fontFamily="monospace" fontWeight="bold">REVW</text>
                  
                  {/* Status mock */}
                  <rect x="294" y="1788" width="212" height="20" rx="4" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="0.75" />
                  <text x="300" y="1801" fill="#3f3f46" fontSize="6.5" fontFamily="monospace" fontWeight="bold">PR #14 Promoted successfully!</text>
                  <rect x="452" y="1792" width="50" height="12" rx="2" fill="#6366f1" />
                  <text x="477" y="1800" fill="#ffffff" fontSize="5.5" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">Back to Repo</text>
                  
                  {/* Description */}
                  <text x="294" y="1826" fill="#71717a" fontSize="8.5" fontFamily="sans-serif">
                    <tspan x="294" dy="0">Stages modifications. Auto-commits and pushes</tspan>
                    <tspan x="294" dy="12">branch upstream. Creates PR autonomously.</tspan>
                  </text>
                </g>

                {/* 13. Account Integration connected safety diamond */}
                <g>
                  <polygon points="400,1940 460,2000 400,2060 340,2000" fill="#fffbeb" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="400" y="2003" fill="#78350f" fontSize="9" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">Disconnected?</text>
                </g>

                {/* 14. PR Status Button transition Oval */}
                <g>
                  <ellipse cx="140" cy="2000" rx="100" ry="40" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
                  <text x="140" y="1992" fill="#047857" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">PR STATUS MONITORING</text>
                  <text x="140" y="2006" fill="#065f46" fontSize="8.5" fontFamily="sans-serif" textAnchor="middle">
                    <tspan x="140" dy="0">"Open Sandbox" button transforms</tspan>
                    <tspan x="140" dy="11">to "PR Status" tracker.</tspan>
                  </text>
                </g>

                {/* 15. Emergency Cleanup Autonomic Teardown Oval */}
                <g>
                  <ellipse cx="660" cy="2000" rx="100" ry="40" fill="#fff1f2" stroke="#f43f5e" strokeWidth="1.5" />
                  <text x="660" y="1992" fill="#b91c1c" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">AUTONOMIC TEARDOWN</text>
                  <text x="660" y="2006" fill="#9f1239" fontSize="8.5" fontFamily="sans-serif" textAnchor="middle">
                    <tspan x="660" dy="0">Emergency cleanup: Wipes all container</tspan>
                    <tspan x="660" dy="11">workspaces automatically!</tspan>
                  </text>
                </g>
              </svg>
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
                className={`py-2.5 px-6 rounded-full bg-zinc-950 hover:bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 font-mono font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition-colors duration-150 active:scale-[0.98] ${
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
              className={`w-full py-2.5 px-4 rounded-full bg-zinc-950 hover:bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all duration-150 active:scale-[0.98] ${
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

      if (isTriage || build.status === 'REPAIRING') {
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
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">test cases</h4>
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
      <div className="flex-1 flex overflow-hidden w-full h-full bg-white text-zinc-900 dark:bg-[#090909] dark:text-zinc-50 transition-colors duration-250">
        
        {/* Column 1: Stable Fixed-width Builds History Sidebar */}
        <div className="w-72 shrink-0 h-full flex flex-col p-4 bg-transparent">
          <Sidebar
            builds={builds}
            selectedBuild={selectedBuild}
            onSelectBuild={handleSelectBuild}
            onTriggerBuild={handleTriggerBuild}
            isTriggering={isTriggering}
          />
        </div>

        {/* Master Workspace Detail Panel */}
        <div className="flex-1 flex flex-col overflow-hidden h-full p-4 pl-0 bg-transparent">
          <div className="flex-1 flex flex-col overflow-hidden h-full bg-white dark:bg-[#1c1c1c] border border-zinc-200 dark:border-[#262626] rounded-2xl shadow-sm">
          
          {selectedBuild === 'custom_triage' ? (
            renderCustomTriageConsole()
          ) : selectedBuild ? (
            <div className="flex-1 flex flex-col p-6 min-w-0 h-full overflow-hidden transition-colors duration-200">
              
              {/* Azure DevOps Breadcrumb & Metadata Panel */}
              <div className="border-b border-zinc-200 dark:border-zinc-900/80 pb-3 mb-4 shrink-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
                    <span>Test Pipelines</span>
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
                  ) : selectedBuild.status === 'REPAIRING' ? (
                    <span className="text-[9px] font-mono font-bold bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 animate-pulse">REPAIRING RUN</span>
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

                        {selectedBuild.status !== 'REPAIRING' && (
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

      </div>
    );
  };

  return (
    <Layout
      systemConfig={systemConfig}
      isDarkMode={isDarkMode}
      onToggleTheme={toggleTheme}
      activeTab={activeTab}
      onChangeTab={(tab) => {
        console.log(`[Router] Changed active view tab to: ${tab}`);
        if (tab === 'home') {
          router.push('/');
          return;
        }
        if (tab === 'how-it-works') {
          router.push('/how-it-works');
          return;
        }
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
