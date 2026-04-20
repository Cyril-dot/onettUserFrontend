// NotificationToast.tsx
// Drop-in styled in-app notification toasts for ONETT.
// Matches the homepage design system (Plus Jakarta Sans · Bricolage Grotesque · #F0EBE3 surface · #E6640A brand).
//
// Usage:
//   import { showNotificationToast } from "@/components/NotificationToast";
//   showNotificationToast({ title: "Order shipped!", body: "Your package is on its way.", href: "/orders" });
//
// Mount <NotificationToastContainer /> once near the root of your app (e.g. in _app.tsx / layout.tsx).

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface ToastPayload {
  id?: string;
  title: string;
  body?: string;
  icon?: string;          // image URL — falls back to ONETT logo mark
  href?: string;          // clicking the toast navigates here
  duration?: number;      // ms before auto-dismiss, default 5500
  variant?: "default" | "success" | "warning" | "error";
}

interface ToastItem extends Required<Omit<ToastPayload, "icon" | "href">> {
  icon?: string;
  href?: string;
  createdAt: number;
  removing: boolean;
}

// ─── GLOBAL EVENT BUS ─────────────────────────────────────────────────────────
const TOAST_EVENT = "onett:toast";

export function showNotificationToast(payload: ToastPayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, {
      detail: {
        id: payload.id ?? `toast-${Date.now()}-${Math.random()}`,
        title: payload.title,
        body: payload.body ?? "",
        icon: payload.icon,
        href: payload.href,
        duration: payload.duration ?? 5500,
        variant: payload.variant ?? "default",
        createdAt: Date.now(),
        removing: false,
      } satisfies ToastItem,
    })
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const TOAST_CSS = `
  @keyframes ont-toast-in {
    from { opacity: 0; transform: translateX(calc(100% + 24px)); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes ont-toast-out {
    from { opacity: 1; transform: translateX(0) scale(1); max-height: 120px; margin-bottom: 10px; }
    to   { opacity: 0; transform: translateX(calc(100% + 24px)) scale(0.94); max-height: 0; margin-bottom: 0; }
  }
  @keyframes ont-toast-progress {
    from { width: 100%; }
    to   { width: 0%; }
  }
  @keyframes ont-toast-icon-pop {
    0%   { transform: scale(0.6) rotate(-8deg); opacity: 0; }
    60%  { transform: scale(1.15) rotate(3deg); opacity: 1; }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }

  .ont-toast-portal {
    position: fixed;
    top: 0; right: 0;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0;
    padding: 16px 16px 0;
    pointer-events: none;
    max-width: 420px;
    width: 100%;
  }
  @media (min-width: 480px) {
    .ont-toast-portal { padding: 20px 20px 0; }
  }

  .ont-toast-item {
    pointer-events: all;
    width: 100%;
    max-width: 400px;
    background: #FDFAF6;
    border: 1px solid rgba(0,0,0,0.09);
    border-radius: 18px;
    box-shadow:
      0 4px 6px -1px rgba(0,0,0,0.06),
      0 12px 32px -4px rgba(0,0,0,0.12),
      0 0 0 0.5px rgba(0,0,0,0.04);
    overflow: hidden;
    cursor: pointer;
    position: relative;
    margin-bottom: 10px;
    animation: ont-toast-in 0.42s cubic-bezier(0.22,1,0.36,1) both;
    transition: transform 0.18s cubic-bezier(0.22,1,0.36,1),
                box-shadow 0.18s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .ont-toast-item:hover {
    transform: translateY(-2px) scale(1.005);
    box-shadow:
      0 8px 16px -2px rgba(0,0,0,0.1),
      0 20px 40px -4px rgba(0,0,0,0.15),
      0 0 0 0.5px rgba(0,0,0,0.04);
  }
  .ont-toast-item:active {
    transform: translateY(0) scale(0.99);
  }
  .ont-toast-item.removing {
    animation: ont-toast-out 0.35s cubic-bezier(0.4,0,1,1) both;
    pointer-events: none;
  }

  /* variant accent bars */
  .ont-toast-item::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2.5px;
    border-radius: 18px 18px 0 0;
  }
  .ont-toast-item.v-default::before { background: linear-gradient(90deg, #E6640A, #F59E0B); }
  .ont-toast-item.v-success::before { background: linear-gradient(90deg, #22C55E, #16A34A); }
  .ont-toast-item.v-warning::before { background: linear-gradient(90deg, #F59E0B, #D97706); }
  .ont-toast-item.v-error::before   { background: linear-gradient(90deg, #EF4444, #DC2626); }

  .ont-toast-inner {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 14px 12px;
  }

  .ont-toast-icon-wrap {
    flex-shrink: 0;
    width: 42px; height: 42px;
    border-radius: 13px;
    overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    animation: ont-toast-icon-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.1s both;
  }
  .ont-toast-icon-wrap.v-default { background: rgba(230,100,10,0.10); border: 1px solid rgba(230,100,10,0.18); }
  .ont-toast-icon-wrap.v-success { background: rgba(34,197,94,0.10);  border: 1px solid rgba(34,197,94,0.18); }
  .ont-toast-icon-wrap.v-warning { background: rgba(245,158,11,0.10); border: 1px solid rgba(245,158,11,0.18); }
  .ont-toast-icon-wrap.v-error   { background: rgba(239,68,68,0.10);  border: 1px solid rgba(239,68,68,0.18); }

  .ont-toast-icon-wrap img {
    width: 100%; height: 100%; object-fit: cover; border-radius: 12px;
  }
  .ont-toast-icon-fallback {
    font-size: 20px; line-height: 1;
  }

  .ont-toast-content {
    flex: 1; min-width: 0;
    padding-top: 1px;
  }
  .ont-toast-header {
    display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;
    margin-bottom: 3px;
  }
  .ont-toast-title {
    font-family: 'Bricolage Grotesque', 'Plus Jakarta Sans', sans-serif;
    font-size: 13.5px; font-weight: 700;
    color: #1A1A1A; line-height: 1.3;
    letter-spacing: -0.2px;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .ont-toast-close {
    flex-shrink: 0;
    width: 22px; height: 22px; border-radius: 7px;
    background: rgba(0,0,0,0.05);
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: #9A9A9A;
    transition: background 0.15s, color 0.15s;
    margin-top: -1px;
    padding: 0;
  }
  .ont-toast-close:hover { background: rgba(0,0,0,0.1); color: #3A3A3A; }

  .ont-toast-body {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 12px; color: #6A6A6A;
    line-height: 1.55;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .ont-toast-meta {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 14px 10px;
    margin-top: -2px;
  }
  .ont-toast-badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 9px; font-weight: 800;
    letter-spacing: 0.6px; text-transform: uppercase;
    padding: 2px 7px; border-radius: 5px;
  }
  .ont-toast-badge.v-default { background: rgba(230,100,10,0.08); color: #C4520A; border: 1px solid rgba(230,100,10,0.18); }
  .ont-toast-badge.v-success { background: rgba(34,197,94,0.08);  color: #15803D; border: 1px solid rgba(34,197,94,0.18); }
  .ont-toast-badge.v-warning { background: rgba(245,158,11,0.08); color: #B45309; border: 1px solid rgba(245,158,11,0.18); }
  .ont-toast-badge.v-error   { background: rgba(239,68,68,0.08);  color: #B91C1C; border: 1px solid rgba(239,68,68,0.18); }

  .ont-toast-tap-hint {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 10px; color: #BBBBBB; font-weight: 500;
  }

  /* progress bar */
  .ont-toast-progress-track {
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 3px;
    background: rgba(0,0,0,0.04);
  }
  .ont-toast-progress-bar {
    height: 100%;
    border-radius: 0 0 0 0;
  }
  .ont-toast-progress-bar.v-default { background: linear-gradient(90deg, #E6640A, #F59E0B); }
  .ont-toast-progress-bar.v-success { background: #22C55E; }
  .ont-toast-progress-bar.v-warning { background: #F59E0B; }
  .ont-toast-progress-bar.v-error   { background: #EF4444; }
`;

// ─── VARIANT HELPERS ──────────────────────────────────────────────────────────
const VARIANT_LABELS: Record<string, string> = {
  default: "ONETT",
  success: "Success",
  warning: "Heads up",
  error:   "Alert",
};

const VARIANT_FALLBACK_ICONS: Record<string, string> = {
  default: "🔔",
  success: "✅",
  warning: "⚠️",
  error:   "🚨",
};

// ─── SINGLE TOAST ─────────────────────────────────────────────────────────────
function Toast({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => onRemove(toast.id), [onRemove, toast.id]);

  useEffect(() => {
    timerRef.current = setTimeout(dismiss, toast.duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [dismiss, toast.duration]);

  const handleClick = () => {
    if (toast.href) window.location.href = toast.href;
    dismiss();
  };

  const v = toast.variant;

  return (
    <div
      className={`ont-toast-item v-${v}${toast.removing ? " removing" : ""}`}
      onClick={handleClick}
      role="alert"
      aria-live="assertive"
    >
      <div className="ont-toast-inner">
        {/* Icon */}
        <div className={`ont-toast-icon-wrap v-${v}`}>
          {toast.icon
            ? <img src={toast.icon} alt="" />
            : <span className="ont-toast-icon-fallback">{VARIANT_FALLBACK_ICONS[v]}</span>}
        </div>

        {/* Text */}
        <div className="ont-toast-content">
          <div className="ont-toast-header">
            <div className="ont-toast-title">{toast.title}</div>
            <button
              className="ont-toast-close"
              onClick={e => { e.stopPropagation(); dismiss(); }}
              aria-label="Dismiss"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          {toast.body && <div className="ont-toast-body">{toast.body}</div>}
        </div>
      </div>

      {/* Footer meta row */}
      <div className="ont-toast-meta">
        <span className={`ont-toast-badge v-${v}`}>
          <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
          {VARIANT_LABELS[v]}
        </span>
        {toast.href && (
          <span className="ont-toast-tap-hint">Tap to view →</span>
        )}
      </div>

      {/* Auto-dismiss progress bar */}
      <div className="ont-toast-progress-track">
        <div
          className={`ont-toast-progress-bar v-${v}`}
          style={{
            animation: `ont-toast-progress ${toast.duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

// ─── CONTAINER ────────────────────────────────────────────────────────────────
let _cssInjected = false;

export function NotificationToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Inject CSS once
  useEffect(() => {
    if (!_cssInjected) {
      const el = document.createElement("style");
      el.id = "ont-toast-styles";
      el.textContent = TOAST_CSS;
      document.head.appendChild(el);
      _cssInjected = true;
    }
    setMounted(true);
  }, []);

  // Listen for toast events
  useEffect(() => {
    const handler = (e: Event) => {
      const toast = (e as CustomEvent<ToastItem>).detail;
      setToasts(prev => {
        // Cap queue at 5
        const next = [...prev, toast];
        return next.length > 5 ? next.slice(next.length - 5) : next;
      });
    };
    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, []);

  const removeToast = useCallback((id: string) => {
    // Mark as removing first (plays exit animation), then delete
    setToasts(prev =>
      prev.map(t => t.id === id ? { ...t, removing: true } : t)
    );
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 380);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="ont-toast-portal" aria-label="Notifications">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>,
    document.body
  );
}
