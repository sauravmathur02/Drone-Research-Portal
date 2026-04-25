import React, { Suspense, useState } from 'react';
import { X, Loader2, Shield, Activity, Target, Zap, Radio, Crosshair, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const Counter3DViewer = React.lazy(() => import('./Counter3DViewer'));

const TYPE_COLORS = {
  Laser:       { text: 'text-neon',           border: 'border-neon',           glow: 'shadow-[0_0_20px_rgba(0,243,255,0.15)]',  bg: 'bg-neon/10'       },
  Jamming:     { text: 'text-warning',        border: 'border-warning',        glow: 'shadow-[0_0_20px_rgba(255,153,0,0.15)]',  bg: 'bg-warning/10'    },
  Interceptor: { text: 'text-[#b366ff]',      border: 'border-[#b366ff]',      glow: 'shadow-[0_0_20px_rgba(179,102,255,0.15)]',bg: 'bg-[#b366ff]/10'  },
  Missile:     { text: 'text-danger',         border: 'border-danger',         glow: 'shadow-[0_0_20px_rgba(255,51,102,0.15)]', bg: 'bg-danger/10'     },
  default:     { text: 'text-white',          border: 'border-white/30',       glow: '',                                        bg: 'bg-white/10'      },
};

function EffectivenessBar({ level }) {
  const pct = level === 'High' ? 100 : level === 'Medium' ? 60 : 30;
  const color = level === 'High' ? 'bg-success' : level === 'Medium' ? 'bg-warning' : 'bg-danger';
  return (
    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${color} shadow-[0_0_6px_currentColor]`}
        style={{ width: `${pct}%`, transition: 'width 1s ease' }}
      />
    </div>
  );
}

export default function Counter3DModal({ system, onClose }) {
  const [dataMode, setDataMode] = useState(false);

  if (!system) return null;

  const tc = TYPE_COLORS[system.type] || TYPE_COLORS.default;

  const getTypeIcon = () => {
    switch (system.type) {
      case 'Laser':       return <Zap size={14} />;
      case 'Jamming':     return <Radio size={14} />;
      case 'Interceptor': return <Crosshair size={14} />;
      case 'Missile':     return <Target size={14} />;
      default:            return <Shield size={14} />;
    }
  };

  const handleExport = async () => {
    const element = document.getElementById('counter-modal-content');
    if (!element) return;
    const canvas = await html2canvas(element, { backgroundColor: '#030712', useCORS: true, scale: 2 });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    const imgH = (canvas.height * pdfW) / canvas.width;
    pdf.setFillColor(5, 9, 20);
    pdf.rect(0, 0, pdfW, 12, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(0, 243, 255);
    pdf.text('DRONESCOPE AI — DEFENSE SYSTEM REPORT', 6, 8);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(140, 160, 180);
    pdf.text(`Generated: ${new Date().toLocaleString()}   |   System: ${system.name}`, pdfW - 6, 8, { align: 'right' });
    pdf.addImage(imgData, 'JPEG', 0, 12, pdfW, Math.min(imgH, pdfH - 20));
    pdf.setFillColor(5, 9, 20);
    pdf.rect(0, pdfH - 8, pdfW, 8, 'F');
    pdf.setFontSize(6);
    pdf.setTextColor(100, 120, 140);
    pdf.text('UNCLASSIFIED // FOR OFFICIAL USE ONLY', pdfW / 2, pdfH - 3, { align: 'center' });
    pdf.save(`counter-report-${system.name}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div
        id="counter-modal-content"
        className={`w-[90vw] h-[90vh] rounded-xl border ${tc.border}/30 bg-[#030712] relative overflow-hidden flex flex-col ${tc.glow}`}
      >

        {/* ── TOP LEFT: System Header ── */}
        <div className="absolute top-0 left-0 p-6 z-10 pointer-events-none flex items-start gap-5">
          {system.photo_url && (
            <div className={`h-20 w-20 md:h-24 md:w-24 rounded-lg overflow-hidden border ${tc.border}/30 shrink-0 bg-black/50 backdrop-blur-md shadow-lg`}>
              <img
                src={system.photo_url}
                alt={system.name}
                loading="lazy"
                onError={(e) => { e.target.onerror = null; e.target.src = '/counter/default.jpg'; }}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div>
            <h2 className="font-heading text-3xl text-white drop-shadow-lg">{system.name}</h2>
            <div className={`flex items-center gap-3 mt-2 font-data text-sm ${tc.text} drop-shadow-md`}>
              <span className={`${tc.bg} border ${tc.border}/30 px-2 py-0.5 rounded flex items-center gap-1.5`}>
                {getTypeIcon()} {system.type}
              </span>
              <span>-</span>
              <span className="uppercase tracking-widest">{system.effectiveness} Effectiveness</span>
              <span>-</span>
              <span className="text-white/80">{system.range_km} km Range</span>
            </div>
          </div>
        </div>

        {/* ── TOP CENTER: Mode Switch ── */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex bg-black/50 border border-white/10 rounded-full p-1 backdrop-blur-md">
          <button
            onClick={() => setDataMode(false)}
            className={`px-4 py-1.5 rounded-full font-data text-[11px] uppercase tracking-widest transition-all ${!dataMode ? `${tc.bg} ${tc.text} border ${tc.border}/50` : 'text-textMuted hover:text-white'}`}
          >
            Hologram
          </button>
          <button
            onClick={() => setDataMode(true)}
            className={`px-4 py-1.5 rounded-full font-data text-[11px] uppercase tracking-widest transition-all ${dataMode ? `${tc.bg} ${tc.text} border ${tc.border}/50` : 'text-textMuted hover:text-white'}`}
          >
            Intelligence
          </button>
        </div>

        {/* ── TOP RIGHT: Close ── */}
        <div className="absolute top-6 right-6 z-20 pointer-events-auto flex gap-3">
          <button onClick={handleExport} className={`flex items-center gap-1.5 px-3 py-2 ${tc.bg} border ${tc.border}/50 hover:bg-opacity-50 rounded text-white transition-colors text-[10px] uppercase font-heading tracking-widest backdrop-blur-sm`}>
            <Download size={14} /> Export
          </button>
          <button
            onClick={onClose}
            className="rounded bg-black/50 border border-white/10 p-2 text-white hover:text-danger hover:border-danger transition-colors backdrop-blur-sm"
            aria-label="Close Viewer"
          >
            <X size={24} />
          </button>
        </div>

        {/* ── 3D CANVAS ── */}
        <div className="flex-1 w-full bg-[#030712] relative z-0">
          <Suspense
            fallback={
              <div className="w-full h-full flex flex-col items-center justify-center font-data" style={{ color: 'var(--tw-color-warning, #ff9933)' }}>
                <Loader2 className="animate-spin mb-4 text-warning" size={40} />
                <span className="text-warning">INITIALIZING DEFENSE 3D ENGINE...</span>
              </div>
            }
          >
            <Counter3DViewer system={system} dataMode={dataMode} />
          </Suspense>
        </div>

        {/* ── BOTTOM LEFT: Intel Panel (Data Mode only) ── */}
        {dataMode && (
          <div className="absolute bottom-6 left-6 z-10 pointer-events-none flex gap-6 items-end animate-in slide-in-from-left-4 fade-in duration-500">
            {/* System Specs */}
            <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-5 w-64 shadow-2xl">
              <h3 className={`font-heading text-sm ${tc.text} mb-4 uppercase tracking-widest flex items-center gap-2`}>
                <Activity size={16} /> System Specs
              </h3>
              <div className="space-y-4 font-data">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-textMuted text-[10px] uppercase">Type</span>
                  <span className={`${tc.text} text-sm font-bold`}>{system.type}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-textMuted text-[10px] uppercase">Range</span>
                  <span className="text-white text-sm">{system.range_km} <span className="text-white/50 text-xs">km</span></span>
                </div>
                <div className="border-b border-white/5 pb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-textMuted text-[10px] uppercase">Effectiveness</span>
                    <span className={`text-sm font-bold ${system.effectiveness === 'High' ? 'text-success' : system.effectiveness === 'Medium' ? 'text-warning' : 'text-danger'}`}>
                      {system.effectiveness}
                    </span>
                  </div>
                  <EffectivenessBar level={system.effectiveness} />
                </div>
                <div>
                  <span className="text-textMuted text-[10px] uppercase block mb-2">Effective Against</span>
                  <div className="flex flex-wrap gap-1.5">
                    {system.effective_against?.map(tag => (
                      <span key={tag} className={`${tc.bg} border ${tc.border}/30 ${tc.text} text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-data`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tactical Notes */}
            <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-5 w-72 shadow-2xl">
              <h3 className={`font-heading text-sm ${tc.text} mb-4 uppercase tracking-widest flex items-center gap-2`}>
                <Shield size={16} /> Tactical Assessment
              </h3>
              <div className="space-y-3 font-data text-xs text-white/80 leading-relaxed">
                <p>{system.description}</p>
                <div className={`mt-4 p-3 rounded ${tc.bg} border ${tc.border}/20`}>
                  <div className={`text-[9px] uppercase tracking-widest ${tc.text} mb-1 font-heading`}>Defense Role</div>
                  <p className="text-white/70 text-[11px]">
                    {system.type === 'Laser'
                      ? 'High-energy directed weapon. Effective against low-altitude slow-moving targets with unlimited magazine depth.'
                      : system.type === 'Jamming'
                      ? 'Electronic warfare platform. Disrupts communication and navigation signals without kinetic engagement.'
                      : system.type === 'Missile'
                      ? 'Long-range kinetic intercept. Optimized for high-altitude and fast-moving platforms.'
                      : 'Net/interceptor system used for defeating threats in the terminal phase at close range.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── BOTTOM RIGHT: Action Buttons (Data Mode only) ── */}
        {dataMode && (
          <div className="absolute bottom-6 right-6 z-20 pointer-events-auto flex flex-col gap-3 animate-in slide-in-from-right-4 fade-in duration-500">
            <button
              onClick={onClose}
              className="flex items-center gap-4 w-52 bg-panel/80 hover:bg-danger/10 backdrop-blur-md border border-white/10 hover:border-danger/50 px-4 py-3 rounded transition-all text-left group"
            >
              <div className="flex items-center gap-3 text-sm font-heading text-danger group-hover:text-danger">
                <Activity size={16} /> Run vs Threat Sim
              </div>
            </button>
          </div>
        )}

        {/* ── BOTTOM CENTER: Helper ── */}
        {!dataMode && (
          <div className="absolute bottom-6 w-full text-center pointer-events-none z-10 animate-in fade-in duration-500">
            <span className="font-data text-xs tracking-widest uppercase text-textMuted bg-black/40 px-4 py-2 rounded-full border border-white/5 backdrop-blur-sm">
              Left Click: Rotate - Scroll: Zoom - Right Click: Pan
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
