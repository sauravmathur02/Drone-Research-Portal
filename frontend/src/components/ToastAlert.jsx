import React, { useEffect } from 'react';

export default function ToastAlert({ toast, onClose }) {
  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      onClose();
    }, 3200);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [toast, onClose]);

  if (!toast) {
    return null;
  }

  return (
    <div className="fixed top-6 right-6 z-[90] max-w-sm w-full glass-card border-danger/30 shadow-[0_0_25px_rgba(255,51,102,0.18)]">
      <div className="font-heading text-danger text-sm uppercase tracking-[0.2em]">
        New Drone Alert 🚨
      </div>
      <div className="mt-3 text-white font-semibold">
        {toast.title}
      </div>
      <div className="mt-2 text-textMuted text-sm font-body">
        {toast.message}
      </div>
    </div>
  );
}
