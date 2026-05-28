import React from 'react';
import { GitPullRequest, FileCode } from 'lucide-react';

export default function DiffViewer({ filePath, originalCode, patchedCode }) {
  if (!originalCode && !patchedCode) return null;

  const origLines = originalCode.split('\n');
  const patchLines = patchedCode.split('\n');

  return (
    <div className="bg-white border border-zinc-200/80 dark:bg-zinc-950 dark:border-zinc-900 rounded-xl overflow-hidden shadow-sm flex flex-col">
      {/* File Path Header */}
      <div className="bg-zinc-50 border-b border-zinc-200/80 dark:bg-zinc-900/40 dark:border-zinc-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileCode className="h-4 w-4 text-zinc-500" />
          <span className="font-mono text-xs text-zinc-800 dark:text-zinc-200 font-semibold">{filePath}</span>
        </div>
        <div className="flex items-center space-x-1 px-2 py-0.5 bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded text-[9px] text-zinc-600 dark:text-zinc-400 font-mono uppercase tracking-widest font-bold">
          <GitPullRequest className="h-3 w-3 text-zinc-500" />
          <span>PROPOSED PATCH</span>
        </div>
      </div>

      {/* Unified Diff Box */}
      <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-zinc-200/80 dark:divide-zinc-900 font-mono text-xs overflow-x-auto">
        
        {/* Original Code (Before) */}
        <div className="flex-1 p-4 bg-zinc-50/20 dark:bg-zinc-950/20 overflow-x-auto">
          <div className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold font-mono tracking-widest uppercase mb-3 flex items-center justify-between">
            <span>ORIGINAL CODE</span>
            <span className="text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">BEFORE</span>
          </div>
          <pre className="space-y-1 text-zinc-400 dark:text-zinc-500">
            {origLines.map((line, idx) => (
              <div key={idx} className="flex bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border-l-2 border-red-500 -mx-4 px-4 py-0.5 font-semibold">
                <span className="w-5 select-none text-[9px] text-red-400/50 shrink-0 font-mono mt-0.5">{idx + 1}</span>
                <span className="select-none text-[9px] text-red-400/50 shrink-0 font-mono mr-2">-</span>
                <span className="whitespace-pre overflow-x-auto">{line}</span>
              </div>
            ))}
          </pre>
        </div>

        {/* Patched Code (After) */}
        <div className="flex-1 p-4 bg-zinc-50/20 dark:bg-zinc-950/20 overflow-x-auto">
          <div className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold font-mono tracking-widest uppercase mb-3 flex items-center justify-between">
            <span>PATCHED CODE</span>
            <span className="text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">PROPOSED</span>
          </div>
          <pre className="space-y-1 text-zinc-700 dark:text-zinc-300">
            {patchLines.map((line, idx) => {
              // Strip trailing carriage return if any to be safe
              const cleanText = line.replace(/\r$/, '');
              // Check if line was modified relative to original
              const isAdded = !origLines.map(l => l.replace(/\r$/, '')).includes(cleanText);
              const lineBg = isAdded ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-l-2 border-emerald-500 -mx-4 px-4 py-0.5 font-semibold" : "-mx-4 px-4 py-0.5";
              
              return (
                <div key={idx} className={`flex ${lineBg}`}>
                  <span className="w-5 select-none text-[9px] text-emerald-500/50 shrink-0 font-mono mt-0.5">{idx + 1}</span>
                  <span className="select-none text-[9px] text-emerald-500/50 shrink-0 font-mono mr-2">{isAdded ? '+' : ' '}</span>
                  <span className="whitespace-pre overflow-x-auto">{line}</span>
                </div>
              );
            })}
          </pre>
        </div>

      </div>
    </div>
  );
}
