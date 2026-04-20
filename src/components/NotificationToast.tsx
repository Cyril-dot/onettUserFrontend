import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useMotionValue, useTransform, animate } from "framer-motion";
import { X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationVariant = "default" | "success" | "warning" | "error";

export interface NotificationToastData {
  id: string;
  title: string;
  body?: string;
  icon?: string;
  variant?: NotificationVariant;
  url?: string;
  durationMs?: number;
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const VARIANT_CONFIG: Record<
  NotificationVariant,
  { accent: string; glow: string; emoji: string; label: string }
> = {
  default: {
    accent: "#F97316",          // ONETT brand orange
    glow:   "rgba(249,115,22,0.18)",
    emoji:  "🔔",
    label:  "Notification",
  },
  success: {
    accent: "#22C55E",
    glow:   "rgba(34,197,94,0.18)",
    emoji:  "✅",
    label:  "Success",
  },
  warning: {
    accent: "#F59E0B",
    glow:   "rgba(245,158,11,0.18)",
    emoji:  "⚠️",
    label:  "Warning",
  },
  error: {
    accent: "#EF4444",
    glow:   "rgba(239,68,68,0.18)",
    emoji:  "❌",
    label:  "Error",
  },
};

const DEFAULT_DURATION = 5000;
const MAX_QUEUE        = 5;

// ─── Singleton event bus ──────────────────────────────────────────────────────

type ToastListener = (toast: NotificationToastData) => void;
const listeners = new Set<ToastListener>();

export function showNotificationToast(toast: Omit<NotificationToastData, "id">) {
  const data: NotificationToastData = {
    ...toast,
    id:         crypto.randomUUID(),
    variant:    toast.variant ?? "default",
    durationMs: toast.durationMs ?? DEFAULT_DURATION,
  };
  listeners.forEach((fn) => fn(data));
}

// ─── Progress bar sub-component ───────────────────────────────────────────────

function ProgressBar({
  durationMs,
  accent,
  paused,
  onExpire,
}: {
  durationMs: number;
  accent: string;
  paused: boolean;
  onExpire: () => void;
}) {
  const progress  = useMotionValue(1);
  const width     = useTransform(progress, [0, 1], ["0%", "100%"]);
  const animRef   = useRef<ReturnType<typeof animate> | null>(null);
  const startedAt = useRef<number>(0);
  const elapsed   = useRef<number>(0);

  const start = useCallback(() => {
    startedAt.current = performance.now();
    const remaining = durationMs - elapsed.current;
    animRef.current = animate(progress, 0, {
      duration:  remaining / 1000,
      ease:      "linear",
      onComplete: onExpire,
    });
  }, [durationMs, onExpire, progress]);

  const pause = useCallback(() => {
    animRef.current?.stop();
    elapsed.current += performance.now() - startedAt.current;
  }, []);

  useEffect(() => {
    start();
    return () => animRef.current?.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (paused) pause();
    else start();
  }, [paused, pause, start]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        background: "rgba(0,0,0,0.06)",
        borderRadius: "0 0 14px 14px",
        overflow: "hidden",
      }}
    >
      <motion.div
        style={{
          height: "100%",
          width,
          background: accent,
          transformOrigin: "left",
          borderRadius: "0 0 14px 0",
        }}
      />
    </div>
  );
}

// ─── Single toast card ────────────────────────────────────────────────────────

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: NotificationToastData;
  onDismiss: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const cfg = VARIANT_CONFIG[toast.variant ?? "default"];

  const handleClick = () => {
    if (toast.url) {
      window.location.href = toast.url;
    }
    onDismiss(toast.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.92 }}
      animate={{ opacity: 1, x: 0,  scale: 1     }}
      exit={{    opacity: 0, x: 80, scale: 0.88, transition: { duration: 0.22 } }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={()   => setHovered(false)}
      style={{
        position:     "relative",
        width:        340,
        borderRadius: 14,
        background:   "#FDFAF6",
        boxShadow:    `0 4px 24px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.05), 0 0 20px ${cfg.glow}`,
        overflow:     "hidden",
        cursor:       toast.url ? "pointer" : "default",
        fontFamily:   "'Plus Jakarta Sans', sans-serif",
      }}
      onClick={handleClick}
    >
      {/* Top accent bar */}
      <div
        style={{
          position:   "absolute",
          top:        0,
          left:       0,
          right:      0,
          height:     3,
          background: cfg.accent,
        }}
      />

      {/* Body */}
      <div style={{ padding: "16px 16px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
        {/* Icon */}
        <div
          style={{
            flexShrink: 0,
            width:      40,
            height:     40,
            borderRadius: 10,
            background: `${cfg.accent}18`,
            border:     `1.5px solid ${cfg.accent}30`,
            display:    "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow:   "hidden",
          }}
        >
          {toast.icon ? (
            <img
              src={toast.icon}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                (e.currentTarget.parentElement as HTMLElement).innerText = cfg.emoji;
              }}
            />
          ) : (
            <span style={{ fontSize: 18 }}>{cfg.emoji}</span>
          )}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin:     0,
              fontSize:   13,
              fontWeight: 700,
              lineHeight: 1.3,
              color:      "#1A1410",
              fontFamily: "'Bricolage Grotesque', sans-serif",
              letterSpacing: "-0.01em",
              whiteSpace:  "nowrap",
              overflow:    "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {toast.title}
          </p>

          {toast.body && (
            <p
              style={{
                margin:     "3px 0 0",
                fontSize:   12,
                color:      "#6B6055",
                lineHeight: 1.45,
                display:    "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow:   "hidden",
              }}
            >
              {toast.body}
            </p>
          )}

          {toast.url && (
            <p
              style={{
                margin:     "6px 0 0",
                fontSize:   11,
                fontWeight: 600,
                color:      cfg.accent,
                letterSpacing: "0.02em",
              }}
            >
              Tap to view →
            </p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(toast.id);
          }}
          aria-label="Dismiss notification"
          style={{
            flexShrink:  0,
            width:       24,
            height:      24,
            borderRadius: 6,
            border:      "none",
            background:  hovered ? "rgba(0,0,0,0.06)" : "transparent",
            cursor:      "pointer",
            display:     "flex",
            alignItems:  "center",
            justifyContent: "center",
            padding:     0,
            color:       "#9E948C",
            transition:  "background 0.15s",
          }}
        >
          <X size={13} strokeWidth={2.5} />
        </button>
      </div>

      {/* Progress bar */}
      <ProgressBar
        durationMs={toast.durationMs ?? DEFAULT_DURATION}
        accent={cfg.accent}
        paused={hovered}
        onExpire={() => onDismiss(toast.id)}
      />
    </motion.div>
  );
}

// ─── Container (mount once in your root layout) ───────────────────────────────

export function NotificationToastContainer() {
  const [toasts, setToasts] = useState<NotificationToastData[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handler: ToastListener = (toast) => {
      setToasts((prev) => {
        const next = [...prev, toast];
        return next.length > MAX_QUEUE ? next.slice(next.length - MAX_QUEUE) : next;
      });
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  if (typeof window === "undefined") return null;

  return createPortal(
    <>
      {/* Google Fonts — load once */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
      `}</style>

      <div
        aria-live="polite"
        aria-label="Notifications"
        style={{
          position:      "fixed",
          top:           16,
          right:         16,
          zIndex:        9999,
          display:       "flex",
          flexDirection: "column",
          gap:           10,
          pointerEvents: "none",
        }}
      >
        <AnimatePresence mode="sync">
          {toasts.map((toast) => (
            <div key={toast.id} style={{ pointerEvents: "auto" }}>
              <ToastCard toast={toast} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </>,
    document.body
  );
}
