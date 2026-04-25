import React, { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { ArrowRight, Loader2, LockKeyhole, LogIn, Search, Send, ShieldCheck, UserPlus } from 'lucide-react';

// Lazy-load the 3D background so it doesn't block the initial UI paint
const DroneBackground3D = lazy(() => import('../components/DroneBackground3D'));
import {
  askAiQuery,
  clearUserToken,
  getHistory,
  getUserSession,
  getUserToken,
  setUserToken,
  signInUser,
  signUpUser,
} from '../services/api';

const FREE_QUERY_LIMIT = 2;
const QUERY_COUNT_KEY = 'dronescope_ai_query_count';
const fallbackSuggestions = [
  'Compare India vs China drones',
  'Show counter systems for swarm drones',
];

function getStoredQueryCount() {
  if (typeof window === 'undefined') {
    return 0;
  }

  return Number(window.sessionStorage.getItem(QUERY_COUNT_KEY) || 0);
}

function TypingAnswer({ text }) {
  const [visibleText, setVisibleText] = useState('');

  useEffect(() => {
    let index = 0;
    const timer = window.setInterval(() => {
      index += 3;
      setVisibleText(text.slice(0, index));

      if (index >= text.length) {
        window.clearInterval(timer);
      }
    }, 14);

    return () => {
      window.clearInterval(timer);
    };
  }, [text]);

  return (
    <p className="text-sm md:text-base leading-relaxed text-white/90">
      {visibleText}
      {visibleText.length < text.length ? <span className="text-neon animate-pulse">|</span> : null}
    </p>
  );
}

function AuthModal({ initialMode, onClose, onAuthenticated }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSignup = mode === 'signup';

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = isSignup
        ? await signUpUser(form)
        : await signInUser({ email: form.email, password: form.password });

      setUserToken(response.token);
      onAuthenticated(response.user);
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.error ||
        error?.message ||
        'Authentication failed. Check your details and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#09090b] p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white">
            <LockKeyhole size={20} />
          </div>
          <div>
            <h2 className="font-heading text-xl font-medium tracking-tight text-white">
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="mt-1 text-sm text-textMuted">Sign in to continue to intelligence portal</p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-1.5">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 font-medium text-sm transition-all ${!isSignup ? 'bg-white/10 text-white shadow-sm' : 'text-textMuted hover:text-white'
              }`}
          >
            <LogIn size={15} />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 font-medium text-sm transition-all ${isSignup ? 'bg-white/10 text-white shadow-sm' : 'text-textMuted hover:text-white'
              }`}
          >
            <UserPlus size={15} />
            Sign Up
          </button>
        </div>

        {errorMessage ? (
          <div className="mb-4 rounded border border-danger/40 bg-danger/10 px-3 py-2 font-data text-xs text-danger">
            {errorMessage}
          </div>
        ) : null}

        <form className="grid gap-3" onSubmit={handleSubmit}>
          {isSignup ? (
            <label className="grid gap-2">
              <span className="font-heading text-[11px] uppercase tracking-widest text-textMuted">Name</span>
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="rounded border border-white/10 bg-black/45 px-3 py-3 font-data text-sm text-white outline-none transition-all focus:border-neon"
                placeholder="Analyst name"
                required
              />
            </label>
          ) : null}

          <label className="grid gap-2">
            <span className="font-heading text-[11px] uppercase tracking-widest text-textMuted">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className="rounded border border-white/10 bg-black/45 px-3 py-3 font-data text-sm text-white outline-none transition-all focus:border-neon"
              placeholder="analyst@example.com"
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="font-heading text-[11px] uppercase tracking-widest text-textMuted">Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              className="rounded border border-white/10 bg-black/45 px-3 py-3 font-data text-sm text-white outline-none transition-all focus:border-neon"
              placeholder="Minimum 8 characters"
              minLength={8}
              required
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`mt-4 flex items-center justify-center gap-2 rounded-lg border px-4 py-3 font-medium text-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 border-white text-dark bg-white hover:bg-white/90`}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={15} /> : isSignup ? <UserPlus size={15} /> : <LogIn size={15} />}
            {isSubmitting ? 'Authenticating...' : isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded border border-white/10 px-4 py-2 font-data text-xs text-textMuted transition-all hover:border-white/25 hover:text-white"
        >
          Return to search
        </button>
      </div>
    </div>
  );
}

export default function AIHome({ onOpenDashboard }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [previousQuery, setPreviousQuery] = useState('');
  const [suggestions, setSuggestions] = useState(fallbackSuggestions);
  const [isLoading, setIsLoading] = useState(false);
  const [queryCount, setQueryCount] = useState(getStoredQueryCount);
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(() => Boolean(getUserToken()));
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');

  const remainingQueries = useMemo(
    () => Math.max(FREE_QUERY_LIMIT - queryCount, 0),
    [queryCount]
  );

  const isSignedIn = Boolean(currentUser);
  const canAskQuestion = isSignedIn || queryCount < FREE_QUERY_LIMIT;

  useEffect(() => {
    const token = getUserToken();

    if (!token) {
      return undefined;
    }

    let isActive = true;

    getUserSession()
      .then((response) => {
        if (isActive) {
          setCurrentUser(response.user);
          return getHistory();
        }
      })
      .then((history) => {
        if (isActive && history) {
          const loadedMessages = history.flatMap((item) => [
            { id: `user-hist-${item._id}`, role: 'user', text: item.question },
            { id: `ai-hist-${item._id}`, role: 'ai', answer: item.answer, confidence: 'Historical', source: 'Database History' }
          ]);
          setMessages(loadedMessages);
        }
      })
      .catch((error) => {
        console.error('Session or history retrieval failed', error);
        clearUserToken();
      })
      .finally(() => {
        if (isActive) {
          setAuthChecking(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  function storeQueryCount(nextCount) {
    setQueryCount(nextCount);

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(QUERY_COUNT_KEY, String(nextCount));
    }
  }

  function openAuthModal(mode = 'signin') {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  }

  function handleAuthenticated(user) {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    storeQueryCount(0);

    getHistory().then((history) => {
      const loadedMessages = history.flatMap((item) => [
        { id: `user-hist-${item._id}`, role: 'user', text: item.question },
        { id: `ai-hist-${item._id}`, role: 'ai', answer: item.answer, confidence: 'Historical', source: 'Database History' }
      ]);
      setMessages(loadedMessages);
    }).catch(console.error);
  }

  function handleSignOut() {
    clearUserToken();
    setCurrentUser(null);
  }

  async function submitQuery(nextQuery = query) {
    const trimmedQuery = nextQuery.trim();

    if (!trimmedQuery || isLoading) {
      return;
    }

    if (!canAskQuestion) {
      openAuthModal('signin');
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmedQuery,
    };

    setMessages((current) => [...current, userMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      const response = await askAiQuery({
        query: trimmedQuery,
        previousQuery,
      });
      const aiMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        answer: response.answer,
        confidence: response.confidence,
        source: response.source,
      };

      setMessages((current) => [...current, aiMessage]);
      setPreviousQuery(trimmedQuery);
      setSuggestions(response.suggestions?.length ? response.suggestions : fallbackSuggestions);

      if (!isSignedIn) {
        storeQueryCount(queryCount + 1);
      }
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `ai-error-${Date.now()}`,
          role: 'ai',
          answer: error?.response?.data?.error || 'The intelligence engine could not complete the request. Verify the backend API is online and try again.',
          confidence: 'Low',
          source: 'System diagnostics',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    submitQuery();
  }

  return (
    <div className="ai-home relative min-h-screen overflow-hidden bg-dark text-textMain">
      {/* 3D Drone Background — cinematic ambient layer */}
      <Suspense fallback={null}>
        <DroneBackground3D />
      </Suspense>

      <div className="ai-map-visual" aria-hidden="true">
        <div className="ai-continent ai-continent-na" />
        <div className="ai-continent ai-continent-sa" />
        <div className="ai-continent ai-continent-eu" />
        <div className="ai-continent ai-continent-af" />
        <div className="ai-continent ai-continent-as" />
        <div className="ai-continent ai-continent-au" />
        <div className="ai-scan-line" />
        <div className="ai-route ai-route-one" />
        <div className="ai-route ai-route-two" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <button
          type="button"
          onClick={onOpenDashboard}
          className="flex items-center gap-3 rounded border border-neon/25 bg-black/30 px-4 py-2 font-heading text-sm text-neon backdrop-blur transition-all hover:border-neon hover:bg-neon/10"
        >
          <ShieldCheck size={18} />
          DroneScope AI
        </button>
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="hidden items-center gap-3 rounded border border-success/25 bg-success/5 px-3 py-2 font-data text-xs text-success md:flex">
              <span>{currentUser.name}</span>
              <button type="button" onClick={handleSignOut} className="text-textMuted transition-colors hover:text-white">
                Sign out
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <button
                type="button"
                onClick={() => openAuthModal('signin')}
                className="rounded border border-neon/30 bg-neon/5 px-4 py-2 font-heading text-xs uppercase tracking-widest text-neon transition-all hover:bg-neon hover:text-dark"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => openAuthModal('signup')}
                className="rounded border border-warning/30 bg-warning/5 px-4 py-2 font-heading text-xs uppercase tracking-widest text-warning transition-all hover:bg-warning hover:text-dark"
              >
                Sign Up
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={onOpenDashboard}
            className="flex items-center gap-2 rounded border border-white/10 bg-white/5 px-4 py-2 font-heading text-xs uppercase tracking-widest text-textMuted transition-all hover:border-neon hover:text-neon"
          >
            Command Center
            <ArrowRight size={15} />
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-6xl flex-col items-center px-6 pb-12 pt-12 md:pt-20">
        <section className="w-full max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 font-medium text-xs text-white backdrop-blur-md">
            <Search size={14} className="text-white/70" />
            Real-time intelligence
          </div>
          <h1 className="font-heading text-5xl font-semibold tracking-tight text-white md:text-7xl">
            DroneScope AI
          </h1>
          <p className="mt-6 text-lg text-textMuted md:text-xl font-light max-w-2xl mx-auto">
            Real-time insights and tactical intelligence powered by enterprise AI.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-10 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2 shadow-xl backdrop-blur-glass transition-all focus-within:border-white/30 focus-within:bg-white/[0.05]"
          >
            <Search className="ml-4 hidden text-textMuted md:block" size={20} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ask anything about global drone systems..."
              className="min-w-0 flex-1 bg-transparent px-3 py-3 font-body text-base text-white outline-none placeholder:text-white/30"
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-dark transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => submitQuery(suggestion)}
                className="rounded border border-white/10 bg-white/[0.04] px-4 py-2 font-data text-xs text-textMuted transition-all hover:border-neon hover:text-neon"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {isSignedIn ? (
            <div className="mt-4 font-data text-xs text-success">
              Analyst access active for {currentUser.name}
            </div>
          ) : (
            <div className="mt-4 font-data text-xs text-textMuted">
              {authChecking
                ? 'Verifying analyst session...'
                : remainingQueries > 0
                  ? `${remainingQueries} free AI queries remaining`
                  : 'Free query limit reached'}
            </div>
          )}
        </section>

        <section className="mt-12 grid w-full max-w-4xl gap-6">
          {messages.map((message) =>
            message.role === 'user' ? (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-2xl rounded-2xl border border-white/10 bg-white/10 px-6 py-4 text-left font-body text-[15px] text-white backdrop-blur-sm">
                  {message.text}
                </div>
              </div>
            ) : (
              <div key={message.id} className="rounded-2xl border border-white/5 bg-[#0a0a0a]/80 p-6 text-left shadow-sm backdrop-blur-xl">
                <div className="mb-4 flex items-center gap-2 font-medium text-xs uppercase tracking-wider text-white/50">
                  <ShieldCheck size={16} />
                  AI Intelligence Response
                </div>
                <TypingAnswer text={message.answer} />
                <div className="mt-5 grid gap-3 border-t border-white/10 pt-4 font-data text-xs text-textMuted md:grid-cols-2">
                  <div>
                    <span className="text-white">Confidence:</span> {message.confidence}
                  </div>
                  <div>
                    <span className="text-white">Source:</span> {message.source}
                  </div>
                </div>
              </div>
            )
          )}

          {isLoading ? (
            <div className="rounded-lg border border-white/10 bg-[#07101f]/80 p-5 text-left backdrop-blur-glass">
              <div className="flex items-center gap-3 font-data text-sm text-textMuted">
                <Loader2 className="animate-spin text-neon" size={18} />
                Analyzing database signals...
              </div>
            </div>
          ) : null}
        </section>
      </main>

      {isAuthModalOpen ? (
        <AuthModal
          initialMode={authMode}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthenticated={handleAuthenticated}
        />
      ) : null}
    </div>
  );
}
