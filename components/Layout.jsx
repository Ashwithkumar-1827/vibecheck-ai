import React from 'react';
import { Home, Sparkles, Terminal, Database, Key, Sun, Moon, GitBranch, Shield } from 'lucide-react';

export default function Layout({ 
  children, 
  systemConfig, 
  isDarkMode, 
  onToggleTheme, 
  activeTab, 
  onChangeTab
}) {
  const navItems = [
    { id: 'home', icon: <Home className="h-4 w-4" />, label: 'Home' },
    { id: 'repos', icon: <GitBranch className="h-4 w-4" />, label: 'Repositories' },
    { id: 'agent', icon: <Sparkles className="h-4 w-4" />, label: 'Dashboard' },
    { id: 'sandbox', icon: <Shield className="h-4 w-4" />, label: 'Sandbox' },
    { id: 'pipelines', icon: <Terminal className="h-4 w-4" />, label: 'Test Pipelines' },
    { id: 'database', icon: <Database className="h-4 w-4" />, label: 'Storage' },
    { id: 'keys', icon: <Key className="h-4 w-4" />, label: 'Credentials' }
  ];

  return (
    <div className="flex h-screen w-screen bg-white dark:bg-[#090909] text-zinc-900 dark:text-zinc-50 font-sans select-none overflow-hidden p-3 gap-3 transition-colors duration-250">

      {/* ===== CARD 1: Left Sidebar Container ===== */}
      <nav className="w-16 hover:w-56 group/main-sidebar shrink-0 h-full flex flex-col justify-between overflow-hidden transition-all duration-300 ease-in-out z-50
                      bg-white dark:bg-[#141414] border border-zinc-200 dark:border-[#262626] rounded-2xl shadow-lg">

        {/* Inner fixed-width column to prevent layout shifts on expand */}
        <div className="w-56 flex flex-col space-y-4 px-3 pt-4">

          {/* Logo + Brand Row */}
          <div className="flex items-center space-x-3 w-full px-1.5">
            <img
              src="/logo.jpg"
              alt="VibeCheck AI Logo"
              className="h-6 w-6 rounded-md object-cover shadow-sm shrink-0 border border-zinc-200 dark:border-[#262626]"
            />
            <span className="hidden group-hover/main-sidebar:inline font-mono font-bold text-xs text-zinc-900 dark:text-white tracking-wider uppercase whitespace-nowrap transition-all duration-200">
              VibeCheck AI
            </span>
          </div>

          {/* Divider */}
          <div className="w-full h-[1px] bg-zinc-200 dark:bg-[#262626]" />

          {/* Nav Menu Items */}
          <div className="flex flex-col space-y-1 w-full">
            {navItems.map((item) => {
              const isActive = activeTab === item.id || (!activeTab && item.id === 'pipelines');
              return (
                <button
                  key={item.id}
                  onClick={() => onChangeTab && onChangeTab(item.id)}
                  className={`w-10 group-hover/main-sidebar:w-full py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center group-hover/main-sidebar:justify-start space-x-0 group-hover/main-sidebar:space-x-3 group-hover/main-sidebar:px-3 relative overflow-hidden ${
                    isActive
                      ? 'bg-zinc-950 dark:bg-[#1c1c1c] text-white border border-zinc-800 dark:border-[#262626] shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-[#262626]/50'
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

        {/* Bottom: API indicator + Theme toggle */}
        <div className="w-56 flex flex-col space-y-3 px-3 pb-4">

          {/* API Health Dot */}
          <div className="flex items-center space-x-3 w-full px-1.5">
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

          {/* Divider */}
          <div className="w-full h-[1px] bg-zinc-200 dark:bg-[#262626]" />

          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            className="w-10 group-hover/main-sidebar:w-full py-2.5 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-[#262626]/50 transition-all duration-200 flex items-center justify-center group-hover/main-sidebar:justify-start space-x-0 group-hover/main-sidebar:space-x-3 group-hover/main-sidebar:px-3"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <div className="shrink-0">
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </div>
            <span className="hidden group-hover/main-sidebar:inline text-[10px] font-mono uppercase tracking-wider font-bold whitespace-nowrap transition-all duration-200">
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
        </div>
      </nav>

      {/* ===== CARD 2: Main Content Container ===== */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden
                      bg-white dark:bg-[#141414] border border-zinc-200 dark:border-[#262626] rounded-2xl shadow-lg">

        {/* Top Header Bar */}
        <header className="px-6 py-3.5 flex items-center justify-between bg-white dark:bg-[#141414] border-b border-zinc-200/80 dark:border-[#262626] shrink-0 rounded-t-2xl transition-colors duration-200">
          <div>
            <h1 className="text-sm font-bold font-sans tracking-tight text-zinc-950 dark:text-white flex items-center gap-1.5 uppercase">
              VibeCheck CI/CD{' '}
              <span className="text-[9px] px-1.5 py-0.5 bg-zinc-100 dark:bg-[#1c1c1c] text-zinc-500 dark:text-zinc-400 rounded font-mono border border-zinc-200 dark:border-[#262626] transition-colors duration-200">
                PLAYGROUND
              </span>
            </h1>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono tracking-tight transition-colors duration-200">
              Sandbox-first AI diagnostics and protected pipeline promotion
            </p>
          </div>

          {/* Health States */}
          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="text-zinc-400 dark:text-zinc-500 transition-colors duration-200">
              Uptime: <span className="text-zinc-800 dark:text-zinc-200 font-bold transition-colors duration-200">98.4%</span>
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <span className="text-zinc-400 dark:text-zinc-500 transition-colors duration-200">
              Repaired: <span className="text-zinc-800 dark:text-zinc-200 font-bold transition-colors duration-200">100%</span>
            </span>
          </div>
        </header>

        {/* Content Area — tab views render here */}
        <div className="flex-1 flex overflow-hidden w-full h-full bg-white dark:bg-[#090909] rounded-b-2xl">
          {children}
        </div>
      </div>

    </div>
  );
}
