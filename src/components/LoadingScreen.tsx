import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface LoadingScreenProps {
  onComplete?: () => void;
  minDuration?: number;
}

export default function LoadingScreen({
  onComplete,
  minDuration = 1200,
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    let rafId: number;

    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min((elapsed / minDuration) * 100, 100);
      setProgress(p);
      if (p < 100) {
        rafId = requestAnimationFrame(tick);
      } else {
        onComplete?.();
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [minDuration, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(135deg, #E6640A 0%, #c45208 50%, #1a0f09 100%)" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
    >
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, #fff, transparent)" }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.14, 0.08] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full"
          style={{ background: "radial-gradient(circle, #fff, transparent)" }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.06, 0.12, 0.06] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        <h1
          className="font-satoshi font-black text-4xl text-white"
          style={{ letterSpacing: "-1px" }}
        >
          ONETT
          <span style={{ color: "rgba(255,255,255,0.6)" }}>.</span>
        </h1>

        <p className="font-inter text-xs text-white/60 tracking-widest uppercase">
          AI-Powered Marketplace
        </p>

        <div className="w-48 mt-2">
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #fff, rgba(255,255,255,0.6))",
                width: `${progress}%`,
                boxShadow: "0 0 8px rgba(255,255,255,0.5)",
              }}
            />
          </div>
          <p className="font-inter text-xs text-white/40 text-center mt-3">
            Loading your experience
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 flex items-center gap-2">
        <span className="font-inter text-[10px] text-white/30 tracking-widest uppercase">
          © 2026 ONETT
        </span>
        <span className="w-1 h-1 rounded-full bg-white/20" />
        <span className="font-inter text-[10px] text-white/30 tracking-widest uppercase">
          Smart Buying · Affordable Access
        </span>
      </div>
    </motion.div>
  );
}
