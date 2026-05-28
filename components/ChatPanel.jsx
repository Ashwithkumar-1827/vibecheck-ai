import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Loader2, X, Bot, User } from 'lucide-react';

/**
 * ChatPanel — A collapsible chat interface for conversing with VibeCheck AI
 * about a specific build's failure and proposed fix.
 *
 * Props:
 *  - buildId: string — the build ID to scope the chat to
 *  - isOpen: boolean — whether the chat panel is visible
 *  - onClose: () => void — callback to close the panel
 */
export default function ChatPanel({ buildId, isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load existing chat history when panel opens
  useEffect(() => {
    if (isOpen && buildId && !isInitialized) {
      fetchChatHistory();
    }
  }, [isOpen, buildId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // Reset when buildId changes
  useEffect(() => {
    setMessages([]);
    setIsInitialized(false);
    setError('');
    setInput('');
  }, [buildId]);

  const fetchChatHistory = async () => {
    try {
      const res = await fetch(`/api/builds/${buildId}/chat`);
      const data = await res.json();
      if (data.history && data.history.length > 0) {
        setMessages(data.history.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp
        })));
      }
      setIsInitialized(true);
    } catch (err) {
      console.error('[ChatPanel] Failed to fetch history:', err);
      setIsInitialized(true);
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setError('');
    setInput('');

    // Add user message immediately for responsiveness
    const userMsg = {
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/builds/${buildId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to get AI response');
      }

      const data = await res.json();

      // Add AI response
      const aiMsg = {
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('[ChatPanel] Send error:', err);
      setError(err.message);
      // Remove the user message if we failed
      setMessages(prev => prev.slice(0, -1));
      setInput(trimmed); // Restore input
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * Renders markdown-like formatting for AI messages.
   * Supports: **bold**, `code`, ```code blocks```, and line breaks.
   */
  const renderContent = (text) => {
    if (!text) return null;

    // Process code blocks first
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, i) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const codeContent = part.slice(3, -3);
        const firstNewline = codeContent.indexOf('\n');
        const code = firstNewline > -1 ? codeContent.slice(firstNewline + 1) : codeContent;
        return (
          <pre key={i} className="bg-zinc-900 dark:bg-zinc-950 border border-zinc-800 rounded-lg p-3 my-2 overflow-x-auto text-[11px] font-mono text-zinc-300 leading-relaxed">
            <code>{code}</code>
          </pre>
        );
      }

      // Process inline formatting
      return (
        <span key={i} dangerouslySetInnerHTML={{
          __html: part
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-zinc-100 font-semibold">$1</strong>')
            .replace(/`(.*?)`/g, '<code class="bg-zinc-800 dark:bg-zinc-900 text-amber-400 px-1 py-0.5 rounded font-mono text-[10.5px] border border-zinc-700">$1</code>')
            .replace(/\n/g, '<br />')
        }} />
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-lg" style={{ maxHeight: '520px' }}>
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-md">
            <MessageSquare className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <h4 className="text-[11px] font-bold font-mono uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Chat with VibeCheck AI
            </h4>
            <p className="text-[9px] text-zinc-500 dark:text-zinc-500 uppercase tracking-widest">
              Build #{buildId} Diagnostic Context
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
          title="Close chat"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[180px] max-h-[340px] scrollbar-thin">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-8 space-y-2">
            <Bot className="h-6 w-6 text-zinc-400 dark:text-zinc-600 mx-auto" />
            <p className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Ask any question about this issue
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center pt-2">
              {[
                "What caused this failure?",
                "Is the proposed fix safe?",
                "What are the risks?"
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                  className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start space-x-2.5 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className={`shrink-0 p-1.5 rounded-md mt-0.5 ${
              msg.role === 'user'
                ? 'bg-zinc-200 dark:bg-zinc-800'
                : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800'
            }`}>
              {msg.role === 'user'
                ? <User className="h-3 w-3 text-zinc-600 dark:text-zinc-400" />
                : <Bot className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
              }
            </div>

            {/* Message Bubble */}
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-[12px] leading-relaxed ${
              msg.role === 'user'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-sans'
                : 'bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-sans'
            }`}>
              {msg.role === 'user'
                ? <span>{msg.content}</span>
                : <div className="prose-sm">{renderContent(msg.content)}</div>
              }
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start space-x-2.5">
            <div className="shrink-0 p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <Bot className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-3 w-3 text-zinc-400 animate-spin" />
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Analyzing...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg px-3 py-2 text-[11px] text-red-600 dark:text-red-400 font-mono">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 shrink-0">
        <div className="flex items-end space-x-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this issue..."
            rows={1}
            className="flex-1 resize-none bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-[12px] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 font-sans focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-all"
            style={{ minHeight: '36px', maxHeight: '80px' }}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="shrink-0 p-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.96]"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
