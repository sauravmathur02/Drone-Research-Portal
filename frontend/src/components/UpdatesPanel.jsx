import React, { useMemo, useState } from 'react';
import { Bell, Filter, X } from 'lucide-react';

const severityStyles = {
  High: 'text-danger border-danger bg-danger/10',
  Medium: 'text-warning border-warning bg-warning/10',
  Low: 'text-success border-success bg-success/10',
};

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

const DEFAULT_COUNTRIES = ['GLOBAL', 'IND', 'USA', 'CHN', 'RUS', 'UKR', 'ISR', 'IRN'];

export default function UpdatesPanel({ open, updates, onClose, onClearAll }) {
  const [severityFilter, setSeverityFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');

  const countryOptions = useMemo(
    () => {
      const dynamicCountries = updates.map((update) => update.country).filter(Boolean);
      return Array.from(new Set([...DEFAULT_COUNTRIES, ...dynamicCountries])).sort();
    },
    [updates]
  );

  const filteredUpdates = useMemo(
    () =>
      updates.filter((update) => {
        const severityMatches = severityFilter === 'All' || update.severity === severityFilter;
        const countryMatches = countryFilter === 'All' || update.country === countryFilter;
        return severityMatches && countryMatches;
      }),
    [updates, severityFilter, countryFilter]
  );

  return (
    <>
      {open ? <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose}></div> : null}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-dark/95 backdrop-blur-xl border-l border-border z-[70] transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <div className="font-heading text-xl flex items-center gap-3">
                <Bell className="text-neon" size={18} />
                Global Updates
              </div>
              <div className="font-data text-xs text-textMuted uppercase tracking-[0.2em] mt-2">
                Live Drone Intelligence Feed
              </div>
            </div>
            <div className="flex items-center gap-2">
              {updates.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="px-3 h-10 rounded border border-danger/30 text-danger hover:bg-danger/10 hover:border-danger transition-all font-data text-xs uppercase tracking-wider"
                >
                  Clear All
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded border border-white/10 flex items-center justify-center text-textMuted hover:text-white hover:border-border transition-all"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="p-6 border-b border-white/5 flex gap-3">
            <div className="flex-1">
              <label className="flex flex-col gap-2 text-sm">
                <span className="text-textMuted font-heading text-[11px] uppercase tracking-widest flex items-center gap-2">
                  <Filter size={12} />
                  Severity
                </span>
                <select
                  value={severityFilter}
                  onChange={(event) => setSeverityFilter(event.target.value)}
                  className="bg-black/40 border border-white/10 p-3 rounded font-data text-white focus:border-neon outline-none"
                >
                  <option value="All">All</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </label>
            </div>
            <div className="flex-1">
              <label className="flex flex-col gap-2 text-sm">
                <span className="text-textMuted font-heading text-[11px] uppercase tracking-widest">Country</span>
                <select
                  value={countryFilter}
                  onChange={(event) => setCountryFilter(event.target.value)}
                  className="bg-black/40 border border-white/10 p-3 rounded font-data text-white focus:border-neon outline-none"
                >
                  <option value="All">All</option>
                  {countryOptions.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
            {filteredUpdates.map((update) => (
              <article key={update._id} className="glass-card hover:translate-y-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {update.link ? (
                      <a
                        href={update.link}
                        target="_blank"
                        rel="noreferrer"
                        className="font-heading text-base leading-snug hover:text-neon transition-colors"
                      >
                        {update.title}
                      </a>
                    ) : (
                      <h3 className="font-heading text-base leading-snug">{update.title}</h3>
                    )}
                    <div className="font-data text-[11px] text-textMuted uppercase tracking-widest mt-2">
                      {update.country || 'GLOBAL'} - {update.category || 'General'} - {update.source}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded border text-xs font-data uppercase ${severityStyles[update.severity] || severityStyles.Low}`}>
                    {update.severity}
                  </span>
                </div>

                <div className="font-data text-xs text-textMuted mt-3">
                  {formatTimestamp(update.timestamp)}
                </div>

                <p className="mt-4 text-sm text-white/80 leading-relaxed font-body">
                  {update.summary}
                </p>
              </article>
            ))}

            {filteredUpdates.length === 0 ? (
              <div className="glass-card text-center text-textMuted font-data">
                No updates match the active filters.
              </div>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  );
}
