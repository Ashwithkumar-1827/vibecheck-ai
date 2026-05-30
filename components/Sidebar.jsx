import React from 'react';
import { Play, Check, AlertCircle, RefreshCw, Command } from 'lucide-react';

export default function Sidebar({ builds, selectedBuild, onSelectBuild, onTriggerBuild, isTriggering }) {
  
  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return isoString;
    }
  };

  const getStatusDetails = (status) => {
    switch (status) {
      case 'SUCCESS':
        return {
          icon: <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-450 shrink-0" />,
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-455 dark:border-emerald-900/30',
          selectedClass: 'border-zinc-950 dark:border-zinc-200 bg-zinc-50 dark:bg-[#1c1c1c] shadow-sm'
        };
      case 'FAILED':
        return {
          icon: <AlertCircle className="h-4 w-4 text-red-650 dark:text-red-400 shrink-0" />,
          badgeClass: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-455 dark:border-red-900/30',
          selectedClass: 'border-zinc-950 dark:border-zinc-200 bg-zinc-50 dark:bg-[#1c1c1c] shadow-sm'
        };
      case 'PENDING_APPROVAL':
        return {
          icon: <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />,
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-455 dark:border-amber-900/30 animate-pulse',
          selectedClass: 'border-zinc-950 dark:border-zinc-200 bg-zinc-50 dark:bg-[#1c1c1c] shadow-sm'
        };
      case 'REPAIRING':
        return {
          icon: <RefreshCw className="h-4 w-4 text-zinc-500 dark:text-zinc-400 shrink-0 animate-spin" />,
          badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 animate-pulse',
          selectedClass: 'border-zinc-950 dark:border-zinc-200 bg-zinc-50 dark:bg-[#1c1c1c] shadow-sm'
        };
      default:
        return {
          icon: <Play className="h-4 w-4 text-zinc-400 shrink-0" />,
          badgeClass: 'bg-zinc-100 text-zinc-650 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-500 dark:border-zinc-800',
          selectedClass: 'border-zinc-950 dark:border-zinc-200 bg-zinc-50 dark:bg-[#1c1c1c] shadow-sm'
        };
    }
  };

  return (
    <aside className="w-full bg-white dark:bg-[#1c1c1c] border border-zinc-200 dark:border-[#262626] rounded-2xl flex flex-col shrink-0 h-full transition-colors duration-200 cursor-default select-none overflow-hidden shadow-sm">
      
      {/* Trigger Build Button */}
      <div className="p-4 border-b border-zinc-150 dark:border-[#262626] transition-colors duration-200 bg-transparent dark:bg-transparent">
        <button
          onClick={onTriggerBuild}
          disabled={isTriggering}
          className={`w-full py-2.5 px-4 rounded-full flex items-center justify-center space-x-2 font-mono font-bold text-xs uppercase tracking-wider transition-all duration-150 shrink-0 ${
            isTriggering
              ? 'bg-zinc-150 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-800 cursor-not-allowed'
              : 'bg-zinc-950 hover:bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 active:scale-[0.98] shadow-sm'
          }`}
        >
          {isTriggering ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Running Pipeline...</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current text-white dark:text-zinc-950" />
              <span>Trigger Pipeline Build</span>
            </>
          )}
        </button>
      </div>
      
      {/* Diagnose Custom Failure Button */}
      <div className="px-4 pb-3 transition-colors duration-200 bg-transparent dark:bg-transparent">
        <button
          onClick={() => onSelectBuild('custom_triage')}
          className={`w-full py-2 px-4 rounded-full flex items-center justify-center space-x-2 font-mono font-bold text-xs uppercase tracking-wider transition-all duration-150 border ${
            selectedBuild === 'custom_triage'
              ? 'bg-zinc-100 dark:bg-[#090909] border-zinc-300 dark:border-[#262626] text-zinc-850 dark:text-white shadow-sm'
              : 'bg-transparent border-zinc-200 dark:border-[#262626] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-[#1c1c1c]/50 hover:text-zinc-800 dark:hover:text-zinc-250'
          }`}
        >
          <Command className="h-3.5 w-3.5 shrink-0" />
          <span>Diagnose Custom Failure</span>
        </button>
      </div>

      {/* Build History Scroll List */}
      <div className="flex-1 overflow-y-auto p-4 pt-1 space-y-3 no-scrollbar pointer-events-auto bg-transparent dark:bg-transparent">
        <div className="flex items-center space-x-1.5 text-zinc-400 dark:text-zinc-500 font-mono text-[9px] uppercase tracking-wider px-1 pb-1 transition-colors duration-200">
          <Command className="h-3 w-3 shrink-0" />
          <span>test cases</span>
        </div>

        {builds.length === 0 ? (
          <div className="text-center py-8 text-zinc-400 dark:text-zinc-500 font-mono text-xs transition-colors duration-200">
            No builds found.
          </div>
        ) : (
          builds.map((build) => {
            const isSelected = selectedBuild && String(selectedBuild.id) === String(build.id);
            const details = getStatusDetails(build.status);
            
            return (
              <div
                key={build.id}
                onClick={() => onSelectBuild(build.id)}
                className={`p-3.5 rounded-lg cursor-pointer transition-all duration-200 border ${
                  isSelected 
                    ? details.selectedClass 
                    : 'border-zinc-200 dark:border-[#262626] bg-zinc-50/50 hover:bg-zinc-100/60 dark:bg-[#090909]/20 dark:hover:bg-[#1c1c1c]/40 text-zinc-800 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono font-bold text-xs text-zinc-950 dark:text-zinc-200">
                      Build #{build.id}
                    </span>
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">
                      {formatDate(build.timestamp)}
                    </span>
                  </div>
                  <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${details.badgeClass}`}>
                    {build.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  {details.icon}
                  <span className="text-zinc-650 dark:text-zinc-400 truncate font-mono text-[10px] tracking-tight">
                    {build.target_scenario || 'Microservice Pipe'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
