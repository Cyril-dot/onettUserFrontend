import { useEffect, useRef } from "react";
import { initFCM, onForegroundMessage } from "@/lib/firebase";
import { notificationApi } from "@/lib/api";

// ── Better iOS detection (more reliable than UA only) ───────────────
function isIOS(): boolean {
  if (typeof window === "undefined") return false;

  const ua = navigator.userAgent || "";

  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

// ── PWA standalone check ───────────────────────────────────────────
function isInStandaloneMode(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

// ── Hook ────────────────────────────────────────────────────────────
export function useFCM(isAuthenticated: boolean) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      initialized.current = false;
      return;
    }

    if (initialized.current) return;

    // Must be browser environment
    if (typeof window === "undefined") return;

    // Service worker + push support check
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("[FCM] Push not supported in this browser");
      return;
    }

    // iOS restriction: only allow PWA mode
    if (isIOS() && !isInStandaloneMode()) {
      console.warn(
        "[FCM] iOS detected but app is not installed as PWA. " +
          "Push notifications disabled until added to Home Screen."
      );
      return;
    }

    let unsubscribeForeground: (() => void) | undefined;

    const setup = async () => {
      try {
        const success = await initFCM(async (token) => {
          try {
            await notificationApi.registerFcmToken(token);
            console.info("[FCM] Token registered successfully");
          } catch (err) {
            console.error("[FCM] Failed to register token:", err);
          }
        });

        if (!success) return;

        initialized.current = true;

        unsubscribeForeground = onForegroundMessage((payload) => {
          console.info("[FCM] Foreground message:", payload);

          // Optional UI refresh hook
          (window as any).__refreshNotifBadge?.();

          const title =
            payload?.notification?.title || "New notification";
          const body =
            payload?.notification?.body || "";

          if ("serviceWorker" in navigator) {
            navigator.serviceWorker.ready.then((reg) => {
              reg.showNotification(title, {
                body,
                icon: "/onet-logo.jpeg",
                badge: "/onet-logo.jpeg",
                data: { url: "/notifications" },
                vibrate: [200, 100, 200],
              });
            });
          }
        });
      } catch (err) {
        console.error("[FCM] Setup error:", err);
      }
    };

    setup();

    return () => {
      unsubscribeForeground?.();
    };
  }, [isAuthenticated]);
}
