import React from 'react';
import { Sparkles, Terminal, Database, Key, Sun, Moon, GitBranch, Shield, BookOpen } from 'lucide-react';

export default function Layout({ 
  children, 
  systemConfig, 
  isDarkMode, 
  onToggleTheme, 
  activeTab, 
  onChangeTab
}) {
  const navItems = [
    { id: 'pipelines', icon: <Terminal className="h-4.5 w-4.5" />, label: 'Pipelines' },
    { id: 'agent', icon: <Sparkles className="h-4.5 w-4.5" />, label: 'Diagnostics' },
    { id: 'repos', icon: <GitBranch className="h-4.5 w-4.5" />, label: 'Repositories' },
    { id: 'sandbox', icon: <Shield className="h-4.5 w-4.5" />, label: 'Sandbox' },
    { id: 'database', icon: <Database className="h-4.5 w-4.5" />, label: 'Storage' },
    { id: 'keys', icon: <Key className="h-4.5 w-4.5" />, label: 'Credentials' },
    { id: 'guide', icon: <BookOpen className="h-4.5 w-4.5" />, label: 'User Guide' }
  ];

  return (
    <div className="flex h-screen w-screen transition-colors duration-250 bg-white text-zinc-900 dark:bg-black dark:text-zinc-50 font-sans select-none overflow-hidden">
      
      {/* 1. Dynamic Hover-Expand Left Menu Sidebar (Width: 64px Collapsed, 224px Expanded) */}
      <nav className="w-16 hover:w-56 group/main-sidebar bg-zinc-100 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-900 flex flex-col py-4 justify-between shrink-0 select-none h-full transition-all duration-300 ease-in-out z-50 overflow-hidden">
        
        {/* Fixed 224px (w-56) container to prevent interior layout shifts */}
        <div className="w-56 flex flex-col space-y-5 px-3">
          
          {/* Top Logo Section */}
          <div className="flex items-center space-x-3 w-full px-2">
            <div className="p-2 bg-zinc-950 text-white dark:bg-white dark:text-black rounded-xl shadow-sm hover:rotate-12 transition-transform duration-300 shrink-0">
              <Sparkles className="h-4.5 w-4.5 fill-current text-white dark:text-zinc-950" />
            </div>
            <span className="hidden group-hover/main-sidebar:inline font-mono font-bold text-xs text-zinc-900 dark:text-white tracking-wider uppercase whitespace-nowrap transition-all duration-200">
              VibeCheck AI
            </span>
          </div>
          
          <div className="w-full h-[1px] bg-zinc-200 dark:bg-zinc-800/80" />
          
          {/* Vertical Menu Buttons */}
          <div className="flex flex-col space-y-2 w-full">
            {navItems.map((item) => {
              const isActive = activeTab === item.id || (!activeTab && item.id === 'pipelines');
              return (
                <button
                  key={item.id}
                  onClick={() => onChangeTab && onChangeTab(item.id)}
                  className={`w-10 group-hover/main-sidebar:w-full py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center group-hover/main-sidebar:justify-start space-x-0 group-hover/main-sidebar:space-x-3.5 relative overflow-hidden ${
                    isActive 
                      ? 'bg-zinc-950 dark:bg-zinc-900 text-white dark:text-white border border-zinc-900 dark:border-zinc-800 shadow-sm' 
                      : 'text-zinc-650 hover:text-zinc-900 hover:bg-zinc-200/50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-900/30'
                  }`}
                  title={item.label}
                >
                  <div className="shrink-0 flex items-center justify-center w-4 h-4">{item.icon}</div>
                  <span className="hidden group-hover/main-sidebar:inline text-[10px] font-mono uppercase tracking-wider font-bold whitespace-nowrap transition-all duration-200">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions: Theme Toggle & Settings */}
        <div className="w-56 flex flex-col space-y-4 px-3">
          
          {/* API Health Indicator Row */}
          <div className="flex items-center space-x-3.5 w-full">
            <div className="w-10 flex justify-center shrink-0">
              {systemConfig && (systemConfig.openai_configured || systemConfig.gemini_configured) ? (
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              ) : (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              )}
            </div>
            <span className="hidden group-hover/main-sidebar:inline text-[9px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-450 whitespace-nowrap transition-all duration-200">
              {systemConfig && systemConfig.openai_configured 
                ? 'OpenAI API Connected' 
                : systemConfig && systemConfig.gemini_configured 
                  ? 'Gemini API Connected' 
                  : 'Offline Simulator Mode'}
            </span>
          </div>

          <div className="w-full h-[1px] bg-zinc-200 dark:bg-zinc-850" />

          {/* Theme Switcher Button */}
          <button
            onClick={onToggleTheme}
            className="w-10 group-hover/main-sidebar:w-full py-2.5 rounded-xl text-zinc-650 hover:text-zinc-900 hover:bg-zinc-200/50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-900/30 transition-all duration-200 flex items-center justify-center group-hover/main-sidebar:justify-start space-x-0 group-hover/main-sidebar:space-x-3.5"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <div className="shrink-0">
              {isDarkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </div>
            <span className="hidden group-hover/main-sidebar:inline text-[10px] font-mono uppercase tracking-wider font-bold whitespace-nowrap transition-all duration-200">
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
        </div>
      </nav>

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* OpenAI Top Border Header */}
        <header className="px-6 py-3.5 flex items-center justify-between bg-white border-b border-zinc-200/80 dark:bg-black dark:border-zinc-900/60 shrink-0 transition-colors duration-200">
          <div>
            <h1 className="text-sm font-bold font-sans tracking-tight text-zinc-950 dark:text-white flex items-center gap-1.5 uppercase">
              VibeCheck CI/CD <span className="text-[9px] px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 rounded font-mono border border-zinc-200 dark:border-zinc-800 transition-colors duration-200">PLAYGROUND</span>
            </h1>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-550 font-mono tracking-tight transition-colors duration-200">Sandbox-first AI diagnostics and protected pipeline promotion</p>
          </div>

          {/* Minimalist health states */}
          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="text-zinc-400 dark:text-zinc-500 transition-colors duration-200">Uptime: <span className="text-zinc-800 dark:text-zinc-200 font-bold transition-colors duration-200">98.4%</span></span>
            <span className="text-zinc-300 dark:text-zinc-800">|</span>
            <span className="text-zinc-400 dark:text-zinc-500 transition-colors duration-200">Healed: <span className="text-zinc-800 dark:text-zinc-200 font-bold transition-colors duration-200">100%</span></span>
          </div>
        </header>

        {/* Content slots - holds sidebar and playground split */}
        <div className="flex-1 flex overflow-hidden w-full h-full">
          {children}
        </div>
      </div>
    </div>
  );
}
