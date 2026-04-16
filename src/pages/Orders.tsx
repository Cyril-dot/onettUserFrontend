import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { orderApi, preOrderApi, paymentApi, deliveryApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import SkeletonList from "@/components/SkeletonList";
import { toast } from "sonner";
import {
  Package, MapPin, ChevronDown, ChevronUp, X, Clock,
  Truck, ExternalLink, Info, Upload, Phone, User, CheckCircle2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = "all" | "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "pre-orders";

const statusStyle: Record<string, string> = {
  DELIVERED:        "bg-green-100 text-green-700",
  CANCELLED:        "bg-red-100 text-red-700",
  SHIPPED:          "bg-blue-100 text-blue-700",
  CONFIRMED:        "bg-primary/10 text-primary",
  PENDING:          "bg-yellow-100 text-yellow-700",
  AWAITING_PAYMENT: "bg-orange-100 text-orange-700",
  PAYMENT_FAILED:   "bg-red-100 text-red-600",
  DEPOSIT_PAID:     "bg-purple-100 text-purple-700",
};

const preOrderStatusStyle: Record<string, string> = {
  DEPOSIT_PAID:       "bg-purple-100 text-purple-700",
  NOTIFIED:           "bg-blue-100 text-blue-700",
  DELIVERY_REQUESTED: "bg-yellow-100 text-yellow-700",
  COMPLETED:          "bg-green-100 text-green-700",
  CANCELLED:          "bg-red-100 text-red-700",
};

const preOrderStatusLabel: Record<string, string> = {
  DEPOSIT_PAID:       "Deposit paid — waiting for stock",
  NOTIFIED:           "Item available — request delivery",
  DELIVERY_REQUESTED: "Delivery requested — awaiting confirmation",
  COMPLETED:          "Order completed",
  CANCELLED:          "Cancelled",
};

// ── MoMo payment modal (inline, shown inside an order card) ──────────────────
const MoMoPaymentForm = ({
  orderId,
  amount,
  onSuccess,
  onClose,
}: {
  orderId: string;
  amount: number;
  onSuccess: () => void;
  onClose: () => void;
}) => {
  const [senderName, setSenderName]   = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [screenshot, setScreenshot]   = useState<File | null>(null);
  const [preview, setPreview]         = useState<string | null>(null);
  const [submitting, setSubmitting]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10 MB"); return; }
    setScreenshot(file);
    setPreview(URL.createObjectURL(file));
  };

  const clearFile = () => {
    setScreenshot(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!senderName.trim())  { toast.error("Enter your account name"); return; }
    if (!senderPhone.trim()) { toast.error("Enter your phone number"); return; }
    if (!screenshot)         { toast.error("Upload your payment screenshot"); return; }

    setSubmitting(true);
    try {
      await paymentApi.submitOrderPayment(orderId, senderName.trim(), senderPhone.trim(), screenshot);
      toast.success("Payment submitted! We'll confirm it shortly.");
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message ?? "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-t border-border bg-orange-50/50 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Pay via Mobile Money</p>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Amount + merchant number */}
      <div className="rounded-lg bg-orange-100 border border-orange-200 px-4 py-3 space-y-1">
        <p className="text-xs text-orange-700 font-medium">Send exactly</p>
        <p className="text-2xl font-bold text-orange-800">GHS {amount.toFixed(2)}</p>
        <p className="text-xs text-orange-700">to MoMo number: <span className="font-mono font-semibold">055 XXX XXXX</span></p>
      </div>

      {/* Sender name */}
      <div className="space-y-1">
        <label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
          <User className="h-3 w-3" /> Account name *
        </label>
        <input
          type="text"
          value={senderName}
          onChange={e => setSenderName(e.target.value)}
          placeholder="Name on your MoMo account"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Sender phone */}
      <div className="space-y-1">
        <label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
          <Phone className="h-3 w-3" /> Phone number *
        </label>
        <input
          type="tel"
          value={senderPhone}
          onChange={e => setSenderPhone(e.target.value)}
          placeholder="e.g. 024 000 0000"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Screenshot upload */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Payment screenshot *</label>
        {preview ? (
          <div className="relative rounded-xl overflow-hidden border border-border">
            <img src={preview} alt="Screenshot preview" className="w-full max-h-48 object-contain bg-secondary/30" />
            <button
              onClick={clearFile}
              className="absolute top-2 right-2 rounded-full bg-background/90 border border-border p-1 hover:bg-destructive hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="absolute bottom-2 left-2 rounded-full bg-green-600 text-white text-[10px] font-semibold px-2 py-0.5 flex items-center gap-1">
              <CheckCircle2 className="h-2.5 w-2.5" /> Ready
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors py-7 flex flex-col items-center gap-1.5 text-muted-foreground hover:text-primary"
          >
            <Upload className="h-6 w-6" />
            <span className="text-xs font-medium">Tap to upload screenshot</span>
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-orange-700 transition-colors disabled:opacity-60"
      >
        {submitting ? "Submitting…" : `Submit payment · GHS ${amount.toFixed(2)}`}
      </button>
    </div>
  );
};

// ── Pre-order card ────────────────────────────────────────────────────────────
const PreOrderCard = ({
  record,
  onRequestDelivery,
}: {
  record: any;
  onRequestDelivery: (id: string) => void;
}) => {
  const [requesting, setRequesting] = useState(false);

  const canRequest      = record.status === "NOTIFIED";
  const totalAmount     = Number(record.totalAmount     ?? 0);
  const depositAmount   = Number(record.depositAmount   ?? 0);
  const remainingAmount = Number(record.remainingAmount ?? 0);
  const depositPct      = totalAmount > 0 ? Math.round((depositAmount / totalAmount) * 100) : 50;

  const handleRequest = async () => {
    if (!window.confirm(
      `Confirm delivery request?\n\nYou will need to pay the remaining balance of GHS ${remainingAmount.toFixed(2)} to complete this order.`
    )) return;
    setRequesting(true);
    try { await onRequestDelivery(record.id); }
    finally { setRequesting(false); }
  };

  return (
    <div className="rounded-xl bg-card border border-purple-200 overflow-hidden">
      <div className="bg-purple-50 px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-purple-700">Pre-order</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${preOrderStatusStyle[record.status] ?? "bg-muted text-muted-foreground"}`}>
          {record.status?.replace(/_/g, " ")}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <p className="text-sm font-semibold">{record.productName}</p>
          <p className="text-xs text-muted-foreground font-mono">
            Order #{(record.orderId ?? "").toString().slice(0, 8).toUpperCase()}
          </p>
          {record.createdAt && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Placed {new Date(record.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          )}
        </div>

        <div className="rounded-lg bg-purple-50 border border-purple-100 p-3 space-y-2 text-sm">
          <p className="text-[11px] font-semibold text-purple-800 uppercase tracking-wide">Payment breakdown</p>
          <div className="flex justify-between text-purple-700">
            <span>Order total</span>
            <span className="font-semibold text-purple-900">GHS {totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-purple-700">
            <span>Deposit paid ({depositPct}%)</span>
            <span className="font-semibold text-green-700">− GHS {depositAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-purple-200 pt-2">
            <span className="font-semibold text-purple-800">Remaining balance</span>
            <span className="font-bold text-purple-900">GHS {remainingAmount.toFixed(2)}</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{depositPct}% paid</span>
            <span>{100 - depositPct}% remaining</span>
          </div>
          <div className="w-full bg-purple-100 rounded-full h-2">
            <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${depositPct}%` }} />
          </div>
        </div>

        {record.status === "DEPOSIT_PAID" && (
          <div className="rounded-lg bg-purple-50 border border-purple-200 px-3 py-2 text-xs text-purple-700 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {preOrderStatusLabel.DEPOSIT_PAID}
          </div>
        )}
        {record.status === "NOTIFIED" && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 space-y-1">
            <p className="text-xs text-blue-700 font-semibold flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 shrink-0" />
              Your item is now in stock!
            </p>
            <p className="text-xs text-blue-600">
              Request delivery below to pay the remaining <strong>GHS {remainingAmount.toFixed(2)}</strong> and arrange shipping.
            </p>
          </div>
        )}
        {record.status === "DELIVERY_REQUESTED" && (
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2 text-xs text-yellow-700 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {preOrderStatusLabel.DELIVERY_REQUESTED}
          </div>
        )}
        {record.status === "COMPLETED" && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
            ✓ {preOrderStatusLabel.COMPLETED} — your item is on its way.
          </div>
        )}

        {record.notifiedAt && (
          <p className="text-xs text-muted-foreground">
            Notified: {new Date(record.notifiedAt).toLocaleDateString("en-GB")}
          </p>
        )}
        {record.deliveryRequestedAt && (
          <p className="text-xs text-muted-foreground">
            Delivery requested: {new Date(record.deliveryRequestedAt).toLocaleDateString("en-GB")}
          </p>
        )}
        {record.adminNote && (
          <p className="text-xs text-muted-foreground italic">Note from seller: {record.adminNote}</p>
        )}

        {canRequest && (
          <button
            onClick={handleRequest}
            disabled={requesting}
            className="w-full py-2.5 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Truck className="h-4 w-4" />
            {requesting ? "Requesting…" : `Request delivery · pay GHS ${remainingAmount.toFixed(2)}`}
          </button>
        )}
      </div>
    </div>
  );
};

// ── Order card ────────────────────────────────────────────────────────────────
const OrderCard = ({
  order,
  onCancel,
  onRefresh,
}: {
  order: any;
  onCancel: (id: string) => void;
  onRefresh: () => void;
}) => {
  const [expanded, setExpanded]               = useState(false);
  const [cancelling, setCancelling]           = useState(false);
  const [showMoMo, setShowMoMo]               = useState(false);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [showDeliveryInput, setShowDeliveryInput] = useState(false);

  const orderId         = order.orderId;
  const status          = order.orderStatus ?? "PENDING";
  const total           = Number(order.total ?? 0);
  const address         = order.deliveryAddress ?? "";
  const createdAt       = order.createdAt ?? "";
  const items: any[]    = order.orderItems ?? [];
  const canCancel: boolean = order.canCancel ?? false;

  const needsPayment       = status === "AWAITING_PAYMENT" || status === "PAYMENT_FAILED";
  const canRequestDelivery = status === "SHIPPED";

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  const handleCancel = async () => {
    if (!window.confirm("Cancel this order?")) return;
    setCancelling(true);
    try { await onCancel(orderId); }
    finally { setCancelling(false); }
  };

  const handleRequestDelivery = async () => {
    if (!deliveryAddress.trim()) return;
    setDeliveryLoading(true);
    try {
      await deliveryApi.request(orderId, deliveryAddress.trim());
      setShowDeliveryInput(false);
      setDeliveryAddress("");
      onRefresh();
      toast.success("Delivery requested successfully!");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not request delivery.");
    } finally {
      setDeliveryLoading(false);
    }
  };

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <div className="p-4 space-y-3">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-mono">
              #{orderId?.toString().slice(0, 8).toUpperCase()}
            </p>
            {formattedDate && (
              <p className="text-xs text-muted-foreground mt-0.5">{formattedDate}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 border border-red-200 rounded-full px-2 py-0.5"
              >
                <X className="h-3 w-3" />
                {cancelling ? "…" : "Cancel"}
              </button>
            )}
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[status] ?? "bg-muted text-muted-foreground"}`}>
              {status.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        {/* Address */}
        {address && (
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>{address}</span>
          </div>
        )}

        {/* Item thumbnails */}
        {items.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {items.slice(0, 3).map((item: any, i: number) => (
                <div
                  key={item.id ?? i}
                  className="h-10 w-10 rounded-lg border-2 border-background overflow-hidden bg-secondary/50 shrink-0"
                  style={{ zIndex: 3 - i }}
                >
                  {item.primaryImageUrl ? (
                    <img src={item.primaryImageUrl} alt={item.productName ?? ""} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Package className="h-4 w-4 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Total + expand */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-base">GHS {total.toFixed(2)}</span>
          {items.length > 0 && (
            <button
              onClick={() => setExpanded(p => !p)}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {expanded ? "Hide" : "View"} items
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>

        {/* Payment submission status message */}
        {status === "AWAITING_PAYMENT" && !showMoMo && (
          <div className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-2 text-xs text-orange-700 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            Waiting for payment — send via MoMo and upload your screenshot below.
          </div>
        )}
        {status === "PAYMENT_FAILED" && !showMoMo && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 flex items-center gap-1.5">
            <X className="h-3.5 w-3.5 shrink-0" />
            Payment was rejected. Please try again or contact support.
          </div>
        )}

        {/* Pay now CTA */}
        {needsPayment && !showMoMo && (
          <button
            onClick={() => setShowMoMo(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-orange-700 transition-colors"
          >
            <Phone className="h-4 w-4" />
            Pay via MoMo · GHS {total.toFixed(2)}
          </button>
        )}

        {/* Request delivery */}
        {canRequestDelivery && !showDeliveryInput && (
          <button
            onClick={() => setShowDeliveryInput(true)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-blue-300 text-blue-600 text-sm font-semibold hover:bg-blue-50 transition-colors"
          >
            <Truck className="h-4 w-4" />
            Request delivery
          </button>
        )}
        {showDeliveryInput && (
          <div className="space-y-2">
            <input
              type="text"
              value={deliveryAddress}
              onChange={e => setDeliveryAddress(e.target.value)}
              placeholder="Enter delivery address…"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex gap-2">
              <button
                onClick={handleRequestDelivery}
                disabled={deliveryLoading || !deliveryAddress.trim()}
                className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {deliveryLoading ? "Requesting…" : "Confirm"}
              </button>
              <button
                onClick={() => { setShowDeliveryInput(false); setDeliveryAddress(""); }}
                className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MoMo payment form (inline, below card body) */}
      {showMoMo && (
        <MoMoPaymentForm
          orderId={orderId}
          amount={total}
          onSuccess={() => {
            setShowMoMo(false);
            // optimistically update status label while we wait for refresh
            toast.success("Payment submitted! Awaiting admin confirmation.");
          }}
          onClose={() => setShowMoMo(false)}
        />
      )}

      {/* Expanded items list */}
      {expanded && items.length > 0 && (
        <div className="border-t border-border divide-y divide-border">
          {items.map((item: any) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              <div className="h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-secondary/50 border border-border">
                {item.primaryImageUrl ? (
                  <img src={item.primaryImageUrl} alt={item.productName} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Package className="h-5 w-5 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                {item.productId ? (
                  <Link
                    to={`/products/${item.productId}`}
                    className="text-sm font-medium hover:text-primary line-clamp-1 flex items-center gap-1"
                  >
                    {item.productName}
                    <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                  </Link>
                ) : (
                  <p className="text-sm font-medium line-clamp-1">{item.productName}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  GHS {Number(item.unitPrice).toFixed(2)} × {item.quantity}
                </p>
              </div>
              <p className="text-sm font-bold shrink-0">GHS {Number(item.subTotal).toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const countByStatus = (orders: any[], status: string) =>
  orders.filter(o => o.orderStatus === status).length;

const TABS: { label: string; value: Tab }[] = [
  { label: "All",        value: "all"        },
  { label: "Pending",    value: "PENDING"    },
  { label: "Confirmed",  value: "CONFIRMED"  },
  { label: "Shipped",    value: "SHIPPED"    },
  { label: "Delivered",  value: "DELIVERED"  },
  { label: "Cancelled",  value: "CANCELLED"  },
  { label: "Pre-orders", value: "pre-orders" },
];

// ── Main Orders page ──────────────────────────────────────────────────────────
const Orders = () => {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders]       = useState<any[]>([]);
  const [preOrders, setPreOrders] = useState<any[]>([]);
  const [tab, setTab]             = useState<Tab>("all");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const load = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const [orderList, preOrderList] = await Promise.all([
        orderApi.getMy(),
        preOrderApi.getMy(),
      ]);
      setOrders(Array.isArray(orderList) ? orderList : []);
      setPreOrders(Array.isArray(preOrderList) ? preOrderList : []);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [isAuthenticated]);

  const handleCancel = async (orderId: string) => {
    try {
      await orderApi.cancelMy(orderId);
      toast.success("Order cancelled.");
      load();
    } catch (err: any) {
      toast.error(err?.message ?? "Could not cancel order.");
    }
  };

  const handleRequestDelivery = async (preOrderRecordId: string) => {
    try {
      await preOrderApi.requestDelivery(preOrderRecordId);
      toast.success("Delivery requested! The seller will confirm shortly.");
      load();
    } catch (err: any) {
      toast.error(err?.message ?? "Could not request delivery. Please try again.");
    }
  };

  const visibleOrders =
    tab === "all" || tab === "pre-orders"
      ? orders
      : orders.filter(o => o.orderStatus === tab);

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="skeleton-shimmer h-8 w-36 rounded-lg mb-4" />
        <div className="flex gap-2 mb-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton-shimmer h-8 w-20 rounded-full" />)}
        </div>
        <SkeletonList count={6} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <h1 className="font-satoshi text-2xl font-bold mb-4">My Orders</h1>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={load} className="text-xs font-semibold underline underline-offset-2 ml-4">Retry</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-4 no-scrollbar">
          {TABS.map(t => {
            const count =
              t.value === "pre-orders"
                ? preOrders.length
                : t.value !== "all"
                ? countByStatus(orders, t.value)
                : 0;

            return (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  tab === t.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
                {count > 0 && (
                  <span className={`ml-1 text-[10px] rounded-full px-1.5 ${
                    t.value === "pre-orders"
                      ? "bg-purple-600 text-white"
                      : "bg-muted-foreground/20 text-muted-foreground"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Pre-orders tab */}
        {tab === "pre-orders" ? (
          preOrders.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">No pre-orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {preOrders.map(r => (
                <PreOrderCard key={r.id} record={r} onRequestDelivery={handleRequestDelivery} />
              ))}
            </div>
          )
        ) : visibleOrders.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <Package className="h-16 w-16 mx-auto text-muted-foreground/30" />
            <p className="text-muted-foreground">
              {tab === "all" ? "No orders yet" : `No ${tab.toLowerCase()} orders`}
            </p>
            {tab === "all" && (
              <Link to="/" className="text-sm text-primary hover:underline">Start Shopping</Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleOrders.map(o => (
              <OrderCard key={o.orderId} order={o} onCancel={handleCancel} onRefresh={load} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
