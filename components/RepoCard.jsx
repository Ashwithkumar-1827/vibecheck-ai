import React from 'react';
import { GitBranch, Trash2, Play, Cpu, HardDrive } from 'lucide-react';

export default function RepoCard({ repo, onRun, onDelete, actionLabel = 'Run Pipeline', actionIcon = null, hasNoPipeline = false }) {
  const getLanguageBadgeColor = (lang) => {
    switch (lang) {
      case 'python':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/25';
      case 'java':
        return 'bg-red-500/10 text-red-500 border-red-500/25';
      default:
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'cloning':
        return (
          <span className="flex items-center text-[9px] font-mono uppercase bg-amber-500/10 text-amber-500 border border-amber-500/25 px-2 py-0.5 rounded animate-pulse">
            Cloning...
          </span>
        );
      case 'promoted':
        return (
          <span className="flex items-center text-[9px] font-mono uppercase bg-indigo-500/10 text-indigo-500 border border-indigo-500/25 px-2 py-0.5 rounded">
            PR Promoted
          </span>
        );
      default:
        return (
          <span className="flex items-center text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 px-2 py-0.5 rounded">
            Ready
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-zinc-200/80 dark:bg-[#090909] dark:border-[#262626] rounded-2xl p-5 hover:border-zinc-350 dark:hover:border-zinc-800 transition-all duration-200 group/repocard shadow-sm relative flex flex-col justify-between">
      
      <div>
        {/* Repo Header row */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <h4 className="text-xs uppercase font-mono tracking-wider font-bold text-zinc-900 dark:text-white truncate max-w-[200px]">
              {repo.owner}/{repo.name}
            </h4>
            <a 
              href={repo.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[9px] text-zinc-400 hover:text-indigo-400 dark:text-zinc-550 font-mono tracking-tight hover:underline truncate max-w-[220px]"
            >
              {repo.url}
            </a>
          </div>
          <div className="shrink-0">{getStatusBadge(repo.status)}</div>
        </div>

        {/* Specs and info */}
        <div className="grid grid-cols-2 gap-3.5 my-5 border-t border-b border-zinc-100 dark:border-[#262626]/85 py-4">
          <div className="flex items-center space-x-2 text-[10px] font-mono">
            <GitBranch className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-zinc-500 dark:text-zinc-450 uppercase truncate max-w-[90px]">{repo.branch}</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`text-[9px] uppercase font-mono border px-2 py-0.5 rounded font-bold ${getLanguageBadgeColor(repo.projectType)}`}>
              {repo.projectType === 'nodejs' ? 'Node.js' : repo.projectType === 'python' ? 'Python' : repo.projectType}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[9px] text-zinc-400 dark:text-zinc-550 font-mono">
            <Cpu className="h-3.5 w-3.5" />
            <span>1 Core Limit</span>
          </div>

          <div className="flex items-center space-x-2 text-[9px] text-zinc-400 dark:text-zinc-550 font-mono">
            <HardDrive className="h-3.5 w-3.5" />
            <span>512MB RAM</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2.5 mt-2">
        {hasNoPipeline ? (
          <div className="flex-1 py-2 bg-red-500/10 border border-red-500/25 text-red-500 dark:text-red-400 text-[10px] font-mono font-bold uppercase tracking-wider rounded-full flex items-center justify-center gap-1.5 cursor-not-allowed select-none">
            {actionIcon}
            <span>{actionLabel}</span>
          </div>
        ) : (
          <button
            onClick={onRun}
            disabled={repo.status === 'cloning'}
            className="flex-1 py-2 bg-zinc-950 hover:bg-zinc-900 disabled:opacity-50 dark:bg-white dark:hover:bg-zinc-150 text-white dark:text-zinc-950 text-[10px] font-mono font-bold uppercase tracking-wider rounded-full flex items-center justify-center gap-1.5 transition-all active:scale-98"
          >
            {actionIcon || <Play className="h-3 w-3 fill-current" />}
            {actionLabel}
          </button>
        )}

        <button
          onClick={onDelete}
          className="p-2 text-zinc-450 hover:text-red-500 hover:bg-red-500/10 border border-zinc-200 dark:border-[#262626] dark:hover:border-red-500/25 rounded-full transition-all"
          title="Delete Workspace"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

    </div>
  );
}
