import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Copy, Check, ArrowDown } from 'lucide-react';

export default function LiveConsole({ logs, isRunning }) {
  const terminalEndRef = useRef(null);
  const containerRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleCopy = () => {
    navigator.clipboard.writeText(logs || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert ANSI color codes to styled HTML
  const parseAnsi = (text) => {
    if (!text) return '';
    
    // Simple escape code replacer
    let clean = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Color codes
    const colors = {
      '31': 'text-red-500 font-bold',
      '32': 'text-emerald-500 font-bold',
      '33': 'text-amber-500 font-bold',
      '34': 'text-blue-500',
      '35': 'text-purple-500',
      '36': 'text-cyan-500',
      '37': 'text-zinc-300',
      '90': 'text-zinc-500 font-mono',
      '1': 'font-bold'
    };

    // Replace ANSI escape sequences with span tags
    // Matches \u001b[XXm or \e[XXm or \033[XXm
    const regex = /\u001b\[(\d+;?\d*)m/g;
    let match;
    let result = '';
    let lastIndex = 0;
    let currentClass = '';

    while ((match = regex.exec(clean)) !== null) {
      const textChunk = clean.slice(lastIndex, match.index);
      if (currentClass) {
        result += `<span class="${currentClass}">${textChunk}</span>`;
      } else {
        result += textChunk;
      }

      const code = match[1];
      if (code === '0') {
        currentClass = '';
      } else {
        currentClass = colors[code] || '';
      }
      lastIndex = regex.lastIndex;
    }

    const remainingText = clean.slice(lastIndex);
    if (currentClass) {
      result += `<span class="${currentClass}">${remainingText}</span>`;
    } else {
      result += remainingText;
    }

    return result;
  };

  return (
    <div className="flex flex-col h-full bg-[#090909] border border-[#262626] rounded-xl overflow-hidden shadow-2xl relative font-mono text-xs text-zinc-300">
      
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#141414] border-b border-[#262626] shrink-0">
        <div className="flex items-center space-x-2">
          <Terminal className="h-4 w-4 text-zinc-400" />
          <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-400">
            Pipeline Log Stream
          </span>
          {isRunning && (
            <span className="flex h-2 w-2 relative ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Scroll Pin Toggle */}
          <button 
            onClick={() => setAutoScroll(prev => !prev)}
            className={`p-1 rounded hover:bg-zinc-800 transition-colors ${autoScroll ? 'text-emerald-400' : 'text-zinc-500'}`}
            title="Auto-scroll pinned"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          
          {/* Copy Button */}
          <button 
            onClick={handleCopy}
            className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors"
            title="Copy Logs"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Logs View Canvas */}
      <div 
        ref={containerRef}
        className="flex-1 p-4 overflow-y-auto overflow-x-hidden space-y-1 selection:bg-zinc-800 scrollbar-thin scrollbar-thumb-zinc-800"
      >
        {logs ? (
          <pre 
            className="whitespace-pre-wrap break-all leading-relaxed"
            dangerouslySetInnerHTML={{ __html: parseAnsi(logs) }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600 font-mono text-[10px]">
            <span>NO PIPELINE EXECUTION IN PROGRESS</span>
            <span>Trigger a pipeline run to stream console logs</span>
          </div>
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
