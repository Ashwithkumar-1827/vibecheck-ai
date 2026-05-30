import React, { useEffect, useState } from 'react';
import GitHubConnect from '../GitHubConnect';
import RepoCard from '../RepoCard';
import { GitBranch, GitFork, RefreshCw, Plus, HelpCircle, ShieldCheck, GitPullRequest, AlertTriangle } from 'lucide-react';

export default function RepoManager({ onNavigateToSandbox }) {
  const [repos, setRepos] = useState([]);
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [isCloning, setIsCloning] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState('');
  const [isGithubConnected, setIsGithubConnected] = useState(false);

  const fetchRepos = async () => {
    setLoadingList(true);
    try {
      const res = await fetch('/api/repos');
      const data = await res.json();
      setRepos(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load repositories');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  const handleClone = async (e) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setIsCloning(true);
    setError('');
    
    try {
      const res = await fetch('/api/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: repoUrl, branch })
      });
      const data = await res.json();
      
      if (res.ok) {
        setRepoUrl('');
        setBranch('main');
        await fetchRepos();

        // Only navigate to sandbox if the cloned repo has a pipeline
        const repoHasNoPipeline = data.hasNoPipeline || (data.detection && data.detection.hasCICD === false);
        if (repoHasNoPipeline) {
          setError(`No CI/CD pipeline detected in "${data.owner}/${data.name}". The repository has been cloned but the sandbox cannot be opened without a valid pipeline configuration (e.g. package.json, requirements.txt, Jenkinsfile, GitHub Actions, etc).`);
        } else if (onNavigateToSandbox) {
          onNavigateToSandbox(data, data.sandboxId || null, null);
        }
      } else {
        setError(data.error || 'Failed to clone repository');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to initiate clone: Connection error');
    } finally {
      setIsCloning(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this sandboxed repository? All container state will be destroyed.')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/repos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchRepos();
      } else {
        setError('Failed to remove repository');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failed during deletion');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 h-full bg-transparent text-zinc-900 dark:bg-transparent dark:text-zinc-50 scrollbar-thin">
      
      {/* 1. GitHub Connection Status Bar */}
      <GitHubConnect onConnectionChange={setIsGithubConnected} />

      {/* 2. Repository Cloning Center */}
      <div className="bg-zinc-50 dark:bg-[#1c1c1c] border border-zinc-200/60 dark:border-[#262626] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-zinc-950 text-white dark:bg-white dark:text-black rounded-lg">
            <Plus className="h-4.5 w-4.5" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-xs uppercase font-mono tracking-wider font-bold text-zinc-900 dark:text-white">
              Import Cloned Codebase
            </h3>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-550 font-mono tracking-tight">
              Clone into an isolated sandbox first. Code is never executed on the host machine.
            </p>
          </div>
        </div>

        <form onSubmit={handleClone} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Git URL input */}
            <div className="flex-1">
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-550 mb-1.5">
                GitHub Repository URL
              </label>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repository"
                disabled={isCloning}
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 hover:border-zinc-350 dark:bg-[#090909] dark:border-[#262626] dark:hover:border-zinc-800 dark:focus:border-zinc-850 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all disabled:opacity-50 text-zinc-900 dark:text-white"
                required
              />
            </div>

            {/* Branch selector */}
            <div className="w-full md:w-48">
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-550 mb-1.5">
                Target Branch
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
                disabled={isCloning}
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 hover:border-zinc-350 dark:bg-[#090909] dark:border-[#262626] dark:hover:border-zinc-800 dark:focus:border-zinc-850 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all disabled:opacity-50 text-zinc-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-250/20 dark:border-[#262626]/60">
            <div className="flex items-center space-x-2 text-[9px] text-zinc-400 dark:text-zinc-550 font-mono">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Supports both public and authenticated private repositories</span>
            </div>
            
            <button
              type="submit"
              disabled={isCloning || !repoUrl.trim()}
              className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-900 disabled:opacity-50 dark:bg-white dark:hover:bg-zinc-150 text-white dark:text-zinc-950 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98"
            >
              {isCloning ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Building Sandbox...
                </>
              ) : (
                <>
                  <GitFork className="h-3.5 w-3.5" />
                  Clone to Sandbox
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center gap-2 text-xs font-mono">
          <span>Error: {error}</span>
        </div>
      )}

      {/* 3. Tracked Repositories Section */}
      <div>
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-xs uppercase font-mono tracking-wider font-bold text-zinc-900 dark:text-white">
            Active Container Workspaces
          </h3>
          <button 
            onClick={fetchRepos}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-full hover:bg-zinc-100 dark:hover:bg-[#1c1c1c] transition-all"
            title="Refresh list"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {loadingList ? (
          <div className="flex flex-col items-center justify-center py-16 border border-zinc-200/60 dark:border-[#262626] rounded-2xl bg-zinc-50 dark:bg-[#1c1c1c]">
            <RefreshCw className="h-6 w-6 text-indigo-500 animate-spin mb-3" />
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-400 animate-pulse">Loading Sandboxed Contexts...</span>
          </div>
        ) : repos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-zinc-200/60 dark:border-[#262626] rounded-2xl bg-zinc-50 dark:bg-[#1c1c1c] text-zinc-400 dark:text-zinc-650">
            <GitBranch className="h-10 w-10 text-zinc-300 dark:text-zinc-800 mb-3" />
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-500">No active repositories</span>
            <span className="text-[9px] font-mono mt-1">Paste a repo URL above to clone your first container workspace.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repos.map((repo) => {
              const isPromoted = repo.status === 'promoted' && repo.prUrl;
              const hasNoPipeline = repo.hasNoPipeline || (repo.detection && repo.detection.hasCICD === false);
              return (
                <RepoCard
                  key={repo.id}
                  repo={repo}
                  hasNoPipeline={hasNoPipeline}
                  actionLabel={hasNoPipeline ? "no pipeline detected" : (isPromoted ? "PR Status" : "Open Sandbox")}
                  actionIcon={hasNoPipeline ? <AlertTriangle className="h-3 w-3 text-red-500" /> : (isPromoted ? <GitPullRequest className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />)}
                  onRun={() => {
                    if (hasNoPipeline) return;
                    if (isPromoted) {
                      window.open(repo.prUrl, '_blank', 'noopener,noreferrer');
                    } else if (onNavigateToSandbox) {
                      onNavigateToSandbox(repo, repo.sandboxId || null, null);
                    }
                  }}
                  onDelete={() => handleDelete(repo.id)}
                />
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
