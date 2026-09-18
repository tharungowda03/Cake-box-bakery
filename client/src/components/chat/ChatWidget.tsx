import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User, Cake } from 'lucide-react';
import { chatService, type ChatMessage } from '../../services/apiService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ---------------------------------------------------------------------------
// ChatWidget
// ---------------------------------------------------------------------------

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hi! 👋 I\'m the Cake Box assistant. I can help you find products, answer questions about our menu, delivery, or store. What can I help you with?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to newest message
  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setError(null);

    // Optimistically add user message
    const userMsg: UIMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Build history (exclude welcome message, convert to API format)
      const history: ChatMessage[] = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          content: m.content,
        }));

      const reply = await chatService.sendMessage(text, history);

      const botMsg: UIMessage = {
        id: `b-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  // Format bot content: convert **bold** and newlines
  const formatContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={i}>
          {parts.map((part, j) =>
            part.startsWith('**') && part.endsWith('**') ? (
              <strong key={j}>{part.slice(2, -2)}</strong>
            ) : (
              part
            )
          )}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <>
      {/* Floating bubble */}
      <button
        id="chat-widget-bubble"
        onClick={() => setIsOpen(v => !v)}
        aria-label={isOpen ? 'Close chat' : 'Open chat assistant'}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-amber-700 text-white shadow-2xl flex items-center justify-center hover:bg-amber-800 transition-all duration-200 active:scale-95"
        style={{ boxShadow: '0 8px 32px rgba(146,64,14,0.35)' }}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
        {/* Unread indicator — show if closed and there was a reply */}
        {!isOpen && messages.length > 1 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Chat panel */}
      <div
        id="chat-widget-panel"
        className={`fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[70vh] flex flex-col rounded-2xl shadow-2xl bg-white border border-amber-100 overflow-hidden transition-all duration-300 ${
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-700 text-white shrink-0">
          <div className="w-9 h-9 rounded-full bg-amber-600 flex items-center justify-center">
            <Cake className="w-5 h-5 text-amber-100" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-tight">Cake Box Assistant</p>
            <p className="text-[11px] text-amber-200 leading-tight">Kakinada's bakery helper</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg hover:bg-amber-600 transition-colors"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-[#fdf8f4]">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white mt-0.5 ${
                  msg.role === 'assistant' ? 'bg-amber-700' : 'bg-stone-400'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <Bot className="w-3.5 h-3.5" />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'assistant'
                    ? 'bg-white border border-amber-100 text-stone-800 shadow-sm rounded-tl-none'
                    : 'bg-amber-700 text-white rounded-tr-none'
                }`}
              >
                {formatContent(msg.content)}
                <p
                  className={`text-[10px] mt-1 ${
                    msg.role === 'assistant' ? 'text-stone-400' : 'text-amber-200'
                  }`}
                >
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-2 items-center">
              <div className="w-7 h-7 rounded-full bg-amber-700 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-white border border-amber-100 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2 border border-red-100">
              {error}
            </p>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Suggested prompts (shown when only welcome message) */}
        {messages.length === 1 && !loading && (
          <div className="px-3 pb-2 flex flex-wrap gap-1.5 bg-[#fdf8f4]">
            {[
              'What cakes do you have?',
              'What are your hours?',
              'How does delivery work?',
              'Custom cake enquiry',
            ].map(prompt => (
              <button
                key={prompt}
                onClick={() => {
                  setInput(prompt);
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className="text-xs px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-3 py-3 bg-white border-t border-amber-50 flex gap-2 shrink-0">
          <input
            ref={inputRef}
            id="chat-input"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything…"
            maxLength={500}
            disabled={loading}
            className="flex-1 text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-300 disabled:opacity-50 placeholder:text-stone-400"
          />
          <button
            id="chat-send-btn"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="p-2.5 rounded-xl bg-amber-700 text-white hover:bg-amber-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-95"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </>
  );
};
