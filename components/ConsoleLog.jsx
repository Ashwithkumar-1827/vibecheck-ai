import React, { useRef, useEffect } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';

export default function ConsoleLog({ logOutput }) {
  const terminalEndRef = useRef(null);
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logOutput]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(logOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatLogLines = (rawLog) => {
    if (!rawLog) return null;

    const lines = rawLog.split('\n');
    return lines.map((line, index) => {
      let lineClass = "text-zinc-500 dark:text-zinc-400";
      
      // Match section headers e.g. "=== FAILURES ==="
      if (line.startsWith('===') || line.startsWith('___') || line.includes('test session starts')) {
        lineClass = "text-zinc-900 dark:text-zinc-100 font-bold tracking-tight";
      }
      // Match errors / failure logs
      else if (line.startsWith('E   ') || line.startsWith('E  ') || line.includes('ZeroDivisionError') || line.includes('SyntaxError') || line.includes('AssertionError')) {
        return (
          <div key={index} className="bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border-l-2 border-red-500 py-0.5 px-2 my-0.5 font-semibold font-mono text-[11px]">
            {line}
          </div>
        );
      }
      // Match failed test modules e.g. "tests/test_security.py F"
      else if (line.includes(' F ') || line.endsWith('F') && (line.includes('tests/'))) {
        lineClass = "text-red-600 dark:text-red-400 font-semibold";
      }
      // Match passed test modules e.g. "tests/test_security.py ."
      else if (line.includes(' . ') || line.endsWith('.') && (line.includes('tests/'))) {
        lineClass = "text-emerald-600 dark:text-emerald-400 font-semibold";
      }
      // Match standard python file paths e.g. "core/security.py:27"
      else if (line.includes('.py:') || line.includes('line ')) {
        lineClass = "text-zinc-800 dark:text-zinc-300 font-mono";
      }
      // Match traceback references e.g. ">       factor = 100 / scale"
      else if (line.trim().startsWith('>')) {
        lineClass = "text-amber-800 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/20 px-1 rounded";
      }

      return (
        <div key={index} className={`${lineClass} py-[1px] font-mono text-[11px]`}>
          {line}
        </div>
      );
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-white border border-zinc-200/80 dark:bg-zinc-950 dark:border-zinc-900 rounded-xl overflow-hidden shadow-sm">
      {/* Console Title Bar */}
      <div className="bg-zinc-50 border-b border-zinc-200/80 dark:bg-zinc-900/40 dark:border-zinc-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Terminal className="h-4 w-4 text-zinc-500" />
          <div className="h-3 w-[1px] bg-zinc-300 dark:bg-zinc-800" />
          <span className="text-zinc-600 dark:text-zinc-400 font-mono text-[10px] uppercase tracking-wider font-semibold">
            Pipeline logs console
          </span>
        </div>
        
        {/* Actions */}
        <button
          onClick={copyToClipboard}
          className="text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors p-1 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded"
          title="Copy console logs"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Terminal Display */}
      <div className="flex-1 p-4 overflow-y-auto relative overflow-x-auto select-text scrollbar-thin">
        <div className="space-y-[1px]">
          {formatLogLines(logOutput)}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
}
