import React, { useState, useRef, useEffect } from 'react';
import { Brain, X, Loader2, Sparkles, Send, ChevronRight } from 'lucide-react';
import { askAiQuery } from '../services/api';

function TypewriterText({ text, onComplete }) {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Only split if text exists
    if (!text) return;
    
    // Typing logic
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, 12);
      return () => clearTimeout(timeout);
    } else {
      onComplete?.();
    }
  }, [index, text, onComplete]);

  return (
    <p className="font-data text-[12px] text-white/90 whitespace-pre-wrap leading-relaxed transition-all">
      {displayedText}
      {index < text.length && <span className="inline-block w-1.5 h-3 bg-[#00ffff] ml-1 animate-pulse shadow-[0_0_8px_#00ffff]"></span>}
    </p>
  );
}

function confidenceBar(confidence) {
  if (confidence == null || Number.isNaN(Number(confidence))) return null;
  const n = typeof confidence === 'number' ? confidence : parseFloat(confidence);
  const pct = n <= 1 ? Math.round(n * 100) : Math.round(n);
  const color = pct >= 70 ? 'bg-success' : pct >= 40 ? 'bg-warning' : 'bg-danger';
  return (
    <div className="mt-1">
      <div className="flex items-center justify-between mb-1">
        <span className="font-heading text-[9px] uppercase tracking-widest text-textMuted">Confidence</span>
        <span className="font-data text-[10px] text-white/80">{pct}%</span>
      </div>
      <div className="w-full h-1 bg-black/50 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
}

export default function SearchAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [previousQuery, setPreviousQuery] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading, isOpen]);

  async function handleSubmit(e) {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || loading) return;

    const userMsg = { id: `u-${Date.now()}`, role: 'user', content: text };
    setMessages((m) => [...m, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const data = await askAiQuery({ query: text, previousQuery });
      setPreviousQuery(text);

      const assistantMsg = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        isTyping: true, // Start in typing mode
        content: {
          analysis: data.analysis || data.answer || 'Analysis processing...',
          recommendation: data.recommendation || (data.details || []).join('\n') || '',
          confidence: data.confidence,
          suggestions: data.suggestions || [],
        },
      };
      setMessages((m) => [...m, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages((m) => [
        ...m,
        {
          id: `a-err-${Date.now()}`,
          role: 'assistant',
          content: {
            analysis: 'Connection to intelligence backend failed. Ensure the server is running on port 5000.',
            recommendation: 'Check: npm run dev in backend directory.',
            confidence: 0,
            suggestions: [],
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSuggestionClick(suggestion) {
    setInputValue(suggestion);
  }

  function handleTypeComplete(id) {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, isTyping: false } : m));
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-[1000] w-14 h-14 bg-neon rounded-full flex items-center justify-center text-black shadow-[0_0_20px_#00f3ff] hover:scale-110 hover:shadow-[0_0_30px_#00f3ff] transition-all duration-300 group"
      >
        <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
        <div className="absolute -top-1 -right-1 bg-danger text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-black animate-pulse">
          AI
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm bg-black/70 animate-in fade-in duration-200">
          <div className="w-full max-w-lg h-[min(680px,90vh)] flex flex-col rounded-xl border border-neon/25 bg-[#050a10] shadow-[0_0_60px_rgba(0,243,255,0.12)] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-neon/5 to-transparent">
              <div className="flex items-center gap-2">
                <Brain className="text-neon shrink-0" size={20} />
                <h2 className="font-heading text-xs uppercase tracking-widest text-white">DroneScope AI Intelligence</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-textMuted hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </header>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-3 py-4 space-y-4 custom-scrollbar bg-gradient-to-b from-[#050a10] to-[#070f18]"
            >
              {messages.length === 0 && !loading && (
                <div className="text-center text-textMuted text-xs font-data pt-6 px-4 space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-neon/10 border border-neon/30 flex items-center justify-center mb-3">
                    <Brain size={24} className="text-neon" />
                  </div>
                  <p className="font-heading text-sm text-white/60 uppercase tracking-wider">Defense Intelligence Assistant</p>
                  <p className="text-[11px] text-textMuted">Ask about drones, counter-systems, threats, or country capabilities. Supports follow-up questions.</p>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {['Best counter for MQ-9 Reaper', 'Which drone is hardest to detect?', 'Compare India vs China'].map(s => (
                      <button
                        key={s}
                        onClick={() => handleSuggestionClick(s)}
                        className="text-[10px] font-data bg-neon/10 border border-neon/20 text-neon px-3 py-1.5 rounded-full hover:bg-neon/20 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) =>
                msg.role === 'user' ? (
                  <div key={msg.id} className="flex justify-end animate-in slide-in-from-right-2 duration-200">
                    <div className="max-w-[88%] rounded-2xl rounded-br-md px-4 py-2.5 bg-neon/15 border border-neon/30 text-left">
                      <p className="font-data text-sm text-white whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  <div key={msg.id} className="flex justify-start animate-in slide-in-from-left-2 duration-300">
                    <div className="max-w-[95%] rounded-2xl rounded-bl-md px-4 py-3 border border-white/10 bg-[#0c1520] text-left space-y-3">
                      {/* Analysis */}
                      <div>
                        <p className="font-heading text-[9px] uppercase tracking-widest text-[#00ffff]/70 mb-1">Analysis</p>
                        {msg.isTyping ? (
                          <TypewriterText text={msg.content?.analysis} onComplete={() => handleTypeComplete(msg.id)} />
                        ) : (
                          <p className="font-data text-[12px] text-white/90 whitespace-pre-wrap leading-relaxed">
                            {msg.content?.analysis || '—'}
                          </p>
                        )}
                      </div>
                      
                      {/* Secondary Content: Only show after typing or if not typing */}
                      {!msg.isTyping && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 space-y-3">
                          {/* Recommendation */}
                          {msg.content?.recommendation && (
                            <div className="bg-[#00ffff]/5 border border-[#00ffff]/10 rounded-lg p-2.5 shadow-inner">
                              <p className="font-heading text-[9px] uppercase tracking-widest text-[#00ffff]/70 mb-1">Recommendation</p>
                              <p className="font-data text-[11px] text-[#00ffff]/90 whitespace-pre-wrap leading-relaxed italic">
                                {msg.content.recommendation}
                              </p>
                            </div>
                          )}
                          
                          {/* Confidence Bar */}
                          {confidenceBar(msg.content?.confidence)}

                          {/* Suggestions */}
                          {msg.content?.suggestions?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {msg.content.suggestions.map((s, i) => (
                                <button
                                  key={i}
                                  onClick={() => handleSuggestionClick(s)}
                                  className="text-[9px] font-data bg-white/5 border border-white/10 text-textMuted px-2 py-1 rounded-full hover:bg-[#00ffff]/10 hover:border-[#00ffff]/30 hover:text-[#00ffff] transition-all duration-300 flex items-center gap-1"
                                >
                                  <ChevronRight size={8} /> {s}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}

              {loading && (
                <div className="flex justify-start animate-in fade-in duration-300">
                  <div className="rounded-2xl rounded-bl-md px-4 py-3 border border-neon/20 bg-neon/5 flex items-center gap-3 text-neon font-data text-sm">
                    <Loader2 size={16} className="animate-spin shrink-0" />
                    <span className="animate-pulse">Analyzing intelligence data<span className="inline-block w-[2px] h-3 bg-neon ml-0.5 animate-[blink_1s_infinite]"></span></span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="shrink-0 p-3 border-t border-white/10 bg-black/60">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    rows={1}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    placeholder="Ask about any drone, counter-system, or threat…"
                    disabled={loading}
                    className="w-full resize-none max-h-28 bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 pr-10 text-sm font-data text-white outline-none focus:border-neon/50 placeholder:text-textMuted transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !inputValue.trim()}
                  className="shrink-0 h-10 w-10 rounded-xl border border-neon/40 bg-neon/10 text-neon flex items-center justify-center hover:bg-neon hover:text-black transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none"
                  aria-label="Send"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>
    </>
  );
}
