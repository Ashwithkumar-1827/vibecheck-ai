import React, { useEffect, useState } from 'react';
import { GitBranch, User, LogOut, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function GitHubConnect({ onConnectionChange }) {
  const [status, setStatus] = useState({ connected: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStatus = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/github/status');
      const data = await res.json();
      setStatus(data);
      if (onConnectionChange) {
        onConnectionChange(data.connected);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch connection status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Check if redirect callback returned connected flag or errors
    const params = new URLSearchParams(window.location.search);
    if (params.get('github') === 'connected') {
      fetchStatus();
      // Clean query string
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('github_error')) {
      setError(params.get('github_error'));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleConnect = () => {
    setError('');
    // Direct redirect to the backend auth path to launch OAuth scope redirection
    window.location.href = '/api/github/auth';
  };

  const handleDisconnect = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/github/disconnect', { method: 'POST' });
      if (res.ok) {
        setStatus({ connected: false });
        if (onConnectionChange) {
          onConnectionChange(false);
        }
      } else {
        setError('Failed to disconnect');
      }
    } catch (err) {
      setError('Connection failure during disconnect');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 bg-zinc-50 dark:bg-[#1c1c1c] border border-zinc-200/60 dark:border-[#262626] rounded-2xl h-24">
        <RefreshCw className="h-5 w-5 text-indigo-500 animate-spin mr-3" />
        <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">Verifying GitHub Handshake...</span>
      </div>
    );
  }

  return (
    <div className="bg-zinc-50 dark:bg-[#1c1c1c] border border-zinc-200/60 dark:border-[#262626] rounded-2xl overflow-hidden shadow-sm transition-all duration-300">
      <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Connection Profile Details */}
        <div className="flex items-center space-x-4">
          <div className={`p-3.5 rounded-2xl shrink-0 transition-all duration-300 ${
            status.connected 
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
              : 'bg-zinc-250/50 text-zinc-600 dark:bg-[#090909] dark:text-zinc-400 border border-zinc-200 dark:border-[#262626]'
          }`}>
            <GitBranch className="h-6 w-6" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-xs uppercase font-mono tracking-wider font-bold text-zinc-900 dark:text-white">
                GitHub Authorization
              </h3>
              {status.connected ? (
                <span className="flex items-center text-[9px] font-mono font-bold uppercase text-emerald-500 gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25">
                  <CheckCircle className="h-2.5 w-2.5" />
                  Active OAuth
                </span>
              ) : (
                <span className="text-[9px] font-mono font-bold uppercase text-zinc-400 dark:text-zinc-650 bg-zinc-200/50 dark:bg-[#090909] px-2 py-0.5 rounded border border-zinc-200 dark:border-[#262626]">
                  Not Connected
                </span>
              )}
            </div>
            
            <p className="text-[10px] text-zinc-400 dark:text-zinc-550 font-mono tracking-tight mt-0.5">
              {status.connected 
                ? `Authorized as @${status.username} to securely manage code promotions.` 
                : 'Connect your GitHub profile using safe OAuth scopes to push verified hotfixes.'}
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="shrink-0 w-full md:w-auto">
          {status.connected ? (
            <div className="flex items-center gap-3">
              {status.avatarUrl && (
                <img 
                  src={status.avatarUrl} 
                  alt={status.username} 
                  className="h-8 w-8 rounded-full border border-zinc-350 dark:border-zinc-700 hover:scale-105 transition-transform shrink-0" 
                />
              )}
              <button
                onClick={handleDisconnect}
                className="w-full md:w-auto px-4 py-2 bg-zinc-100 hover:bg-zinc-200/60 dark:bg-[#090909] dark:hover:bg-[#1c1c1c] border border-zinc-200 dark:border-[#262626] rounded-full text-[10px] font-mono font-bold text-red-500 uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              className="w-full md:w-auto px-5 py-2.5 bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-zinc-900 dark:border-white transition-all shadow-sm active:scale-98"
            >
              <GitBranch className="h-4 w-4" />
              Connect GitHub Profile
            </button>
          )}
        </div>

      </div>

      {error && (
        <div className="px-6 py-3 bg-red-500/10 border-t border-red-500/20 text-red-500 flex items-center gap-2 text-[10px] font-mono">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Error: {error}</span>
        </div>
      )}
    </div>
  );
}
