import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

export const triggerRefreshBlink = (message: string = 'Data refreshed') => {
  window.dispatchEvent(
    new CustomEvent('crm:refresh-blink', {
      detail: { message, timestamp: Date.now() },
    })
  );
};

export const RefreshFeedbackOverlay: React.FC = () => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [message, setMessage] = useState('Data refreshed');
  const [blinkKey, setBlinkKey] = useState(0);

  const handleRefreshTrigger = useCallback((customMsg?: string) => {
    setMessage(customMsg || 'Data refreshed');
    setIsBlinking(true);
    setShowBadge(true);
    setBlinkKey((prev) => prev + 1);

    // Apply instantaneous screen blink pulse to the entire page body
    document.body.classList.remove('screen-refreshing');
    // Trigger reflow to restart CSS animation if clicked in rapid succession
    void document.body.offsetWidth;
    document.body.classList.add('screen-refreshing');

    // End the screen blink after 450ms
    const blinkTimer = setTimeout(() => {
      setIsBlinking(false);
      document.body.classList.remove('screen-refreshing');
    }, 450);

    // Hide the top notification badge after 1200ms
    const badgeTimer = setTimeout(() => {
      setShowBadge(false);
    }, 1200);

    return () => {
      clearTimeout(blinkTimer);
      clearTimeout(badgeTimer);
      document.body.classList.remove('screen-refreshing');
    };
  }, []);

  useEffect(() => {
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string }>;
      handleRefreshTrigger(customEvent.detail?.message);
    };

    // Auto-detect clicks on any Refresh button across all pages
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const refreshBtn = target.closest('button, [role="button"], a');
      if (!refreshBtn) return;

      const btnText = (refreshBtn.textContent || '').trim().toLowerCase();
      const btnTitle = (refreshBtn.getAttribute('title') || '').toLowerCase();
      const btnAria = (refreshBtn.getAttribute('aria-label') || '').toLowerCase();
      const hasRefreshSvg = refreshBtn.querySelector('svg.lucide-refresh-cw, svg.lucide-rotate-ccw, svg.lucide-refresh-ccw');
      const isRefreshClass = refreshBtn.classList.contains('refresh-btn') || refreshBtn.classList.contains('btn-refresh');

      const isRefreshButton =
        isRefreshClass ||
        hasRefreshSvg !== null ||
        btnText.includes('refresh') ||
        btnTitle.includes('refresh') ||
        btnAria.includes('refresh');

      if (isRefreshButton) {
        handleRefreshTrigger(btnTitle || 'Data refreshed');
      }
    };

    window.addEventListener('crm:refresh-blink', handleCustomEvent);
    document.addEventListener('click', handleGlobalClick, true);

    return () => {
      window.removeEventListener('crm:refresh-blink', handleCustomEvent);
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, [handleRefreshTrigger]);

  return (
    <>
      {/* 1. Full Screen Ambient Refresh Blink / Flash Effect */}
      {isBlinking && (
        <div
          key={`screen-blink-${blinkKey}`}
          className="fixed inset-0 z-[99999] pointer-events-none transition-all duration-300 animate-refresh-blink bg-gradient-to-br from-indigo-500/20 via-sky-400/20 to-purple-500/20"
        />
      )}

      {/* 2. Top-Edge High-Speed Shimmer Gleam Line */}
      {isBlinking && (
        <div
          key={`shimmer-line-${blinkKey}`}
          className="fixed top-0 left-0 right-0 h-1 z-[100000] pointer-events-none overflow-hidden bg-indigo-500/30"
        >
          <div className="w-full h-full bg-gradient-to-r from-transparent via-cyan-300 to-indigo-400 animate-refresh-gleam shadow-[0_0_12px_rgba(56,189,248,0.9)]" />
        </div>
      )}

      {/* 3. Floating Pill Notification Badge for Visual Confirmation */}
      {showBadge && (
        <div
          key={`badge-${blinkKey}`}
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[100000] pointer-events-none transition-all duration-300 ease-out transform animate-bounce"
        >
          <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-indigo-500/50 text-indigo-200 text-xs font-medium shadow-[0_0_20px_rgba(99,102,241,0.4)] backdrop-blur-md">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>{message}</span>
            <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
          </div>
        </div>
      )}
    </>
  );
};
