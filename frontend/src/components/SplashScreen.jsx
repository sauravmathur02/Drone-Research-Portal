import React from 'react';
import { Activity, Radar } from 'lucide-react';

export default function SplashScreen({ onEnter }) {
  return (
    <div className="min-h-screen bg-dark text-textMain relative overflow-hidden flex items-center justify-center px-6">
      <div className="absolute inset-0 intro-grid opacity-50"></div>
      <div className="absolute inset-0 intro-pulse"></div>
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-neon/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-danger/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 max-w-3xl w-full glass-card intro-panel text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border border-neon/50 bg-neon/10 flex items-center justify-center shadow-[0_0_30px_rgba(0,243,255,0.18)]">
              <Activity className="text-neon" size={36} />
            </div>
            <Radar className="text-neon absolute -top-4 -right-4 animate-pulse" size={26} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="font-data text-xs uppercase tracking-[0.45em] text-neon/80">
            DroneScope AI Command Entry
          </div>
          <h1 className="font-heading text-4xl md:text-5xl tracking-wider">
            Real-Time Drone Intelligence Platform
          </h1>
          <p className="text-textMuted font-body text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Live monitoring, AI-generated alerts, strategic simulation, and counter-drone intelligence in a single tactical console.
          </p>
        </div>

        <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
          <button
            type="button"
            onClick={onEnter}
            className="px-8 py-4 rounded border border-neon bg-neon/10 text-neon font-heading tracking-[0.25em] uppercase hover:bg-neon hover:text-dark transition-all shadow-[0_0_20px_rgba(0,243,255,0.2)]"
          >
            Enter Command
          </button>
          <div className="font-data text-xs text-textMuted uppercase tracking-[0.3em]">
            Monitoring Live Tactical Feeds
          </div>
        </div>
      </div>
    </div>
  );
}
