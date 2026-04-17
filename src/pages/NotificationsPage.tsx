import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, CheckCheck, Package, CreditCard, MessageCircle,
  ShoppingCart, AlertCircle, Star, Clock, ChevronLeft,
  Loader2, ShoppingBag, Truck, XCircle, CheckCircle2,
  RefreshCw, Inbox,
} from "lucide-react";
import { notificationApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { formatDistanceToNow } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const NOTIF_TYPE_META: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  ORDER_CONFIRMED:           { icon: CheckCircle2,  bg: "#FFF7ED", color: "#EA580C" },
  ORDER_CANCELLED:           { icon: XCircle,       bg: "#FEF2F2", color: "#C2410C" },
  ORDER_STATUS_CHANGED:      { icon: RefreshCw,     bg: "#FFF7ED", color: "#F97316" },
  ORDER_UPDATE:              { icon: Package,       bg: "#FFF7ED", color: "#EA580C" },
  PAYMENT_FAILED:            { icon: CreditCard,    bg: "#FEF2F2", color: "#C2410C" },
  NEW_MESSAGE:               { icon: MessageCircle, bg: "#FFF7ED", color: "#F97316" },
  CART_UPDATED:              { icon: ShoppingCart,  bg: "#FFF7ED", color: "#EA580C" },
  PRODUCT_REQUEST_SUBMITTED: { icon: Star,          bg: "#FFF7ED", color: "#F97316" },
  PRODUCT_REQUEST_VIEWED:    { icon: Clock,         bg: "#FFF7ED", color: "#EA580C" },
  PRODUCT_REQUEST_APPROVED:  { icon: CheckCircle2,  bg: "#F0FDF4", color: "#16A34A" },
  PRODUCT_REQUEST_REJECTED:  { icon: AlertCircle,   bg: "#FEF2F2", color: "#C2410C" },
  NEW_PRODUCT_ADDED:         { icon: ShoppingBag,   bg: "#FFF7ED", color: "#EA580C" },
  DELIVERY_UPDATE:           { icon: Truck,         bg: "#FFF7ED", color: "#F97316" },
  DEFAULT:                   { icon: Bell,          bg: "#FFF7ED", color: "#F97316" },
};

function getNotifMeta(type: string) {
  return NOTIF_TYPE_META[type] ?? NOTIF_TYPE_META.DEFAULT;
}

function notifTimeAgo(dateStr: string) {
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true }); }
  catch { return ""; }
}

// ─── Notification Card ────────────────────────────────────────────────────────

function NotifCard({ notif, onRead }: { notif: Notification; onRead: (id: string) => void }) {
  const meta = getNotifMeta(notif.type);
  const Icon = meta.icon;

  return (
    <div
      onClick={() => !notif.isRead && onRead(notif.id)}
      className={`notif-card relative flex gap-3.5 p-4 rounded-2xl cursor-pointer border transition-all duration-200 ${
        notif.isRead
          ? "notif-card--read bg-white border-orange-100 hover:border-orange-200 hover:shadow-sm"
          : "notif-card--unread bg-orange-50 border-orange-200 hover:border-orange-300 hover:shadow-md"
      }`}
    >
      {!notif.isRead && (
        <span className="notif-card__dot absolute top-4 right-4 h-2 w-2 rounded-full bg-orange-500" />
      )}

      <div
        className="notif-card__icon-box h-10 w-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: meta.bg }}
      >
        <Icon style={{ color: meta.color, height: "1.1rem", width: "1.1rem" }} />
      </div>

      <div className="notif-card__body flex-1 min-w-0 pr-4">
        <p className={`notif-card__title text-sm leading-snug mb-0.5 ${notif.isRead ? "font-medium text-gray-700" : "font-semibold text-gray-900"}`}>
          {notif.title}
        </p>
        <p className="notif-card__message text-xs text-gray-500 leading-relaxed line-clamp-2">
          {notif.message}
        </p>
        <p
          className="notif-card__time text-[10px] mt-1.5 font-medium text-orange-500"
          style={{ opacity: notif.isRead ? 0.6 : 1 }}
        >
          {notifTimeAgo(notif.createdAt)}
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const NotificationsPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all");

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const data = await notificationApi.getAll();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[Notifications] fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  useEffect(() => {
    return () => { (window as any).__refreshNotifBadge?.(); };
  }, []);

  const markOneRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try { await notificationApi.markAsRead(id); } catch { /* optimistic */ }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      (window as any).__refreshNotifBadge?.();
    } catch (err) {
      console.error("[Notifications] markAll failed:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const visibleNotifs = activeFilter === "unread"
    ? notifications.filter(n => !n.isRead)
    : notifications;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!isAuthenticated) { navigate("/login"); return null; }

  return (
    <div className="notif-page min-h-screen bg-white">
      <Navbar />

      {/* Sticky header */}
      <div className="notif-page__header sticky top-[57px] z-10 bg-white/95 backdrop-blur-md border-b border-orange-100">
        <div className="notif-page__header-inner max-w-2xl mx-auto px-4 py-3">

          <div className="notif-page__header-row flex items-center justify-between mb-3">
            <div className="notif-page__header-left flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="notif-page__back-btn h-8 w-8 rounded-full flex items-center justify-center bg-orange-50 hover:bg-orange-100 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-orange-600" />
              </button>
              <div>
                <h1 className="notif-page__title text-lg font-bold text-gray-900 leading-none">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <p className="notif-page__unread-count text-xs mt-0.5 text-orange-500 font-medium">
                    {unreadCount} unread
                  </p>
                )}
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={markingAll}
                className="notif-page__mark-all-btn flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors disabled:opacity-60"
              >
                {markingAll
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <CheckCheck className="h-3 w-3" />}
                Mark all read
              </button>
            )}
          </div>

          {/* Filter pills */}
          <div className="notif-page__filters flex gap-2">
            {(["all", "unread"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`notif-page__filter-pill px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeFilter === tab
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-orange-50 text-orange-400 hover:text-orange-600 hover:bg-orange-100"
                }`}
              >
                {tab === "all" ? `All (${notifications.length})` : `Unread (${unreadCount})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="notif-page__body max-w-2xl mx-auto px-4 py-4 pb-24">

        {/* Loading */}
        {loading && (
          <div className="notif-page__loading flex flex-col items-center justify-center py-24 gap-4">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-orange-50 animate-pulse">
              <Bell className="h-6 w-6 text-orange-400" />
            </div>
            <p className="text-sm text-gray-400">Loading notifications…</p>
          </div>
        )}

        {/* Empty */}
        {!loading && visibleNotifs.length === 0 && (
          <div className="notif-page__empty flex flex-col items-center justify-center py-20 gap-5">
            <div className="notif-page__empty-icon h-20 w-20 rounded-3xl flex items-center justify-center bg-orange-50">
              <Inbox className="h-9 w-9 text-orange-300" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-800">
                {activeFilter === "unread" ? "All caught up!" : "No notifications yet"}
              </p>
              <p className="text-sm text-gray-400 mt-1 max-w-xs">
                {activeFilter === "unread"
                  ? "You've read everything — nice work."
                  : "We'll notify you about orders, messages, and updates."}
              </p>
            </div>
            {activeFilter === "unread" && (
              <button
                onClick={() => setActiveFilter("all")}
                className="notif-page__view-all-btn text-xs font-semibold px-4 py-2 rounded-full bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
              >
                View all notifications
              </button>
            )}
          </div>
        )}

        {/* List */}
        {!loading && visibleNotifs.length > 0 && (
          <div className="notif-page__list flex flex-col gap-2">
            {activeFilter === "all" && unreadCount > 0 && (
              <p className="notif-page__section-label text-[10px] font-bold uppercase tracking-widest text-orange-400 px-1 pt-1 pb-0.5">
                New
              </p>
            )}
            {visibleNotifs
              .filter(n => activeFilter === "unread" || !n.isRead)
              .map(notif => (
                <NotifCard key={notif.id} notif={notif} onRead={markOneRead} />
              ))}

            {activeFilter === "all" && notifications.some(n => n.isRead) && (
              <p className="notif-page__section-label text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1 pt-3 pb-0.5">
                Earlier
              </p>
            )}
            {activeFilter === "all" && visibleNotifs
              .filter(n => n.isRead)
              .map(notif => (
                <NotifCard key={notif.id} notif={notif} onRead={markOneRead} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
