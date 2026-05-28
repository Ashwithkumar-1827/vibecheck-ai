import React from 'react';
import { CheckCircle, XCircle, Loader2, PlayCircle, Hourglass } from 'lucide-react';

export default function StageProgress({ stages }) {
  // Default checklist definition
  const defaultStages = [
    { id: 'clone', label: 'Clone Codebase' },
    { id: 'install', label: 'Install Packages' },
    { id: 'build', label: 'Build Assets' },
    { id: 'test', label: 'Test Suite' }
  ];

  // Map incoming stages status
  const getStageStatus = (stageId) => {
    if (!stages || stages.length === 0) return 'pending';
    
    // Find index of stage in incoming results
    const idx = stages.findIndex(s => s.name === stageId || (stageId === 'clone' && s.name === 'clone'));
    
    if (idx >= 0) {
      return stages[idx].status === 'passed' ? 'passed' : 'failed';
    }

    // Determine if it is currently running or pending
    const lastCompletedIdx = stages.map(s => s.status).lastIndexOf('passed');
    
    // If previous stage passed, this one is running next!
    // Stage order: clone -> install -> build -> test
    const stageOrder = ['clone', 'install', 'build', 'test'];
    const currentOrderIdx = stageOrder.indexOf(stageId);
    
    if (currentOrderIdx === lastCompletedIdx + 1) {
      return 'running';
    }

    if (currentOrderIdx <= lastCompletedIdx) {
      return 'passed'; // implicitly passed if it's before last completed and not in list
    }

    // If one of the stages has failed, any downstream stages are skipped
    const hasFailed = stages.some(s => s.status === 'failed');
    if (hasFailed && currentOrderIdx > stages.findIndex(s => s.status === 'failed')) {
      return 'skipped';
    }

    return 'pending';
  };

  const getStageIcon = (status) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-emerald-500 fill-emerald-50 dark:fill-zinc-950 transition-colors" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500 fill-red-50 dark:fill-zinc-950" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />;
      case 'skipped':
        return <Hourglass className="h-5 w-5 text-zinc-400 opacity-50" />;
      default:
        return <PlayCircle className="h-5 w-5 text-zinc-300 dark:text-zinc-700" />;
    }
  };

  return (
    <div className="flex w-full items-center justify-between py-5 px-6 bg-zinc-50 border border-zinc-200/60 dark:bg-zinc-950 dark:border-zinc-900 rounded-2xl shadow-sm">
      {defaultStages.map((stage, idx) => {
        const status = getStageStatus(stage.id);
        const icon = getStageIcon(status);

        return (
          <React.Fragment key={stage.id}>
            {/* Stage Widget */}
            <div className="flex items-center space-x-3 shrink-0">
              <div className="shrink-0">{icon}</div>
              <div className="flex flex-col">
                <span className={`text-[10px] uppercase font-mono tracking-wider font-bold ${
                  status === 'running' 
                    ? 'text-indigo-500' 
                    : status === 'passed'
                      ? 'text-zinc-900 dark:text-white'
                      : status === 'failed'
                        ? 'text-red-500 font-bold'
                        : 'text-zinc-400 dark:text-zinc-600'
                }`}>
                  {stage.label}
                </span>
                <span className="text-[9px] text-zinc-400 dark:text-zinc-550 font-mono tracking-tight capitalize">
                  {status === 'passed' ? 'Complete' : status}
                </span>
              </div>
            </div>

            {/* Connecting Chevron/Line */}
            {idx < defaultStages.length - 1 && (
              <div className={`flex-1 h-[2px] mx-4 transition-colors duration-300 ${
                status === 'passed' 
                  ? 'bg-emerald-500' 
                  : status === 'failed'
                    ? 'bg-red-200 dark:bg-red-950'
                    : 'bg-zinc-200 dark:bg-zinc-800'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
