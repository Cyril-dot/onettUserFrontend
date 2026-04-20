// useFCM.ts
// FCM hook — shows styled ONETT in-app toasts for foreground messages
// instead of raw OS-level service worker notifications.

import { useEffect, useRef } from "react";
import { initFCM, onForegroundMessage } from "@/lib/firebase";
import { notificationApi } from "@/lib/api";
import { showNotificationToast } from "@/components/NotificationToast";

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

          // Trigger navbar badge refresh if available
          (window as any).__refreshNotifBadge?.();

          const title = payload?.notification?.title || "New notification";
          const body  = payload?.notification?.body  || "";
          const icon  = payload?.notification?.icon  || "/onet-logo.jpeg";

          // ── Determine variant from payload data (optional) ───────────────
          // Your backend can send { data: { variant: "success" | "warning" | "error" } }
          // to control the toast accent colour. Falls back to "default".
          const variant = (payload?.data?.variant as any) ?? "default";

          // ── Destination URL for tap-to-view ───────────────────────────
          // Use a deep-link from payload data if provided, otherwise /notifications
          const href = payload?.data?.url || payload?.data?.href || "/notifications";

          // ── Show the styled in-app toast ─────────────────────────────
          showNotificationToast({
            title,
            body,
            icon,
            href,
            variant,
            // Keep critical alerts visible for 8 s, others for 5.5 s
            duration: variant === "error" ? 8000 : 5500,
          });

          // ── Background / lock-screen notification via SW ──────────────
          // This path still fires so users see a notification if they
          // lock the screen mid-session. The in-app toast handles the
          // foreground UX; the SW handles everything else.
          if ("serviceWorker" in navigator) {
            navigator.serviceWorker.ready.then((reg) => {
              reg.showNotification(title, {
                body,
                icon: "/onet-logo.jpeg",
                badge: "/onet-logo.jpeg",
                data: { url: href },
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
